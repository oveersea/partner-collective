import { useEffect, useState, useMemo } from "react";
import HiringCandidatePanel from "@/components/admin/HiringCandidatePanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { format, formatDistanceToNow, isPast, differenceInHours } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  FolderKanban, ShoppingCart, Clock, AlertTriangle, CheckCircle2,
  User, Building2, ChevronDown, ChevronUp, Send, Loader2, Search,
  Filter, ArrowUpDown, Zap, TrendingUp, XCircle, BarChart3, Trash2,
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type RequestType = "project" | "service" | "hiring";

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
  category?: string;
  skills_required?: string[];
  budget_min?: number | null;
  budget_max?: number | null;
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

type TabKey = "all" | "urgent" | "pending" | "assigned" | "overdue" | "completed" | "shortage";

interface ShortageAlert {
  id: string;
  skill_tags: string[];
  shortage_count: number;
  status: string;
  sla_type: string;
  created_at: string;
}

const AdminRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UnifiedRequest[]>([]);
  const [shortageAlerts, setShortageAlerts] = useState<ShortageAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | RequestType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"created_at" | "sla_deadline">("sla_deadline");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);
  const [assignOptions, setAssignOptions] = useState<AssignOption[]>([]);
  const [assignTo, setAssignTo] = useState("");
  const [assignType, setAssignType] = useState<"user" | "vendor">("user");
  const [newSlaType, setNewSlaType] = useState("normal");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UnifiedRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .then(({ data }) => {
          setIsSuperadmin(data?.some((r: any) => r.role === "superadmin") ?? false);
        });
    }
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);

    const [projectsRes, ordersRes, hiringRes, shortageRes] = await Promise.all([
      supabase
        .from("opportunities")
        .select("id, title, description, status, sla_type, sla_deadline, assigned_to, assigned_vendor_id, admin_notes, created_at, user_id, category, skills_required, budget_min, budget_max")
        .eq("job_type", "project")
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id, order_number, service_slug, items, status, sla_type, sla_deadline, assigned_to, assigned_vendor_id, admin_notes, created_at, user_id")
        .order("created_at", { ascending: false }),
      supabase
        .from("hiring_requests")
        .select("id, title, description, hiring_type, status, positions_count, required_skills, credit_cost, sla_deadline, oveercode, created_at, client_id, business_id, business_profiles(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("talent_shortage_alerts")
        .select("id, skill_tags, shortage_count, status, sla_type, created_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const projects = projectsRes.data || [];
    const orders = ordersRes.data || [];
    const hiringData = hiringRes.data || [];

    // Resolve client_id → user_id for hiring requests
    const clientIds = hiringData.map((h: any) => h.client_id).filter(Boolean);
    const uniqueClientIds = [...new Set(clientIds)];
    const { data: clientProfiles } = uniqueClientIds.length > 0
      ? await supabase.from("client_profiles").select("id, user_id").in("id", uniqueClientIds)
      : { data: [] };
    const clientToUser = new Map((clientProfiles || []).map((c: any) => [c.id, c.user_id]));

    const userIds = [
      ...projects.map((p: any) => p.user_id),
      ...orders.map((o: any) => o.user_id),
      ...hiringData.map((h: any) => clientToUser.get(h.client_id)).filter(Boolean),
    ];

    const uniqueUserIds = [...new Set(userIds)];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", uniqueUserIds.length > 0 ? uniqueUserIds : ["00000000-0000-0000-0000-000000000000"]);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));

    const unified: UnifiedRequest[] = [
      ...projects.map((p: any) => ({
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
      ...orders.map((o: any) => ({
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
      ...hiringData.map((h: any) => {
        const resolvedUserId = clientToUser.get(h.client_id) || "";
        return {
          id: h.id,
          type: "hiring" as RequestType,
          title: h.title,
          description: h.description,
          status: h.status,
          sla_type: h.hiring_type === "fast" ? "urgent" : "normal",
          sla_deadline: h.sla_deadline,
          assigned_to: null,
          assigned_vendor_id: null,
          admin_notes: null,
          created_at: h.created_at,
          user_id: resolvedUserId,
          user_name: profileMap.get(resolvedUserId) || ((h.business_profiles as any)?.name) || "—",
          category: h.hiring_type,
          skills_required: h.required_skills || [],
          order_number: h.oveercode,
        };
      }),
    ];

    setRequests(unified);
    setShortageAlerts((shortageRes.data || []) as unknown as ShortageAlert[]);
    setLoading(false);
  };

  // Stats
  const stats = useMemo(() => {
    const active = requests.filter(r => !["completed", "cancelled", "closed"].includes(r.status));
    const pending = requests.filter(r => ["pending", "open"].includes(r.status));
    const assigned = requests.filter(r => ["assigned", "in_progress"].includes(r.status));
    const overdue = active.filter(r => r.sla_deadline && isPast(new Date(r.sla_deadline)));
    const urgent = active.filter(r => r.sla_type === "urgent");
    const completed = requests.filter(r => r.status === "completed");
    const projectCount = requests.filter(r => r.type === "project").length;
    const serviceCount = requests.filter(r => r.type === "service").length;
    const hiringCount = requests.filter(r => r.type === "hiring").length;

    // SLA health: percentage of active that are NOT overdue
    const slaHealth = active.length > 0 ? Math.round(((active.length - overdue.length) / active.length) * 100) : 100;

    return { total: requests.length, pending: pending.length, assigned: assigned.length, overdue: overdue.length, urgent: urgent.length, completed: completed.length, projectCount, serviceCount, hiringCount, slaHealth, activeCount: active.length };
  }, [requests]);

  // Tab filtering
  const tabFiltered = useMemo(() => {
    let result = requests;
    switch (activeTab) {
      case "urgent":
        result = result.filter(r => r.sla_type === "urgent" && !["completed", "cancelled", "closed"].includes(r.status));
        break;
      case "pending":
        result = result.filter(r => ["pending", "open"].includes(r.status));
        break;
      case "assigned":
        result = result.filter(r => ["assigned", "in_progress"].includes(r.status));
        break;
      case "overdue":
        result = result.filter(r => r.sla_deadline && isPast(new Date(r.sla_deadline)) && !["completed", "cancelled", "closed"].includes(r.status));
        break;
      case "completed":
        result = result.filter(r => r.status === "completed");
        break;
    }
    if (filterType !== "all") result = result.filter(r => r.type === filterType);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.user_name?.toLowerCase().includes(q) ||
        r.order_number?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      if (sortField === "sla_deadline") {
        const aVal = a.sla_deadline ? new Date(a.sla_deadline).getTime() : Infinity;
        const bVal = b.sla_deadline ? new Date(b.sla_deadline).getTime() : Infinity;
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [requests, activeTab, filterType, searchQuery, sortField, sortDir]);

  const fetchAssignOptions = async () => {
    const { data: users } = await supabase
      .from("profiles").select("user_id, full_name").not("full_name", "eq", "").order("full_name").limit(100);
    const { data: vendors } = await supabase
      .from("business_profiles").select("id, name").order("name").limit(100);
    setAssignOptions([
      ...(users || []).map(u => ({ id: u.user_id, label: u.full_name || u.user_id, type: "user" as const })),
      ...(vendors || []).map(v => ({ id: v.id, label: v.name, type: "vendor" as const })),
    ]);
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
      if (newSlaType !== selectedRequest.sla_type) {
        const days = newSlaType === "urgent" ? 3 : newSlaType === "priority" ? 7 : 14;
        updates.sla_deadline = new Date(Date.now() + days * 86400000).toISOString();
      }
      if (assignType === "user" && assignTo) { updates.assigned_to = assignTo; updates.assigned_vendor_id = null; }
      else if (assignType === "vendor" && assignTo) { updates.assigned_vendor_id = assignTo; updates.assigned_to = null; }

      const table = selectedRequest.type === "project" ? "opportunities" : selectedRequest.type === "hiring" ? "hiring_requests" : "orders";
      const { error } = await supabase.from(table).update(updates).eq("id", selectedRequest.id);
      if (error) throw error;
      toast.success("Request updated successfully!");
      setAssignDialog(false);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to update request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (req: UnifiedRequest, newStatus: string) => {
    try {
      const table = req.type === "project" ? "opportunities" : req.type === "hiring" ? "hiring_requests" : "orders";
      const { error } = await supabase.from(table).update({ status: newStatus }).eq("id", req.id);
      if (error) throw error;
      toast.success(`Status changed to ${newStatus}`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to change status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !isSuperadmin) return;
    setDeleting(true);
    try {
      const table = deleteTarget.type === "project" ? "opportunities" : deleteTarget.type === "hiring" ? "hiring_requests" : "orders";
      const { error } = await supabase.from(table).delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Request deleted successfully");
      setDeleteDialog(false);
      setDeleteTarget(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete request");
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (req: UnifiedRequest) => {
    setDeleteTarget(req);
    setDeleteDialog(true);
  };

  // SLA remaining helper
  const getSlaProgress = (req: UnifiedRequest) => {
    if (!req.sla_deadline) return null;
    const deadline = new Date(req.sla_deadline);
    const created = new Date(req.created_at);
    const total = deadline.getTime() - created.getTime();
    const elapsed = Date.now() - created.getTime();
    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const hoursLeft = differenceInHours(deadline, new Date());
    return { pct, hoursLeft, isOverdue: hoursLeft < 0 };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const openShortageAlerts = shortageAlerts.filter(a => a.status === "open").length;

  const tabs: { key: TabKey; label: string; count: number; icon: typeof Clock; color?: string }[] = [
    { key: "all", label: "All", count: stats.total, icon: FolderKanban },
    { key: "urgent", label: "Urgent", count: stats.urgent, icon: Zap, color: "text-destructive" },
    { key: "pending", label: "Pending", count: stats.pending, icon: Clock, color: "text-amber-500" },
    { key: "assigned", label: "In Progress", count: stats.assigned, icon: TrendingUp, color: "text-blue-500" },
    { key: "overdue", label: "Overdue", count: stats.overdue, icon: AlertTriangle, color: "text-destructive" },
    { key: "completed", label: "Completed", count: stats.completed, icon: CheckCircle2, color: "text-emerald-500" },
    { key: "shortage", label: "Shortage Alerts", count: openShortageAlerts, icon: AlertTriangle, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Command Center Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active requests */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5 col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</span>
            <FolderKanban className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.activeCount}</p>
          <div className="flex gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><FolderKanban className="w-3 h-3" /> {stats.projectCount} project</span>
            <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> {stats.serviceCount} service</span>
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {stats.hiringCount} hiring</span>
          </div>
        </motion.div>

        {/* SLA Health */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SLA Health</span>
            <BarChart3 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className={`text-3xl font-bold ${stats.slaHealth >= 80 ? "text-emerald-500" : stats.slaHealth >= 50 ? "text-amber-500" : "text-destructive"}`}>
            {stats.slaHealth}%
          </p>
          <Progress value={stats.slaHealth} className="mt-2 h-1.5" />
        </motion.div>

        {/* Overdue */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={() => setActiveTab("overdue")}
          className={`bg-card border rounded-xl p-5 cursor-pointer transition-all hover:bg-muted/40 ${stats.overdue > 0 ? "border-destructive/30 bg-destructive/5" : "border-border"}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overdue</span>
            <AlertTriangle className={`w-4 h-4 ${stats.overdue > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </div>
          <p className={`text-3xl font-bold ${stats.overdue > 0 ? "text-destructive" : "text-foreground"}`}>{stats.overdue}</p>
          <p className="text-xs text-muted-foreground mt-1">requests past deadline</p>
        </motion.div>

        {/* Urgent */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onClick={() => setActiveTab("urgent")}
          className={`bg-card border rounded-xl p-5 cursor-pointer transition-all hover:bg-muted/40 ${stats.urgent > 0 ? "border-amber-500/30 bg-amber-500/5" : "border-border"}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Urgent SLA</span>
            <Zap className={`w-4 h-4 ${stats.urgent > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </div>
          <p className={`text-3xl font-bold ${stats.urgent > 0 ? "text-amber-600" : "text-foreground"}`}>{stats.urgent}</p>
          <p className="text-xs text-muted-foreground mt-1">3-day deadline</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-px">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.key ? (tab.color || "text-primary") : ""}`} />
            {tab.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search title, user name, or order number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="project">Project Request</SelectItem>
            <SelectItem value="service">Service Order</SelectItem>
            <SelectItem value="hiring">Hiring Request</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setSortField(f => f === "sla_deadline" ? "created_at" : "sla_deadline")} className="gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortField === "sla_deadline" ? "SLA" : "Date"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}>
          {sortDir === "asc" ? "↑" : "↓"}
        </Button>
      </div>

      {/* Shortage Alerts Tab */}
      {activeTab === "shortage" ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Skills</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Shortage</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">SLA</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {shortageAlerts.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No shortage alerts</td></tr>
                ) : (
                  shortageAlerts.map((a) => (
                    <tr key={a.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {a.skill_tags?.map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-destructive font-semibold">{a.shortage_count}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${a.sla_type === "fast" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{a.sla_type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${a.status === "open" ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(a.created_at).toLocaleDateString("en-US")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
      /* Request List */
      <div className="space-y-3">
        {tabFiltered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
            <p className="font-medium">No requests in this tab.</p>
          </div>
        )}
        {tabFiltered.map((req) => {
          const sla = getSlaProgress(req);
          const isOverdue = sla?.isOverdue && !["completed", "cancelled", "closed"].includes(req.status);
          const isExpanded = expandedId === req.id;

          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-card border rounded-xl overflow-hidden transition-colors ${isOverdue ? "border-destructive/40" : "border-border"}`}
            >
              <div
                className="p-4 flex items-start gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : req.id)}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${req.type === "project" ? "bg-blue-500/10" : req.type === "hiring" ? "bg-amber-500/10" : "bg-primary/10"}`}>
                  {req.type === "project" ? <FolderKanban className="w-4 h-4 text-blue-500" /> : req.type === "hiring" ? <User className="w-4 h-4 text-amber-500" /> : <ShoppingCart className="w-4 h-4 text-primary" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{req.title}</h3>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[req.status] || ""}`}>{req.status}</Badge>
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
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {req.user_name}</span>
                    {req.order_number && <span>#{req.order_number}</span>}
                    <span>{format(new Date(req.created_at), "dd MMM yyyy", { locale: localeId })}</span>
                    {req.sla_deadline && (
                      <span className={isOverdue ? "text-destructive font-medium" : ""}>
                        <Clock className="w-3 h-3 inline mr-0.5" />
                        {formatDistanceToNow(new Date(req.sla_deadline), { addSuffix: true, locale: localeId })}
                      </span>
                    )}
                  </div>

                  {/* SLA progress bar */}
                  {sla && !["completed", "cancelled", "closed"].includes(req.status) && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 max-w-[200px]">
                        <Progress
                          value={sla.pct}
                          className={`h-1 ${sla.isOverdue ? "[&>div]:bg-destructive" : sla.pct > 75 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
                        />
                      </div>
                      <span className={`text-[10px] font-medium ${sla.isOverdue ? "text-destructive" : sla.hoursLeft < 24 ? "text-amber-500" : "text-muted-foreground"}`}>
                        {sla.isOverdue ? `${Math.abs(sla.hoursLeft)}h overdue` : `${sla.hoursLeft}h left`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!["completed", "cancelled", "closed"].includes(req.status) && (
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openAssignDialog(req); }}>
                      Assign
                    </Button>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                  {req.description && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <p className="text-sm text-foreground mt-0.5">{req.description}</p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {req.type === "project" && req.category && (
                      <div><Label className="text-xs text-muted-foreground">Category</Label><p className="text-foreground">{req.category}</p></div>
                    )}
                    {req.type === "project" && (req.budget_min || req.budget_max) && (
                      <div><Label className="text-xs text-muted-foreground">Budget</Label><p className="text-foreground">{req.budget_min?.toLocaleString("id-ID")} - {req.budget_max?.toLocaleString("id-ID")}</p></div>
                    )}
                    {req.type === "service" && req.items && (
                      <>
                        <div><Label className="text-xs text-muted-foreground">Service</Label><p className="text-foreground">{req.service_slug}</p></div>
                        {(req.items as any)?.urgency && (
                          <div><Label className="text-xs text-muted-foreground">Urgency</Label><p className="text-foreground">{(req.items as any).urgency}</p></div>
                        )}
                        {(req.items as any)?.budget_range && (
                          <div><Label className="text-xs text-muted-foreground">Budget Range</Label><p className="text-foreground">{(req.items as any).budget_range}</p></div>
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
                      <div><Label className="text-xs text-muted-foreground">Assigned To</Label><p className="text-foreground">{req.assigned_to}</p></div>
                    )}
                    {req.assigned_vendor_id && (
                      <div><Label className="text-xs text-muted-foreground">Assigned Vendor</Label><p className="text-foreground">{req.assigned_vendor_id}</p></div>
                    )}
                  </div>

                  {req.type === "project" && req.skills_required && req.skills_required.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Skills Required</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {req.skills_required.map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hiring Candidate Matching Panel */}
                  {req.type === "hiring" && (
                    <div className="border-t border-border pt-3">
                      <HiringCandidatePanel
                        hiringRequestId={req.id}
                        requiredSkills={req.skills_required || []}
                      />
                    </div>
                  )}

                  {req.admin_notes && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Admin Notes</Label>
                      <p className="text-sm text-foreground bg-muted/50 rounded-md p-2 mt-0.5">{req.admin_notes}</p>
                    </div>
                  )}

                  {/* Quick status actions */}
                  {!["completed", "cancelled", "closed"].includes(req.status) && (
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => handleQuickStatusChange(req, "completed")}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                      </Button>
                       <Button size="sm" variant="outline" className="gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/5"
                        onClick={() => handleQuickStatusChange(req, "cancelled")}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </Button>
                      {isSuperadmin && (
                        <Button size="sm" variant="destructive" className="gap-1.5"
                          onClick={() => openDeleteDialog(req)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      )}

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
                  {selectedRequest.type === "project" ? "Project Request" : selectedRequest.type === "hiring" ? "Hiring Request" : "Service Order"} • by {selectedRequest.user_name}
                </p>
              </div>
              <div className="space-y-2">
                <Label>SLA Type</Label>
                <Select value={newSlaType} onValueChange={setNewSlaType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal — 14 days</SelectItem>
                    <SelectItem value="priority">Priority — 7 days</SelectItem>
                    <SelectItem value="urgent">Urgent — 3 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button type="button" onClick={() => setAssignType("user")}
                    className={`p-2.5 rounded-lg border text-sm font-medium transition-all text-center flex items-center justify-center gap-2 ${assignType === "user" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  ><User className="w-4 h-4" /> User / Talent</button>
                  <button type="button" onClick={() => setAssignType("vendor")}
                    className={`p-2.5 rounded-lg border text-sm font-medium transition-all text-center flex items-center justify-center gap-2 ${assignType === "vendor" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  ><Building2 className="w-4 h-4" /> Vendor</button>
                </div>
                <Select value={assignTo} onValueChange={setAssignTo}>
                  <SelectTrigger><SelectValue placeholder={`Select ${assignType === "user" ? "user/talent" : "vendor"}...`} /></SelectTrigger>
                  <SelectContent>
                    {assignOptions.filter(o => o.type === assignType).map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea placeholder="Internal notes..." rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>"{deleteTarget?.title}"</strong>? This action cannot be undone.
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

export default AdminRequests;
