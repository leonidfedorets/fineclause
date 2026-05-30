import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TIERS } from "@/lib/subscriptionTiers";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const PricingSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, currentTierKey } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (tierKey: string, priceId: string) => {
    if (tierKey === "free") { navigate("/scan"); return; }
    if (tierKey === "invoice" && !user) { navigate("/signup"); return; }
    if (tierKey === "agency") { navigate("/agency/signup"); return; }
    if (!user) { navigate("/signup"); return; }
    setLoading(tierKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { priceId } });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("STRIPE") || msg.includes("configuration")) {
        toast.error("Payment system is being configured. Please contact support.");
      } else {
        toast.error("Failed to start checkout. Please try again.");
      }
    } finally { setLoading(null); }
  };

  const tierMeta: Record<string, { label: string; cta: string; featured?: boolean }> = {
    free: { label: t("pricing.starter"), cta: t("pricing.getStartedFree") },
    basic: { label: t("pricing.basic"), cta: t("pricing.subscribeBasic") },
    pro: { label: t("pricing.professional"), cta: t("pricing.subscribePro"), featured: true },
    enterprise: { label: t("pricing.enterprise"), cta: t("pricing.subscribeEnterprise") },
    invoice: { label: t("pricing.invoiceAI"), cta: t("pricing.subscribeInvoice") },
    agency: { label: "Agency", cta: "Register — €25/mo" },
  };

  return (
    <section className="py-24 px-6 md:px-16 border-b border-border" id="pricing">
      <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
      >{t("pricing.eyebrow")}</motion.p>
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.1 }}
        className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display leading-[1.1] tracking-tight mb-16 max-w-[600px]"
      >
        {t("pricing.title")} <em className="italic text-accent">{t("pricing.titleAccent")}</em>
      </motion.h2>

      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 border border-border rounded-sm overflow-hidden max-w-[1500px]"
      >
        {TIERS.map((tier) => {
          const meta = tierMeta[tier.key];
          const isCurrent = user && tier.key === currentTierKey;
          const isFeatured = meta.featured;
          return (
            <div key={tier.key} className={`p-8 md:p-10 border-b md:border-b-0 md:border-r border-border last:border-r-0 transition-colors ${isFeatured ? "bg-foreground text-primary-foreground relative" : "hover:bg-cream"}`}>
              {isFeatured && (
                <span className="absolute top-4 right-4 font-mono text-[9px] tracking-[0.15em] bg-accent text-accent-foreground px-2.5 py-1 rounded-sm uppercase">
                  {t("pricing.mostPopular")}
                </span>
              )}
              <p className={`font-mono text-[11px] uppercase tracking-[0.15em] mb-2 ${isFeatured ? "text-primary-foreground/50" : "text-muted-foreground"}`}>{meta.label}</p>
              <div className="mb-1"><span className="font-display text-5xl font-black tracking-tight">€{tier.price}</span></div>
              <p className={`text-sm mb-8 ${isFeatured ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                {tier.price === 0 ? t("pricing.freeForever") : t("pricing.perMonth")}
              </p>
              <ul className="space-y-3 mb-8">
                {tier.features.map((item) => (
                  <li key={item} className={`flex items-center gap-2.5 text-sm border-b pb-2 ${isFeatured ? "text-primary-foreground/75 border-primary-foreground/10" : "text-muted-foreground border-border"}`}>
                    <span className="text-accent font-bold text-xs">✓</span>{item}
                  </li>
                ))}
              </ul>
              <Button variant={isFeatured ? "hero" : "outline"} className="w-full" size="lg" disabled={!!isCurrent || loading !== null} onClick={() => handleSelect(tier.key, tier.priceId)}>
                {loading === tier.key ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("common.loading")}</> : isCurrent ? t("pricing.currentPlan") : meta.cta}
              </Button>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
};

export default PricingSection;
