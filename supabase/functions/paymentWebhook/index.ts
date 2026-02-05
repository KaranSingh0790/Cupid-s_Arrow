// Cupid's Arrow - Payment Webhook Edge Function
// Verifies Razorpay signature and triggers email sending

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const razorpayWebhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get raw body for signature verification
        const rawBody = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            console.error("Missing Razorpay signature");
            return new Response(
                JSON.stringify({ error: "Missing signature" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Verify webhook signature using HMAC SHA256
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(razorpayWebhookSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signatureBuffer = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(rawBody)
        );

        const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        if (signature !== expectedSignature) {
            console.error("Invalid Razorpay signature");
            return new Response(
                JSON.stringify({ error: "Invalid signature" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse webhook payload
        const payload = JSON.parse(rawBody);
        const event = payload.event;

        console.log("Received webhook event:", event);

        // Handle payment captured event
        if (event === "payment.captured") {
            const paymentEntity = payload.payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;

            // Find the payment record
            const { data: payment, error: paymentError } = await supabase
                .from("payments")
                .select("id, experience_id, status")
                .eq("razorpay_order_id", orderId)
                .single();

            if (paymentError || !payment) {
                console.error("Payment not found for order:", orderId);
                return new Response(
                    JSON.stringify({ error: "Payment not found" }),
                    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Skip if already processed
            if (payment.status === "COMPLETED") {
                console.log("Payment already processed, skipping");
                return new Response(
                    JSON.stringify({ success: true, message: "Already processed" }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Update payment record
            const { error: updatePaymentError } = await supabase
                .from("payments")
                .update({
                    razorpay_payment_id: paymentId,
                    razorpay_signature: signature,
                    status: "COMPLETED",
                    verified_at: new Date().toISOString(),
                })
                .eq("id", payment.id);

            if (updatePaymentError) {
                console.error("Failed to update payment:", updatePaymentError);
                return new Response(
                    JSON.stringify({ error: "Failed to update payment" }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Update experience to PAID state
            const { error: updateExpError } = await supabase
                .from("experiences")
                .update({
                    lifecycle_state: "PAID",
                    paid_at: new Date().toISOString(),
                })
                .eq("id", payment.experience_id);

            if (updateExpError) {
                console.error("Failed to update experience:", updateExpError);
            }

            // Log analytics event
            await supabase.from("analytics_events").insert({
                experience_id: payment.experience_id,
                event_type: "PAYMENT_COMPLETED",
                metadata: { payment_id: paymentId, order_id: orderId },
            });

            // Trigger email sending by invoking the sendEmail function
            try {
                const sendEmailResponse = await fetch(
                    `${supabaseUrl}/functions/v1/sendEmail`,
                    {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${supabaseServiceKey}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ experience_id: payment.experience_id }),
                    }
                );

                if (!sendEmailResponse.ok) {
                    console.error("Failed to trigger email:", await sendEmailResponse.text());
                } else {
                    console.log("Email triggered successfully");
                }
            } catch (emailError) {
                console.error("Error triggering email:", emailError);
                // Don't fail the webhook - email can be retried
            }

            return new Response(
                JSON.stringify({ success: true, message: "Payment processed" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Handle payment failed event
        if (event === "payment.failed") {
            const paymentEntity = payload.payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const errorCode = paymentEntity.error_code;
            const errorDescription = paymentEntity.error_description;

            // Update payment record
            await supabase
                .from("payments")
                .update({
                    status: "FAILED",
                    error_code: errorCode,
                    error_description: errorDescription,
                })
                .eq("razorpay_order_id", orderId);

            console.log("Payment failed:", errorDescription);

            return new Response(
                JSON.stringify({ success: true, message: "Failure recorded" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Acknowledge other events
        return new Response(
            JSON.stringify({ success: true, message: "Event acknowledged" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Webhook error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
