import { useState, useEffect } from "react";
import { Download, Smartphone, Share, MoreVertical, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto mb-5">
            <Smartphone className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
            Install FineClause
          </h1>
          <p className="text-muted-foreground">
            Add FineClause to your home screen for instant access, offline viewing of past scans, and a native app experience.
          </p>
        </div>

        {installed ? (
          <div className="rounded-2xl bg-card border border-risk-safe/30 p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <CheckCircle className="w-12 h-12 text-risk-safe mx-auto mb-4" />
            <h2 className="text-xl font-bold font-display text-foreground mb-2">App Installed!</h2>
            <p className="text-muted-foreground">FineClause is now on your home screen. Open it anytime for quick contract scanning.</p>
          </div>
        ) : deferredPrompt ? (
          <div className="rounded-2xl bg-card border border-border p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <Button variant="hero" size="lg" className="py-6 px-10 text-base gap-2" onClick={handleInstall}>
              <Download className="w-5 h-5" />
              Install App
            </Button>
            <p className="text-sm text-muted-foreground mt-4">One tap to add to your home screen</p>
          </div>
        ) : (
          <div className="space-y-6">
            {isIOS ? (
              <div className="rounded-2xl bg-card border border-border p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="font-bold font-display text-foreground mb-4">Install on iPhone / iPad</h3>
                <ol className="space-y-4 text-sm text-foreground/80">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">1</span>
                    <span>Tap the <Share className="w-4 h-4 inline-block mx-1 text-accent" /> <strong>Share</strong> button in Safari</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">2</span>
                    <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">3</span>
                    <span>Tap <strong>"Add"</strong> to confirm</span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="rounded-2xl bg-card border border-border p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                <h3 className="font-bold font-display text-foreground mb-4">Install on Android</h3>
                <ol className="space-y-4 text-sm text-foreground/80">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">1</span>
                    <span>Tap the <MoreVertical className="w-4 h-4 inline-block mx-1 text-accent" /> <strong>menu</strong> in Chrome</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">2</span>
                    <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">3</span>
                    <span>Tap <strong>"Install"</strong> to confirm</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Benefits */}
            <div className="rounded-2xl bg-card border border-border p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="font-bold font-display text-foreground mb-4">Why install?</h3>
              <ul className="space-y-3 text-sm text-foreground/80">
                <li className="flex gap-3 items-start">
                  <CheckCircle className="w-4 h-4 text-risk-safe mt-0.5 flex-shrink-0" />
                  <span><strong>Instant access</strong> — Launch from your home screen like a native app</span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="w-4 h-4 text-risk-safe mt-0.5 flex-shrink-0" />
                  <span><strong>Offline viewing</strong> — Browse past scan results without internet</span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="w-4 h-4 text-risk-safe mt-0.5 flex-shrink-0" />
                  <span><strong>Fast loading</strong> — Cached resources for lightning-fast performance</span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle className="w-4 h-4 text-risk-safe mt-0.5 flex-shrink-0" />
                  <span><strong>Full screen</strong> — No browser toolbar for a distraction-free experience</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPage;
