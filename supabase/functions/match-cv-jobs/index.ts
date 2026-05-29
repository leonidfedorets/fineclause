import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CVData {
  id: string;
  skills: string[];
  experience_years: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  summary: string | null;
  education_level: string | null;
}

interface JobData {
  id: string;
  title: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_min: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  location: string | null;
  remote_option: string | null;
}

function normalizeSkill(s: string): string {
  return s.toLowerCase().trim().replace(/[.\-_]/g, "");
}

function computeSkillMatch(
  cvSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[]
): { matchedSkills: string[]; missingSkills: string[]; skillScore: number } {
  const cvNormalized = new Map(cvSkills.map((s) => [normalizeSkill(s), s]));

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const req of requiredSkills) {
    const norm = normalizeSkill(req);
    // Check for exact or substring match
    const found = [...cvNormalized.entries()].some(
      ([cvNorm, _]) => cvNorm === norm || cvNorm.includes(norm) || norm.includes(cvNorm)
    );
    if (found) {
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  }

  // Bonus for preferred skills
  let preferredMatches = 0;
  for (const pref of preferredSkills) {
    const norm = normalizeSkill(pref);
    const found = [...cvNormalized.entries()].some(
      ([cvNorm, _]) => cvNorm === norm || cvNorm.includes(norm) || norm.includes(cvNorm)
    );
    if (found) {
      matchedSkills.push(pref);
      preferredMatches++;
    }
  }

  const totalRequired = requiredSkills.length || 1;
  const totalPreferred = preferredSkills.length || 1;

  // 70% weight on required skills, 30% on preferred
  const requiredScore = (matchedSkills.length - preferredMatches) / totalRequired;
  const preferredScore = preferredMatches / totalPreferred;
  const skillScore = Math.min(1, requiredScore * 0.7 + preferredScore * 0.3);

  return { matchedSkills: [...new Set(matchedSkills)], missingSkills, skillScore };
}

function computeExperienceFit(cvYears: number | null, jobMin: number | null): number {
  if (cvYears === null || jobMin === null) return 0.5; // neutral if unknown
  if (cvYears >= jobMin) return 1;
  if (cvYears >= jobMin * 0.7) return 0.7;
  if (cvYears >= jobMin * 0.5) return 0.4;
  return 0.2;
}

function computeSalaryFit(
  cvMin: number | null,
  cvMax: number | null,
  jobMin: number | null,
  jobMax: number | null
): { fit: string; score: number } {
  if (!cvMin || !jobMin) return { fit: "unknown", score: 0.5 };

  const cvMid = ((cvMin || 0) + (cvMax || cvMin || 0)) / 2;
  const jobMid = ((jobMin || 0) + (jobMax || jobMin || 0)) / 2;

  // Perfect overlap
  if (cvMin <= (jobMax || jobMin) && (cvMax || cvMin) >= jobMin) {
    return { fit: "within_range", score: 1 };
  }

  // CV expects more than job offers
  if (cvMin > (jobMax || jobMin)) {
    const overshoot = (cvMin - (jobMax || jobMin)) / (jobMax || jobMin);
    if (overshoot < 0.15) return { fit: "slightly_above", score: 0.7 };
    return { fit: "above_range", score: 0.3 };
  }

  // CV expects less than job minimum
  return { fit: "below_range", score: 0.8 }; // candidate is cheaper, still good
}

function computeOverallScore(
  skillScore: number,
  experienceScore: number,
  salaryScore: number
): number {
  // Weighted: skills 50%, experience 30%, salary 20%
  const raw = skillScore * 0.5 + experienceScore * 0.3 + salaryScore * 0.2;
  return Math.round(raw * 100);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { cv_id } = await req.json();
    if (!cv_id) {
      return new Response(JSON.stringify({ error: "cv_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[MATCH-CV] Starting matching for CV: ${cv_id}`);

    // 1. Fetch the CV data
    const { data: cv, error: cvError } = await supabase
      .from("cv_uploads")
      .select("id, skills, experience_years, salary_min, salary_max, salary_currency, summary, education_level")
      .eq("id", cv_id)
      .single();

    if (cvError || !cv) {
      console.error("[MATCH-CV] CV fetch error:", cvError);
      return new Response(JSON.stringify({ error: "CV not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cvData: CVData = {
      id: cv.id,
      skills: cv.skills || [],
      experience_years: cv.experience_years,
      salary_min: cv.salary_min,
      salary_max: cv.salary_max,
      salary_currency: cv.salary_currency,
      summary: cv.summary,
      education_level: cv.education_level,
    };

    // 2. Fetch all active job listings
    const { data: jobs, error: jobsError } = await supabase
      .from("job_listings")
      .select("id, title, required_skills, preferred_skills, experience_min, salary_min, salary_max, salary_currency, location, remote_option")
      .eq("is_active", true);

    if (jobsError) {
      console.error("[MATCH-CV] Jobs fetch error:", jobsError);
      throw new Error("Failed to fetch job listings");
    }

    if (!jobs || jobs.length === 0) {
      console.log("[MATCH-CV] No active job listings to match against");
      return new Response(
        JSON.stringify({ success: true, matches: [], message: "No active job listings available" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[MATCH-CV] Matching against ${jobs.length} active job listings`);

    // 3. Score each job
    const matches: Array<{
      cv_id: string;
      job_id: string;
      match_score: number;
      matched_skills: string[];
      missing_skills: string[];
      salary_fit: string;
    }> = [];

    for (const job of jobs) {
      const jobData: JobData = {
        id: job.id,
        title: job.title,
        required_skills: job.required_skills || [],
        preferred_skills: job.preferred_skills || [],
        experience_min: job.experience_min,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency,
        location: job.location,
        remote_option: job.remote_option,
      };

      // Skip if no skills to match against
      if (jobData.required_skills.length === 0 && jobData.preferred_skills.length === 0) {
        continue;
      }

      const { matchedSkills, missingSkills, skillScore } = computeSkillMatch(
        cvData.skills,
        jobData.required_skills,
        jobData.preferred_skills
      );

      const experienceScore = computeExperienceFit(cvData.experience_years, jobData.experience_min);
      const { fit: salaryFit, score: salaryScore } = computeSalaryFit(
        cvData.salary_min,
        cvData.salary_max,
        jobData.salary_min,
        jobData.salary_max
      );

      const overallScore = computeOverallScore(skillScore, experienceScore, salaryScore);

      // Only save matches with score >= 20
      if (overallScore >= 20) {
        matches.push({
          cv_id: cvData.id,
          job_id: jobData.id,
          match_score: overallScore,
          matched_skills: matchedSkills,
          missing_skills: missingSkills,
          salary_fit: salaryFit,
        });
      }
    }

    // 4. Delete existing matches for this CV and insert new ones
    await supabase.from("cv_job_matches").delete().eq("cv_id", cvData.id);

    if (matches.length > 0) {
      const { error: insertError } = await supabase.from("cv_job_matches").insert(matches);
      if (insertError) {
        console.error("[MATCH-CV] Insert error:", insertError);
        // Don't fail the whole request, just log
      }
    }

    console.log(`[MATCH-CV] Completed: ${matches.length} matches found for CV ${cv_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        matches_count: matches.length,
        matches: matches
          .sort((a, b) => b.match_score - a.match_score)
          .slice(0, 10) // Return top 10
          .map((m) => ({
            job_id: m.job_id,
            score: m.match_score,
            matched_skills: m.matched_skills,
            missing_skills: m.missing_skills,
            salary_fit: m.salary_fit,
          })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[MATCH-CV] Error:", msg);
    return new Response(JSON.stringify({ error: "Matching failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
