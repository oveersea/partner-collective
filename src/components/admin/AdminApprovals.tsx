import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CheckCircle2, XCircle, Clock, Search, Filter, User, ArrowRight,
  Loader2, ChevronDown, ChevronUp, Briefcase, GraduationCap, UserPen,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Unified approval item
interface ApprovalItem {
  id: string;
  user_id: string;
  user_name?: string;
  source: "profile" | "experience" | "education";
  label: string;
  summary: string;
  old_value: string | null;
  new_value: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // raw data for applying changes
  raw_field_name?: string;
  raw_data?: Record<string, any>;
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

const SOURCE_CONFIG = {
  profile: { label: "Profile", icon: UserPen, color: "text-primary" },
  experience: { label: "Experience", icon: Briefcase, color: "text-blue-500" },
  education: { label: "Education", icon: GraduationCap, color: "text-violet-500" },
};

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  pending: { color: "bg-amber-500/10 text-amber-600", icon: Clock, label: "Pending" },
  approved: { color: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle2, label: "Approved" },
  rejected: { color: "bg-destructive/10 text-destructive", icon: XCircle, label: "Rejected" },
};

const AdminApprovals = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterSource, setFilterSource] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [profileRes, expRes, eduRes] = await Promise.all([
      supabase.from("profile_change_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("user_experiences").select("id, user_id, company, position, description, start_date, end_date, is_current, location, status, reviewed_by, reviewed_at, created_at").order("created_at", { ascending: false }),
      supabase.from("user_education").select("id, user_id, institution, degree, field_of_study, start_date, end_date, status, reviewed_by, reviewed_at, created_at").order("created_at", { ascending: false }),
    ]);

    const allUserIds = new Set<string>();
    (profileRes.data || []).forEach((r) => allUserIds.add(r.user_id));
    (expRes.data || []).forEach((r) => allUserIds.add(r.user_id));
    (eduRes.data || []).forEach((r) => allUserIds.add(r.user_id));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", [...allUserIds]);
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

    const result: ApprovalItem[] = [];

    // Profile change requests
    (profileRes.data || []).forEach((r) => {
      result.push({
        id: `profile-${r.id}`,
        user_id: r.user_id,
        user_name: profileMap.get(r.user_id) || "—",
        source: "profile",
        label: FIELD_LABELS[r.field_name] || r.field_name,
        summary: r.new_value ? (r.new_value.length > 80 ? r.new_value.slice(0, 80) + "..." : r.new_value) : "",
        old_value: r.old_value,
        new_value: r.new_value,
        status: r.status,
        admin_notes: r.admin_notes,
        reviewed_by: r.reviewed_by,
        reviewed_at: r.reviewed_at,
        created_at: r.created_at,
        raw_field_name: r.field_name,
      });
    });

    // Experience
    (expRes.data || []).forEach((r) => {
      result.push({
        id: `exp-${r.id}`,
        user_id: r.user_id,
        user_name: profileMap.get(r.user_id) || "—",
        source: "experience",
        label: `${r.position} @ ${r.company}`,
        summary: r.location || "",
        old_value: null,
        new_value: `${r.position} at ${r.company}${r.start_date ? ` (${r.start_date})` : ""}`,
        status: r.status || "pending",
        admin_notes: null,
        reviewed_by: r.reviewed_by,
        reviewed_at: r.reviewed_at,
        created_at: r.created_at,
        raw_data: r,
      });
    });

    // Education
    (eduRes.data || []).forEach((r) => {
      result.push({
        id: `edu-${r.id}`,
        user_id: r.user_id,
        user_name: profileMap.get(r.user_id) || "—",
        source: "education",
        label: `${r.degree || "Degree"} — ${r.institution}`,
        summary: r.field_of_study || "",
        old_value: null,
        new_value: `${r.degree || ""} ${r.field_of_study || ""} at ${r.institution}`,
        status: r.status || "pending",
        admin_notes: null,
        reviewed_by: r.reviewed_by,
        reviewed_at: r.reviewed_at,
        created_at: r.created_at,
        raw_data: r,
      });
    });

    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setItems(result);
    setLoading(false);
  };

  const getRealId = (compositeId: string) => compositeId.replace(/^(profile|exp|edu)-/, "");

  const handleReview = async (action: "approved" | "rejected", itemOrId?: string | ApprovalItem, notes?: string) => {
    if (!user) return;
    const item = typeof itemOrId === "string"
      ? items.find((i) => i.id === itemOrId)
      : (itemOrId || selectedItem);
    if (!item) return;

    setSubmitting(true);
    const realId = getRealId(item.id);

    try {
      if (item.source === "profile") {
        const { error } = await supabase
          .from("profile_change_requests")
          .update({
            status: action,
            admin_notes: notes || reviewNotes.trim() || null,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", realId);
        if (error) throw error;

        if (action === "approved" && item.raw_field_name) {
          const updateObj: Record<string, any> = {};
          if (item.raw_field_name === "daily_rate") {
            updateObj[item.raw_field_name] = item.new_value ? Number(item.new_value) : null;
          } else {
            updateObj[item.raw_field_name] = item.new_value;
          }
          const { error: profileError } = await supabase
            .from("profiles")
            .update(updateObj)
            .eq("user_id", item.user_id);
          if (profileError) throw profileError;
        }
      } else if (item.source === "experience") {
        const { error } = await supabase
          .from("user_experiences")
          .update({
            status: action,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", realId);
        if (error) throw error;
      } else if (item.source === "education") {
        const { error } = await supabase
          .from("user_education")
          .update({
            status: action,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", realId);
        if (error) throw error;
      }

      toast.success(action === "approved" ? "Approved!" : "Rejected");
      setReviewDialog(false);
      setReviewNotes("");
      fetchAll();
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
        const item = items.find((i) => i.id === id);
        if (item) await handleReview("approved", item, "Bulk approved");
      }
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} changes approved`);
      fetchAll();
    } catch {
      toast.error("Failed to process bulk approval");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const openReviewDialog = (item: ApprovalItem, action: "approved" | "rejected") => {
    setSelectedItem(item);
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

  const filtered = items.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterSource !== "all" && r.source !== filterSource) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.user_name?.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = items.filter((r) => r.status === "pending").length;
  const approvedCount = items.filter((r) => r.status === "approved").length;
  const rejectedCount = items.filter((r) => r.status === "rejected").length;

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
          { label: "Total", value: items.length, icon: User, color: "text-foreground", filter: "all" },
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

      {/* Source tabs */}
      <Tabs value={filterSource} onValueChange={setFilterSource}>
        <TabsList>
          <TabsTrigger value="all">
            Semua
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{items.filter(i => filterStatus === "all" || i.status === filterStatus).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="profile">
            <UserPen className="w-3.5 h-3.5 mr-1" /> Profile
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{items.filter(i => i.source === "profile" && (filterStatus === "all" || i.status === filterStatus)).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="experience">
            <Briefcase className="w-3.5 h-3.5 mr-1" /> Experience
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{items.filter(i => i.source === "experience" && (filterStatus === "all" || i.status === filterStatus)).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="education">
            <GraduationCap className="w-3.5 h-3.5 mr-1" /> Education
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{items.filter(i => i.source === "education" && (filterStatus === "all" || i.status === filterStatus)).length}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

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
            No approval requests found.
          </div>
        )}

        {filtered.map((item) => {
          const config = statusConfig[item.status] || statusConfig.pending;
          const StatusIcon = config.icon;
          const sourceConf = SOURCE_CONFIG[item.source];
          const SourceIcon = sourceConf.icon;
          const isExpanded = expandedId === item.id;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {item.status === "pending" && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-input"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-foreground">{item.user_name}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <Badge variant="outline" className={`text-[10px] gap-0.5 ${sourceConf.color}`}>
                      <SourceIcon className="w-3 h-3" /> {sourceConf.label}
                    </Badge>
                    <span className="text-sm font-medium text-primary truncate max-w-[250px]">
                      {item.label}
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                      <StatusIcon className="w-3 h-3 mr-0.5" /> {config.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{format(new Date(item.created_at), "dd MMM yyyy HH:mm", { locale: localeId })}</span>
                    {item.summary && (
                      <span className="truncate max-w-[300px] text-foreground/70">
                        {item.summary}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1"
                        onClick={(e) => { e.stopPropagation(); openReviewDialog(item, "approved"); }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/20 hover:bg-destructive/5 gap-1"
                        onClick={(e) => { e.stopPropagation(); openReviewDialog(item, "rejected"); }}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                  {item.source === "profile" && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Old Value</Label>
                        <div className="mt-1 p-3 bg-destructive/5 border border-destructive/10 rounded-lg text-sm text-foreground min-h-[40px]">
                          {item.old_value || <span className="text-muted-foreground italic">Empty</span>}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">New Value</Label>
                        <div className="mt-1 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-sm text-foreground min-h-[40px]">
                          {item.new_value || <span className="text-muted-foreground italic">Empty</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {item.source === "experience" && item.raw_data && (
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div><Label className="text-xs text-muted-foreground">Company</Label><p className="mt-1 text-foreground">{item.raw_data.company}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Position</Label><p className="mt-1 text-foreground">{item.raw_data.position}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Location</Label><p className="mt-1 text-foreground">{item.raw_data.location || "—"}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Period</Label><p className="mt-1 text-foreground">{item.raw_data.start_date || "—"} → {item.raw_data.is_current ? "Present" : (item.raw_data.end_date || "—")}</p></div>
                      {item.raw_data.description && (
                        <div className="sm:col-span-2"><Label className="text-xs text-muted-foreground">Description</Label><p className="mt-1 text-foreground whitespace-pre-wrap">{item.raw_data.description}</p></div>
                      )}
                    </div>
                  )}

                  {item.source === "education" && item.raw_data && (
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div><Label className="text-xs text-muted-foreground">Institution</Label><p className="mt-1 text-foreground">{item.raw_data.institution}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Degree</Label><p className="mt-1 text-foreground">{item.raw_data.degree || "—"}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Field of Study</Label><p className="mt-1 text-foreground">{item.raw_data.field_of_study || "—"}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Period</Label><p className="mt-1 text-foreground">{item.raw_data.start_date || "—"} → {item.raw_data.end_date || "—"}</p></div>
                    </div>
                  )}

                  {item.admin_notes && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Admin Notes</Label>
                      <p className="text-sm text-foreground bg-muted/50 rounded-md p-2 mt-1">{item.admin_notes}</p>
                    </div>
                  )}

                  {item.reviewed_at && (
                    <p className="text-xs text-muted-foreground">
                      Reviewed on {format(new Date(item.reviewed_at), "dd MMM yyyy HH:mm")}
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

          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p>
                  <strong>{selectedItem.user_name}</strong> —{" "}
                  <Badge variant="outline" className={`text-[10px] ${SOURCE_CONFIG[selectedItem.source].color}`}>
                    {SOURCE_CONFIG[selectedItem.source].label}
                  </Badge>
                </p>
                <p className="text-foreground font-medium mt-1">{selectedItem.label}</p>
                {selectedItem.source === "profile" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <span className="line-through">{selectedItem.old_value || "(empty)"}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-foreground font-medium">{selectedItem.new_value || "(empty)"}</span>
                  </div>
                )}
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
