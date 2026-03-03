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
      const dt = new Date(d);
      return dt.toLocaleDateString("en-US", { year: "numeric" });
    };
    const formatDateFull = (d: string | null) => {
      if (!d) return "";
      return new Date(d).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
    };
    const formatDateRange = (start: string | null, end: string | null, isCurrent: boolean) => {
      const s = formatDateFull(start);
      const e = isCurrent ? "Present" : formatDateFull(end);
      if (!s && !e) return "";
      return `${s} - ${e}`;
    };

    const locationParts = [profile.city, profile.province, profile.country].filter(Boolean);
    const location = locationParts.join(", ");

    // Build contact line for header
    let contactLine = "";
    if (include_contact) {
      const parts: string[] = [];
      if (location) parts.push(location);
      if (profile.phone_number) parts.push(`T: ${profile.phone_number}`);
      if (email) parts.push(`E: ${email}`);
      if (profile.website_url) parts.push(profile.website_url);
      if (parts.length > 0) {
        contactLine = `<div class="header-contact">${parts.join("&nbsp;&nbsp;//&nbsp;&nbsp;")}</div>`;
      }
    }

    // Skills list
    const skills = Array.isArray(profile.skills) ? profile.skills : [];

    // Summary
    const summary = profile.professional_summary || profile.bio;

    // Social links for footer
    const socialLinks: string[] = [];
    if (include_contact) {
      if (profile.linkedin_url) socialLinks.push(`<div class="social-item"><span class="social-icon">in</span> ${profile.linkedin_url.replace(/^https?:\/\/(www\.)?/, '')}</div>`);
      if (profile.website_url) socialLinks.push(`<div class="social-item"><span class="social-icon">⊕</span> ${profile.website_url.replace(/^https?:\/\/(www\.)?/, '')}</div>`);
    }

    // Experiences rows
    const expRows = experiences.map((e: any) => `<div class="timeline-row"><div class="timeline-date">${formatDateRange(e.start_date, e.end_date, e.is_current)}</div><div class="timeline-content"><div class="timeline-company">${e.company || ""}</div><div class="timeline-role">${e.position || e.title || ""}</div>${e.description ? `<p class="timeline-desc">${e.description}</p>` : ""}</div></div>`).join("");

    const eduRows = education.map((e: any) => `<div class="timeline-row"><div class="timeline-date">${formatDateRange(e.start_date, e.end_date, e.is_current)}</div><div class="timeline-content"><div class="timeline-company">${e.degree || ""}${e.field_of_study ? ", " + e.field_of_study : ""}</div><div class="timeline-role">${e.institution || ""}</div>${e.description ? `<p class="timeline-desc">${e.description}</p>` : ""}</div></div>`).join("");

    const certRows = certifications.map((c: any) => `<div class="timeline-row"><div class="timeline-date">${formatDateFull(c.issue_date)}${c.expiry_date ? " - " + formatDateFull(c.expiry_date) : ""}</div><div class="timeline-content"><div class="timeline-company">${c.name || ""}</div><div class="timeline-role">${c.issuing_organization || ""}</div>${c.credential_id ? `<p class="timeline-desc">ID: ${c.credential_id}</p>` : ""}</div></div>`).join("");

    const trainRows = trainings.map((t: any) => `<div class="timeline-row"><div class="timeline-date">${formatDateRange(t.start_date, t.end_date, false)}</div><div class="timeline-content"><div class="timeline-company">${t.title || ""}</div><div class="timeline-role">${t.organizer || ""}</div></div></div>`).join("");

    const awardRows = awards.map((a: any) => `<div class="timeline-row"><div class="timeline-date">${formatDateFull(a.date_received)}</div><div class="timeline-content"><div class="timeline-company">${a.title || ""}</div><div class="timeline-role">${a.issuer || ""}</div>${a.description ? `<p class="timeline-desc">${a.description}</p>` : ""}</div></div>`).join("");

    const orgRows = organizations.map((o: any) => `<div class="timeline-row"><div class="timeline-date">${formatDateRange(o.start_date, o.end_date, o.is_current)}</div><div class="timeline-content"><div class="timeline-company">${o.role || o.position || ""}</div><div class="timeline-role">${o.name || ""}</div></div></div>`).join("");

    // Fetch logo
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
    } catch { /* fallback */ }

    // Avatar
    let avatarHtml = "";
    if (profile.avatar_url) {
      let avatarDataUri = "";
      try {
        const avRes = await fetch(profile.avatar_url);
        if (avRes.ok) {
          const ct = avRes.headers.get("content-type") || "image/jpeg";
          const avBuf = new Uint8Array(await avRes.arrayBuffer());
          let bin = "";
          const cs = 8192;
          for (let i = 0; i < avBuf.length; i += cs) {
            bin += String.fromCharCode(...avBuf.subarray(i, i + cs));
          }
          avatarDataUri = `data:${ct};base64,${btoa(bin)}`;
        }
      } catch { /* skip */ }
      if (avatarDataUri) {
        avatarHtml = `<div class="header-photo"><img src="${avatarDataUri}" alt="Photo" /></div>`;
      }
    }

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CV – ${profile.full_name || "User"}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    color: #222; line-height: 1.5; background: #666;
    font-size: 12px;
  }

  .page {
    width: 210mm; min-height: 297mm; margin: 0 auto;
    background: #fff; position: relative;
    padding: 0;
  }

  /* ═══ HEADER (dark block) ═══ */
  .header {
    background: #1a1a1a; color: #fff; padding: 40px 48px 36px;
    display: flex; justify-content: space-between; align-items: flex-start;
  }
  .header-left { flex: 1; }
  .header-label {
    font-size: 10px; font-weight: 600; letter-spacing: 4px;
    text-transform: uppercase; color: #999; margin-bottom: 8px;
  }
  .header-headline {
    font-size: 11px; font-weight: 500; letter-spacing: 2.5px;
    text-transform: uppercase; color: #bbb; margin-bottom: 10px;
  }
  .header h1 {
    font-size: 38px; font-weight: 900; letter-spacing: -0.5px;
    line-height: 1.05; margin-bottom: 16px; color: #fff;
    text-transform: uppercase;
  }
  .header-contact {
    font-size: 10.5px; color: #aaa; font-weight: 400;
    line-height: 1.8;
  }
  .header-photo {
    width: 130px; height: 130px; flex-shrink: 0;
    margin-left: 32px; overflow: hidden;
  }
  .header-photo img {
    width: 100%; height: 100%; object-fit: cover;
    display: block; filter: grayscale(100%);
  }

  /* ═══ BODY ═══ */
  .body-content { padding: 32px 48px 24px; }

  /* ═══ SECTION ═══ */
  .section { margin-bottom: 28px; }
  .section-title {
    font-size: 12px; font-weight: 700; letter-spacing: 3px;
    text-transform: uppercase; color: #1a1a1a;
    padding-bottom: 10px; margin-bottom: 18px;
    border-bottom: 2px solid #1a1a1a;
  }

  /* ═══ TIMELINE ═══ */
  .timeline-row {
    display: flex; gap: 24px; margin-bottom: 18px;
    page-break-inside: avoid;
  }
  .timeline-date {
    width: 130px; flex-shrink: 0;
    font-size: 11px; font-weight: 600; color: #555;
    padding-top: 1px;
  }
  .timeline-content { flex: 1; }
  .timeline-company {
    font-size: 12.5px; font-weight: 800; color: #1a1a1a;
    text-transform: uppercase; letter-spacing: 0.3px;
    margin-bottom: 1px;
  }
  .timeline-role {
    font-size: 11.5px; font-weight: 500; color: #555;
    font-style: italic; margin-bottom: 4px;
  }
  .timeline-desc {
    font-size: 11px; color: #555; line-height: 1.65;
    margin-top: 4px; white-space: pre-line;
  }

  /* ═══ BOTTOM 3-COL ═══ */
  .bottom-section {
    padding: 24px 48px 32px; border-top: 2px solid #1a1a1a;
    display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 32px;
    margin-top: 8px;
  }
  .bottom-col-title {
    font-size: 11px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; color: #1a1a1a;
    margin-bottom: 12px; padding-bottom: 8px;
    border-bottom: 1px solid #ddd;
  }
  .bottom-col { font-size: 11px; color: #444; line-height: 1.8; }
  .skill-item { font-weight: 500; }
  .social-item { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 10.5px; }
  .social-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 16px; height: 16px; background: #1a1a1a; color: #fff;
    border-radius: 3px; font-size: 9px; font-weight: 700; flex-shrink: 0;
  }

  /* ═══ FOOTER WATERMARK ═══ */
  .footer-bar {
    padding: 12px 48px; background: #f5f5f5;
    display: flex; justify-content: space-between; align-items: center;
  }
  .footer-text { font-size: 8.5px; color: #aaa; font-weight: 500; letter-spacing: 0.5px; }
  .footer-logo { height: 14px; opacity: 0.35; }

  /* ═══ PRINT ═══ */
  .no-print-bar {
    display: flex; justify-content: center; gap: 8px;
    padding: 16px; background: #555;
  }
  .btn-print {
    background: #1a1a1a; color: #fff; border: none;
    padding: 10px 32px; border-radius: 4px; cursor: pointer;
    font-size: 13px; font-weight: 700; font-family: inherit;
    letter-spacing: 1px; text-transform: uppercase;
  }
  .btn-print:hover { background: #333; }
  @media print {
    body { background: #fff; }
    .no-print-bar { display: none !important; }
    .page { width: 100%; margin: 0; }
    .timeline-row { break-inside: avoid; }
    .section { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="no-print-bar">
  <button class="btn-print" onclick="window.print()">⎙ Print / Save as PDF</button>
</div>

<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="header-label">Resume</div>
      ${profile.headline ? `<div class="header-headline">${profile.headline}</div>` : ""}
      <h1>${profile.full_name || "Nama Lengkap"}</h1>
      ${contactLine}
    </div>
    ${avatarHtml}
  </div>

  <div class="body-content">
    ${experiences.length > 0 ? `<div class="section"><div class="section-title">Experience</div>${expRows}</div>` : ""}
    ${education.length > 0 ? `<div class="section"><div class="section-title">Education</div>${eduRows}</div>` : ""}
    ${certifications.length > 0 ? `<div class="section"><div class="section-title">Certifications</div>${certRows}</div>` : ""}
    ${trainings.length > 0 ? `<div class="section"><div class="section-title">Training</div>${trainRows}</div>` : ""}
    ${awards.length > 0 ? `<div class="section"><div class="section-title">Awards</div>${awardRows}</div>` : ""}
    ${organizations.length > 0 ? `<div class="section"><div class="section-title">Organizations</div>${orgRows}</div>` : ""}
  </div>

  <div class="bottom-section">
    <div>
      <div class="bottom-col-title">Skills</div>
      <div class="bottom-col">${skills.length > 0 ? skills.map((s: string) => `<div class="skill-item">${s}</div>`).join("") : "<em style='color:#999'>-</em>"}</div>
    </div>
    <div>
      <div class="bottom-col-title">Summary</div>
      <div class="bottom-col">${summary || "<em style='color:#999'>-</em>"}</div>
    </div>
    <div>
      <div class="bottom-col-title">${socialLinks.length > 0 ? "Social & Links" : "Powered by"}</div>
      <div class="bottom-col">${socialLinks.length > 0 ? socialLinks.join("") : ""}${logoDataUri ? `<div style="margin-top:${socialLinks.length > 0 ? '12' : '0'}px"><img src="${logoDataUri}" alt="Oveersea" style="height:20px;opacity:0.5" /></div>` : ""}</div>
    </div>
  </div>

  <div class="footer-bar">
    <div class="footer-text">Generated by Oveersea · ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
    ${logoDataUri ? `<img src="${logoDataUri}" alt="Oveersea" class="footer-logo" />` : ""}
  </div>
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
