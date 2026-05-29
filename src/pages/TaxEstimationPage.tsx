import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Calculator, History, Sparkles, Trash2, HelpCircle, Receipt, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";

const COUNTRIES = [
  { value: "EU", label: "European Union" },
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "CZ", label: "Czech Republic" },
  { value: "PL", label: "Poland" },
  { value: "ES", label: "Spain" },
  { value: "LV", label: "Latvia" },
  { value: "UA", label: "Ukraine" },
  { value: "OTHER", label: "Other" },
];

const TAX_REGIMES = [
  { value: "standard", label: "Standard" },
  { value: "flat_rate", label: "Flat Rate" },
  { value: "small_business", label: "Small Business" },
  { value: "freelancer", label: "Freelancer / Self-Employed" },
  { value: "corporate", label: "Corporate" },
];

const CURRENCIES = ["EUR", "USD", "GBP", "CZK", "PLN", "UAH"];

const InputField = ({ label, help, children }: { label: string; help: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5">
      <Label className="text-foreground text-sm font-medium">{label}</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">{help}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
    {children}
  </div>
);

const TaxEstimationPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("EU");
  const [taxRegime, setTaxRegime] = useState("standard");
  const [grossIncome, setGrossIncome] = useState(0);
  const [deductibleExpenses, setDeductibleExpenses] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const [quarterLabel, setQuarterLabel] = useState(() => {
    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${q} ${now.getFullYear()}`;
  });
  const [vatApplicable, setVatApplicable] = useState(false);
  const [vatRate, setVatRate] = useState(21);

  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState("");

  const taxableIncome = Math.max(0, grossIncome - deductibleExpenses);
  // Simple estimate: use a rough bracket
  const estimatedTax = taxableIncome * 0.2; // placeholder 20%
  const effectiveRate = grossIncome > 0 ? ((estimatedTax / grossIncome) * 100).toFixed(1) : "0.0";
  const vatAmount = vatApplicable ? grossIncome * (vatRate / 100) : 0;

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from("tax_estimates")
      .select("*")
      .order("created_at", { ascending: false });
    setHistory(data || []);
    setLoadingHistory(false);
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error(t("tax.fillRequired"));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("tax_estimates").insert({
      user_id: user!.id,
      company_name: companyName,
      country,
      tax_regime: taxRegime,
      gross_income: grossIncome,
      deductible_expenses: deductibleExpenses,
      taxable_income: taxableIncome,
      estimated_tax: estimatedTax,
      effective_rate: parseFloat(effectiveRate),
      currency,
      quarter_label: quarterLabel,
      ai_advice: aiContent || null,
      vat_applicable: vatApplicable,
      vat_rate: vatRate,
      vat_amount: vatAmount,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("tax.saved"));
      fetchHistory();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("tax_estimates").delete().eq("id", id);
    toast.success(t("tax.deleted"));
    fetchHistory();
  };

  const handleAiAnalysis = async () => {
    if (grossIncome <= 0) {
      toast.error(t("tax.aiNeedData"));
      return;
    }
    setAiLoading(true);
    setAiContent("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-tax`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            company_name: companyName,
            country,
            tax_regime: taxRegime,
            gross_income: grossIncome,
            deductible_expenses: deductibleExpenses,
            currency,
            quarter_label: quarterLabel,
            vat_applicable: vatApplicable,
            vat_rate: vatRate,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "AI error" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) { full += c; setAiContent(full); }
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display text-foreground flex items-center justify-center gap-2">
            <Receipt className="w-7 h-7 text-accent" />
            {t("tax.title")}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{t("tax.subtitle")}</p>
        </div>

        <Tabs defaultValue="calculator">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="calculator" className="gap-1.5"><Calculator className="w-3.5 h-3.5" />{t("tax.tabCalculator")}</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><History className="w-3.5 h-3.5" />{t("tax.tabHistory")}</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Inputs */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg">{t("tax.inputsTitle")}</CardTitle>
                  <CardDescription>{t("tax.inputsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <InputField label={t("tax.companyName")} help={t("tax.helpCompany")}>
                      <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme s.r.o." />
                    </InputField>
                    <InputField label={t("tax.quarter")} help={t("tax.helpQuarter")}>
                      <Input value={quarterLabel} onChange={e => setQuarterLabel(e.target.value)} placeholder="Q2 2026" />
                    </InputField>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <InputField label={t("tax.country")} help={t("tax.helpCountry")}>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </InputField>
                    <InputField label={t("tax.taxRegime")} help={t("tax.helpRegime")}>
                      <Select value={taxRegime} onValueChange={setTaxRegime}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TAX_REGIMES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </InputField>
                    <InputField label={t("tax.currency")} help={t("tax.helpCurrency")}>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </InputField>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <InputField label={t("tax.grossIncome")} help={t("tax.helpIncome")}>
                      <Input type="number" min={0} value={grossIncome || ""} onChange={e => setGrossIncome(Number(e.target.value))} placeholder="50000" />
                    </InputField>
                    <InputField label={t("tax.deductibleExpenses")} help={t("tax.helpDeductions")}>
                      <Input type="number" min={0} value={deductibleExpenses || ""} onChange={e => setDeductibleExpenses(Number(e.target.value))} placeholder="15000" />
                    </InputField>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border border-border">
                    <Switch checked={vatApplicable} onCheckedChange={setVatApplicable} />
                    <Label className="text-sm text-foreground">{t("tax.vatApplicable")}</Label>
                    {vatApplicable && (
                      <div className="ml-auto flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">{t("tax.vatRate")}</Label>
                        <Input type="number" min={0} max={100} className="w-20 h-8 text-sm" value={vatRate} onChange={e => setVatRate(Number(e.target.value))} />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="hero" onClick={handleSave} disabled={saving}>
                      {saving ? t("tax.saving") : t("tax.saveEstimate")}
                    </Button>
                    <Button variant="outline" onClick={handleAiAnalysis} disabled={aiLoading} className="gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      {aiLoading ? t("tax.aiThinking") : t("tax.aiAnalyze")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Live Preview */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("tax.previewTitle")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("tax.grossIncome")}</span><span className="font-mono font-medium text-foreground">{fmt(grossIncome)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("tax.deductibleExpenses")}</span><span className="font-mono font-medium text-destructive">-{fmt(deductibleExpenses)}</span></div>
                    <div className="border-t border-border pt-2 flex justify-between text-sm"><span className="text-muted-foreground">{t("tax.taxableIncome")}</span><span className="font-mono font-semibold text-foreground">{fmt(taxableIncome)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("tax.estimatedTax")}</span><span className="font-mono font-semibold text-accent">{fmt(estimatedTax)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("tax.effectiveRate")}</span><span className="font-mono text-foreground">{effectiveRate}%</span></div>
                    {vatApplicable && (
                      <>
                        <div className="border-t border-border pt-2 flex justify-between text-sm"><span className="text-muted-foreground">{t("tax.vatAmount")}</span><span className="font-mono font-medium text-foreground">{fmt(vatAmount)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("tax.totalLiability")}</span><span className="font-mono font-bold text-foreground">{fmt(estimatedTax + vatAmount)}</span></div>
                      </>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 pt-2 italic">{t("tax.disclaimer")}</p>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                {(aiContent || aiLoading) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-accent" />
                        {t("tax.aiInsights")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {aiLoading && !aiContent && (
                        <p className="text-sm text-muted-foreground animate-pulse">{t("tax.aiThinking")}</p>
                      )}
                      {aiContent && (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                          <ReactMarkdown>{aiContent}</ReactMarkdown>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            {loadingHistory ? (
              <p className="text-center text-muted-foreground py-12">{t("tax.loading")}</p>
            ) : history.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">{t("tax.noRecords")}</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {history.map((h) => (
                  <Card key={h.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{h.company_name}</CardTitle>
                          <CardDescription>{h.quarter_label} · {h.country} · {h.tax_regime}</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(h.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("tax.grossIncome")}</span><span className="font-mono">{Number(h.gross_income).toLocaleString()} {h.currency}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("tax.estimatedTax")}</span><span className="font-mono text-accent">{Number(h.estimated_tax).toLocaleString()} {h.currency}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("tax.effectiveRate")}</span><span className="font-mono">{Number(h.effective_rate).toFixed(1)}%</span></div>
                      {h.vat_applicable && (
                        <div className="flex justify-between"><span className="text-muted-foreground">{t("tax.vatAmount")}</span><span className="font-mono">{Number(h.vat_amount).toLocaleString()} {h.currency}</span></div>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 pt-1">{new Date(h.created_at).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TaxEstimationPage;
