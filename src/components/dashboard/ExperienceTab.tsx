import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Briefcase, Building2, MapPin, Calendar, Plus, X, Loader2, Pencil, Trash2, Clock, CheckCircle2, XCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface Experience {
  id: string;
  company: string;
  position: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  location: string | null;
  status: string;
}

const emptyForm = {
  company: "",
  position: "",
  description: "",
  start_date: "",
  end_date: "",
  is_current: false,
  location: "",
};

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  approved: { label: "Approved", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  pending: { label: "Pending Approval", icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

const ExperienceTab = () => {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchExperiences = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_experiences")
      .select("id, company, position, description, start_date, end_date, is_current, location, status")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });
    setExperiences((data as Experience[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (exp: Experience) => {
    setEditingId(exp.id);
    setForm({
      company: exp.company || "",
      position: exp.position || "",
      description: exp.description || "",
      start_date: exp.start_date || "",
      end_date: exp.end_date || "",
      is_current: exp.is_current || false,
      location: exp.location || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.company.trim() || !form.position.trim()) {
      toast.error("Company and position are required");
      return;
    }

    setSaving(true);

    const payload = {
      user_id: user.id,
      company: form.company.trim(),
      position: form.position.trim(),
      description: form.description.trim() || null,
      start_date: form.start_date || null,
      end_date: form.is_current ? null : (form.end_date || null),
      is_current: form.is_current,
      location: form.location.trim() || null,
      status: "pending",
    };

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("user_experiences")
        .update(payload)
        .eq("id", editingId)
        .eq("user_id", user.id));
    } else {
      ({ error } = await supabase
        .from("user_experiences")
        .insert(payload));
    }

    if (error) {
      toast.error("Failed to save work experience");
    } else {
      toast.success(editingId
        ? "Changes submitted for admin approval"
        : "Work experience submitted for admin approval");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchExperiences();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeleting(id);
    const { error } = await supabase
      .from("user_experiences")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to delete data");
    } else {
      toast.success("Work experience deleted");
      setExperiences(prev => prev.filter(e => e.id !== id));
    }
    setDeleting(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    try { return format(new Date(date), "MMM yyyy", { locale: idLocale }); } catch { return date; }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={showForm ? cancelForm : openAddForm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Experience"}
        </button>
      </div>

      {/* Approval notice */}
      {showForm && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-700">Changes require admin approval</p>
            <p className="text-amber-600/80 mt-0.5">
              Work experience you {editingId ? "edit" : "add"} will be reviewed by an admin first.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
              <h3 className="font-semibold text-card-foreground">
                {editingId ? "Edit Work Experience" : "Add New Work Experience"}
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Company *</Label>
                  <Input className="mt-1.5" placeholder="Acme Corporation" value={form.company} onChange={e => set("company", e.target.value)} />
                </div>
                <div>
                  <Label>Position / Title *</Label>
                  <Input className="mt-1.5" placeholder="Software Engineer" value={form.position} onChange={e => set("position", e.target.value)} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input className="mt-1.5" placeholder="Jakarta, Indonesia" value={form.location} onChange={e => set("location", e.target.value)} />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.is_current} onCheckedChange={v => set("is_current", v)} />
                  <Label className="cursor-pointer" onClick={() => set("is_current", !form.is_current)}>Currently working here</Label>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input className="mt-1.5" type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
                </div>
                {!form.is_current && (
                  <div>
                    <Label>End Date</Label>
                    <Input className="mt-1.5" type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} />
                  </div>
                )}
              </div>
              <div>
                <Label>Job Description</Label>
                <Textarea className="mt-1.5" rows={3} placeholder="Responsibilities, achievements, projects, etc." value={form.description} onChange={e => set("description", e.target.value)} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving || !form.company.trim() || !form.position.trim()}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Submit Changes" : "Submit for Approval"}
                </Button>
                <Button variant="ghost" onClick={cancelForm}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {experiences.length === 0 && !showForm ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
          <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-card-foreground mb-1">No work experience yet</h3>
          <p className="text-sm text-muted-foreground">Add your work experience.</p>
        </motion.div>
      ) : (
        experiences.map((exp, i) => {
          const sc = statusConfig[exp.status] || statusConfig.pending;
          const StatusIcon = sc.icon;
          return (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow relative"
            >
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditForm(exp)}
                  className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(exp.id)}
                  disabled={deleting === exp.id}
                  className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                >
                  {deleting === exp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-card-foreground">{exp.position}</h3>
                    {exp.is_current && (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">Current</span>
                    )}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {sc.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    {exp.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(exp.start_date)} — {exp.is_current ? "Present" : formatDate(exp.end_date)}
                      </span>
                    )}
                    {exp.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {exp.location}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{exp.description}</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
};

export default ExperienceTab;
