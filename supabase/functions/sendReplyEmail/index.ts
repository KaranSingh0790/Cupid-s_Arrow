// Cupid's Arrow - Send Reply Email Edge Function
// Sends reply from recipient back to sender via Resend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface SendReplyEmailRequest {
    experience_id: string;
    reply_message: string;
    recipient_name?: string;
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

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse request body
        const body: SendReplyEmailRequest = await req.json();

        if (!body.experience_id) {
            return new Response(
                JSON.stringify({ error: "experience_id is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!body.reply_message || body.reply_message.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: "reply_message is required" }),
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

        // Store the reply in the database
        await supabase
            .from("experiences")
            .update({
                reply_message: body.reply_message.trim(),
                replied_at: new Date().toISOString(),
            })
            .eq("id", body.experience_id);

        // Log analytics event
        await supabase.from("analytics_events").insert({
            experience_id: body.experience_id,
            event_type: "REPLY_SENT",
            metadata: {
                has_message: true,
                message_length: body.reply_message.trim().length
            },
        });

        // If sender email exists, send the reply email
        if (experience.sender_email) {
            const emailHtml = buildReplyEmailHtml({
                senderName: experience.sender_name || "Someone special",
                recipientName: experience.recipient_name || body.recipient_name || "Your Valentine",
                replyMessage: body.reply_message.trim(),
                response: experience.response || "YES",
            });

            const resendResponse = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: "Cupid's Arrow <love@cupidsarrow.space>",
                    to: [experience.sender_email],
                    subject: `💕 ${experience.recipient_name || "Your Valentine"} replied to your message!`,
                    html: emailHtml,
                    tags: [
                        { name: "experience_id", value: body.experience_id },
                        { name: "event_type", value: "REPLY" },
                    ],
                }),
            });

            if (!resendResponse.ok) {
                const errorText = await resendResponse.text();
                console.error("Resend error:", errorText);
                // Still return success since we saved the reply
            }
        }

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Send reply email error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

// Build reply email HTML
function buildReplyEmailHtml(params: {
    senderName: string;
    recipientName: string;
    replyMessage: string;
    response: string;
}): string {
    const { senderName, recipientName, replyMessage, response } = params;

    const responseEmoji = response === "YES" ? "💕" : "💌";
    const responseText = response === "YES"
        ? `said YES to being your Valentine!`
        : `responded to your message`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reply from ${recipientName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FEF7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <tr>
            <td align="center" style="padding-bottom: 30px;">
                <div style="font-size: 48px;">${responseEmoji}</div>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 20px;">
                <h1 style="font-family: Georgia, serif; font-style: italic; font-size: 28px; color: #E11D48; margin: 0;">
                    Great News, ${senderName}!
                </h1>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-bottom: 30px;">
                <p style="font-size: 16px; color: #666; margin: 0; line-height: 1.6;">
                    <strong>${recipientName}</strong> ${responseText}
                </p>
            </td>
        </tr>
        <tr>
            <td style="background-color: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                <p style="font-size: 14px; color: #E11D48; margin: 0 0 15px 0; font-weight: 500;">
                    💌 Their message to you:
                </p>
                <p style="font-family: Georgia, serif; font-style: italic; font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
                    "${replyMessage}"
                </p>
                <p style="font-size: 14px; color: #999; margin: 20px 0 0 0; text-align: right;">
                    — ${recipientName}
                </p>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-top: 40px;">
                <p style="font-size: 14px; color: #999; margin: 0;">
                    Cupid's Arrow 💘
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}
