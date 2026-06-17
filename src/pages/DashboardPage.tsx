import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, CheckCircle, XCircle, LogOut, Clock, ChevronLeft, Trash2, Shield, ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DashboardAnalytics from "@/components/DashboardAnalytics";
import ScanFilters from "@/components/ScanFilters";
import { toast } from "sonner";
import ShareReportButton from "@/components/ShareReportButton";
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
  const { user, signOut, isAdmin, isMobile } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const navigate = useNavigate();

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
            {/* ── Dashboard header ── */}
            <div className="mb-6">
              {/* Top row: title + sign out */}
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-2xl font-bold font-display text-foreground">{t("dashboard.title")}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => { await signOut(); navigate("/"); }}
                  className="text-muted-foreground hover:text-foreground gap-1.5 -mr-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("dashboard.signOut")}</span>
                </Button>
              </div>

              {/* Email (truncated, never overlaps) */}
              <p className="text-sm text-muted-foreground mb-3 truncate max-w-[240px] sm:max-w-none">
                {user?.email}
              </p>

              {/* Primary actions — 2-column grid on mobile */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                <Button variant="hero" onClick={() => navigate("/scan")} className="w-full sm:w-auto gap-1.5">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  {t("dashboard.newScan")}
                </Button>
                <Button variant="outline" onClick={() => navigate("/compare")} className="w-full sm:w-auto gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
                  {t("dashboard.compare")}
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
                          className="rounded-xl bg-card border border-border p-4 transition-all hover:border-accent/30 cursor-pointer group"
                          style={{ boxShadow: "var(--shadow-card)" }}
                        >
                          {/* Top row: filename + score + delete */}
                          <div className="flex items-start gap-3">
                            <FileText className="w-8 h-8 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold font-display text-foreground truncate group-hover:text-accent transition-colors text-sm leading-tight">
                                {scan.file_name}
                              </h4>
                              {scan.document_type && (
                                <span className="inline-block text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full mt-1">
                                  {scan.document_type}
                                </span>
                              )}
                            </div>
                            {/* Score badge */}
                            {scan.risk_score !== null && (
                              <span className={`text-xl font-bold font-display flex-shrink-0 ${riskColor(scan.risk_score)}`}>
                                {scan.risk_score}
                              </span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(scan.id); }}
                              className="flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 -mr-1"
                              title={t("dashboard.deleteScan")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Bottom row: summary + date */}
                          <div className="mt-2 pl-11 flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground truncate flex-1">
                              {scan.summary || t("dashboard.noSummary")}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {new Date(scan.created_at).toLocaleDateString()}
                            </div>
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
      {/* Passkeys use WebAuthn rpId which requires Associated Domains — web only for now */}
      {!isMobile && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
          <div className="max-w-xl" data-testid="dashboard-passkey-section">
            <h2 className="text-lg font-display font-bold text-foreground mb-4">Security</h2>
            <PasskeyManager />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
