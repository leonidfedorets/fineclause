import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const WhatWeCatchSection = () => {
  const { t } = useTranslation();

  const riskTypes = [
    { icon: "💰", label: t("whatWeCatch.hiddenFees"), title: t("whatWeCatch.hiddenFeesTitle"), description: t("whatWeCatch.hiddenFeesDesc") },
    { icon: "⚖️", label: t("whatWeCatch.unfairTerms"), title: t("whatWeCatch.unfairTermsTitle"), description: t("whatWeCatch.unfairTermsDesc") },
    { icon: "🔒", label: t("whatWeCatch.lockIn"), title: t("whatWeCatch.lockInTitle"), description: t("whatWeCatch.lockInDesc") },
    { icon: "⚠️", label: t("whatWeCatch.riskyLang"), title: t("whatWeCatch.riskyLangTitle"), description: t("whatWeCatch.riskyLangDesc") },
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
        >
          {t("whatWeCatch.eyebrow")}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display leading-[1.1] tracking-tight mb-16 max-w-[650px]"
        >
          {t("whatWeCatch.title")} <em className="italic text-accent">{t("whatWeCatch.titleAccent")}</em>
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 border-t border-border">
        {riskTypes.map((risk, idx) => (
          <motion.div
            key={risk.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="p-10 md:p-12 border-b border-border md:odd:border-r hover:bg-cream transition-colors duration-300 group"
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{risk.icon}</span>
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-accent font-medium">
                {risk.label}
              </span>
            </div>
            <h3 className="text-xl font-bold font-display mb-2.5 tracking-tight">
              {risk.title}
            </h3>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              {risk.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default WhatWeCatchSection;
