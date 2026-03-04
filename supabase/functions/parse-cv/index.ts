import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function populateProfileData(adminClient: any, userId: string, parsedData: any, adminUserId: string) {
  try {
    console.log("Populating profile data for user:", userId);

    // Update profile basic info
    const profileUpdate: Record<string, any> = {};
    if (parsedData.phone) profileUpdate.phone_number = parsedData.phone;
    if (parsedData.city) profileUpdate.city = parsedData.city;
    if (parsedData.country) profileUpdate.country = parsedData.country;
    if (parsedData.nationality) profileUpdate.nationality = parsedData.nationality;
    if (parsedData.current_title) profileUpdate.headline = parsedData.current_title;
    if (parsedData.summary) profileUpdate.professional_summary = parsedData.summary;
    if (parsedData.skills && parsedData.skills.length > 0) profileUpdate.skills = parsedData.skills;
    if (parsedData.languages && parsedData.languages.length > 0) {
      profileUpdate.languages = parsedData.languages.map((l: any) => 
        typeof l === "string" ? l : `${l.language}${l.proficiency ? ` (${l.proficiency})` : ""}`
      ).join(", ");
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileErr } = await adminClient
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", userId);
      if (profileErr) console.error("Profile update error:", profileErr.message);
    }

    // Insert work experiences
    if (parsedData.work_experience && parsedData.work_experience.length > 0) {
      const experiences = parsedData.work_experience.map((exp: any) => ({
        user_id: userId,
        company: exp.company || "Unknown Company",
        position: exp.title || "Unknown Position",
        start_date: exp.start_date || null,
        end_date: exp.is_current ? null : (exp.end_date || null),
        is_current: exp.is_current || false,
        description: exp.description || null,
        location: exp.location || null,
        status: "approved",
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
      }));

      const { error: expErr } = await adminClient.from("user_experiences").insert(experiences);
      if (expErr) console.error("Experiences insert error:", expErr.message);
      else console.log(`Inserted ${experiences.length} work experiences`);
    }

    // Insert education
    if (parsedData.education && parsedData.education.length > 0) {
      const education = parsedData.education.map((edu: any) => ({
        user_id: userId,
        institution: edu.institution || "Unknown Institution",
        degree: edu.degree || null,
        field_of_study: edu.field_of_study || null,
        start_date: edu.start_year ? `${edu.start_year}-01-01` : null,
        end_date: edu.end_year ? `${edu.end_year}-01-01` : null,
        description: edu.gpa ? `GPA: ${edu.gpa}` : null,
        status: "approved",
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
      }));

      const { error: eduErr } = await adminClient.from("user_education").insert(education);
      if (eduErr) console.error("Education insert error:", eduErr.message);
      else console.log(`Inserted ${education.length} education records`);
    }

    // Insert certifications
    if (parsedData.certifications && parsedData.certifications.length > 0) {
      const certs = parsedData.certifications.map((cert: any) => ({
        user_id: userId,
        name: cert.name || "Unknown Certification",
        issuing_organization: cert.issuer || "Unknown",
        issue_date: cert.year ? `${cert.year}-01-01` : null,
        status: "approved",
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
      }));

      const { error: certErr } = await adminClient.from("user_certifications").insert(certs);
      if (certErr) console.error("Certifications insert error:", certErr.message);
      else console.log(`Inserted ${certs.length} certifications`);
    }

    console.log("Profile data population completed for user:", userId);
  } catch (err) {
    console.error("populateProfileData error:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SB_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    if (!SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing service role key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("getClaims error:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    console.log("Authenticated user:", userId);

    // Check superadmin/admin role using has_role function (security definer, bypasses RLS)
    const { data: isAdmin, error: adminCheckError } = await userClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    console.log("Role check - userId:", userId, "isAdmin:", isAdmin, "error:", adminCheckError);

    if (adminCheckError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { cv_upload_id } = await req.json();
    if (!cv_upload_id) {
      return new Response(JSON.stringify({ error: "cv_upload_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get CV upload record
    console.log("Fetching CV upload:", cv_upload_id);
    const { data: cvUpload, error: cvError } = await adminClient
      .from("cv_uploads")
      .select("*")
      .eq("id", cv_upload_id)
      .single();

    console.log("CV upload result:", JSON.stringify({ cvUpload: cvUpload?.id, cvError }));

    if (cvError || !cvUpload) {
      return new Response(JSON.stringify({ error: "CV upload not found", details: cvError?.message }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to processing
    await adminClient
      .from("cv_uploads")
      .update({ parsing_status: "processing", updated_at: new Date().toISOString() })
      .eq("id", cv_upload_id);

    // Download file from storage
    const filePath = cvUpload.file_url;
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("cv-uploads")
      .download(filePath);

    if (downloadError || !fileData) {
      await adminClient
        .from("cv_uploads")
        .update({ parsing_status: "failed", parsing_error: "Failed to download file: " + (downloadError?.message || "unknown"), updated_at: new Date().toISOString() })
        .eq("id", cv_upload_id);

      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert file to base64 (chunked to avoid stack overflow)
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    const mimeType = cvUpload.file_type === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // Call Lovable AI Gateway with tool calling
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a CV/resume parser. Extract structured candidate data from the uploaded CV document. 
Extract all available information accurately. For skills, list individual technical and soft skills.
For work experience and education, extract detailed entries with dates.
If information is not found, use null. Always call the extract_cv_data tool with the extracted data.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Parse this CV/resume file (${cvUpload.file_name}) and extract all candidate information using the extract_cv_data tool.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_cv_data",
              description: "Extract structured candidate data from a CV/resume document",
              parameters: {
                type: "object",
                properties: {
                  full_name: { type: "string", description: "Full name of the candidate" },
                  email: { type: "string", description: "Email address" },
                  phone: { type: "string", description: "Phone number" },
                  city: { type: "string", description: "City of residence" },
                  country: { type: "string", description: "Country of residence" },
                  nationality: { type: "string", description: "Nationality" },
                  current_title: { type: "string", description: "Current job title" },
                  current_company: { type: "string", description: "Current company name" },
                  skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of skills",
                  },
                  years_of_experience: {
                    type: "number",
                    description: "Total years of professional experience",
                  },
                  summary: { type: "string", description: "Professional summary/objective" },
                  education: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        institution: { type: "string" },
                        degree: { type: "string" },
                        field_of_study: { type: "string" },
                        start_year: { type: "number" },
                        end_year: { type: "number" },
                        gpa: { type: "string" },
                      },
                    },
                    description: "Education history",
                  },
                  work_experience: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        company: { type: "string" },
                        title: { type: "string" },
                        start_date: { type: "string" },
                        end_date: { type: "string" },
                        is_current: { type: "boolean" },
                        description: { type: "string" },
                        location: { type: "string" },
                      },
                    },
                    description: "Work experience history",
                  },
                  certifications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        issuer: { type: "string" },
                        year: { type: "number" },
                      },
                    },
                    description: "Professional certifications",
                  },
                  languages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        language: { type: "string" },
                        proficiency: { type: "string" },
                      },
                    },
                    description: "Language proficiencies",
                  },
                },
                required: ["full_name"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_cv_data" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);

      const errorMsg = aiResponse.status === 429
        ? "Rate limited, please try again later"
        : aiResponse.status === 402
        ? "Payment required, please add credits"
        : "AI parsing failed";

      await adminClient
        .from("cv_uploads")
        .update({ parsing_status: "failed", parsing_error: errorMsg, updated_at: new Date().toISOString() })
        .eq("id", cv_upload_id);

      return new Response(JSON.stringify({ error: errorMsg }), {
        status: aiResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      await adminClient
        .from("cv_uploads")
        .update({ parsing_status: "failed", parsing_error: "AI did not return structured data", raw_parsed_data: aiResult, updated_at: new Date().toISOString() })
        .eq("id", cv_upload_id);

      return new Response(JSON.stringify({ error: "AI parsing failed - no structured output" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedData = JSON.parse(toolCall.function.arguments);

    // Insert into candidates_archive
    const candidateId = crypto.randomUUID();
    const { error: insertError } = await adminClient
      .from("candidates_archive")
      .insert({
        id: candidateId,
        full_name: parsedData.full_name || "Unknown",
        email: parsedData.email || null,
        phone: parsedData.phone || null,
        city: parsedData.city || null,
        country: parsedData.country || null,
        nationality: parsedData.nationality || null,
        current_title: parsedData.current_title || null,
        current_company: parsedData.current_company || null,
        skills: parsedData.skills || null,
        years_of_experience: parsedData.years_of_experience || null,
        summary: parsedData.summary || null,
        education: parsedData.education || null,
        work_experience: parsedData.work_experience || null,
        certifications: parsedData.certifications || null,
        languages: parsedData.languages || null,
        uploaded_by: userId,
        status: "active",
      });

    if (insertError) {
      console.error("Insert candidate error:", insertError);
      await adminClient
        .from("cv_uploads")
        .update({ parsing_status: "failed", parsing_error: "Failed to save candidate: " + insertError.message, raw_parsed_data: parsedData, updated_at: new Date().toISOString() })
        .eq("id", cv_upload_id);

      return new Response(JSON.stringify({ error: "Failed to save candidate data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update cv_uploads with success
    await adminClient
      .from("cv_uploads")
      .update({
        parsing_status: "completed",
        candidate_id: candidateId,
        raw_parsed_data: parsedData,
        parsing_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cv_upload_id);

    // Auto-invite candidate as user if email is available
    let inviteResult: { invited: boolean; error?: string; user_id?: string } = { invited: false };

    const candidateEmail = parsedData.email?.trim().toLowerCase();
    if (candidateEmail) {
      try {
        console.log("Auto-inviting candidate:", candidateEmail);

        const { data: inviteData, error: inviteError } =
          await adminClient.auth.admin.inviteUserByEmail(candidateEmail, {
            data: {
              full_name: parsedData.full_name || "",
              phone_number: parsedData.phone || "",
            },
          });

        if (inviteError) {
          console.error("Auto-invite error:", inviteError.message);
          inviteResult = { invited: false, error: inviteError.message };
        } else {
          const invitedUserId = inviteData?.user?.id;
          console.log("Auto-invite success:", candidateEmail, "userId:", invitedUserId);
          inviteResult = { invited: true, user_id: invitedUserId };

          // Update profile with parsed data
          if (invitedUserId) {
            await populateProfileData(adminClient, invitedUserId, parsedData, userId);
          }

          // Log invitation in user_invitations table
          await adminClient.from("user_invitations").insert({
            email: candidateEmail,
            full_name: parsedData.full_name || "",
            phone_number: parsedData.phone || null,
            invited_by: userId,
            status: "pending",
          });
        }
      } catch (inviteErr) {
        console.error("Auto-invite exception:", inviteErr);
        inviteResult = { invited: false, error: String(inviteErr) };
      }
    } else {
      console.log("No email found in CV, skipping auto-invite");
      inviteResult = { invited: false, error: "No email in CV" };
    }

    return new Response(
      JSON.stringify({
        success: true,
        candidate_id: candidateId,
        parsed_data: parsedData,
        invitation: inviteResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("parse-cv error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
