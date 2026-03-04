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

    if (!external_id || !status) {
      return jsonResponse({ error: "Invalid payload" }, 400);
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SB_SERVICE_ROLE_KEY")!
    );

    const checkoutType = metadata?.checkout_type || String(external_id).split("_")[0];
    const userId = metadata?.user_id;
    const amount = Number(metadata?.amount || 0);
    const currency = metadata?.currency || "IDR";
    const description = metadata?.description;
    const paidAt = paid_at || new Date().toISOString();
    const normalizedStatus = String(status).toLowerCase();
    const isPaid = status === "PAID" || status === "SETTLED";

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

      console.log(`Invoice ${id} status: ${status} - updated non-paid status`);
      return jsonResponse({ success: true, action: "status_updated" });
    }

    if (!checkoutType || !userId) {
      console.error("Missing metadata in webhook:", metadata);
      return jsonResponse({ error: "Missing metadata" }, 400);
    }

    if (checkoutType === "credit_order") {
      const { data: updated, error: updateError } = await adminClient
        .from("credit_orders")
        .update({ status: "paid", xendit_paid_at: paidAt })
        .eq("xendit_invoice_id", id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        console.error("Failed to update credit_order:", updateError);
        return jsonResponse({ error: "Failed to update credit order: " + updateError.message }, 500);
      }

      if (!updated) {
        const { error: insertError } = await adminClient.from("credit_orders").insert({
          user_id: userId,
          package_id: metadata?.package_id || null,
          credits: Number(metadata?.credits || 0),
          amount_cents: amount,
          currency,
          status: "paid",
          buyer_type: "personal",
          description: description || "Credit purchase",
          xendit_invoice_id: id,
          xendit_checkout_url: null,
          xendit_paid_at: paidAt,
        });

        if (insertError) {
          console.error("Failed to create credit_order:", insertError);
          return jsonResponse({ error: "Failed to create credit order: " + insertError.message }, 500);
        }
      }

      console.log("Credit order synced for user:", userId);
    } else if (checkoutType === "wallet_deposit") {
      const { data: updated, error: updateError } = await adminClient
        .from("wallet_deposits")
        .update({ status: "paid", xendit_paid_at: paidAt })
        .eq("xendit_invoice_id", id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        console.error("Failed to update wallet_deposit:", updateError);
        return jsonResponse({ error: "Failed to update wallet deposit: " + updateError.message }, 500);
      }

      if (!updated) {
        const { error: insertError } = await adminClient.from("wallet_deposits").insert({
          user_id: userId,
          amount,
          currency,
          method: "xendit",
          status: "paid",
          xendit_invoice_id: id,
          xendit_checkout_url: null,
          xendit_paid_at: paidAt,
        });

        if (insertError) {
          console.error("Failed to create wallet_deposit:", insertError);
          return jsonResponse({ error: "Failed to create wallet deposit: " + insertError.message }, 500);
        }
      }

      console.log("Wallet deposit synced for user:", userId);
    } else if (checkoutType === "program_order") {
      const { data: updated, error: updateError } = await adminClient
        .from("program_orders")
        .update({ status: "paid" })
        .eq("xendit_invoice_id", id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        console.error("Failed to update program_order:", updateError);
        return jsonResponse({ error: "Failed to update program order: " + updateError.message }, 500);
      }

      if (!updated) {
        const { error: insertError } = await adminClient.from("program_orders").insert({
          user_id: userId,
          program_id: metadata?.program_id || null,
          program_title: metadata?.program_title || "Program",
          amount,
          currency,
          status: "paid",
          xendit_invoice_id: id,
          xendit_invoice_url: null,
        });

        if (insertError) {
          console.error("Failed to create program_order:", insertError);
          return jsonResponse({ error: "Failed to create program order: " + insertError.message }, 500);
        }
      }

      console.log("Program order synced for user:", userId);
    }

    return jsonResponse({ success: true, action: "record_synced" });
  } catch (err) {
    console.error("Webhook error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
