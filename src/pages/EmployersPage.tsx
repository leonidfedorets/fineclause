import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Sparkles,
  Users,
  Target,
  BarChart3,
  ArrowRight,
  Loader2,
  Plus,
  X,
  BriefcaseBusiness,
  Globe,
  DollarSign,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EmployersPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [employerEmail, setEmployerEmail] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOption, setRemoteOption] = useState("on-site");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [experienceMin, setExperienceMin] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const formRef = useRef(null);
  const formInView = useInView(formRef, { once: true, margin: "-80px" });
  const benefitsRef = useRef(null);
  const benefitsInView = useInView(benefitsRef, { once: true, margin: "-80px" });

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !requiredSkills.includes(skill)) {
      setRequiredSkills([...requiredSkills, skill]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: t("employers.loginRequired"), description: t("employers.loginRequiredDesc"), variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: t("employers.titleRequired"), description: t("employers.titleRequiredDesc"), variant: "destructive" });
      return;
    }
    if (!description.trim() || description.trim().length < 50) {
      toast({ title: t("employers.descTooShort"), description: t("employers.descTooShortDesc"), variant: "destructive" });
      return;
    }
    if (!employerEmail.trim() || !employerEmail.includes("@")) {
      toast({ title: t("employers.emailRequiredTitle"), description: t("employers.emailRequiredDesc"), variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("job_listings").insert({
        title: title.trim(),
        description: description.trim(),
        employer_email: employerEmail.trim().toLowerCase(),
        employer_name: employerName.trim() || null,
        employer_id: user.id,
        location: location.trim() || null,
        remote_option: remoteOption,
        salary_min: salaryMin ? parseInt(salaryMin) : null,
        salary_max: salaryMax ? parseInt(salaryMax) : null,
        salary_currency: "EUR",
        experience_min: experienceMin ? parseFloat(experienceMin) : null,
        required_skills: requiredSkills.length > 0 ? requiredSkills : null,
      });

      if (error) {
        console.error("Job listing insert error:", error);
        toast({ title: t("employers.submissionFailed"), description: t("employers.submissionFailedDesc"), variant: "destructive" });
        return;
      }

      setSubmitted(true);
      toast({ title: t("employers.jobPostedToast"), description: t("employers.jobPostedToastDesc") });
    } catch (err) {
      console.error("Submit error:", err);
      toast({ title: t("employers.connectionError"), description: t("employers.connectionErrorDesc"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setEmployerEmail(""); setEmployerName("");
    setLocation(""); setRemoteOption("on-site"); setSalaryMin(""); setSalaryMax("");
    setExperienceMin(""); setRequiredSkills([]); setSubmitted(false);
  };

  const benefits = [
    { icon: Target, title: t("employers.aiMatching"), description: t("employers.aiMatchingDesc") },
    { icon: BarChart3, title: t("employers.preScored"), description: t("employers.preScoredDesc") },
    { icon: Users, title: t("employers.consentedLeads"), description: t("employers.consentedLeadsDesc") },
    { icon: ShieldCheck, title: t("employers.gdprCompliant"), description: t("employers.gdprCompliantDesc") },
    { icon: Zap, title: t("employers.realTimeDashboard"), description: t("employers.realTimeDashboardDesc") },
    { icon: Globe, title: t("employers.europeanFocus"), description: t("employers.europeanFocusDesc") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Hero Section */}
        <section ref={heroRef} className="py-20 md:py-28 px-6 md:px-16 border-b border-border">
          <motion.div className="max-w-[800px] mx-auto text-center" initial={{ opacity: 0, y: 20 }} animate={heroInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
            <Badge variant="outline" className="text-xs font-mono tracking-wider uppercase border-accent text-accent px-3 py-1 mb-6">
              <Sparkles className="w-3 h-3 mr-1.5" />
              {t("employers.badge")}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display leading-[1.05] tracking-tight mb-6">
              {t("employers.title1")}<br /><em className="italic text-accent">{t("employers.titleAccent")}</em>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-[560px] mx-auto mb-10 leading-relaxed font-light">
              {t("employers.description")}
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              {[t("employers.benefit1"), t("employers.benefit2"), t("employers.benefit3")].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Benefits Grid */}
        <section ref={benefitsRef} className="py-16 px-6 md:px-16 border-b border-border">
          <motion.div className="max-w-[1100px] mx-auto" initial={{ opacity: 0, y: 20 }} animate={benefitsInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
            <div className="text-xs font-mono tracking-widest uppercase text-accent mb-4 text-center">{t("employers.whyPostHere")}</div>
            <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight mb-12 text-center">
              {t("employers.smarterHiring")} <em className="italic text-accent">{t("employers.zeroNoise")}</em>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b, i) => (
                <motion.div key={b.title} initial={{ opacity: 0, y: 15 }} animate={benefitsInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: i * 0.08 }}>
                  <Card className="p-6 h-full hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                    <b.icon className="w-8 h-8 text-accent mb-4" />
                    <h3 className="text-lg font-bold font-display mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Job Posting Form */}
        <section ref={formRef} className="py-16 px-6 md:px-16 border-b border-border">
          <motion.div className="max-w-[640px] mx-auto" initial={{ opacity: 0, y: 20 }} animate={formInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
            <div className="text-xs font-mono tracking-widest uppercase text-accent mb-4 text-center">{t("employers.postAJob")}</div>
            <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight mb-3 text-center">
              {t("employers.describeHire")} <em className="italic text-accent">{t("employers.idealHire")}</em>
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-10 max-w-md mx-auto">{t("employers.formSubtitle")}</p>

            {submitted ? (
              <Card className="p-10 text-center">
                <CheckCircle2 className="w-14 h-14 text-accent mx-auto mb-4" />
                <h3 className="text-2xl font-bold font-display mb-2">{t("employers.jobPosted")}</h3>
                <p className="text-muted-foreground mb-6">{t("employers.jobPostedDesc")}</p>
                <Button onClick={resetForm} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />{t("employers.postAnother")}
                </Button>
              </Card>
            ) : (
              <Card className="p-8">
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("employers.jobTitle")} *</label>
                    <Input placeholder="e.g. Senior Frontend Developer" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("employers.jobDescription")} *</label>
                    <Textarea placeholder={t("employers.descPlaceholder")} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} className="min-h-[140px]" />
                    <p className="text-xs text-muted-foreground mt-1">{description.length} {t("employers.characters")}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("employers.contactEmail")} *</label>
                      <Input type="email" placeholder="hr@company.com" value={employerEmail} onChange={(e) => setEmployerEmail(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("employers.companyName")}</label>
                      <Input placeholder="Acme Inc." value={employerName} onChange={(e) => setEmployerName(e.target.value)} disabled={isSubmitting} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("employers.locationLabel")}</label>
                      <Input placeholder="e.g. Berlin, Germany" value={location} onChange={(e) => setLocation(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("employers.workModel")}</label>
                      <Select value={remoteOption} onValueChange={setRemoteOption} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on-site">{t("employers.onSite")}</SelectItem>
                          <SelectItem value="remote">{t("employers.remote")}</SelectItem>
                          <SelectItem value="hybrid">{t("employers.hybrid")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("employers.salaryMin")}</label>
                      <Input type="number" placeholder="40000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("employers.salaryMax")}</label>
                      <Input type="number" placeholder="70000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t("employers.minExperience")}</label>
                      <Input type="number" placeholder="3" value={experienceMin} onChange={(e) => setExperienceMin(e.target.value)} disabled={isSubmitting} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("employers.requiredSkills")}</label>
                    <div className="flex gap-2 mb-2">
                      <Input placeholder={t("employers.skillPlaceholder")} value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} disabled={isSubmitting} />
                      <Button type="button" variant="outline" size="sm" onClick={addSkill} disabled={isSubmitting}><Plus className="w-4 h-4" /></Button>
                    </div>
                    {requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {requiredSkills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="gap-1">
                            {skill}
                            <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-accent"><X className="w-3 h-3" /></button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("employers.posting")}</>
                    ) : (
                      <><BriefcaseBusiness className="w-4 h-4 mr-2" />{t("employers.postJobListing")}</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    {t("employers.agreeTerms")}{" "}
                    <a href="/privacy" className="underline hover:text-foreground">{t("employers.privacyPolicy")}</a>{" "}
                    {t("employers.and")}{" "}
                    <a href="/terms" className="underline hover:text-foreground">{t("employers.termsOfService")}</a>.{" "}
                    {t("employers.consentNote")}
                  </p>
                </div>
              </Card>
            )}
          </motion.div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 md:px-16 text-center">
          <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight mb-4">
            {t("employers.ctaTitle")} <em className="italic text-accent">{t("employers.ctaAccent")}</em>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">{t("employers.ctaDesc")}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => document.getElementById("post-form")?.scrollIntoView({ behavior: "smooth" })}>
              {t("employers.ctaPost")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/careers">{t("employers.imJobSeeker")}</a>
            </Button>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default EmployersPage;
