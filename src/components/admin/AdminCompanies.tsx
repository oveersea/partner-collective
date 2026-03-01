import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Search, Building2, MapPin, Globe, ChevronLeft, ChevronRight, ExternalLink,
  MoreVertical, Shield, ShieldCheck, ShieldX, Users, UserPlus, Crown, Trash2,
  Loader2, X,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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

interface VendorMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

const PAGE_SIZE = 20;

const AdminCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [oppCounts, setOppCounts] = useState<Record<string, number>>({});
  const [expCounts, setExpCounts] = useState<Record<string, number>>({});
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  // Vendor detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<VendorMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<{ user_id: string; full_name: string; email?: string }[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [compRes, oppRes, expRes, memRes] = await Promise.all([
      supabase
        .from("business_profiles")
        .select("id, name, slug, oveercode, kyc_status, industry, city, country, company_size, email, phone, website, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("opportunities").select("business_id"),
      supabase.from("user_experiences").select("business_id"),
      supabase.from("business_members").select("business_id"),
    ]);

    if (compRes.data) setCompanies(compRes.data as Company[]);
    if (compRes.error) toast.error("Gagal memuat data perusahaan");

    if (oppRes.data) {
      const counts: Record<string, number> = {};
      oppRes.data.forEach((o: any) => {
        if (o.business_id) counts[o.business_id] = (counts[o.business_id] || 0) + 1;
      });
      setOppCounts(counts);
    }

    if (expRes.data) {
      const counts: Record<string, number> = {};
      expRes.data.forEach((e: any) => {
        if (e.business_id) counts[e.business_id] = (counts[e.business_id] || 0) + 1;
      });
      setExpCounts(counts);
    }

    if (memRes.data) {
      const counts: Record<string, number> = {};
      memRes.data.forEach((m: any) => {
        if (m.business_id) counts[m.business_id] = (counts[m.business_id] || 0) + 1;
      });
      setMemberCounts(counts);
    }

    setLoading(false);
  };

  const updateKycStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("business_profiles")
      .update({ kyc_status: status })
      .eq("id", id);
    if (error) toast.error("Gagal update status: " + error.message);
    else {
      toast.success(`Status KYC diubah ke "${status}"`);
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, kyc_status: status } : c))
      );
    }
  };

  // ── Vendor Detail ──
  const openVendorDetail = async (company: Company) => {
    setSelectedCompany(company);
    setDetailOpen(true);
    await fetchMembers(company.id);
  };

  const fetchMembers = async (businessId: string) => {
    setMembersLoading(true);
    const { data: membersData } = await supabase
      .from("business_members")
      .select("id, user_id, role, status, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true });

    if (membersData && membersData.length > 0) {
      const userIds = membersData.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

      // Get emails via function
      const enriched: VendorMember[] = membersData.map((m) => ({
        ...m,
        user_name: profileMap.get(m.user_id) || "—",
      }));

      setMembers(enriched);
    } else {
      setMembers([]);
    }
    setMembersLoading(false);
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    const { error } = await supabase
      .from("business_members")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", memberId);
    if (error) {
      toast.error("Gagal update role: " + error.message);
    } else {
      toast.success(`Role diubah ke "${role}"`);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
    }
  };

  const removeMember = async (memberId: string, userName: string) => {
    if (!confirm(`Hapus "${userName}" dari vendor ini?`)) return;
    const { error } = await supabase.from("business_members").delete().eq("id", memberId);
    if (error) {
      toast.error("Gagal menghapus: " + error.message);
    } else {
      toast.success("Member dihapus");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setMemberCounts((prev) => ({
        ...prev,
        [selectedCompany!.id]: Math.max(0, (prev[selectedCompany!.id] || 1) - 1),
      }));
    }
  };

  // ── Add Member ──
  const searchUsers = async (q: string) => {
    setUserSearch(q);
    if (q.length < 2) {
      setUserResults([]);
      return;
    }
    setSearchingUsers(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .ilike("full_name", `%${q}%`)
      .limit(10);
    setUserResults(data || []);
    setSearchingUsers(false);
  };

  const addMember = async () => {
    if (!selectedUserId || !selectedCompany) return;
    setAddingMember(true);

    // Check if already member
    const { data: existing } = await supabase
      .from("business_members")
      .select("id")
      .eq("business_id", selectedCompany.id)
      .eq("user_id", selectedUserId)
      .maybeSingle();

    if (existing) {
      toast.error("User sudah menjadi member vendor ini");
      setAddingMember(false);
      return;
    }

    const { error } = await supabase.from("business_members").insert({
      business_id: selectedCompany.id,
      user_id: selectedUserId,
      role: newMemberRole,
      status: "active",
    });

    if (error) {
      toast.error("Gagal menambahkan: " + error.message);
    } else {
      toast.success("Member berhasil ditambahkan");
      setAddMemberOpen(false);
      setUserSearch("");
      setSelectedUserId("");
      setNewMemberRole("member");
      setUserResults([]);
      await fetchMembers(selectedCompany.id);
      setMemberCounts((prev) => ({
        ...prev,
        [selectedCompany.id]: (prev[selectedCompany.id] || 0) + 1,
      }));
    }
    setAddingMember(false);
  };

  // ── Filters ──
  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.oveercode || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

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

  const roleBadge = (role: string) => {
    if (role === "owner") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (role === "admin") return "bg-primary/10 text-primary border-primary/20";
    return "bg-muted text-muted-foreground border-border";
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
        <h2 className="text-xl font-semibold text-foreground">Manajemen Vendor</h2>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nama, kode, industri, kota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Vendor", value: stats.total, icon: Building2, color: "text-foreground" },
          { label: "Terverifikasi", value: stats.verified, icon: ShieldCheck, color: "text-primary" },
          { label: "Pending", value: stats.pending, icon: Shield, color: "text-amber-600" },
          { label: "Belum Verifikasi", value: stats.unverified, icon: ShieldX, color: "text-muted-foreground" },
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Oveercode</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Industri</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lokasi</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Member</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Jobs</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">KYC</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bergabung</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={9} className="px-4 py-4">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada data vendor
                  </td>
                </tr>
              ) : (
                paged.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => openVendorDetail(c)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[180px]">{c.name}</p>
                          {c.website && (
                            <a
                              href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe className="w-2.5 h-2.5" /> {c.website}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.oveercode || "—"}</td>
                    <td className="px-4 py-3">
                      {c.industry ? (
                        <Badge variant="secondary" className="text-xs truncate max-w-[120px]">
                          {c.industry}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.city || c.country ? (
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {[c.city, c.country].filter(Boolean).join(", ")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-foreground flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" /> {memberCounts[c.id] || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-foreground">{oppCounts[c.id] || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${kycBadge(c.kyc_status)}`}>
                        {c.kyc_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(c.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openVendorDetail(c)}>
                            <Users className="w-4 h-4 mr-2" /> Kelola Member
                          </DropdownMenuItem>
                          {c.website && (
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  c.website!.startsWith("http") ? c.website! : `https://${c.website}`,
                                  "_blank"
                                )
                              }
                            >
                              <ExternalLink className="w-4 h-4 mr-2" /> Buka Website
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
        </div>
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
              {Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Vendor Detail Dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {selectedCompany?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedCompany && (
            <div className="space-y-6">
              {/* Company info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Oveercode</Label>
                  <p className="font-mono text-foreground">{selectedCompany.oveercode || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">KYC Status</Label>
                  <p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${kycBadge(selectedCompany.kyc_status)}`}>
                      {selectedCompany.kyc_status}
                    </span>
                  </p>
                </div>
                {selectedCompany.industry && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Industri</Label>
                    <p className="text-foreground">{selectedCompany.industry}</p>
                  </div>
                )}
                {(selectedCompany.city || selectedCompany.country) && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Lokasi</Label>
                    <p className="text-foreground">{[selectedCompany.city, selectedCompany.country].filter(Boolean).join(", ")}</p>
                  </div>
                )}
              </div>

              {/* Members section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> Member Vendor ({members.length})
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => setAddMemberOpen(true)}
                    className="gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Tambah Member
                  </Button>
                </div>

                {membersLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                    Belum ada member. Tambahkan member pertama.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            {m.role === "owner" || m.role === "admin" ? (
                              <Crown className="w-4 h-4 text-primary" />
                            ) : (
                              <Users className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{m.user_name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Bergabung {new Date(m.created_at).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={m.role}
                            onValueChange={(v) => updateMemberRole(m.id, v)}
                          >
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>

                          <Badge
                            variant="outline"
                            className={`text-[10px] border ${roleBadge(m.role)}`}
                          >
                            {m.role}
                          </Badge>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeMember(m.id, m.user_name || "member")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Add Member Dialog ── */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Member ke {selectedCompany?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* User search */}
            <div className="space-y-2">
              <Label>Cari User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Ketik nama user minimal 2 huruf..."
                  value={userSearch}
                  onChange={(e) => searchUsers(e.target.value)}
                />
                {searchingUsers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {userResults.length > 0 && (
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                  {userResults.map((u) => (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(u.user_id);
                        setUserSearch(u.full_name);
                        setUserResults([]);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center justify-between ${
                        selectedUserId === u.user_id ? "bg-primary/10" : ""
                      }`}
                    >
                      <span className="text-foreground">{u.full_name}</span>
                      {selectedUserId === u.user_id && (
                        <Badge variant="outline" className="text-[10px]">Dipilih</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedUserId && (
                <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 rounded-md px-3 py-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>User dipilih: <strong>{userSearch}</strong></span>
                  <button
                    onClick={() => { setSelectedUserId(""); setUserSearch(""); }}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — bisa mengelola vendor</SelectItem>
                  <SelectItem value="member">Member — anggota biasa</SelectItem>
                  <SelectItem value="owner">Owner — pemilik vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Batal</Button>
            <Button onClick={addMember} disabled={!selectedUserId || addingMember}>
              {addingMember ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Tambahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCompanies;
