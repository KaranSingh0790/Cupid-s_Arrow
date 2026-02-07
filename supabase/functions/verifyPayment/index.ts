// Cupid's Arrow - Verify Payment Edge Function
// Verifies Razorpay payment signature and updates experience/payment status

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentRequest {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    experience_id: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse request body
        const body: VerifyPaymentRequest = await req.json();

        if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature || !body.experience_id) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Verify the payment signature
        // Razorpay signature = HMAC_SHA256(order_id + "|" + payment_id, secret)
        const signaturePayload = body.razorpay_order_id + "|" + body.razorpay_payment_id;

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(razorpayKeySecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signatureBuffer = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(signaturePayload)
        );

        const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        if (body.razorpay_signature !== expectedSignature) {
            console.error("Invalid payment signature");
            return new Response(
                JSON.stringify({ error: "Invalid payment signature" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("Payment signature verified successfully");

        // Find and update the payment record
        const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .select("id, status")
            .eq("razorpay_order_id", body.razorpay_order_id)
            .single();

        if (paymentError) {
            console.error("Payment record not found:", paymentError);
            return new Response(
                JSON.stringify({ error: "Payment record not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Skip if already processed
        if (payment.status === "COMPLETED") {
            console.log("Payment already processed");
            return new Response(
                JSON.stringify({ success: true, message: "Already processed" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Update payment record
        const { error: updatePaymentError } = await supabase
            .from("payments")
            .update({
                razorpay_payment_id: body.razorpay_payment_id,
                razorpay_signature: body.razorpay_signature,
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
            .eq("id", body.experience_id);

        if (updateExpError) {
            console.error("Failed to update experience:", updateExpError);
            // Don't fail - payment is verified
        }

        // Log analytics event
        await supabase.from("analytics_events").insert({
            experience_id: body.experience_id,
            event_type: "PAYMENT_VERIFIED",
            metadata: {
                payment_id: body.razorpay_payment_id,
                order_id: body.razorpay_order_id
            },
        });

        return new Response(
            JSON.stringify({ success: true, message: "Payment verified and processed" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Verify payment error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
