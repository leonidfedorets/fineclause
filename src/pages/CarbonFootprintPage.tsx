import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Calculator, Award, Trash2, Share2, Copy, TrendingDown, Factory, Zap, Car, Recycle, Users, HelpCircle, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const EMISSION_FACTORS: Record<string, { energy: number; travel: number; waste: number; perEmployee: number }> = {
  tech: { energy: 0.4, travel: 0.15, waste: 0.5, perEmployee: 500 },
  retail: { energy: 0.5, travel: 0.18, waste: 0.8, perEmployee: 700 },
  manufacturing: { energy: 0.7, travel: 0.2, waste: 1.2, perEmployee: 1200 },
  finance: { energy: 0.35, travel: 0.12, waste: 0.3, perEmployee: 400 },
  healthcare: { energy: 0.55, travel: 0.16, waste: 1.5, perEmployee: 900 },
  construction: { energy: 0.65, travel: 0.25, waste: 1.8, perEmployee: 1500 },
  hospitality: { energy: 0.6, travel: 0.14, waste: 1.0, perEmployee: 600 },
  education: { energy: 0.38, travel: 0.1, waste: 0.4, perEmployee: 350 },
  transport: { energy: 0.8, travel: 0.3, waste: 0.6, perEmployee: 2000 },
  other: { energy: 0.45, travel: 0.15, waste: 0.7, perEmployee: 600 },
};

const INDUSTRIES = Object.keys(EMISSION_FACTORS);

interface CarbonRecord {
  id: string;
  company_name: string;
  industry: string;
  period_label: string;
  energy_kwh: number;
  travel_km: number;
  waste_kg: number;
  employees: number;
  total_emissions_kg: number;
  offsets_kg: number;
  is_carbon_neutral: boolean;
  badge_token: string;
  created_at: string;
}

const InputField = ({
  icon: Icon,
  label,
  helpText,
  children,
}: {
  icon: React.ElementType;
  label: string;
  helpText: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1">
      <Icon className="w-3.5 h-3.5 text-primary" />
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs">
          {helpText}
        </TooltipContent>
      </Tooltip>
    </label>
    {children}
    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{helpText}</p>
  </div>
);

const CarbonFootprintPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [records, setRecords] = useState<CarbonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("tech");
  const [periodLabel, setPeriodLabel] = useState("Q1 2026");
  const [energyKwh, setEnergyKwh] = useState("");
  const [travelKm, setTravelKm] = useState("");
  const [wasteKg, setWasteKg] = useState("");
  const [employees, setEmployees] = useState("");
  const [offsetsKg, setOffsetsKg] = useState("");

  // AI state
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const factors = EMISSION_FACTORS[industry] || EMISSION_FACTORS.other;
  const previewEmissions =
    (parseFloat(energyKwh) || 0) * factors.energy +
    (parseFloat(travelKm) || 0) * factors.travel +
    (parseFloat(wasteKg) || 0) * factors.waste +
    (parseInt(employees) || 0) * factors.perEmployee;
  const previewOffsets = parseFloat(offsetsKg) || 0;
  const previewNeutral = previewOffsets >= previewEmissions && previewEmissions > 0;

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const fetchRecords = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("carbon_footprints")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setRecords(data as CarbonRecord[]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !companyName.trim()) {
      toast({ title: t("carbon.errorTitle"), description: t("carbon.fillRequired"), variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("carbon_footprints").insert({
      user_id: user.id,
      company_name: companyName.trim(),
      industry,
      period_label: periodLabel.trim(),
      energy_kwh: parseFloat(energyKwh) || 0,
      travel_km: parseFloat(travelKm) || 0,
      waste_kg: parseFloat(wasteKg) || 0,
      employees: parseInt(employees) || 1,
      total_emissions_kg: Math.round(previewEmissions * 100) / 100,
      offsets_kg: previewOffsets,
      is_carbon_neutral: previewNeutral,
    });
    setSaving(false);
    if (error) {
      toast({ title: t("carbon.errorTitle"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("carbon.saved") });
      fetchRecords();
      setCompanyName("");
      setEnergyKwh("");
      setTravelKm("");
      setWasteKg("");
      setEmployees("");
      setOffsetsKg("");
    }
  };

  const handleAiAnalysis = async () => {
    if (previewEmissions === 0) {
      toast({ title: t("carbon.errorTitle"), description: t("carbon.aiNeedData"), variant: "destructive" });
      return;
    }
    setAiLoading(true);
    setAiAnalysis("");

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-carbon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            company_name: companyName || "My Company",
            industry,
            energy_kwh: parseFloat(energyKwh) || 0,
            travel_km: parseFloat(travelKm) || 0,
            waste_kg: parseFloat(wasteKg) || 0,
            employees: parseInt(employees) || 1,
            total_emissions_kg: Math.round(previewEmissions * 100) / 100,
            offsets_kg: previewOffsets,
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: "AI analysis failed" }));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      // Stream SSE
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAiAnalysis(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI analysis failed";
      toast({ title: t("carbon.errorTitle"), description: msg, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("carbon_footprints").delete().eq("id", id);
    setRecords((r) => r.filter((x) => x.id !== id));
    toast({ title: t("carbon.deleted") });
  };

  const copyBadgeLink = (token: string) => {
    const url = `${window.location.origin}/carbon-badge/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: t("carbon.badgeCopied") });
  };

  const formatKg = (kg: number) => {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
    return `${Math.round(kg)} kg`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <Leaf className="w-7 h-7 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("carbon.title")}</h1>
        </div>
        <p className="text-muted-foreground mb-8">{t("carbon.subtitle")}</p>

        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calculator" className="gap-1.5">
              <Calculator className="w-4 h-4" />
              {t("carbon.tabCalculator")}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <TrendingDown className="w-4 h-4" />
              {t("carbon.tabHistory")}
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-1.5">
              <Award className="w-4 h-4" />
              {t("carbon.tabBadges")}
            </TabsTrigger>
          </TabsList>

          {/* ── Calculator ── */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left – inputs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("carbon.inputsTitle")}</CardTitle>
                  <CardDescription>{t("carbon.inputsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">{t("carbon.companyName")}</label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Corp" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1">
                        {t("carbon.industry")}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px] text-xs">
                            {t("carbon.helpIndustry")}
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((ind) => (
                            <SelectItem key={ind} value={ind}>{t(`carbon.ind_${ind}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t("carbon.helpIndustry")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1">
                        {t("carbon.period")}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px] text-xs">
                            {t("carbon.helpPeriod")}
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} placeholder="Q1 2026" />
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t("carbon.helpPeriod")}</p>
                    </div>
                  </div>

                  <InputField icon={Zap} label={t("carbon.energy")} helpText={t("carbon.helpEnergy")}>
                    <Input type="number" min="0" value={energyKwh} onChange={(e) => setEnergyKwh(e.target.value)} placeholder="e.g. 12000" />
                  </InputField>

                  <InputField icon={Car} label={t("carbon.travel")} helpText={t("carbon.helpTravel")}>
                    <Input type="number" min="0" value={travelKm} onChange={(e) => setTravelKm(e.target.value)} placeholder="e.g. 5000" />
                  </InputField>

                  <InputField icon={Recycle} label={t("carbon.waste")} helpText={t("carbon.helpWaste")}>
                    <Input type="number" min="0" value={wasteKg} onChange={(e) => setWasteKg(e.target.value)} placeholder="e.g. 800" />
                  </InputField>

                  <InputField icon={Users} label={t("carbon.employees")} helpText={t("carbon.helpEmployees")}>
                    <Input type="number" min="1" value={employees} onChange={(e) => setEmployees(e.target.value)} placeholder="e.g. 25" />
                  </InputField>

                  <InputField icon={Leaf} label={t("carbon.offsets")} helpText={t("carbon.helpOffsets")}>
                    <Input type="number" min="0" value={offsetsKg} onChange={(e) => setOffsetsKg(e.target.value)} placeholder="e.g. 5000" />
                  </InputField>
                </CardContent>
              </Card>

              {/* Right – live preview */}
              <div className="space-y-6">
                <Card className={previewNeutral ? "border-primary/50 bg-primary/5" : ""}>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("carbon.previewTitle")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="text-center space-y-1">
                      <Factory className="w-10 h-10 mx-auto text-muted-foreground" />
                      <p className="text-3xl font-bold text-foreground">{formatKg(previewEmissions)}</p>
                      <p className="text-sm text-muted-foreground">CO₂ {t("carbon.emissions")}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{formatKg((parseFloat(energyKwh) || 0) * factors.energy)}</p>
                        <p className="text-muted-foreground">{t("carbon.energy")}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{formatKg((parseFloat(travelKm) || 0) * factors.travel)}</p>
                        <p className="text-muted-foreground">{t("carbon.travel")}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{formatKg((parseFloat(wasteKg) || 0) * factors.waste)}</p>
                        <p className="text-muted-foreground">{t("carbon.waste")}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{formatKg((parseInt(employees) || 0) * factors.perEmployee)}</p>
                        <p className="text-muted-foreground">{t("carbon.employees")}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="text-sm text-muted-foreground">{t("carbon.offsetsApplied")}</span>
                      <span className="font-semibold text-foreground">-{formatKg(previewOffsets)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t("carbon.netEmissions")}</span>
                      <span className="font-bold text-foreground">{formatKg(Math.max(0, previewEmissions - previewOffsets))}</span>
                    </div>
                    {previewNeutral && (
                      <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/30">
                        <Award className="w-8 h-8 mx-auto text-primary mb-1" />
                        <p className="font-bold text-primary text-lg">{t("carbon.neutralBadge")}</p>
                        <p className="text-xs text-muted-foreground">{t("carbon.neutralDesc")}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={saving || !companyName.trim()} className="flex-1">
                        {saving ? t("carbon.saving") : t("carbon.saveCalculation")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleAiAnalysis}
                        disabled={aiLoading || previewEmissions === 0}
                        className="gap-1.5"
                      >
                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {t("carbon.aiAnalyze")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Analysis Panel */}
                {(aiAnalysis || aiLoading) && (
                  <Card className="border-primary/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        {t("carbon.aiInsights")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {aiLoading && !aiAnalysis && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("carbon.aiThinking")}
                        </div>
                      )}
                      {aiAnalysis && (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                          <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── History ── */}
          <TabsContent value="history">
            {loading ? (
              <p className="text-muted-foreground text-sm">{t("carbon.loading")}</p>
            ) : records.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">{t("carbon.noRecords")}</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {records.map((rec) => (
                  <Card key={rec.id}>
                    <CardContent className="py-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground">{rec.company_name}</p>
                          <Badge variant="secondary" className="text-xs">{t(`carbon.ind_${rec.industry}`)}</Badge>
                          {rec.period_label && <Badge variant="outline" className="text-xs">{rec.period_label}</Badge>}
                          {rec.is_carbon_neutral && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs gap-1">
                              <Leaf className="w-3 h-3" />{t("carbon.neutral")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("carbon.emissions")}: {formatKg(rec.total_emissions_kg)} · {t("carbon.offsets")}: {formatKg(rec.offsets_kg)} · {t("carbon.netEmissions")}: {formatKg(Math.max(0, rec.total_emissions_kg - rec.offsets_kg))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {rec.is_carbon_neutral && (
                          <Button size="sm" variant="outline" onClick={() => copyBadgeLink(rec.badge_token)}>
                            <Share2 className="w-3.5 h-3.5 mr-1" />{t("carbon.shareBadge")}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(rec.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Badges ── */}
          <TabsContent value="badges">
            {(() => {
              const neutralRecords = records.filter((r) => r.is_carbon_neutral);
              if (neutralRecords.length === 0) {
                return (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Award className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">{t("carbon.noBadges")}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t("carbon.noBadgesHint")}</p>
                    </CardContent>
                  </Card>
                );
              }
              return (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {neutralRecords.map((rec) => (
                    <Card key={rec.id} className="border-primary/30 bg-primary/5 text-center">
                      <CardContent className="py-6 space-y-3">
                        <Award className="w-12 h-12 mx-auto text-primary" />
                        <p className="font-bold text-foreground text-lg">{rec.company_name}</p>
                        <p className="text-xs text-muted-foreground">{rec.period_label}</p>
                        <Badge className="bg-primary text-primary-foreground">{t("carbon.neutralBadge")}</Badge>
                        <p className="text-xs text-muted-foreground">{formatKg(rec.total_emissions_kg)} {t("carbon.offsetBy")} {formatKg(rec.offsets_kg)}</p>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => copyBadgeLink(rec.badge_token)}>
                          <Copy className="w-3.5 h-3.5 mr-1.5" />{t("carbon.copyBadgeLink")}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default CarbonFootprintPage;
