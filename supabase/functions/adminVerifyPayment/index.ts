// Cupid's Arrow — Admin: Verify Payment & Deliver
// Called when admin clicks "Approve & Deliver" link from notification email.
// Supports GET (email click) with ?token=<approval_token>
// Marks payment as verified, sets experience to PAID, triggers sendEmail.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // ── Get token from URL query (GET from email click) or JSON body (POST) ──
        let token: string | null = null;

        if (req.method === "GET") {
            const url = new URL(req.url);
            token = url.searchParams.get("token");
        } else {
            const body = await req.json();
            token = body.token || body.approval_token || null;
        }

        if (!token) {
            return htmlResponse("❌ Missing approval token.", 400);
        }

        // ── Find the payment by approval_token ──
        const { data: payment, error: findError } = await supabase
            .from("manual_payments")
            .select("id, experience_id, reviewed, name, transaction_id, payment_method")
            .eq("approval_token", token)
            .single();

        if (findError || !payment) {
            return htmlResponse("❌ Invalid or expired approval link. Payment not found.", 404);
        }

        // ── Already approved? ──
        if (payment.reviewed) {
            return htmlResponse(`✅ This payment from <strong>${payment.name}</strong> was already approved. The valentine has been delivered!`, 200);
        }

        // ── Mark as reviewed ──
        await supabase
            .from("manual_payments")
            .update({
                reviewed: true,
                reviewed_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

        // ── Set experience to PAID ──
        await supabase
            .from("experiences")
            .update({
                lifecycle_state: "PAID",
                paid_at: new Date().toISOString(),
            })
            .eq("id", payment.experience_id);

        // ── Trigger email delivery ──
        let emailSent = false;
        try {
            const sendEmailUrl = `${supabaseUrl}/functions/v1/sendEmail`;
            const emailRes = await fetch(sendEmailUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${supabaseServiceKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ experience_id: payment.experience_id }),
            });

            const emailResult = await emailRes.json().catch(() => ({}));
            emailSent = emailResult?.success === true;
        } catch (emailErr) {
            console.error("sendEmail failed:", emailErr);
        }

        // ── Log analytics ──
        await supabase.from("analytics_events").insert({
            experience_id: payment.experience_id,
            event_type: "PAYMENT_VERIFIED_BY_ADMIN",
            metadata: {
                payment_id: payment.id,
                transaction_id: payment.transaction_id,
                email_sent: emailSent,
            },
        });

        // ── Return nice HTML page (shown in browser after admin clicks link) ──
        const statusText = emailSent
            ? "Valentine email has been sent! 💌"
            : "Payment verified, but email delivery needs attention.";

        return htmlResponse(`
      <div style="text-align:center;">
        <div style="font-size:64px;margin-bottom:16px;">✅</div>
        <h1 style="color:#16A34A;font-size:24px;margin:0 0 8px;">Payment Approved!</h1>
        <p style="color:#555;font-size:16px;margin:0 0 24px;">
          ${payment.name}'s payment via ${payment.payment_method.toUpperCase()} has been verified.
        </p>
        <p style="color:#333;font-size:18px;font-weight:600;">${statusText}</p>
      </div>
    `, 200);

    } catch (error) {
        console.error("Admin verify error:", error);
        return htmlResponse("❌ Something went wrong. Please try again.", 500);
    }
});

// ── Returns an HTML page (for browser display after email click) ──
function htmlResponse(content: string, status: number) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cupid's Arrow — Admin</title>
</head>
<body style="margin:0;padding:40px 20px;background:#FFF5F5;font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="max-width:440px;background:white;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08);text-align:center;">
    ${content}
    <p style="margin-top:32px;font-size:12px;color:#999;">Cupid's Arrow Admin</p>
  </div>
</body>
</html>`.trim();

    return new Response(html, {
        status,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}
