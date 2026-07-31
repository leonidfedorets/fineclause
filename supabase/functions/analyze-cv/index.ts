import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version" };

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", uk: "Ukrainian", lv: "Latvian", cs: "Czech", de: "German", es: "Spanish", fr: "French", pl: "Polish",
};
function resolveLanguageName(code: string | null | undefined): string {
  if (!code) return LANGUAGE_NAMES.en;
  return LANGUAGE_NAMES[code.slice(0, 2).toLowerCase()] ?? LANGUAGE_NAMES.en;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) return new Response(JSON.stringify({error:"config error"}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});

    let formData: FormData;
    try { formData = await req.formData(); }
    catch(e) { return new Response(JSON.stringify({error:"bad form: "+String(e).slice(0,60)}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}}); }

    const file = formData.get("file") as File | null;
    const consentAnalysis = formData.get("consent_analysis") === "true";
    const languageName = resolveLanguageName(formData.get("language") as string | null);

    if (!file || file.size === 0) return new Response(JSON.stringify({error:"no file"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});
    if (!consentAnalysis) return new Response(JSON.stringify({error:"need consent"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});
    if (file.size > 10*1024*1024) return new Response(JSON.stringify({error:"too large"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});

    // Extract text from CV — file is held in memory only, never written to disk or storage
    const fileBytes = await file.arrayBuffer();
    const lower = (file.type + " " + file.name).toLowerCase();
    let cvText = "";

    if (lower.includes("pdf")) {
      const {default:pdfParse} = await import("npm:pdf-parse@1.1.1/lib/pdf-parse.js");
      const r = await pdfParse(new Uint8Array(fileBytes));
      cvText = r.text ?? "";
    } else if (lower.includes("docx")||lower.includes("wordprocessingml")) {
      const mam = await import("npm:mammoth@1.8.0");
      const r = await mam.default.extractRawText({buffer:fileBytes});
      cvText = r.value ?? "";
    } else {
      cvText = new TextDecoder("utf-8",{fatal:false}).decode(fileBytes);
    }

    cvText = cvText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,"").trim();
    if (!cvText) return new Response(JSON.stringify({error:"Your CV appears to be a scanned document with no readable text. Please upload a PDF where text is selectable (not a scan), or use a DOCX file."}),{status:422,headers:{...corsHeaders,"Content-Type":"application/json"}});

    const truncatedText = cvText.slice(0,15000);
    // CV text is used only for the OpenAI call below — not stored anywhere

    // AI Analysis
    const aiResp = await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{Authorization:"Bearer "+OPENAI_API_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"gpt-4o-mini",
        messages:[
          {role:"system",content:`You are an expert HR analyst. Call the cv_analysis function with your structured results. Write "summary", "improvements" (each item), "trajectory", and "education_level" in ${languageName}, regardless of the language the CV is written in. Keep "skills" and "missing_skills" in their standard English/industry form (e.g. "JavaScript", "Project Management") so they can be matched against job listings — do not translate skill names. Keep "experience_level" as exactly one of the literal English enum values: entry, junior, mid, senior, executive — never translate it.`},
          {role:"user",content:"Analyze this CV:\n\n"+truncatedText}
        ],
        tools:[{type:"function",function:{name:"cv_analysis",description:"Return CV analysis",parameters:{type:"object",properties:{
          score:{type:"integer"},salary_min:{type:"integer"},salary_max:{type:"integer"},
          skills:{type:"array",items:{type:"string"}},missing_skills:{type:"array",items:{type:"string"}},
          experience_years:{type:"number"},experience_level:{type:"string",enum:["entry","junior","mid","senior","executive"]},
          education_level:{type:"string"},summary:{type:"string"},improvements:{type:"array",items:{type:"string"}},trajectory:{type:"string"}
        },required:["score","salary_min","salary_max","skills","missing_skills","experience_years","experience_level","summary","improvements"]}}}],
        tool_choice:{type:"function",function:{name:"cv_analysis"}}
      })
    });

    if (!aiResp.ok) {
      if (aiResp.status===429) return new Response(JSON.stringify({error:"busy"}),{status:429,headers:{...corsHeaders,"Content-Type":"application/json"}});
      const et = await aiResp.text();
      return new Response(JSON.stringify({error:"AI error "+aiResp.status+":"+et.slice(0,100)}),{status:502,headers:{...corsHeaders,"Content-Type":"application/json"}});
    }

    const aiData = await aiResp.json();
    const tc = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc?.function?.arguments) return new Response(JSON.stringify({error:"no tool call: "+JSON.stringify(aiData).slice(0,200)}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});

    const analysis = JSON.parse(tc.function.arguments);
    console.log("[CV] OK score="+analysis.score+" level="+analysis.experience_level);
    // Analysis result is returned to the client — nothing written to database or storage

    // Read-only: fetch active job listings for display and inline matching
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});

    const { data: allJobs } = await supabase
      .from("job_listings")
      .select("id,title,employer_name,location,remote_option,salary_min,salary_max,description,required_skills,preferred_skills,experience_min")
      .eq("is_active", true)
      .order("created_at", {ascending: false});

    // Inline job matching — no CV stored, match purely on skills intersection
    type JobRow = {id:string;title:string;employer_name:string|null;location:string|null;remote_option:string|null;salary_min:number|null;salary_max:number|null;description:string|null;required_skills:string[]|null;preferred_skills:string[]|null;experience_min:number|null};
    type JobMatch = {job_id:string;job_title:string;company:string|null;location:string|null;remote_option:string|null;salary_min:number|null;salary_max:number|null;score:number;matched_skills:string[];missing_skills:string[];salary_fit:string;description:string|null};

    const candidateSkills = new Set((analysis.skills as string[]).map((s:string) => s.toLowerCase()));
    const jobMatches: JobMatch[] = [];

    for (const job of (allJobs ?? []) as JobRow[]) {
      const required = (job.required_skills ?? []).map((s:string) => s.toLowerCase());
      if (required.length === 0) continue;
      const matched = required.filter((s:string) => candidateSkills.has(s));
      const score = Math.round((matched.length / required.length) * 100);
      if (score < 30) continue;

      const salaryFit = job.salary_min && analysis.salary_min
        ? (analysis.salary_min <= (job.salary_max ?? Infinity) ? "match" : "above")
        : "unknown";

      jobMatches.push({
        job_id: job.id,
        job_title: job.title,
        company: job.employer_name ?? null,
        location: job.location ?? null,
        remote_option: job.remote_option ?? null,
        salary_min: job.salary_min ?? null,
        salary_max: job.salary_max ?? null,
        score,
        matched_skills: matched,
        missing_skills: required.filter((s:string) => !candidateSkills.has(s)),
        salary_fit: salaryFit,
        description: job.description ?? null,
      });
    }

    jobMatches.sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify({
      success:true,
      analysis:{score:analysis.score,salary_min:analysis.salary_min,salary_max:analysis.salary_max,skills:analysis.skills,missing_skills:analysis.missing_skills,experience_years:analysis.experience_years,experience_level:analysis.experience_level,education_level:analysis.education_level??null,summary:analysis.summary,improvements:analysis.improvements,trajectory:analysis.trajectory??null},
      job_matches: jobMatches.slice(0, 10),
      all_jobs: allJobs ?? [],
    }),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}});

  } catch(e) {
    console.error("[CV] crash:", String(e).slice(0,400));
    return new Response(JSON.stringify({error:"Analysis failed. Please try again."}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
  }
});
