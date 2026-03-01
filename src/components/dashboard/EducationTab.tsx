import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { GraduationCap, Calendar, Plus, X, Loader2, Pencil, Trash2, Clock, CheckCircle2, XCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Education {
  id: string;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  status: string;
}

const emptyForm = {
  institution: "",
  degree: "",
  field_of_study: "",
  start_date: "",
  end_date: "",
  description: "",
};

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  approved: { label: "Approved", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  pending: { label: "Pending Approval", icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

const EducationTab = () => {
  const { user } = useAuth();
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchEducations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_education")
      .select("id, institution, degree, field_of_study, start_date, end_date, description, status")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });
    setEducations((data as Education[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEducations();
  }, [fetchEducations]);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (edu: Education) => {
    setEditingId(edu.id);
    setForm({
      institution: edu.institution || "",
      degree: edu.degree || "",
      field_of_study: edu.field_of_study || "",
      start_date: edu.start_date || "",
      end_date: edu.end_date || "",
      description: edu.description || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.institution.trim()) {
      toast.error("Institution name is required");
      return;
    }

    setSaving(true);

    const payload = {
      user_id: user.id,
      institution: form.institution.trim(),
      degree: form.degree.trim() || null,
      field_of_study: form.field_of_study.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      description: form.description.trim() || null,
      status: "pending",
    };

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("user_education")
        .update(payload)
        .eq("id", editingId)
        .eq("user_id", user.id));
    } else {
      ({ error } = await supabase
        .from("user_education")
        .insert(payload));
    }

    if (error) {
      toast.error("Failed to save education data");
    } else {
      toast.success(editingId
        ? "Changes submitted for admin approval"
        : "Education data submitted for admin approval");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchEducations();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeleting(id);
    const { error } = await supabase
      .from("user_education")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to delete data");
    } else {
      toast.success("Education data deleted");
      setEducations(prev => prev.filter(e => e.id !== id));
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
          {showForm ? "Cancel" : "Add Education"}
        </button>
      </div>

      {/* Approval notice */}
      {showForm && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-700">Changes require admin approval</p>
            <p className="text-amber-600/80 mt-0.5">
              Education data you {editingId ? "edit" : "add"} will be reviewed by an admin first.
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
                {editingId ? "Edit Education" : "Add New Education"}
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Institution Name *</Label>
                  <Input className="mt-1.5" placeholder="Harvard University" value={form.institution} onChange={e => set("institution", e.target.value)} />
                </div>
                <div>
                  <Label>Degree</Label>
                  <select
                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={form.degree}
                    onChange={e => set("degree", e.target.value)}
                  >
                    <option value="">Select Degree</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA/SMK">SMA/SMK</option>
                    <option value="D1">D1</option>
                    <option value="D2">D2</option>
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
                    <option value="S1">Bachelor's</option>
                    <option value="S2">Master's</option>
                    <option value="S3">Doctorate</option>
                    <option value="Profesi">Profesi</option>
                    <option value="Sertifikasi">Certification</option>
                    <option value="Kursus">Course / Bootcamp</option>
                  </select>
                </div>
                <div>
                  <Label>Field of Study</Label>
                  <Input className="mt-1.5" placeholder="Computer Science" value={form.field_of_study} onChange={e => set("field_of_study", e.target.value)} />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input className="mt-1.5" type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input className="mt-1.5" type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty if still ongoing</p>
                </div>
              </div>
              <div>
                <Label>Description / Notes</Label>
                <Textarea className="mt-1.5" rows={3} placeholder="GPA, achievements, activities, etc." value={form.description} onChange={e => set("description", e.target.value)} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving || !form.institution.trim()}>
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
      {educations.length === 0 && !showForm ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
          <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-card-foreground mb-1">No education data yet</h3>
          <p className="text-sm text-muted-foreground">Add your education history.</p>
        </motion.div>
      ) : (
        educations.map((edu, i) => {
          const sc = statusConfig[edu.status] || statusConfig.pending;
          const StatusIcon = sc.icon;
          return (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow relative"
            >
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditForm(edu)}
                  className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(edu.id)}
                  disabled={deleting === edu.id}
                  className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                >
                  {deleting === edu.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-card-foreground">{edu.institution}</h3>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {sc.label}
                    </span>
                  </div>
                  {(edu.degree || edu.field_of_study) && (
                    <p className="text-sm text-muted-foreground">
                      {[edu.degree, edu.field_of_study].filter(Boolean).join(" — ")}
                    </p>
                  )}
                  {edu.start_date && (
                    <span className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(edu.start_date)} — {edu.end_date ? formatDate(edu.end_date) : "Present"}
                    </span>
                  )}
                  {edu.description && (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{edu.description}</p>
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

export default EducationTab;
