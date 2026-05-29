import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, skills, location, remoteOption, salaryMin, salaryMax, salaryCurrency, experienceMin } = await req.json();

    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Job title is required (min 2 chars)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contextParts: string[] = [];
    if (skills?.length) contextParts.push(`Required skills: ${skills.join(", ")}`);
    if (location) contextParts.push(`Location: ${location}`);
    if (remoteOption && remoteOption !== "on-site") contextParts.push(`Remote option: ${remoteOption}`);
    if (salaryMin && salaryMax) contextParts.push(`Salary range: ${salaryCurrency || "EUR"} ${salaryMin}–${salaryMax}`);
    if (experienceMin) contextParts.push(`Minimum experience: ${experienceMin} years`);

    const prompt = `Write a professional job description for the role: "${title.trim()}".
${contextParts.length > 0 ? "\nContext:\n" + contextParts.join("\n") : ""}

Requirements:
- 150-250 words
- Include: role overview, key responsibilities (4-6 bullet points), what we offer (3-4 bullet points)
- Professional but approachable tone
- Do NOT include the job title as a heading
- Do NOT include salary or location info (those are shown separately)
- Output plain text with simple bullet points (use •)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a professional recruitment copywriter. Write concise, engaging job descriptions." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit reached. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI service error." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-job-description error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
