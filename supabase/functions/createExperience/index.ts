// Cupid's Arrow - Create Experience Edge Function
// Creates a new experience in DRAFT state

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Pricing in paise (1 INR = 100 paise)
const PRICING = {
  CRUSH: 4900,  // ₹49
  COUPLE: 9900, // ₹99
};

interface CreateExperienceRequest {
  experience_type: "CRUSH" | "COUPLE";
  sender_name?: string;
  recipient_name: string;
  recipient_email: string;
  content: {
    // CRUSH mode - simple note
    note?: string;
    // COUPLE mode - memories with photos + appreciation
    memories?: Array<{
      title: string;
      description: string;
      date?: string;
      photo?: string; // Base64 or URL
    }>;
    admirationMessages?: string[];
    admirationPhotos?: string[];
    appreciationMessage?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: CreateExperienceRequest = await req.json();

    // Validate required fields
    if (!body.experience_type || !["CRUSH", "COUPLE"].includes(body.experience_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid experience_type. Must be CRUSH or COUPLE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.recipient_name || body.recipient_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "recipient_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.recipient_email || !isValidEmail(body.recipient_email)) {
      return new Response(
        JSON.stringify({ error: "Valid recipient_email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate content based on experience type
    // CRUSH mode is lenient - note is optional, users can send just the Valentine proposal
    // COUPLE mode requires at least some content
    if (body.experience_type === "COUPLE") {
      const hasMemories = body.content.memories?.some(m => m?.title?.trim());
      const hasMessages = body.content.admirationMessages?.some(m => m?.trim());
      if (!hasMemories && !hasMessages) {
        return new Response(
          JSON.stringify({ error: "At least one memory or love message is required for COUPLE mode" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get pricing for experience type
    const amount_paise = PRICING[body.experience_type];

    // Insert experience into database
    const { data, error } = await supabase
      .from("experiences")
      .insert({
        experience_type: body.experience_type,
        lifecycle_state: "DRAFT",
        sender_name: body.sender_name?.trim() || null,
        recipient_name: body.recipient_name.trim(),
        recipient_email: body.recipient_email.toLowerCase().trim(),
        content: body.content,
        amount_paise: amount_paise,
      })
      .select("id, experience_type, amount_paise, created_at")
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create experience", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log analytics event
    await supabase.from("analytics_events").insert({
      experience_id: data.id,
      event_type: "EXPERIENCE_CREATED",
      metadata: { experience_type: body.experience_type },
    });

    // Return created experience
    return new Response(
      JSON.stringify({
        success: true,
        experience: {
          id: data.id,
          experience_type: data.experience_type,
          amount_paise: data.amount_paise,
          amount_display: `₹${data.amount_paise / 100}`,
          created_at: data.created_at,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}
