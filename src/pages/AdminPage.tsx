import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ShieldOff, RotateCcw, RefreshCw, Plus, Trash2, Eye, EyeOff, Upload, FileText, Loader2, Building2, Briefcase, Users, MapPin, Euro, Download } from "lucide-react";
import { TIERS, getTierByProductId } from "@/lib/subscriptionTiers";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  is_pro: boolean;
  is_blocked: boolean;
  free_scans_used: number;
  actual_scan_count: number;
  created_at: string;
  updated_at: string;
  subscription_product_id: string | null;
  is_agency: boolean;
}

interface AdminTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  file_path: string;
  file_name: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
}

interface CvUpload {
  id: string;
  candidate_id: string;
  file_name: string;
  file_path: string;
  ai_score: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  skills: string[] | null;
  experience_years: number | null;
  education_level: string | null;
  summary: string | null;
  raw_analysis: any;
  status: string;
  created_at: string;
  candidate_email?: string;
  candidate_name?: string;
  candidate_consent_recruiter?: boolean;
  match_count?: number;
}

interface JobListing {
  id: string;
  title: string;
  description: string;
  employer_email: string;
  employer_name: string | null;
  employer_id: string | null;
  location: string | null;
  remote_option: string | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  experience_min: number | null;
  is_active: boolean;
  created_at: string;
  match_count?: number;
}

const TEMPLATE_CATEGORIES = [
  "Confidentiality",
  "Service Agreement",
  "Employment",
  "Licensing & IP",
  "Data & Privacy",
  "Commercial",
  "Partnership",
  "Financial",
  "Real Estate",
  "Personal Life",
  "Common Life",
];

const AdminPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [cvs, setCvs] = useState<CvUpload[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "Service Agreement",
    tags: "",
    file: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<AdminTemplate | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedCv, setSelectedCv] = useState<CvUpload | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [cvMatches, setCvMatches] = useState<any[]>([]);
  const [jobMatches, setJobMatches] = useState<any[]>([]);
  const [cvPreviewUrl, setCvPreviewUrl] = useState<string | null>(null);
  const [cvDetailTab, setCvDetailTab] = useState<"report" | "preview">("report");

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", { method: "GET" });
      if (error) throw error;
      setUsers(data.users || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-templates", { method: "GET" });
      if (error) throw error;
      setTemplates(data.templates || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load templates");
    }
  }, []);

  const fetchCvs = useCallback(async () => {
    try {
      const { data: cvData, error: cvError } = await supabase
        .from("cv_uploads")
        .select("*")
        .order("created_at", { ascending: false });
      if (cvError) throw cvError;

      // Fetch candidate info for each CV
      const candidateIds = [...new Set((cvData || []).map(c => c.candidate_id))];
      const { data: candidates } = await supabase
        .from("candidates")
        .select("id, email, name, consent_recruiter_sharing")
        .in("id", candidateIds);

      const candidateMap = new Map((candidates || []).map(c => [c.id, c]));

      // Fetch match counts
      const cvIds = (cvData || []).map(c => c.id);
      const { data: matches } = await supabase
        .from("cv_job_matches")
        .select("cv_id")
        .in("cv_id", cvIds);

      const matchCounts = new Map<string, number>();
      (matches || []).forEach(m => {
        matchCounts.set(m.cv_id, (matchCounts.get(m.cv_id) || 0) + 1);
      });

      setCvs((cvData || []).map(cv => {
        const candidate = candidateMap.get(cv.candidate_id);
        return {
          ...cv,
          candidate_email: candidate?.email,
          candidate_name: candidate?.name,
          candidate_consent_recruiter: candidate?.consent_recruiter_sharing,
          match_count: matchCounts.get(cv.id) || 0,
        };
      }));
    } catch (e: any) {
      toast.error(e.message || "Failed to load CVs");
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const { data: jobData, error: jobError } = await supabase
        .from("job_listings")
        .select("*")
        .order("created_at", { ascending: false });
      if (jobError) throw jobError;

      // Fetch match counts
      const jobIds = (jobData || []).map(j => j.id);
      const { data: matches } = await supabase
        .from("cv_job_matches")
        .select("job_id")
        .in("job_id", jobIds);

      const matchCounts = new Map<string, number>();
      (matches || []).forEach(m => {
        matchCounts.set(m.job_id, (matchCounts.get(m.job_id) || 0) + 1);
      });

      setJobs((jobData || []).map(j => ({
        ...j,
        match_count: matchCounts.get(j.id) || 0,
      })));
    } catch (e: any) {
      toast.error(e.message || "Failed to load job listings");
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchTemplates();
      fetchCvs();
      fetchJobs();
    } else {
      setLoading(false);
    }
  }, [isAdmin, fetchUsers, fetchTemplates, fetchCvs, fetchJobs]);

  const performAction = async (user_id: string, action: string, extra?: Record<string, any>) => {
    setActionLoading(`${user_id}-${action}`);
    try {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: { user_id, action, ...extra },
      });
      if (error) throw error;
      toast.success("Action completed");
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUploadTemplate = async () => {
    if (!uploadForm.name || !uploadForm.category || !uploadForm.file) {
      toast.error("Name, category, and file are required");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(uploadForm.file!);
      });

      const { error } = await supabase.functions.invoke("admin-templates", {
        body: {
          action: "create",
          name: uploadForm.name,
          description: uploadForm.description,
          category: uploadForm.category,
          tags: uploadForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
          file_name: uploadForm.file!.name,
          file_content_base64: base64,
        },
      });
      if (error) throw error;
      toast.success("Template uploaded successfully");
      setShowUploadDialog(false);
      setUploadForm({ name: "", description: "", category: "Service Agreement", tags: "", file: null });
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const toggleTemplateActive = async (t: AdminTemplate) => {
    try {
      const { error } = await supabase.functions.invoke("admin-templates", {
        body: { action: "toggle_active", template_id: t.id, is_active: !t.is_active },
      });
      if (error) throw error;
      toast.success(t.is_active ? "Template hidden" : "Template visible");
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const deleteTemplate = async (t: AdminTemplate) => {
    if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.functions.invoke("admin-templates", {
        body: { action: "delete", template_id: t.id, file_path: t.file_path },
      });
      if (error) throw error;
      toast.success("Template deleted");
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const handlePreviewTemplate = async (t: AdminTemplate) => {
    setPreviewTemplate(t);
    setPreviewContent(null);
    setPreviewLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("preview-template", {
        body: { file_path: t.file_path },
      });
      if (error) throw error;
      setPreviewContent(data?.content || "No content available.");
    } catch (e: any) {
      setPreviewContent("Unable to load preview. " + (e.message || ""));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadCv = async (cv: CvUpload) => {
    try {
      const { data, error } = await supabase.storage
        .from("cv-uploads")
        .createSignedUrl(cv.file_path, 60);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Failed to download CV");
    }
  };

  const handleViewCvDetail = async (cv: CvUpload) => {
    setSelectedCv(cv);
    setCvDetailTab("report");
    setCvPreviewUrl(null);
    try {
      const [matchResult, signedResult] = await Promise.all([
        supabase
          .from("cv_job_matches")
          .select("*, job_listings(id, title, employer_name, location)")
          .eq("cv_id", cv.id)
          .order("match_score", { ascending: false }),
        supabase.storage.from("cv-uploads").createSignedUrl(cv.file_path, 300),
      ]);
      setCvMatches(matchResult.data || []);
      if (signedResult.data?.signedUrl) {
        setCvPreviewUrl(signedResult.data.signedUrl);
      }
    } catch {
      setCvMatches([]);
    }
  };

  const handleViewJobDetail = async (job: JobListing) => {
    setSelectedJob(job);
    // Fetch matches for this job
    try {
      const { data } = await supabase
        .from("cv_job_matches")
        .select("*, cv_uploads(id, file_name, ai_score, candidate_id)")
        .eq("job_id", job.id)
        .order("match_score", { ascending: false });

      // Enrich with candidate emails
      if (data && data.length > 0) {
        const candidateIds = [...new Set(data.map((m: any) => m.cv_uploads?.candidate_id).filter(Boolean))];
        const { data: candidates } = await supabase
          .from("candidates")
          .select("id, email, name")
          .in("id", candidateIds);
        const candMap = new Map((candidates || []).map(c => [c.id, c]));

        setJobMatches(data.map((m: any) => ({
          ...m,
          candidate: candMap.get(m.cv_uploads?.candidate_id) || null,
        })));
      } else {
        setJobMatches([]);
      }
    } catch {
      setJobMatches([]);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-mono text-sm">Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const isBlocked = (u: UserProfile) => u.is_blocked;

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 75) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 md:px-8 max-w-[1400px] mx-auto pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {users.length} users · {templates.length} templates · {cvs.length} CVs · {jobs.length} jobs
            </p>
          </div>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-1" /> Templates
            </TabsTrigger>
            <TabsTrigger value="cvs">
              <Users className="w-4 h-4 mr-1" /> CVs
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="w-4 h-4 mr-1" /> Job Listings
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="flex justify-end mb-4">
              <Button variant="outline" size="sm" onClick={fetchUsers}>
                <RefreshCw className="w-4 h-4 mr-1" /> Refresh
              </Button>
            </div>
            <div className="border border-border rounded-sm overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Email</TableHead>
                     <TableHead>Name</TableHead>
                     <TableHead>Tier</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead className="text-center">Scans Used</TableHead>
                     <TableHead>Joined</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {users.map((u) => {
                     const currentTier = getTierByProductId(u.subscription_product_id);
                     return (
                     <TableRow key={u.id} className={isBlocked(u) ? "opacity-50" : ""}>
                       <TableCell className="font-mono text-xs">{u.email || "—"}</TableCell>
                       <TableCell className="text-sm">
                         {u.display_name || "—"}
                       </TableCell>
                       <TableCell>
                         <Select
                           value={currentTier.key}
                           onValueChange={(tierKey) => {
                             const tier = TIERS.find((t) => t.key === tierKey);
                             if (tier) {
                               performAction(u.user_id, "set_tier", { tier_key: tier.key, product_id: tier.productId });
                             }
                           }}
                         >
                           <SelectTrigger className="h-7 w-28 text-xs">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             {TIERS.map((tier) => (
                               <SelectItem key={tier.key} value={tier.key} className="text-xs">
                                 {tier.name}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </TableCell>
                       <TableCell>
                         <div className="flex gap-1.5 flex-wrap">
                           {isBlocked(u) && <Badge variant="destructive" className="text-[10px]">Blocked</Badge>}
                           {u.is_agency && (
                             <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
                               <Building2 className="w-2.5 h-2.5 mr-0.5" /> Agency
                             </Badge>
                           )}
                         </div>
                       </TableCell>
                       <TableCell className="text-center font-mono text-sm">
                         <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <span className="cursor-default">{u.actual_scan_count} <span className="text-muted-foreground text-[10px]">({u.free_scans_used})</span></span>
                             </TooltipTrigger>
                             <TooltipContent>
                               <p className="text-xs">{u.actual_scan_count} actual scans · {u.free_scans_used} free counter</p>
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                       </TableCell>
                       <TableCell className="text-xs text-muted-foreground">
                         {new Date(u.created_at).toLocaleDateString()}
                       </TableCell>
                       <TableCell>
                         <div className="flex gap-1.5 justify-end flex-wrap">
                           <Button variant="outline" size="sm" className="text-xs h-7 px-2" disabled={actionLoading === `${u.user_id}-toggle_block`} onClick={() => performAction(u.user_id, "toggle_block")}>
                             {isBlocked(u) ? <Shield className="w-3 h-3 mr-1" /> : <ShieldOff className="w-3 h-3 mr-1" />}
                             {isBlocked(u) ? "Unblock" : "Block"}
                           </Button>
                           <Button variant="outline" size="sm" className="text-xs h-7 px-2" disabled={actionLoading === `${u.user_id}-reset_scans`} onClick={() => performAction(u.user_id, "reset_scans")}>
                             <RotateCcw className="w-3 h-3 mr-1" /> Reset Scans
                           </Button>
                         </div>
                       </TableCell>
                     </TableRow>
                     );
                   })}
                  {users.length === 0 && (
                    <TableRow>
                     <TableCell colSpan={7} className="text-center text-muted-foreground py-12">No users found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="flex justify-between mb-4">
              <p className="text-sm text-muted-foreground">{templates.length} templates total</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchTemplates}>
                  <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                </Button>
                <Button size="sm" onClick={() => setShowUploadDialog(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Upload Template
                </Button>
              </div>
            </div>
            <div className="border border-border rounded-sm overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id} className={!t.is_active ? "opacity-50" : ""}>
                      <TableCell className="text-sm font-medium">{t.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {t.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] font-mono">{tag}</Badge>
                          ))}
                          {t.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{t.tags.length - 3}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.is_active ? "default" : "secondary"} className="text-[10px]">
                          {t.is_active ? "Active" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5 justify-end">
                          <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => handlePreviewTemplate(t)}>
                            <Eye className="w-3 h-3 mr-1" /> Preview
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => toggleTemplateActive(t)}>
                            {t.is_active ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                            {t.is_active ? "Hide" : "Show"}
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs h-7 px-2 text-destructive hover:text-destructive" onClick={() => deleteTemplate(t)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {templates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">No templates found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* CVs Tab */}
          <TabsContent value="cvs">
            <div className="flex justify-between mb-4">
              <p className="text-sm text-muted-foreground">{cvs.length} CVs total</p>
              <Button variant="outline" size="sm" onClick={fetchCvs}>
                <RefreshCw className="w-4 h-4 mr-1" /> Refresh
              </Button>
            </div>
            <div className="border border-border rounded-sm overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Salary Range</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead className="text-center">Matches</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cvs.map((cv) => (
                    <TableRow key={cv.id}>
                      <TableCell>
                        <div>
                          <p className="text-xs font-mono">{cv.candidate_email || "—"}</p>
                          {cv.candidate_name && <p className="text-[10px] text-muted-foreground">{cv.candidate_name}</p>}
                          {cv.candidate_consent_recruiter && (
                            <Badge variant="outline" className="text-[9px] mt-0.5 border-green-500/50 text-green-600">Shared</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{cv.file_name}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold text-sm ${getScoreColor(cv.ai_score)}`}>
                          {cv.ai_score ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {cv.salary_min && cv.salary_max
                          ? `€${cv.salary_min.toLocaleString()} – €${cv.salary_max.toLocaleString()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {cv.experience_years ? `${cv.experience_years} yrs` : "—"}
                        {cv.education_level && <span className="text-muted-foreground ml-1">· {cv.education_level}</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px]">{cv.match_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cv.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                          {cv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(cv.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => handleDownloadCv(cv)}>
                            <Download className="w-3 h-3 mr-1" /> CV
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => handleViewCvDetail(cv)}>
                            <Eye className="w-3 h-3 mr-1" /> Report
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {cvs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-12">No CVs uploaded yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Job Listings Tab */}
          <TabsContent value="jobs">
            <div className="flex justify-between mb-4">
              <p className="text-sm text-muted-foreground">{jobs.length} job listings total</p>
              <Button variant="outline" size="sm" onClick={fetchJobs}>
                <RefreshCw className="w-4 h-4 mr-1" /> Refresh
              </Button>
            </div>
            <div className="border border-border rounded-sm overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Salary Range</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead className="text-center">Matches</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} className={!job.is_active ? "opacity-50" : ""}>
                      <TableCell className="text-sm font-medium max-w-[180px] truncate">{job.title}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs">{job.employer_name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{job.employer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          {job.location && <><MapPin className="w-3 h-3 text-muted-foreground" />{job.location}</>}
                          {job.remote_option && job.remote_option !== "on-site" && (
                            <Badge variant="outline" className="text-[9px] ml-1">{job.remote_option}</Badge>
                          )}
                          {!job.location && "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {job.salary_min && job.salary_max
                          ? `€${job.salary_min.toLocaleString()} – €${job.salary_max.toLocaleString()}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-0.5 max-w-[150px]">
                          {(job.required_skills || []).slice(0, 3).map(s => (
                            <Badge key={s} variant="secondary" className="text-[9px]">{s}</Badge>
                          ))}
                          {(job.required_skills || []).length > 3 && (
                            <span className="text-[9px] text-muted-foreground">+{(job.required_skills || []).length - 3}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px]">{job.match_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={job.is_active ? "default" : "secondary"} className="text-[10px]">
                          {job.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => handleViewJobDetail(job)}>
                          <Eye className="w-3 h-3 mr-1" /> Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-12">No job listings yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload New Template</DialogTitle>
            <DialogDescription>Upload a .docx or .doc file and add metadata for the template library.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Template Name *</label>
              <Input value={uploadForm.name} onChange={(e) => setUploadForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Service Level Agreement" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea value={uploadForm.description} onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description of the template..." rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Category *</label>
              <Select value={uploadForm.category} onValueChange={(v) => setUploadForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tags (comma-separated)</label>
              <Input value={uploadForm.tags} onChange={(e) => setUploadForm((f) => ({ ...f, tags: e.target.value }))} placeholder="e.g. sla, service-level, performance" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">File (.docx or .doc) *</label>
              <Input
                type="file"
                accept=".doc,.docx"
                onChange={(e) => setUploadForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
              <Button onClick={handleUploadTemplate} disabled={uploading}>
                {uploading ? "Uploading..." : <><Upload className="w-4 h-4 mr-1" /> Upload</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              {previewTemplate?.description || previewTemplate?.category}
            </DialogDescription>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading preview...</span>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-md p-6 max-h-[60vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-[var(--font-body)] leading-relaxed">
                {previewContent}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CV Detail / Report Dialog */}
      <Dialog open={!!selectedCv} onOpenChange={(o) => { if (!o) { setSelectedCv(null); setCvPreviewUrl(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📄 CV Analysis Report — {selectedCv?.file_name}
            </DialogTitle>
            <DialogDescription>
              {selectedCv?.candidate_email} · {selectedCv?.candidate_name || "No name"}
            </DialogDescription>
          </DialogHeader>
          {selectedCv && (
            <Tabs value={cvDetailTab} onValueChange={(v) => setCvDetailTab(v as "report" | "preview")} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between -mt-1 mb-2">
                <TabsList className="h-8">
                  <TabsTrigger value="report" className="text-xs px-3 h-7">Report</TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs px-3 h-7">CV Preview</TabsTrigger>
                </TabsList>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleDownloadCv(selectedCv)}>
                  <Download className="w-3.5 h-3.5 mr-1" /> Download
                </Button>
              </div>

              <TabsContent value="report" className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-full max-h-[65vh]">
                  <div className="space-y-4 pr-4">
                    {/* Score & Salary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Quality Score</p>
                        <p className={`text-3xl font-bold ${getScoreColor(selectedCv.ai_score)}`}>
                          {selectedCv.ai_score ?? "—"}<span className="text-sm text-muted-foreground">/100</span>
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Salary Range</p>
                        <p className="text-lg font-semibold text-foreground">
                          €{selectedCv.salary_min?.toLocaleString() || "?"} – €{selectedCv.salary_max?.toLocaleString() || "?"}
                        </p>
                      </div>
                    </div>

                    {/* Experience & Education */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Experience</p>
                        <p className="text-sm font-medium text-foreground">{selectedCv.experience_years || "?"} years</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Education</p>
                        <p className="text-sm font-medium text-foreground">{selectedCv.education_level || "N/A"}</p>
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedCv.skills || []).map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                        {(!selectedCv.skills || selectedCv.skills.length === 0) && (
                          <span className="text-xs text-muted-foreground">No skills identified</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills from raw_analysis */}
                    {selectedCv.raw_analysis?.missing_skills && selectedCv.raw_analysis.missing_skills.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Missing Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCv.raw_analysis.missing_skills.map((s: string) => (
                            <Badge key={s} variant="outline" className="text-xs border-orange-500/50 text-orange-600">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {selectedCv.summary && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
                        <p className="text-sm text-foreground leading-relaxed">{selectedCv.summary}</p>
                      </div>
                    )}

                    {/* Improvements */}
                    {selectedCv.raw_analysis?.improvements && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Improvement Suggestions</p>
                        <ul className="space-y-1">
                          {selectedCv.raw_analysis.improvements.map((imp: string, i: number) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-primary font-bold">{i + 1}.</span> {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Trajectory */}
                    {selectedCv.raw_analysis?.trajectory && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Career Trajectory</p>
                        <p className="text-sm text-foreground leading-relaxed">{selectedCv.raw_analysis.trajectory}</p>
                      </div>
                    )}

                    <Separator />

                    {/* Job Matches */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Job Matches ({cvMatches.length})</p>
                      {cvMatches.length > 0 ? (
                        <div className="space-y-2">
                          {cvMatches.map((m: any) => (
                            <div key={m.id} className="border border-border rounded-md p-3 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{m.job_listings?.title || "Unknown"}</p>
                                  <p className="text-[10px] text-muted-foreground">{m.job_listings?.employer_name} · {m.job_listings?.location}</p>
                                </div>
                                <Badge variant={m.match_score >= 70 ? "default" : "secondary"} className="text-xs">
                                  {m.match_score}%
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(m.matched_skills || []).map((s: string) => (
                                  <Badge key={s} variant="secondary" className="text-[9px]">{s}</Badge>
                                ))}
                              </div>
                              {m.salary_fit && (
                                <p className="text-[10px] text-muted-foreground mt-1">Salary fit: {m.salary_fit}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No job matches found</p>
                      )}
                    </div>

                    {/* Consent & Meta */}
                    <div className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                      <p>Source: FineClause Career Intelligence · Consent for recruiter sharing: {selectedCv.candidate_consent_recruiter ? "Yes" : "No"}</p>
                      <p>Uploaded: {new Date(selectedCv.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 mt-0">
                {cvPreviewUrl ? (
                  <iframe
                    src={cvPreviewUrl}
                    className="w-full h-[65vh] rounded-md border border-border bg-white"
                    title="CV Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[65vh] bg-muted/30 rounded-md border border-border">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading CV preview...</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={(o) => !o && setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> {selectedJob?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedJob?.employer_name || selectedJob?.employer_email} · {selectedJob?.location || "No location"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
            {selectedJob && (
              <div className="space-y-4 pr-4">
                {/* Key Info */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Salary Range</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedJob.salary_min && selectedJob.salary_max
                        ? `€${selectedJob.salary_min.toLocaleString()} – €${selectedJob.salary_max.toLocaleString()}`
                        : "Not specified"}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Min. Experience</p>
                    <p className="text-sm font-semibold text-foreground">{selectedJob.experience_min ? `${selectedJob.experience_min} years` : "—"}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Remote</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{selectedJob.remote_option || "on-site"}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                {/* Skills */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {(selectedJob.required_skills || []).map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {(!selectedJob.required_skills || selectedJob.required_skills.length === 0) && (
                        <span className="text-xs text-muted-foreground">None specified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Preferred Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {(selectedJob.preferred_skills || []).map(s => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                      {(!selectedJob.preferred_skills || selectedJob.preferred_skills.length === 0) && (
                        <span className="text-xs text-muted-foreground">None specified</span>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Candidate Matches */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Candidate Matches ({jobMatches.length})</p>
                  {jobMatches.length > 0 ? (
                    <div className="space-y-2">
                      {jobMatches.map((m: any) => (
                        <div key={m.id} className="border border-border rounded-md p-3 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">{m.candidate?.name || m.candidate?.email || "Unknown"}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{m.candidate?.email}</p>
                              <p className="text-[10px] text-muted-foreground">CV Score: {m.cv_uploads?.ai_score ?? "—"}/100</p>
                            </div>
                            <Badge variant={m.match_score >= 70 ? "default" : "secondary"} className="text-xs">
                              {m.match_score}%
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(m.matched_skills || []).map((s: string) => (
                              <Badge key={s} variant="secondary" className="text-[9px]">{s}</Badge>
                            ))}
                            {(m.missing_skills || []).map((s: string) => (
                              <Badge key={s} variant="outline" className="text-[9px] border-orange-500/50 text-orange-600">{s}</Badge>
                            ))}
                          </div>
                          {m.salary_fit && (
                            <p className="text-[10px] text-muted-foreground mt-1">Salary fit: {m.salary_fit}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No candidate matches found</p>
                  )}
                </div>

                {/* Meta */}
                <div className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                  <p>Employer: {selectedJob.employer_name} ({selectedJob.employer_email})</p>
                  <p>Status: {selectedJob.is_active ? "Active" : "Inactive"} · Posted: {new Date(selectedJob.created_at).toLocaleString()}</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
