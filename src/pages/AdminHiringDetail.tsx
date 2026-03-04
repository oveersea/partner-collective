import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Briefcase, Clock, Zap, Users, CreditCard, CalendarDays,
  CheckCircle2, XCircle, Trash2, Loader2, Building2,
} from "lucide-react";

interface HiringDetail {
  id: string;
  title: string;
  description: string | null;
  hiring_type: string;
  status: string;
  positions_count: number;
  credit_cost: number;
  required_skills: string[] | null;
  experience_min: number | null;
  experience_max: number | null;
  sla_deadline: string | null;
  created_at: string;
  business_id: string | null;
  client_id: string;
  business_profiles: { name: string } | null;
  client_profiles: { company_name: string; user_id: string } | null;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-amber-500/10 text-amber-600 border-amber-200", label: "Pending" },
  sourcing: { color: "bg-blue-500/10 text-blue-600 border-blue-200", label: "Sourcing" },
  shortlisted: { color: "bg-violet-500/10 text-violet-600 border-violet-200", label: "Shortlisted" },
  interviewing: { color: "bg-cyan-500/10 text-cyan-600 border-cyan-200", label: "Interviewing" },
  hired: { color: "bg-primary/10 text-primary border-primary/20", label: "Hired" },
  closed: { color: "bg-muted text-muted-foreground border-border", label: "Closed" },
};

const AdminHiringDetail = () => {
  const { oveercode: paramCode } = useParams<{ oveercode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<HiringDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (paramCode) fetchDetail();
    if (user) checkSuperadmin();
  }, [paramCode, user]);

  const checkSuperadmin = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id);
    setIsSuperadmin(data?.some((r: any) => r.role === "superadmin") ?? false);
  };

  const fetchDetail = async () => {
    setLoading(true);
    const { data: row, error } = await supabase
      .from("hiring_requests")
      .select("*, business_profiles(name), client_profiles(company_name, user_id)")
      .eq("oveercode", paramCode!)
      .maybeSingle();

    if (error || !row) {
      toast.error("Hiring request not found");
      navigate("/admin");
      return;
    }
    setData(row as unknown as HiringDetail);
    setLoading(false);
  };

  const updateStatus = async (status: string) => {
    if (!data) return;
    setUpdating(true);
    const { error } = await supabase.from("hiring_requests").update({ status }).eq("id", data.id);
    if (error) toast.error("Failed to update status");
    else { toast.success(`Status updated to ${status}`); fetchDetail(); }
    setUpdating(false);
  };

  const handleDelete = async () => {
    if (!data || !isSuperadmin) return;
    setDeleting(true);
    const { error } = await supabase.from("hiring_requests").delete().eq("id", data.id);
    if (error) { toast.error(error.message); setDeleting(false); return; }
    toast.success("Hiring request deleted");
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const sc = statusConfig[data.status] || statusConfig.pending;
  const nextStatuses = (() => {
    switch (data.status) {
      case "pending": return ["sourcing"];
      case "sourcing": return ["shortlisted", "closed"];
      case "shortlisted": return ["interviewing", "closed"];
      case "interviewing": return ["hired", "closed"];
      default: return [];
    }
  })();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back */}
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5 text-muted-foreground" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-4 h-4" /> Back to Admin
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-foreground truncate">{data.title}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${sc.color}`}>{sc.label}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {data.business_profiles?.name || data.client_profiles?.company_name || "—"}</span>
              <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {new Date(data.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
            </div>
          </div>

          {isSuperadmin && (
            <Button variant="destructive" size="sm" className="gap-1.5 shrink-0" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              {data.hiring_type === "fast" ? <Zap className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              Hiring Type
            </div>
            <p className="text-lg font-semibold text-foreground capitalize">{data.hiring_type}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="w-3.5 h-3.5" /> Positions</div>
            <p className="text-lg font-semibold text-foreground">{data.positions_count}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CreditCard className="w-3.5 h-3.5" /> Credit Cost</div>
            <p className="text-lg font-semibold text-foreground">{data.credit_cost}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CalendarDays className="w-3.5 h-3.5" /> SLA Deadline</div>
            <p className="text-lg font-semibold text-foreground">
              {data.sla_deadline ? new Date(data.sla_deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
            </p>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.description}</p>
          </div>
        )}

        {/* Skills & Experience */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Required Skills</h3>
            {data.required_skills && data.required_skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {data.required_skills.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills specified</p>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Experience</h3>
            <p className="text-sm text-muted-foreground">
              {data.experience_min != null || data.experience_max != null
                ? `${data.experience_min ?? 0} – ${data.experience_max ?? "∞"} years`
                : "Not specified"}
            </p>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Status Actions */}
        {nextStatuses.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === "closed" ? "outline" : "default"}
                  className={`gap-1.5 ${s === "closed" ? "text-destructive border-destructive/20 hover:bg-destructive/5" : ""}`}
                  disabled={updating}
                  onClick={() => updateStatus(s)}
                >
                  {s === "closed" ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hiring Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>"{data.title}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHiringDetail;