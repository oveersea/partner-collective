import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "npm:qrcode@1.5.4";

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const esc = (s: string | null | undefined) => {
      if (!s) return "";
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    const fmtDate = (d: string | null) => {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    };
    const fmtRange = (start: string | null, end: string | null, isCurrent: boolean) => {
      const s = fmtDate(start);
      const e = isCurrent ? "Present" : fmtDate(end);
      if (!s && !e) return "";
      return `${s} — ${e}`;
    };

    const locationParts = [profile.city, profile.province, profile.country].filter(Boolean);
    const location = locationParts.join(", ");
    const skills = Array.isArray(profile.skills) ? profile.skills : [];
    const summary = profile.professional_summary || profile.bio || "";
    const oveercode = profile.oveercode || "";
    const validationUrl = `https://partner-collective.lovable.app/verification?code=${encodeURIComponent(oveercode)}`;

    // Generate QR code as SVG (high contrast for print)
    let qrSvg = "";
    try {
      qrSvg = await QRCode.toString(validationUrl, {
        type: "svg",
        width: 240,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
    } catch (_e) {
      console.error("QR generation failed:", _e);
    }

    // Contact info
    const contactItems: string[] = [];
    if (include_contact) {
      if (location) contactItems.push(esc(location));
      if (profile.phone_number) contactItems.push(esc(profile.phone_number));
      if (email) contactItems.push(esc(email));
      if (profile.linkedin_url) contactItems.push(esc(profile.linkedin_url));
      if (profile.website_url) contactItems.push(esc(profile.website_url));
    } else {
      if (location) contactItems.push(esc(location));
    }

    // Build sections
    const buildEntry = (date: string, title: string, subtitle: string, desc: string) => `
      <div class="entry">
        <div class="entry-header">
          <div class="entry-title">${title}</div>
          <div class="entry-date">${date}</div>
        </div>
        ${subtitle ? `<div class="entry-subtitle">${subtitle}</div>` : ""}
        ${desc ? `<div class="entry-desc">${desc}</div>` : ""}
      </div>`;

    const expHtml = experiences.map((e: any) => buildEntry(
      fmtRange(e.start_date, e.end_date, e.is_current),
      `${esc(e.position || e.title || "")}`,
      esc(e.company || ""),
      esc(e.description || "")
    )).join("");

    const eduHtml = education.map((e: any) => buildEntry(
      fmtRange(e.start_date, e.end_date, e.is_current),
      `${esc(e.degree || "")}${e.field_of_study ? " in " + esc(e.field_of_study) : ""}`,
      esc(e.institution || ""),
      esc(e.description || "")
    )).join("");

    const certHtml = certifications.map((c: any) => buildEntry(
      fmtDate(c.issue_date) + (c.expiry_date ? ` — ${fmtDate(c.expiry_date)}` : ""),
      esc(c.name || ""),
      esc(c.issuing_organization || ""),
      c.credential_id ? `Credential ID: ${esc(c.credential_id)}` : ""
    )).join("");

    const trainHtml = trainings.map((t: any) => buildEntry(
      fmtRange(t.start_date, t.end_date, false),
      esc(t.title || ""),
      esc(t.organizer || ""),
      ""
    )).join("");

    const awardHtml = awards.map((a: any) => buildEntry(
      fmtDate(a.date_received),
      esc(a.title || ""),
      esc(a.issuer || ""),
      esc(a.description || "")
    )).join("");

    const orgHtml = organizations.map((o: any) => buildEntry(
      fmtRange(o.start_date, o.end_date, o.is_current),
      `${esc(o.role || o.position || "")}`,
      esc(o.name || ""),
      ""
    )).join("");

    const section = (title: string, content: string) => content ? `
      <div class="section">
        <h2>${title}</h2>
        ${content}
      </div>` : "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CV – ${esc(profile.full_name) || "User"}</title>
<style>
  @page { margin: 12mm 16mm; size: A4; }
  *, *::before, *::after { margin: 0 !important; padding: 0 !important; box-sizing: border-box !important; border: none !important; }

  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, Helvetica, sans-serif !important;
    font-size: 9.5pt !important;
    color: #1a1a1a !important;
    line-height: 1.45 !important;
    background: #6b7280 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: #fff !important;
    padding: 40px 48px;
    color: #1a1a1a !important;
  }

  /* ── NAME & CONTACT ── */
  .cv-header { margin-bottom: 20px; }
  .cv-header-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }
  .cv-avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 2px solid #D71920;
  }
  .cv-header-info { flex: 1; }
  .cv-accent-bar {
    height: 4px;
    background: #D71920;
    margin-bottom: 16px;
    border-radius: 2px;
  }
  .cv-name {
    font-size: 22pt !important;
    font-weight: 700 !important;
    color: #111 !important;
    letter-spacing: -0.3px;
    line-height: 1.15;
  }
  .cv-headline {
    font-size: 10.5pt !important;
    color: #555 !important;
    font-weight: 500 !important;
    margin-top: 3px;
  }
  .cv-contact {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    font-size: 8.5pt;
    color: #444;
  }
  .cv-contact span { white-space: nowrap; }
  .cv-divider {
    border: none;
    border-top: 2px solid #D71920;
    margin: 16px 0 0;
  }

  /* ── SECTIONS ── */
  .section { margin-top: 18px; }
  .section h2 {
    font-size: 9pt !important;
    font-weight: 700 !important;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #D71920 !important;
    border-bottom: 1px solid #e5e7eb !important;
    padding-bottom: 5px;
    margin-bottom: 10px !important;
  }

  /* ── ENTRIES ── */
  .entry { margin-bottom: 12px; page-break-inside: avoid; }
  .entry:last-child { margin-bottom: 0; }
  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .entry-title {
    font-size: 9.5pt !important;
    font-weight: 600 !important;
    color: #111 !important;
  }
  .entry-date {
    font-size: 8.5pt !important;
    color: #666 !important;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .entry-subtitle {
    font-size: 9pt !important;
    color: #555 !important;
    margin-top: 1px;
  }
  .entry-desc {
    font-size: 8.5pt !important;
    color: #444 !important;
    margin-top: 4px;
    line-height: 1.55;
    white-space: pre-line;
  }

  /* ── SKILLS ── */
  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .skill-tag {
    font-size: 8pt;
    font-weight: 500;
    color: #333;
    background: #f3f4f6;
    padding: 3px 10px;
    border-radius: 3px;
    border: 1px solid #e5e7eb;
  }

  /* ── SUMMARY ── */
  .summary-text {
    font-size: 9pt;
    color: #333;
    line-height: 1.6;
  }

  /* ── FOOTER ── */
  .cv-footer {
    margin-top: 24px;
    padding-top: 14px;
    border-top: 2px solid #D71920;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 7pt;
    color: #999;
  }
  .cv-footer-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cv-footer-logo {
    height: 20px;
    opacity: 0.7;
  }
  .cv-footer-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .qr-wrapper {
    width: 78px;
    height: 78px;
    flex-shrink: 0;
  }
  .qr-wrapper svg {
    width: 78px;
    height: 78px;
    display: block;
    background: #fff;
  }
  .qr-wrapper svg path,
  .qr-wrapper svg rect {
    fill: #000 !important;
  }
  .qr-label {
    font-size: 6.5pt;
    color: #999;
    text-align: right;
    line-height: 1.4;
    max-width: 100px;
  }
  .qr-label strong {
    color: #D71920;
    font-weight: 600;
    font-size: 7pt;
  }

  /* ── PRINT BAR ── */
  .print-bar {
    display: flex; justify-content: center; gap: 8px;
    padding: 14px; background: #374151;
  }
  .btn-print {
    background: #fff; color: #111; border: none;
    padding: 10px 36px; border-radius: 6px; cursor: pointer;
    font-size: 13px; font-weight: 600; font-family: inherit;
  }
  .btn-print:hover { background: #f3f4f6; }

  @media print {
    body { background: #fff; }
    .print-bar { display: none !important; }
    .page { width: 100%; min-height: auto; margin: 0; padding: 0; }
    .section { break-inside: avoid; }
    .entry { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="print-bar">
  <button class="btn-print" onclick="window.print()">⎙ Print / Save as PDF</button>
</div>

<div class="page">
  <div class="cv-header">
    <div class="cv-accent-bar"></div>
    <div class="cv-header-row">
      ${profile.avatar_url ? `<img class="cv-avatar" src="${esc(profile.avatar_url)}" alt="Photo" />` : ""}
      <div class="cv-header-info">
        <div class="cv-name">${esc(profile.full_name) || "Full Name"}</div>
        ${profile.headline ? `<div class="cv-headline">${esc(profile.headline)}</div>` : ""}
        ${contactItems.length > 0 ? `<div class="cv-contact">${contactItems.map(c => `<span>${c}</span>`).join('<span style="color:#D71920">|</span>')}</div>` : ""}
      </div>
    </div>
    <hr class="cv-divider" />
  </div>

  ${summary ? `
  <div class="section">
    <h2>Summary</h2>
    <div class="summary-text">${esc(summary)}</div>
  </div>` : ""}

  ${skills.length > 0 ? `
  <div class="section">
    <h2>Skills</h2>
    <div class="skills-list">${skills.map((s: string) => `<span class="skill-tag">${esc(s)}</span>`).join("")}</div>
  </div>` : ""}

  ${section("Work Experience", expHtml)}
  ${section("Education", eduHtml)}
  ${section("Certifications", certHtml)}
  ${section("Training", trainHtml)}
  ${section("Awards & Achievements", awardHtml)}
  ${section("Organizations", orgHtml)}

  <div class="cv-footer">
    <div class="cv-footer-left">
      <img src="https://partner-collective.lovable.app/oveersea-logo-dark-cv.png" alt="Oveersea" class="cv-footer-logo" />
      <span>Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
    </div>
    <div class="cv-footer-right">
      <div class="qr-label">
        Scan to verify<br/>
        <strong>${esc(oveercode)}</strong>
      </div>
      ${qrSvg ? `
      <div class="qr-wrapper">
        ${qrSvg}
      </div>` : ""}
    </div>
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
