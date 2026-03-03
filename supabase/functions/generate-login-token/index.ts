import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { api_key, email } = await req.json();
    if (!api_key || !email) {
      return new Response(JSON.stringify({ error: "api_key and email are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Hash the API key
    const keyBytes = new TextEncoder().encode(api_key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", keyBytes);
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    // Validate API key
    const { data: apiKey, error: keyErr } = await supabaseAdmin
      .from("api_keys")
      .select("id, is_active, expires_at, scopes")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .maybeSingle();

    if (keyErr || !apiKey) {
      return new Response(JSON.stringify({ error: "Invalid or inactive API key" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "API key expired" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by email
    const { data: userData } = await supabaseAdmin.rpc("get_user_id_by_email", { target_email: email });
    if (!userData) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate one-time login token
    const rawToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    const tokenBytes = new TextEncoder().encode(rawToken);
    const tokenHashBuffer = await crypto.subtle.digest("SHA-256", tokenBytes);
    const tokenHash = Array.from(new Uint8Array(tokenHashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    const { error: insertErr } = await supabaseAdmin.from("login_tokens").insert({
      token_hash: tokenHash,
      user_id: userData,
      api_key_id: apiKey.id,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
    });

    if (insertErr) {
      console.error("Insert token error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to create login token" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update last_used_at on API key
    await supabaseAdmin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKey.id);

    const appUrl = Deno.env.get("APP_URL") || "https://oveersea.com";
    const verificationUrl = `${appUrl}/verification?token=${encodeURIComponent(rawToken)}`;

    return new Response(JSON.stringify({
      verification_url: verificationUrl,
      token: rawToken,
      expires_in: 900, // 15 minutes in seconds
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
