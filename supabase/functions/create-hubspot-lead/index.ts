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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { candidate_id, cv_id, employer_id } = await req.json();

    if (!candidate_id || !cv_id || !employer_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get agency profile with HubSpot key
    const { data: agency } = await supabase
      .from("agency_profiles")
      .select("hubspot_api_key, agency_name")
      .eq("user_id", employer_id)
      .single();

    if (!agency?.hubspot_api_key) {
      return new Response(JSON.stringify({ error: "No HubSpot API key configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get candidate + CV data
    const { data: candidate } = await supabase
      .from("candidates")
      .select("email, name, phone, location")
      .eq("id", candidate_id)
      .single();

    const { data: cv } = await supabase
      .from("cv_uploads")
      .select("ai_score, salary_min, salary_max, skills, experience_years, education_level, summary, file_name")
      .eq("id", cv_id)
      .single();

    if (!candidate) {
      return new Response(JSON.stringify({ error: "Candidate not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create HubSpot contact
    const contactRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${agency.hubspot_api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          email: candidate.email,
          firstname: candidate.name?.split(" ")[0] || "",
          lastname: candidate.name?.split(" ").slice(1).join(" ") || "",
          phone: candidate.phone || "",
          city: candidate.location || "",
          jobtitle: cv?.summary?.slice(0, 100) || "Candidate",
          hs_lead_status: "NEW",
        },
      }),
    });

    let contactId: string;

    if (contactRes.status === 409) {
      // Contact exists, search by email
      const searchRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${agency.hubspot_api_key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filterGroups: [{
              filters: [{ propertyName: "email", operator: "EQ", value: candidate.email }],
            }],
          }),
        }
      );
      const searchData = await searchRes.json();
      contactId = searchData.results?.[0]?.id;
      if (!contactId) throw new Error("Could not find or create HubSpot contact");
    } else if (!contactRes.ok) {
      const errText = await contactRes.text();
      console.error("[HUBSPOT] Contact create error:", contactRes.status, errText);
      throw new Error(`HubSpot contact creation failed: ${contactRes.status}`);
    } else {
      const contactData = await contactRes.json();
      contactId = contactData.id;
    }

    // Create a note with CV analysis
    const noteBody = [
      `📄 CV Analysis Report — ${cv?.file_name || "CV"}`,
      `Score: ${cv?.ai_score || "N/A"}/100`,
      `Salary Range: €${cv?.salary_min?.toLocaleString() || "?"} – €${cv?.salary_max?.toLocaleString() || "?"}`,
      `Experience: ${cv?.experience_years || "?"} years | Education: ${cv?.education_level || "N/A"}`,
      `Skills: ${(cv?.skills as string[] || []).join(", ") || "N/A"}`,
      ``,
      `Summary: ${cv?.summary || "No summary available"}`,
      ``,
      `Source: FineClause Career Intelligence | Agency: ${agency.agency_name}`,
    ].join("\n");

    await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${agency.hubspot_api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          hs_note_body: noteBody,
          hs_timestamp: new Date().toISOString(),
        },
        associations: [{
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
        }],
      }),
    });

    console.log(`[HUBSPOT] Lead created for candidate ${candidate_id}, contact ${contactId}`);

    return new Response(JSON.stringify({ success: true, contact_id: contactId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[HUBSPOT] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
