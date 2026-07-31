import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import pdf from "npm:pdf-parse@1.1.1/lib/pdf-parse.js";
import mammoth from "npm:mammoth@1.8.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-mobile-client",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_TEXT_LENGTH = 15000;

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  uk: "Ukrainian",
  lv: "Latvian",
  cs: "Czech",
  de: "German",
  es: "Spanish",
  fr: "French",
  pl: "Polish",
};

function resolveLanguageName(code: string | undefined): string {
  if (!code) return LANGUAGE_NAMES.en;
  const base = code.slice(0, 2).toLowerCase();
  return LANGUAGE_NAMES[base] ?? LANGUAGE_NAMES.en;
}

function buildSystemPrompt(languageName: string): string {
  return `You are a legal contract analysis AI. The user will provide the text content of a contract or legal document. Analyze it and return a structured JSON response.

For each significant clause you identify, provide:
- "title": Short name of the clause type (e.g., "Auto-Renewal", "Non-Compete", "Liability Cap")
- "text": The exact or near-exact text from the document for this clause (keep it under 200 characters, use "..." if needed) — quote it in the document's original language, do not translate it
- "risk": One of "safe", "caution", or "danger" — always in English, exactly one of these three lowercase words, never translated
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

Analyze 5-10 of the most important clauses. Focus on clauses that contain risks, hidden fees, restrictive terms, auto-renewals, liability limitations, termination conditions, non-compete restrictions, intellectual property assignments, penalty clauses, and deadline-sensitive provisions.

IMPORTANT — language: Write "documentType", "title", "explanation", "suggestedAlternative", and "summary" in ${languageName}, regardless of the language of the source document. The "text" field must stay quoted in the document's original language (never translate quoted text). The "risk" field must always be the literal English word "safe", "caution", or "danger" — never translate or localize it, and never translate any JSON key name.`;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/rtf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

// Extract text from raw bytes — avoids base64 round-trip
async function extractTextFromBytes(bytes: Uint8Array, fileTypeHint: string): Promise<string> {
  if (bytes.length > MAX_FILE_SIZE) {
    throw new Error("File exceeds the 20MB size limit.");
  }

  const lower = fileTypeHint.toLowerCase();

  if (lower.includes("pdf")) {
    // Skip strict magic-byte check — iOS Files app / iCloud stubs can have a BOM prefix.
    // Let pdf-parse decide; catch its error and surface a clear message.
    try {
      const result = await pdf(bytes);
      return result.text;
    } catch (e) {
      throw new Error("Could not read this PDF. Make sure it is a standard PDF file (not password-protected or corrupted).");
    }
  }

  if (lower.includes("docx") || lower.includes("wordprocessingml")) {
    if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
      throw new Error("Invalid DOCX file.");
    }
    const result = await mammoth.extractRawText({ buffer: bytes.buffer });
    return result.value;
  }

  const decoder = new TextDecoder("utf-8", { fatal: false });
  return decoder.decode(bytes);
}

// Encode bytes to base64 in chunks to avoid call-stack overflow on large files
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

// Shared Vision API call — accepts a pre-formed data URL to avoid redundant server-side encoding
async function analyzeImageWithVision(imageDataUrl: string, apiKey: string, languageName: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  let visionResponse: globalThis.Response;
  try {
    visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: buildSystemPrompt(languageName) },
          {
            role: "user",
            content: [
              { type: "text", text: "Please analyze this contract document shown in the image:" },
              { type: "image_url", image_url: { url: imageDataUrl, detail: "auto" } },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });
  } catch (e: any) {
    clearTimeout(timeout);
    const isTimeout = e?.name === "AbortError";
    console.error("Vision fetch error:", isTimeout ? "timeout after 45s" : String(e));
    return new Response(
      JSON.stringify({ error: isTimeout ? "Image analysis timed out. Please try a clearer photo." : "Could not reach AI service. Please try again." }),
      { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  clearTimeout(timeout);

  if (!visionResponse.ok) {
    const errText = await visionResponse.text();
    console.error("Vision API error:", visionResponse.status, errText.slice(0, 400));
    if (visionResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: `Image analysis failed (${visionResponse.status}): ${errText.slice(0, 150)}` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const visionData = await visionResponse.json();
  const visionContent = visionData.choices?.[0]?.message?.content;
  if (!visionContent) {
    return new Response(
      JSON.stringify({ error: "Could not read contract from image. Please ensure the document is clearly visible." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const jsonMatch = visionContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, visionContent];
    const parsed = JSON.parse(jsonMatch[1].trim());
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    console.error("Failed to parse Vision API response");
    return new Response(
      JSON.stringify({ error: "Analysis produced invalid results. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
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

    const isMobileClient = req.headers.get("X-Mobile-Client") === "capacitor";

    // --- Scan quota enforcement ---
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_pro, free_scans_used, subscription_product_id")
      .eq("user_id", userId)
      .single();

    const TIER_LIMITS: Record<string, number | null> = {
      "prod_U3SeCMHKuHMYC0": 10,
      "prod_U1Lnud0U3FVc6k": null,
      "prod_U3TACwcpT0V5NA": null,
    };
    const FREE_SCAN_LIMIT = 1;

    let scanLimit: number | null = FREE_SCAN_LIMIT;
    if (isMobileClient) {
      scanLimit = null;
    } else if (profile?.is_pro) {
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

    // --- OpenAI key ---
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error. Please try again later." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Input parsing ---
    // FormData path: file uploads from file picker or camera (binary, no base64 overhead)
    // JSON path: text paste only
    const contentType = req.headers.get("content-type") ?? "";
    let documentText: string | undefined;
    let languageName = LANGUAGE_NAMES.en;

    if (contentType.includes("multipart/form-data")) {
      let formData: FormData;
      try {
        formData = await req.formData();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Could not read uploaded file." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      languageName = resolveLanguageName(formData.get("language") as string | null ?? undefined);

      const file = formData.get("file") as File | null;
      if (!file || file.size === 0) {
        return new Response(
          JSON.stringify({ error: "No file provided." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ error: "File exceeds the 20MB size limit." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const typeHint = (file.type + " " + file.name).toLowerCase();
      const isAllowed = ALLOWED_TYPES.some(t => typeHint.includes(t)) ||
        [".pdf", ".docx", ".txt", ".md", ".rtf"].some(ext => typeHint.endsWith(ext));
      if (!isAllowed) {
        return new Response(
          JSON.stringify({ error: "Unsupported file type. Please upload PDF, DOCX, or TXT files." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const bytes = new Uint8Array(await file.arrayBuffer());

      // Image file — route to Vision API
      if (typeHint.includes("image/")) {
        const mimeType = typeHint.includes("jpg") ? "image/jpeg" : (file.type || "image/jpeg");
        const base64 = bytesToBase64(bytes);
        return await analyzeImageWithVision(`data:${mimeType};base64,${base64}`, OPENAI_API_KEY, languageName);
      }

      // Document — extract text server-side
      try {
        documentText = await extractTextFromBytes(bytes, typeHint);
      } catch (e: any) {
        return new Response(
          JSON.stringify({ error: e.message ?? "Could not read the file." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

    } else {
      // JSON path — text paste only
      let body: Record<string, string>;
      try {
        body = await req.json();
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid request body." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      languageName = resolveLanguageName(body.language);

      // Camera image path — base64 computed client-side (avoids server-side conversion overhead)
      if (body.imageBase64 && body.imageType) {
        const mimeType = (body.imageType as string).toLowerCase().includes("jpg") ? "image/jpeg" : (body.imageType as string);
        const imageDataUrl = `data:${mimeType};base64,${body.imageBase64}`;
        return await analyzeImageWithVision(imageDataUrl, OPENAI_API_KEY, languageName);
      }

      if (body.documentText) {
        if (typeof body.documentText !== "string" || body.documentText.length > 500000) {
          return new Response(
            JSON.stringify({ error: "Text input is too large. Please use a shorter document." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        documentText = body.documentText;
      } else {
        return new Response(
          JSON.stringify({ error: "Provide a file upload or paste document text." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!documentText?.trim()) {
      return new Response(
        JSON.stringify({ error: "This document contains no readable text (it may be a scanned image-based PDF). Please use the 'Scan Photo' button to photograph the document with your camera instead." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip control characters (except newlines/tabs)
    documentText = documentText.replace(/[^\x09\x0A\x0D\x20-\x7E -￿]/g, "");

    const wasTruncated = documentText.length > MAX_TEXT_LENGTH;
    const textForAnalysis = documentText.slice(0, MAX_TEXT_LENGTH);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: buildSystemPrompt(languageName) },
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
