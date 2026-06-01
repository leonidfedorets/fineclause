import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { verifyRegistrationResponse } from "npm:@simplewebauthn/server@13";
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authErr } = await sb.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { credential, deviceName } = await req.json();

    // Retrieve stored challenge (most recent, not expired)
    const { data: ch } = await sb
      .from("webauthn_challenges")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "registration")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ch) {
      return new Response(
        JSON.stringify({ error: "Challenge expired — please try again." }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Verify the registration response from the browser
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: ch.challenge,
      expectedOrigin: ORIGINS,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const {
      credential: cred,
      credentialDeviceType,
      credentialBackedUp,
      aaguid,
    } = verification.registrationInfo;

    // Convert Uint8Array → base64url using SimpleWebAuthn helper (Deno-safe, no Buffer)
    const publicKeyB64 = isoBase64URL.fromBuffer(cred.publicKey);

    // Persist the credential
    const { error: insertErr } = await sb.from("webauthn_credentials").insert({
      user_id:     user.id,
      credential_id: cred.id,
      public_key:  publicKeyB64,
      counter:     cred.counter,
      device_type: credentialDeviceType,
      backed_up:   credentialBackedUp,
      name:        (deviceName ?? "").trim() || "My Device",
      aaguid:      aaguid?.toString() ?? null,
      transports:  credential.transports ?? credential.response?.transports ?? ["internal"],
    });

    if (insertErr) {
      console.error("[register-verify] DB insert error:", insertErr);
      throw new Error("Failed to save passkey: " + insertErr.message);
    }

    // Clean up used challenge
    await sb.from("webauthn_challenges").delete().eq("id", ch.id);

    return new Response(JSON.stringify({ verified: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[webauthn-register-verify]", String(e));
    return new Response(
      JSON.stringify({ error: "Registration failed: " + String(e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
