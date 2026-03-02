import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteEntry {
  full_name: string;
  email: string;
  phone_number: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SB_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "superadmin"]);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invites } = await req.json() as { invites: InviteEntry[] };

    if (!invites || !Array.isArray(invites) || invites.length === 0) {
      return new Response(JSON.stringify({ error: "No invites provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invites.length > 20) {
      return new Response(JSON.stringify({ error: "Maximum 20 invites per batch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const invite of invites) {
      const email = invite.email?.trim().toLowerCase();
      const fullName = invite.full_name?.trim();
      const phone = invite.phone_number?.trim();

      if (!email || !fullName) {
        results.push({ email: email || "unknown", success: false, error: "Name and email required" });
        continue;
      }

      try {
        const { data: inviteData, error: inviteError } =
          await adminClient.auth.admin.inviteUserByEmail(email, {
            data: { full_name: fullName, phone_number: phone },
          });

        if (inviteError) {
          results.push({ email, success: false, error: inviteError.message });
          continue;
        }

        // Update profile with phone number if provided
        if (inviteData?.user?.id && phone) {
          await adminClient
            .from("profiles")
            .update({ phone_number: phone })
            .eq("user_id", inviteData.user.id);
        }

        // Log invitation
        await adminClient.from("user_invitations").insert({
          email,
          full_name: fullName,
          phone_number: phone || null,
          invited_by: user.id,
          status: "pending",
        });

        results.push({ email, success: true });
      } catch (e) {
        results.push({ email, success: false, error: String(e) });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({ results, summary: { total: invites.length, success: successCount, failed: failCount } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
