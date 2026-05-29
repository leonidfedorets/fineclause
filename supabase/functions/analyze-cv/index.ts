import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const email = formData.get("email") as string | null;
    const consentAnalysis = formData.get("consent_analysis") === "true";
    const consentRecruiter = formData.get("consent_recruiter") === "true";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!consentAnalysis) {
      return new Response(JSON.stringify({ error: "Consent for analysis is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File too large (max 10MB)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract text from the file
    const fileBytes = await file.arrayBuffer();
    const fileText = new TextDecoder("utf-8", { fatal: false }).decode(fileBytes);
    // Limit to ~15k chars for the AI prompt
    const truncatedText = fileText.slice(0, 15000);

    console.log(`[ANALYZE-CV] Processing CV for ${email}, file: ${file.name}, size: ${file.size}`);

    // 1. Create candidate record
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .insert({
        email: email.trim().toLowerCase(),
        consent_analysis: consentAnalysis,
        consent_recruiter_sharing: consentRecruiter,
        consent_date: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (candidateError) {
      console.error("[ANALYZE-CV] Candidate insert error:", candidateError);
      throw new Error("Failed to create candidate record");
    }

    // 2. Log consent
    const consentEntries = [
      { candidate_id: candidate.id, action: "granted", consent_type: "analysis" },
    ];
    if (consentRecruiter) {
      consentEntries.push({ candidate_id: candidate.id, action: "granted", consent_type: "recruiter_sharing" });
    }
    await supabase.from("consent_logs").insert(consentEntries);

    // 3. Upload CV to storage
    const filePath = `${candidate.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("cv-uploads")
      .upload(filePath, fileBytes, { contentType: file.type });

    if (uploadError) {
      console.error("[ANALYZE-CV] Storage upload error:", uploadError);
      // Continue without storage — analysis can still proceed
    }

    // 4. AI Analysis via Lovable AI Gateway
    const systemPrompt = `You are an expert HR analyst and career advisor. Analyze the provided CV/resume text and return a structured assessment. Be specific and actionable.

You MUST call the "cv_analysis" function with the analysis results.`;

    const userPrompt = `Analyze this CV/resume and provide a comprehensive assessment:

---
${truncatedText}
---

Evaluate:
1. Overall CV quality score (0-100)
2. Estimated salary range based on experience, skills, and market data (in EUR)
3. Key skills identified
4. Skill gaps and improvement suggestions
5. Experience level (entry/junior/mid/senior/executive)
6. Education level
7. Career trajectory summary
8. Top 3 actionable improvements`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools: [
          {
            type: "function",
            function: {
              name: "cv_analysis",
              description: "Return structured CV analysis results",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "integer", description: "Overall CV quality score 0-100" },
                  salary_min: { type: "integer", description: "Estimated minimum annual salary in EUR" },
                  salary_max: { type: "integer", description: "Estimated maximum annual salary in EUR" },
                  skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key skills identified in the CV",
                  },
                  missing_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "Important skills missing from the CV for their career level",
                  },
                  experience_years: { type: "number", description: "Estimated total years of experience" },
                  experience_level: {
                    type: "string",
                    enum: ["entry", "junior", "mid", "senior", "executive"],
                    description: "Career experience level",
                  },
                  education_level: { type: "string", description: "Highest education level (e.g., Bachelor's, Master's, PhD)" },
                  summary: { type: "string", description: "2-3 sentence career profile summary" },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top 3 actionable improvement suggestions",
                  },
                  trajectory: { type: "string", description: "Career trajectory assessment and next steps" },
                },
                required: ["score", "salary_min", "salary_max", "skills", "missing_skills", "experience_years", "experience_level", "summary", "improvements"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "cv_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[ANALYZE-CV] AI gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Service is busy. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("[ANALYZE-CV] No tool call in AI response:", JSON.stringify(aiData));
      throw new Error("AI did not return structured analysis");
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log("[ANALYZE-CV] Analysis complete, score:", analysis.score);

    // 5. Save CV upload record with analysis
    const { data: cvRecord, error: cvError } = await supabase.from("cv_uploads").insert({
      candidate_id: candidate.id,
      file_name: file.name,
      file_path: filePath,
      ai_score: analysis.score,
      salary_min: analysis.salary_min,
      salary_max: analysis.salary_max,
      salary_currency: "EUR",
      skills: analysis.skills || [],
      experience_years: analysis.experience_years,
      education_level: analysis.education_level || null,
      summary: analysis.summary,
      raw_analysis: analysis,
      status: "completed",
    }).select("id").single();

    if (cvError) {
      console.error("[ANALYZE-CV] CV insert error:", cvError);
    }

    // 6. Run job matching synchronously so we can return results
    let jobMatches: Array<{
      job_id: string;
      job_title: string;
      company: string | null;
      location: string | null;
      remote_option: string | null;
      salary_min: number | null;
      salary_max: number | null;
      score: number;
      matched_skills: string[];
      missing_skills: string[];
      salary_fit: string;
    }> = [];

    if (cvRecord?.id) {
      try {
        const matchResponse = await fetch(`${SUPABASE_URL}/functions/v1/match-cv-jobs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ cv_id: cvRecord.id }),
        });

        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          if (matchData.matches && matchData.matches.length > 0) {
            // Fetch job details for the matches
            const jobIds = matchData.matches.map((m: any) => m.job_id);
            const { data: jobDetails } = await supabase
              .from("job_listings")
              .select("id, title, employer_name, location, remote_option, salary_min, salary_max")
              .in("id", jobIds);

            const jobMap = new Map((jobDetails || []).map((j: any) => [j.id, j]));

            jobMatches = matchData.matches.map((m: any) => {
              const job = jobMap.get(m.job_id);
              return {
                job_id: m.job_id,
                job_title: job?.title || "Unknown Position",
                company: job?.employer_name || null,
                location: job?.location || null,
                remote_option: job?.remote_option || null,
                salary_min: job?.salary_min || null,
                salary_max: job?.salary_max || null,
                score: m.score,
                matched_skills: m.matched_skills,
                missing_skills: m.missing_skills,
                salary_fit: m.salary_fit,
              };
            });
          }
        }
      } catch (err) {
        console.error("[ANALYZE-CV] Match error (non-fatal):", err);
      }

      // 7. Auto-push leads to HubSpot for agencies with configured keys
      if (matchData && matchData.matches && matchData.matches.length > 0) {
        try {
          const jobIds = matchData.matches.map((m: any) => m.job_id);
          const { data: jobsWithEmployers } = await supabase
            .from("job_listings")
            .select("id, employer_id")
            .in("id", jobIds);

          const employerIds = [...new Set((jobsWithEmployers || []).map((j: any) => j.employer_id).filter(Boolean))];
          if (employerIds.length > 0) {
            const { data: agencies } = await supabase
              .from("agency_profiles")
              .select("user_id, hubspot_api_key")
              .in("user_id", employerIds)
              .not("hubspot_api_key", "is", null);

            for (const agency of (agencies || [])) {
              try {
                await fetch(`${SUPABASE_URL}/functions/v1/create-hubspot-lead`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                  },
                  body: JSON.stringify({
                    candidate_id: candidate.id,
                    cv_id: cvRecord!.id,
                    employer_id: agency.user_id,
                  }),
                });
                console.log(`[ANALYZE-CV] Auto-pushed lead to HubSpot for employer ${agency.user_id}`);
              } catch (hubErr) {
                console.error("[ANALYZE-CV] HubSpot auto-push error (non-fatal):", hubErr);
              }
            }
          }
        } catch (hubErr) {
          console.error("[ANALYZE-CV] HubSpot lookup error (non-fatal):", hubErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          score: analysis.score,
          salary_min: analysis.salary_min,
          salary_max: analysis.salary_max,
          skills: analysis.skills,
          missing_skills: analysis.missing_skills,
          experience_years: analysis.experience_years,
          experience_level: analysis.experience_level,
          education_level: analysis.education_level,
          summary: analysis.summary,
          improvements: analysis.improvements,
          trajectory: analysis.trajectory,
        },
        job_matches: jobMatches,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[ANALYZE-CV] Error:", msg);
    return new Response(JSON.stringify({ error: "Analysis failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
