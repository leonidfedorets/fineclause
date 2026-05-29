import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    { icon: "🚩", title: t("features.redFlag"), description: t("features.redFlagDesc") },
    { icon: "⚡", title: t("features.speed"), description: t("features.speedDesc") },
    { icon: "📊", title: t("features.riskScore"), description: t("features.riskScoreDesc") },
    { icon: "💬", title: t("features.askQuestions"), description: t("features.askQuestionsDesc") },
    { icon: "🔄", title: t("features.compare"), description: t("features.compareDesc") },
    { icon: "📁", title: t("features.archive"), description: t("features.archiveDesc") },
  ];

  return (
    <section className="border-b border-border">
      <div className="px-6 md:px-16 py-24">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
        >{t("features.eyebrow")}</motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display leading-[1.1] tracking-tight mb-16 max-w-[600px]"
        >
          {t("features.title")} <em className="italic text-accent">{t("features.titleAccent")}</em>
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 border-t border-border">
        {features.map((feature, idx) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
            className="p-10 md:p-12 border-b border-border md:odd:border-r hover:bg-cream transition-colors duration-300"
          >
            <div className="w-12 h-12 border border-border rounded-full bg-card flex items-center justify-center text-xl mb-5">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold font-display mb-2.5 tracking-tight">
              {feature.title}
            </h3>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
