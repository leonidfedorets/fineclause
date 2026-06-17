import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle, XCircle, Search, ArrowLeft, Type, Lightbulb, Copy, Check, Download, Share2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import OnboardingTour from "@/components/OnboardingTour";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { generateScanReport } from "@/lib/generateScanReport";
import { useTranslation } from "react-i18next";
import { isMobileApp } from "@/lib/isMobileApp";

interface RiskClause {
  title: string;
  text: string;
  risk: "safe" | "caution" | "danger";
  explanation: string;
  suggestedAlternative?: string | null;
}

interface AnalysisResult {
  documentType: string;
  summary: string;
  clauses: RiskClause[];
}

const riskIcon = {
  safe: <CheckCircle className="w-5 h-5 text-risk-safe" />,
  caution: <AlertTriangle className="w-5 h-5 text-risk-caution" />,
  danger: <XCircle className="w-5 h-5 text-risk-danger" />,
};

const riskLabel = {
  safe: "risk-badge-safe",
  caution: "risk-badge-caution",
  danger: "risk-badge-danger",
};

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const isTextFile = (file: File) => {
  const textTypes = ["text/plain", "text/markdown", "text/rtf"];
  const textExtensions = [".txt", ".md", ".rtf"];
  return textTypes.includes(file.type) || textExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
};

const CopyButton = ({ text }: { text: string }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" className="mt-2 gap-1.5 text-xs h-7" onClick={handleCopy}>
      {copied ? <><Check className="w-3 h-3" /> {t("scan.copied")}</> : <><Copy className="w-3 h-3" /> {t("scan.copyToClipboard")}</>}
    </Button>
  );
};

const ScanPage = () => {
  const { t } = useTranslation();
  const { user, isMobile } = useAuth();
  const mobile = isMobileApp();
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const hasInput = inputMode === "file" ? !!file : pastedText.trim().length > 0;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setInputMode("file");
    }
  }, []);

  const handleNativeShare = async () => {
    if (!results) return;
    try {
      const { Share } = await import("@capacitor/share");
      const lines = results.clauses.map(c => `[${c.risk.toUpperCase()}] ${c.title}: ${c.explanation}`).join("\n\n");
      await Share.share({
        title: "FineClause Contract Scan",
        text: `Document: ${results.documentType}\n\nSummary: ${results.summary}\n\n${lines}`,
        dialogTitle: "Share Scan Report",
      });
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleCameraCapture = async () => {
    try {
      const { Camera: Cap, CameraResultType, CameraSource } = await import("@capacitor/camera");
      const photo = await Cap.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        quality: 85,
        allowEditing: false,
      });
      if (photo.base64String) {
        // Convert base64 → Uint8Array → Blob without fetch() (blocked in WKWebView)
        const binary = atob(photo.base64String);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: "image/jpeg" });
        const capturedFile = new File([blob], "document-photo.jpg", { type: "image/jpeg" });
        setFile(capturedFile);
        setInputMode("file");
      }
    } catch (err: any) {
      if (err?.message !== "User cancelled photos app") {
        toast.error(t("common.error"));
      }
    }
  };

  const handleScan = async () => {
    if (!hasInput) return;
    setScanning(true);

    try {
      let body: Record<string, string>;

      if (inputMode === "text") {
        const text = pastedText.trim();
        if (!text) {
          toast.error(t("common.error"));
          setScanning(false);
          return;
        }
        body = { documentText: text };
      } else if (file) {
        if (isTextFile(file)) {
          const documentText = await readFileAsText(file);
          if (!documentText.trim()) {
            toast.error(t("common.error"));
            setScanning(false);
            return;
          }
          body = { documentText };
        } else {
          const fileData = await readFileAsBase64(file);
          body = { fileData, fileType: file.type || file.name };
        }
      } else {
        return;
      }

      const { data, error } = await supabase.functions.invoke("analyze-contract", {
        body,
        // Tell backend this is a mobile client → skip scan limits for auth users
        headers: isMobile ? { "X-Mobile-Client": "capacitor" } : undefined,
      });

      if (error) {
        console.error("Edge function error:", error);
        toast.error(error.message || t("common.error"));
        setScanning(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setScanning(false);
        return;
      }

      const analysisResult = data as AnalysisResult;
      setResults(analysisResult);

      if (user) {
        const fileName = inputMode === "file" && file ? file.name : "Pasted Text";
        const safeCount = analysisResult.clauses.filter((c) => c.risk === "safe").length;
        const riskScore = analysisResult.clauses.length
          ? Math.round((safeCount / analysisResult.clauses.length) * 100)
          : 0;

        await supabase.from("scan_history").insert({
          user_id: user.id,
          file_name: fileName,
          document_type: analysisResult.documentType,
          summary: analysisResult.summary,
          risk_score: riskScore,
          clauses: analysisResult.clauses as any,
        });

        // Haptic feedback + reminder notification on native mobile after successful scan
        if (mobile) {
          try {
            const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
            await Haptics.impact({ style: ImpactStyle.Medium });
          } catch { /* non-fatal */ }
          try {
            const { LocalNotifications } = await import("@capacitor/local-notifications");
            const perm = await LocalNotifications.requestPermissions();
            if (perm.display === "granted") {
              await LocalNotifications.schedule({
                notifications: [{
                  id: Date.now(),
                  title: "FineClause",
                  body: "Your scan is ready — tap to review your contract analysis.",
                  schedule: { at: new Date(Date.now() + 3000) },
                  smallIcon: "ic_stat_icon_config_sample",
                }],
              });
            }
          } catch { /* non-fatal */ }
        }
      }
    } catch (err) {
      console.error("Scan error:", err);
      toast.error(t("common.error"));
    } finally {
      setScanning(false);
    }
  };

  const clauses = results?.clauses ?? [];
  const overallScore = clauses.length
    ? Math.round((clauses.filter((r) => r.risk === "safe").length / clauses.length) * 100)
    : 0;
  const dangerCount = clauses.filter((r) => r.risk === "danger").length;
  const cautionCount = clauses.filter((r) => r.risk === "caution").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {!results && <OnboardingTour />}
      <div className="container mx-auto px-4 pt-24 pb-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          {t("scan.backToHome")}
        </Link>

        {!results ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
                {t("scan.title")}
              </h1>
              <p className="text-muted-foreground">{t("scan.unlimitedLabel")}</p>
            </div>

            <div id="tour-input-toggle" className="flex gap-2 mb-4 flex-wrap">
              <Button
                variant={inputMode === "file" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("file")}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {t("scan.uploadFile")}
              </Button>
              <Button
                variant={inputMode === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("text")}
                className="gap-2"
              >
                <Type className="w-4 h-4" />
                {t("scan.pasteText")}
              </Button>
              {/* Native camera document capture (iOS only) */}
              {mobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCameraCapture}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Scan Photo
                </Button>
              )}
            </div>

            {inputMode === "file" ? (
              <div
                id="tour-input-area"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
                  dragOver ? "border-accent bg-accent/5"
                    : file ? "border-risk-safe/50 bg-risk-safe/5"
                    : "border-border hover:border-accent/50 bg-card"
                }`}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".txt,.pdf,.docx,.doc,.md,.rtf";
                  input.onchange = (e: any) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  };
                  input.click();
                }}
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="w-12 h-12 text-risk-safe" />
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB — {t("scan.readyToScan")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <p className="font-medium text-foreground">{t("scan.dropContract")}</p>
                    <p className="text-sm text-muted-foreground">{t("scan.fileFormats")}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-card border border-border p-1" style={{ boxShadow: "var(--shadow-card)" }}>
                <Textarea
                  placeholder={t("scan.pasteHere")}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="min-h-[250px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-[15px] leading-relaxed"
                />
                {pastedText.length > 0 && (
                  <p className="text-xs text-muted-foreground px-3 pb-2">
                    {pastedText.length.toLocaleString()} {t("scan.characters")}
                  </p>
                )}
              </div>
            )}

            <div id="tour-scan-button">
            <Button
              variant="hero"
              size="lg"
              className="w-full mt-6 py-6 text-base"
              disabled={!hasInput || scanning}
              onClick={handleScan}
            >
              {scanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("scan.analyzingContract")}
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  {t("scan.scanForRisks")}
                </>
              )}
            </Button>
            </div>

            {scanning && (
              <div className="mt-8 rounded-xl bg-card border border-border p-6 relative overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="absolute left-0 right-0 h-1 bg-accent/20 animate-scan-line rounded" />
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-4/5" />
                  <div className="h-3 bg-risk-caution/20 rounded w-full" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-risk-danger/20 rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  {t("scan.aiAnalyzing")}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Results */
          <div className="max-w-4xl mx-auto animate-fade-up">
            <div className="rounded-2xl bg-card border border-border p-8 mb-8" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r="54" fill="none"
                      stroke={overallScore >= 70 ? "hsl(var(--risk-safe))" : overallScore >= 40 ? "hsl(var(--risk-caution))" : "hsl(var(--risk-danger))"}
                      strokeWidth="8"
                      strokeDasharray={`${(overallScore / 100) * 339.3} 339.3`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold font-display text-foreground">{overallScore}</span>
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-sm text-muted-foreground mb-1">{results.documentType}</div>
                  <h2 className="text-2xl font-bold font-display text-foreground mb-2">
                    {t("scan.contractRiskScore")}
                  </h2>
                  <p className="text-muted-foreground mb-4">{results.summary}</p>
                  <div className="flex gap-4 justify-center md:justify-start flex-wrap">
                    {dangerCount > 0 && <span className="risk-badge-danger">{dangerCount} {t("scan.highRisk")}</span>}
                    {cautionCount > 0 && <span className="risk-badge-caution">{cautionCount} {t("scan.caution")}</span>}
                    <span className="risk-badge-safe">{clauses.length - dangerCount - cautionCount} {t("scan.safe")}</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold font-display text-foreground mb-4">{t("scan.clauseBreakdown")}</h3>
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
                          {clause.risk === "safe" ? t("scan.safe") : clause.risk === "caution" ? t("scan.caution") : t("scan.highRisk")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground italic mb-3 border-l-2 border-border pl-4">
                        "{clause.text}"
                      </p>
                      <p className="text-sm text-foreground/80">
                        <strong>{t("scan.whatThisMeans")}</strong> {clause.explanation}
                      </p>
                      {clause.suggestedAlternative && (
                        <div className="mt-4 rounded-lg bg-accent/5 border border-accent/20 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-accent" />
                            <span className="text-sm font-semibold text-accent">{t("scan.suggestedAlternative")}</span>
                          </div>
                          <p className="text-sm text-foreground/80 italic leading-relaxed">
                            "{clause.suggestedAlternative}"
                          </p>
                          <CopyButton text={clause.suggestedAlternative} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button variant="outline" size="lg" onClick={() => { setResults(null); setFile(null); setPastedText(""); }}>
                {t("scan.scanAnother")}
              </Button>
              {/* Native share sheet on mobile (Apple 4.2 native functionality) */}
              {mobile ? (
                <Button variant="outline" size="lg" className="gap-2" onClick={handleNativeShare}>
                  <Share2 className="w-4 h-4" />
                  Share Report
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={() => {
                    if (results) {
                      generateScanReport(results);
                      toast.success(t("common.success"));
                    }
                  }}
                >
                  <Download className="w-4 h-4" />
                  {t("scan.downloadReport")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanPage;
