import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, CheckCircle2, Loader2, ArrowRight, Shield, Users, BarChart3, Zap } from "lucide-react";
import { motion } from "framer-motion";

const AgencySignupPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"register" | "details">("register");
  const [loading, setLoading] = useState(false);

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Agency details
  const [agencyName, setAgencyName] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const handleRegister = async () => {
    if (!email.includes("@") || password.length < 8) {
      toast({ title: "Invalid input", description: "Enter a valid email and password (min 8 chars).", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please confirm your password.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setContactEmail(email.trim());
      setStep("details");
      toast({ title: "Account created!", description: "Check your email to verify, then complete your agency profile." });
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message || "Could not create account.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!agencyName.trim()) {
      toast({ title: "Agency name required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please verify your email first", description: "Check your inbox and click the verification link.", variant: "destructive" });
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

      // Redirect to checkout for Agency plan
      const { data, error: checkoutErr } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: "price_1THOJ61p2rOgyxtVmlAMLZgM" },
      });
      if (checkoutErr) throw checkoutErr;
      if (data?.url) {
        window.open(data.url, "_blank");
        navigate("/recruiter");
      }
    } catch (err: any) {
      toast({ title: "Setup failed", description: err.message || "Could not save agency profile.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Users, title: "Matched Candidates", desc: "AI-scored candidates delivered to your dashboard automatically." },
    { icon: BarChart3, title: "Analytics Dashboard", desc: "Track landing visits, CVs uploaded, and conversion rates." },
    { icon: Zap, title: "CRM Integration", desc: "Auto-push leads to HubSpot with full analysis reports." },
    { icon: Shield, title: "GDPR Compliant", desc: "Full consent tracking and 90-day data retention." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <Badge variant="outline" className="text-xs font-mono tracking-wider uppercase border-accent text-accent px-3 py-1 mb-4">
            <Building2 className="w-3 h-3 mr-1.5" />
            Agency Registration
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight mb-3">
            Join as a <em className="italic text-accent">Recruitment Agency</em>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Get access to AI-scored candidates, CRM integrations, and a full recruitment dashboard — €25/month.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Benefits */}
          <div className="space-y-4">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="p-5 flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-accent/10 shrink-0">
                    <b.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold font-display mb-1">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
            <Card className="p-5 bg-foreground text-primary-foreground">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black font-display">€25</span>
                <span className="text-primary-foreground/50 text-sm">/month</span>
              </div>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                {["Full recruitment platform", "HubSpot CRM integration", "Unlimited job listings", "Candidate matching & analytics", "Lead management dashboard"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />{f}</li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Registration form */}
          <Card className="p-8">
            {step === "register" ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold font-display mb-1">Create Your Account</h2>
                  <p className="text-sm text-muted-foreground">Step 1 of 2 — Account credentials</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Work Email *</label>
                  <Input type="email" placeholder="you@agency.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Password *</label>
                  <Input type="password" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Confirm Password *</label>
                  <Input type="password" placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} />
                </div>
                <Button className="w-full" size="lg" onClick={handleRegister} disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Already have an account? <a href="/login" className="underline hover:text-foreground">Sign in</a>
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold font-display mb-1">Agency Details</h2>
                  <p className="text-sm text-muted-foreground">Step 2 of 2 — Tell us about your agency</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Agency Name *</label>
                  <Input placeholder="Talent Partners Ltd" value={agencyName} onChange={e => setAgencyName(e.target.value)} disabled={loading} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Website</label>
                  <Input placeholder="https://youragency.com" value={website} onChange={e => setWebsite(e.target.value)} disabled={loading} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Contact Email</label>
                  <Input type="email" placeholder="leads@agency.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} disabled={loading} />
                </div>
                <Button className="w-full" size="lg" onClick={handleSaveDetails} disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up...</> : <>Complete Setup & Subscribe <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AgencySignupPage;
