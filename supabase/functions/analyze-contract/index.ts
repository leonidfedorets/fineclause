import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import pdf from "npm:pdf-parse@1.1.1/lib/pdf-parse.js";
import mammoth from "npm:mammoth@1.8.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_TEXT_LENGTH = 15000;

const SYSTEM_PROMPT = `You are a legal contract analysis AI. The user will provide the text content of a contract or legal document. Analyze it and return a structured JSON response.

For each significant clause you identify, provide:
- "title": Short name of the clause type (e.g., "Auto-Renewal", "Non-Compete", "Liability Cap")
- "text": The exact or near-exact text from the document for this clause (keep it under 200 characters, use "..." if needed)
- "risk": One of "safe", "caution", or "danger"
- "explanation": A plain-language explanation of what this clause means and why it has that risk level (2-3 sentences max)
- "suggestedAlternative": For "caution" and "danger" clauses ONLY, provide a rewritten version of the clause that would be fairer and more balanced for the user. Write it as actual contract language they could propose as a replacement. For "safe" clauses, set this to null.

Also provide:
- "summary": A 2-3 sentence plain-language summary of the entire document
- "documentType": What type of document this appears to be (e.g., "Employment Contract", "Lease Agreement", "SaaS Terms of Service")

Return ONLY valid JSON in this exact format, no markdown:
{
  "documentType": "string",
  "summary": "string",
  "clauses": [
    {
      "title": "string",
      "text": "string",
      "risk": "safe|caution|danger",
      "explanation": "string",
      "suggestedAlternative": "string|null"
    }
  ]
}

Analyze 5-10 of the most important clauses. Focus on clauses that contain risks, hidden fees, restrictive terms, auto-renewals, liability limitations, termination conditions, non-compete restrictions, intellectual property assignments, penalty clauses, and deadline-sensitive provisions.`;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/rtf",
];

async function extractTextFromFile(fileBase64: string, fileType: string): Promise<string> {
  const binaryString = atob(fileBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Server-side file size check
  if (bytes.length > MAX_FILE_SIZE) {
    throw new Error("File exceeds the 20MB size limit.");
  }

  // Validate magic bytes for PDF
  if (fileType === "application/pdf" || fileType.endsWith(".pdf")) {
    if (bytes.length < 5 || String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") {
      throw new Error("Invalid PDF file.");
    }
    const result = await pdf(bytes);
    return result.text;
  }

  // Validate magic bytes for DOCX (PK zip header)
  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType.endsWith(".docx")
  ) {
    if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
      throw new Error("Invalid DOCX file.");
    }
    const result = await mammoth.extractRawText({ buffer: bytes.buffer });
    return result.value;
  }

  // Fallback: decode as text
  const decoder = new TextDecoder("utf-8", { fatal: false });
  return decoder.decode(bytes);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Block check ---
    const userId = claimsData.claims.sub as string;
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const { data: profileCheck } = await adminClient
      .from("profiles")
      .select("is_blocked")
      .eq("user_id", userId)
      .single();
    if (profileCheck?.is_blocked) {
      return new Response(
        JSON.stringify({ error: "Your account has been suspended." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Scan quota enforcement (uses cached subscription_product_id from profiles) ---
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_pro, free_scans_used, subscription_product_id")
      .eq("user_id", userId)
      .single();

    const TIER_LIMITS: Record<string, number | null> = {
      "prod_U3SeCMHKuHMYC0": 10,   // Basic: 10 scans
      "prod_U1Lnud0U3FVc6k": null, // Pro: unlimited
      "prod_U3TACwcpT0V5NA": null, // Enterprise: unlimited
    };
    const FREE_SCAN_LIMIT = 1;

    let scanLimit: number | null = FREE_SCAN_LIMIT;

    if (profile?.is_pro) {
      scanLimit = null;
    } else if (profile?.subscription_product_id && profile.subscription_product_id in TIER_LIMITS) {
      scanLimit = TIER_LIMITS[profile.subscription_product_id];
    }

    if (scanLimit !== null && (profile?.free_scans_used ?? 0) >= scanLimit) {
      return new Response(
        JSON.stringify({ error: "Scan limit reached. Please upgrade your plan." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Input parsing & validation ---
    const body = await req.json();
    let documentText: string;

    if (body.fileData && body.fileType) {
      // Validate file type
      const normalizedType = body.fileType.toLowerCase();
      const isAllowed = ALLOWED_TYPES.some(t => normalizedType.includes(t)) ||
        [".pdf", ".docx", ".txt", ".md", ".rtf"].some(ext => normalizedType.endsWith(ext));
      if (!isAllowed) {
        return new Response(
          JSON.stringify({ error: "Unsupported file type. Please upload PDF, DOCX, or TXT files." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      documentText = await extractTextFromFile(body.fileData, body.fileType);
    } else if (body.documentText) {
      if (typeof body.documentText !== "string" || body.documentText.length > 500000) {
        return new Response(
          JSON.stringify({ error: "Text input is too large. Please use a shorter document." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      documentText = body.documentText;
    } else {
      return new Response(
        JSON.stringify({ error: "Provide either documentText or fileData + fileType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!documentText.trim()) {
      return new Response(
        JSON.stringify({ error: "Could not extract text from this file. The document may be scanned/image-based." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip control characters (except newlines/tabs)
    documentText = documentText.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, "");

    // Truncate with notification in response
    const wasTruncated = documentText.length > MAX_TEXT_LENGTH;
    const textForAnalysis = documentText.slice(0, MAX_TEXT_LENGTH);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error. Please try again later." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Please analyze this contract:\n\n${textForAnalysis}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ error: "Analysis service unavailable. Please try again later." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Analysis failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse AI response");
      return new Response(
        JSON.stringify({ error: "Analysis produced invalid results. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add truncation notice if applicable
    if (wasTruncated) {
      parsed.truncated = true;
      parsed.truncatedNotice = `Document was truncated from ${documentText.length} to ${MAX_TEXT_LENGTH} characters for analysis.`;
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-contract error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
