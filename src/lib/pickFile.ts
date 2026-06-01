/**
 * Cross-platform file picker.
 * - On web: triggers the standard <input type="file"> dialog.
 * - On Capacitor native: uses the device photo/document picker,
 *   then converts the result to a File object that the rest of
 *   the app can use identically to a web-picked file.
 */
export async function pickFile(
  accept: string,
  inputRef: React.RefObject<HTMLInputElement>
): Promise<File | null> {
  // Detect native Capacitor context
  const isNative = (() => {
    try {
      const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
      return cap?.isNativePlatform?.() ?? false;
    } catch { return false; }
  })();

  if (!isNative) {
    // Web — just click the hidden input
    inputRef.current?.click();
    return null; // file comes back through the onChange event
  }

  // Native — use Camera plugin (supports both photos and files from gallery)
  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 95,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      presentationStyle: "popover",
    });

    if (!photo.dataUrl) return null;

    // Convert base64 data URL → Blob → File
    const res = await fetch(photo.dataUrl);
    const blob = await res.blob();
    const mimeType = photo.format === "pdf" ? "application/pdf" : `image/${photo.format}`;
    const fileName = `document_${Date.now()}.${photo.format ?? "jpg"}`;
    return new File([blob], fileName, { type: mimeType });
  } catch (e) {
    // User cancelled or error — return null silently
    console.warn("[pickFile] native picker cancelled:", e);
    return null;
  }
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
