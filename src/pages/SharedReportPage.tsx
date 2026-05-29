import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AlertTriangle, CheckCircle, XCircle, Shield, Clock, FileText } from "lucide-react";

interface RiskClause {
  title: string;
  text: string;
  risk: "safe" | "caution" | "danger";
  explanation: string;
}

interface SharedReport {
  id: string;
  file_name: string;
  document_type: string | null;
  summary: string | null;
  risk_score: number | null;
  clauses: RiskClause[];
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

const SharedReportPage = () => {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<SharedReport | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("share-report", {
          body: { action: "view", token },
        });
        if (fnError || data?.error) {
          setError(data?.error || "Failed to load report");
        } else {
          setReport(data.report);
          setNote(data.shared_by_note);
          setExpiresAt(data.expires_at);
        }
      } catch {
        setError("Failed to load shared report");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchReport();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold font-display mb-3">{error || "Report not found"}</h1>
          <p className="text-muted-foreground">This link may have expired or been revoked by the owner.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const clauses = (report.clauses || []) as RiskClause[];
  const dangerCount = clauses.filter((c) => c.risk === "danger").length;
  const cautionCount = clauses.filter((c) => c.risk === "caution").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto animate-fade-up">
          {/* Shared banner */}
          <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 mb-8 flex items-center gap-3 flex-wrap">
            <Shield className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Shared Contract Analysis Report</p>
              {note && <p className="text-xs text-muted-foreground mt-0.5">Note: {note}</p>}
            </div>
            {expiresAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Expires {new Date(expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Score Overview */}
          <div className="rounded-2xl bg-card border border-border p-8 mb-8" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={
                      (report.risk_score ?? 0) >= 70
                        ? "hsl(var(--risk-safe))"
                        : (report.risk_score ?? 0) >= 40
                        ? "hsl(var(--risk-caution))"
                        : "hsl(var(--risk-danger))"
                    }
                    strokeWidth="8"
                    strokeDasharray={`${((report.risk_score ?? 0) / 100) * 339.3} 339.3`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold font-display text-foreground">{report.risk_score ?? "—"}</span>
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold font-display text-foreground">{report.file_name}</h2>
                  {report.document_type && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {report.document_type}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Analyzed on {new Date(report.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <p className="text-muted-foreground mb-4">{report.summary}</p>
                <div className="flex gap-4 justify-center md:justify-start flex-wrap">
                  {dangerCount > 0 && <span className="risk-badge-danger">{dangerCount} High Risk</span>}
                  {cautionCount > 0 && <span className="risk-badge-caution">{cautionCount} Caution</span>}
                  <span className="risk-badge-safe">{clauses.length - dangerCount - cautionCount} Safe</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clauses */}
          <h3 className="text-xl font-bold font-display text-foreground mb-4">Clause Breakdown</h3>
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
                        {clause.risk === "safe" ? "Safe" : clause.risk === "caution" ? "Caution" : "High Risk"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground italic mb-3 border-l-2 border-border pl-4">
                      "{clause.text}"
                    </p>
                    <p className="text-sm text-foreground/80">
                      <strong>What this means:</strong> {clause.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              This report was generated by <a href="/" className="text-accent hover:underline font-medium">FineClause</a> — AI-powered contract analysis.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SharedReportPage;
