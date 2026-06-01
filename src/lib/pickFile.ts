/**
 * Cross-platform file picker.
 * - On web: triggers the standard <input type="file"> dialog.
 * - On native: falls back to web input (Capacitor plugins not bundled;
 *   native camera/document picker can be added post-launch via a custom plugin).
 */
export async function pickFile(
  _accept: string,
  inputRef: React.RefObject<HTMLInputElement>
): Promise<File | null> {
  // For now, use the standard web file input on all platforms.
  // The WebView on iOS/Android supports <input type="file"> natively.
  inputRef.current?.click();
  return null; // file comes back through the onChange event
}

/**
 * Returns true when running inside a Capacitor native app.
 */
export function isNativePlatform(): boolean {
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    return cap?.isNativePlatform?.() ?? false;
  } catch { return false; }
}
