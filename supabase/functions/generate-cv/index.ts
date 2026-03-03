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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Use service role client for data fetching
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["admin", "superadmin"]);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, include_contact } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all data in parallel
    const [profileRes, eduRes, expRes, certRes, trainRes, awardRes, orgRes, emailRes] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user_id).single(),
        supabase.from("user_education").select("*").eq("user_id", user_id).order("start_date", { ascending: false }),
        supabase.from("user_experiences").select("*").eq("user_id", user_id).order("start_date", { ascending: false }),
        supabase.from("user_certifications").select("*").eq("user_id", user_id).order("issue_date", { ascending: false }),
        supabase.from("user_trainings").select("*").eq("user_id", user_id).order("start_date", { ascending: false }),
        supabase.from("user_awards").select("*").eq("user_id", user_id).order("date_received", { ascending: false }),
        supabase.from("user_organizations").select("*").eq("user_id", user_id).order("start_date", { ascending: false }),
        supabase.rpc("get_user_email", { target_user_id: user_id }),
      ]);

    const profile = profileRes.data;
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = emailRes.data as string | null;
    const education = eduRes.data || [];
    const experiences = expRes.data || [];
    const certifications = certRes.data || [];
    const trainings = trainRes.data || [];
    const awards = awardRes.data || [];
    const organizations = orgRes.data || [];

    const formatDate = (d: string | null) => {
      if (!d) return "";
      return new Date(d).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
    };

    const locationParts = [profile.city, profile.province, profile.country].filter(Boolean);
    const location = locationParts.join(", ");

    // Build contact section
    let contactHtml = "";
    if (include_contact) {
      const contactParts: string[] = [];
      if (email) contactParts.push(`📧 ${email}`);
      if (profile.phone_number) contactParts.push(`📱 ${profile.phone_number}`);
      if (location) contactParts.push(`📍 ${location}`);
      if (profile.linkedin_url) contactParts.push(`🔗 <a href="${profile.linkedin_url}" style="color:#2563eb;">${profile.linkedin_url}</a>`);
      if (profile.website_url) contactParts.push(`🌐 <a href="${profile.website_url}" style="color:#2563eb;">${profile.website_url}</a>`);
      if (contactParts.length > 0) {
        contactHtml = `<div style="color:#555;font-size:13px;margin-top:8px;">${contactParts.join(" &nbsp;|&nbsp; ")}</div>`;
      }
    }

    // Skills
    const skills = Array.isArray(profile.skills) ? profile.skills : [];
    const skillsHtml = skills.length > 0
      ? `<div class="section"><h2>SKILLS</h2><div style="display:flex;flex-wrap:wrap;gap:6px;">${skills.map((s: string) => `<span style="background:#e2e8f0;padding:3px 10px;border-radius:12px;font-size:12px;">${s}</span>`).join("")}</div></div>`
      : "";

    // Summary
    const summary = profile.professional_summary || profile.bio;
    const summaryHtml = summary
      ? `<div class="section"><h2>RINGKASAN PROFESIONAL</h2><p>${summary}</p></div>`
      : "";

    // Experiences
    const expHtml = experiences.length > 0
      ? `<div class="section"><h2>PENGALAMAN KERJA</h2>${experiences.map((e: any) => `<div class="item"><div class="item-header"><strong>${e.position || e.title || ""}</strong> @ ${e.company || ""}</div><div class="item-date">${formatDate(e.start_date)} – ${e.is_current ? "Sekarang" : formatDate(e.end_date)}</div>${e.description ? `<p class="item-desc">${e.description}</p>` : ""}</div>`).join("")}</div>`
      : "";

    // Education
    const eduHtml = education.length > 0
      ? `<div class="section"><h2>PENDIDIKAN</h2>${education.map((e: any) => `<div class="item"><div class="item-header"><strong>${e.degree || ""}${e.field_of_study ? ", " + e.field_of_study : ""}</strong> @ ${e.institution || ""}</div><div class="item-date">${formatDate(e.start_date)} – ${e.is_current ? "Sekarang" : formatDate(e.end_date)}</div>${e.description ? `<p class="item-desc">${e.description}</p>` : ""}</div>`).join("")}</div>`
      : "";

    // Certifications
    const certHtml = certifications.length > 0
      ? `<div class="section"><h2>SERTIFIKASI</h2>${certifications.map((c: any) => `<div class="item"><div class="item-header"><strong>${c.name || ""}</strong> – ${c.issuing_organization || ""}</div><div class="item-date">${formatDate(c.issue_date)}${c.expiry_date ? " – " + formatDate(c.expiry_date) : ""}</div>${c.credential_id ? `<p class="item-desc">ID: ${c.credential_id}</p>` : ""}</div>`).join("")}</div>`
      : "";

    // Trainings
    const trainHtml = trainings.length > 0
      ? `<div class="section"><h2>PELATIHAN</h2>${trainings.map((t: any) => `<div class="item"><div class="item-header"><strong>${t.title || ""}</strong> – ${t.organizer || ""}</div><div class="item-date">${formatDate(t.start_date)}${t.end_date ? " – " + formatDate(t.end_date) : ""}</div></div>`).join("")}</div>`
      : "";

    // Awards
    const awardHtml = awards.length > 0
      ? `<div class="section"><h2>PENGHARGAAN</h2>${awards.map((a: any) => `<div class="item"><div class="item-header"><strong>${a.title || ""}</strong> – ${a.issuer || ""}</div><div class="item-date">${formatDate(a.date_received)}</div>${a.description ? `<p class="item-desc">${a.description}</p>` : ""}</div>`).join("")}</div>`
      : "";

    // Organizations
    const orgHtml = organizations.length > 0
      ? `<div class="section"><h2>ORGANISASI</h2>${organizations.map((o: any) => `<div class="item"><div class="item-header"><strong>${o.role || o.position || ""}</strong> @ ${o.name || ""}</div><div class="item-date">${formatDate(o.start_date)} – ${o.is_current ? "Sekarang" : formatDate(o.end_date)}</div></div>`).join("")}</div>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CV – ${profile.full_name || "User"}</title>
<style>
  @page { margin: 15mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 32px 24px; }
  .header { border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 20px; }
  .header h1 { font-size: 28px; font-weight: 700; color: #0f766e; margin-bottom: 2px; }
  .header .headline { font-size: 15px; color: #555; }
  .section { margin-bottom: 20px; }
  .section h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #0f766e; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-bottom: 10px; }
  .section p { font-size: 13px; color: #333; }
  .item { margin-bottom: 12px; }
  .item-header { font-size: 14px; }
  .item-date { font-size: 12px; color: #777; }
  .item-desc { font-size: 12px; color: #555; margin-top: 2px; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="no-print" style="text-align:right;margin-bottom:16px;">
  <button onclick="window.print()" style="background:#0f766e;color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ Print / Save as PDF</button>
</div>
<div class="header">
  <h1>${profile.full_name || "Nama Lengkap"}</h1>
  ${profile.headline ? `<div class="headline">${profile.headline}</div>` : ""}
  ${contactHtml}
</div>
${summaryHtml}
${skillsHtml}
${expHtml}
${eduHtml}
${certHtml}
${trainHtml}
${awardHtml}
${orgHtml}
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
