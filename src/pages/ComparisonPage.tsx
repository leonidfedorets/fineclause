import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeftRight,
  ChevronLeft,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import type { Json } from "@/integrations/supabase/types";

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

const riskIcon: Record<string, React.ReactNode> = {
  safe: <CheckCircle className="w-4 h-4 text-risk-safe" />,
  caution: <AlertTriangle className="w-4 h-4 text-risk-caution" />,
  danger: <XCircle className="w-4 h-4 text-risk-danger" />,
};

const riskBadge: Record<string, string> = {
  safe: "risk-badge-safe",
  caution: "risk-badge-caution",
  danger: "risk-badge-danger",
};

const riskColor = (score: number | null) => {
  if (score === null) return "text-muted-foreground";
  if (score >= 70) return "text-risk-safe";
  if (score >= 40) return "text-risk-caution";
  return "text-risk-danger";
};



/* ── Score ring (small) ────────────────────────── */
const ScoreRing = ({ score }: { score: number | null }) => {
  const s = score ?? 0;
  const stroke =
    s >= 70
      ? "hsl(var(--risk-safe))"
      : s >= 40
      ? "hsl(var(--risk-caution))"
      : "hsl(var(--risk-danger))";
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeDasharray={`${(s / 100) * 339.3} 339.3`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xl font-bold font-display ${riskColor(score)}`}>{score ?? "—"}</span>
      </div>
    </div>
  );
};

/* ── Clause panel (one side) ───────────────────── */
const ClausePanel = ({
  scan,
  sharedTitles = new Set(),
  clauseRefs,
  highlightedTitle,
  onSharedClick,
}: {
  scan: ScanRecord;
  sharedTitles?: Set<string>;
  clauseRefs?: React.MutableRefObject<Map<string, HTMLDivElement>>;
  highlightedTitle?: string | null;
  onSharedClick?: (title: string) => void;
}) => {
  const clauses = scan.clauses ? (scan.clauses as unknown as RiskClause[]) : [];
  const dangerCount = clauses.filter((c) => c.risk === "danger").length;
  const cautionCount = clauses.filter((c) => c.risk === "caution").length;
  const safeCount = clauses.length - dangerCount - cautionCount;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-xl bg-card border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-4">
          <ScoreRing score={scan.risk_score} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold font-display text-foreground text-lg truncate">{scan.file_name}</h3>
            {scan.document_type && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {scan.document_type}
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(scan.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-4 flex-wrap">
          {dangerCount > 0 && <span className="risk-badge-danger">{dangerCount} High Risk</span>}
          {cautionCount > 0 && <span className="risk-badge-caution">{cautionCount} Caution</span>}
          <span className="risk-badge-safe">{safeCount} Safe</span>
        </div>
      </div>

      {/* Clauses */}
      {clauses.map((clause, idx) => {
        const titleKey = clause.title.toLowerCase();
        const isShared = sharedTitles.has(titleKey);
        const isHighlighted = highlightedTitle === titleKey;

        return (
          <div
            key={idx}
            ref={(el) => {
              if (el && clauseRefs) clauseRefs.current.set(titleKey, el);
            }}
            className={`rounded-lg border bg-card p-4 transition-all duration-500 ${
              isHighlighted
                ? "border-accent ring-2 ring-accent/40 shadow-lg scale-[1.01]"
                : "border-border"
            }`}
            style={{ boxShadow: isHighlighted ? undefined : "var(--shadow-card)" }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{riskIcon[clause.risk]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-semibold text-sm text-foreground">{clause.title}</h4>
                  <span className={`${riskBadge[clause.risk]} text-[10px]`}>
                    {clause.risk === "safe" ? "Safe" : clause.risk === "caution" ? "Caution" : "High Risk"}
                  </span>
                  {sharedTitles.size > 0 && (
                    isShared ? (
                      <button
                        onClick={() => onSharedClick?.(titleKey)}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground border border-accent/30 font-medium cursor-pointer hover:bg-accent/40 transition-colors"
                        title="Click to jump to matching clause"
                      >
                        ↔ Shared
                      </button>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">Unique</span>
                    )
                  )}
                </div>
                <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-3 mb-2">
                  "{clause.text}"
                </p>
                <p className="text-xs text-foreground/80">{clause.explanation}</p>
              </div>
            </div>
          </div>
        );
      })}

      {clauses.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No clauses found.</p>
      )}
    </div>
  );
};

/* ── Diff summary ──────────────────────────────── */
const DiffSummary = ({ scanA, scanB }: { scanA: ScanRecord; scanB: ScanRecord }) => {
  const clausesA = scanA.clauses ? (scanA.clauses as unknown as RiskClause[]) : [];
  const clausesB = scanB.clauses ? (scanB.clauses as unknown as RiskClause[]) : [];

  const countByRisk = (clauses: RiskClause[], risk: string) => clauses.filter((c) => c.risk === risk).length;

  const scoreDiff = (scanA.risk_score ?? 0) - (scanB.risk_score ?? 0);
  const dangerDiff = countByRisk(clausesA, "danger") - countByRisk(clausesB, "danger");
  const cautionDiff = countByRisk(clausesA, "caution") - countByRisk(clausesB, "caution");

  const fmtDiff = (d: number, inverted = false) => {
    const positive = inverted ? d < 0 : d > 0;
    const negative = inverted ? d > 0 : d < 0;
    if (d === 0) return <span className="text-muted-foreground text-sm font-mono">same</span>;
    return (
      <span className={`text-sm font-mono font-semibold ${positive ? "text-risk-safe" : negative ? "text-risk-danger" : ""}`}>
        {d > 0 ? "+" : ""}{d}
      </span>
    );
  };

  return (
    <div className="rounded-xl bg-card border border-border p-5 mb-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <h3 className="font-display font-bold text-foreground mb-3 text-sm tracking-wide uppercase">Comparison Summary</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Safety Score</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`font-bold font-display text-lg ${riskColor(scanA.risk_score)}`}>{scanA.risk_score ?? "—"}</span>
            <span className="text-muted-foreground">vs</span>
            <span className={`font-bold font-display text-lg ${riskColor(scanB.risk_score)}`}>{scanB.risk_score ?? "—"}</span>
          </div>
          <p className="mt-1">{fmtDiff(scoreDiff, false)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">High Risk Clauses</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-bold font-display text-lg text-risk-danger">{countByRisk(clausesA, "danger")}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="font-bold font-display text-lg text-risk-danger">{countByRisk(clausesB, "danger")}</span>
          </div>
          <p className="mt-1">{fmtDiff(dangerDiff, true)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Caution Clauses</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-bold font-display text-lg text-risk-caution">{countByRisk(clausesA, "caution")}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="font-bold font-display text-lg text-risk-caution">{countByRisk(clausesB, "caution")}</span>
          </div>
          <p className="mt-1">{fmtDiff(cautionDiff, true)}</p>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ─────────────────────────────────── */
const ComparisonPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanIdA, setScanIdA] = useState<string>("");
  const [scanIdB, setScanIdB] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    const fetchScans = async () => {
      const { data } = await supabase
        .from("scan_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setScans(data ?? []);
      setLoading(false);
    };
    fetchScans();
  }, [user]);

  const scanA = useMemo(() => scans.find((s) => s.id === scanIdA) ?? null, [scans, scanIdA]);
  const scanB = useMemo(() => scans.find((s) => s.id === scanIdB) ?? null, [scans, scanIdB]);

  const refsA = useRef<Map<string, HTMLDivElement>>(new Map());
  const refsB = useRef<Map<string, HTMLDivElement>>(new Map());
  const [highlightedTitle, setHighlightedTitle] = useState<string | null>(null);

  const jumpToMatch = useCallback((title: string, targetRefs: React.MutableRefObject<Map<string, HTMLDivElement>>) => {
    const el = targetRefs.current.get(title);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedTitle(title);
      setTimeout(() => setHighlightedTitle(null), 2000);
    }
  }, []);

  const sharedTitles = useMemo(() => {
    if (!scanA || !scanB) return new Set<string>();
    const titlesA = (scanA.clauses as unknown as RiskClause[] | null)?.map(c => c.title.toLowerCase()) ?? [];
    const titlesB = new Set((scanB.clauses as unknown as RiskClause[] | null)?.map(c => c.title.toLowerCase()) ?? []);
    return new Set(titlesA.filter(t => titlesB.has(t)));
  }, [scanA, scanB]);

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-display text-foreground mb-2">Access Restricted</h1>
          <p className="text-muted-foreground mb-6">This page is not available for your account.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Side-by-Side</p>
          <h1 className="text-3xl md:text-4xl font-black font-display leading-[1.1] tracking-tight mb-2">
            Clause <em className="italic text-accent">Comparison</em>
          </h1>
          <p className="text-muted-foreground max-w-lg">
            Select two contracts from your scan history to compare their risk profiles and clauses side-by-side.
          </p>
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">Contract A</label>
            <Select value={scanIdA} onValueChange={setScanIdA}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select first contract…" />
              </SelectTrigger>
              <SelectContent>
                {scans.filter((s) => s.id !== scanIdB).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{s.file_name}</span>
                      {s.risk_score !== null && (
                        <span className={`text-xs font-bold ${riskColor(s.risk_score)}`}>{s.risk_score}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">Contract B</label>
            <Select value={scanIdB} onValueChange={setScanIdB}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select second contract…" />
              </SelectTrigger>
              <SelectContent>
                {scans.filter((s) => s.id !== scanIdA).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{s.file_name}</span>
                      {s.risk_score !== null && (
                        <span className={`text-xs font-bold ${riskColor(s.risk_score)}`}>{s.risk_score}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && <p className="text-center text-muted-foreground py-12">Loading scans…</p>}

        {!loading && scans.length < 2 && (
          <div className="rounded-xl bg-card border border-border p-12 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <ArrowLeftRight className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold font-display text-foreground mb-2">Need at least 2 scans</h3>
            <p className="text-muted-foreground mb-6">Scan two or more contracts first to use the comparison tool.</p>
            <Button variant="hero" onClick={() => navigate("/scan")}>Scan a Contract</Button>
          </div>
        )}

        {/* Comparison view */}
        {scanA && scanB && (
          <>
            <DiffSummary scanA={scanA} scanB={scanB} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">Contract A</h2>
                <ClausePanel scan={scanA} sharedTitles={sharedTitles} clauseRefs={refsA} highlightedTitle={highlightedTitle} onSharedClick={(t) => jumpToMatch(t, refsB)} />
              </div>
              <div>
                <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">Contract B</h2>
                <ClausePanel scan={scanB} sharedTitles={sharedTitles} clauseRefs={refsB} highlightedTitle={highlightedTitle} onSharedClick={(t) => jumpToMatch(t, refsA)} />
              </div>
            </div>
          </>
        )}

        {!loading && scans.length >= 2 && (!scanA || !scanB) && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <ArrowLeftRight className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Select two contracts above to begin comparison.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonPage;
