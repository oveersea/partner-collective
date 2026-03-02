import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-callback-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Xendit webhook received:", JSON.stringify(body));

    const { id, external_id, status, paid_at, metadata } = body;

    if (!external_id || !status) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SB_SERVICE_ROLE_KEY")!
    );

    // Parse external_id: "{type}_{record_id}"
    const parts = external_id.split("_");
    const checkoutType = parts[0] + (parts.length > 2 ? "_" + parts[1] : "");
    const recordId = parts.slice(checkoutType.split("_").length).join("_");

    const isPaid = status === "PAID" || status === "SETTLED";

    if (checkoutType === "credit_order" && isPaid) {
      await adminClient
        .from("credit_orders")
        .update({
          status: "paid",
          xendit_paid_at: paid_at || new Date().toISOString(),
        })
        .eq("xendit_invoice_id", id);
    } else if (checkoutType === "wallet_deposit" && isPaid) {
      await adminClient
        .from("wallet_deposits")
        .update({
          status: "paid",
          xendit_paid_at: paid_at || new Date().toISOString(),
        })
        .eq("xendit_invoice_id", id);
    } else if (checkoutType === "program_order" && isPaid) {
      await adminClient
        .from("program_orders")
        .update({
          status: "paid",
        })
        .eq("xendit_invoice_id", id);
    } else if (status === "EXPIRED") {
      // Handle expired invoices
      if (checkoutType === "credit_order") {
        await adminClient
          .from("credit_orders")
          .update({ status: "expired" })
          .eq("xendit_invoice_id", id);
      } else if (checkoutType === "wallet_deposit") {
        await adminClient
          .from("wallet_deposits")
          .update({ status: "expired" })
          .eq("xendit_invoice_id", id);
      } else if (checkoutType === "program_order") {
        await adminClient
          .from("program_orders")
          .update({ status: "expired" })
          .eq("xendit_invoice_id", id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
