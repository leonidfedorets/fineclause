import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const token = authHeader.replace("Bearer ", "");

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const userId = claimsData.claims.sub as string;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // LIST all users
    if (req.method === "GET") {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get actual scan counts per user
      const { data: scanCounts } = await supabase
        .from("scan_history")
        .select("user_id");

      const countMap: Record<string, number> = {};
      (scanCounts || []).forEach((s: { user_id: string }) => {
        countMap[s.user_id] = (countMap[s.user_id] || 0) + 1;
      });

      // Get agency user_ids
      const { data: agencies } = await supabase
        .from("agency_profiles")
        .select("user_id");

      const agencySet = new Set((agencies || []).map((a: { user_id: string }) => a.user_id));

      const enrichedProfiles = (profiles || []).map((p: any) => ({
        ...p,
        actual_scan_count: countMap[p.user_id] || 0,
        is_agency: agencySet.has(p.user_id),
      }));

      return new Response(JSON.stringify({ users: enrichedProfiles }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST actions
    if (req.method === "POST") {
      const body = await req.json();
      const { user_id: targetUserId, action: bodyAction } = body;

      if (!targetUserId || !bodyAction) throw new Error("user_id and action required");

      if (bodyAction === "toggle_block") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_blocked")
          .eq("user_id", targetUserId)
          .single();

        const currentlyBlocked = profile?.is_blocked ?? false;
        const { error } = await supabase
          .from("profiles")
          .update({ is_blocked: !currentlyBlocked })
          .eq("user_id", targetUserId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, blocked: !currentlyBlocked }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (bodyAction === "set_pro") {
        const { is_pro } = body;
        const { error } = await supabase
          .from("profiles")
          .update({ is_pro: is_pro ?? false })
          .eq("user_id", targetUserId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (bodyAction === "set_tier") {
        const { tier_key, product_id } = body;
        const isPro = tier_key !== "free";
        const { error } = await supabase
          .from("profiles")
          .update({
            is_pro: isPro,
            subscription_product_id: product_id || null,
          })
          .eq("user_id", targetUserId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (bodyAction === "reset_scans") {
        const { error } = await supabase
          .from("profiles")
          .update({ free_scans_used: 0 })
          .eq("user_id", targetUserId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unknown action: ${bodyAction}`);
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  } catch (error) {
    console.error("admin-users error:", error);
    return new Response(JSON.stringify({ error: "An error occurred processing your request." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
