import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const testimonials = [
  {
    quote:
      "FineClause caught a clause in my lease that would have made me liable for structural repairs. My landlord tried to sneak it in. I never would have noticed on my own.",
    author: "M. Kowalski",
    role: "Freelance Designer, Warsaw",
  },
  {
    quote:
      "I uploaded my new employment contract before signing. The IP clause would have given my employer rights to my side projects. Renegotiated it out entirely before day one.",
    author: "T. Rauf",
    role: "Software Engineer, Berlin",
  },
  {
    quote:
      "As a small agency owner I review 10+ contracts a month. FineClause saves me 3–4 hours weekly and has already prevented one contract dispute that would have cost thousands.",
    author: "L. Ferreira",
    role: "Agency Founder, Lisbon",
  },
];

const TestimonialsSection = () => {
  const { t } = useTranslation();

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
          {t("testimonials.eyebrow")}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display leading-[1.1] tracking-tight mb-16 max-w-[600px]"
        >
          {t("testimonials.title")} <em className="italic text-accent">{t("testimonials.titleAccent")}</em>
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-border">
        {testimonials.map((tst, idx) => (
          <motion.div
            key={tst.author}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: idx * 0.12 }}
            className="p-10 md:p-12 border-b md:border-b-0 md:border-r border-border last:border-r-0"
          >
            <span className="block font-display text-6xl leading-[0.8] text-accent/40 mb-5 select-none">
              "
            </span>
            <blockquote className="font-display text-[17px] italic leading-relaxed text-foreground mb-6">
              {tst.quote}
            </blockquote>
            <p className="text-sm text-muted-foreground font-mono tracking-wide">
              {tst.author} — {tst.role}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
