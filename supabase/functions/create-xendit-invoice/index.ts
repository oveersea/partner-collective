import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;
    const userEmail = claims.claims.email as string;

    const body = await req.json();
    const { checkout_type, record_id, amount, description, success_redirect_url, failure_redirect_url } = body;

    if (!checkout_type || !record_id || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields: checkout_type, record_id, amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile for payer info
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SB_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", userId)
      .single();

    const xenditKey = Deno.env.get("XENDIT_SECRET_KEY")!;
    const externalId = `${checkout_type}_${record_id}`;

    // Create Xendit invoice
    const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(xenditKey + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: Number(amount),
        currency: "IDR",
        description: description || `Payment for ${checkout_type}`,
        customer: {
          given_names: profile?.full_name || "User",
          email: userEmail,
          mobile_number: profile?.phone || undefined,
        },
        success_redirect_url: success_redirect_url || undefined,
        failure_redirect_url: failure_redirect_url || undefined,
        invoice_duration: 86400, // 24 hours
        metadata: {
          checkout_type,
          record_id,
          user_id: userId,
        },
      }),
    });

    if (!xenditRes.ok) {
      const errText = await xenditRes.text();
      console.error("Xendit error:", errText);
      return new Response(JSON.stringify({ error: "Failed to create invoice", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const invoice = await xenditRes.json();

    // Update the respective record with Xendit invoice info
    if (checkout_type === "credit_order") {
      await adminClient
        .from("credit_orders")
        .update({
          xendit_invoice_id: invoice.id,
          xendit_checkout_url: invoice.invoice_url,
          status: "pending_payment",
        })
        .eq("id", record_id)
        .eq("user_id", userId);
    } else if (checkout_type === "wallet_deposit") {
      await adminClient
        .from("wallet_deposits")
        .update({
          xendit_invoice_id: invoice.id,
          xendit_checkout_url: invoice.invoice_url,
          method: "xendit",
          status: "pending",
        })
        .eq("id", record_id)
        .eq("user_id", userId);
    } else if (checkout_type === "program_order") {
      await adminClient
        .from("program_orders")
        .update({
          xendit_invoice_id: invoice.id,
          xendit_invoice_url: invoice.invoice_url,
          status: "pending_payment",
        })
        .eq("id", record_id);
    }

    return new Response(
      JSON.stringify({
        invoice_id: invoice.id,
        invoice_url: invoice.invoice_url,
        expiry_date: invoice.expiry_date,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
