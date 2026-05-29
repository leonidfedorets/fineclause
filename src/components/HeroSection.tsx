import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Upload, BriefcaseBusiness, FileSearch, BarChart3, DollarSign, Target, Users, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="animate-fade-up">
      {/* Main Hero — Side by Side */}
      <div className="min-h-[88vh] grid grid-cols-1 lg:grid-cols-2 border-b border-border">
        {/* Left — Contract Intelligence */}
        <div
          className="px-6 md:px-16 py-20 flex flex-col justify-center lg:border-r border-border cursor-pointer group relative overflow-hidden"
          onClick={() => navigate("/scan")}
        >
          <span className="absolute -right-10 -bottom-16 font-display text-[280px] text-foreground/[0.03] leading-none pointer-events-none select-none">§</span>

          <div className="eyebrow mb-6">{t("hero.eyebrow")}</div>

          <h2 className="text-3xl md:text-4xl lg:text-[clamp(36px,4.5vw,56px)] font-black font-display leading-[1.05] tracking-tight mb-5">
            {t("hero.title1")}{" "}
            <em className="italic text-accent">{t("hero.titleAccent")}</em>
            <br />
            {t("hero.title2")}
          </h2>

          <p className="text-base text-muted-foreground max-w-[400px] mb-8 leading-relaxed font-light">
            {t("hero.description")}
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
            <Button
              variant="hero"
              size="lg"
              className="text-[15px] px-7 py-5"
              onClick={(e) => { e.stopPropagation(); navigate("/scan"); }}
            >
              {t("hero.cta")}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="heroOutline"
              size="lg"
              className="text-sm"
              onClick={(e) => { e.stopPropagation(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }}
            >
              {t("hero.seeHow")}
            </Button>
          </div>

          {/* Trust stats */}
          <div className="border-t border-border pt-7 flex gap-7 flex-wrap">
            {[
              { num: "12k+", label: t("hero.docsAnalyzed") },
              { num: "94%", label: t("hero.riskDetection") },
              { num: "58s", label: t("hero.avgReview") },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <span className="block font-display text-xl font-bold text-foreground">{s.num}</span>
                <span className="text-[10px] font-mono tracking-[0.08em] uppercase text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Career Intelligence */}
        <div
          className="px-6 md:px-16 py-20 flex flex-col justify-center bg-secondary/30 cursor-pointer group relative overflow-hidden"
          onClick={() => navigate("/careers")}
        >
          <span className="absolute -left-8 -bottom-12 font-display text-[280px] text-accent/[0.04] leading-none pointer-events-none select-none">★</span>

          <Badge
            variant="outline"
            className="text-xs font-mono tracking-wider uppercase border-accent text-accent px-3 py-1 mb-6 w-fit"
          >
            <Sparkles className="w-3 h-3 mr-1.5" />
            {t("career.badge")}
          </Badge>

          <h2 className="text-3xl md:text-4xl lg:text-[clamp(36px,4.5vw,56px)] font-black font-display leading-[1.05] tracking-tight mb-5">
            {t("career.title1")}
            <br />
            <em className="italic text-accent">{t("career.titleAccent")}</em>
          </h2>

          <p className="text-base text-muted-foreground max-w-[400px] mb-8 leading-relaxed font-light">
            {t("career.description")}
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
            <Button
              variant="hero"
              size="lg"
              className="text-[15px] px-7 py-5"
              onClick={(e) => { e.stopPropagation(); navigate("/careers"); }}
            >
              <Upload className="w-4 h-4 mr-2" />
              {t("career.analyzeCv")}
            </Button>
            <Button
              variant="heroOutline"
              size="lg"
              className="text-sm"
              onClick={(e) => { e.stopPropagation(); navigate("/employers"); }}
            >
              <BriefcaseBusiness className="w-4 h-4 mr-2" />
              {t("career.imHiring")}
            </Button>
          </div>

          {/* Mini feature grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: BarChart3, label: t("career.cvScore") },
              { icon: DollarSign, label: t("career.salaryRange") },
              { icon: Target, label: t("career.skillGaps") },
              { icon: Users, label: t("career.recruiterMatch") },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2.5 p-3 rounded-sm bg-card border border-border text-sm"
              >
                <f.icon className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="font-medium text-foreground text-xs">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Cards Row — Below Hero */}
      <div className="border-b border-border bg-secondary/20">
        <div className="max-w-[1200px] mx-auto px-6 md:px-16 py-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BarChart3, titleKey: "career.cvScore", descKey: "career.cvScoreDesc" },
            { icon: DollarSign, titleKey: "career.salaryRange", descKey: "career.salaryRangeDesc" },
            { icon: Target, titleKey: "career.skillGapAnalysis", descKey: "career.skillGapAnalysisDesc" },
            { icon: Users, titleKey: "career.recruiterMatching", descKey: "career.recruiterMatchingDesc" },
          ].map((f) => (
            <Card key={f.titleKey} className="p-5 hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300 cursor-default">
              <f.icon className="w-6 h-6 text-accent mb-3" />
              <h3 className="text-sm font-bold font-display mb-1">{t(f.titleKey)}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
            </Card>
          ))}
        </div>

        {/* Agency Banner */}
        <div className="max-w-[1200px] mx-auto px-6 md:px-16 pb-10">
          <div className="p-6 rounded-sm border border-border bg-card flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileSearch className="w-8 h-8 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold font-display mb-0.5">{t("career.agencyTitle")}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                  {t("career.agencyDesc")}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => navigate("/employers")}>
              {t("career.agencyButton")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
