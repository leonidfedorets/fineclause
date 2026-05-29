import { describe, it, expect } from "vitest";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cn } from "@/lib/utils";

// ─── Utility: cn() ───────────────────────────────────────────────────────────

describe("cn() utility", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("resolves Tailwind conflicts — last wins", () => {
    expect(cn("px-4", "px-8")).toBe("px-8");
  });

  it("filters falsy values", () => {
    expect(cn("px-4", false, undefined, null, "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    const active = true;
    expect(cn("base", active && "active")).toBe("base active");
    expect(cn("base", !active && "inactive")).toBe("base");
  });
});

// ─── AI Response Shape Validation ────────────────────────────────────────────

interface ContractClause {
  title: string;
  text: string;
  risk: "safe" | "caution" | "danger";
  explanation: string;
  suggestedAlternative: string | null;
}

interface ContractAnalysis {
  documentType: string;
  summary: string;
  clauses: ContractClause[];
}

function isValidContractAnalysis(data: unknown): data is ContractAnalysis {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (typeof d.documentType !== "string") return false;
  if (typeof d.summary !== "string") return false;
  if (!Array.isArray(d.clauses)) return false;
  return d.clauses.every(
    (c: unknown) =>
      c &&
      typeof c === "object" &&
      typeof (c as ContractClause).title === "string" &&
      typeof (c as ContractClause).text === "string" &&
      ["safe", "caution", "danger"].includes((c as ContractClause).risk) &&
      typeof (c as ContractClause).explanation === "string"
  );
}

describe("Contract analysis response validation", () => {
  it("accepts a well-formed analysis", () => {
    const valid: ContractAnalysis = {
      documentType: "Employment Contract",
      summary: "A standard employment agreement.",
      clauses: [
        {
          title: "Non-Compete",
          text: "Employee shall not work for competitors for 2 years.",
          risk: "danger",
          explanation: "Overly broad restriction on future employment.",
          suggestedAlternative: "Reduce scope to 6 months within direct competitors.",
        },
      ],
    };
    expect(isValidContractAnalysis(valid)).toBe(true);
  });

  it("rejects missing documentType", () => {
    expect(isValidContractAnalysis({ summary: "x", clauses: [] })).toBe(false);
  });

  it("rejects invalid risk value", () => {
    const bad = {
      documentType: "NDA",
      summary: "Test",
      clauses: [{ title: "X", text: "Y", risk: "unknown", explanation: "Z", suggestedAlternative: null }],
    };
    expect(isValidContractAnalysis(bad)).toBe(false);
  });
});

// ─── CV Analysis Response Validation ─────────────────────────────────────────

interface CVAnalysis {
  score: number;
  salary_min: number;
  salary_max: number;
  skills: string[];
  missing_skills: string[];
  experience_years: number;
  experience_level: string;
  summary: string;
  improvements: string[];
}

function isValidCVAnalysis(data: unknown): data is CVAnalysis {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.score === "number" &&
    d.score >= 0 && d.score <= 100 &&
    typeof d.salary_min === "number" &&
    typeof d.salary_max === "number" &&
    d.salary_min <= d.salary_max &&
    Array.isArray(d.skills) &&
    Array.isArray(d.missing_skills) &&
    typeof d.experience_years === "number" &&
    typeof d.experience_level === "string" &&
    ["entry", "junior", "mid", "senior", "executive"].includes(d.experience_level as string) &&
    typeof d.summary === "string" &&
    Array.isArray(d.improvements)
  );
}

describe("CV analysis response validation", () => {
  it("accepts a well-formed CV analysis", () => {
    const valid: CVAnalysis = {
      score: 78,
      salary_min: 45000,
      salary_max: 65000,
      skills: ["React", "TypeScript"],
      missing_skills: ["Docker"],
      experience_years: 5,
      experience_level: "mid",
      summary: "Experienced frontend developer.",
      improvements: ["Add metrics to achievements", "Include portfolio link"],
    };
    expect(isValidCVAnalysis(valid)).toBe(true);
  });

  it("rejects score out of range", () => {
    const bad = { score: 150, salary_min: 0, salary_max: 1, skills: [], missing_skills: [], experience_years: 1, experience_level: "mid", summary: "", improvements: [] };
    expect(isValidCVAnalysis(bad)).toBe(false);
  });

  it("rejects when salary_min > salary_max", () => {
    const bad = { score: 50, salary_min: 80000, salary_max: 40000, skills: [], missing_skills: [], experience_years: 1, experience_level: "senior", summary: "", improvements: [] };
    expect(isValidCVAnalysis(bad)).toBe(false);
  });

  it("rejects unknown experience level", () => {
    const bad = { score: 70, salary_min: 40000, salary_max: 60000, skills: [], missing_skills: [], experience_years: 3, experience_level: "god-tier", summary: "", improvements: [] };
    expect(isValidCVAnalysis(bad)).toBe(false);
  });
});

// ─── Subscription Tier Logic ──────────────────────────────────────────────────

const TIER_LIMITS: Record<string, number | null> = {
  "prod_U3SeCMHKuHMYC0": 10,
  "prod_U1Lnud0U3FVc6k": null,
  "prod_U3TACwcpT0V5NA": null,
};
const FREE_LIMIT = 1;

function getScanLimit(isPro: boolean, productId: string | null): number | null {
  if (isPro) return null;
  if (productId && productId in TIER_LIMITS) return TIER_LIMITS[productId];
  return FREE_LIMIT;
}

describe("Scan quota logic", () => {
  it("pro users have unlimited scans", () => {
    expect(getScanLimit(true, null)).toBeNull();
  });

  it("free users are limited to 1 scan", () => {
    expect(getScanLimit(false, null)).toBe(1);
  });

  it("basic plan gets 10 scans", () => {
    expect(getScanLimit(false, "prod_U3SeCMHKuHMYC0")).toBe(10);
  });

  it("pro plan (by product ID) is unlimited", () => {
    expect(getScanLimit(false, "prod_U1Lnud0U3FVc6k")).toBeNull();
  });

  it("enterprise plan is unlimited", () => {
    expect(getScanLimit(false, "prod_U3TACwcpT0V5NA")).toBeNull();
  });

  it("blocks scan when limit reached", () => {
    const limit = getScanLimit(false, null);
    const scansUsed = 1;
    expect(limit !== null && scansUsed >= limit).toBe(true);
  });
});

// ─── File Type Validation ─────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/rtf",
];
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".rtf"];

function isAllowedFileType(mimeType: string): boolean {
  const lower = mimeType.toLowerCase();
  return (
    ALLOWED_MIME_TYPES.some((t) => lower.includes(t)) ||
    ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))
  );
}

describe("File type validation", () => {
  it("accepts PDF", () => expect(isAllowedFileType("application/pdf")).toBe(true));
  it("accepts DOCX", () => expect(isAllowedFileType("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(true));
  it("accepts plain text", () => expect(isAllowedFileType("text/plain")).toBe(true));
  it("accepts markdown", () => expect(isAllowedFileType("text/markdown")).toBe(true));
  it("rejects image/png", () => expect(isAllowedFileType("image/png")).toBe(false));
  it("rejects video/mp4", () => expect(isAllowedFileType("video/mp4")).toBe(false));
  it("rejects application/zip", () => expect(isAllowedFileType("application/zip")).toBe(false));
});
