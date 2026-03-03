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
      const contactItems: string[] = [];
      if (email) contactItems.push(`<span class="contact-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>${email}</span>`);
      if (profile.phone_number) contactItems.push(`<span class="contact-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${profile.phone_number}</span>`);
      if (location) contactItems.push(`<span class="contact-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>${location}</span>`);
      if (profile.linkedin_url) contactItems.push(`<span class="contact-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg><a href="${profile.linkedin_url}">LinkedIn</a></span>`);
      if (profile.website_url) contactItems.push(`<span class="contact-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><a href="${profile.website_url}">Website</a></span>`);
      if (contactItems.length > 0) {
        contactHtml = `<div class="contact-bar">${contactItems.join("")}</div>`;
      }
    }

    // Skills
    const skills = Array.isArray(profile.skills) ? profile.skills : [];
    const skillsHtml = skills.length > 0
      ? `<div class="section"><h2>Keahlian</h2><div class="skills-grid">${skills.map((s: string) => `<span class="skill-tag">${s}</span>`).join("")}</div></div>`
      : "";

    // Summary
    const summary = profile.professional_summary || profile.bio;
    const summaryHtml = summary
      ? `<div class="section"><h2>Ringkasan Profesional</h2><p class="summary-text">${summary}</p></div>`
      : "";

    // Experiences
    const expHtml = experiences.length > 0
      ? `<div class="section"><h2>Pengalaman Kerja</h2>${experiences.map((e: any) => `<div class="entry"><div class="entry-row"><div class="entry-title"><strong>${e.position || e.title || ""}</strong><span class="entry-org">${e.company || ""}</span></div><div class="entry-date">${formatDate(e.start_date)} – ${e.is_current ? "Sekarang" : formatDate(e.end_date)}</div></div>${e.description ? `<p class="entry-desc">${e.description}</p>` : ""}</div>`).join("")}</div>`
      : "";

    // Education
    const eduHtml = education.length > 0
      ? `<div class="section"><h2>Pendidikan</h2>${education.map((e: any) => `<div class="entry"><div class="entry-row"><div class="entry-title"><strong>${e.degree || ""}${e.field_of_study ? ", " + e.field_of_study : ""}</strong><span class="entry-org">${e.institution || ""}</span></div><div class="entry-date">${formatDate(e.start_date)} – ${e.is_current ? "Sekarang" : formatDate(e.end_date)}</div></div>${e.description ? `<p class="entry-desc">${e.description}</p>` : ""}</div>`).join("")}</div>`
      : "";

    // Certifications
    const certHtml = certifications.length > 0
      ? `<div class="section"><h2>Sertifikasi</h2>${certifications.map((c: any) => `<div class="entry"><div class="entry-row"><div class="entry-title"><strong>${c.name || ""}</strong><span class="entry-org">${c.issuing_organization || ""}</span></div><div class="entry-date">${formatDate(c.issue_date)}${c.expiry_date ? " – " + formatDate(c.expiry_date) : ""}</div></div>${c.credential_id ? `<p class="entry-desc">Credential ID: ${c.credential_id}</p>` : ""}</div>`).join("")}</div>`
      : "";

    // Trainings
    const trainHtml = trainings.length > 0
      ? `<div class="section"><h2>Pelatihan</h2>${trainings.map((t: any) => `<div class="entry"><div class="entry-row"><div class="entry-title"><strong>${t.title || ""}</strong><span class="entry-org">${t.organizer || ""}</span></div><div class="entry-date">${formatDate(t.start_date)}${t.end_date ? " – " + formatDate(t.end_date) : ""}</div></div></div>`).join("")}</div>`
      : "";

    // Awards
    const awardHtml = awards.length > 0
      ? `<div class="section"><h2>Penghargaan</h2>${awards.map((a: any) => `<div class="entry"><div class="entry-row"><div class="entry-title"><strong>${a.title || ""}</strong><span class="entry-org">${a.issuer || ""}</span></div><div class="entry-date">${formatDate(a.date_received)}</div></div>${a.description ? `<p class="entry-desc">${a.description}</p>` : ""}</div>`).join("")}</div>`
      : "";

    // Organizations
    const orgHtml = organizations.length > 0
      ? `<div class="section"><h2>Organisasi</h2>${organizations.map((o: any) => `<div class="entry"><div class="entry-row"><div class="entry-title"><strong>${o.role || o.position || ""}</strong><span class="entry-org">${o.name || ""}</span></div><div class="entry-date">${formatDate(o.start_date)} – ${o.is_current ? "Sekarang" : formatDate(o.end_date)}</div></div></div>`).join("")}</div>`
      : "";

    const primaryColor = "#D71920";

    // Fetch logo and convert to base64 data URI — chunked to avoid stack overflow
    let logoDataUri = "";
    try {
      const logoRes = await fetch("https://partner-collective.lovable.app/oveersea-logo-dark-cv.png");
      if (logoRes.ok) {
        const logoBuffer = new Uint8Array(await logoRes.arrayBuffer());
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < logoBuffer.length; i += chunkSize) {
          binary += String.fromCharCode(...logoBuffer.subarray(i, i + chunkSize));
        }
        logoDataUri = `data:image/png;base64,${btoa(binary)}`;
      }
    } catch {
      // fallback handled below
    }

    const logoHtml = logoDataUri
      ? `<img src="${logoDataUri}" alt="Oveersea" class="logo" />`
      : `<span class="logo-text">OVEERSEA</span>`;

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CV – ${profile.full_name || "User"}</title>
<style>
  @page { margin: 14mm 16mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1e293b; line-height: 1.55; max-width: 820px;
    margin: 0 auto; padding: 40px 32px; background: #fff;
  }

  /* Header */
  .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 20px; margin-bottom: 24px; border-bottom: 3px solid ${primaryColor}; }
  .header-info { flex: 1; }
  .header h1 { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; margin-bottom: 2px; }
  .header .headline { font-size: 14px; color: #64748b; font-weight: 500; }
  .logo { height: 36px; object-fit: contain; }
  .logo-text { font-size: 22px; font-weight: 800; color: ${primaryColor}; letter-spacing: 1px; }

  /* Contact Bar */
  .contact-bar { display: flex; flex-wrap: wrap; gap: 12px 20px; margin-top: 14px; padding: 12px 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
  .contact-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; }
  .contact-item svg { color: ${primaryColor}; flex-shrink: 0; }
  .contact-item a { color: ${primaryColor}; text-decoration: none; }

  /* Sections */
  .section { margin-bottom: 22px; }
  .section h2 {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 2px; color: ${primaryColor};
    padding-bottom: 6px; margin-bottom: 12px;
    border-bottom: 1.5px solid #fecaca;
  }
  .summary-text { font-size: 13px; color: #334155; line-height: 1.7; }

  /* Skills */
  .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag {
    background: linear-gradient(135deg, #fff1f2, #fee2e2);
    color: ${primaryColor}; padding: 4px 12px; border-radius: 20px;
    font-size: 11px; font-weight: 600; border: 1px solid #fecaca;
  }

  /* Entries */
  .entry { margin-bottom: 14px; padding-left: 12px; border-left: 2px solid #e2e8f0; }
  .entry:hover { border-left-color: ${primaryColor}; }
  .entry-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .entry-title { flex: 1; }
  .entry-title strong { font-size: 13.5px; color: #0f172a; }
  .entry-org { display: block; font-size: 12.5px; color: #64748b; margin-top: 1px; }
  .entry-date { font-size: 11.5px; color: #94a3b8; white-space: nowrap; font-weight: 500; }
  .entry-desc { font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.6; }

  /* Footer */
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .footer-text { font-size: 10px; color: #94a3b8; }
  .footer-logo { height: 18px; opacity: 0.5; }

  /* Print */
  .no-print-bar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 20px; }
  .btn-print {
    background: ${primaryColor}; color: #fff; border: none;
    padding: 10px 28px; border-radius: 8px; cursor: pointer;
    font-size: 13px; font-weight: 600; transition: opacity 0.2s;
  }
  .btn-print:hover { opacity: 0.9; }
  @media print {
    body { padding: 0; }
    .no-print-bar { display: none; }
    .entry { break-inside: avoid; }
    .section { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="no-print-bar">
  <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
</div>

<div class="header">
  <div class="header-info">
    <h1>${profile.full_name || "Nama Lengkap"}</h1>
    ${profile.headline ? `<div class="headline">${profile.headline}</div>` : ""}
    ${contactHtml}
  </div>
  <div style="margin-left:24px;flex-shrink:0;">${logoHtml}</div>
</div>

${summaryHtml}
${skillsHtml}
${expHtml}
${eduHtml}
${certHtml}
${trainHtml}
${awardHtml}
${orgHtml}

<div class="footer">
  <div class="footer-text">Generated by Oveersea · ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
  ${logoDataUri ? `<img src="${logoDataUri}" alt="Oveersea" class="footer-logo" />` : ""}
</div>

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
