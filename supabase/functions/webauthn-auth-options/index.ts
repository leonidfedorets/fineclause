import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { generateAuthenticationOptions } from "npm:@simplewebauthn/server@13";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RP_ID = Deno.env.get("WEBAUTHN_RP_ID") ?? "fineclause.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body.email?.trim().toLowerCase();

    // Look up user by email to find their credentials
    let userId: string | null = null;
    let allowCredentials: { id: string; transports: string[] }[] = [];

    if (email) {
      // Find user_id via profiles table
      const { data: profile } = await sb.from("profiles").select("user_id").eq("email", email).maybeSingle();
      if (profile?.user_id) {
        userId = profile.user_id;
        const { data: creds } = await sb.from("webauthn_credentials")
          .select("credential_id, transports").eq("user_id", userId);
        allowCredentials = (creds ?? []).map((c) => ({
          id: c.credential_id,
          transports: c.transports ?? ["internal"],
        }));
      }
    }

    if (!userId) {
      // No user found — still generate options (discoverable credential flow)
      // Browser will show all stored passkeys for the domain
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
      userVerification: "required",
    });

    // Store challenge (use a placeholder UUID if no user found yet)
    const challengeUserId = userId ?? "00000000-0000-0000-0000-000000000000";
    await sb.from("webauthn_challenges").delete().eq("user_id", challengeUserId).eq("type", "authentication");
    await sb.from("webauthn_challenges").insert({
      user_id: challengeUserId,
      challenge: options.challenge,
      type: "authentication",
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    return new Response(
      JSON.stringify({ ...options, userId }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[webauthn-auth-options]", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
