import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSection from "@/components/FeaturesSection";
import WhatWeCatchSection from "@/components/WhatWeCatchSection";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

const Index = () => {
  const navigate = useNavigate();
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <WhatWeCatchSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />

        {/* CTA Banner */}
        <section ref={ctaRef} className="bg-foreground text-primary-foreground py-24 px-6 md:px-16 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-[1200px] mx-auto">
            <motion.h2
              className="text-3xl md:text-4xl lg:text-5xl font-black font-display leading-[1.05] tracking-tight"
              initial={{ opacity: 0, x: -40 }}
              animate={ctaInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {t("cta.title1")}
              <br />
              <em className="italic text-accent">{t("cta.title2")}</em>
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={ctaInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            >
              <p className="text-primary-foreground/60 text-base leading-relaxed mb-9">
                {t("cta.description")}
              </p>
              <Button
                variant="hero"
                size="lg"
                className="text-[15px] px-8 py-5"
                onClick={() => navigate("/scan")}
              >
                {t("cta.button")}
              </Button>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
