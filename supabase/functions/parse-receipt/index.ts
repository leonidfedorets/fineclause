import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new Error("No file uploaded");

    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const mimeType = file.type || "image/jpeg";

    const extractionPrompt = `You are a receipt/expense data extraction expert. Analyze this uploaded receipt or expense document and extract ALL relevant data.

Return a JSON object with exactly these fields (use null for missing fields):
{
  "vendor_name": "string - the store/vendor/merchant name",
  "amount": number - the total amount paid,
  "currency": "EUR|PLN|CZK|GBP|USD or other ISO code",
  "category": "one of: food|transport|office|software|travel|entertainment|utilities|insurance|medical|education|clothing|rent|subscriptions|other",
  "description": "string - brief description of the purchase",
  "expense_date": "YYYY-MM-DD - date of the transaction",
  "tax_amount": number or null,
  "payment_method": "cash|card|bank_transfer|other or null",
  "items": [{"name": "string", "quantity": number, "price": number}] or null
}

Return ONLY the JSON, no markdown wrapping.`;

    const messages = [
      { role: "system", content: "You are a receipt parsing AI. Extract structured expense data from receipts and expense documents. Return only valid JSON." },
      {
        role: "user",
        content: [
          { type: "text", text: extractionPrompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    content = content.replace(/^```json\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI could not parse the receipt. Please try a clearer image.");
    }

    return new Response(
      JSON.stringify({ extracted: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("parse-receipt error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
