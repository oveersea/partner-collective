import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, category, level, existing } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Determine what needs to be generated
    const missingFields: string[] = [];
    if (!existing?.learning_outcomes || existing.learning_outcomes.length === 0) missingFields.push("learning_outcomes");
    if (!existing?.target_audience || existing.target_audience.length === 0) missingFields.push("target_audience");
    if (!existing?.prerequisites || existing.prerequisites.length === 0) missingFields.push("prerequisites");
    if (!existing?.syllabus || existing.syllabus.length === 0) missingFields.push("syllabus");
    if (!existing?.faq || existing.faq.length === 0) missingFields.push("faq");
    if (!description) missingFields.push("description");

    if (missingFields.length === 0) {
      return new Response(JSON.stringify({ error: "Semua konten sudah lengkap, tidak ada yang perlu di-generate." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Kamu adalah ahli kurikulum dan konten program pembelajaran profesional di Indonesia. 
Tugasmu adalah membuat konten program yang komprehensif, relevan industri, dan menarik.
Selalu gunakan Bahasa Indonesia yang profesional.
Hanya generate field yang diminta, jangan generate field lain.`;

    const userPrompt = `Buatkan konten untuk program pembelajaran berikut:
- Judul: ${title}
- Kategori: ${category || "online"}
- Level: ${level || "beginner"}
${description ? `- Deskripsi yang sudah ada: ${description}` : ""}

Generate HANYA field berikut yang belum ada: ${missingFields.join(", ")}

Gunakan format tool calling yang disediakan.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "generate_program_content",
          description: "Generate missing program content fields",
          parameters: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Deskripsi program 2-3 kalimat yang menarik dan informatif",
              },
              learning_outcomes: {
                type: "array",
                items: { type: "string" },
                description: "4-6 learning outcomes yang spesifik dan terukur",
              },
              target_audience: {
                type: "array",
                items: { type: "string" },
                description: "3-5 target audience yang spesifik",
              },
              prerequisites: {
                type: "array",
                items: { type: "string" },
                description: "2-4 prasyarat yang dibutuhkan",
              },
              syllabus: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    topics: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: ["title", "description", "topics"],
                },
                description: "4-8 modul syllabus lengkap dengan topik per modul",
              },
              faq: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["question", "answer"],
                },
                description: "3-5 FAQ yang relevan",
              },
            },
            required: missingFields,
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "generate_program_content" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit tercapai, coba lagi nanti." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis, silakan top up." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "AI tidak menghasilkan output yang valid" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generated = JSON.parse(toolCall.function.arguments);

    // Only return fields that were missing
    const filtered: Record<string, any> = {};
    for (const field of missingFields) {
      if (generated[field] !== undefined) {
        filtered[field] = generated[field];
      }
    }

    return new Response(JSON.stringify({ generated: filtered, fields: missingFields }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-program-details error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
