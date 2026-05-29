import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const HowItWorksSection = () => {
  const { t } = useTranslation();

  const steps = [
    { num: "01", icon: "📤", title: t("howItWorks.step1Title"), description: t("howItWorks.step1Desc") },
    { num: "02", icon: "🔍", title: t("howItWorks.step2Title"), description: t("howItWorks.step2Desc") },
    { num: "03", icon: "📋", title: t("howItWorks.step3Title"), description: t("howItWorks.step3Desc") },
  ];

  return (
    <section id="how-it-works" className="border-b border-border">
      <div className="px-6 md:px-16 py-24">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
        >{t("howItWorks.eyebrow")}</motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display leading-[1.1] tracking-tight mb-16 max-w-[650px]"
        >
          {t("howItWorks.title")} <em className="italic text-accent">{t("howItWorks.titleAccent")}</em> {t("howItWorks.titleEnd")}
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-border">
        {steps.map((step, idx) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: idx * 0.12 }}
            className={`p-10 md:p-12 border-b md:border-b-0 ${idx < steps.length - 1 ? "md:border-r" : ""} border-border`}
          >
            <span className="block font-display text-6xl font-black text-foreground/[0.06] leading-none mb-4 select-none">
              {step.num}
            </span>
            <span className="block text-3xl mb-4">{step.icon}</span>
            <h3 className="text-xl font-bold font-display tracking-tight mb-3">
              {step.title}
            </h3>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;
