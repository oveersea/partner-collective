import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/components/ui/country-select";
import { CitySelect } from "@/components/ui/city-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Search, Building2, MapPin, Globe, ChevronLeft, ChevronRight, ExternalLink,
  MoreVertical, Shield, ShieldCheck, ShieldX, Users, UserPlus, Crown, Trash2,
  Loader2, X, Briefcase, Plus,
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

interface Vendor {
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
}

const PAGE_SIZE = 20;

const AdminVendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [members, setMembers] = useState<VendorMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<{ user_id: string; full_name: string; oveercode?: string | null }[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [addingMember, setAddingMember] = useState(false);

  // Create vendor dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorIndustry, setNewVendorIndustry] = useState("");
  const [newVendorCity, setNewVendorCity] = useState("");
  const [newVendorCountry, setNewVendorCountry] = useState("Indonesia");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<{ user_id: string; full_name: string }[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [searchingOwner, setSearchingOwner] = useState(false);
  const [creatingVendor, setCreatingVendor] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [vendorRes, memRes, claimRes] = await Promise.all([
      supabase
        .from("business_profiles")
        .select("id, name, slug, oveercode, kyc_status, industry, city, country, company_size, email, phone, website, created_at")
        .eq("business_type", "vendor")
        .order("created_at", { ascending: false }),
      supabase.from("business_members").select("business_id"),
      supabase.from("order_claims").select("business_id"),
    ]);

    if (vendorRes.data) setVendors(vendorRes.data as Vendor[]);
    if (vendorRes.error) toast.error("Failed to load vendor data");

    if (memRes.data) {
      const counts: Record<string, number> = {};
      memRes.data.forEach((m: any) => {
        if (m.business_id) counts[m.business_id] = (counts[m.business_id] || 0) + 1;
      });
      setMemberCounts(counts);
    }

    if (claimRes.data) {
      const counts: Record<string, number> = {};
      claimRes.data.forEach((c: any) => {
        if (c.business_id) counts[c.business_id] = (counts[c.business_id] || 0) + 1;
      });
      setOrderCounts(counts);
    }

    setLoading(false);
  };

  const updateKycStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("business_profiles")
      .update({ kyc_status: status })
      .eq("id", id);
    if (error) toast.error("Failed to update status: " + error.message);
    else {
      toast.success(`KYC status changed to "${status}"`);
      setVendors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, kyc_status: status } : v))
      );
    }
  };

  // ── Vendor Detail ──
  const openVendorDetail = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDetailOpen(true);
    await fetchMembers(vendor.id);
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
      setMembers(
        membersData.map((m) => ({
          ...m,
          user_name: profileMap.get(m.user_id) || "—",
        }))
      );
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
    if (error) toast.error("Failed to update role: " + error.message);
    else {
      toast.success(`Role changed to "${role}"`);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
    }
  };

  const removeMember = async (memberId: string, userName: string) => {
    if (!confirm(`Remove "${userName}" from this vendor?`)) return;
    const { error } = await supabase.from("business_members").delete().eq("id", memberId);
    if (error) toast.error("Failed to remove: " + error.message);
    else {
      toast.success("Member removed");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setMemberCounts((prev) => ({
        ...prev,
        [selectedVendor!.id]: Math.max(0, (prev[selectedVendor!.id] || 1) - 1),
      }));
    }
  };

  // ── Add Member ──
  const searchUsers = async (q: string) => {
    setUserSearch(q);
    if (q.length < 2) { setUserResults([]); return; }
    setSearchingUsers(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, oveercode")
      .or(`full_name.ilike.%${q}%,oveercode.ilike.%${q}%`)
      .limit(10);
    setUserResults(data || []);
    setSearchingUsers(false);
  };

  const addMember = async () => {
    if (!selectedUserId || !selectedVendor) return;
    setAddingMember(true);
    const { data: existing } = await supabase
      .from("business_members")
      .select("id")
      .eq("business_id", selectedVendor.id)
      .eq("user_id", selectedUserId)
      .maybeSingle();

    if (existing) {
      toast.error("User is already a member of this vendor");
      setAddingMember(false);
      return;
    }

    const { error } = await supabase.from("business_members").insert({
      business_id: selectedVendor.id,
      user_id: selectedUserId,
      role: newMemberRole,
      status: "active",
    });

    if (error) toast.error("Failed to add member: " + error.message);
    else {
      toast.success("Member added successfully");
      setAddMemberOpen(false);
      setUserSearch("");
      setSelectedUserId("");
      setNewMemberRole("member");
      setUserResults([]);
      await fetchMembers(selectedVendor.id);
      setMemberCounts((prev) => ({
        ...prev,
        [selectedVendor.id]: (prev[selectedVendor.id] || 0) + 1,
      }));
    }
    setAddingMember(false);
  };

  // ── Create Vendor ──
  const searchOwner = async (q: string) => {
    setOwnerSearch(q);
    if (q.length < 2) { setOwnerResults([]); return; }
    setSearchingOwner(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .ilike("full_name", `%${q}%`)
      .limit(10);
    setOwnerResults(data || []);
    setSearchingOwner(false);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const generateOveercode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "VND-";
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  const createVendor = async () => {
    if (!newVendorName.trim()) { toast.error("Nama vendor wajib diisi"); return; }
    if (!selectedOwnerId) { toast.error("Pilih owner untuk vendor"); return; }
    setCreatingVendor(true);

    const slug = generateSlug(newVendorName);
    const oveercode = generateOveercode();

    const { data: bp, error: bpErr } = await supabase
      .from("business_profiles")
      .insert({
        name: newVendorName.trim(),
        slug,
        oveercode,
        business_type: "vendor",
        industry: newVendorIndustry.trim() || null,
        city: newVendorCity.trim() || null,
        country: newVendorCountry.trim() || null,
        created_by: selectedOwnerId,
        kyc_status: "unverified",
      })
      .select("id")
      .single();

    if (bpErr || !bp) {
      toast.error("Gagal membuat vendor: " + (bpErr?.message || "Unknown error"));
      setCreatingVendor(false);
      return;
    }

    // Add owner as member
    await supabase.from("business_members").insert({
      business_id: bp.id,
      user_id: selectedOwnerId,
      role: "owner",
      status: "active",
    });

    toast.success("Vendor berhasil dibuat");
    setCreateOpen(false);
    setNewVendorName("");
    setNewVendorIndustry("");
    setNewVendorCity("");
    setNewVendorCountry("Indonesia");
    setOwnerSearch("");
    setOwnerResults([]);
    setSelectedOwnerId("");
    fetchData();
    setCreatingVendor(false);
  };

  // ── Filters ──
  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.oveercode || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.industry || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.city || "").toLowerCase().includes(search.toLowerCase())
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

  const roleBadge = (role: string) => {
    if (role === "owner") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (role === "admin") return "bg-primary/10 text-primary border-primary/20";
    return "bg-muted text-muted-foreground border-border";
  };

  const stats = {
    total: vendors.length,
    verified: vendors.filter((v) => v.kyc_status === "verified" || v.kyc_status === "approved").length,
    pending: vendors.filter((v) => v.kyc_status === "pending").length,
    unverified: vendors.filter((v) => v.kyc_status === "unverified").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Vendor Management</h2>
          <p className="text-sm text-muted-foreground">Vendors are job receivers / service providers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Tambah Vendor
          </Button>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, code, industry, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Vendors", value: stats.total, icon: Briefcase, color: "text-foreground" },
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Oveercode</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Industry</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Members</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Orders</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">KYC</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
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
                    No vendor data found
                  </td>
                </tr>
              ) : (
                paged.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => openVendorDetail(v)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[180px]">{v.name}</p>
                          {v.website && (
                            <a
                              href={v.website.startsWith("http") ? v.website : `https://${v.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe className="w-2.5 h-2.5" /> {v.website}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.oveercode || "—"}</td>
                    <td className="px-4 py-3">
                      {v.industry ? (
                        <Badge variant="secondary" className="text-xs truncate max-w-[120px]">{v.industry}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {v.city || v.country ? (
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {[v.city, v.country].filter(Boolean).join(", ")}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-foreground flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" /> {memberCounts[v.id] || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-foreground">{orderCounts[v.id] || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${kycBadge(v.kyc_status)}`}>
                        {v.kyc_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(v.created_at).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openVendorDetail(v)}>
                            <Users className="w-4 h-4 mr-2" /> Manage Members
                          </DropdownMenuItem>
                          {v.website && (
                            <DropdownMenuItem onClick={() => window.open(v.website!.startsWith("http") ? v.website! : `https://${v.website}`, "_blank")}>
                              <ExternalLink className="w-4 h-4 mr-2" /> Open Website
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => updateKycStatus(v.id, "verified")}>
                            <ShieldCheck className="w-4 h-4 mr-2" /> Set Verified
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateKycStatus(v.id, "pending")}>
                            <Shield className="w-4 h-4 mr-2" /> Set Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateKycStatus(v.id, "rejected")}>
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
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
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
              <Briefcase className="w-5 h-5 text-primary" />
              {selectedVendor?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedVendor && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Oveercode</Label>
                  <p className="font-mono text-foreground">{selectedVendor.oveercode || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">KYC Status</Label>
                  <p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${kycBadge(selectedVendor.kyc_status)}`}>
                      {selectedVendor.kyc_status}
                    </span>
                  </p>
                </div>
                {selectedVendor.industry && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Industry</Label>
                    <p className="text-foreground">{selectedVendor.industry}</p>
                  </div>
                )}
                {(selectedVendor.city || selectedVendor.country) && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <p className="text-foreground">{[selectedVendor.city, selectedVendor.country].filter(Boolean).join(", ")}</p>
                  </div>
                )}
              </div>

              {/* Members section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> Vendor Members ({members.length})
                  </h3>
                  <Button size="sm" onClick={() => setAddMemberOpen(true)} className="gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Add Member
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
                    No members yet. Add the first member.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
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
                              Joined {new Date(m.created_at).toLocaleDateString("en-US")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={m.role} onValueChange={(v) => updateMemberRole(m.id, v)}>
                            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                          <Badge variant="outline" className={`text-[10px] border ${roleBadge(m.role)}`}>{m.role}</Badge>
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
            <DialogTitle>Add Member to {selectedVendor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Type at least 2 characters..."
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
                      {u.oveercode && <span className="ml-2 text-xs text-muted-foreground font-mono">{u.oveercode}</span>}
                      {selectedUserId === u.user_id && (
                        <Badge variant="outline" className="text-[10px]">Selected</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedUserId && (
                <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 rounded-md px-3 py-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Selected user: <strong>{userSearch}</strong></span>
                  <button
                    onClick={() => { setSelectedUserId(""); setUserSearch(""); }}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — can manage vendor</SelectItem>
                  <SelectItem value="member">Member — regular member</SelectItem>
                  <SelectItem value="owner">Owner — vendor owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={addMember} disabled={!selectedUserId || addingMember}>
              {addingMember ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Vendor Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Vendor Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Vendor *</Label>
              <Input value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)} placeholder="PT Vendor Indonesia" />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={newVendorIndustry} onValueChange={setNewVendorIndustry}>
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
                <CitySelect value={newVendorCity} onChange={setNewVendorCity} />
              </div>
              <div className="space-y-2">
                <Label>Negara</Label>
                <CountrySelect value={newVendorCountry} onChange={setNewVendorCountry} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Owner *</Label>
              <Input value={ownerSearch} onChange={(e) => searchOwner(e.target.value)} placeholder="Cari nama user..." />
              {searchingOwner && <p className="text-xs text-muted-foreground">Mencari...</p>}
              {ownerResults.length > 0 && !selectedOwnerId && (
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto divide-y divide-border">
                  {ownerResults.map((u) => (
                    <button
                      key={u.user_id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => { setSelectedOwnerId(u.user_id); setOwnerSearch(u.full_name || ""); setOwnerResults([]); }}
                    >
                      {u.full_name || "—"}
                    </button>
                  ))}
                </div>
              )}
              {selectedOwnerId && (
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="flex-1">{ownerSearch}</span>
                  <button onClick={() => { setSelectedOwnerId(""); setOwnerSearch(""); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button onClick={createVendor} disabled={creatingVendor || !newVendorName.trim() || !selectedOwnerId}>
              {creatingVendor ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Buat Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVendors;
