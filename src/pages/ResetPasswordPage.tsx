import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user arrived via recovery link (Supabase auto-logs them in)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasSession(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  };

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md text-center">
            <div className="rounded-2xl bg-card border border-border p-8" style={{ boxShadow: "var(--shadow-card)" }}>
              <h1 className="text-2xl font-bold font-display text-foreground mb-4">Invalid or Expired Link</h1>
              <p className="text-muted-foreground text-sm mb-6">This password reset link is invalid or has expired. Please request a new one.</p>
              <Link to="/forgot-password">
                <Button variant="hero" size="lg" className="w-full py-6 text-base">Request New Link</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>

          <div className="rounded-sm bg-card border border-border p-8" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-sm bg-accent/10 flex items-center justify-center mx-auto mb-4">
                {success ? <CheckCircle className="w-7 h-7 text-accent" /> : <KeyRound className="w-7 h-7 text-accent" />}
              </div>
              <h1 className="text-2xl font-bold font-display text-foreground">
                {success ? "Password Updated" : "Set New Password"}
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                {success ? "Redirecting you to your dashboard..." : "Enter your new password below"}
              </p>
            </div>

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password" className="text-foreground">New Password</Label>
                  <Input id="password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1" />
                </div>
                <Button variant="hero" size="lg" className="w-full py-6 text-base" type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
