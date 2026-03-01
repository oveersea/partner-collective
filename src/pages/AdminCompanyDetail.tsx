import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Save, Building2, MapPin, Globe, Users, UserPlus, Crown,
  Trash2, Loader2, Search, X, ShieldCheck, Shield, ShieldX, Briefcase,
} from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  oveercode: string | null;
  kyc_status: string;
  business_type: string;
  industry: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  company_size: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  npwp: string | null;
  nib: string | null;
  akta_number: string | null;
  founded_year: number | null;
  logo_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface VendorMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  user_name?: string;
}

const AdminCompanyDetail = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<VendorMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [oppCount, setOppCount] = useState(0);

  // Add member
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<{ user_id: string; full_name: string }[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [addingMember, setAddingMember] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    if (companyId) fetchAll();
  }, [companyId]);

  const fetchAll = async () => {
    setLoading(true);
    const [compRes, oppRes] = await Promise.all([
      supabase.from("business_profiles").select("*").eq("id", companyId!).single(),
      supabase.from("opportunities").select("id").eq("business_id", companyId!),
    ]);

    if (compRes.error || !compRes.data) {
      toast.error("Perusahaan tidak ditemukan");
      navigate("/admin");
      return;
    }
    setData(compRes.data as unknown as CompanyData);
    setOppCount(oppRes.data?.length || 0);
    await fetchMembers(companyId!);
    setLoading(false);
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
      setMembers(membersData.map((m) => ({ ...m, user_name: profileMap.get(m.user_id) || "—" })));
    } else {
      setMembers([]);
    }
    setMembersLoading(false);
  };

  const update = (key: keyof CompanyData, value: any) => {
    if (!data) return;
    setData({ ...data, [key]: value });
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    const { id, created_at, updated_at, created_by, oveercode, slug, ...updateFields } = data;
    const { error } = await supabase.from("business_profiles").update(updateFields).eq("id", id);
    if (error) toast.error("Gagal menyimpan: " + error.message);
    else toast.success("Berhasil disimpan");
    setSaving(false);
  };

  const updateKycStatus = async (status: string) => {
    if (!data) return;
    const { error } = await supabase.from("business_profiles").update({ kyc_status: status }).eq("id", data.id);
    if (error) toast.error("Gagal update KYC");
    else {
      toast.success(`KYC diubah ke "${status}"`);
      update("kyc_status", status);
    }
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    const { error } = await supabase.from("business_members").update({ role, updated_at: new Date().toISOString() }).eq("id", memberId);
    if (error) toast.error("Gagal update role");
    else {
      toast.success(`Role diubah ke "${role}"`);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
    }
  };

  const removeMember = async (memberId: string, userName: string) => {
    if (!confirm(`Hapus "${userName}" dari perusahaan ini?`)) return;
    const { error } = await supabase.from("business_members").delete().eq("id", memberId);
    if (error) toast.error("Gagal menghapus");
    else {
      toast.success("Member dihapus");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  };

  const searchUsers = async (q: string) => {
    setUserSearch(q);
    if (q.length < 2) { setUserResults([]); return; }
    setSearchingUsers(true);
    const { data: res } = await supabase.from("profiles").select("user_id, full_name").ilike("full_name", `%${q}%`).limit(10);
    setUserResults(res || []);
    setSearchingUsers(false);
  };

  const addMember = async () => {
    if (!selectedUserId || !data) return;
    setAddingMember(true);
    const { data: existing } = await supabase.from("business_members").select("id").eq("business_id", data.id).eq("user_id", selectedUserId).maybeSingle();
    if (existing) { toast.error("User sudah menjadi member"); setAddingMember(false); return; }
    const { error } = await supabase.from("business_members").insert({ business_id: data.id, user_id: selectedUserId, role: newMemberRole, status: "active" });
    if (error) toast.error("Gagal menambahkan: " + error.message);
    else {
      toast.success("Member ditambahkan");
      setShowAddMember(false);
      setUserSearch(""); setSelectedUserId(""); setNewMemberRole("member"); setUserResults([]);
      await fetchMembers(data.id);
    }
    setAddingMember(false);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground truncate max-w-md">{data.name}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{data.oveercode}</span>
                <span>•</span>
                <span className={`font-medium px-2 py-0.5 rounded-full ${kycBadge(data.kyc_status)}`}>{data.kyc_status}</span>
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-1" />
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {members.length} Member</span>
          <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {oppCount} Opportunities</span>
          <span>Dibuat: {new Date(data.created_at).toLocaleDateString("id-ID")}</span>
        </div>

        {/* KYC Actions */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Status KYC</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" variant={data.kyc_status === "verified" ? "default" : "outline"} onClick={() => updateKycStatus("verified")}>
              <ShieldCheck className="w-4 h-4 mr-1" /> Verified
            </Button>
            <Button size="sm" variant={data.kyc_status === "pending" ? "default" : "outline"} onClick={() => updateKycStatus("pending")}>
              <Shield className="w-4 h-4 mr-1" /> Pending
            </Button>
            <Button size="sm" variant={data.kyc_status === "rejected" ? "destructive" : "outline"} onClick={() => updateKycStatus("rejected")}>
              <ShieldX className="w-4 h-4 mr-1" /> Rejected
            </Button>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> Informasi Perusahaan</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nama</Label>
              <Input value={data.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <Label>Industri</Label>
              <Input value={data.industry || ""} onChange={(e) => update("industry", e.target.value)} />
            </div>
            <div>
              <Label>Ukuran Perusahaan</Label>
              <Input value={data.company_size || ""} onChange={(e) => update("company_size", e.target.value)} placeholder="e.g. 50-100" />
            </div>
            <div>
              <Label>Tahun Berdiri</Label>
              <Input type="number" value={data.founded_year ?? ""} onChange={(e) => update("founded_year", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <Label>Tipe Bisnis</Label>
              <Input value={data.business_type} onChange={(e) => update("business_type", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Deskripsi</Label>
              <Textarea value={data.description || ""} onChange={(e) => update("description", e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Location */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" /> Kontak & Lokasi</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input value={data.email || ""} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div>
              <Label>Telepon</Label>
              <Input value={data.phone || ""} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={data.website || ""} onChange={(e) => update("website", e.target.value)} />
            </div>
            <div>
              <Label>Kota</Label>
              <Input value={data.city || ""} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div>
              <Label>Negara</Label>
              <Input value={data.country || ""} onChange={(e) => update("country", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Alamat</Label>
              <Input value={data.address || ""} onChange={(e) => update("address", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dokumen Legal</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>NPWP</Label>
              <Input value={data.npwp || ""} onChange={(e) => update("npwp", e.target.value)} />
            </div>
            <div>
              <Label>NIB</Label>
              <Input value={data.nib || ""} onChange={(e) => update("nib", e.target.value)} />
            </div>
            <div>
              <Label>No. Akta</Label>
              <Input value={data.akta_number || ""} onChange={(e) => update("akta_number", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4" /> Media Sosial</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>LinkedIn</Label>
              <Input value={data.linkedin_url || ""} onChange={(e) => update("linkedin_url", e.target.value)} />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={data.instagram_url || ""} onChange={(e) => update("instagram_url", e.target.value)} />
            </div>
            <div>
              <Label>Facebook</Label>
              <Input value={data.facebook_url || ""} onChange={(e) => update("facebook_url", e.target.value)} />
            </div>
            <div>
              <Label>Twitter / X</Label>
              <Input value={data.twitter_url || ""} onChange={(e) => update("twitter_url", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Member ({members.length})</CardTitle>
              <Button size="sm" onClick={() => setShowAddMember(!showAddMember)} className="gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Tambah Member
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Add member form */}
            {showAddMember && (
              <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="space-y-2">
                  <Label>Cari User</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Ketik nama minimal 2 huruf..." value={userSearch} onChange={(e) => searchUsers(e.target.value)} />
                    {searchingUsers && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                  </div>
                  {userResults.length > 0 && (
                    <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                      {userResults.map((u) => (
                        <button key={u.user_id} type="button" onClick={() => { setSelectedUserId(u.user_id); setUserSearch(u.full_name); setUserResults([]); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${selectedUserId === u.user_id ? "bg-primary/10" : ""}`}>
                          <span className="text-foreground">{u.full_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedUserId && (
                    <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 rounded-md px-3 py-2">
                      <Users className="w-3.5 h-3.5" /> <span>User: <strong>{userSearch}</strong></span>
                      <button onClick={() => { setSelectedUserId(""); setUserSearch(""); }} className="ml-auto text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Role</Label>
                    <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addMember} disabled={!selectedUserId || addingMember} size="sm">
                    {addingMember ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />}
                    Tambahkan
                  </Button>
                </div>
              </div>
            )}

            {membersLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}</div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">Belum ada member.</div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        {m.role === "owner" || m.role === "admin" ? <Crown className="w-4 h-4 text-primary" /> : <Users className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.user_name}</p>
                        <p className="text-[11px] text-muted-foreground">Bergabung {new Date(m.created_at).toLocaleDateString("id-ID")}</p>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeMember(m.id, m.user_name || "member")}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCompanyDetail;
