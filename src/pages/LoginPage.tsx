import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, User } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LoginPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("type") === "agency" ? "agency" : "personal";
  const [tab, setTab] = useState<"personal" | "agency">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("auth.welcomeBackToast"));
      navigate(tab === "agency" ? "/recruiter" : "/dashboard");
    }
  };

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
            <Tabs value={tab} onValueChange={(v) => setTab(v as "personal" | "agency")} className="mb-6">
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

            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold font-display text-foreground">{t("auth.welcomeBack")}</h1>
              <p className="text-muted-foreground text-sm mt-2">
                {tab === "agency" ? t("auth.signInAgency") : t("auth.signInTo")}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-foreground">{t("auth.email")}</Label>
                <Input id="email" type="email" placeholder={tab === "agency" ? "you@agency.com" : "you@example.com"} value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="password" className="text-foreground">{t("auth.password")}</Label>
                <Input id="password" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
              </div>
              <Button variant="hero" size="lg" className="w-full py-6 text-base" type="submit" disabled={loading}>
                {loading ? t("auth.signingIn") : t("auth.signIn")}
              </Button>
            </form>

            <div className="text-center mt-6 space-y-2">
              <Link to="/forgot-password" className="text-sm text-accent hover:underline font-medium block">
                {t("auth.forgotPassword")}
              </Link>
              <p className="text-sm text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <Link to={tab === "agency" ? "/signup?type=agency" : "/signup"} className="text-accent hover:underline font-medium">
                  {t("auth.signUp")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
