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
    // Status bar and splash screen handled natively in AppDelegate.swift
    console.log("[Native] Running in Capacitor:", Capacitor.getPlatform());
  } catch {
    // Not running in Capacitor
  }
}

initNative();

createRoot(document.getElementById("root")!).render(<App />);
