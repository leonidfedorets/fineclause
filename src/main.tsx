import { createRoot } from "react-dom/client";
import * as amplitude from "@amplitude/unified";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Amplitude — analytics + session replay
try {
  amplitude.initAll("3af7afd09b2a4327412064abacd05263", {
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 1 },
  });
} catch (e) {
  console.warn("[Analytics] Failed to initialise:", e);
}

// Capacitor native plugin initialisation (no-op on web)
async function initNative() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    const { SplashScreen } = await import("@capacitor/splash-screen");
    const { StatusBar, Style } = await import("@capacitor/status-bar");

    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#2563eb" });
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch {
    // Not running in Capacitor — ignore
  }
}

initNative();

createRoot(document.getElementById("root")!).render(<App />);
