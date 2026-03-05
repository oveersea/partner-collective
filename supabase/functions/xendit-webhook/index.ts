import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-callback-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const expectedCallbackToken = Deno.env.get("XENDIT_CALLBACK_TOKEN");
    if (expectedCallbackToken) {
      const callbackToken = req.headers.get("x-callback-token");
      if (callbackToken !== expectedCallbackToken) {
        return jsonResponse({ error: "Unauthorized callback" }, 401);
      }
    }

    const body = await req.json();
    console.log("Xendit webhook received:", JSON.stringify(body));

    const { id, external_id, status, paid_at, metadata } = body;

    // Handle Xendit test/verification pings (no external_id or status)
    if (!external_id && !status) {
      console.log("Test ping received, responding OK");
      return jsonResponse({ success: true, action: "test_ping" });
    }

    if (!status) {
      return jsonResponse({ error: "Invalid payload: missing status" }, 400);
    }

    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SB_SERVICE_ROLE_KEY");

    if (!serviceRoleKey) {
      return jsonResponse({ error: "Missing service role key" }, 500);
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    const isPaid = status === "PAID" || status === "SETTLED";
    const normalizedStatus = String(status).toLowerCase();
    const paidAt = paid_at || new Date().toISOString();

    // Determine checkout type and user from metadata or by looking up the order in DB
    let checkoutType = metadata?.checkout_type;
    let userId = metadata?.user_id;

    // If metadata is missing, try to find the order by xendit_invoice_id
    if (!checkoutType || !userId) {
      console.log("Metadata missing, looking up order by invoice id:", id);

      // Try credit_orders first
      const { data: creditOrder } = await adminClient
        .from("credit_orders")
        .select("user_id")
        .eq("xendit_invoice_id", id)
        .maybeSingle();

      if (creditOrder) {
        checkoutType = "credit_order";
        userId = creditOrder.user_id;
      } else {
        // Try wallet_deposits
        const { data: walletDeposit } = await adminClient
          .from("wallet_deposits")
          .select("user_id")
          .eq("xendit_invoice_id", id)
          .maybeSingle();

        if (walletDeposit) {
          checkoutType = "wallet_deposit";
          userId = walletDeposit.user_id;
        } else {
          // Try program_orders
          const { data: programOrder } = await adminClient
            .from("program_orders")
            .select("user_id")
            .eq("xendit_invoice_id", id)
            .maybeSingle();

          if (programOrder) {
            checkoutType = "program_order";
            userId = programOrder.user_id;
          }
        }
      }
    }

    // For non-paid statuses, update if we can find the record
    if (!isPaid) {
      if (checkoutType === "credit_order") {
        await adminClient
          .from("credit_orders")
          .update({ status: normalizedStatus })
          .eq("xendit_invoice_id", id)
          .neq("status", "paid");
      } else if (checkoutType === "wallet_deposit") {
        await adminClient
          .from("wallet_deposits")
          .update({ status: normalizedStatus })
          .eq("xendit_invoice_id", id)
          .neq("status", "paid");
      } else if (checkoutType === "program_order") {
        await adminClient
          .from("program_orders")
          .update({ status: normalizedStatus })
          .eq("xendit_invoice_id", id)
          .neq("status", "paid");
      }

      console.log(`Invoice ${id} status: ${status} - updated`);
      return jsonResponse({ success: true, action: "status_updated" });
    }

    // For paid status, we need checkout type and user
    if (!checkoutType || !userId) {
      console.error("Could not determine order for invoice:", id);
      return jsonResponse({ error: "Order not found for this invoice" }, 404);
    }

    if (checkoutType === "credit_order") {
      const { error: updateError } = await adminClient
        .from("credit_orders")
        .update({ status: "paid", xendit_paid_at: paidAt })
        .eq("xendit_invoice_id", id)
        .neq("status", "paid");

      if (updateError) {
        console.error("Failed to update credit_order:", updateError);
        return jsonResponse({ error: "Failed to update credit order: " + updateError.message }, 500);
      }

      console.log("Credit order paid for user:", userId);
    } else if (checkoutType === "wallet_deposit") {
      const { error: updateError } = await adminClient
        .from("wallet_deposits")
        .update({ status: "paid", xendit_paid_at: paidAt })
        .eq("xendit_invoice_id", id)
        .neq("status", "paid");

      if (updateError) {
        console.error("Failed to update wallet_deposit:", updateError);
        return jsonResponse({ error: "Failed to update wallet deposit: " + updateError.message }, 500);
      }

      console.log("Wallet deposit paid for user:", userId);
    } else if (checkoutType === "program_order") {
      const { error: updateError } = await adminClient
        .from("program_orders")
        .update({ status: "paid" })
        .eq("xendit_invoice_id", id)
        .neq("status", "paid");

      if (updateError) {
        console.error("Failed to update program_order:", updateError);
        return jsonResponse({ error: "Failed to update program order: " + updateError.message }, 500);
      }

      console.log("Program order paid for user:", userId);
    }

    return jsonResponse({ success: true, action: "record_paid" });
  } catch (err) {
    console.error("Webhook error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
