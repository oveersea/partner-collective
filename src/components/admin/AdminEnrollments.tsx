import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Search, ChevronLeft, ChevronRight, ScanBarcode, CheckCircle2,
  XCircle, User, Calendar, Ticket, GraduationCap, QrCode, Hash,
  Clock, Loader2,
} from "lucide-react";

// ─── Types ───
interface ProgramEnrollment {
  id: string;
  order_number: string;
  program_title: string;
  program_slug: string;
  full_name: string;
  email: string;
  phone: string;
  amount: number;
  currency: string;
  status: string;
  package_label: string;
  checked_in_at: string | null;
  check_in_method: string | null;
  created_at: string;
}

interface EventEnrollment {
  id: string;
  order_number: string;
  full_name: string;
  email: string;
  phone: string;
  amount: number;
  currency: string;
  status: string;
  ticket_count: number;
  checked_in_at: string | null;
  check_in_method: string | null;
  created_at: string;
  event_id: string;
  events?: { title: string; oveercode: string | null; start_date: string | null } | null;
}

const PAGE_SIZE = 20;

const formatRupiah = (cents: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents);

const statusColor = (s: string) => {
  switch (s) {
    case "paid": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "pending": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "cancelled": return "bg-destructive/10 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
};

const AdminEnrollments = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("programs");
  const [programOrders, setProgramOrders] = useState<ProgramEnrollment[]>([]);
  const [eventOrders, setEventOrders] = useState<EventEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Scanner modal
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    found: boolean;
    type?: "program" | "event";
    data?: any;
    alreadyCheckedIn?: boolean;
  } | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setPage(1); }, [search, tab]);

  const fetchData = async () => {
    setLoading(true);
    const [programRes, eventRes] = await Promise.all([
      supabase.from("program_orders").select("id, order_number, program_title, program_slug, full_name, email, phone, amount, currency, status, package_label, checked_in_at, check_in_method, created_at").order("created_at", { ascending: false }),
      (supabase.from("event_orders") as any).select("id, order_number, full_name, email, phone, amount, currency, status, ticket_count, checked_in_at, check_in_method, created_at, event_id, events(title, oveercode, start_date)").order("created_at", { ascending: false }),
    ]);
    if (programRes.data) setProgramOrders(programRes.data as ProgramEnrollment[]);
    if (eventRes.data) setEventOrders(eventRes.data as EventEnrollment[]);
    setLoading(false);
  };

  // ─── Filter ───
  const filteredPrograms = programOrders.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.order_number.toLowerCase().includes(search.toLowerCase()) ||
    p.program_title.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredEvents = eventOrders.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.order_number.toLowerCase().includes(search.toLowerCase()) ||
    (e.events?.title || "").toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const currentList = tab === "programs" ? filteredPrograms : filteredEvents;
  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  const paged = currentList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ─── Scanner / Lookup ───
  const handleScan = async () => {
    const code = scanInput.trim().toUpperCase();
    if (!code) return;
    setScanning(true);
    setScanResult(null);

    // Search in program_orders by order_number
    const { data: progData } = await supabase
      .from("program_orders")
      .select("id, order_number, full_name, email, program_title, status, checked_in_at, check_in_method, amount, currency, package_label")
      .or(`order_number.eq.${code}`)
      .maybeSingle();

    if (progData) {
      setScanResult({
        found: true,
        type: "program",
        data: progData,
        alreadyCheckedIn: !!progData.checked_in_at,
      });
      setScanning(false);
      return;
    }

    // Search in event_orders by order_number
    const { data: evtData } = await (supabase.from("event_orders") as any)
      .select("id, order_number, full_name, email, status, checked_in_at, check_in_method, amount, currency, ticket_count, events(title, oveercode, start_date)")
      .or(`order_number.eq.${code}`)
      .maybeSingle();

    if (evtData) {
      setScanResult({
        found: true,
        type: "event",
        data: evtData,
        alreadyCheckedIn: !!evtData.checked_in_at,
      });
      setScanning(false);
      return;
    }

    // Search by user oveercode in profiles then find their orders
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id, full_name, oveercode")
      .eq("oveercode", code)
      .maybeSingle();

    if (profileData) {
      // Find latest program order for this user
      const { data: userProg } = await supabase
        .from("program_orders")
        .select("id, order_number, full_name, email, program_title, status, checked_in_at, check_in_method, amount, currency, package_label")
        .eq("user_id", profileData.user_id)
        .eq("status", "paid")
        .is("checked_in_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userProg) {
        setScanResult({ found: true, type: "program", data: userProg, alreadyCheckedIn: false });
        setScanning(false);
        return;
      }

      // Find latest event order for this user
      const { data: userEvt } = await (supabase.from("event_orders") as any)
        .select("id, order_number, full_name, email, status, checked_in_at, check_in_method, amount, currency, ticket_count, events(title, oveercode, start_date)")
        .eq("user_id", profileData.user_id)
        .eq("status", "paid")
        .is("checked_in_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userEvt) {
        setScanResult({ found: true, type: "event", data: userEvt, alreadyCheckedIn: false });
        setScanning(false);
        return;
      }
    }

    setScanResult({ found: false });
    setScanning(false);
  };

  const handleCheckIn = async (type: "program" | "event", id: string, method: string) => {
    const table = type === "program" ? "program_orders" : "event_orders";
    const { error } = await (supabase.from(table) as any)
      .update({
        checked_in_at: new Date().toISOString(),
        check_in_method: method,
        checked_in_by: user?.id,
      })
      .eq("id", id);

    if (error) {
      toast.error("Gagal melakukan check-in");
      return;
    }

    toast.success("✅ Check-in berhasil!");
    setScanResult(prev => prev ? { ...prev, alreadyCheckedIn: true, data: { ...prev.data, checked_in_at: new Date().toISOString() } } : null);
    fetchData();
  };

  const handleManualCheckIn = async (type: "program" | "event", id: string) => {
    handleCheckIn(type, id, "manual");
  };

  // Stats
  const progPaid = programOrders.filter(p => p.status === "paid").length;
  const progCheckedIn = programOrders.filter(p => p.checked_in_at).length;
  const evtPaid = eventOrders.filter(e => e.status === "paid").length;
  const evtCheckedIn = eventOrders.filter(e => e.checked_in_at).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Enrollment & Check-in</h2>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Cari nama, order, email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => { setScannerOpen(true); setScanInput(""); setScanResult(null); setTimeout(() => scanInputRef.current?.focus(), 100); }} className="gap-2">
            <ScanBarcode className="w-4 h-4" /> Scan / Validasi
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{progPaid}</p>
          <p className="text-xs text-muted-foreground">Program Terdaftar</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{progCheckedIn}</p>
          <p className="text-xs text-muted-foreground">Program Checked-in</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{evtPaid}</p>
          <p className="text-xs text-muted-foreground">Event Tickets</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{evtCheckedIn}</p>
          <p className="text-xs text-muted-foreground">Event Checked-in</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="programs" className="gap-2"><GraduationCap className="w-4 h-4" /> Program Enrollments</TabsTrigger>
          <TabsTrigger value="events" className="gap-2"><Ticket className="w-4 h-4" /> Event Tickets</TabsTrigger>
        </TabsList>

        {/* Programs Tab */}
        <TabsContent value="programs">
          <div className="bg-card rounded-[5px] border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Peserta</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Program</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Paket</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Harga</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Check-in</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-border"><td colSpan={9} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                    ))
                  ) : (paged as ProgramEnrollment[]).length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                  ) : (
                    (paged as ProgramEnrollment[]).map(p => (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.order_number}</td>
                        <td className="px-4 py-3">
                          <div className="text-foreground text-xs font-medium">{p.full_name}</div>
                          <div className="text-muted-foreground text-[11px]">{p.email}</div>
                        </td>
                        <td className="px-4 py-3 text-foreground text-xs max-w-[200px] truncate">{p.program_title}</td>
                        <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{p.package_label}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{p.amount === 0 ? "Free" : formatRupiah(p.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor(p.status)}`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {p.checked_in_at ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {new Date(p.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString("id-ID")}</td>
                        <td className="px-4 py-3">
                          {p.status === "paid" && !p.checked_in_at ? (
                            <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => handleManualCheckIn("program", p.id)}>
                              <CheckCircle2 className="w-3 h-3" /> Check-in
                            </Button>
                          ) : p.checked_in_at ? (
                            <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">✓ Done</Badge>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loading && currentList.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {Math.min((page - 1) * PAGE_SIZE + 1, currentList.length)}–{Math.min(page * PAGE_SIZE, currentList.length)} dari {currentList.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                  <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
                  <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <div className="bg-card rounded-[5px] border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Peserta</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Event</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tickets</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Harga</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Check-in</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-border"><td colSpan={9} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                    ))
                  ) : (paged as EventEnrollment[]).length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
                  ) : (
                    (paged as EventEnrollment[]).map(e => (
                      <tr key={e.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.order_number}</td>
                        <td className="px-4 py-3">
                          <div className="text-foreground text-xs font-medium">{e.full_name}</div>
                          <div className="text-muted-foreground text-[11px]">{e.email}</div>
                        </td>
                        <td className="px-4 py-3 text-foreground text-xs max-w-[200px] truncate">{e.events?.title || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{e.ticket_count}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{e.amount === 0 ? "Free" : formatRupiah(e.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor(e.status)}`}>{e.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {e.checked_in_at ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {new Date(e.checked_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(e.created_at).toLocaleDateString("id-ID")}</td>
                        <td className="px-4 py-3">
                          {e.status === "paid" && !e.checked_in_at ? (
                            <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => handleManualCheckIn("event", e.id)}>
                              <CheckCircle2 className="w-3 h-3" /> Check-in
                            </Button>
                          ) : e.checked_in_at ? (
                            <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">✓ Done</Badge>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loading && currentList.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {Math.min((page - 1) * PAGE_SIZE + 1, currentList.length)}–{Math.min(page * PAGE_SIZE, currentList.length)} dari {currentList.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                  <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
                  <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Scanner / Validator Dialog */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanBarcode className="w-5 h-5 text-primary" />
              Scan & Validasi Check-in
            </DialogTitle>
            <DialogDescription>
              Masukkan Order Number atau Oveercode peserta untuk validasi kehadiran.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={scanInputRef}
                  className="pl-9 font-mono uppercase"
                  placeholder="PO-20260306-0001 atau oveercode..."
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleScan(); }}
                  autoFocus
                />
              </div>
              <Button onClick={handleScan} disabled={scanning || !scanInput.trim()}>
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              💡 Gunakan barcode scanner untuk otomatis input. Bisa scan Order Number (PO-xxx, EV-xxx) atau Oveercode peserta.
            </p>

            <Separator />

            {/* Result */}
            {scanResult && (
              <div className="space-y-3">
                {!scanResult.found ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <XCircle className="w-8 h-8 text-destructive shrink-0" />
                    <div>
                      <p className="font-semibold text-destructive text-sm">Tidak Ditemukan</p>
                      <p className="text-xs text-muted-foreground">Kode "{scanInput}" tidak cocok dengan order atau oveercode manapun.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Info Card */}
                    <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          {scanResult.type === "program" ? "Program" : "Event"}
                        </Badge>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor(scanResult.data.status)}`}>
                          {scanResult.data.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground text-sm">{scanResult.data.full_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{scanResult.data.email}</p>

                      <Separator />

                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {scanResult.type === "program" ? scanResult.data.program_title : scanResult.data.events?.title}
                          </span>
                        </p>
                        <p className="font-mono text-muted-foreground">{scanResult.data.order_number}</p>
                        <p className="text-muted-foreground">{scanResult.data.amount === 0 ? "Free" : formatRupiah(scanResult.data.amount)}</p>
                      </div>
                    </div>

                    {/* Check-in Action */}
                    {scanResult.alreadyCheckedIn ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-green-700 dark:text-green-400 text-sm">Sudah Check-in</p>
                          <p className="text-xs text-muted-foreground">
                            Peserta sudah check-in pada {new Date(scanResult.data.checked_in_at).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ) : scanResult.data.status !== "paid" ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                        <Clock className="w-8 h-8 text-yellow-600 shrink-0" />
                        <div>
                          <p className="font-semibold text-yellow-700 dark:text-yellow-400 text-sm">Belum Lunas</p>
                          <p className="text-xs text-muted-foreground">Pembayaran belum selesai, tidak bisa check-in.</p>
                        </div>
                      </div>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        size="lg"
                        onClick={() => handleCheckIn(scanResult.type!, scanResult.data.id, "barcode")}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Konfirmasi Check-in
                      </Button>
                    )}
                  </div>
                )}

                {/* Reset */}
                <Button
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => { setScanInput(""); setScanResult(null); scanInputRef.current?.focus(); }}
                >
                  Scan Berikutnya
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEnrollments;
