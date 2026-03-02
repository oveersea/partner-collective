import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendEmailRequest {
  to: { email: string; name?: string; user_id?: string }[];
  subject: string;
  html: string;
  template_id?: string;
  send_type?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SB_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "superadmin"]);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, subject, html, template_id, send_type } = await req.json() as SendEmailRequest;

    if (!to || !Array.isArray(to) || to.length === 0 || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, html" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: { email: string; success: boolean; error?: string }[] = [];

    // Send emails in batches of 10
    for (let i = 0; i < to.length; i += 10) {
      const batch = to.slice(i, i + 10);

      const sendPromises = batch.map(async (recipient) => {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Oveersea <noreply@oveersea.com>",
              to: [recipient.email],
              subject,
              html,
            }),
          });

          const resData = await res.json();

          if (!res.ok) {
            const errMsg = resData?.message || resData?.error || `HTTP ${res.status}`;
            // Log failed send
            await adminClient.from("email_sends").insert({
              template_id: template_id || null,
              subject,
              body_html: html,
              recipient_email: recipient.email,
              recipient_name: recipient.name || null,
              recipient_user_id: recipient.user_id || null,
              send_type: send_type || "manual",
              status: "failed",
              error_message: errMsg,
              sent_by: user.id,
              sent_at: new Date().toISOString(),
            });
            results.push({ email: recipient.email, success: false, error: errMsg });
            return;
          }

          // Log successful send
          await adminClient.from("email_sends").insert({
            template_id: template_id || null,
            subject,
            body_html: html,
            recipient_email: recipient.email,
            recipient_name: recipient.name || null,
            recipient_user_id: recipient.user_id || null,
            send_type: send_type || "manual",
            status: "sent",
            sent_by: user.id,
            sent_at: new Date().toISOString(),
          });

          results.push({ email: recipient.email, success: true });
        } catch (e) {
          await adminClient.from("email_sends").insert({
            template_id: template_id || null,
            subject,
            body_html: html,
            recipient_email: recipient.email,
            recipient_name: recipient.name || null,
            recipient_user_id: recipient.user_id || null,
            send_type: send_type || "manual",
            status: "failed",
            error_message: String(e),
            sent_by: user.id,
            sent_at: new Date().toISOString(),
          });
          results.push({ email: recipient.email, success: false, error: String(e) });
        }
      });

      await Promise.all(sendPromises);
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({ results, summary: { total: to.length, success: successCount, failed: failCount } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
