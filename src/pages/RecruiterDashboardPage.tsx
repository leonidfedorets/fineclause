import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Briefcase, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  MapPin, DollarSign, Loader2, Settings, BarChart3, Zap, Eye, Send, Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import AddJobDialog from "@/components/AddJobDialog";

interface MatchedCandidate {
  id: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  salary_fit: string | null;
  cv_id: string;
  candidate_id: string;
  cv: {
    file_name: string;
    skills: string[];
    experience_years: number | null;
    education_level: string | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    ai_score: number | null;
  } | null;
  candidate: {
    name: string | null;
    email: string;
    location: string | null;
  } | null;
}

interface JobWithMatches {
  id: string;
  title: string;
  location: string | null;
  remote_option: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  required_skills: string[];
  created_at: string;
  matches: MatchedCandidate[];
}

const RecruiterDashboardPage = () => {
  const { user, currentTierKey } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobWithMatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [hubspotKey, setHubspotKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [agencyProfile, setAgencyProfile] = useState<any>(null);
  const [pushingLead, setPushingLead] = useState<string | null>(null);
  const [refetchCount, setRefetchCount] = useState(0);
  const isAgency = currentTierKey === "agency";
  const hasAccess = ["pro", "enterprise", "agency"].includes(currentTierKey);

  useEffect(() => {
    if (!user) return;
    if (!hasAccess) return;

    const fetchData = async () => {
      setLoading(true);
      // Fetch agency profile
      const { data: agProfile } = await supabase
        .from("agency_profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (agProfile) {
        setAgencyProfile(agProfile);
        setHubspotKey((agProfile as any).hubspot_api_key || "");
      }

      // Fetch employer's jobs
      const { data: jobData } = await supabase
        .from("job_listings")
        .select("*")
        .eq("employer_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!jobData || jobData.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      const jobIds = jobData.map((j) => j.id);
      const { data: matchData } = await supabase
        .from("cv_job_matches")
        .select("*")
        .in("job_id", jobIds)
        .order("match_score", { ascending: false });

      const cvIds = [...new Set((matchData || []).map((m) => m.cv_id))];
      let cvMap: Record<string, any> = {};
      let candidateMap: Record<string, any> = {};

      if (cvIds.length > 0) {
        const { data: cvData } = await supabase
          .from("cv_uploads")
          .select("id, file_name, skills, experience_years, education_level, salary_min, salary_max, salary_currency, ai_score, candidate_id")
          .in("id", cvIds);
        if (cvData) {
          for (const cv of cvData) cvMap[cv.id] = cv;
          const candidateIds = [...new Set(cvData.map((c) => c.candidate_id))];
          const { data: candData } = await supabase
            .from("candidates")
            .select("id, name, email, location")
            .in("id", candidateIds);
          if (candData) for (const c of candData) candidateMap[c.id] = c;
        }
      }

      const enrichedJobs: JobWithMatches[] = jobData.map((job) => ({
        ...job,
        required_skills: (job.required_skills as string[]) || [],
        matches: (matchData || [])
          .filter((m) => m.job_id === job.id)
          .map((m) => {
            const cv = cvMap[m.cv_id];
            return {
              id: m.id,
              match_score: m.match_score,
              matched_skills: (m.matched_skills as string[]) || [],
              missing_skills: (m.missing_skills as string[]) || [],
              salary_fit: m.salary_fit,
              cv_id: m.cv_id,
              candidate_id: cv?.candidate_id || "",
              cv: cv ? {
                file_name: cv.file_name, skills: cv.skills || [],
                experience_years: cv.experience_years, education_level: cv.education_level,
                salary_min: cv.salary_min, salary_max: cv.salary_max,
                salary_currency: cv.salary_currency, ai_score: cv.ai_score,
              } : null,
              candidate: cv ? candidateMap[cv.candidate_id] || null : null,
            };
          }),
      }));

      setJobs(enrichedJobs);
      setLoading(false);
    };
    fetchData();
  }, [user, hasAccess, refetchCount]);

  const saveHubspotKey = async () => {
    if (!user) return;
    setSavingKey(true);
    try {
      if (agencyProfile) {
        await supabase.from("agency_profiles" as any).update({ hubspot_api_key: hubspotKey.trim() || null } as any).eq("user_id", user.id);
      } else {
        await supabase.from("agency_profiles" as any).insert({
          user_id: user.id, agency_name: "My Agency",
          contact_email: user.email || "", hubspot_api_key: hubspotKey.trim() || null,
        } as any);
      }
      toast({ title: "Saved", description: "HubSpot API key updated." });
    } catch {
      toast({ title: "Error", description: "Could not save API key.", variant: "destructive" });
    } finally {
      setSavingKey(false);
    }
  };

  const pushToHubspot = async (match: MatchedCandidate) => {
    if (!user) return;
    setPushingLead(match.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-hubspot-lead", {
        body: {
          candidate_id: match.candidate_id,
          cv_id: match.cv_id,
          employer_id: user.id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Lead pushed!", description: `Contact ${data.contact_id} created in HubSpot.` });
    } catch (err: any) {
      toast({ title: "HubSpot error", description: err.message || "Could not push lead.", variant: "destructive" });
    } finally {
      setPushingLead(null);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-500 dark:text-red-400";
  };

  const totalMatches = jobs.reduce((s, j) => s + j.matches.length, 0);
  const avgScore = totalMatches > 0
    ? Math.round(jobs.reduce((s, j) => s + j.matches.reduce((ss, m) => ss + m.match_score, 0), 0) / totalMatches)
    : 0;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="pt-24 pb-16 container mx-auto px-4 max-w-2xl text-center">
          <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold font-display mb-3">Agency Dashboard</h1>
          <p className="text-muted-foreground mb-6">
            The recruiter dashboard requires a Pro, Enterprise, or Agency subscription.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/agency/signup")}>
              Register as Agency — €25/mo
            </Button>
            <Button variant="outline" onClick={() => navigate("/#pricing")}>
              View Plans
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-24 pb-16 container mx-auto px-4 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {agencyProfile ? `${(agencyProfile as any).agency_name} — Dashboard` : t("recruiterDashboard.title")}
          </h1>
          <p className="text-muted-foreground">{t("recruiterDashboard.subtitle")}</p>
        </motion.div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings"><Briefcase className="w-4 h-4 mr-1.5" />Listings & Candidates</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-1.5" />Analytics</TabsTrigger>
            {isAgency && <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1.5" />CRM Settings</TabsTrigger>}
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value="listings">
            <div className="flex justify-end mb-4">
              {user && <AddJobDialog userId={user.id} userEmail={user.email || ""} onJobAdded={() => setRefetchCount((c) => c + 1)} />}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : jobs.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">{t("recruiterDashboard.noJobs")}</p>
                  <p className="text-muted-foreground text-sm mb-4">{t("recruiterDashboard.noJobsDesc")}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10"><Briefcase className="w-5 h-5 text-primary" /></div>
                      <div>
                        <p className="text-2xl font-bold">{jobs.length}</p>
                        <p className="text-sm text-muted-foreground">{t("recruiterDashboard.activeJobs")}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-accent/10"><Users className="w-5 h-5 text-accent" /></div>
                      <div>
                        <p className="text-2xl font-bold">{totalMatches}</p>
                        <p className="text-sm text-muted-foreground">{t("recruiterDashboard.totalCandidates")}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-secondary"><CheckCircle2 className="w-5 h-5 text-foreground" /></div>
                      <div>
                        <p className="text-2xl font-bold">{avgScore}%</p>
                        <p className="text-sm text-muted-foreground">{t("recruiterDashboard.avgScore")}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Job Listings */}
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <Card key={job.id} className="overflow-hidden">
                      <button className="w-full text-left" onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}>
                        <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {job.title}
                              <Badge variant="secondary" className="text-xs">{job.matches.length} {t("recruiterDashboard.candidates")}</Badge>
                            </CardTitle>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
                              {job.salary_min && job.salary_max && (
                                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{job.salary_currency || "EUR"} {job.salary_min.toLocaleString()}–{job.salary_max.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          {expandedJob === job.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                        </CardHeader>
                      </button>
                      <AnimatePresence>
                        {expandedJob === job.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <CardContent className="pt-0">
                              {job.matches.length === 0 ? (
                                <p className="text-muted-foreground text-sm py-4">{t("recruiterDashboard.noCandidates")}</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>{t("recruiterDashboard.candidate")}</TableHead>
                                        <TableHead>{t("recruiterDashboard.score")}</TableHead>
                                        <TableHead>{t("recruiterDashboard.matchedSkills")}</TableHead>
                                        <TableHead>{t("recruiterDashboard.experience")}</TableHead>
                                        <TableHead>{t("recruiterDashboard.salaryFit")}</TableHead>
                                        {isAgency && hubspotKey && <TableHead>CRM</TableHead>}
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {job.matches.map((match) => (
                                        <TableRow key={match.id}>
                                          <TableCell>
                                            <div>
                                              <p className="font-medium">{match.candidate?.name || t("recruiterDashboard.anonymous")}</p>
                                              {match.candidate?.location && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{match.candidate.location}</p>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2 min-w-[100px]">
                                              <span className={`font-bold text-sm ${scoreColor(match.match_score)}`}>{match.match_score}%</span>
                                              <Progress value={match.match_score} className="h-2 flex-1" />
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                              {match.matched_skills.slice(0, 4).map((s) => (
                                                <Badge key={s} className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0">
                                                  <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />{s}
                                                </Badge>
                                              ))}
                                              {match.matched_skills.length > 4 && <Badge variant="outline" className="text-[10px]">+{match.matched_skills.length - 4}</Badge>}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <span className="text-sm">{match.cv?.experience_years != null ? `${match.cv.experience_years} ${t("recruiterDashboard.years")}` : "—"}</span>
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={match.salary_fit === "match" ? "default" : "outline"} className="text-xs">
                                              {match.salary_fit === "match" ? "✓ Match" : match.salary_fit === "below" ? "Below" : match.salary_fit === "above" ? "Above" : "N/A"}
                                            </Badge>
                                          </TableCell>
                                          {isAgency && hubspotKey && (
                                            <TableCell>
                                              <Button size="sm" variant="outline" disabled={pushingLead === match.id} onClick={() => pushToHubspot(match)}>
                                                {pushingLead === match.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                              </Button>
                                            </TableCell>
                                          )}
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card><CardContent className="pt-6 text-center">
                <Eye className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-3xl font-bold font-display">{jobs.length}</p>
                <p className="text-sm text-muted-foreground">Active Listings</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-3xl font-bold font-display">{totalMatches}</p>
                <p className="text-sm text-muted-foreground">Total Candidates</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <BarChart3 className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-3xl font-bold font-display">{avgScore}%</p>
                <p className="text-sm text-muted-foreground">Avg Match Score</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <Zap className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-3xl font-bold font-display">{jobs.reduce((s, j) => s + j.matches.filter(m => m.match_score >= 75).length, 0)}</p>
                <p className="text-sm text-muted-foreground">Strong Matches (≥75%)</p>
              </CardContent></Card>
            </div>

            {/* Per-job breakdown */}
            <Card>
              <CardHeader><CardTitle>Listings Breakdown</CardTitle></CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No listings yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Candidates</TableHead>
                        <TableHead>Avg Score</TableHead>
                        <TableHead>Strong Matches</TableHead>
                        <TableHead>Posted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => {
                        const jobAvg = job.matches.length > 0
                          ? Math.round(job.matches.reduce((s, m) => s + m.match_score, 0) / job.matches.length)
                          : 0;
                        return (
                          <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.title}</TableCell>
                            <TableCell>{job.matches.length}</TableCell>
                            <TableCell><span className={scoreColor(jobAvg)}>{jobAvg}%</span></TableCell>
                            <TableCell>{job.matches.filter(m => m.match_score >= 75).length}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{new Date(job.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CRM Settings Tab (Agency only) */}
          {isAgency && (
            <TabsContent value="settings">
              <Card className="max-w-lg">
                <CardHeader>
                  <CardTitle>HubSpot CRM Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter your HubSpot Private App token to push matched candidates as leads automatically.
                  </p>
                  <div>
                    <label className="text-sm font-medium mb-2 block">HubSpot API Key</label>
                    <Input
                      type="password"
                      placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={hubspotKey}
                      onChange={(e) => setHubspotKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Create a Private App in HubSpot → Settings → Integrations → Private Apps.
                      Required scopes: crm.objects.contacts.write, crm.objects.contacts.read.
                    </p>
                  </div>
                  <Button onClick={saveHubspotKey} disabled={savingKey}>
                    {savingKey ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save API Key</>}
                  </Button>
                  {hubspotKey && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      HubSpot connected — use the "Push to CRM" button on matched candidates.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default RecruiterDashboardPage;
