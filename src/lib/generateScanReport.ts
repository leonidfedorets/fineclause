import jsPDF from "jspdf";

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

const COLORS = {
  ink: [15, 14, 12] as [number, number, number],
  muted: [102, 96, 90] as [number, number, number],
  accent: [192, 57, 43] as [number, number, number],
  safe: [39, 134, 72] as [number, number, number],
  caution: [163, 130, 12] as [number, number, number],
  danger: [192, 57, 43] as [number, number, number],
  cream: [237, 232, 223] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  border: [220, 215, 206] as [number, number, number],
};

const riskColorMap = {
  safe: COLORS.safe,
  caution: COLORS.caution,
  danger: COLORS.danger,
};

const riskLabelMap = {
  safe: "SAFE",
  caution: "CAUTION",
  danger: "HIGH RISK",
};

/**
 * Strip characters that jsPDF's built-in Helvetica font cannot render.
 * Helvetica supports the Latin-1 supplement (U+0000–U+00FF) only.
 * Anything outside that range (Cyrillic, Arabic, CJK, emoji, etc.)
 * will appear as garbage boxes — replace them with a readable fallback.
 */
function sanitizeForPdf(text: string): string {
  if (!text) return "";
  return (
    text
      // Replace common typographic chars with ASCII equivalents
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-")
      .replace(/…/g, "...")
      .replace(/©/g, "(c)")
      .replace(/®/g, "(R)")
      .replace(/™/g, "(TM)")
      .replace(/€/g, "EUR")
      .replace(/£/g, "GBP")
      // Emoji & symbols → [icon]
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, "[icon]")
      .replace(/[☀-⟿]/g, "")
      // Strip everything outside Latin-1 (U+0100 and above that wasn't caught)
      .replace(/[^\x00-\xFF]/g, "?")
      .trim()
  );
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(sanitizeForPdf(text), maxWidth) as string[];
}

function checkPageBreak(doc: jsPDF, y: number, needed: number, margin: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - margin) {
    doc.addPage();
    return margin;
  }
  return y;
}

export function generateScanReport(results: AnalysisResult): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const clauses = results.clauses ?? [];
  const safeCount = clauses.filter((c) => c.risk === "safe").length;
  const cautionCount = clauses.filter((c) => c.risk === "caution").length;
  const dangerCount = clauses.filter((c) => c.risk === "danger").length;
  const overallScore = clauses.length
    ? Math.round((safeCount / clauses.length) * 100)
    : 0;

  // ── Header ──
  doc.setFillColor(...COLORS.ink);
  doc.rect(0, 0, pageWidth, 48, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("FineClause", margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Contract Risk Report", margin, 26);

  doc.setFontSize(8);
  doc.setTextColor(180, 178, 174);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, 34);
  doc.text(sanitizeForPdf(results.documentType), margin, 40);

  y = 58;

  // ── Score Card ──
  doc.setFillColor(...COLORS.cream);
  doc.roundedRect(margin, y, contentWidth, 36, 3, 3, "F");

  // Score circle
  const circleX = margin + 18;
  const circleY = y + 18;
  const scoreColor = overallScore >= 70 ? COLORS.safe : overallScore >= 40 ? COLORS.caution : COLORS.danger;
  doc.setDrawColor(...scoreColor);
  doc.setLineWidth(1.5);
  doc.circle(circleX, circleY, 12);
  doc.setTextColor(...scoreColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(String(overallScore), circleX, circleY + 1, { align: "center", baseline: "middle" });

  // Score label
  doc.setTextColor(...COLORS.ink);
  doc.setFontSize(14);
  doc.text("Risk Score", margin + 36, y + 14);

  // Risk counts
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const countsY = y + 22;
  let cx = margin + 36;

  if (dangerCount > 0) {
    doc.setTextColor(...COLORS.danger);
    doc.text(`${dangerCount} High Risk`, cx, countsY);
    cx += doc.getTextWidth(`${dangerCount} High Risk`) + 8;
  }
  if (cautionCount > 0) {
    doc.setTextColor(...COLORS.caution);
    doc.text(`${cautionCount} Caution`, cx, countsY);
    cx += doc.getTextWidth(`${cautionCount} Caution`) + 8;
  }
  doc.setTextColor(...COLORS.safe);
  doc.text(`${safeCount} Safe`, cx, countsY);

  y += 44;

  // ── Summary ──
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const summaryLines = wrapText(doc, results.summary, contentWidth); // wrapText calls sanitizeForPdf internally
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 4.5 + 8;

  // ── Divider ──
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Clause Breakdown Header ──
  doc.setTextColor(...COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Clause Breakdown", margin, y);
  y += 10;

  // ── Clauses ──
  clauses.forEach((clause) => {
    // Estimate height — sanitize all clause text before rendering
    const explanationLines = wrapText(doc, clause.explanation, contentWidth - 14);
    const textLines = wrapText(doc, `"${clause.text}"`, contentWidth - 14);
    const altLines = clause.suggestedAlternative
      ? wrapText(doc, `"${clause.suggestedAlternative}"`, contentWidth - 18)
      : [];
    const safeTitle = sanitizeForPdf(clause.title);
    const estimatedHeight = 18 + textLines.length * 3.8 + explanationLines.length * 3.8 + (altLines.length > 0 ? altLines.length * 3.8 + 14 : 0);

    y = checkPageBreak(doc, y, estimatedHeight, margin);

    // Risk color bar
    const riskColor = riskColorMap[clause.risk];
    doc.setFillColor(...riskColor);
    doc.rect(margin, y, 2, estimatedHeight - 2, "F");

    // Title + badge
    doc.setTextColor(...COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(safeTitle, margin + 6, y + 5);

    // Badge
    const badge = riskLabelMap[clause.risk];
    const badgeX = margin + 6 + doc.getTextWidth(safeTitle) + 4;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    const badgeWidth = doc.getTextWidth(badge) + 6;
    doc.setFillColor(...riskColor);
    doc.roundedRect(badgeX, y + 1, badgeWidth, 5.5, 1, 1, "F");
    doc.setTextColor(...COLORS.white);
    doc.text(badge, badgeX + 3, y + 5);

    let clauseY = y + 11;

    // Quoted text
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text(textLines, margin + 6, clauseY);
    clauseY += textLines.length * 3.8 + 3;

    // Explanation
    doc.setTextColor(...COLORS.ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(explanationLines, margin + 6, clauseY);
    clauseY += explanationLines.length * 3.8 + 2;

    // Suggested alternative
    if (altLines.length > 0) {
      clauseY += 2;
      doc.setFillColor(245, 243, 239);
      doc.roundedRect(margin + 6, clauseY - 3, contentWidth - 12, altLines.length * 3.8 + 10, 2, 2, "F");

      doc.setTextColor(...COLORS.accent);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(">> SUGGESTED ALTERNATIVE", margin + 10, clauseY + 2);

      doc.setTextColor(...COLORS.ink);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text(altLines, margin + 10, clauseY + 7);
      clauseY += altLines.length * 3.8 + 12;
    }

    y = clauseY + 6;
  });

  // ── Footer on last page ──
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("This report is AI-generated and does not constitute legal advice. Consult a qualified attorney for professional guidance.", margin, footerY);
  doc.text("FineClause — fineclause.com", pageWidth - margin, footerY, { align: "right" });

  // Save
  const fileName = `FineClause-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
