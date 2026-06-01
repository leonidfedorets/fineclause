import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY     = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// ── Public types ──────────────────────────────────────────────────────────────
export interface PasskeyRecord {
  id: string;
  name: string;
  device_type: string | null;
  backed_up: boolean;
  created_at: string;
  last_used_at: string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useWebAuthn = () => {
  const isSupported = browserSupportsWebAuthn();

  /** True if the device has a platform authenticator (Touch ID / Face ID / Windows Hello) */
  const isPlatformAvailable = async () => {
    try { return await platformAuthenticatorIsAvailable(); }
    catch { return false; }
  };

  // ── Register a new passkey ─────────────────────────────────────────────────
  const registerPasskey = async (deviceName?: string): Promise<boolean> => {
    try {
      // 1. Get registration options from server
      const { data: options, error: optsErr } = await supabase.functions.invoke(
        "webauthn-register-options"
      );
      if (optsErr) throw optsErr;

      // 2. Browser prompts user (Touch ID / Face ID / PIN)
      const credential = await startRegistration({ optionsJSON: options });

      // 3. Verify with server
      const { data: result, error: verifyErr } = await supabase.functions.invoke(
        "webauthn-register-verify",
        { body: { credential, deviceName: deviceName?.trim() || "My Device" } }
      );
      if (verifyErr) throw verifyErr;

      if (result?.verified) {
        toast.success("Passkey added! You can now sign in with biometrics.");
        return true;
      }
      throw new Error("Server could not verify the passkey.");
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "NotAllowedError") {
        toast.error("Passkey registration was cancelled.");
      } else if (err?.name === "InvalidStateError") {
        toast.error("This device already has a passkey registered.");
      } else {
        toast.error("Failed to add passkey: " + (err?.message ?? "Unknown error"));
      }
      return false;
    }
  };

  // ── Authenticate with a passkey ────────────────────────────────────────────
  const authenticateWithPasskey = async (email: string): Promise<boolean> => {
    try {
      // 1. Get authentication options (challenge + allowed credentials)
      const optsResp = await fetch(`${SUPABASE_URL}/functions/v1/webauthn-auth-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON_KEY },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const optionsData = await optsResp.json();
      if (!optsResp.ok) throw new Error(optionsData.error ?? "Failed to get options");
      if (!optionsData.userId) throw new Error("No passkey found for this email. Please sign in with your password first.");

      // 2. Browser prompts biometric
      const credential = await startAuthentication({ optionsJSON: optionsData });

      // 3. Verify with server → get session token
      const verifyResp = await fetch(`${SUPABASE_URL}/functions/v1/webauthn-auth-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON_KEY },
        body: JSON.stringify({ credential, userId: optionsData.userId }),
      });
      const result = await verifyResp.json();
      if (!verifyResp.ok) throw new Error(result.error ?? "Verification failed");

      // 4. Exchange hashed token for a real Supabase session
      if (result.hashed_token) {
        const { error: sessionErr } = await supabase.auth.verifyOtp({
          token_hash: result.hashed_token,
          type: "magiclink",
        });
        if (sessionErr) throw sessionErr;
      }

      return true;
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "NotAllowedError") {
        toast.error("Authentication was cancelled.");
      } else {
        toast.error(err?.message ?? "Passkey sign-in failed.");
      }
      return false;
    }
  };

  // ── CRUD passkeys ──────────────────────────────────────────────────────────
  const getPasskeys = async (): Promise<PasskeyRecord[]> => {
    const { data, error } = await supabase
      .from("webauthn_credentials" as never)
      .select("id, name, device_type, backed_up, created_at, last_used_at")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data as PasskeyRecord[]) ?? [];
  };

  const renamePasskey = async (id: string, name: string): Promise<boolean> => {
    const { error } = await supabase
      .from("webauthn_credentials" as never)
      .update({ name: name.trim() || "My Device" } as never)
      .eq("id", id);
    if (error) { toast.error("Rename failed"); return false; }
    toast.success("Passkey renamed");
    return true;
  };

  const deletePasskey = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from("webauthn_credentials" as never)
      .delete()
      .eq("id", id);
    if (error) { toast.error("Failed to remove passkey"); return false; }
    toast.success("Passkey removed");
    return true;
  };

  return {
    isSupported,
    isPlatformAvailable,
    registerPasskey,
    authenticateWithPasskey,
    getPasskeys,
    renamePasskey,
    deletePasskey,
  };
};
