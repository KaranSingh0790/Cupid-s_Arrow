// Cupid's Arrow - Stripe Webhook Edge Function
// Handles Stripe webhook events using direct API calls (no SDK)
// NOTE: Uses crypto for signature verification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Verify Stripe webhook signature
async function verifyStripeSignature(
    payload: string,
    signature: string,
    secret: string
): Promise<boolean> {
    try {
        const parts = signature.split(",");
        const timestamp = parts.find(p => p.startsWith("t="))?.split("=")[1];
        const v1Signature = parts.find(p => p.startsWith("v1="))?.split("=")[1];

        if (!timestamp || !v1Signature) {
            return false;
        }

        // Check timestamp (allow 5 minute tolerance)
        const currentTime = Math.floor(Date.now() / 1000);
        if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
            console.error("Webhook timestamp too old");
            return false;
        }

        // Create the signed payload
        const signedPayload = `${timestamp}.${payload}`;

        // Compute expected signature using HMAC-SHA256
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signatureBuffer = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(signedPayload)
        );

        const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

        return expectedSignature === v1Signature;
    } catch (error) {
        console.error("Signature verification error:", error);
        return false;
    }
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get raw body for signature verification
        const rawBody = await req.text();
        const signature = req.headers.get("stripe-signature");

        if (!signature) {
            console.error("Missing Stripe signature");
            return new Response(
                JSON.stringify({ error: "Missing signature" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Verify webhook signature
        const isValid = await verifyStripeSignature(rawBody, signature, stripeWebhookSecret);
        if (!isValid) {
            console.error("Invalid Stripe signature");
            return new Response(
                JSON.stringify({ error: "Invalid signature" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse the event
        const event = JSON.parse(rawBody);
        console.log("Received Stripe webhook event:", event.type);

        // Handle checkout.session.completed event
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const sessionId = session.id;
            const paymentIntentId = session.payment_intent;
            const customerId = session.customer;

            // Get experience_id from metadata
            const experienceId = session.metadata?.experience_id;

            if (!experienceId) {
                console.error("No experience_id in session metadata");
                return new Response(
                    JSON.stringify({ error: "Missing experience_id" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Find the payment record by session ID
            const { data: payment, error: paymentError } = await supabase
                .from("payments")
                .select("id, experience_id, status")
                .eq("stripe_session_id", sessionId)
                .single();

            if (paymentError || !payment) {
                console.error("Payment not found for session:", sessionId);
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
                    stripe_payment_intent_id: paymentIntentId,
                    stripe_customer_id: customerId,
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
                event_type: "STRIPE_PAYMENT_COMPLETED",
                metadata: {
                    session_id: sessionId,
                    payment_intent_id: paymentIntentId
                },
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
            }

            return new Response(
                JSON.stringify({ success: true, message: "Payment processed" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Handle checkout.session.expired event
        if (event.type === "checkout.session.expired") {
            const session = event.data.object;
            const sessionId = session.id;

            await supabase
                .from("payments")
                .update({
                    status: "FAILED",
                    error_code: "session_expired",
                    error_description: "Checkout session expired",
                })
                .eq("stripe_session_id", sessionId);

            console.log("Checkout session expired:", sessionId);

            return new Response(
                JSON.stringify({ success: true, message: "Session expiry recorded" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Handle charge.refunded event
        if (event.type === "charge.refunded") {
            const charge = event.data.object;
            const paymentIntentId = charge.payment_intent;

            const { error } = await supabase
                .from("payments")
                .update({ status: "REFUNDED" })
                .eq("stripe_payment_intent_id", paymentIntentId);

            if (!error) {
                console.log("Refund recorded for payment intent:", paymentIntentId);
            }

            return new Response(
                JSON.stringify({ success: true, message: "Refund recorded" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Acknowledge other events
        return new Response(
            JSON.stringify({ success: true, message: "Event acknowledged" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: unknown) {
        console.error("Webhook error:", error);
        const message = error instanceof Error ? error.message : "Internal server error";
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
