import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = user.id;
    const userEmail = user.email || "";

    const body = await req.json();
    const {
      checkout_type,
      amount,
      description,
      success_redirect_url,
      failure_redirect_url,
      package_id,
      credits,
      currency,
      program_id,
      program_title,
    } = body;

    if (!checkout_type || !amount) {
      return jsonResponse({ error: "Missing required fields: checkout_type, amount" }, 400);
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

    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", userId)
      .single();

    const xenditKey = Deno.env.get("XENDIT_SECRET_KEY")!;
    const externalId = `${checkout_type}_${userId}_${Date.now()}`;
    const normalizedAmount = Number(amount);

    const metadata: Record<string, unknown> = {
      checkout_type,
      user_id: userId,
      amount: normalizedAmount,
      currency: currency || "IDR",
      description: description || `Payment for ${checkout_type}`,
    };

    if (checkout_type === "credit_order") {
      metadata.package_id = package_id;
      metadata.credits = Number(credits || 0);
    } else if (checkout_type === "program_order") {
      metadata.program_id = program_id;
      metadata.program_title = program_title;
    }

    const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(xenditKey + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: normalizedAmount,
        currency: currency || "IDR",
        description: description || `Payment for ${checkout_type}`,
        customer: {
          given_names: profile?.full_name || "User",
          email: userEmail,
          mobile_number: profile?.phone || undefined,
        },
        success_redirect_url: success_redirect_url || undefined,
        failure_redirect_url: failure_redirect_url || undefined,
        invoice_duration: 86400,
        metadata,
      }),
    });

    if (!xenditRes.ok) {
      const errText = await xenditRes.text();
      console.error("Xendit error:", errText);
      return jsonResponse({ error: "Failed to create invoice", details: errText }, 500);
    }

    const invoice = await xenditRes.json();

    let insertError: { message: string } | null = null;

    if (checkout_type === "credit_order") {
      const { error } = await adminClient.from("credit_orders").insert({
        user_id: userId,
        package_id: package_id || null,
        credits: Number(credits || 0),
        amount_cents: normalizedAmount,
        currency: currency || "IDR",
        status: "pending",
        buyer_type: "personal",
        description: description || "Credit purchase",
        xendit_invoice_id: invoice.id,
        xendit_checkout_url: invoice.invoice_url,
      });
      insertError = error;
    } else if (checkout_type === "wallet_deposit") {
      const { error } = await adminClient.from("wallet_deposits").insert({
        user_id: userId,
        amount: normalizedAmount,
        currency: currency || "IDR",
        method: "xendit",
        status: "pending",
        xendit_invoice_id: invoice.id,
        xendit_checkout_url: invoice.invoice_url,
      });
      insertError = error;
    } else if (checkout_type === "program_order") {
      const { error } = await adminClient.from("program_orders").insert({
        user_id: userId,
        program_id: program_id || null,
        program_title: program_title || "Program",
        amount: normalizedAmount,
        currency: currency || "IDR",
        status: "pending",
        xendit_invoice_id: invoice.id,
        xendit_invoice_url: invoice.invoice_url,
      });
      insertError = error;
    }

    if (insertError) {
      console.error("Failed to create pending order:", insertError);
      return jsonResponse({ error: "Invoice created but failed to save order", details: insertError.message }, 500);
    }

    return jsonResponse({
      invoice_id: invoice.id,
      invoice_url: invoice.invoice_url,
      expiry_date: invoice.expiry_date,
    });
  } catch (err) {
    console.error("Error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
