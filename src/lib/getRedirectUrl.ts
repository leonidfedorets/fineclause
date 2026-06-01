/**
 * Returns the correct redirect URL for Supabase auth emails
 * (email confirmation, magic link, password reset).
 *
 * On web: uses the current origin (works for localhost + production).
 * On native Capacitor: uses the stable production URL because the
 * WebView runs on a custom scheme (capacitor://) which Supabase
 * would reject as an invalid redirect target.
 */
export function getAuthRedirectUrl(path = ""): string {
  const PRODUCTION_URL = "https://www.fineclause.com";

  try {
    // Detect Capacitor native context (capacitor:// or ionic:// scheme)
    if (
      window.location.protocol === "capacitor:" ||
      window.location.protocol === "ionic:" ||
      (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
        .Capacitor?.isNativePlatform?.()
    ) {
      return `${PRODUCTION_URL}${path}`;
    }
  } catch {
    // window not available (SSR/test context)
  }

  // Web: use current origin (localhost in dev, production domain in prod)
  const origin =
    typeof window !== "undefined" ? window.location.origin : PRODUCTION_URL;
  return `${origin}${path}`;
}
