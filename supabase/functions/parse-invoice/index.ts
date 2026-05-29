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

    // Read file as base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const mimeType = file.type || "application/pdf";

    const extractionPrompt = `You are an invoice data extraction expert. Analyze this uploaded document and extract ALL invoice data.

Return a JSON object with exactly these fields (use null for missing fields):
{
  "invoice_type": "standard|proforma|credit_note|debit_note|receipt|vat|corrective|advance|final|recurring",
  "invoice_number": "string or null",
  "issue_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "seller_name": "string or null",
  "seller_address": "string or null",
  "seller_tax_id": "string or null",
  "seller_email": "string or null",
  "buyer_name": "string or null",
  "buyer_address": "string or null",
  "buyer_tax_id": "string or null",
  "buyer_email": "string or null",
  "currency": "EUR|PLN|CZK|GBP|USD or other ISO code",
  "items": [{"description": "string", "quantity": number, "unit": "string or null", "unit_price": number, "tax_rate": number or null, "total": number}],
  "subtotal": number,
  "tax_percent": number,
  "tax_amount": number,
  "total": number,
  "payment_method": "string or null",
  "bank_account": "string or null",
  "notes": "string or null",
  "reverse_charge": boolean,
  "original_invoice_ref": "string or null - for credit/corrective notes"
}

Return ONLY the JSON, no markdown wrapping.`;

    const messages: any[] = [
      { role: "system", content: "You are an invoice parsing AI. Extract structured data from invoice documents. Return only valid JSON." },
    ];

    // Use vision if it's an image, otherwise send as text extraction request
    if (mimeType.startsWith("image/")) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: extractionPrompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      });
    } else {
      // For PDFs and other docs, convert to text description for the AI
      messages.push({
        role: "user",
        content: [
          { type: "text", text: extractionPrompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      });
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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

    // Clean up markdown wrapping
    content = content.replace(/^```json\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI could not parse the invoice. Please try a clearer image or PDF.");
    }

    return new Response(
      JSON.stringify({ extracted: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("parse-invoice error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
