import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSection from "@/components/FeaturesSection";
import WhatWeCatchSection from "@/components/WhatWeCatchSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { isMobileApp } from "@/lib/isMobileApp";

const Index = () => {
  const navigate = useNavigate();
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" });
  const { t } = useTranslation();
  const mobile = isMobileApp();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <WhatWeCatchSection />

        <TestimonialsSection />
        <FAQSection />

        {/* CTA Banner — hidden in the mobile app (Apple 3.1.1: no "free trial / no credit card" sign-up prompts) */}
        {!mobile && (
        <section ref={ctaRef} className="relative overflow-hidden bg-accent">
          <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              <motion.div
                initial={{ opacity: 0, x: -32 }}
                animate={ctaInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-4">Get started today</p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display leading-[1.08] tracking-tight text-white">
                  {t("cta.title1")}
                  <br />
                  <em className="not-italic text-white/80">{t("cta.title2")}</em>
                </h2>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 32 }}
                animate={ctaInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              >
                <p className="text-white/70 text-base leading-relaxed mb-8">
                  {t("cta.description")}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate("/scan")}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-accent text-sm font-semibold hover:bg-white/90 transition-all hover:shadow-[0_8px_32px_hsl(0_0%_0%/0.2)] active:scale-[0.98]"
                  >
                    {t("cta.button")}
                  </button>
                  {!mobile && (
                    <button
                      onClick={() => navigate("/signup")}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                      Create free account
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default Index;
