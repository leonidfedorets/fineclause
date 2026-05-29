import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Flag, Zap, BarChart3, MessageSquare, GitCompare, Archive, ArrowRight } from "lucide-react";

const features = [
  { icon: Flag, color: "text-rose-500", bg: "bg-rose-500/8", titleKey: "features.redFlag", descKey: "features.redFlagDesc" },
  { icon: Zap, color: "text-amber-500", bg: "bg-amber-500/8", titleKey: "features.speed", descKey: "features.speedDesc" },
  { icon: BarChart3, color: "text-accent", bg: "bg-accent/8", titleKey: "features.riskScore", descKey: "features.riskScoreDesc" },
  { icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-500/8", titleKey: "features.askQuestions", descKey: "features.askQuestionsDesc" },
  { icon: GitCompare, color: "text-violet-500", bg: "bg-violet-500/8", titleKey: "features.compare", descKey: "features.compareDesc" },
  { icon: Archive, color: "text-sky-500", bg: "bg-sky-500/8", titleKey: "features.archive", descKey: "features.archiveDesc" },
];

const FeaturesSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative py-24 border-y border-border overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-muted/30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="eyebrow mb-4"
          >
            {t("features.eyebrow")}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold font-display leading-[1.1] tracking-tight"
          >
            {t("features.title")}{" "}
            <em className="not-italic text-accent">{t("features.titleAccent")}</em>
          </motion.h2>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: idx * 0.07 }}
              className="group bg-card border border-border rounded-2xl p-6 hover:shadow-[0_4px_24px_hsl(222_47%_11%/0.08)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="text-base font-semibold font-display mb-2 text-foreground tracking-tight">
                {t(feature.titleKey)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(feature.descKey)}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-card border border-border rounded-2xl"
        >
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">Ready to protect your business?</p>
            <p className="text-xs text-muted-foreground">Join thousands of professionals using FineClause daily.</p>
          </div>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all hover:shadow-[0_4px_16px_hsl(221_83%_53%/0.3)] flex-shrink-0"
          >
            Start for free <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
