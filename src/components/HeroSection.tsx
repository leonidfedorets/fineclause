import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Upload, BriefcaseBusiness, FileSearch,
  BarChart3, DollarSign, Target, Users, ShieldCheck,
  Sparkles, CheckCircle2, Scale, FileText, Zap
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const trustItems = [
    { icon: CheckCircle2, text: "GDPR Compliant" },
    { icon: ShieldCheck, text: "SOC 2 Ready" },
    { icon: Scale, text: "Legal-grade AI" },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background: subtle dot grid + gradient blobs */}
      <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-500/4 blur-[100px] pointer-events-none" />

      {/* Main Hero */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-28 pb-0">
        {/* Top badge */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/6 text-accent text-xs font-semibold tracking-wide">
            <Sparkles className="w-3 h-3" />
            AI-powered legal intelligence platform
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-center text-4xl md:text-5xl lg:text-[64px] font-bold font-display leading-[1.06] tracking-tight text-foreground max-w-4xl mx-auto mb-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {t("hero.title1")}{" "}
          <span className="relative inline-block">
            <em className="not-italic text-accent">{t("hero.titleAccent")}</em>
            <svg className="absolute -bottom-1 left-0 w-full" height="4" viewBox="0 0 200 4" preserveAspectRatio="none">
              <path d="M0 3 Q50 0 100 2 Q150 4 200 1" stroke="hsl(221 83% 53% / 0.4)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
          <br />
          {t("hero.title2")}
        </motion.h1>

        <motion.p
          className="text-center text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {t("hero.description")}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button
            onClick={() => navigate("/scan")}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all hover:shadow-[0_8px_32px_hsl(221_83%_53%/0.35)] active:scale-[0.98] group"
          >
            {t("hero.cta")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            {t("hero.seeHow")}
          </button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-6 mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          {trustItems.map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground">
              <item.icon className="w-3.5 h-3.5 text-accent" />
              <span className="font-medium">{item.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Stats bar */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-10 py-8 border-y border-border mb-0"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {[
            { num: "12k+", label: t("hero.docsAnalyzed") },
            { num: "94%", label: t("hero.riskDetection") },
            { num: "58s", label: t("hero.avgReview") },
            { num: "150+", label: "Clause types detected" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <span className="block font-display text-2xl font-bold text-foreground mb-0.5">{s.num}</span>
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Product cards — two columns */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Contract Intelligence card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onClick={() => navigate("/scan")}
            className="group relative bg-card border border-border rounded-2xl p-8 cursor-pointer overflow-hidden hover:shadow-[0_8px_40px_hsl(222_47%_11%/0.1)] transition-all duration-300 hover:-translate-y-1"
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/8 transition-colors" />

            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <FileSearch className="w-5 h-5 text-accent" />
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent/80 tracking-wider uppercase mb-3">
                {t("hero.eyebrow")}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold font-display leading-tight mb-3 text-foreground">
                {t("hero.title1")}{" "}
                <em className="not-italic text-accent">{t("hero.titleAccent")}</em>
                <br />{t("hero.title2")}
              </h2>

              <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">
                {t("hero.description")}
              </p>

              <div className="flex items-center gap-2 text-sm font-semibold text-accent group-hover:gap-3 transition-all">
                {t("hero.cta")} <ArrowRight className="w-4 h-4" />
              </div>

              {/* Mini stats */}
              <div className="flex gap-6 mt-8 pt-6 border-t border-border">
                {[
                  { num: "12k+", label: t("hero.docsAnalyzed") },
                  { num: "94%", label: t("hero.riskDetection") },
                  { num: "58s", label: t("hero.avgReview") },
                ].map((s) => (
                  <div key={s.label}>
                    <span className="block font-display text-lg font-bold text-foreground">{s.num}</span>
                    <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Career Intelligence card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={() => navigate("/careers")}
            className="group relative bg-card border border-border rounded-2xl p-8 cursor-pointer overflow-hidden hover:shadow-[0_8px_40px_hsl(222_47%_11%/0.1)] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-500/8 transition-colors" />

            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center mb-5">
                <Sparkles className="w-5 h-5 text-violet-500" />
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-500/80 tracking-wider uppercase mb-3">
                {t("career.badge")}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold font-display leading-tight mb-3 text-foreground">
                {t("career.title1")}
                <br />
                <em className="not-italic text-violet-500">{t("career.titleAccent")}</em>
              </h2>

              <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">
                {t("career.description")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("/careers"); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {t("career.analyzeCv")}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("/employers"); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  <BriefcaseBusiness className="w-4 h-4" />
                  {t("career.imHiring")}
                </button>
              </div>

              {/* Feature grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: BarChart3, label: t("career.cvScore") },
                  { icon: DollarSign, label: t("career.salaryRange") },
                  { icon: Target, label: t("career.skillGaps") },
                  { icon: Users, label: t("career.recruiterMatch") },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/60">
                    <f.icon className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Business tools strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-0.5">{t("career.agencyTitle")}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">{t("career.agencyDesc")}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/employers")}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            {t("career.agencyButton")}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
