import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

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

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Check superadmin/admin role
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "superadmin"]);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { cv_upload_id } = await req.json();
    if (!cv_upload_id) {
      return new Response(JSON.stringify({ error: "cv_upload_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get CV upload record
    const { data: cvUpload, error: cvError } = await adminClient
      .from("cv_uploads")
      .select("*")
      .eq("id", cv_upload_id)
      .single();

    if (cvError || !cvUpload) {
      return new Response(JSON.stringify({ error: "CV upload not found" }), {
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

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
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

    return new Response(
      JSON.stringify({
        success: true,
        candidate_id: candidateId,
        parsed_data: parsedData,
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
