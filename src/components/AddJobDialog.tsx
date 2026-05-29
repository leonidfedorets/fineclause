import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, X, Sparkles } from "lucide-react";

interface AddJobDialogProps {
  userId: string;
  userEmail: string;
  onJobAdded: () => void;
}

const AddJobDialog = ({ userId, userEmail, onJobAdded }: AddJobDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOption, setRemoteOption] = useState("on-site");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("EUR");
  const [experienceMin, setExperienceMin] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [employerName, setEmployerName] = useState("");

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !requiredSkills.includes(skill)) {
      setRequiredSkills([...requiredSkills, skill]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setRemoteOption("on-site");
    setSalaryMin("");
    setSalaryMax("");
    setSalaryCurrency("EUR");
    setExperienceMin("");
    setSkillInput("");
    setRequiredSkills([]);
    setEmployerName("");
  };

  const generateDescription = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Enter a job title first to generate a description.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-job-description", {
        body: {
          title: title.trim(),
          skills: requiredSkills.length > 0 ? requiredSkills : undefined,
          location: location.trim() || undefined,
          remoteOption,
          salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
          salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
          salaryCurrency,
          experienceMin: experienceMin ? parseFloat(experienceMin) : undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.description) {
        setDescription(data.description);
        toast({ title: "Description generated!", description: "Review and edit as needed." });
      }
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message || "Could not generate description.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast({ title: "Missing fields", description: "Title and description are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("job_listings").insert({
        employer_id: userId,
        employer_email: userEmail,
        employer_name: employerName.trim() || null,
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || null,
        remote_option: remoteOption,
        salary_min: salaryMin ? parseInt(salaryMin) : null,
        salary_max: salaryMax ? parseInt(salaryMax) : null,
        salary_currency: salaryCurrency,
        experience_min: experienceMin ? parseFloat(experienceMin) : null,
        required_skills: requiredSkills.length > 0 ? requiredSkills : null,
      });
      if (error) throw error;
      toast({ title: "Job posted!", description: `"${title.trim()}" is now live.` });
      resetForm();
      setOpen(false);
      onJobAdded();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not post job.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" />Add Job Listing</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Job Listing</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Job Title *</label>
            <Input placeholder="e.g. Senior React Developer" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">Description *</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateDescription}
                disabled={loading || generating || !title.trim()}
                className="h-7 text-xs gap-1"
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {generating ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
            <Textarea placeholder="Job responsibilities, requirements, benefits..." rows={6} value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Company / Agency Name</label>
            <Input placeholder="Your company name" value={employerName} onChange={(e) => setEmployerName(e.target.value)} disabled={loading} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Location</label>
              <Input placeholder="e.g. Berlin, DE" value={location} onChange={(e) => setLocation(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Remote Option</label>
              <Select value={remoteOption} onValueChange={setRemoteOption} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-site">On-site</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Salary Min</label>
              <Input type="number" placeholder="40000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Salary Max</label>
              <Input type="number" placeholder="70000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Currency</label>
              <Select value={salaryCurrency} onValueChange={setSalaryCurrency} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Min Experience (years)</label>
            <Input type="number" placeholder="e.g. 3" value={experienceMin} onChange={(e) => setExperienceMin(e.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Required Skills</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill and press Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                disabled={loading}
              />
              <Button type="button" variant="outline" size="sm" onClick={addSkill} disabled={loading}>Add</Button>
            </div>
            {requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {requiredSkills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 pr-1">
                    {s}
                    <button onClick={() => removeSkill(s)} className="ml-0.5 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Posting...</> : "Post Job Listing"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobDialog;
