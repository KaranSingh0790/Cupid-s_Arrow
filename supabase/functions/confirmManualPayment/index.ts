// Cupid's Arrow - Confirm Manual Payment
// Stores payment confirmation + sends admin a notification email with one-click approve link.
// Does NOT auto-deliver — admin must click approve after checking UPI/PayPal.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface ConfirmPaymentRequest {
    experience_id: string;
    name: string;
    email: string;
    payment_method: "upi" | "paypal";
    transaction_id: string;
    screenshot_url?: string;
    message_content?: string;
    order_ref?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
        const adminEmail = Deno.env.get("ADMIN_NOTIFY_EMAIL") || "ks227626@gmail.com";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body: ConfirmPaymentRequest = await req.json();

        // ── Validation ──────────────────────────────────────
        if (!body.experience_id) return jsonError("experience_id is required", 400);
        if (!body.name?.trim() || !body.email?.trim()) return jsonError("Name and email are required", 400);
        if (!body.payment_method || !["upi", "paypal"].includes(body.payment_method)) return jsonError("Invalid payment method", 400);
        if (!body.transaction_id || body.transaction_id.trim().length < 6) return jsonError("A valid Transaction ID is required (min 6 characters)", 400);

        // ── Verify experience exists ────────────────────────
        const { data: experience, error: fetchError } = await supabase
            .from("experiences")
            .select("id, lifecycle_state, experience_type, recipient_name, recipient_email")
            .eq("id", body.experience_id)
            .single();

        if (fetchError || !experience) return jsonError("Experience not found", 404);

        // ── Prevent duplicate submissions ───────────────────
        const { data: existing } = await supabase
            .from("manual_payments")
            .select("id")
            .eq("experience_id", body.experience_id)
            .limit(1);

        if (existing && existing.length > 0) {
            return jsonSuccess({
                message: "Payment already submitted. We're verifying it now!",
                already_submitted: true,
            });
        }

        // ── Insert record (with auto-generated approval_token) ──
        const { data: payment, error: insertError } = await supabase
            .from("manual_payments")
            .insert({
                experience_id: body.experience_id,
                name: body.name.trim(),
                email: body.email.trim(),
                payment_method: body.payment_method,
                transaction_id: body.transaction_id.trim(),
                screenshot_url: body.screenshot_url || null,
                message_content: body.message_content || null,
                order_ref: body.order_ref || null,
            })
            .select("id, approval_token")
            .single();

        if (insertError || !payment) {
            console.error("Insert error:", insertError);
            return jsonError("Failed to save payment confirmation", 500);
        }

        // ── Send admin notification email with one-click approve link ──
        const approveUrl = `${supabaseUrl}/functions/v1/adminVerifyPayment?token=${payment.approval_token}`;

        const priceDisplay = body.payment_method === "upi"
            ? `₹${body.order_ref ? "" : ""}(UPI)`
            : `$(PayPal)`;

        try {
            await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: "Cupid's Arrow <love@cupidsarrow.space>",
                    to: [adminEmail],
                    subject: `💰 New Payment: ${body.payment_method.toUpperCase()} from ${body.name.trim()}`,
                    html: buildAdminEmailHtml({
                        name: body.name.trim(),
                        email: body.email.trim(),
                        paymentMethod: body.payment_method,
                        transactionId: body.transaction_id.trim(),
                        orderRef: body.order_ref || "N/A",
                        screenshotUrl: body.screenshot_url || null,
                        recipientName: experience.recipient_name,
                        recipientEmail: experience.recipient_email,
                        experienceType: experience.experience_type,
                        messageSummary: body.message_content || "",
                        approveUrl,
                    }),
                }),
            });
        } catch (emailErr) {
            // Non-blocking — log but don't fail the request
            console.error("Admin notification email failed:", emailErr);
        }

        // ── Log analytics ───────────────────────────────────
        await supabase.from("analytics_events").insert({
            experience_id: body.experience_id,
            event_type: "MANUAL_PAYMENT_SUBMITTED",
            metadata: {
                payment_method: body.payment_method,
                transaction_id: body.transaction_id.trim(),
                order_ref: body.order_ref,
            },
        });

        return jsonSuccess({
            message: "Payment confirmation received! We're verifying your payment — your valentine will be delivered shortly.",
        });

    } catch (error) {
        console.error("Confirm manual payment error:", error);
        return jsonError("Internal server error", 500);
    }
});

// ── Admin notification email template ────────────────────
function buildAdminEmailHtml(data: {
    name: string;
    email: string;
    paymentMethod: string;
    transactionId: string;
    orderRef: string;
    screenshotUrl: string | null;
    recipientName: string;
    recipientEmail: string;
    experienceType: string;
    messageSummary: string;
    approveUrl: string;
}): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif;">
<div style="max-width:500px;margin:0 auto;background:white;border-radius:12px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a1a;">💰 New Payment Confirmation</h2>

  <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">
    <tr><td style="padding:8px 0;font-weight:600;width:120px;">From</td><td>${data.name} (${data.email})</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;">Method</td><td style="text-transform:uppercase;">${data.paymentMethod}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;">Transaction ID</td><td style="font-family:monospace;background:#f0f0f0;padding:4px 8px;border-radius:4px;">${data.transactionId}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;">Order Ref</td><td style="font-family:monospace;">${data.orderRef}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;">Type</td><td>${data.experienceType}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;">Recipient</td><td>${data.recipientName} (${data.recipientEmail})</td></tr>
  </table>

  ${data.messageSummary ? `<div style="margin:16px 0;padding:12px;background:#FFF5F5;border-radius:8px;font-size:13px;color:#666;">💌 ${data.messageSummary.substring(0, 200)}</div>` : ""}

  ${data.screenshotUrl ? `<div style="margin:16px 0;"><a href="${data.screenshotUrl}" style="color:#F43F5E;font-size:13px;">📷 View Payment Screenshot</a></div>` : ""}

  <div style="margin:24px 0 16px;text-align:center;">
    <p style="font-size:13px;color:#666;margin:0 0 12px;">Check your ${data.paymentMethod === "upi" ? "UPI app" : "PayPal"} for transaction <strong>${data.transactionId}</strong>, then:</p>
    <a href="${data.approveUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#22C55E,#16A34A);color:white;text-decoration:none;border-radius:50px;font-weight:600;font-size:16px;box-shadow:0 4px 12px rgba(34,197,94,0.3);">
      ✅ Approve & Deliver Valentine
    </a>
  </div>

  <p style="text-align:center;font-size:11px;color:#999;margin:16px 0 0;">
    Clicking approve will mark payment as verified and send the valentine email to ${data.recipientName}.
  </p>
</div>
</body>
</html>`.trim();
}

// ── Helpers ──────────────────────────────────────────────
function jsonError(message: string, status: number) {
    return new Response(
        JSON.stringify({ error: message }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
}

function jsonSuccess(data: Record<string, unknown>) {
    return new Response(
        JSON.stringify({ success: true, ...data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
}
