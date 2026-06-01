import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, CheckCircle, XCircle, LogOut, Clock, ChevronLeft, Trash2, CreditCard, Crown, Shield, ArrowLeftRight, Settings, Share2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import Navbar from "@/components/Navbar";
import DashboardAnalytics from "@/components/DashboardAnalytics";
import ScanFilters from "@/components/ScanFilters";
import SubscriptionDialog from "@/components/SubscriptionDialog";
import { toast } from "sonner";
import ShareReportButton from "@/components/ShareReportButton";
import { getTierByKey } from "@/lib/subscriptionTiers";
import type { Json } from "@/integrations/supabase/types";
import { useTranslation } from "react-i18next";
import PasskeyManager from "@/components/PasskeyManager";

interface RiskClause {
  title: string;
  text: string;
  risk: "safe" | "caution" | "danger";
  explanation: string;
}

interface ScanRecord {
  id: string;
  file_name: string;
  document_type: string | null;
  summary: string | null;
  risk_score: number | null;
  clauses: Json | null;
  created_at: string;
}

const riskIcon = {
  safe: <CheckCircle className="w-5 h-5 text-risk-safe" />,
  caution: <AlertTriangle className="w-5 h-5 text-risk-caution" />,
  danger: <XCircle className="w-5 h-5 text-risk-danger" />,
};

const riskLabel: Record<string, string> = {
  safe: "risk-badge-safe",
  caution: "risk-badge-caution",
  danger: "risk-badge-danger",
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user, signOut, isPro, isAdmin, subscriptionEnd, currentTierKey } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTier = getTierByKey(currentTierKey);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      setSearchParams({}, { replace: true });
      toast.success("Welcome to your new plan! 🎉", {
        description: "Your subscription is now active.",
        duration: 5000,
      });
      const end = Date.now() + 1500;
      const fire = () => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff"],
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff"],
        });
        if (Date.now() < end) requestAnimationFrame(fire);
      };
      fire();
    }
  }, [searchParams, setSearchParams]);

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("No Stripe customer")) {
          toast.info("Your Pro plan was activated manually — no Stripe subscription to manage.");
        } else {
          toast.error(data.error);
        }
        return;
      }
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e) {
      toast.error(t("common.error"));
    } finally {
      setManagingPortal(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchScans = async () => {
      const { data } = await supabase
        .from("scan_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setScans(data ?? []);
      setLoading(false);
    };
    fetchScans();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("scan_history").delete().eq("id", id);
    if (error) {
      toast.error(t("common.error"));
    } else {
      setScans((prev) => prev.filter((s) => s.id !== id));
      if (selectedScan?.id === id) setSelectedScan(null);
      toast.success(t("common.success"));
    }
  };

  const riskColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 70) return "text-risk-safe";
    if (score >= 40) return "text-risk-caution";
    return "text-risk-danger";
  };

  const clauses = selectedScan?.clauses
    ? (selectedScan.clauses as unknown as RiskClause[])
    : [];

  const dangerCount = clauses.filter((c) => c.risk === "danger").length;
  const cautionCount = clauses.filter((c) => c.risk === "caution").length;


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        {selectedScan ? (
          <div className="max-w-4xl mx-auto animate-fade-up">
            <button
              onClick={() => setSelectedScan(null)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("dashboard.backToHistory")}
            </button>

            <div className="rounded-2xl bg-card border border-border p-8 mb-8" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r="54" fill="none"
                      stroke={
                        (selectedScan.risk_score ?? 0) >= 70
                          ? "hsl(var(--risk-safe))"
                          : (selectedScan.risk_score ?? 0) >= 40
                          ? "hsl(var(--risk-caution))"
                          : "hsl(var(--risk-danger))"
                      }
                      strokeWidth="8"
                      strokeDasharray={`${((selectedScan.risk_score ?? 0) / 100) * 339.3} 339.3`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold font-display text-foreground">{selectedScan.risk_score ?? "—"}</span>
                  </div>
                </div>
                <div className="text-center md:text-left flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h2 className="text-2xl font-bold font-display text-foreground">{selectedScan.file_name}</h2>
                    {selectedScan.document_type && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                        {selectedScan.document_type}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("dashboard.scannedOn", { date: new Date(selectedScan.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) })}
                  </p>
                  <p className="text-muted-foreground mb-4">{selectedScan.summary}</p>
                  <div className="flex gap-4 justify-center md:justify-start flex-wrap">
                    {dangerCount > 0 && <span className="risk-badge-danger">{dangerCount} {t("dashboard.highRisk")}</span>}
                    {cautionCount > 0 && <span className="risk-badge-caution">{cautionCount} {t("dashboard.caution")}</span>}
                    <span className="risk-badge-safe">{clauses.length - dangerCount - cautionCount} {t("dashboard.safe")}</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold font-display text-foreground mb-4">{t("dashboard.clauseBreakdown")}</h3>
            <div className="space-y-4">
              {clauses.map((clause, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-card border border-border p-6 transition-all duration-200 hover:border-accent/30"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{riskIcon[clause.risk]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold font-display text-foreground">{clause.title}</h4>
                        <span className={riskLabel[clause.risk]}>
                          {clause.risk === "safe" ? t("dashboard.safe") : clause.risk === "caution" ? t("dashboard.caution") : t("dashboard.highRisk")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground italic mb-3 border-l-2 border-border pl-4">
                        "{clause.text}"
                      </p>
                      <p className="text-sm text-foreground/80">
                        <strong>{t("dashboard.whatThisMeans")}</strong> {clause.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-4 flex-wrap">
              <Button variant="hero" onClick={() => navigate("/scan")}>
                <FileText className="w-4 h-4" />
                {t("dashboard.newScan")}
              </Button>
              <ShareReportButton scanId={selectedScan.id} fileName={selectedScan.file_name} />
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(selectedScan.id)}
              >
                <Trash2 className="w-4 h-4" />
                {t("dashboard.deleteScan")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Dashboard header — stacks on mobile, side-by-side on desktop */}
            <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold font-display text-foreground truncate">{t("dashboard.title")}</h1>
                <p className="text-muted-foreground text-sm mt-1 truncate">{user?.email}</p>
                <div className="mt-3">
                  {currentTierKey !== "free" ? (
                    <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-3 py-1.5">
                      <Crown className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                      <span className="text-sm font-semibold text-accent">{currentTier.name} {t("scan.plan")}</span>
                      {subscriptionEnd && (
                        <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
                          · {t("dashboard.renews", { date: new Date(subscriptionEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5">
                      <span className="text-sm font-medium text-muted-foreground">{t("dashboard.freePlan")}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Action buttons — scrollable row on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-wrap md:justify-end flex-shrink-0">
                <Button variant="hero" onClick={() => navigate("/scan")} className="flex-shrink-0">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">{t("dashboard.newScan")}</span>
                </Button>
                <Button variant="outline" onClick={() => navigate("/compare")} className="flex-shrink-0">
                  <ArrowLeftRight className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">{t("dashboard.compare")}</span>
                </Button>
                {isPro && subscriptionEnd && (
                  <Button variant="outline" onClick={handleManageSubscription} disabled={managingPortal} className="flex-shrink-0">
                    <CreditCard className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">{managingPortal ? t("common.loading") : t("dashboard.billing")}</span>
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSubscriptionDialogOpen(true)} className="flex-shrink-0">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">{currentTierKey === "free" ? t("dashboard.upgrade") : t("dashboard.changePlan")}</span>
                </Button>
                <Button variant="outline" onClick={async () => { await signOut(); navigate("/"); }} className="flex-shrink-0">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">{t("dashboard.signOut")}</span>
                </Button>
              </div>
            </div>

            <DashboardAnalytics scans={scans} />

            <h2 className="text-xl font-bold font-display text-foreground mb-4">
              {t("dashboard.scanHistory")}
              {scans.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">({scans.length} {t("dashboard.scans")})</span>
              )}
            </h2>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">{t("dashboard.loading")}</div>
            ) : scans.length === 0 ? (
              <div className="rounded-sm bg-card border border-border p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold font-display text-foreground mb-2">{t("dashboard.noScansYet")}</h3>
                <p className="text-muted-foreground mb-6">{t("dashboard.noScansDesc")}</p>
                <Button variant="hero" onClick={() => navigate("/scan")}>
                  {t("dashboard.scanContract")}
                </Button>
              </div>
            ) : (
              <ScanFilters scans={scans}>
                {(filtered) => (
                  <div className="space-y-3">
                    {filtered.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">{t("dashboard.noMatch")}</div>
                    ) : (
                      filtered.map((scan) => (
                        <div
                          key={scan.id}
                          onClick={() => setSelectedScan(scan)}
                          className="rounded-xl bg-card border border-border p-5 flex items-center gap-4 transition-all hover:border-accent/30 cursor-pointer group"
                          style={{ boxShadow: "var(--shadow-card)" }}
                        >
                          <FileText className="w-10 h-10 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-semibold font-display text-foreground truncate group-hover:text-accent transition-colors">
                                {scan.file_name}
                              </h4>
                              {scan.document_type && (
                                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full flex-shrink-0">
                                  {scan.document_type}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{scan.summary || t("dashboard.noSummary")}</p>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            {scan.risk_score !== null && (
                              <span className={`text-2xl font-bold font-display ${riskColor(scan.risk_score)}`}>
                                {scan.risk_score}
                              </span>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(scan.created_at).toLocaleDateString()}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(scan.id); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                              title={t("dashboard.deleteScan")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </ScanFilters>
            )}
          </>
        )}
      </div>
      <SubscriptionDialog
        open={subscriptionDialogOpen}
        onOpenChange={setSubscriptionDialogOpen}
        currentTierKey={currentTierKey}
      />

      {/* Security / Passkeys section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <div className="max-w-xl" data-testid="dashboard-passkey-section">
          <h2 className="text-lg font-display font-bold text-foreground mb-4">Security</h2>
          <PasskeyManager />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
