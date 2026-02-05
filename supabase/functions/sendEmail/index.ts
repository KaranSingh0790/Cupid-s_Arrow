// Cupid's Arrow - Send Email Edge Function
// Sends experience link to recipient via Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

// Email subject lines by experience type
const SUBJECT_LINES = {
    CRUSH: [
        "Someone has a secret admiration for you 💕",
        "A love note awaits you 💌",
        "Someone is thinking of you... 🥰",
    ],
    COUPLE: [
        "A love letter from someone special 💖",
        "Your journey together, beautifully told 💑",
        "A celebration of your love story 💝",
    ],
};

interface SendEmailRequest {
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
        const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
        const appUrl = Deno.env.get("APP_URL") || "https://cupidsarrow.app";

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse request body
        const body: SendEmailRequest = await req.json();

        if (!body.experience_id) {
            return new Response(
                JSON.stringify({ error: "experience_id is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Fetch experience
        const { data: experience, error: fetchError } = await supabase
            .from("experiences")
            .select("*")
            .eq("id", body.experience_id)
            .single();

        if (fetchError || !experience) {
            return new Response(
                JSON.stringify({ error: "Experience not found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check if experience is in PAID state
        if (experience.lifecycle_state !== "PAID") {
            return new Response(
                JSON.stringify({ error: "Experience is not in PAID state" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Build experience URL
        const experienceUrl = `${appUrl}/v/${experience.id}`;

        // Select random subject line
        const subjects = SUBJECT_LINES[experience.experience_type as keyof typeof SUBJECT_LINES];
        const subject = subjects[Math.floor(Math.random() * subjects.length)];

        // Build email HTML
        const emailHtml = buildEmailHtml({
            recipientName: experience.recipient_name,
            senderName: experience.sender_name,
            experienceType: experience.experience_type,
            experienceUrl,
        });

        // Send email via Resend
        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Cupid's Arrow <love@cupidsarrow.app>",
                to: [experience.recipient_email],
                subject: subject,
                html: emailHtml,
                tags: [
                    { name: "experience_id", value: experience.id },
                    { name: "experience_type", value: experience.experience_type },
                ],
            }),
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.error("Resend error:", errorText);
            return new Response(
                JSON.stringify({ error: "Failed to send email" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const resendData = await resendResponse.json();

        // Update experience to SENT state
        await supabase
            .from("experiences")
            .update({
                lifecycle_state: "SENT",
                sent_at: new Date().toISOString(),
            })
            .eq("id", experience.id);

        // Log analytics event
        await supabase.from("analytics_events").insert({
            experience_id: experience.id,
            event_type: "EMAIL_SENT",
            metadata: { email_id: resendData.id },
        });

        return new Response(
            JSON.stringify({ success: true, email_id: resendData.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Send email error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

// Email template builder
function buildEmailHtml({
    recipientName,
    senderName,
    experienceType,
    experienceUrl,
}: {
    recipientName: string;
    senderName?: string;
    experienceType: string;
    experienceUrl: string;
}): string {
    const senderText = senderName
        ? `from ${senderName}`
        : experienceType === "CRUSH"
            ? "from a secret admirer"
            : "from someone who loves you";

    const ctaText = experienceType === "CRUSH"
        ? "See Your Secret Message"
        : "Experience Your Love Story";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A Special Message for You</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFF5F5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 500px; background: white; border-radius: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 48px 32px; text-align: center;">
              <!-- Heart Icon -->
              <div style="font-size: 48px; margin-bottom: 24px;">💕</div>
              
              <!-- Greeting -->
              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 600; color: #1a1a1a;">
                Hey ${recipientName}!
              </h1>
              
              <p style="margin: 0 0 32px; font-size: 16px; color: #666; line-height: 1.6;">
                You've received something special ${senderText}
              </p>
              
              <!-- Decorative Line -->
              <div style="width: 60px; height: 2px; background: linear-gradient(90deg, #FDA4AF, #FB7185); margin: 0 auto 32px;"></div>
              
              <!-- Message -->
              <p style="margin: 0 0 32px; font-size: 15px; color: #444; line-height: 1.7;">
                ${experienceType === "CRUSH"
            ? "Someone has been thinking about you and wants to share their feelings. It's a beautiful experience waiting just for you."
            : "A beautiful journey of memories and appreciation has been crafted just for you. It's a celebration of your special connection."
        }
              </p>
              
              <!-- CTA Button -->
              <a href="${experienceUrl}" 
                 style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FB7185 0%, #F43F5E 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(244,63,94,0.3);">
                ${ctaText}
              </a>
              
              <!-- Footer Note -->
              <p style="margin: 40px 0 0; font-size: 13px; color: #999;">
                This experience was created with love on Cupid's Arrow
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <p style="margin-top: 24px; font-size: 12px; color: #999;">
          Made with 💖 in India
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
