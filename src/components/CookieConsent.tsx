import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const CONSENT_KEY = "fineclause_cookie_consent";

const CookieConsent = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (type: "all" | "essential") => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ type, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-lg shadow-lg p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 p-2 rounded-md bg-accent/10">
            <Cookie className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm mb-1">{t("cookies.title")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {t("cookies.description")}{" "}
              <Link to="/cookies" className="text-accent hover:underline underline-offset-2">
                {t("cookies.learnMore")}
              </Link>{" "}
              &{" "}
              <Link to="/privacy" className="text-accent hover:underline underline-offset-2">
                {t("cookies.privacyPolicy")}
              </Link>.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="sm" onClick={() => accept("all")}>
                {t("cookies.acceptAll")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => accept("essential")}>
                {t("cookies.essentialOnly")}
              </Button>
            </div>
          </div>
          <button
            onClick={() => accept("essential")}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close cookie banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
