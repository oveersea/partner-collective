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
      original_amount,
      description,
      success_redirect_url,
      failure_redirect_url,
      package_id,
      credits,
      currency,
      program_id,
      program_title,
      program_slug,
      program_category,
      package_type,
      package_label,
      voucher_codes,
      discount_amount,
    } = body;

    if (!checkout_type || (amount === undefined && !original_amount)) {
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

    // Server-side voucher validation
    let verifiedDiscount = 0;
    const validVoucherIds: string[] = [];
    const voucherCodes: string[] = Array.isArray(voucher_codes) ? voucher_codes : [];
    const baseAmount = Number(original_amount || amount);

    if (voucherCodes.length > 0) {
      const { data: vouchers } = await adminClient
        .from("vouchers")
        .select("*")
        .in("code", voucherCodes)
        .eq("is_active", true);

      if (vouchers && vouchers.length > 0) {
        const now = new Date();
        for (const v of vouchers) {
          if (new Date(v.valid_from) > now) continue;
          if (v.valid_until && new Date(v.valid_until) < now) continue;
          if (v.usage_limit && v.used_count >= v.usage_limit) continue;
          if (baseAmount < (v.min_amount || 0)) continue;

          if (v.discount_type === "percentage") {
            let d = Math.round(baseAmount * v.discount_value / 100);
            if (v.max_discount && d > v.max_discount) d = v.max_discount;
            verifiedDiscount += d;
          } else {
            verifiedDiscount += v.discount_value;
          }
          validVoucherIds.push(v.id);
        }
        verifiedDiscount = Math.min(verifiedDiscount, baseAmount);
      }
    }

    const finalAmount = Math.max(baseAmount - verifiedDiscount, 0);

    // If final amount is 0 after discount, handle free order
    if (finalAmount <= 0) {
      // Increment voucher usage
      for (const code of voucherCodes) {
        await adminClient.rpc("increment_voucher_usage", { p_code: code });
      }

      // Create order as paid directly
      if (checkout_type === "program_order") {
        const { data: profile } = await adminClient
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", userId)
          .single();

        await adminClient.from("program_orders").insert({
          user_id: userId,
          program_title: program_title || "Program",
          program_slug: program_slug || "",
          program_category: program_category || "online",
          package_type: package_type || "trainingOnly",
          package_label: package_label || "Training Only",
          full_name: profile?.full_name || "User",
          email: userEmail,
          phone: profile?.phone || "",
          amount: 0,
          currency: currency || "IDR",
          status: "paid",
          voucher_codes: voucherCodes,
          discount_amount: verifiedDiscount,
          original_amount: baseAmount,
        });
      }

      return jsonResponse({
        free_order: true,
        message: "Order created with 100% discount",
        discount_amount: verifiedDiscount,
      });
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", userId)
      .single();

    const xenditKey = Deno.env.get("XENDIT_SECRET_KEY")!;
    const externalId = `${checkout_type}_${userId}_${Date.now()}`;

    const metadata: Record<string, unknown> = {
      checkout_type,
      user_id: userId,
      amount: finalAmount,
      original_amount: baseAmount,
      discount_amount: verifiedDiscount,
      voucher_codes: voucherCodes,
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
        amount: finalAmount,
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

    // Increment voucher usage for valid vouchers
    for (const code of voucherCodes) {
      await adminClient.rpc("increment_voucher_usage", { p_code: code });
    }

    let insertError: { message: string } | null = null;

    const voucherMeta = voucherCodes.length > 0
      ? { voucher_codes: voucherCodes, discount_amount: verifiedDiscount, original_amount: baseAmount }
      : {};

    if (checkout_type === "credit_order") {
      const { error } = await adminClient.from("credit_orders").insert({
        user_id: userId,
        package_id: package_id || null,
        credits: Number(credits || 0),
        amount_cents: finalAmount,
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
        amount: finalAmount,
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
        program_title: program_title || "Program",
        program_slug: program_slug || "",
        program_category: program_category || "online",
        package_type: package_type || "trainingOnly",
        package_label: package_label || "Training Only",
        full_name: profile?.full_name || "User",
        email: userEmail,
        phone: profile?.phone || "",
        amount: finalAmount,
        currency: currency || "IDR",
        status: "pending",
        xendit_invoice_id: invoice.id,
        xendit_invoice_url: invoice.invoice_url,
        ...voucherMeta,
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
      discount_amount: verifiedDiscount,
    });
  } catch (err) {
    console.error("Error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
