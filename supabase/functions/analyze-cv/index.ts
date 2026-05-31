import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) return new Response(JSON.stringify({error:"config error"}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});

    let formData: FormData;
    try { formData = await req.formData(); }
    catch(e) { return new Response(JSON.stringify({error:"bad form: "+String(e).slice(0,60)}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}}); }

    const file = formData.get("file") as File | null;
    const email = formData.get("email") as string | null;
    const consentAnalysis = formData.get("consent_analysis") === "true";
    const consentRecruiter = formData.get("consent_recruiter") === "true";

    if (!file || file.size === 0) return new Response(JSON.stringify({error:"no file"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});
    if (!email?.includes("@")) return new Response(JSON.stringify({error:"need email"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});
    if (!consentAnalysis) return new Response(JSON.stringify({error:"need consent"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});
    if (file.size > 10*1024*1024) return new Response(JSON.stringify({error:"too large"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});

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
    if (!cvText) return new Response(JSON.stringify({error:"empty file"}),{status:422,headers:{...corsHeaders,"Content-Type":"application/json"}});

    const truncatedText = cvText.slice(0,15000);

    // Save candidate record
    const {data:candidate} = await supabase.from("candidates")
      .insert({email:email!.trim().toLowerCase(),consent_analysis:consentAnalysis,consent_recruiter_sharing:consentRecruiter,consent_date:new Date().toISOString()})
      .select("id").single();

    // Log consent + upload (fire-and-forget)
    if (candidate?.id) {
      supabase.from("consent_logs").insert([{candidate_id:candidate.id,action:"granted",consent_type:"analysis"}]).then(()=>{}).catch(()=>{});
      const fileBuf = new Uint8Array(fileBytes); // copy to avoid transfer issues
      supabase.storage.from("cv-uploads").upload(candidate.id+"/"+Date.now()+"_"+file.name,fileBuf,{contentType:file.type}).then(()=>{}).catch(()=>{});
    }

    // AI Analysis
    const aiResp = await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{Authorization:"Bearer "+OPENAI_API_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"gpt-4o-mini",
        messages:[
          {role:"system",content:"You are an expert HR analyst. Call the cv_analysis function with your structured results."},
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

    // Save CV record (await so we have the ID for matching)
    let cvRecordId: string | null = null;
    if (candidate?.id) {
      const { data: cvRecord } = await supabase.from("cv_uploads").insert({
        candidate_id:candidate.id,file_name:file.name,file_path:candidate.id+"/"+Date.now()+"_"+file.name,
        ai_score:analysis.score,salary_min:analysis.salary_min,salary_max:analysis.salary_max,salary_currency:"EUR",
        skills:analysis.skills??[],experience_years:analysis.experience_years,education_level:analysis.education_level??null,
        summary:analysis.summary,raw_analysis:analysis,status:"completed"
      }).select("id").single();
      cvRecordId = cvRecord?.id ?? null;
    }

    // Job matching — call match-cv-jobs synchronously so we can return results
    type JobMatch = {
      job_id:string; job_title:string; company:string|null; location:string|null;
      remote_option:string|null; salary_min:number|null; salary_max:number|null;
      score:number; matched_skills:string[]; missing_skills:string[]; salary_fit:string;
      description:string|null;
    };
    const jobMatches: JobMatch[] = [];

    if (cvRecordId) {
      try {
        const matchResp = await fetch(`${SUPABASE_URL}/functions/v1/match-cv-jobs`, {
          method:"POST",
          headers:{"Content-Type":"application/json", Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`},
          body:JSON.stringify({cv_id:cvRecordId}),
        });
        if (matchResp.ok) {
          const matchData = await matchResp.json();
          if (matchData.matches?.length > 0) {
            const jobIds = matchData.matches.map((m:{job_id:string}) => m.job_id);
            const { data: jobs } = await supabase
              .from("job_listings")
              .select("id,title,employer_name,location,remote_option,salary_min,salary_max,description")
              .in("id", jobIds);
            const jmap = new Map((jobs??[]).map((j:{id:string}) => [j.id, j]));
            for (const m of matchData.matches) {
              const j = jmap.get(m.job_id) as Record<string,unknown>|undefined;
              jobMatches.push({
                job_id: m.job_id,
                job_title: String(j?.title??"Unknown"),
                company: j?.employer_name as string ?? null,
                location: j?.location as string ?? null,
                remote_option: j?.remote_option as string ?? null,
                salary_min: j?.salary_min as number ?? null,
                salary_max: j?.salary_max as number ?? null,
                score: m.score,
                matched_skills: m.matched_skills,
                missing_skills: m.missing_skills,
                salary_fit: m.salary_fit,
                description: j?.description as string ?? null,
              });
            }
          }
        }
      } catch(e) { console.error("[CV] job matching (non-fatal):", e); }
    }

    // Also fetch ALL active jobs so the UI can show the full vacancy list
    const { data: allJobs } = await supabase
      .from("job_listings")
      .select("id,title,employer_name,location,remote_option,salary_min,salary_max,description,required_skills,preferred_skills,experience_min")
      .eq("is_active", true)
      .order("created_at", {ascending: false});

    return new Response(JSON.stringify({
      success:true,
      analysis:{score:analysis.score,salary_min:analysis.salary_min,salary_max:analysis.salary_max,skills:analysis.skills,missing_skills:analysis.missing_skills,experience_years:analysis.experience_years,experience_level:analysis.experience_level,education_level:analysis.education_level??null,summary:analysis.summary,improvements:analysis.improvements,trajectory:analysis.trajectory??null},
      job_matches: jobMatches,
      all_jobs: allJobs ?? [],
    }),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}});

  } catch(e) {
    console.error("[CV] crash:", String(e).slice(0,400));
    return new Response(JSON.stringify({error:"Analysis failed. Please try again."}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
  }
});
