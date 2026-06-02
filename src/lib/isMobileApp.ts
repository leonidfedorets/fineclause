/**
 * Returns true when the app is running inside the Capacitor native shell
 * (iOS or Android). Returns false on the web browser.
 *
 * Used to:
 * - Bypass subscription / paywall checks for authenticated users
 * - Hide pricing sections and upgrade prompts
 * - Allow 1 free scan + CV upload for unauthenticated users
 */
export function isMobileApp(): boolean {
  try {
    const cap = (window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean };
    }).Capacitor;
    return cap?.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
}

/**
 * Mobile-aware header to send with Supabase function calls.
 * The backend uses this to bypass scan limits for authenticated mobile users.
 */
export const MOBILE_HEADER = { "X-Mobile-Client": "capacitor" } as const;
