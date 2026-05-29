import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { file_path } = await req.json();
    if (!file_path || typeof file_path !== "string") {
      return new Response(JSON.stringify({ error: "file_path is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate file_path exists in contract_templates table
    const { data: templateRecord, error: lookupError } = await supabaseAuth
      .from("contract_templates")
      .select("id")
      .eq("file_path", file_path)
      .eq("is_active", true)
      .maybeSingle();

    if (lookupError || !templateRecord) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use anon-key client for storage download (bucket is public)
    const supabase = createClient(supabaseUrl, anonKey);

    const { data, error } = await supabase.storage
      .from("contract-templates")
      .download(file_path);

    if (error) {
      console.error("Storage download error:", error);
      return new Response(JSON.stringify({ error: "Failed to download template" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For .doc files, we can't easily parse them
    if (file_path.endsWith(".doc")) {
      return new Response(
        JSON.stringify({ content: "This is a legacy .doc format. Please download the file to view its full contents." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse .docx - extract text from XML
    const arrayBuffer = await data.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    let textContent = "";
    try {
      const { default: JSZip } = await import("https://esm.sh/jszip@3.10.1");
      const zip = await JSZip.loadAsync(uint8);
      const docXml = await zip.file("word/document.xml")?.async("string");

      if (docXml) {
        textContent = docXml
          .replace(/<w:p[^>]*>/g, "\n")
          .replace(/<w:tab\/>/g, "\t")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&#x2019;/g, "'")
          .replace(/&#x201C;/g, '"')
          .replace(/&#x201D;/g, '"')
          .replace(/&#x2018;/g, "'")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      }
    } catch (e) {
      console.error("DOCX parse error:", e);
      textContent = "Unable to parse this document format. Please download to view.";
    }

    return new Response(
      JSON.stringify({ content: textContent || "No text content found in this document." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("preview-template error:", e);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
