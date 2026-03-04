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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub as string;

    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: callerId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get all candidates with emails that have matching auth users
    const { data: candidates, error: candErr } = await admin
      .from("candidates_archive")
      .select("*")
      .not("email", "is", null)
      .order("created_at", { ascending: true });

    if (candErr) throw new Error("Failed to fetch candidates: " + candErr.message);

    // Get all auth users
    const { data: { users }, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (usersErr) throw new Error("Failed to fetch users: " + usersErr.message);

    const emailToUserId = new Map<string, string>();
    for (const u of users) {
      if (u.email) emailToUserId.set(u.email.toLowerCase(), u.id);
    }

    const results: { email: string; status: string; details?: string }[] = [];

    for (const cand of candidates || []) {
      const email = cand.email?.trim().toLowerCase();
      if (!email) continue;

      const userId = emailToUserId.get(email);
      if (!userId) {
        results.push({ email, status: "skipped", details: "No auth user found" });
        continue;
      }

      try {
        // Check if user already has data
        const { count: expCount } = await admin.from("user_experiences").select("id", { count: "exact", head: true }).eq("user_id", userId);
        const { count: eduCount } = await admin.from("user_education").select("id", { count: "exact", head: true }).eq("user_id", userId);

        if ((expCount || 0) > 0 || (eduCount || 0) > 0) {
          results.push({ email, status: "skipped", details: "Already has profile data" });
          continue;
        }

        // Update profile
        const profileUpdate: Record<string, any> = {};
        if (cand.phone) profileUpdate.phone_number = cand.phone;
        if (cand.city) profileUpdate.city = cand.city;
        if (cand.country) profileUpdate.country = cand.country;
        if (cand.nationality) profileUpdate.nationality = cand.nationality;
        if (cand.current_title) profileUpdate.headline = cand.current_title;
        if (cand.summary) profileUpdate.professional_summary = cand.summary;
        if (cand.skills && cand.skills.length > 0) profileUpdate.skills = cand.skills;
        if (cand.languages && Array.isArray(cand.languages) && cand.languages.length > 0) {
          profileUpdate.languages = cand.languages.map((l: any) =>
            typeof l === "string" ? l : `${l.language || ""}${l.proficiency ? ` (${l.proficiency})` : ""}`
          ).join(", ");
        }

        if (Object.keys(profileUpdate).length > 0) {
          await admin.from("profiles").update(profileUpdate).eq("user_id", userId);
        }

        // Insert work experiences
        let expInserted = 0;
        if (cand.work_experience && Array.isArray(cand.work_experience) && cand.work_experience.length > 0) {
          const experiences = cand.work_experience.map((exp: any) => ({
            user_id: userId,
            company: exp.company || "Unknown Company",
            position: exp.title || exp.position || "Unknown Position",
            start_date: exp.start_date || null,
            end_date: exp.is_current ? null : (exp.end_date || null),
            is_current: exp.is_current || false,
            description: exp.description || null,
            location: exp.location || null,
            status: "approved",
            reviewed_by: callerId,
            reviewed_at: new Date().toISOString(),
          }));
          const { error } = await admin.from("user_experiences").insert(experiences);
          if (!error) expInserted = experiences.length;
        }

        // Insert education
        let eduInserted = 0;
        if (cand.education && Array.isArray(cand.education) && cand.education.length > 0) {
          const education = cand.education.map((edu: any) => ({
            user_id: userId,
            institution: edu.institution || "Unknown Institution",
            degree: edu.degree || null,
            field_of_study: edu.field_of_study || null,
            start_date: edu.start_year ? `${edu.start_year}-01-01` : (edu.start_date || null),
            end_date: edu.end_year ? `${edu.end_year}-01-01` : (edu.end_date || null),
            description: edu.gpa ? `GPA: ${edu.gpa}` : null,
            status: "approved",
            reviewed_by: callerId,
            reviewed_at: new Date().toISOString(),
          }));
          const { error } = await admin.from("user_education").insert(education);
          if (!error) eduInserted = education.length;
        }

        // Insert certifications
        let certInserted = 0;
        if (cand.certifications && Array.isArray(cand.certifications) && cand.certifications.length > 0) {
          const certs = cand.certifications.map((cert: any) => ({
            user_id: userId,
            name: cert.name || "Unknown Certification",
            issuing_organization: cert.issuer || "Unknown",
            issue_date: cert.year ? `${cert.year}-01-01` : (cert.issue_date || null),
            status: "approved",
            reviewed_by: callerId,
            reviewed_at: new Date().toISOString(),
          }));
          const { error } = await admin.from("user_certifications").insert(certs);
          if (!error) certInserted = certs.length;
        }

        results.push({
          email,
          status: "migrated",
          details: `exp:${expInserted}, edu:${eduInserted}, cert:${certInserted}`,
        });
      } catch (err) {
        results.push({ email, status: "error", details: String(err) });
      }
    }

    const migrated = results.filter(r => r.status === "migrated").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const errors = results.filter(r => r.status === "error").length;

    return new Response(
      JSON.stringify({ success: true, summary: { total: results.length, migrated, skipped, errors }, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("migrate-cv-data error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
