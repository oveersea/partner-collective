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
    const payload = await req.json();
    const apiKeyInput = typeof payload?.api_key === "string" ? payload.api_key : "";
    const email = typeof payload?.email === "string" ? payload.email.trim() : "";
    const password = typeof payload?.password === "string" ? payload.password : "";

    if (!apiKeyInput || !email || !password) {
      return new Response(JSON.stringify({ error: "api_key, email, and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedApiKey = apiKeyInput
      .trim()
      .replace(/\s+/g, "")
      .replace(/^["']|["']$/g, "");

    if (!normalizedApiKey.startsWith("ovr_")) {
      return new Response(JSON.stringify({ error: "Invalid API key format" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SB_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase env for admin client", {
        hasUrl: Boolean(supabaseUrl),
        hasServiceKey: Boolean(supabaseServiceKey),
      });
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const apiKeyPrefix = normalizedApiKey.slice(0, 12);
    const normalizedBytes = new TextEncoder().encode(normalizedApiKey);
    const normalizedHashBuffer = await crypto.subtle.digest("SHA-256", normalizedBytes);
    const normalizedHash = Array.from(new Uint8Array(normalizedHashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { data: activeKeysByPrefix, error: keyLookupErr } = await supabaseAdmin
      .from("api_keys")
      .select("id, is_active, expires_at, scopes, key_prefix, key_hash")
      .eq("key_prefix", apiKeyPrefix)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5);

    if (keyLookupErr) {
      console.error("API key lookup error:", keyLookupErr);
      return new Response(JSON.stringify({ error: "Failed to validate API key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!activeKeysByPrefix || activeKeysByPrefix.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid or inactive API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = activeKeysByPrefix.find((k) => k.key_hash === normalizedHash);

    if (!apiKey) {
      const errorMessage = normalizedApiKey.length <= 12
        ? "API key looks incomplete. Use full API key, not key prefix."
        : "API key mismatch. Please copy the full key again.";

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "API key expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate password by attempting sign-in
    const { data: signInData, error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr || !signInData?.user) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = signInData.user.id;

    // Generate one-time login token
    const rawToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    const tokenBytes = new TextEncoder().encode(rawToken);
    const tokenHashBuffer = await crypto.subtle.digest("SHA-256", tokenBytes);
    const tokenHash = Array.from(new Uint8Array(tokenHashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const { error: insertErr } = await supabaseAdmin.from("login_tokens").insert({
      token_hash: tokenHash,
      user_id: userId,
      api_key_id: apiKey.id,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
    });

    if (insertErr) {
      console.error("Insert token error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to create login token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update last_used_at on API key
    await supabaseAdmin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKey.id);

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
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
