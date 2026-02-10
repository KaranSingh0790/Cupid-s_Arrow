// Cupid's Arrow - Create Stripe Payment Edge Function
// Creates a Stripe Checkout Session using direct API calls (no SDK)
// DEBUG VERSION WITH EXTENSIVE LOGGING

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface CreateStripePaymentRequest {
    experience_id: string;
    currency?: string;
    return_url?: string;
}

// Price mapping in cents for different currencies
const PRICE_MAP: Record<string, { crush: number; couple: number }> = {
    usd: { crush: 199, couple: 299 },
    eur: { crush: 199, couple: 299 },
    gbp: { crush: 159, couple: 249 },
    inr: { crush: 14900, couple: 24900 }, // ₹149, ₹249 (Stripe uses smallest unit = paise)
};

serve(async (req: Request) => {
    console.log("=== createStripePayment INVOKED ===");
    console.log("Method:", req.method);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        console.log("Handling CORS preflight");
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get environment variables
        console.log("Getting environment variables...");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        const appUrlEnv = Deno.env.get("APP_URL") || "http://localhost:5173";

        console.log("SUPABASE_URL exists:", !!supabaseUrl);
        console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!supabaseServiceKey);
        console.log("STRIPE_SECRET_KEY exists:", !!stripeSecretKey);
        console.log("APP_URL:", appUrlEnv);

        if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
            console.error("Missing required environment variables!");
            return new Response(
                JSON.stringify({ error: "Server configuration error - missing env vars" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create Supabase client with service role (bypasses RLS)
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Parse request body
        console.log("Parsing request body...");
        const rawBody = await req.text();
        console.log("Raw body:", rawBody);

        let body: CreateStripePaymentRequest;
        try {
            body = JSON.parse(rawBody);
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return new Response(
                JSON.stringify({ error: "Invalid JSON in request body" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("Parsed body:", JSON.stringify(body));

        if (!body.experience_id) {
            console.error("Missing experience_id");
            return new Response(
                JSON.stringify({ error: "experience_id is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const currency = (body.currency || "usd").toLowerCase();
        console.log("Currency:", currency);

        // Validate currency
        if (!PRICE_MAP[currency]) {
            console.error("Invalid currency:", currency);
            return new Response(
                JSON.stringify({ error: "Unsupported currency. Use: usd, eur, gbp" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // DEBUG: Test query to check DB connection
        console.log("Testing database connection...");
        const { data: testData, error: testError } = await supabase
            .from("experiences")
            .select("id")
            .limit(1);
        console.log("Test query result:", JSON.stringify({ testData, testError }));

        // Fetch experience to get details
        console.log("Fetching experience:", body.experience_id);
        const { data: experience, error: fetchError } = await supabase
            .from("experiences")
            .select("id, experience_type, amount_paise, lifecycle_state, recipient_name, recipient_email")
            .eq("id", body.experience_id)
            .maybeSingle();

        console.log("Experience fetch result:", JSON.stringify({ experience, fetchError }));

        if (fetchError) {
            console.error("Database error:", fetchError);
            return new Response(
                JSON.stringify({ error: "Database error", details: fetchError.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!experience) {
            console.error("Experience not found for ID:", body.experience_id);
            return new Response(
                JSON.stringify({ error: "Experience not found", experience_id: body.experience_id }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check if experience is in valid state for payment
        console.log("Experience lifecycle_state:", experience.lifecycle_state);
        if (experience.lifecycle_state === "PAID" || experience.lifecycle_state === "SENT") {
            console.error("Experience already paid");
            return new Response(
                JSON.stringify({ error: "Experience has already been paid for" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get price based on experience type and currency
        const prices = PRICE_MAP[currency];
        const amountCents = experience.experience_type === "CRUSH" ? prices.crush : prices.couple;
        const productName = experience.experience_type === "CRUSH"
            ? "Cupid's Arrow - Crush Mode"
            : "Cupid's Arrow - Couple Mode";

        console.log("Amount cents:", amountCents);
        console.log("Product name:", productName);

        // Create Stripe Checkout Session using direct API call
        console.log("Creating Stripe Checkout Session...");

        // Use return_url from frontend if provided, else fall back to APP_URL env var
        const appUrl = body.return_url || appUrlEnv;
        console.log("Using return URL:", appUrl);

        const stripeBody = new URLSearchParams({
            "mode": "payment",
            "success_url": `${appUrl}/create/payment/success?session_id={CHECKOUT_SESSION_ID}&experience_id=${experience.id}`,
            "cancel_url": `${appUrl}/create/payment/cancel?experience_id=${experience.id}`,
            "customer_email": experience.recipient_email,
            "line_items[0][price_data][currency]": currency,
            "line_items[0][price_data][product_data][name]": productName,
            "line_items[0][price_data][product_data][description]": `Personalized romantic experience for ${experience.recipient_name}`,
            "line_items[0][price_data][unit_amount]": amountCents.toString(),
            "line_items[0][quantity]": "1",
            "metadata[experience_id]": experience.id,
            "metadata[experience_type]": experience.experience_type,
            "metadata[recipient_email]": experience.recipient_email,
        });

        console.log("Stripe request body:", stripeBody.toString());

        const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${stripeSecretKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: stripeBody,
        });

        console.log("Stripe response status:", stripeResponse.status);
        const stripeResponseText = await stripeResponse.text();
        console.log("Stripe response body:", stripeResponseText);

        if (!stripeResponse.ok) {
            let errorData;
            try {
                errorData = JSON.parse(stripeResponseText);
            } catch {
                errorData = { error: { message: stripeResponseText } };
            }
            console.error("Stripe API error:", errorData);
            return new Response(
                JSON.stringify({ error: errorData.error?.message || "Failed to create checkout session" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const session = JSON.parse(stripeResponseText);
        console.log("Stripe session created:", session.id);

        // Store payment record
        console.log("Storing payment record...");
        const { error: insertError } = await supabase.from("payments").insert({
            experience_id: experience.id,
            payment_gateway: "stripe",
            stripe_session_id: session.id,
            amount_paise: amountCents,
            currency: currency.toUpperCase(),
            status: "PENDING",
        });

        if (insertError) {
            console.error("Payment insert error:", insertError);
            return new Response(
                JSON.stringify({ error: "Failed to store payment record", details: insertError.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("Payment record stored successfully");

        // Update experience to PREVIEW state
        console.log("Updating experience state...");
        await supabase
            .from("experiences")
            .update({ lifecycle_state: "PREVIEW" })
            .eq("id", experience.id);

        // Log analytics event
        await supabase.from("analytics_events").insert({
            experience_id: experience.id,
            event_type: "STRIPE_PAYMENT_INITIATED",
            metadata: { session_id: session.id, currency },
        });

        console.log("=== SUCCESS - Returning checkout URL ===");
        console.log("Checkout URL:", session.url);

        // Return checkout URL for frontend to redirect
        return new Response(
            JSON.stringify({
                success: true,
                checkout_url: session.url,
                session_id: session.id,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: unknown) {
        console.error("=== UNEXPECTED ERROR ===");
        console.error("Error:", error);
        const message = error instanceof Error ? error.message : "Internal server error";
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
