import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/components/ui/country-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Building2, MapPin, Globe, ChevronLeft, ChevronRight, ExternalLink,
  MoreVertical, Shield, ShieldCheck, ShieldX, Users, Plus, Crown, X, Loader2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Company {
  id: string;
  name: string;
  slug: string;
  oveercode: string | null;
  kyc_status: string;
  industry: string | null;
  city: string | null;
  country: string | null;
  company_size: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

const AdminCompanies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [oppCounts, setOppCounts] = useState<Record<string, number>>({});
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  // Create company
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCountry, setNewCountry] = useState("Indonesia");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<{ user_id: string; full_name: string }[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [searchingOwner, setSearchingOwner] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [compRes, oppRes, memRes] = await Promise.all([
      supabase.from("business_profiles").select("id, name, slug, oveercode, kyc_status, industry, city, country, company_size, email, phone, website, created_at").eq("business_type", "company").order("created_at", { ascending: false }),
      supabase.from("opportunities").select("business_id"),
      supabase.from("business_members").select("business_id"),
    ]);
    if (compRes.data) setCompanies(compRes.data as Company[]);
    if (compRes.error) toast.error("Failed to load company data");
    if (oppRes.data) {
      const counts: Record<string, number> = {};
      oppRes.data.forEach((o: any) => { if (o.business_id) counts[o.business_id] = (counts[o.business_id] || 0) + 1; });
      setOppCounts(counts);
    }
    if (memRes.data) {
      const counts: Record<string, number> = {};
      memRes.data.forEach((m: any) => { if (m.business_id) counts[m.business_id] = (counts[m.business_id] || 0) + 1; });
      setMemberCounts(counts);
    }
    setLoading(false);
  };

  const updateKycStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("business_profiles").update({ kyc_status: status }).eq("id", id);
    if (error) toast.error("Failed to update status: " + error.message);
    else {
      toast.success(`KYC status changed to "${status}"`);
      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, kyc_status: status } : c)));
    }
  };

  // ── Create Company ──
  const searchOwnerFn = async (q: string) => {
    setOwnerSearch(q);
    if (q.length < 2) { setOwnerResults([]); return; }
    setSearchingOwner(true);
    const { data } = await supabase.from("profiles").select("user_id, full_name").ilike("full_name", `%${q}%`).limit(10);
    setOwnerResults(data || []);
    setSearchingOwner(false);
  };

  const createCompany = async () => {
    if (!newName.trim()) { toast.error("Nama company wajib diisi"); return; }
    if (!selectedOwnerId) { toast.error("Pilih owner untuk company"); return; }
    setCreating(true);
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let oveercode = "C";
    for (let i = 0; i < 8; i++) oveercode += chars.charAt(Math.floor(Math.random() * chars.length));

    const { data: bp, error: bpErr } = await supabase
      .from("business_profiles")
      .insert({
        name: newName.trim(), slug, oveercode, business_type: "company",
        industry: newIndustry.trim() || null, city: newCity.trim() || null,
        country: newCountry.trim() || null, created_by: selectedOwnerId, kyc_status: "unverified",
      })
      .select("id").single();

    if (bpErr || !bp) { toast.error("Gagal membuat company: " + (bpErr?.message || "")); setCreating(false); return; }

    await supabase.from("business_members").insert({ business_id: bp.id, user_id: selectedOwnerId, role: "owner", status: "active" });
    toast.success("Company berhasil dibuat");
    setCreateOpen(false);
    setNewName(""); setNewIndustry(""); setNewCity(""); setNewCountry("Indonesia");
    setOwnerSearch(""); setOwnerResults([]); setSelectedOwnerId("");
    fetchData();
    setCreating(false);
  };

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.oveercode || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const kycBadge = (status: string) => {
    const map: Record<string, string> = {
      verified: "bg-primary/10 text-primary",
      approved: "bg-primary/10 text-primary",
      pending: "bg-amber-500/10 text-amber-600",
      rejected: "bg-destructive/10 text-destructive",
      unverified: "bg-muted text-muted-foreground",
    };
    return map[status] || map.unverified;
  };

  const stats = {
    total: companies.length,
    verified: companies.filter((c) => c.kyc_status === "verified" || c.kyc_status === "approved").length,
    pending: companies.filter((c) => c.kyc_status === "pending").length,
    unverified: companies.filter((c) => c.kyc_status === "unverified").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Company Management</h2>
          <p className="text-sm text-muted-foreground">Companies are job providers / clients</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Tambah Company
          </Button>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, code, industry, city..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Companies", value: stats.total, icon: Building2, color: "text-foreground" },
          { label: "Verified", value: stats.verified, icon: ShieldCheck, color: "text-primary" },
          { label: "Pending", value: stats.pending, icon: Shield, color: "text-amber-600" },
          { label: "Unverified", value: stats.unverified, icon: ShieldX, color: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Oveercode</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Industry</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Members</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Jobs</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">KYC</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={9} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
                ))
              ) : paged.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No company data found</td></tr>
              ) : (
                paged.map((c) => (
                  <tr key={c.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/company/${c.oveercode}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[180px]">{c.name}</p>
                          {c.website && (
                            <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                              <Globe className="w-2.5 h-2.5" /> {c.website}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.oveercode || "—"}</td>
                    <td className="px-4 py-3">
                      {c.industry ? <Badge variant="secondary" className="text-xs truncate max-w-[120px]">{c.industry}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.city || c.country ? (
                        <span className="flex items-center gap-1 truncate max-w-[150px]"><MapPin className="w-3 h-3 shrink-0" />{[c.city, c.country].filter(Boolean).join(", ")}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-foreground flex items-center justify-center gap-1"><Users className="w-3 h-3" /> {memberCounts[c.id] || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-foreground">{oppCounts[c.id] || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${kycBadge(c.kyc_status)}`}>{c.kyc_status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString("en-US")}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/company/${c.oveercode}`)}>
                            <Users className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {c.website && (
                            <DropdownMenuItem onClick={() => window.open(c.website!.startsWith("http") ? c.website! : `https://${c.website}`, "_blank")}>
                              <ExternalLink className="w-4 h-4 mr-2" /> Open Website
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => updateKycStatus(c.id, "verified")}>
                            <ShieldCheck className="w-4 h-4 mr-2" /> Set Verified
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateKycStatus(c.id, "pending")}>
                            <Shield className="w-4 h-4 mr-2" /> Set Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateKycStatus(c.id, "rejected")}>
                            <ShieldX className="w-4 h-4 mr-2" /> Set Rejected
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

      {/* Create Company Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Company Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Company *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="PT Company Indonesia" />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={newIndustry} onValueChange={setNewIndustry}>
                <SelectTrigger><SelectValue placeholder="Pilih industri" /></SelectTrigger>
                <SelectContent>
                  {["Technology","Finance & Banking","Healthcare","Education","E-Commerce","Manufacturing","Real Estate","Media & Entertainment","Government","Logistics","F&B","Professional Services","Construction","Trading","Retail","Hospitality","Agriculture","Energy","Telecommunications","Automotive"].map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kota</Label>
                <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Jakarta" />
              </div>
              <div className="space-y-2">
                <Label>Negara</Label>
                <CountrySelect value={newCountry} onChange={setNewCountry} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Owner *</Label>
              <Input value={ownerSearch} onChange={(e) => searchOwnerFn(e.target.value)} placeholder="Cari nama user..." />
              {searchingOwner && <p className="text-xs text-muted-foreground">Mencari...</p>}
              {ownerResults.length > 0 && !selectedOwnerId && (
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto divide-y divide-border">
                  {ownerResults.map((u) => (
                    <button key={u.user_id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => { setSelectedOwnerId(u.user_id); setOwnerSearch(u.full_name || ""); setOwnerResults([]); }}>
                      {u.full_name || "—"}
                    </button>
                  ))}
                </div>
              )}
              {selectedOwnerId && (
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="flex-1">{ownerSearch}</span>
                  <button onClick={() => { setSelectedOwnerId(""); setOwnerSearch(""); }} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button onClick={createCompany} disabled={creating || !newName.trim() || !selectedOwnerId}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Buat Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCompanies;
