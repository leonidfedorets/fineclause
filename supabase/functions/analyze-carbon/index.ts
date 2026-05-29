import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { company_name, industry, energy_kwh, travel_km, waste_kg, employees, total_emissions_kg, offsets_kg } = await req.json();

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const prompt = `You are a carbon footprint sustainability expert. Analyze the following business carbon footprint data and provide actionable advice.

Company: ${company_name}
Industry: ${industry}
Energy consumption: ${energy_kwh} kWh
Business travel: ${travel_km} km
Waste produced: ${waste_kg} kg
Number of employees: ${employees}
Total estimated emissions: ${total_emissions_kg} kg CO₂
Current offsets: ${offsets_kg} kg CO₂

Please provide:
1. **Assessment** — A brief assessment of how this compares to industry averages for a ${industry} company of this size.
2. **Top 3 Reduction Tips** — Specific, actionable steps to reduce emissions, tailored to the ${industry} industry. Include estimated % reduction for each.
3. **Offset Recommendations** — If emissions aren't fully offset, suggest verified offset programs and how much it would cost approximately (€/tonne CO₂).
4. **Quick Wins** — 2-3 immediate low-cost changes that can be implemented this week.

Keep the response concise, practical, and encouraging. Use bullet points. Respond in the same language the user's browser is likely set to (default English).`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a sustainability and carbon footprint expert. Give practical, data-driven advice for businesses to reduce their environmental impact." },
          { role: "user", content: prompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error(`AI error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("analyze-carbon error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
