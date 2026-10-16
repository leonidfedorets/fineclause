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
import { Smartphone, Star } from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/app/fineclause/id6775821568";

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

        {/* iOS App Banner — web only */}
        {!mobile && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900"
          >
            <div className="absolute inset-0 dot-grid opacity-5 pointer-events-none" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-16 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-1">Now available</p>
                  <h2 className="text-2xl font-bold font-display text-white leading-tight mb-1">FineClause for iPhone</h2>
                  <p className="text-white/60 text-sm max-w-sm">Scan contracts on the go — AI-powered analysis in your pocket, free.</p>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-white/40 text-xs ml-1">on the App Store</span>
                  </div>
                </div>
              </div>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <img
                  src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                  alt="Download on the App Store"
                  className="h-12 hover:opacity-90 transition-opacity"
                />
              </a>
            </div>
          </motion.section>
        )}

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
