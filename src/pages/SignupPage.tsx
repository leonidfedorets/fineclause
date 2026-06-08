import { getAuthRedirectUrl } from '@/lib/getRedirectUrl';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ArrowLeft, Building2, User, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isMobileApp } from "@/lib/isMobileApp";

const SignupPage = () => {
  const { t } = useTranslation();
  const mobile = isMobileApp();
  const [searchParams] = useSearchParams();
  // Agency sign-up is not available in the mobile app (Apple 3.1.1: no business/agency account flows)
  const initialTab = !mobile && searchParams.get("type") === "agency" ? "agency" : "personal";
  const [tab, setTab] = useState<"personal" | "agency">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Agency step 2
  const [agencyStep, setAgencyStep] = useState<"register" | "details">("register");
  const [agencyName, setAgencyName] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const handlePersonalSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("auth.checkEmail"));
      navigate("/login");
    }
  };

  const handleAgencyRegister = async () => {
    if (!email.includes("@") || password.length < 8) {
      toast.error("Enter a valid email and password (min 8 chars).");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: getAuthRedirectUrl() },
      });
      if (error) throw error;
      setContactEmail(email.trim());
      setAgencyStep("details");
      toast.success("Account created! Check your email to verify, then complete your agency profile.");
    } catch (err: any) {
      toast.error(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAgencyDetails = async () => {
    if (!agencyName.trim()) {
      toast.error("Agency name is required.");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please verify your email first. Check your inbox.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.from("agency_profiles" as any).insert({
        user_id: user.id,
        agency_name: agencyName.trim(),
        website: website.trim() || null,
        contact_email: contactEmail.trim() || email.trim(),
      } as any);
      if (error) throw error;

      const { data, error: checkoutErr } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: "price_1THOJ61p2rOgyxtVmlAMLZgM" },
      });
      if (checkoutErr) throw checkoutErr;
      if (data?.url) {
        window.open(data.url, "_blank");
        navigate("/recruiter");
      }
    } catch (err: any) {
      toast.error(err.message || "Setup failed.");
    } finally {
      setLoading(false);
    }
  };

  const features = [t("auth.proFeature1"), t("auth.proFeature2"), t("auth.proFeature3"), t("auth.proFeature4")];
  const agencyFeatures = ["Full recruitment platform", "HubSpot CRM integration", "Unlimited job listings", "Candidate matching & analytics"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t("common.backToHome")}
          </Link>

          <div className="rounded-sm bg-card border border-border p-8" style={{ boxShadow: "var(--shadow-card)" }}>
            {/* Agency tab hidden in the mobile app (Apple 3.1.1: no business/agency account flows) */}
            {!mobile && (
              <Tabs value={tab} onValueChange={(v) => { setTab(v as "personal" | "agency"); setAgencyStep("register"); }} className="mb-6">
                <TabsList className="w-full">
                  <TabsTrigger value="personal" className="flex-1 gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {t("auth.personal")}
                  </TabsTrigger>
                  <TabsTrigger value="agency" className="flex-1 gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {t("auth.agency")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {tab === "personal" ? (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold font-display text-foreground">{t("auth.getPro")}</h1>
                  <p className="text-muted-foreground text-sm mt-2">{t("auth.proSubtitle")}</p>
                </div>

                <div className="space-y-3 mb-6">
                  {features.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-foreground">
                      <Check className="w-4 h-4 text-risk-safe flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>

                <form onSubmit={handlePersonalSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-foreground">{t("auth.email")}</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-foreground">{t("auth.password")}</Label>
                    <Input id="password" type="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-1" />
                  </div>
                  <Button variant="hero" size="lg" className="w-full py-6 text-base" type="submit" disabled={loading}>
                    {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">{t("auth.agreeTerms")}</p>
                </form>
              </>
            ) : agencyStep === "register" ? (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold font-display text-foreground">{t("auth.agencySignupTitle")}</h1>
                  <p className="text-muted-foreground text-sm mt-2">Step 1 of 2 — Account credentials</p>
                </div>

                <div className="space-y-3 mb-6">
                  {agencyFeatures.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-foreground">
                      <Check className="w-4 h-4 text-risk-safe flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Work Email *</Label>
                    <Input type="email" placeholder="you@agency.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground">{t("auth.password")} *</Label>
                    <Input type="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground">Confirm Password *</Label>
                    <Input type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="mt-1" />
                  </div>
                  <Button variant="hero" size="lg" className="w-full py-6 text-base" onClick={handleAgencyRegister} disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold font-display text-foreground">Agency Details</h1>
                  <p className="text-muted-foreground text-sm mt-2">Step 2 of 2 — Tell us about your agency</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Agency Name *</Label>
                    <Input placeholder="Talent Partners Ltd" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} disabled={loading} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground">Website</Label>
                    <Input placeholder="https://youragency.com" value={website} onChange={(e) => setWebsite(e.target.value)} disabled={loading} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground">Contact Email</Label>
                    <Input type="email" placeholder="leads@agency.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} disabled={loading} className="mt-1" />
                  </div>
                  <Button variant="hero" size="lg" className="w-full py-6 text-base" onClick={handleSaveAgencyDetails} disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up...</> : <>Complete Setup & Subscribe <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                </div>
              </>
            )}

            <p className="text-sm text-center text-muted-foreground mt-6">
              {t("auth.hasAccount")}{" "}
              <Link to={tab === "agency" ? "/login?type=agency" : "/login"} className="text-accent hover:underline font-medium">
                {t("auth.signIn")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
