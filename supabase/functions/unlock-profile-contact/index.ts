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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client to get current user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profile_user_id } = await req.json();
    if (!profile_user_id) {
      return new Response(JSON.stringify({ error: "profile_user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (user.id === profile_user_id) {
      return new Response(JSON.stringify({ error: "Cannot unlock your own profile" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const CREDIT_COST = 2;

    // Check if already unlocked
    const { data: existing } = await admin
      .from("profile_unlocks")
      .select("id")
      .eq("unlocked_by", user.id)
      .eq("profile_user_id", profile_user_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, already_unlocked: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check credit balance
    const { data: creditRow } = await admin
      .from("credit_balances")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentBalance = creditRow?.balance ?? 0;
    if (currentBalance < CREDIT_COST) {
      return new Response(JSON.stringify({ error: "Insufficient credits", balance: currentBalance, required: CREDIT_COST }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct credits
    await admin
      .from("credit_balances")
      .update({
        balance: currentBalance - CREDIT_COST,
        total_used: (creditRow?.total_used ?? 0) + CREDIT_COST,
      })
      .eq("user_id", user.id);

    // Record unlock
    await admin.from("profile_unlocks").insert({
      unlocked_by: user.id,
      profile_user_id,
      unlock_type: "credit",
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
