import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { isMobileApp } from "@/lib/isMobileApp";
import JobMatchesSection, { type JobMatch, type AllJob } from "@/components/JobMatchesSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  TrendingUp,
  DollarSign,
  Target,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Users,
  Zap,
  Loader2,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  BriefcaseBusiness,
  X,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface CVAnalysis {
  score: number;
  salary_min: number;
  salary_max: number;
  skills: string[];
  missing_skills: string[];
  experience_years: number;
  experience_level: string;
  education_level?: string;
  summary: string;
  improvements: string[];
  trajectory?: string;
}

const CareersPage = () => {
  const mobile = isMobileApp();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [consentAnalysis, setConsentAnalysis] = useState(false);
  const [consentRecruiter, setConsentRecruiter] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [allJobs, setAllJobs] = useState<AllJob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });
  const howRef = useRef(null);
  const howInView = useInView(howRef, { once: true, margin: "-80px" });
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-80px" });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size <= 10 * 1024 * 1024) {
        setSelectedFile(file);
      } else {
        toast({ title: t("careers.fileTooLarge"), description: t("careers.fileTooLargeDesc"), variant: "destructive" });
      }
    }
  }, [toast, t]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.size <= 10 * 1024 * 1024) {
        setSelectedFile(file);
      } else {
        toast({ title: t("careers.fileTooLarge"), description: t("careers.fileTooLargeDesc"), variant: "destructive" });
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({ title: t("careers.noFile"), description: t("careers.noFileDesc"), variant: "destructive" });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast({ title: t("careers.emailRequired"), description: t("careers.emailRequiredDesc"), variant: "destructive" });
      return;
    }
    if (!consentAnalysis) {
      toast({ title: t("careers.consentRequiredToast"), description: t("careers.consentRequiredToastDesc"), variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setJobMatches([]);
    setAllJobs([]);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("email", email.trim());
      formData.append("consent_analysis", String(consentAnalysis));
      formData.append("consent_recruiter", String(consentRecruiter));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-cv`,
        { method: "POST", body: formData }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: t("careers.analysisFailed") }));
        if (response.status === 429) {
          toast({ title: t("careers.serviceBusy"), description: t("careers.serviceBusyDesc"), variant: "destructive" });
        } else if (response.status === 402) {
          toast({ title: t("careers.serviceUnavailable"), description: t("careers.serviceUnavailableDesc"), variant: "destructive" });
        } else {
          toast({ title: t("careers.analysisFailed"), description: err.error || t("careers.analysisFailed"), variant: "destructive" });
        }
        return;
      }

      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        if (data.job_matches && data.job_matches.length > 0) {
          setJobMatches(data.job_matches);
        }
        if (data.all_jobs && data.all_jobs.length > 0) {
          setAllJobs(data.all_jobs);
        }
        toast({ title: t("careers.analysisComplete"), description: t("careers.analysisCompleteDesc") });
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      } else {
        toast({ title: t("careers.analysisFailed"), description: t("careers.analysisFailed"), variant: "destructive" });
      }
    } catch (error) {
      console.error("CV analysis error:", error);
      toast({ title: t("careers.connectionError"), description: t("careers.connectionErrorDesc"), variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[hsl(var(--risk-safe))]";
    if (score >= 60) return "text-[hsl(var(--risk-caution))]";
    return "text-accent";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t("careers.excellent");
    if (score >= 60) return t("careers.good");
    if (score >= 40) return t("careers.needsWork");
    return t("careers.weak");
  };

  const features = [
    { icon: BarChart3, title: t("careers.cvScoreFeature"), description: t("careers.cvScoreFeatureDesc") },
    { icon: DollarSign, title: t("careers.salaryRangeFeature"), description: t("careers.salaryRangeFeatureDesc") },
    { icon: Target, title: t("careers.skillGapFeature"), description: t("careers.skillGapFeatureDesc") },
    { icon: TrendingUp, title: t("careers.trajectoryFeature"), description: t("careers.trajectoryFeatureDesc") },
    { icon: ShieldCheck, title: t("careers.privacyFeature"), description: t("careers.privacyFeatureDesc") },
    ...(mobile ? [] : [{ icon: Users, title: t("careers.recruiterFeature"), description: t("careers.recruiterFeatureDesc") }]),
  ];

  const steps = [
    { number: "01", title: t("careers.step1Title"), description: t("careers.step1Desc") },
    { number: "02", title: t("careers.step2Title"), description: t("careers.step2Desc") },
    { number: "03", title: t("careers.step3Title"), description: t("careers.step3Desc") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Hero Section */}
        <section ref={heroRef} className="min-h-[90vh] grid grid-cols-1 lg:grid-cols-2 border-b border-border">
          <motion.div
            className="px-6 md:px-16 py-20 flex flex-col justify-center lg:border-r border-border"
            initial={{ opacity: 0, x: -30 }}
            animate={heroInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-7">
              <Badge variant="outline" className="text-xs font-mono tracking-wider uppercase border-accent text-accent px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1.5" />
                {t("careers.badge")}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[clamp(42px,5vw,64px)] font-black font-display leading-[1.05] tracking-tight mb-7">
              {t("careers.title1")}
              <br />
              <em className="italic text-accent">{t("careers.titleAccent")}</em>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-[440px] mb-10 leading-relaxed font-light">
              {t("careers.description")}
            </p>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              {[t("careers.benefit1"), t("careers.benefit2"), t("careers.benefit3")].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Upload Form */}
          <motion.div
            className="px-6 md:px-16 py-20 flex items-center justify-center bg-secondary/30"
            initial={{ opacity: 0, x: 30 }}
            animate={heroInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Card className="w-full max-w-md p-8 shadow-[var(--shadow-card-hover)]">
              <h2 className="text-xl font-bold font-display mb-2">{t("careers.uploadTitle")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("careers.uploadSubtitle")}</p>

              {/* Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 mb-6 ${
                  dragActive ? "border-accent bg-accent/5" : selectedFile ? "border-accent/50 bg-accent/5" : "border-border hover:border-muted-foreground/40"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc" onChange={handleFileSelect} className="hidden" disabled={isAnalyzing} />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-10 h-10 text-accent" />
                    <span className="text-sm font-medium truncate max-w-full">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
                    {!isAnalyzing && (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1">
                        <X className="w-3 h-3" /> {t("careers.remove")}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-10 h-10 text-muted-foreground/50" />
                    <div>
                      <p className="text-sm font-medium">{t("careers.dropHere")}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("careers.clickBrowse")}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Email Input */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">{t("careers.emailLabel")}</label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isAnalyzing} />
              </div>

              {/* GDPR Consent Checkboxes */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <Checkbox id="consent-analysis" checked={consentAnalysis} onCheckedChange={(v) => setConsentAnalysis(v === true)} disabled={isAnalyzing} className="mt-0.5" />
                  <label htmlFor="consent-analysis" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    {t("careers.consentAnalysis")} <span className="text-foreground font-medium">{t("careers.consentRequired")}</span>
                  </label>
                </div>
                {!mobile && (
                  <div className="flex items-start gap-3">
                    <Checkbox id="consent-recruiter" checked={consentRecruiter} onCheckedChange={(v) => setConsentRecruiter(v === true)} disabled={isAnalyzing} className="mt-0.5" />
                    <label htmlFor="consent-recruiter" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      {t("careers.consentRecruiter")} <span className="text-muted-foreground/60">{t("careers.consentOptional")}</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Privacy note */}
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                {t("careers.privacyNote")}{" "}
                <a href="/privacy" className="underline hover:text-foreground">{t("careers.privacyLink")}</a>.{" "}
                {t("careers.privacyNote2")}
              </p>

              {/* Submit */}
              <Button className="w-full" size="lg" onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("careers.analyzing")}</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" />{t("careers.analyzeMyCv")}</>
                )}
              </Button>
            </Card>
          </motion.div>
        </section>

        {/* Analysis Results */}
        {analysis && (
          <section ref={resultsRef} className="py-16 px-6 md:px-16 border-b border-border">
            <div className="max-w-[1000px] mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="text-xs font-mono tracking-widest uppercase text-accent mb-4">{t("careers.reportLabel")}</div>
                <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight mb-8">
                  {t("careers.resultsTitle")} <em className="italic text-accent">{t("careers.resultsAccent")}</em>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6 text-center">
                    <BarChart3 className="w-8 h-8 text-accent mx-auto mb-3" />
                    <div className={`text-5xl font-black font-display mb-1 ${getScoreColor(analysis.score)}`}>{analysis.score}</div>
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">{t("careers.cvScoreLabel")}</div>
                    <Badge variant="outline" className={getScoreColor(analysis.score)}>{getScoreLabel(analysis.score)}</Badge>
                    <Progress value={analysis.score} className="mt-4 h-2" />
                  </Card>
                  <Card className="p-6 text-center">
                    <DollarSign className="w-8 h-8 text-accent mx-auto mb-3" />
                    <div className="text-2xl font-bold font-display mb-1">€{(analysis.salary_min / 1000).toFixed(0)}k – €{(analysis.salary_max / 1000).toFixed(0)}k</div>
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{t("careers.estimatedSalary")}</div>
                  </Card>
                  <Card className="p-6 text-center">
                    <BriefcaseBusiness className="w-8 h-8 text-accent mx-auto mb-3" />
                    <div className="text-2xl font-bold font-display mb-1">{analysis.experience_years} {t("careers.years")}</div>
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">{t("careers.experience")}</div>
                    <Badge variant="outline" className="capitalize">{analysis.experience_level} {t("careers.level")}</Badge>
                    {analysis.education_level && (
                      <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
                        <GraduationCap className="w-3.5 h-3.5" />{analysis.education_level}
                      </div>
                    )}
                  </Card>
                </div>

                <Card className="p-6 mb-6">
                  <h3 className="text-lg font-bold font-display mb-3">{t("careers.profileSummary")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
                  {analysis.trajectory && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium">{t("careers.careerTrajectory")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{analysis.trajectory}</p>
                    </div>
                  )}
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-[hsl(var(--risk-safe))]" />
                      <h3 className="text-lg font-bold font-display">{t("careers.yourSkills")}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills.map((skill) => (<Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>))}
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-[hsl(var(--risk-caution))]" />
                      <h3 className="text-lg font-bold font-display">{t("careers.skillGapsTitle")}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missing_skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs border-[hsl(var(--risk-caution))] text-[hsl(var(--risk-caution))]">{skill}</Badge>
                      ))}
                    </div>
                  </Card>
                </div>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-accent" />
                    <h3 className="text-lg font-bold font-display">{t("careers.topImprovements")}</h3>
                  </div>
                  <div className="space-y-3">
                    {analysis.improvements.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xs font-mono text-accent font-bold mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Job Matches — hidden in the mobile app (Apple 3.1.1: no recruiter/employer flows) */}
                {!mobile && <JobMatchesSection matches={jobMatches} allJobs={allJobs} />}

                <div className="text-center mt-8">
                  <Button variant="outline" onClick={() => { setAnalysis(null); setJobMatches([]); setAllJobs([]); setSelectedFile(null); setEmail(""); setConsentAnalysis(false); setConsentRecruiter(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    {t("careers.analyzeAnother")}
                  </Button>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* What You Get Section */}
        <section ref={featuresRef} className="py-24 px-6 md:px-16">
          <div className="max-w-[1200px] mx-auto">
            <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
              <div className="text-xs font-mono tracking-widest uppercase text-accent mb-4">{t("careers.whatYouGet")}</div>
              <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight">
                {t("careers.moreThanScore")} <em className="italic text-accent">{t("careers.moreThanScoreAccent")}</em>
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: i * 0.08 }}>
                  <Card className="p-6 h-full hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300">
                    <feature.icon className="w-8 h-8 text-accent mb-4" />
                    <h3 className="text-lg font-bold font-display mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section ref={howRef} className="py-24 px-6 md:px-16 bg-secondary/30 border-y border-border">
          <div className="max-w-[1200px] mx-auto">
            <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} animate={howInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
              <div className="text-xs font-mono tracking-widest uppercase text-accent mb-4">{t("careers.howItWorks")}</div>
              <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight">
                {t("careers.threeSteps")} <em className="italic text-accent">{t("careers.clarity")}</em>
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <motion.div key={step.number} className="text-center" initial={{ opacity: 0, y: 20 }} animate={howInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: i * 0.12 }}>
                  <div className="text-5xl font-black font-display text-accent/20 mb-4">{step.number}</div>
                  <h3 className="text-lg font-bold font-display mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section ref={ctaRef} className="bg-foreground text-primary-foreground py-24 px-6 md:px-16">
          <div className="max-w-[800px] mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={ctaInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
              <h2 className="text-3xl md:text-4xl font-black font-display leading-tight mb-6">
                {t("careers.ctaTitle1")}<br /><em className="italic text-accent">{t("careers.ctaTitle2")}</em>
              </h2>
              <p className="text-primary-foreground/60 text-base leading-relaxed mb-8 max-w-[500px] mx-auto">{t("careers.ctaDesc")}</p>
              <Button variant="hero" size="lg" className="text-[15px] px-8 py-5" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                {t("careers.ctaButton")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default CareersPage;
