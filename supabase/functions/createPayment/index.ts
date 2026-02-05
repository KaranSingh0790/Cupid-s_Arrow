// Cupid's Arrow - Create Payment Edge Function
// Creates a Razorpay order and stores payment intent

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface CreatePaymentRequest {
    experience_id: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get environment variables
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID")!;
        const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse request body
        const body: CreatePaymentRequest = await req.json();

        if (!body.experience_id) {
            return new Response(
                JSON.stringify({ error: "experience_id is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Fetch experience to get amount
        const { data: experience, error: fetchError } = await supabase
            .from("experiences")
            .select("id, experience_type, amount_paise, lifecycle_state, recipient_name, recipient_email")
            .eq("id", body.experience_id)
            .single();

        if (fetchError || !experience) {
            return new Response(
                JSON.stringify({ error: "Experience not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check if experience is in valid state for payment
        if (experience.lifecycle_state === "PAID" || experience.lifecycle_state === "SENT") {
            return new Response(
                JSON.stringify({ error: "Experience has already been paid for" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check for existing pending payment
        const { data: existingPayment } = await supabase
            .from("payments")
            .select("razorpay_order_id")
            .eq("experience_id", experience.id)
            .eq("status", "PENDING")
            .single();

        // If there's an existing pending order, return it
        if (existingPayment?.razorpay_order_id) {
            return new Response(
                JSON.stringify({
                    success: true,
                    order: {
                        id: existingPayment.razorpay_order_id,
                        amount: experience.amount_paise,
                        currency: "INR",
                    },
                    key_id: razorpayKeyId,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create Razorpay order
        const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

        const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${razorpayAuth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: experience.amount_paise,
                currency: "INR",
                receipt: `exp_${experience.id.substring(0, 8)}`,
                notes: {
                    experience_id: experience.id,
                    experience_type: experience.experience_type,
                    recipient_email: experience.recipient_email,
                },
            }),
        });

        if (!razorpayResponse.ok) {
            const errorText = await razorpayResponse.text();
            console.error("Razorpay error:", errorText);
            return new Response(
                JSON.stringify({ error: "Failed to create payment order" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const razorpayOrder = await razorpayResponse.json();

        // Store payment record
        const { error: insertError } = await supabase.from("payments").insert({
            experience_id: experience.id,
            razorpay_order_id: razorpayOrder.id,
            amount_paise: experience.amount_paise,
            currency: "INR",
            status: "PENDING",
        });

        if (insertError) {
            console.error("Payment insert error:", insertError);
            return new Response(
                JSON.stringify({ error: "Failed to store payment record" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Update experience to PREVIEW state
        await supabase
            .from("experiences")
            .update({ lifecycle_state: "PREVIEW" })
            .eq("id", experience.id);

        // Log analytics event
        await supabase.from("analytics_events").insert({
            experience_id: experience.id,
            event_type: "PAYMENT_INITIATED",
            metadata: { order_id: razorpayOrder.id },
        });

        // Return order details for frontend
        return new Response(
            JSON.stringify({
                success: true,
                order: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                },
                key_id: razorpayKeyId,
                prefill: {
                    name: experience.recipient_name,
                    email: experience.recipient_email,
                },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Unexpected error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
