import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  FolderKanban, ShoppingCart, Clock, AlertTriangle, CheckCircle2,
  User, Building2, ChevronDown, ChevronUp, Send, Loader2, Search,
  Filter, ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type RequestType = "project" | "service";

interface UnifiedRequest {
  id: string;
  type: RequestType;
  title: string;
  description: string | null;
  status: string;
  sla_type: string;
  sla_deadline: string | null;
  assigned_to: string | null;
  assigned_vendor_id: string | null;
  admin_notes: string | null;
  created_at: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  // project specific
  category?: string;
  skills_required?: string[];
  budget_min?: number | null;
  budget_max?: number | null;
  // service specific
  service_slug?: string;
  order_number?: string;
  items?: any;
}

interface AssignOption {
  id: string;
  label: string;
  type: "user" | "vendor";
}

const slaColors: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  priority: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  normal: "bg-primary/10 text-primary border-primary/20",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  open: "bg-amber-500/10 text-amber-600",
  in_progress: "bg-blue-500/10 text-blue-600",
  assigned: "bg-blue-500/10 text-blue-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  cancelled: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
};

const AdminRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UnifiedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | RequestType>("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"created_at" | "sla_deadline">("sla_deadline");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Assignment dialog
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);
  const [assignOptions, setAssignOptions] = useState<AssignOption[]>([]);
  const [assignTo, setAssignTo] = useState("");
  const [assignType, setAssignType] = useState<"user" | "vendor">("user");
  const [newSlaType, setNewSlaType] = useState("normal");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);

    // Fetch project requests (opportunities with job_type = 'project')
    const { data: projects } = await supabase
      .from("opportunities")
      .select("id, title, description, status, sla_type, sla_deadline, assigned_to, assigned_vendor_id, admin_notes, created_at, user_id, category, skills_required, budget_min, budget_max")
      .eq("job_type", "project")
      .order("created_at", { ascending: false });

    // Fetch service orders
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, service_slug, items, status, sla_type, sla_deadline, assigned_to, assigned_vendor_id, admin_notes, created_at, user_id")
      .order("created_at", { ascending: false });

    // Get user profiles for names
    const userIds = [
      ...(projects || []).map((p) => p.user_id),
      ...(orders || []).map((o) => o.user_id),
    ].filter(Boolean);

    const uniqueUserIds = [...new Set(userIds)];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", uniqueUserIds.length > 0 ? uniqueUserIds : ["00000000-0000-0000-0000-000000000000"]);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

    const unified: UnifiedRequest[] = [
      ...(projects || []).map((p) => ({
        id: p.id,
        type: "project" as RequestType,
        title: p.title,
        description: p.description,
        status: p.status,
        sla_type: p.sla_type || "normal",
        sla_deadline: p.sla_deadline,
        assigned_to: p.assigned_to,
        assigned_vendor_id: p.assigned_vendor_id,
        admin_notes: p.admin_notes,
        created_at: p.created_at,
        user_id: p.user_id,
        user_name: profileMap.get(p.user_id) || "—",
        category: p.category,
        skills_required: p.skills_required || [],
        budget_min: p.budget_min,
        budget_max: p.budget_max,
      })),
      ...(orders || []).map((o) => ({
        id: o.id,
        type: "service" as RequestType,
        title: (o.items as any)?.project_title || o.service_slug || "Service Order",
        description: (o.items as any)?.project_description || null,
        status: o.status,
        sla_type: o.sla_type || "normal",
        sla_deadline: o.sla_deadline,
        assigned_to: o.assigned_to,
        assigned_vendor_id: o.assigned_vendor_id,
        admin_notes: o.admin_notes,
        created_at: o.created_at,
        user_id: o.user_id,
        user_name: profileMap.get(o.user_id) || "—",
        order_number: o.order_number,
        service_slug: o.service_slug,
        items: o.items,
      })),
    ];

    setRequests(unified);
    setLoading(false);
  };

  const fetchAssignOptions = async () => {
    // Fetch users (talents)
    const { data: users } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .not("full_name", "eq", "")
      .order("full_name")
      .limit(100);

    // Fetch vendors
    const { data: vendors } = await supabase
      .from("business_profiles")
      .select("id, name")
      .order("name")
      .limit(100);

    const options: AssignOption[] = [
      ...(users || []).map((u) => ({ id: u.user_id, label: u.full_name || u.user_id, type: "user" as const })),
      ...(vendors || []).map((v) => ({ id: v.id, label: v.name, type: "vendor" as const })),
    ];
    setAssignOptions(options);
  };

  const openAssignDialog = (req: UnifiedRequest) => {
    setSelectedRequest(req);
    setAssignTo(req.assigned_to || req.assigned_vendor_id || "");
    setAssignType(req.assigned_vendor_id ? "vendor" : "user");
    setNewSlaType(req.sla_type);
    setAdminNotes(req.admin_notes || "");
    setAssignDialog(true);
    fetchAssignOptions();
  };

  const handleAssign = async () => {
    if (!selectedRequest || !user) return;
    setSubmitting(true);

    try {
      const updates: any = {
        sla_type: newSlaType,
        admin_notes: adminNotes.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        status: assignTo ? "assigned" : selectedRequest.status,
      };

      // Calculate new SLA deadline based on sla_type
      if (newSlaType !== selectedRequest.sla_type) {
        const now = new Date();
        const days = newSlaType === "urgent" ? 3 : newSlaType === "priority" ? 7 : 14;
        updates.sla_deadline = new Date(now.getTime() + days * 86400000).toISOString();
      }

      if (assignType === "user" && assignTo) {
        updates.assigned_to = assignTo;
        updates.assigned_vendor_id = null;
      } else if (assignType === "vendor" && assignTo) {
        updates.assigned_vendor_id = assignTo;
        updates.assigned_to = null;
      }

      if (selectedRequest.type === "project") {
        const { error } = await supabase
          .from("opportunities")
          .update(updates)
          .eq("id", selectedRequest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("orders")
          .update(updates)
          .eq("id", selectedRequest.id);
        if (error) throw error;
      }

      toast.success("Request berhasil diupdate!");
      setAssignDialog(false);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengupdate request");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering & sorting
  const filtered = requests
    .filter((r) => {
      if (filterType !== "all" && r.type !== filterType) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.user_name?.toLowerCase().includes(q) ||
          r.order_number?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === "sla_deadline") {
        const aVal = a.sla_deadline ? new Date(a.sla_deadline).getTime() : Infinity;
        const bVal = b.sla_deadline ? new Date(b.sla_deadline).getTime() : Infinity;
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aVal = new Date(a.created_at).getTime();
      const bVal = new Date(b.created_at).getTime();
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

  const pendingCount = requests.filter((r) => ["pending", "open"].includes(r.status)).length;
  const overdueCount = requests.filter((r) => r.sla_deadline && isPast(new Date(r.sla_deadline)) && !["completed", "cancelled", "closed"].includes(r.status)).length;

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Request", value: requests.length, icon: FolderKanban, color: "text-primary" },
          { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-500" },
          { label: "Overdue SLA", value: overdueCount, icon: AlertTriangle, color: "text-destructive" },
          { label: "Completed", value: requests.filter((r) => r.status === "completed").length, icon: CheckCircle2, color: "text-emerald-500" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari judul, nama user, atau nomor order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="project">Project Request</SelectItem>
            <SelectItem value="service">Service Order</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSortField((f) => (f === "sla_deadline" ? "created_at" : "sla_deadline"));
          }}
          className="gap-1.5"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortField === "sla_deadline" ? "SLA" : "Tanggal"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </Button>
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Tidak ada request yang ditemukan.
          </div>
        )}
        {filtered.map((req) => {
          const isOverdue = req.sla_deadline && isPast(new Date(req.sla_deadline)) && !["completed", "cancelled", "closed"].includes(req.status);
          const isExpanded = expandedId === req.id;

          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card border rounded-lg overflow-hidden transition-colors ${isOverdue ? "border-destructive/40" : "border-border"}`}
            >
              {/* Header row */}
              <div
                className="p-4 flex items-start gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : req.id)}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${req.type === "project" ? "bg-blue-500/10" : "bg-primary/10"}`}>
                  {req.type === "project" ? (
                    <FolderKanban className="w-4 h-4 text-blue-500" />
                  ) : (
                    <ShoppingCart className="w-4 h-4 text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{req.title}</h3>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[req.status] || ""}`}>
                      {req.status}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] border ${slaColors[req.sla_type] || slaColors.normal}`}>
                      SLA: {req.sla_type}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-[10px]">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {req.user_name}
                    </span>
                    {req.order_number && <span>#{req.order_number}</span>}
                    <span>{format(new Date(req.created_at), "dd MMM yyyy", { locale: localeId })}</span>
                    {req.sla_deadline && (
                      <span className={isOverdue ? "text-destructive font-medium" : ""}>
                        <Clock className="w-3 h-3 inline mr-0.5" />
                        {formatDistanceToNow(new Date(req.sla_deadline), { addSuffix: true, locale: localeId })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openAssignDialog(req); }}>
                    Assign
                  </Button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                  {req.description && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Deskripsi</Label>
                      <p className="text-sm text-foreground mt-0.5">{req.description}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {req.type === "project" && req.category && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Kategori</Label>
                        <p className="text-foreground">{req.category}</p>
                      </div>
                    )}
                    {req.type === "project" && (req.budget_min || req.budget_max) && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Budget</Label>
                        <p className="text-foreground">
                          {req.budget_min?.toLocaleString("id-ID")} - {req.budget_max?.toLocaleString("id-ID")}
                        </p>
                      </div>
                    )}
                    {req.type === "service" && req.items && (
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground">Service</Label>
                          <p className="text-foreground">{req.service_slug}</p>
                        </div>
                        {(req.items as any)?.urgency && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Urgensi</Label>
                            <p className="text-foreground">{(req.items as any).urgency}</p>
                          </div>
                        )}
                        {(req.items as any)?.budget_range && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Budget Range</Label>
                            <p className="text-foreground">{(req.items as any).budget_range}</p>
                          </div>
                        )}
                      </>
                    )}
                    {req.sla_deadline && (
                      <div>
                        <Label className="text-xs text-muted-foreground">SLA Deadline</Label>
                        <p className={`font-medium ${isOverdue ? "text-destructive" : "text-foreground"}`}>
                          {format(new Date(req.sla_deadline), "dd MMM yyyy HH:mm", { locale: localeId })}
                        </p>
                      </div>
                    )}
                    {req.assigned_to && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Assigned To (User)</Label>
                        <p className="text-foreground">{req.assigned_to}</p>
                      </div>
                    )}
                    {req.assigned_vendor_id && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Assigned Vendor</Label>
                        <p className="text-foreground">{req.assigned_vendor_id}</p>
                      </div>
                    )}
                  </div>

                  {req.type === "project" && req.skills_required && req.skills_required.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Skills Required</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {req.skills_required.map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {req.admin_notes && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Admin Notes</Label>
                      <p className="text-sm text-foreground bg-muted/50 rounded-md p-2 mt-0.5">{req.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Assignment Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign & Set SLA</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">{selectedRequest.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedRequest.type === "project" ? "Project Request" : "Service Order"} • oleh {selectedRequest.user_name}
                </p>
              </div>

              {/* SLA Type */}
              <div className="space-y-2">
                <Label>SLA Type</Label>
                <Select value={newSlaType} onValueChange={setNewSlaType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal — 14 hari</SelectItem>
                    <SelectItem value="priority">Priority — 7 hari</SelectItem>
                    <SelectItem value="urgent">Urgent — 3 hari</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignment type */}
              <div className="space-y-2">
                <Label>Assign Ke</Label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setAssignType("user")}
                    className={`p-2.5 rounded-lg border text-sm font-medium transition-all text-center flex items-center justify-center gap-2 ${assignType === "user" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  >
                    <User className="w-4 h-4" /> User / Talent
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignType("vendor")}
                    className={`p-2.5 rounded-lg border text-sm font-medium transition-all text-center flex items-center justify-center gap-2 ${assignType === "vendor" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  >
                    <Building2 className="w-4 h-4" /> Vendor
                  </button>
                </div>

                <Select value={assignTo} onValueChange={setAssignTo}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Pilih ${assignType === "user" ? "user/talent" : "vendor"}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignOptions
                      .filter((o) => o.type === assignType)
                      .map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  placeholder="Catatan internal untuk assignment ini..."
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>Batal</Button>
            <Button onClick={handleAssign} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRequests;
