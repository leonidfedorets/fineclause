import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BriefcaseBusiness,
  MapPin,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  Building2,
  Laptop,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export interface JobMatch {
  job_id: string;
  job_title: string;
  company: string | null;
  location: string | null;
  remote_option: string | null;
  salary_min: number | null;
  salary_max: number | null;
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  salary_fit: string;
}

interface JobMatchesSectionProps {
  matches: JobMatch[];
}

const JobMatchesSection = ({ matches }: JobMatchesSectionProps) => {
  const { t } = useTranslation();

  if (!matches || matches.length === 0) return null;

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-[hsl(var(--risk-safe))]";
    if (score >= 45) return "text-[hsl(var(--risk-caution))]";
    return "text-accent";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-[hsl(var(--risk-safe))]/10 border-[hsl(var(--risk-safe))]/30";
    if (score >= 45) return "bg-[hsl(var(--risk-caution))]/10 border-[hsl(var(--risk-caution))]/30";
    return "bg-accent/10 border-accent/30";
  };

  const getRemoteIcon = (option: string | null) => {
    switch (option) {
      case "remote": return <Laptop className="w-3.5 h-3.5" />;
      case "hybrid": return <Wifi className="w-3.5 h-3.5" />;
      default: return <Building2 className="w-3.5 h-3.5" />;
    }
  };

  const getRemoteLabel = (option: string | null) => {
    switch (option) {
      case "remote": return t("matches.remote");
      case "hybrid": return t("matches.hybrid");
      default: return t("matches.onSite");
    }
  };

  const getSalaryFitLabel = (fit: string) => {
    switch (fit) {
      case "within_range": return t("matches.salaryMatch");
      case "below_range": return t("matches.salaryBelow");
      case "slightly_above": return t("matches.salarySlightlyAbove");
      case "above_range": return t("matches.salaryAbove");
      default: return t("matches.salaryUnknown");
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-6">
        <BriefcaseBusiness className="w-5 h-5 text-accent" />
        <h3 className="text-xl font-bold font-display">{t("matches.title")}</h3>
        <Badge variant="outline" className="text-xs font-mono ml-2">
          {matches.length} {matches.length === 1 ? t("matches.match") : t("matches.matchesCount")}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{t("matches.subtitle")}</p>

      <div className="space-y-4">
        {matches.map((match, i) => (
          <motion.div
            key={match.job_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
          >
            <Card className="p-5 hover:shadow-[var(--shadow-card-hover)] transition-shadow">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Score badge */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-lg border flex flex-col items-center justify-center ${getScoreBg(match.score)}`}>
                  <span className={`text-xl font-black font-display ${getScoreColor(match.score)}`}>{match.score}</span>
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">{t("matches.fit")}</span>
                </div>

                {/* Job details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold font-display mb-1 truncate">{match.job_title}</h4>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                    {match.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {match.company}
                      </span>
                    )}
                    {match.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {match.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      {getRemoteIcon(match.remote_option)} {getRemoteLabel(match.remote_option)}
                    </span>
                    {(match.salary_min || match.salary_max) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        €{((match.salary_min || 0) / 1000).toFixed(0)}k
                        {match.salary_max ? ` – €${(match.salary_max / 1000).toFixed(0)}k` : "+"}
                      </span>
                    )}
                  </div>

                  {/* Match progress */}
                  <Progress value={match.score} className="h-1.5 mb-3" />

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {match.matched_skills.slice(0, 6).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-[10px] gap-1 px-1.5 py-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[hsl(var(--risk-safe))]" />
                        {skill}
                      </Badge>
                    ))}
                    {match.missing_skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-[10px] gap-1 px-1.5 py-0.5 border-[hsl(var(--risk-caution))]/50 text-[hsl(var(--risk-caution))]">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Salary fit tag */}
                  {match.salary_fit && match.salary_fit !== "unknown" && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {t("matches.salary")}: {getSalaryFitLabel(match.salary_fit)}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default JobMatchesSection;
