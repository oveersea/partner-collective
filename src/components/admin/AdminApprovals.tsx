import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CheckCircle2, XCircle, Clock, Search, Filter, User, ArrowRight,
  Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface ChangeRequest {
  id: string;
  user_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  user_name?: string;
}

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full Name",
  headline: "Headline",
  city: "City",
  country: "Country",
  phone_number: "Phone Number",
  daily_rate: "Daily Rate",
  highest_education: "Highest Education",
  opportunity_availability: "Availability",
  professional_summary: "Professional Summary",
  linkedin_url: "LinkedIn URL",
  website_url: "Website URL",
  bio: "Bio",
};

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  pending: { color: "bg-amber-500/10 text-amber-600", icon: Clock, label: "Pending" },
  approved: { color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle2, label: "Approved" },
  rejected: { color: "bg-destructive/10 text-destructive", icon: XCircle, label: "Rejected" },
};

const AdminApprovals = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Review dialog
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profile_change_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load data");
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
      const enriched: ChangeRequest[] = data.map((r) => ({
        ...r,
        user_name: profileMap.get(r.user_id) || "—",
      }));
      setRequests(enriched);
    } else {
      setRequests([]);
    }
    setLoading(false);
  };

  const handleReview = async (action: "approved" | "rejected", requestId?: string, notes?: string) => {
    if (!user) return;
    const id = requestId || selectedRequest?.id;
    if (!id) return;

    setSubmitting(true);

    try {
      // Update request status
      const { error: updateError } = await supabase
        .from("profile_change_requests")
        .update({
          status: action,
          admin_notes: notes || reviewNotes.trim() || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // If approved, apply the change to the profile
      if (action === "approved") {
        const req = requests.find((r) => r.id === id);
        if (req) {
          const updateObj: Record<string, any> = {};
          if (req.field_name === "daily_rate") {
            updateObj[req.field_name] = req.new_value ? Number(req.new_value) : null;
          } else {
            updateObj[req.field_name] = req.new_value;
          }

          const { error: profileError } = await supabase
            .from("profiles")
            .update(updateObj)
            .eq("user_id", req.user_id);

          if (profileError) throw profileError;
        }
      }

      toast.success(action === "approved" ? "Change approved!" : "Change rejected");
      setReviewDialog(false);
      setReviewNotes("");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to process");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkSubmitting(true);

    try {
      for (const id of selectedIds) {
        await handleReview("approved", id, "Bulk approved");
      }
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} changes approved`);
      fetchRequests();
    } catch {
      toast.error("Failed to process bulk approval");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const openReviewDialog = (req: ChangeRequest, action: "approved" | "rejected") => {
    setSelectedRequest(req);
    setReviewAction(action);
    setReviewNotes("");
    setReviewDialog(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter
  const filtered = requests
    .filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.user_name?.toLowerCase().includes(q) ||
          (FIELD_LABELS[r.field_name] || r.field_name).toLowerCase().includes(q) ||
          r.new_value?.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: requests.length, icon: User, color: "text-foreground", filter: "all" },
          { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-500", filter: "pending" },
          { label: "Approved", value: approvedCount, icon: CheckCircle2, color: "text-emerald-500", filter: "approved" },
          { label: "Rejected", value: rejectedCount, icon: XCircle, color: "text-destructive", filter: "rejected" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setFilterStatus(s.filter)}
            className={`bg-card border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/40 ${filterStatus === s.filter ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
          >
            <div className="flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters + bulk actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search user name or field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {selectedIds.size > 0 && filterStatus === "pending" && (
          <Button
            size="sm"
            onClick={handleBulkApprove}
            disabled={bulkSubmitting}
            className="gap-1.5"
          >
            {bulkSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Approve {selectedIds.size} Selected
          </Button>
        )}
      </div>

      {/* Request list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No profile change requests found.
          </div>
        )}

        {filtered.map((req) => {
          const config = statusConfig[req.status] || statusConfig.pending;
          const StatusIcon = config.icon;
          const isExpanded = expandedId === req.id;

          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : req.id)}
              >
                {/* Checkbox for pending */}
                {req.status === "pending" && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(req.id)}
                    onChange={(e) => { e.stopPropagation(); toggleSelect(req.id); }}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-input"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-foreground">{req.user_name}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm font-medium text-primary">
                      {FIELD_LABELS[req.field_name] || req.field_name}
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                      <StatusIcon className="w-3 h-3 mr-0.5" /> {config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{format(new Date(req.created_at), "dd MMM yyyy HH:mm", { locale: localeId })}</span>
                    {req.new_value && (
                      <span className="truncate max-w-[300px] text-foreground/70">
                        → {req.new_value.length > 60 ? req.new_value.slice(0, 60) + "..." : req.new_value}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {req.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                        onClick={(e) => { e.stopPropagation(); openReviewDialog(req, "approved"); }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/20 hover:bg-destructive/5 gap-1"
                        onClick={(e) => { e.stopPropagation(); openReviewDialog(req, "rejected"); }}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                     <Label className="text-xs text-muted-foreground">Old Value</Label>
                      <div className="mt-1 p-3 bg-destructive/5 border border-destructive/10 rounded-lg text-sm text-foreground min-h-[40px]">
                        {req.old_value || <span className="text-muted-foreground italic">Empty</span>}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">New Value</Label>
                      <div className="mt-1 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-sm text-foreground min-h-[40px]">
                        {req.new_value || <span className="text-muted-foreground italic">Empty</span>}
                      </div>
                    </div>
                  </div>

                  {req.admin_notes && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Admin Notes</Label>
                      <p className="text-sm text-foreground bg-muted/50 rounded-md p-2 mt-1">{req.admin_notes}</p>
                    </div>
                  )}

                  {req.reviewed_at && (
                    <p className="text-xs text-muted-foreground">
                      Reviewed on {format(new Date(req.reviewed_at), "dd MMM yyyy HH:mm")}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approved" ? "Approve Change" : "Reject Change"}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p><strong>{selectedRequest.user_name}</strong> changed <strong>{FIELD_LABELS[selectedRequest.field_name] || selectedRequest.field_name}</strong></p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span className="line-through">{selectedRequest.old_value || "(empty)"}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-foreground font-medium">{selectedRequest.new_value || "(empty)"}</span>
                  <span className="text-foreground font-medium">{selectedRequest.new_value || "(kosong)"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes (optional)</Label>
                <Textarea
                  placeholder="Reason for approve/reject..."
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>Cancel</Button>
            <Button
              onClick={() => handleReview(reviewAction)}
              disabled={submitting}
              variant={reviewAction === "rejected" ? "destructive" : "default"}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (
                reviewAction === "approved" ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />
              )}
              {reviewAction === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApprovals;
