import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  BriefcaseBusiness, MapPin, DollarSign, CheckCircle2, AlertTriangle,
  Wifi, Building2, Laptop, ChevronRight, Star, Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

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
  description?: string | null;
}

export interface AllJob {
  id: string;
  title: string;
  employer_name: string | null;
  location: string | null;
  remote_option: string | null;
  salary_min: number | null;
  salary_max: number | null;
  description: string | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  experience_min: number | null;
}

interface JobMatchesSectionProps {
  matches: JobMatch[];
  allJobs?: AllJob[];
}

// ── Job Detail Dialog ─────────────────────────────────────────────────────────
const JobDetailDialog = ({
  job,
  matchScore,
  matchedSkills,
  missingSkills,
  open,
  onClose,
}: {
  job: AllJob | JobMatch;
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  open: boolean;
  onClose: () => void;
}) => {
  const isAllJob = "required_skills" in job;
  const title = isAllJob ? (job as AllJob).title : (job as JobMatch).job_title;
  const company = job.company ?? (job as AllJob).employer_name ?? null;
  const description = "description" in job ? job.description : null;
  const requiredSkills = isAllJob ? (job as AllJob).required_skills : null;
  const preferredSkills = isAllJob ? (job as AllJob).preferred_skills : null;
  const expMin = isAllJob ? (job as AllJob).experience_min : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-display font-bold text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                <span className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                  {company && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{company}</span>}
                  {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
                  {job.remote_option && (
                    <span className="flex items-center gap-1">
                      {job.remote_option === "remote" ? <Laptop className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                      {job.remote_option === "remote" ? "Remote" : job.remote_option === "hybrid" ? "Hybrid" : "On-site"}
                    </span>
                  )}
                  {(job.salary_min || job.salary_max) && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      €{((job.salary_min || 0) / 1000).toFixed(0)}k
                      {job.salary_max ? ` – €${(job.salary_max / 1000).toFixed(0)}k` : "+"}
                    </span>
                  )}
                  {expMin && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />{expMin}+ years exp.
                    </span>
                  )}
                </span>
              </DialogDescription>
            </div>
            {matchScore !== undefined && (
              <div className={`flex-shrink-0 w-16 h-16 rounded-xl border flex flex-col items-center justify-center ${
                matchScore >= 70 ? "bg-emerald-500/10 border-emerald-500/30" :
                matchScore >= 45 ? "bg-amber-500/10 border-amber-500/30" :
                "bg-accent/10 border-accent/30"
              }`}>
                <span className={`text-xl font-black font-display ${
                  matchScore >= 70 ? "text-emerald-600" : matchScore >= 45 ? "text-amber-600" : "text-accent"
                }`}>{matchScore}</span>
                <span className="text-[10px] uppercase font-mono text-muted-foreground">fit</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Match skills (only shown for matched jobs) */}
          {(matchedSkills?.length || missingSkills?.length) ? (
            <div className="p-4 rounded-xl bg-muted/40 border border-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Your skill match</p>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills?.map(s => (
                  <Badge key={s} variant="secondary" className="text-xs gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />{s}
                  </Badge>
                ))}
                {missingSkills?.map(s => (
                  <Badge key={s} variant="outline" className="text-xs gap-1 border-amber-500/40 text-amber-600">
                    <AlertTriangle className="w-3 h-3" />{s}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {/* Required skills */}
          {requiredSkills?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {requiredSkills.map(s => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          ) : null}

          {/* Preferred skills */}
          {preferredSkills?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Preferred Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {preferredSkills.map(s => (
                  <Badge key={s} variant="outline" className="text-xs text-accent border-accent/30">{s}</Badge>
                ))}
              </div>
            </div>
          ) : null}

          {/* Job description */}
          {description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Job Description</p>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {description}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Remote badge helper ───────────────────────────────────────────────────────
const RemoteIcon = ({ option }: { option: string | null }) => {
  if (option === "remote") return <Laptop className="w-3 h-3" />;
  if (option === "hybrid") return <Wifi className="w-3 h-3" />;
  return <Building2 className="w-3 h-3" />;
};
const remoteLabel = (option: string | null) => {
  if (option === "remote") return "Remote";
  if (option === "hybrid") return "Hybrid";
  return "On-site";
};

// ── Main component ────────────────────────────────────────────────────────────
const JobMatchesSection = ({ matches, allJobs = [] }: JobMatchesSectionProps) => {
  const { t } = useTranslation();
  const [selectedMatch, setSelectedMatch] = useState<JobMatch | null>(null);
  const [selectedJob, setSelectedJob] = useState<AllJob | null>(null);

  const matchedIds = new Set(matches.map(m => m.job_id));
  const unmatchedJobs = allJobs.filter(j => !matchedIds.has(j.id));
  const hasContent = matches.length > 0 || allJobs.length > 0;

  if (!hasContent) return null;

  const scoreColor = (s: number) => s >= 70 ? "text-emerald-600" : s >= 45 ? "text-amber-600" : "text-accent";
  const scoreBg = (s: number) => s >= 70 ? "bg-emerald-500/10 border-emerald-500/30" : s >= 45 ? "bg-amber-500/10 border-amber-500/30" : "bg-accent/10 border-accent/30";

  return (
    <div className="mt-8 space-y-8">

      {/* ── Matched Jobs ── */}
      {matches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-accent" />
            <h3 className="text-xl font-bold font-display">{t("matches.title")}</h3>
            <Badge variant="outline" className="text-xs font-mono ml-1">
              {matches.length} {matches.length === 1 ? t("matches.match") : t("matches.matchesCount")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("matches.subtitle")}</p>

          <div className="space-y-3">
            {matches.map((match, i) => (
              <motion.div
                key={match.job_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
              >
                <Card className="p-4 hover:shadow-[var(--shadow-card-hover)] transition-all duration-200">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Score */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-lg border flex flex-col items-center justify-center ${scoreBg(match.score)}`}>
                      <span className={`text-lg font-black font-display ${scoreColor(match.score)}`}>{match.score}</span>
                      <span className="text-[10px] uppercase font-mono text-muted-foreground">fit</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-base font-bold font-display truncate">{match.job_title}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-shrink-0 h-7 text-xs text-accent hover:text-accent gap-1"
                          onClick={() => setSelectedMatch(match)}
                        >
                          Details <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                        {match.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{match.company}</span>}
                        {match.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{match.location}</span>}
                        <span className="flex items-center gap-1"><RemoteIcon option={match.remote_option} />{remoteLabel(match.remote_option)}</span>
                        {(match.salary_min || match.salary_max) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            €{((match.salary_min || 0) / 1000).toFixed(0)}k{match.salary_max ? ` – €${(match.salary_max / 1000).toFixed(0)}k` : "+"}
                          </span>
                        )}
                      </div>
                      <Progress value={match.score} className="h-1.5 mb-2" />
                      <div className="flex flex-wrap gap-1.5">
                        {match.matched_skills.slice(0, 5).map(s => (
                          <Badge key={s} variant="secondary" className="text-[10px] gap-1 px-1.5 py-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />{s}
                          </Badge>
                        ))}
                        {match.missing_skills.slice(0, 3).map(s => (
                          <Badge key={s} variant="outline" className="text-[10px] gap-1 px-1.5 py-0.5 border-amber-500/40 text-amber-600">
                            <AlertTriangle className="w-2.5 h-2.5" />{s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── All Open Vacancies ── */}
      {allJobs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BriefcaseBusiness className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-bold font-display">All Open Vacancies</h3>
            <Badge variant="outline" className="text-xs font-mono ml-1">{allJobs.length} open</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Browse all currently available positions.</p>

          <div className="space-y-3">
            {allJobs.map((job, i) => {
              const isMatched = matchedIds.has(job.id);
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                >
                  <Card className={`p-4 hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 ${isMatched ? "border-accent/20 bg-accent/2" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold font-display truncate">{job.title}</h4>
                          {isMatched && <Badge className="text-[10px] bg-accent/10 text-accent border-accent/20 border">Matched</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                          {job.employer_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{job.employer_name}</span>}
                          {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                          <span className="flex items-center gap-1"><RemoteIcon option={job.remote_option} />{remoteLabel(job.remote_option)}</span>
                          {(job.salary_min || job.salary_max) && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              €{((job.salary_min || 0) / 1000).toFixed(0)}k{job.salary_max ? ` – €${(job.salary_max / 1000).toFixed(0)}k` : "+"}
                            </span>
                          )}
                          {job.experience_min && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.experience_min}+ yrs</span>
                          )}
                        </div>
                        {job.required_skills?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {job.required_skills.slice(0, 5).map(s => (
                              <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0.5">{s}</Badge>
                            ))}
                            {(job.required_skills.length > 5) && (
                              <span className="text-[10px] text-muted-foreground self-center">+{job.required_skills.length - 5} more</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 h-8 text-xs gap-1"
                        onClick={() => setSelectedJob(job)}
                      >
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Match detail dialog ── */}
      {selectedMatch && (
        <JobDetailDialog
          job={{
            id: selectedMatch.job_id,
            title: selectedMatch.job_title,
            employer_name: selectedMatch.company,
            location: selectedMatch.location,
            remote_option: selectedMatch.remote_option,
            salary_min: selectedMatch.salary_min,
            salary_max: selectedMatch.salary_max,
            description: selectedMatch.description ?? null,
            required_skills: null,
            preferred_skills: null,
            experience_min: null,
          }}
          matchScore={selectedMatch.score}
          matchedSkills={selectedMatch.matched_skills}
          missingSkills={selectedMatch.missing_skills}
          open={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* ── All-jobs detail dialog ── */}
      {selectedJob && (
        <JobDetailDialog
          job={selectedJob}
          open={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
};

export default JobMatchesSection;
