import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Upload, Type, Search, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  targetId?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to FineClause",
    description: "We'll walk you through how to scan a contract for hidden risks in under a minute. Let's get started!",
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    title: "Choose Your Input",
    description: "Upload a file (PDF, DOCX, TXT) or switch to text mode and paste your contract directly.",
    icon: <Upload className="w-6 h-6" />,
    targetId: "tour-input-toggle",
  },
  {
    title: "Add Your Contract",
    description: "Drop a file into the upload area or paste your contract text. We support documents up to 20MB.",
    icon: <Type className="w-6 h-6" />,
    targetId: "tour-input-area",
  },
  {
    title: "Scan for Risks",
    description: "Hit the scan button and our AI will analyze every clause — flagging dangers, cautions, and safe terms.",
    icon: <Search className="w-6 h-6" />,
    targetId: "tour-scan-button",
  },
  {
    title: "Review Your Results",
    description: "You'll get a risk score, clause-by-clause breakdown, and suggested alternative language for risky clauses. You're all set!",
    icon: <BarChart3 className="w-6 h-6" />,
  },
];

const STORAGE_KEY = "fineclause_tour_completed";

interface OnboardingTourProps {
  forceShow?: boolean;
}

const OnboardingTour = ({ forceShow }: OnboardingTourProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      return;
    }
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay so DOM is ready
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const updateHighlight = useCallback((stepIndex: number) => {
    const targetId = TOUR_STEPS[stepIndex]?.targetId;
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Wait for scroll
        setTimeout(() => {
          setHighlightRect(el.getBoundingClientRect());
        }, 300);
        return;
      }
    }
    setHighlightRect(null);
  }, []);

  useEffect(() => {
    if (isVisible) {
      updateHighlight(currentStep);
    }
  }, [currentStep, isVisible, updateHighlight]);

  // Update highlight on resize
  useEffect(() => {
    if (!isVisible) return;
    const handleResize = () => updateHighlight(currentStep);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isVisible, currentStep, updateHighlight]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999]">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Highlight cutout */}
          {highlightRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute rounded-xl border-2 border-accent shadow-[0_0_0_9999px_hsl(var(--foreground)/0.6)] pointer-events-none"
              style={{
                top: highlightRect.top - 8,
                left: highlightRect.left - 8,
                width: highlightRect.width + 16,
                height: highlightRect.height + 16,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}

          {/* Tooltip card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-1/2 w-[92vw] max-w-md px-2"
            style={{
              top: highlightRect
                ? Math.min(highlightRect.bottom + 16, window.innerHeight - 300)
                : "50%",
              transform: highlightRect
                ? "translateX(-50%)"
                : "translate(-50%, -50%)",
              zIndex: 60,
            }}
          >
            <div className="bg-card rounded-2xl border border-border p-6 relative" style={{ boxShadow: "var(--shadow-card-hover)" }}>
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
                {step.icon}
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold font-display text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {step.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                {/* Step indicators */}
                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentStep
                          ? "w-6 bg-accent"
                          : i < currentStep
                          ? "w-1.5 bg-accent/40"
                          : "w-1.5 bg-border"
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-2">
                  {!isFirst && (
                    <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1 text-xs">
                      <ArrowLeft className="w-3 h-3" /> Back
                    </Button>
                  )}
                  <Button variant="default" size="sm" onClick={handleNext} className="gap-1 text-xs">
                    {isLast ? "Get Started" : "Next"} {!isLast && <ArrowRight className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
