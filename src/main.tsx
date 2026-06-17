import { createRoot } from "react-dom/client";
import * as amplitude from "@amplitude/unified";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { isMobileApp } from "@/lib/isMobileApp";

// Amplitude — analytics + session replay.
// Disabled entirely in the mobile app: session replay records user activity
// and would require an AppTrackingTransparency prompt under Apple Guideline
// 5.1.2(i). The iOS/Android builds run with no analytics/tracking.
if (!isMobileApp()) {
  try {
    amplitude.initAll("3af7afd09b2a4327412064abacd05263", {
      analytics: { autocapture: true },
      sessionReplay: { sampleRate: 1 },
    });
  } catch (e) {
    console.warn("[Analytics] Failed to initialise:", e);
  }
}

// Capacitor native init (no-op on web)
async function initNative() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    // Status bar — match system dark/light mode
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    await StatusBar.setStyle({ style: prefersDark ? Style.Dark : Style.Light });
    await StatusBar.setOverlaysWebView({ overlay: false });

    // Keyboard — scroll focused input into view, keep the iOS input accessory bar
    const { Keyboard } = await import("@capacitor/keyboard");
    await Keyboard.setScroll({ isDisabled: false });
    await Keyboard.setAccessoryBarVisible({ isVisible: true });

    // Keep status bar style in sync when the user switches system appearance
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", async (e) => {
      await StatusBar.setStyle({ style: e.matches ? Style.Dark : Style.Light });
    });
  } catch {
    // Not running in Capacitor — ignore
  }
}

initNative();

createRoot(document.getElementById("root")!).render(<App />);
