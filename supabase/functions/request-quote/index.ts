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
    const body = await req.json();
    const {
      full_name, email, phone,
      title, description, category, skills_required,
      budget_min, budget_max, currency, deadline,
      is_remote, location, project_scope, project_duration,
      demand_type,
    } = body;

    // Validate required fields
    if (!full_name?.trim() || !email?.trim() || !title?.trim() || !category?.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: full_name, email, title, category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SB_SERVICE_ROLE_KEY")!
    );

    // Step 1: Check if user with this email already exists
    let userId: string | null = null;
    let isNewUser = false;

    const { data: existingUser } = await adminClient.auth.admin.listUsers();
    const found = existingUser?.users?.find(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (found) {
      userId = found.id;
      console.log("Existing user found:", userId);
    } else {
      // Step 2: Auto-create account
      const tempPassword = crypto.randomUUID().slice(0, 16) + "A1!";
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          account_type: "personal",
        },
      });

      if (createErr) {
        console.error("Failed to create user:", createErr);
        return new Response(
          JSON.stringify({ error: "Failed to create account: " + createErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log("New user created:", userId);

      // Update profile with phone
      if (phone?.trim()) {
        await adminClient
          .from("profiles")
          .update({ phone: phone.trim() })
          .eq("user_id", userId);
      }

      // Send password reset email so user can set their own password
      await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: email.trim().toLowerCase(),
      });
    }

    // Step 3: Create the project opportunity
    const slug =
      title.trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 100) +
      "-" +
      Date.now();

    const { data: opportunity, error: oppErr } = await adminClient
      .from("opportunities")
      .insert({
        user_id: userId!,
        title: title.trim(),
        description: description?.trim() || null,
        category: category.trim(),
        skills_required: skills_required || [],
        budget_min: budget_min ? Number(budget_min) : null,
        budget_max: budget_max ? Number(budget_max) : null,
        currency: currency || "IDR",
        deadline: deadline || null,
        is_remote: is_remote ?? true,
        location: is_remote ? null : (location || null),
        project_scope: project_scope || null,
        project_duration: project_duration || null,
        demand_type: demand_type || "partner",
        slug,
        status: "open",
        job_type: "project",
        sla_type: "normal",
      })
      .select("id, slug")
      .single();

    if (oppErr) {
      console.error("Failed to create opportunity:", oppErr);
      return new Response(
        JSON.stringify({ error: "Failed to create project: " + oppErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        is_new_user: isNewUser,
        user_id: userId,
        opportunity_id: opportunity.id,
        opportunity_slug: opportunity.slug,
        message: isNewUser
          ? "Account created and project submitted. A password reset link has been sent to your email."
          : "Project submitted successfully and linked to your existing account.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
