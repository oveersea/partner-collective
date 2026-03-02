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
    const {
      checkout_type, amount, description,
      success_redirect_url, failure_redirect_url,
      // Credit order specific
      package_id, credits, currency,
      // Program order specific
      program_id, program_title,
    } = body;

    if (!checkout_type || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields: checkout_type, amount" }), {
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
    const externalId = `${checkout_type}_${userId}_${Date.now()}`;

    // Build metadata - all order details stored here, NO DB record created yet
    const metadata: Record<string, any> = {
      checkout_type,
      user_id: userId,
      amount: Number(amount),
      currency: currency || "IDR",
      description: description || `Payment for ${checkout_type}`,
    };

    if (checkout_type === "credit_order") {
      metadata.package_id = package_id;
      metadata.credits = credits;
    } else if (checkout_type === "program_order") {
      metadata.program_id = program_id;
      metadata.program_title = program_title;
    }

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
        currency: currency || "IDR",
        description: description || `Payment for ${checkout_type}`,
        customer: {
          given_names: profile?.full_name || "User",
          email: userEmail,
          mobile_number: profile?.phone || undefined,
        },
        success_redirect_url: success_redirect_url || undefined,
        failure_redirect_url: failure_redirect_url || undefined,
        invoice_duration: 86400, // 24 hours
        metadata,
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

    // No DB record created here - record will be created by webhook on successful payment

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
