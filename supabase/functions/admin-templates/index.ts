import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify JWT and admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Forbidden: admin role required");

    if (req.method === "GET") {
      // List all templates (including inactive)
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .order("category")
        .order("name");
      if (error) throw error;
      return new Response(JSON.stringify({ templates: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - create/upload template
    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { name, description, category, tags, file_content_base64, file_name } = body;
      if (!name || !category || !file_name) throw new Error("name, category, file_name required");

      // Upload file to storage
      const filePath = file_name.replace(/\s+/g, "_");
      if (file_content_base64) {
        const fileBytes = Uint8Array.from(atob(file_content_base64), c => c.charCodeAt(0));
        const { error: uploadError } = await supabase.storage
          .from("contract-templates")
          .upload(filePath, fileBytes, { upsert: true, contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        if (uploadError) throw uploadError;
      }

      // Insert record
      const { data, error } = await supabase
        .from("contract_templates")
        .insert({
          name,
          description: description || null,
          category,
          file_path: filePath,
          file_name: file_name,
          tags: tags || [],
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;

      return new Response(JSON.stringify({ template: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle_active") {
      const { template_id, is_active } = body;
      const { error } = await supabase
        .from("contract_templates")
        .update({ is_active })
        .eq("id", template_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { template_id, file_path } = body;
      // Delete from storage
      if (file_path) {
        await supabase.storage.from("contract-templates").remove([file_path]);
      }
      // Delete record
      const { error } = await supabase.from("contract_templates").delete().eq("id", template_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (e) {
    console.error("admin-templates error:", e);
    const msg = (e as Error).message;
    const status = msg?.includes("Unauthorized") ? 401
      : msg?.includes("Forbidden") ? 403 : 500;
    const safeMessage = status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : "An error occurred processing your request.";
    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
