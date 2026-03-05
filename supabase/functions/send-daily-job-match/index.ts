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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SB_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Get all open opportunities
    const { data: opportunities, error: oppErr } = await supabase
      .from("opportunities")
      .select("id, title, slug, category, skills_required, location, is_remote, job_type, company_name, budget_min, budget_max, min_experience_years")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(50);

    if (oppErr) throw new Error("Failed to fetch opportunities: " + oppErr.message);

    // 2. Get all active programs/training
    const { data: programs } = await supabase
      .from("programs")
      .select("id, title, slug, category")
      .eq("status", "approved")
      .eq("is_published", true)
      .limit(10);

    // 3. Get all users with profiles (who have email)
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, full_name, skills, years_of_experience, city, headline, avatar_url, phone_number, bio, professional_summary, highest_education, country, linkedin_url, website_url, date_of_birth, nationality, kyc_status")
      .not("user_id", "is", null);

    if (profErr) throw new Error("Failed to fetch profiles: " + profErr.message);

    // Get emails from auth
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    const emailMap = new Map<string, string>();
    if (authUsers?.users) {
      for (const u of authUsers.users) {
        if (u.email) emailMap.set(u.id, u.email);
      }
    }

    // Check blacklisted emails
    const { data: blacklisted } = await supabase
      .from("blacklisted_emails")
      .select("email");
    const blacklistedSet = new Set((blacklisted || []).map((b) => b.email.toLowerCase()));

    // 3b. Fetch experience and education counts per user
    const { data: expRows } = await supabase.from("user_experiences").select("user_id");
    const { data: eduRows } = await supabase.from("user_education").select("user_id");
    const expCountMap: Record<string, number> = {};
    for (const r of (expRows || [])) { expCountMap[r.user_id] = (expCountMap[r.user_id] || 0) + 1; }
    const eduCountMap: Record<string, number> = {};
    for (const r of (eduRows || [])) { eduCountMap[r.user_id] = (eduCountMap[r.user_id] || 0) + 1; }

    const appUrl = "https://partner-collective.lovable.app";
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    let sentCount = 0;
    let skipCount = 0;
    const errors: string[] = [];

    // 4. For each user, find matching opportunities
    for (const profile of (profiles || [])) {
      const email = emailMap.get(profile.user_id);
      if (!email || blacklistedSet.has(email.toLowerCase())) {
        skipCount++;
        continue;
      }

      const userSkills = (profile.skills || []).map((s: string) => s.toLowerCase());
      const userExp = profile.years_of_experience || 0;

      // Calculate matches
      type OppMatch = { opp: typeof opportunities[0]; score: number };
      const matches: OppMatch[] = [];

      for (const opp of (opportunities || [])) {
        const oppSkills = (opp.skills_required || []).map((s: string) => s.toLowerCase());
        if (oppSkills.length === 0) continue;

        const matchedSkills = oppSkills.filter((s: string) => userSkills.includes(s));
        const skillScore = matchedSkills.length / oppSkills.length;

        // Experience check
        const expOk = !opp.min_experience_years || userExp >= opp.min_experience_years;

        if (skillScore >= 0.3 && expOk) {
          matches.push({ opp, score: skillScore });
        }
      }

      // Sort by score desc
      matches.sort((a, b) => b.score - a.score);
      const topMatches = matches.slice(0, 5);

      const hasMatches = topMatches.length > 0;
      // Estimate profile completeness based on 14 criteria
      const checks = [
        !!profile.full_name,
        !!profile.avatar_url,
        !!profile.phone_number,
        userSkills.length > 0,
        (profile.years_of_experience || 0) > 0,
        !!profile.highest_education,
        !!(profile.bio || profile.professional_summary),
        !!(profile.city || profile.country),
        !!(profile.linkedin_url || profile.website_url),
        profile.kyc_status === 'approved' || profile.kyc_status === 'verified',
        !!profile.date_of_birth,
        !!profile.nationality,
        (expCountMap[profile.user_id] || 0) > 0,
        (eduCountMap[profile.user_id] || 0) > 0,
      ];
      const filledFields = checks.filter(Boolean).length;
      const profileCompletion = Math.round((filledFields / 14) * 100);
      const isProfileIncomplete = profileCompletion < 80 || userSkills.length === 0;

      // Build email HTML
      const firstName = (profile.full_name || "").split(" ")[0] || "Partner";

      let emailHtml = buildEmailHtml({
        firstName,
        today,
        hasMatches,
        topMatches: topMatches.map((m) => m.opp),
        isProfileIncomplete,
        profileCompletion,
        programs: programs || [],
        appUrl,
        userSkills,
      });

      // Send email
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Oveersea <noreply@oveersea.com>",
            to: [email],
            subject: hasMatches
              ? `🎯 ${topMatches.length} peluang kerja cocok untukmu hari ini`
              : "💡 Tingkatkan profilmu untuk mendapatkan peluang terbaik",
            html: emailHtml,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          errors.push(`${email}: ${errData?.message || res.status}`);
        } else {
          sentCount++;
        }

        // Log to email_sends
        await supabase.from("email_sends").insert({
          subject: hasMatches
            ? `${topMatches.length} peluang kerja cocok untukmu`
            : "Tingkatkan profilmu untuk mendapatkan peluang terbaik",
          body_html: emailHtml,
          recipient_email: email,
          recipient_name: profile.full_name,
          recipient_user_id: profile.user_id,
          send_type: "automated_daily_match",
          status: res.ok ? "sent" : "failed",
          sent_at: new Date().toISOString(),
        });
      } catch (e) {
        errors.push(`${email}: ${String(e)}`);
      }

      // Rate limit: small delay between emails
      await new Promise((r) => setTimeout(r, 100));
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, skipped: skipCount, errors: errors.slice(0, 20) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Daily job match error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Email Template Builder ──────────────────────────────────────────────────

interface EmailParams {
  firstName: string;
  today: string;
  hasMatches: boolean;
  topMatches: any[];
  isProfileIncomplete: boolean;
  profileCompletion: number;
  programs: any[];
  appUrl: string;
  userSkills: string[];
}

function buildEmailHtml(p: EmailParams): string {
  const primaryColor = "#D71920";
  const darkBg = "#1a1a1a";

  const matchCards = p.topMatches
    .map(
      (opp) => `
      <tr>
        <td style="padding: 0 0 12px 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f9f9fb; border-radius: 8px; border-left: 4px solid ${primaryColor};">
            <tr>
              <td style="padding: 16px 20px;">
                <a href="${p.appUrl}/jobs/${opp.slug}" style="font-size: 16px; font-weight: 700; color: ${darkBg}; text-decoration: none; display: block; margin-bottom: 4px;">
                  ${opp.title}
                </a>
                <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
                  ${opp.company_name || "Perusahaan"} · ${opp.location || "Remote"} · ${opp.job_type || "Full-time"}
                </div>
                ${
                  opp.skills_required?.length
                    ? `<div style="margin-top: 4px;">${opp.skills_required
                        .slice(0, 5)
                        .map(
                          (s: string) =>
                            `<span style="display: inline-block; background: ${
                              p.userSkills.includes(s.toLowerCase()) ? "#e8f5e9" : "#f0f0f5"
                            }; color: ${
                              p.userSkills.includes(s.toLowerCase()) ? "#2e7d32" : "#555"
                            }; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 4px; margin-bottom: 4px;">${s}</span>`
                        )
                        .join("")}</div>`
                    : ""
                }
                ${
                  opp.budget_min || opp.budget_max
                    ? `<div style="font-size: 12px; color: #888; margin-top: 6px;">💰 ${
                        opp.budget_min && opp.budget_max
                          ? `Rp ${Number(opp.budget_min).toLocaleString("id-ID")} - Rp ${Number(opp.budget_max).toLocaleString("id-ID")}`
                          : opp.budget_min
                          ? `Mulai Rp ${Number(opp.budget_min).toLocaleString("id-ID")}`
                          : `Hingga Rp ${Number(opp.budget_max).toLocaleString("id-ID")}`
                      }</div>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  const profileSection = p.isProfileIncomplete
    ? `
      <tr>
        <td style="padding: 24px 0 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fff8e1; border-radius: 8px; border: 1px solid #ffe082;">
            <tr>
              <td style="padding: 20px;">
                <div style="font-size: 15px; font-weight: 700; color: ${darkBg}; margin-bottom: 8px;">⚡ Tingkatkan Peluangmu</div>
                <div style="font-size: 13px; color: #555; line-height: 1.6; margin-bottom: 4px;">
                  Profil kamu baru <strong>${p.profileCompletion}%</strong> lengkap. Semakin lengkap profilmu, semakin banyak peluang yang cocok untukmu!
                </div>
                <ul style="font-size: 13px; color: #555; padding-left: 18px; margin: 8px 0;">
                  ${p.userSkills.length === 0 ? "<li>Tambahkan keahlian (skills) di profilmu</li>" : ""}
                  <li>Lengkapi pengalaman kerja & pendidikan</li>
                  <li>Upload foto profil profesional</li>
                </ul>
                <a href="${p.appUrl}/dashboard" style="display: inline-block; background: ${primaryColor}; color: #fff; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; margin-top: 8px;">
                  Lengkapi Profil →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  const trainingSection =
    p.programs.length > 0
      ? `
      <tr>
        <td style="padding: 24px 0 0;">
          <div style="font-size: 15px; font-weight: 700; color: ${darkBg}; margin-bottom: 12px;">🎓 Pelatihan yang Direkomendasikan</div>
          <div style="font-size: 13px; color: #666; margin-bottom: 12px;">Ikuti pelatihan untuk meningkatkan skill dan daya saingmu:</div>
          ${p.programs
            .slice(0, 3)
            .map(
              (prog) => `
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 8px;">
              <tr>
                <td style="background: #f0f4ff; border-radius: 6px; padding: 12px 16px;">
                  <a href="${p.appUrl}/learning/${prog.slug || prog.id}" style="font-size: 14px; font-weight: 600; color: #1565c0; text-decoration: none;">
                    ${prog.title}
                  </a>
                  ${prog.category ? `<div style="font-size: 11px; color: #888; margin-top: 2px;">${prog.category}</div>` : ""}
                </td>
              </tr>
            </table>`
            )
            .join("")}
        </td>
      </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
          <!-- Header (Light with dark logo) -->
          <tr>
            <td style="background: #ffffff; border-radius: 12px 12px 0 0; padding: 28px 32px 20px; text-align: center;">
              <img src="${p.appUrl}/logo-dark.png" alt="Oveersea" height="36" style="margin-bottom: 0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 0;"><div style="height: 3px; background: ${primaryColor};"></div></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background: #ffffff; padding: 32px 40px;">
              <h1 style="font-size: 22px; font-weight: 800; color: ${darkBg}; margin: 0 0 16px;">
                Hi ${p.firstName},
              </h1>
              <p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.7;">
                ${
                  p.hasMatches
                    ? `Kami menemukan <strong>${p.topMatches.length} peluang</strong> yang cocok dengan keahlianmu hari ini. Profil yang lengkap membantu kamu tampil menonjol di hadapan employer.`
                    : `Belum ada peluang yang cocok dengan profilmu saat ini. Profil yang lengkap membantu kamu tampil menonjol dan membuka lebih banyak peluang di platform.`
                }
              </p>

              ${p.hasMatches ? `
              <div style="font-size: 15px; font-weight: 700; color: ${darkBg}; margin-bottom: 12px;">Peluang yang cocok:</div>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">${matchCards}</table>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0 0;">
                    <a href="${p.appUrl}/matchmaking" style="display: inline-block; background: ${primaryColor}; color: #fff; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 700; text-decoration: none;">
                      Lihat Semua Peluang →
                    </a>
                  </td>
                </tr>
              </table>` : ""}

              ${profileSection}
              ${trainingSection}

              ${!p.hasMatches && !p.isProfileIncomplete ? `
              <p style="font-size: 14px; color: #555; line-height: 1.6; margin-top: 16px;">
                Luangkan waktu sejenak untuk melengkapi profilmu dan tingkatkan visibilitasmu.
              </p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0 0;">
                    <a href="${p.appUrl}/dashboard" style="display: inline-block; background: ${primaryColor}; color: #fff; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 700; text-decoration: none;">
                      Complete My Profile →
                    </a>
                  </td>
                </tr>
              </table>` : ""}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9f9f9; border-radius: 0 0 12px 12px; padding: 20px 32px; text-align: center; border-top: 1px solid #eee;">
              <div style="font-size: 11px; color: #999; line-height: 1.6;">
                © ${new Date().getFullYear()} Oveersea. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
