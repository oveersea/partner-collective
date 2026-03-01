import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, Briefcase, Clock, CheckCircle2 } from "lucide-react";

interface HiringRequest {
  id: string;
  role_title: string;
  sla_type: string;
  status: string;
  quantity: number;
  credit_cost: number;
  sla_deadline: string | null;
  created_at: string;
  business_profiles: { name: string } | null;
}

interface ShortageAlert {
  id: string;
  skill_tags: string[];
  shortage_count: number;
  status: string;
  sla_type: string;
  created_at: string;
}

const AdminHiring = () => {
  const [requests, setRequests] = useState<HiringRequest[]>([]);
  const [alerts, setAlerts] = useState<ShortageAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"requests" | "alerts">("requests");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [reqRes, alertRes] = await Promise.all([
      supabase
        .from("hiring_requests")
        .select("id, role_title, sla_type, status, quantity, credit_cost, sla_deadline, created_at, business_profiles(name)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("talent_shortage_alerts")
        .select("id, skill_tags, shortage_count, status, sla_type, created_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (reqRes.data) setRequests(reqRes.data as unknown as HiringRequest[]);
    if (alertRes.data) setAlerts(alertRes.data as unknown as ShortageAlert[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("hiring_requests").update({ status }).eq("id", id);
    if (error) toast.error("Gagal update status");
    else { toast.success("Status diperbarui"); fetchData(); }
  };

  const slaColor = (type: string) => type === "fast" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground";

  const statusColor = (s: string) => {
    if (s === "open") return "bg-blue-500/10 text-blue-600";
    if (s === "sourcing") return "bg-amber-500/10 text-amber-600";
    if (s === "filled") return "bg-primary/10 text-primary";
    if (s === "cancelled") return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  const filteredReqs = requests.filter(
    (r) => r.role_title.toLowerCase().includes(search.toLowerCase()) ||
      (r.business_profiles?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Hiring & Matchmaking</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari role atau perusahaan..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button size="sm" variant={tab === "requests" ? "default" : "outline"} onClick={() => setTab("requests")}>
          <Briefcase className="w-4 h-4 mr-1" /> Hiring Requests
        </Button>
        <Button size="sm" variant={tab === "alerts" ? "default" : "outline"} onClick={() => setTab("alerts")}>
          <AlertTriangle className="w-4 h-4 mr-1" /> Shortage Alerts ({alerts.filter(a => a.status === "open").length})
        </Button>
      </div>

      {tab === "requests" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Perusahaan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">SLA</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kredit</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Deadline</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-border"><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                  ))
                ) : filteredReqs.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                ) : (
                  filteredReqs.map((r) => (
                    <tr key={r.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{r.role_title}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{r.business_profiles?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${slaColor(r.sla_type)}`}>{r.sla_type}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{r.quantity}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground font-mono text-xs">{r.credit_cost}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {r.sla_deadline ? new Date(r.sla_deadline).toLocaleDateString("id-ID") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === "open" && (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "sourcing")}>
                              <Clock className="w-3 h-3 mr-1" /> Sourcing
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "filled")}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Filled
                            </Button>
                          </div>
                        )}
                        {r.status === "sourcing" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "filled")}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Filled
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "alerts" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Skills</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kekurangan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">SLA</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Tidak ada shortage alerts</td></tr>
                ) : (
                  alerts.map((a) => (
                    <tr key={a.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {a.skill_tags?.map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-destructive font-bold">{a.shortage_count}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${slaColor(a.sla_type)}`}>{a.sla_type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${a.status === "open" ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(a.created_at).toLocaleDateString("id-ID")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHiring;
