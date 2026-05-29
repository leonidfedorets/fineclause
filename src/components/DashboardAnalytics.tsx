import { useMemo } from "react";
import { FileText, AlertTriangle, ShieldCheck, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { Json } from "@/integrations/supabase/types";

interface ScanRecord {
  id: string;
  file_name: string;
  document_type: string | null;
  summary: string | null;
  risk_score: number | null;
  clauses: Json | null;
  created_at: string;
}

interface RiskClause {
  risk: "safe" | "caution" | "danger";
}

const RISK_COLORS = {
  safe: "hsl(145, 58%, 42%)",
  caution: "hsl(42, 85%, 39%)",
  danger: "hsl(4, 66%, 47%)",
};

const DashboardAnalytics = ({ scans }: { scans: ScanRecord[] }) => {
  const stats = useMemo(() => {
    const totalScans = scans.length;
    const avgScore = totalScans > 0
      ? Math.round(scans.reduce((sum, s) => sum + (s.risk_score ?? 0), 0) / totalScans)
      : 0;

    let safe = 0, caution = 0, danger = 0;
    scans.forEach((s) => {
      const clauses = (s.clauses as unknown as RiskClause[]) ?? [];
      clauses.forEach((c) => {
        if (c.risk === "safe") safe++;
        else if (c.risk === "caution") caution++;
        else if (c.risk === "danger") danger++;
      });
    });

    const highRiskScans = scans.filter((s) => (s.risk_score ?? 100) < 40).length;

    return { totalScans, avgScore, safe, caution, danger, highRiskScans };
  }, [scans]);

  const riskPieData = useMemo(() => [
    { name: "Safe", value: stats.safe, color: RISK_COLORS.safe },
    { name: "Caution", value: stats.caution, color: RISK_COLORS.caution },
    { name: "High Risk", value: stats.danger, color: RISK_COLORS.danger },
  ].filter((d) => d.value > 0), [stats]);

  const trendData = useMemo(() => {
    return scans
      .filter((s) => s.risk_score !== null)
      .map((s) => ({
        date: new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        score: s.risk_score!,
        fileName: s.file_name,
      }))
      .reverse()
      .slice(-20);
  }, [scans]);

  if (scans.length === 0) return null;

  const statCards = [
    { label: "Total Scans", value: stats.totalScans, icon: FileText, color: "text-accent" },
    { label: "Avg. Safety Score", value: stats.avgScore, icon: ShieldCheck, color: stats.avgScore >= 70 ? "text-risk-safe" : stats.avgScore >= 40 ? "text-risk-caution" : "text-risk-danger" },
    { label: "High Risk Scans", value: stats.highRiskScans, icon: AlertTriangle, color: "text-risk-danger" },
    { label: "Clauses Analyzed", value: stats.safe + stats.caution + stats.danger, icon: TrendingUp, color: "text-risk-info" },
  ];

  return (
    <div className="mb-10 space-y-6 animate-fade-up">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl bg-card border border-border p-5 flex flex-col gap-2"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono tracking-wider uppercase text-muted-foreground">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <span className={`text-3xl font-bold font-display ${card.color}`}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="rounded-xl bg-card border border-border p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-mono tracking-wider uppercase text-muted-foreground mb-4">Risk Distribution</h3>
          {riskPieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {riskPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3">
                {riskPieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-sm text-foreground/80">
                      <strong>{d.value}</strong> {d.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No clause data available</p>
          )}
        </div>

        {/* Scan Trend */}
        <div className="rounded-xl bg-card border border-border p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-sm font-mono tracking-wider uppercase text-muted-foreground mb-4">Safety Score Trend</h3>
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(4, 66%, 47%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(4, 66%, 47%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(25, 6%, 40%)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(25, 6%, 40%)" }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(30, 15%, 88%)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value: number, _name: string, props: any) => [`${value}`, props?.payload?.fileName || "Score"]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(4, 66%, 47%)"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[140px]">
              <p className="text-sm text-muted-foreground">Need more scans to show trends</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
