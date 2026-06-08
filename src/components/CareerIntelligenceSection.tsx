import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { isMobileApp } from "@/lib/isMobileApp";
import {
  Upload,
  BarChart3,
  DollarSign,
  Target,
  Users,
  ArrowRight,
  Sparkles,
  BriefcaseBusiness,
  FileSearch,
} from "lucide-react";

const CareerIntelligenceSection = () => {
  const navigate = useNavigate();
  const mobile = isMobileApp();
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  const features = [
    {
      icon: BarChart3,
      title: "CV Score",
      desc: "Instant quality score based on formatting, keywords, and content depth.",
    },
    {
      icon: DollarSign,
      title: "Salary Range",
      desc: "AI-estimated salary benchmarks based on skills and experience level.",
    },
    {
      icon: Target,
      title: "Skill Gap Analysis",
      desc: "Identify missing skills for your target roles with improvement tips.",
    },
  ];

  if (!mobile) {
    features.push({
      icon: Users,
      title: "Recruiter Matching",
      desc: "Opt in to connect with vetted agencies actively hiring for your profile.",
    });
  }

  return (
    <section
      ref={sectionRef}
      className="py-24 px-6 md:px-16 bg-secondary/30 border-y border-border overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div>
            <Badge
              variant="outline"
              className="text-xs font-mono tracking-wider uppercase border-accent text-accent px-3 py-1 mb-5"
            >
              <Sparkles className="w-3 h-3 mr-1.5" />
              New — Career Intelligence
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black font-display leading-[1.05] tracking-tight">
              Know Your Worth
              <br />
              <em className="italic text-accent">Before You Apply.</em>
            </h2>
          </div>
          <div>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Upload your CV and get an instant AI-powered report — score, salary
              benchmarks, skill gaps, and career trajectory. Free for job seekers,
              invaluable for recruiters.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="hero"
                size="lg"
                className="text-[15px] px-8 py-5"
                onClick={() => navigate("/careers")}
              >
                <Upload className="w-4 h-4 mr-2" />
                Analyze Your CV
              </Button>
              {!mobile && (
                <Button
                  variant="heroOutline"
                  size="lg"
                  className="text-sm"
                  onClick={() => navigate("/employers")}
                >
                  <BriefcaseBusiness className="w-4 h-4 mr-2" />
                  I'm Hiring
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
            >
              <Card className="p-6 h-full hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300 group cursor-default">
                <f.icon className="w-7 h-7 text-accent mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-base font-bold font-display mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* For Agencies CTA — hidden in the mobile app (Apple 3.1.1: no business/agency account flows) */}
        {!mobile && (
          <motion.div
            className="mt-12 p-8 rounded-sm border border-border bg-card flex flex-col md:flex-row items-center justify-between gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="flex items-start gap-4">
              <FileSearch className="w-10 h-10 text-accent flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold font-display mb-1">
                  Recruitment Agencies
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  Access pre-scored, consent-verified candidate leads in real time.
                  Filter by skills, salary range, and location. GDPR compliant.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="flex-shrink-0"
              onClick={() => navigate("/contact")}
            >
              Request Agency Access
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CareerIntelligenceSection;
