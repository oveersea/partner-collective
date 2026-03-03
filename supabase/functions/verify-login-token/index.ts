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
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "token is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Hash the token
    const tokenBytes = new TextEncoder().encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", tokenBytes);
    const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    // Find and validate token
    const { data: loginToken, error: findErr } = await supabaseAdmin
      .from("login_tokens")
      .select("id, user_id, expires_at, used_at, api_key_id")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (findErr || !loginToken) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (loginToken.used_at) {
      return new Response(JSON.stringify({ error: "Token already used" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(loginToken.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark token as used
    await supabaseAdmin.from("login_tokens").update({ used_at: new Date().toISOString() }).eq("id", loginToken.id);

    // Generate a Supabase magic link (OTP) for the user
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(loginToken.user_id);
    if (!userData?.user?.email) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a session directly using admin API
    const { data: sessionData, error: sessionErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: userData.user.email,
    });

    if (sessionErr || !sessionData) {
      console.error("Session error:", sessionErr);
      return new Response(JSON.stringify({ error: "Failed to create session" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the hashed_token from the generated link properties
    const hashedToken = sessionData.properties?.hashed_token;
    const verifyType = "magiclink";

    return new Response(JSON.stringify({
      success: true,
      email: userData.user.email,
      hashed_token: hashedToken,
      verify_type: verifyType,
      user_id: loginToken.user_id,
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
