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

    const isPaid = status === "PAID" || status === "SETTLED";

    if (!isPaid) {
      // For non-paid statuses (EXPIRED, etc.), nothing to do since no record exists yet
      console.log(`Invoice ${id} status: ${status} - no action needed (no record exists)`);
      return new Response(JSON.stringify({ success: true, action: "skipped" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Payment successful - NOW create the order record
    const checkoutType = metadata?.checkout_type;
    const userId = metadata?.user_id;
    const amount = metadata?.amount;
    const currency = metadata?.currency || "IDR";
    const description = metadata?.description;

    if (!checkoutType || !userId) {
      console.error("Missing metadata in webhook:", metadata);
      return new Response(JSON.stringify({ error: "Missing metadata" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paidAt = paid_at || new Date().toISOString();

    if (checkoutType === "credit_order") {
      const { error } = await adminClient
        .from("credit_orders")
        .insert({
          user_id: userId,
          package_id: metadata.package_id || null,
          credits: metadata.credits || 0,
          amount_cents: amount,
          currency,
          status: "paid",
          description: description || "Credit purchase",
          xendit_invoice_id: id,
          xendit_checkout_url: null,
          xendit_paid_at: paidAt,
        });

      if (error) {
        console.error("Failed to create credit_order:", error);
        return new Response(JSON.stringify({ error: "Failed to create credit order: " + error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("Credit order created for user:", userId);

    } else if (checkoutType === "wallet_deposit") {
      const { error } = await adminClient
        .from("wallet_deposits")
        .insert({
          user_id: userId,
          amount,
          currency,
          method: "xendit",
          status: "paid",
          xendit_invoice_id: id,
          xendit_checkout_url: null,
          xendit_paid_at: paidAt,
        });

      if (error) {
        console.error("Failed to create wallet_deposit:", error);
        return new Response(JSON.stringify({ error: "Failed to create wallet deposit: " + error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("Wallet deposit created for user:", userId);

    } else if (checkoutType === "program_order") {
      const { error } = await adminClient
        .from("program_orders")
        .insert({
          user_id: userId,
          program_id: metadata.program_id || null,
          program_title: metadata.program_title || "Program",
          amount,
          currency,
          status: "paid",
          xendit_invoice_id: id,
          xendit_invoice_url: null,
        });

      if (error) {
        console.error("Failed to create program_order:", error);
        return new Response(JSON.stringify({ error: "Failed to create program order: " + error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("Program order created for user:", userId);
    }

    return new Response(JSON.stringify({ success: true, action: "record_created" }), {
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
