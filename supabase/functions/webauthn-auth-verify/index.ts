import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { verifyAuthenticationResponse } from "npm:@simplewebauthn/server@13";
import { isoBase64URL } from "npm:@simplewebauthn/server@13/helpers";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RP_ID   = Deno.env.get("WEBAUTHN_RP_ID")    ?? "fineclause.com";
const ORIGINS = (Deno.env.get("WEBAUTHN_ORIGINS") ?? "https://fineclause.com,https://www.fineclause.com,http://localhost:8080").split(",");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    const { credential, userId } = await req.json();
    if (!credential || !userId) {
      return new Response(JSON.stringify({ error: "Missing credential or userId" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const credentialId: string = credential.id;

    // Find stored credential
    const { data: stored } = await sb.from("webauthn_credentials")
      .select("*").eq("credential_id", credentialId).maybeSingle();

    if (!stored) {
      return new Response(JSON.stringify({ error: "Credential not found" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Verify credential belongs to the claimed user
    if (stored.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Credential does not match user" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Retrieve challenge
    const { data: ch } = await sb.from("webauthn_challenges")
      .select("*").eq("user_id", userId).eq("type", "authentication")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (!ch) {
      return new Response(JSON.stringify({ error: "Challenge expired. Please try again." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: ch.challenge,
      expectedOrigin: ORIGINS,
      expectedRPID: RP_ID,
      credential: {
        id: stored.credential_id,
        publicKey: isoBase64URL.toBuffer(stored.public_key),
        counter: stored.counter,
        transports: stored.transports ?? ["internal"],
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return new Response(JSON.stringify({ error: "Verification failed" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Update counter & last_used
    await sb.from("webauthn_credentials").update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    }).eq("id", stored.id);

    // Delete used challenge
    await sb.from("webauthn_challenges").delete().eq("id", ch.id);

    // Get user email for magic link
    const { data: authUser } = await sb.auth.admin.getUserById(userId);
    if (!authUser?.user?.email) throw new Error("User not found");

    // Generate a one-time magic link token the client can exchange for a full session
    const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({
      type: "magiclink",
      email: authUser.user.email,
      options: { redirectTo: "https://www.fineclause.com/dashboard" },
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      throw new Error("Failed to generate session token");
    }

    return new Response(JSON.stringify({
      verified: true,
      hashed_token: linkData.properties.hashed_token,
      email: authUser.user.email,
    }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("[webauthn-auth-verify]", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
