import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "npm:qrcode@1.5.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── SVG Radar Chart Generator ── */
function generateRadarSvg(
  skills: { name: string; score: number }[],
  strokeColor: string,
  fillColor: string,
  size = 280
): string {
  if (skills.length === 0) return "";
  const data = [...skills].sort((a, b) => b.score - a.score).slice(0, 8);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const n = data.length;
  const levels = [25, 50, 75, 100];

  const getPoint = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  // Grid lines
  let gridLines = "";
  for (const lvl of levels) {
    const r = (lvl / 100) * radius;
    const pts = Array.from({ length: n }, (_, i) => {
      const p = getPoint(i, r);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");
    gridLines += `<polygon points="${pts}" fill="none" stroke="#e5e7eb" stroke-width="0.8"/>`;
  }

  // Axis lines
  let axisLines = "";
  for (let i = 0; i < n; i++) {
    const p = getPoint(i, radius);
    axisLines += `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#e5e7eb" stroke-width="0.5"/>`;
  }

  // Labels
  let labels = "";
  for (let i = 0; i < n; i++) {
    const p = getPoint(i, radius + 18);
    const anchor =
      Math.abs(p.x - cx) < 5 ? "middle" : p.x > cx ? "start" : "end";
    labels += `<text x="${p.x.toFixed(1)}" y="${(p.y + 3).toFixed(1)}" text-anchor="${anchor}" font-size="7.5" fill="#666" font-family="'Segoe UI', Arial, sans-serif">${esc(data[i].name)}</text>`;
  }

  // Data polygon
  const dataPts = data
    .map((d, i) => {
      const r = (d.score / 100) * radius;
      const p = getPoint(i, r);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}${axisLines}
    <polygon points="${dataPts}" fill="${fillColor}" fill-opacity="0.5" stroke="${strokeColor}" stroke-width="1.5"/>
    ${labels}
  </svg>`;
}

const esc = (s: string | null | undefined) => {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const fmtDate = (d: string | null) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const fmtDateFull = (d: string | null) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

const fmtRange = (start: string | null, end: string | null, isCurrent: boolean) => {
  const s = fmtDate(start);
  const e = isCurrent ? "Present" : fmtDate(end);
  if (!s && !e) return "";
  return `${s} — ${e}`;
};

const genderLabel: Record<string, string> = { male: "Male", female: "Female" };
const maritalLabel: Record<string, string> = { single: "Single", married: "Married", divorced: "Divorced", widowed: "Widowed" };
const availabilityLabel: Record<string, string> = { available: "Available", open: "Open to Opportunities", busy: "Busy", unavailable: "Not Available", not_available: "Not Available" };

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

    const profile = profileRes.data as any;
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

    const locationParts = [profile.city, profile.province, profile.country].filter(Boolean);
    const location = locationParts.join(", ");
    const skills: string[] = Array.isArray(profile.skills) ? profile.skills : [];
    const softSkills: { name: string; score: number }[] = Array.isArray(profile.soft_skills) ? profile.soft_skills : [];
    const technicalSkills: { name: string; score: number }[] = Array.isArray(profile.technical_skills) ? profile.technical_skills : [];
    const summary = profile.professional_summary || profile.bio || "";
    const oveercode = profile.oveercode || "";
    const validationUrl = `https://oveersea.com/p/${encodeURIComponent(oveercode)}`;

    // Generate QR code as SVG
    let qrSvg = "";
    try {
      qrSvg = await QRCode.toString(validationUrl, {
        type: "svg",
        width: 240,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
    } catch (_e) {
      console.error("QR generation failed:", _e);
    }

    // Contact info
    const contactItems: string[] = [];
    if (include_contact) {
      if (profile.phone_number) contactItems.push(`<span class="ci">📞 ${esc(profile.phone_number)}</span>`);
      if (email) contactItems.push(`<span class="ci">✉️ ${esc(email)}</span>`);
      if (profile.linkedin_url) contactItems.push(`<span class="ci">🔗 ${esc(profile.linkedin_url)}</span>`);
      if (profile.website_url) contactItems.push(`<span class="ci">🌐 ${esc(profile.website_url)}</span>`);
    }

    // Generate radar SVGs
    const techRadarSvg = generateRadarSvg(technicalSkills, "#D71920", "#D71920");
    const softRadarSvg = generateRadarSvg(softSkills, "#555", "#888");

    // Build entry HTML
    const buildEntry = (date: string, title: string, subtitle: string, desc: string, location?: string) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <div class="entry-title">${title}</div>
            ${subtitle ? `<div class="entry-subtitle">${subtitle}</div>` : ""}
            ${location ? `<div class="entry-location">📍 ${location}</div>` : ""}
          </div>
          <div class="entry-date">${date}</div>
        </div>
        ${desc ? `<div class="entry-desc">${desc}</div>` : ""}
      </div>`;

    const expHtml = experiences.map((e: any) => buildEntry(
      fmtRange(e.start_date, e.end_date, e.is_current),
      esc(e.position || e.title || ""),
      esc(e.company || ""),
      esc(e.description || ""),
      e.location ? esc(e.location) : undefined
    )).join("");

    const eduHtml = education.map((e: any) => buildEntry(
      fmtRange(e.start_date, e.end_date, e.is_current),
      `${esc(e.degree || "")}${e.field_of_study ? " — " + esc(e.field_of_study) : ""}`,
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
      esc(o.role || o.position || ""),
      esc(o.name || ""),
      ""
    )).join("");

    const section = (icon: string, title: string, content: string) => content ? `
      <div class="section">
        <h2>${icon} ${title}</h2>
        ${content}
      </div>` : "";

    // Personal info items for sidebar
    const personalInfoItems: string[] = [];
    if (profile.gender) personalInfoItems.push(`<div class="info-row"><div class="info-icon">👤</div><div><div class="info-label">Gender</div><div class="info-value">${esc(genderLabel[profile.gender] || profile.gender)}</div></div></div>`);
    if (profile.date_of_birth) personalInfoItems.push(`<div class="info-row"><div class="info-icon">📅</div><div><div class="info-label">Tanggal Lahir</div><div class="info-value">${fmtDateFull(profile.date_of_birth)}</div></div></div>`);
    if (profile.nationality) personalInfoItems.push(`<div class="info-row"><div class="info-icon">🌍</div><div><div class="info-label">Kewarganegaraan</div><div class="info-value">${esc(profile.nationality)}</div></div></div>`);
    if (profile.languages) personalInfoItems.push(`<div class="info-row"><div class="info-icon">🗣️</div><div><div class="info-label">Bahasa</div><div class="info-value">${esc(profile.languages)}</div></div></div>`);
    if (profile.marital_status) personalInfoItems.push(`<div class="info-row"><div class="info-icon">💍</div><div><div class="info-label">Status</div><div class="info-value">${esc(maritalLabel[profile.marital_status] || profile.marital_status)}</div></div></div>`);

    // Professional info items for sidebar
    const professionalInfoItems: string[] = [];
    if (profile.years_of_experience != null && profile.years_of_experience > 0) professionalInfoItems.push(`<div class="info-row"><div class="info-icon">💼</div><div><div class="info-label">Pengalaman</div><div class="info-value">${profile.years_of_experience} tahun</div></div></div>`);
    if (profile.highest_education) professionalInfoItems.push(`<div class="info-row"><div class="info-icon">🎓</div><div><div class="info-label">Pendidikan Tertinggi</div><div class="info-value">${esc(profile.highest_education)}</div></div></div>`);
    if (profile.opportunity_availability) professionalInfoItems.push(`<div class="info-row"><div class="info-icon">📆</div><div><div class="info-label">Ketersediaan</div><div class="info-value">${esc(availabilityLabel[profile.opportunity_availability] || profile.opportunity_availability)}</div></div></div>`);
    if (include_contact && profile.daily_rate != null && profile.daily_rate > 0) professionalInfoItems.push(`<div class="info-row"><div class="info-icon">💰</div><div><div class="info-label">Daily Rate</div><div class="info-value">Rp ${Number(profile.daily_rate).toLocaleString("en-US")}/day</div></div></div>`);
    if (include_contact && profile.monthly_salary_rate != null && profile.monthly_salary_rate > 0) professionalInfoItems.push(`<div class="info-row"><div class="info-icon">💰</div><div><div class="info-label">Monthly Salary</div><div class="info-value">${profile.expected_salary_currency || "IDR"} ${Number(profile.monthly_salary_rate).toLocaleString("en-US")}</div></div></div>`);

    // Skill badges HTML
    const skillBadgesHtml = (items: { name: string; score: number }[]) =>
      [...items].sort((a, b) => b.score - a.score)
        .map(s => `<span class="skill-badge">${esc(s.name)} <span class="skill-score">${s.score}</span></span>`)
        .join("");

    const hasSkillRadar = technicalSkills.length > 0 || softSkills.length > 0;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CV – ${esc(profile.full_name) || "User"}</title>
<style>
  @page { margin: 0; size: A4; }
  *, *::before, *::after { box-sizing: border-box; }

  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, Helvetica, sans-serif !important;
    font-size: 9pt !important;
    color: #1a1a1a !important;
    line-height: 1.5 !important;
    background: #6b7280 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    margin: 0;
  }

  .page, .page * { color: inherit; }
  .page { color: #1a1a1a !important; }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto !important;
    background: #fff !important;
    color: #1a1a1a !important;
    position: relative;
  }

  /* ── RED BANNER ── */
  .cv-banner {
    background: #D71920 !important;
    height: 60px;
    width: 100%;
  }

  /* ── HEADER CARD ── */
  .cv-header-card {
    margin: -20px 40px 0;
    background: #fff !important;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 20px 24px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    position: relative;
    z-index: 2;
  }
  .cv-avatar {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
    border: 3px solid #D71920;
    margin-top: -36px;
    background: #f3f4f6;
  }
  .cv-avatar-placeholder {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    flex-shrink: 0;
    border: 3px solid #D71920;
    margin-top: -36px;
    background: #e5e7eb !important;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28pt;
    font-weight: 700;
    color: #999;
  }
  .cv-header-info { flex: 1; padding-top: 2px; }
  .cv-name {
    font-size: 18pt !important;
    font-weight: 700 !important;
    color: #111 !important;
    line-height: 1.15;
    margin: 0;
  }
  .cv-headline {
    font-size: 10pt !important;
    color: #555 !important;
    font-weight: 500 !important;
    margin-top: 2px;
  }
  .cv-location {
    font-size: 8.5pt;
    color: #888;
    margin-top: 4px;
  }
  .cv-availability {
    display: inline-block;
    font-size: 7.5pt;
    color: #555;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 2px 8px;
    margin-top: 6px;
  }

  /* ── LAYOUT: 2 columns ── */
  .cv-body {
    display: flex;
    gap: 20px;
    padding: 20px 40px 0;
  }
  .cv-main { flex: 1; min-width: 0; }
  .cv-sidebar { width: 200px; flex-shrink: 0; }

  /* ── CONTACT INFO ── */
  .cv-contact-items {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-top: 8px;
    font-size: 8pt;
    color: #444;
  }
  .ci { white-space: nowrap; }

  /* ── SECTIONS ── */
  .section { margin-top: 16px !important; page-break-inside: avoid; }
  .section h2 {
    font-size: 9pt !important;
    font-weight: 700 !important;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #D71920 !important;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 4px !important;
    margin: 0 0 8px 0 !important;
  }

  /* ── ENTRIES ── */
  .entry { margin-bottom: 10px !important; page-break-inside: avoid; }
  .entry:last-child { margin-bottom: 0 !important; }
  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
  }
  .entry-title {
    font-size: 9.5pt !important;
    font-weight: 600 !important;
    color: #111 !important;
  }
  .entry-date {
    font-size: 8pt !important;
    color: #888 !important;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .entry-subtitle {
    font-size: 8.5pt !important;
    color: #555 !important;
    margin-top: 1px;
  }
  .entry-location {
    font-size: 7.5pt !important;
    color: #999 !important;
    margin-top: 1px;
  }
  .entry-desc {
    font-size: 8pt !important;
    color: #444 !important;
    margin-top: 3px;
    line-height: 1.5;
    white-space: pre-line;
  }

  /* ── SKILLS SECTION ── */
  .skills-section { margin-top: 16px; page-break-inside: avoid; }
  .skills-section h2 {
    font-size: 9pt !important;
    font-weight: 700 !important;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #D71920 !important;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 4px !important;
    margin: 0 0 10px 0 !important;
  }
  .radar-row {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 12px;
  }
  .radar-col {
    text-align: center;
    flex: 1;
  }
  .radar-label {
    font-size: 8.5pt;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }
  .radar-col svg { max-width: 100%; height: auto; }
  .skill-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }
  .skill-badge {
    font-size: 7pt;
    font-weight: 500;
    color: #333;
    background: #f3f4f6 !important;
    padding: 2px 8px;
    border-radius: 3px;
    border: 1px solid #e5e7eb !important;
    white-space: nowrap;
  }
  .skill-score {
    color: #999;
    font-weight: 400;
    margin-left: 2px;
  }
  .skills-tags {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 5px !important;
    margin-top: 8px;
  }
  .skill-tag {
    font-size: 7.5pt;
    font-weight: 500;
    color: #333;
    background: #f3f4f6 !important;
    padding: 3px 10px !important;
    border-radius: 3px !important;
    border: 1px solid #e5e7eb !important;
  }

  /* ── SIDEBAR CARDS ── */
  .sidebar-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 14px;
    margin-bottom: 12px;
    page-break-inside: avoid;
  }
  .sidebar-title {
    font-size: 9pt;
    font-weight: 700;
    color: #111;
    margin-bottom: 10px;
  }
  .info-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    align-items: flex-start;
  }
  .info-row:last-child { margin-bottom: 0; }
  .info-icon {
    font-size: 9pt;
    width: 16px;
    flex-shrink: 0;
    text-align: center;
    margin-top: 1px;
  }
  .info-label {
    font-size: 7.5pt;
    color: #999;
    line-height: 1.3;
  }
  .info-value {
    font-size: 8.5pt;
    color: #111;
    font-weight: 500;
    line-height: 1.3;
  }

  /* ── SUMMARY ── */
  .summary-text {
    font-size: 8.5pt;
    color: #333;
    line-height: 1.6;
    white-space: pre-line;
  }

  /* ── FOOTER ── */
  .cv-footer {
    margin-top: 16px !important;
    padding: 12px 40px !important;
    border-top: 2px solid #D71920 !important;
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
    height: 18px;
    opacity: 0.7;
  }
  .cv-footer-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .qr-wrapper {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    background: #fff;
  }
  .qr-wrapper svg {
    width: 64px;
    height: 64px;
    display: block;
    background: #fff;
  }
  .qr-wrapper svg path[fill="#000000"],
  .qr-wrapper svg path:not([fill]),
  .qr-wrapper svg rect[fill="#000000"] { fill: #000 !important; }
  .qr-wrapper svg path[fill="#ffffff"],
  .qr-wrapper svg rect[fill="#ffffff"],
  .qr-wrapper svg rect:not([fill]) { fill: #fff !important; }
  .qr-label {
    font-size: 6.5pt;
    color: #999;
    text-align: right;
    line-height: 1.4;
    max-width: 90px;
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
    body { background: #fff !important; margin: 0; padding: 0; }
    .print-bar { display: none !important; }
    .page {
      width: 100%;
      min-height: auto;
      margin: 0 !important;
      box-shadow: none;
    }
    .cv-banner { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section { break-inside: avoid; }
    .entry { break-inside: avoid; }
    .sidebar-card { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="print-bar">
  <button class="btn-print" onclick="window.print()">⎙ Print / Save as PDF</button>
</div>

<div class="page">
  <!-- Red banner -->
  <div class="cv-banner"></div>

  <!-- Header card -->
  <div class="cv-header-card">
    ${profile.avatar_url
      ? `<img class="cv-avatar" src="${esc(profile.avatar_url)}" alt="Photo" />`
      : `<div class="cv-avatar-placeholder">${(profile.full_name || "?").charAt(0).toUpperCase()}</div>`}
    <div class="cv-header-info">
      <div class="cv-name">${esc(profile.full_name) || "Full Name"}</div>
      ${profile.headline ? `<div class="cv-headline">${esc(profile.headline)}</div>` : ""}
      ${location ? `<div class="cv-location">📍 ${esc(location)}</div>` : ""}
      ${profile.opportunity_availability ? `<div class="cv-availability">${esc(availabilityLabel[profile.opportunity_availability] || profile.opportunity_availability)}</div>` : ""}
      ${contactItems.length > 0 ? `<div class="cv-contact-items">${contactItems.join("")}</div>` : ""}
    </div>
  </div>

  <!-- Two-column body -->
  <div class="cv-body">
    <!-- Main column -->
    <div class="cv-main">
      ${summary ? `
      <div class="section">
        <h2>Tentang</h2>
        <div class="summary-text">${esc(summary)}</div>
      </div>` : ""}

      ${hasSkillRadar || skills.length > 0 ? `
      <div class="skills-section">
        <h2>Keahlian</h2>
        ${hasSkillRadar ? `
        <div class="radar-row">
          ${technicalSkills.length > 0 ? `
          <div class="radar-col">
            <div class="radar-label">Technical Skills</div>
            ${techRadarSvg}
            <div class="skill-badges">${skillBadgesHtml(technicalSkills)}</div>
          </div>` : ""}
          ${softSkills.length > 0 ? `
          <div class="radar-col">
            <div class="radar-label">Soft Skills</div>
            ${softRadarSvg}
            <div class="skill-badges">${skillBadgesHtml(softSkills)}</div>
          </div>` : ""}
        </div>` : ""}
        ${skills.length > 0 ? `
        <div class="skills-tags">${skills.map((s: string) => `<span class="skill-tag">${esc(s)}</span>`).join("")}</div>` : ""}
      </div>` : ""}

      ${section("💼 Pengalaman Kerja", expHtml)}
      ${section("🎓 Pendidikan", eduHtml)}
      ${section("📜 Sertifikasi", certHtml)}
      ${section("📚 Pelatihan", trainHtml)}
      ${section("🏆 Penghargaan", awardHtml)}
      ${section("🏢 Organisasi", orgHtml)}
    </div>

    <!-- Sidebar -->
    <div class="cv-sidebar">
      ${personalInfoItems.length > 0 ? `
      <div class="sidebar-card">
        <div class="sidebar-title">Informasi Pribadi</div>
        ${personalInfoItems.join("")}
      </div>` : ""}

      ${professionalInfoItems.length > 0 ? `
      <div class="sidebar-card">
        <div class="sidebar-title">Profesional</div>
        ${professionalInfoItems.join("")}
      </div>` : ""}
    </div>
  </div>

  <!-- Footer -->
  <div class="cv-footer">
    <div class="cv-footer-left">
      <img src="https://oveersea.com/oveersea-logo-dark-cv.png" alt="Oveersea" class="cv-footer-logo" />
      <span>Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
    </div>
    <div class="cv-footer-right">
      <div class="qr-label">
        Scan to verify<br/>
        <strong>${esc(oveercode)}</strong>
      </div>
      ${qrSvg ? `<div class="qr-wrapper">${qrSvg}</div>` : ""}
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
