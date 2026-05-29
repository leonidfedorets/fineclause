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

    const { company_name, country, tax_regime, gross_income, deductible_expenses, currency, quarter_label, vat_applicable, vat_rate } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const taxableIncome = gross_income - deductible_expenses;

    const prompt = `You are an expert tax advisor. Analyze the following business tax data and provide actionable advice.

Company: ${company_name}
Country/Region: ${country}
Tax Regime: ${tax_regime}
Quarter: ${quarter_label}
Currency: ${currency}
Gross Income: ${gross_income} ${currency}
Deductible Expenses: ${deductible_expenses} ${currency}
Taxable Income: ${taxableIncome} ${currency}
VAT Applicable: ${vat_applicable ? "Yes" : "No"}
VAT Rate: ${vat_rate}%

Please provide:
1. **Tax Estimate** — Estimate the income tax based on common ${country} tax brackets for ${tax_regime} regime. Show the calculation breakdown.
2. **Effective Tax Rate** — What percentage of gross income goes to taxes.
3. **VAT/GST Analysis** — If VAT is applicable, estimate VAT obligations and any input VAT credits.
4. **Deduction Opportunities** — 3-5 commonly overlooked deductions for businesses in ${country} that could reduce the tax burden.
5. **Quarterly Planning** — Specific advice for ${quarter_label}, including upcoming deadlines and recommended actions.
6. **Compliance Checklist** — Key filing requirements and deadlines for ${country}.

⚠️ Add a disclaimer that this is an AI estimate, not professional tax advice, and users should consult a certified tax professional.

Keep the response concise, practical, and well-structured. Use bullet points and bold headings. Respond in English unless the country suggests another primary language.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a tax advisory expert specializing in business taxation across multiple jurisdictions. Provide practical, data-driven tax estimates and optimization strategies." },
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
    console.error("analyze-tax error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
