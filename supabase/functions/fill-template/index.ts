import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is pro and not blocked
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro, is_blocked")
      .eq("user_id", user.id)
      .single();

    if (profile?.is_blocked) {
      return new Response(JSON.stringify({ error: "Account is suspended" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profile?.is_pro) {
      return new Response(JSON.stringify({ error: "Pro subscription required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, template_name, template_file } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch template content for context
    let templateContent = "";
    try {

      const { data } = await supabase.storage
        .from("contract-templates")
        .download(template_file);

      if (data && template_file.endsWith(".docx")) {
        const uint8 = new Uint8Array(await data.arrayBuffer());
        const { default: JSZip } = await import("https://esm.sh/jszip@3.10.1");
        const zip = await JSZip.loadAsync(uint8);
        const docXml = await zip.file("word/document.xml")?.async("string");
        if (docXml) {
          templateContent = docXml
            .replace(/<w:p[^>]*>/g, "\n")
            .replace(/<w:tab\/>/g, "\t")
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#x2019;/g, "'")
            .replace(/&#x201C;/g, '"')
            .replace(/&#x201D;/g, '"')
            .replace(/\n{3,}/g, "\n\n")
            .trim();
        }
      }
    } catch (e) {
      console.error("Template fetch error:", e);
    }

    const systemPrompt = `You are a professional legal document assistant for FineClause. Your job is to produce a COMPLETE, ready-to-sign "${template_name}" document.

${templateContent ? `Here is the template content:\n\n---\n${templateContent}\n---\n\n` : ""}

## YOUR APPROACH — SMART AUTO-FILL

**CRITICAL RULES:**
1. **NEVER ask the user complicated legal questions.** Do NOT ask about exclusivity, governing law, commission rates, termination clauses, indemnification terms, etc. Fill ALL legal terms with industry-standard best practices automatically.
2. **ONLY ask for essential contact/identity information** that you cannot infer:
   - Party 1: Full legal name, registered address, contact person, email
   - Party 2: Full legal name, registered address, contact person, email
   - Effective date (if not provided, use today's date)
3. When the user provides ANY information (even partial), immediately generate the COMPLETE filled document. Do not ask follow-up questions about legal terms.
4. For any missing contact details, use clear placeholders like [PARTY 1 NAME] that are easy to find and replace.

## LEGAL BEST PRACTICES TO AUTO-FILL:
- **Duration:** 1 year with automatic renewal
- **Termination:** 90 days written notice by either party; immediate for material breach
- **Commission/Payment:** Industry standard (e.g., Net-30 payment terms)
- **Governing Law:** Based on the jurisdiction from the provided addresses
- **Confidentiality:** Standard mutual confidentiality obligations
- **Liability:** Reasonable limitation of liability
- **Dispute Resolution:** Mediation first, then arbitration
- **Non-compete:** Reasonable scope (if applicable to template type)

## OUTPUT FORMAT:
When generating the document, output the COMPLETE document in clean, professional markdown format:
- Use **bold** for section headers
- Use proper numbering (1., 1.1, 1.2, etc.)
- Use horizontal rules (---) between major sections
- Include a signature block at the end
- Add a brief summary section at the TOP listing what was auto-filled and what the user should review

Keep responses concise and professional. Always remind users to have legal counsel review the final document.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("fill-template error:", e);
    return new Response(
      JSON.stringify({ error: "An internal error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
