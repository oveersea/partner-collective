import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Briefcase, Plus, MapPin, Clock, Users, Eye, Pencil, Trash2, X,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  slug: string;
  oveercode: string | null;
  description: string | null;
  category: string;
  job_type: string | null;
  location: string | null;
  is_remote: boolean | null;
  status: string;
  skills_required: string[] | null;
  min_experience_years: number | null;
  currency: string | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  created_at: string;
}

interface CompanyJobsTabProps {
  businessId: string;
  companyName: string;
  isAdmin: boolean;
}

const JOB_CATEGORIES = [
  "Technology", "Marketing", "Design", "Finance", "Operations",
  "Human Resources", "Sales", "Engineering", "Customer Service", "Other",
];

const JOB_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

const CompanyJobsTab = ({ businessId, companyName, isAdmin }: CompanyJobsTabProps) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [jobType, setJobType] = useState("full_time");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [minExp, setMinExp] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    fetchJobs();
  }, [businessId]);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("opportunities")
      .select("id, title, slug, oveercode, description, category, job_type, location, is_remote, status, skills_required, min_experience_years, currency, budget_min, budget_max, deadline, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load jobs");
    setJobs(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("Technology"); setJobType("full_time");
    setLocation(""); setIsRemote(false); setSkills([]); setSkillsInput("");
    setMinExp(""); setCurrency("IDR"); setBudgetMin(""); setBudgetMax(""); setDeadline("");
    setEditingJob(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (job: Job) => {
    setEditingJob(job);
    setTitle(job.title);
    setDescription(job.description || "");
    setCategory(job.category);
    setJobType(job.job_type || "full_time");
    setLocation(job.location || "");
    setIsRemote(job.is_remote || false);
    setSkills(job.skills_required || []);
    setMinExp(job.min_experience_years?.toString() || "");
    setCurrency(job.currency || "IDR");
    setBudgetMin(job.budget_min?.toString() || "");
    setBudgetMax(job.budget_max?.toString() || "");
    setDeadline(job.deadline ? job.deadline.split("T")[0] : "");
    setDialogOpen(true);
  };

  const generateSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  const handleAddSkill = () => {
    const trimmed = skillsInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillsInput("");
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Job title is required"); return; }
    if (!user) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      job_type: jobType,
      location: location.trim() || null,
      is_remote: isRemote,
      skills_required: skills.length > 0 ? skills : null,
      min_experience_years: minExp ? parseInt(minExp) : null,
      currency: currency || "IDR",
      budget_min: budgetMin ? parseInt(budgetMin) : null,
      budget_max: budgetMax ? parseInt(budgetMax) : null,
      deadline: deadline || null,
      business_id: businessId,
      company_name: companyName,
      user_id: user.id,
      slug: generateSlug(title),
    };

    if (editingJob) {
      const { error } = await supabase
        .from("opportunities")
        .update(payload)
        .eq("id", editingJob.id);
      if (error) toast.error("Failed to update: " + error.message);
      else { toast.success("Job updated"); setDialogOpen(false); resetForm(); fetchJobs(); }
    } else {
      const { error } = await supabase
        .from("opportunities")
        .insert({ ...payload, status: "open" });
      if (error) toast.error("Failed to create: " + error.message);
      else { toast.success("Job posted!"); setDialogOpen(false); resetForm(); fetchJobs(); }
    }
    setSaving(false);
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Delete this job posting?")) return;
    const { error } = await supabase.from("opportunities").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Job deleted"); setJobs((prev) => prev.filter((j) => j.id !== id)); }
  };

  const toggleStatus = async (job: Job) => {
    const newStatus = job.status === "open" ? "closed" : "open";
    const { error } = await supabase.from("opportunities").update({ status: newStatus }).eq("id", job.id);
    if (error) toast.error("Failed to update status");
    else {
      toast.success(`Job ${newStatus === "open" ? "reopened" : "closed"}`);
      setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: newStatus } : j));
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: "bg-primary/10 text-primary",
      closed: "bg-muted text-muted-foreground",
      pending: "bg-amber-500/10 text-amber-600",
      filled: "bg-primary/10 text-primary",
    };
    return map[status] || map.closed;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-card-foreground">Job Postings ({jobs.length})</h3>
          {isAdmin && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> Post Job
            </Button>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No job postings yet.</p>
            {isAdmin && (
              <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1.5" /> Create First Job
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-card-foreground truncate">{job.title}</h4>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadge(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {job.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                    )}
                    {job.is_remote && <Badge variant="secondary" className="text-[10px] h-5">Remote</Badge>}
                    {job.job_type && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {JOB_TYPES.find(t => t.value === job.job_type)?.label || job.job_type}</span>
                    )}
                    <span>{job.category}</span>
                  </div>
                  {job.skills_required && job.skills_required.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {job.skills_required.slice(0, 5).map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                      {job.skills_required.length > 5 && (
                        <Badge variant="outline" className="text-[10px]">+{job.skills_required.length - 5}</Badge>
                      )}
                    </div>
                  )}
                  {(job.budget_min || job.budget_max) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {job.currency || "IDR"} {job.budget_min?.toLocaleString() || "0"} – {job.budget_max?.toLocaleString() || "∞"}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(job)} title={job.status === "open" ? "Close" : "Reopen"}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(job)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteJob(job.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Job" : "Post New Job"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Job Title *</Label>
              <Input className="mt-1" placeholder="e.g. Senior Frontend Developer" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea className="mt-1 min-h-[100px]" placeholder="Describe the role, responsibilities..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOB_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Job Type</Label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input className="mt-1" placeholder="e.g. Jakarta" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={isRemote} onCheckedChange={setIsRemote} />
                <Label>Remote</Label>
              </div>
            </div>
            <div>
              <Label>Skills Required</Label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="Type skill & press Add" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); } }} />
                <Button type="button" variant="outline" size="sm" onClick={handleAddSkill}>Add</Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs gap-1">
                      {s}
                      <button onClick={() => setSkills(skills.filter((sk) => sk !== s))}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Min. Experience (years)</Label>
              <Input className="mt-1" type="number" min="0" placeholder="0" value={minExp} onChange={(e) => setMinExp(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">IDR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="SGD">SGD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Budget Min</Label>
                <Input className="mt-1" type="number" min="0" placeholder="0" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
              </div>
              <div>
                <Label>Budget Max</Label>
                <Input className="mt-1" type="number" min="0" placeholder="0" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Deadline</Label>
              <Input className="mt-1" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingJob ? "Update Job" : "Post Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyJobsTab;
