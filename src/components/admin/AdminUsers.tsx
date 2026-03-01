import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, User, MoreVertical, Trash2, UserX, Clock, Activity } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  oveercode: string;
  account_type: string;
  kyc_status: string;
  city: string | null;
  country: string | null;
  created_at: string;
  last_online: string | null;
  skills: string[] | null;
  years_of_experience: number | null;
  highest_education: string | null;
  phone_number: string | null;
  bio: string | null;
  professional_summary: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
}

const calcProfileScore = (u: UserProfile): number => {
  let score = 0;
  const total = 10;
  if (u.full_name) score++;
  if (u.avatar_url) score++;
  if (u.phone_number) score++;
  if (u.skills && u.skills.length > 0) score++;
  if (u.years_of_experience != null && u.years_of_experience > 0) score++;
  if (u.highest_education) score++;
  if (u.bio || u.professional_summary) score++;
  if (u.city || u.country) score++;
  if (u.linkedin_url) score++;
  if (u.kyc_status === 'approved' || u.kyc_status === 'verified') score++;
  return Math.round((score / total) * 100);
};

const formatLastOnline = (d: string | null): string => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h lalu`;
  return new Date(d).toLocaleDateString("id-ID");
};

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: "deactivate" | "delete"; userId: string; name: string }>({ open: false, type: "deactivate", userId: "", name: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, oveercode, account_type, kyc_status, city, country, created_at, last_online, skills, years_of_experience, highest_education, phone_number, bio, professional_summary, avatar_url, linkedin_url")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setUsers(data);
    if (error) toast.error("Gagal memuat data user");
    setLoading(false);
  };

  const assignRole = async (userId: string, role: string) => {
    const { error } = await (supabase.from("user_roles") as any).upsert(
      { user_id: userId, role },
      { onConflict: "user_id,role" }
    );
    if (error) toast.error("Gagal assign role: " + error.message);
    else toast.success(`Role '${role}' berhasil ditambahkan`);
  };

  const deactivateUser = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: "deactivated" } as any)
      .eq("user_id", userId);
    if (error) toast.error("Gagal menonaktifkan user: " + error.message);
    else {
      toast.success("User berhasil dinonaktifkan");
      fetchUsers();
    }
    setConfirmDialog({ open: false, type: "deactivate", userId: "", name: "" });
  };

  const deleteUserProfile = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", userId);
    if (error) toast.error("Gagal menghapus profil: " + error.message);
    else {
      toast.success("Profil user berhasil dihapus");
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    }
    setConfirmDialog({ open: false, type: "delete", userId: "", name: "" });
  };

  const filtered = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.oveercode.toLowerCase().includes(search.toLowerCase())
  );

  const kycBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: "bg-primary/10 text-primary",
      verified: "bg-primary/10 text-primary",
      pending: "bg-amber-500/10 text-amber-600",
      rejected: "bg-destructive/10 text-destructive",
      unverified: "bg-muted text-muted-foreground",
    };
    return map[status] || map.unverified;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Manajemen User</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari nama atau oveercode..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Oveercode</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipe</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">KYC</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Profil</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Online</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lokasi</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bergabung</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={9} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
              ) : (
                filtered.map((u) => {
                  const pScore = calcProfileScore(u);
                  const scoreColor = pScore >= 70 ? "text-primary bg-primary/10" : pScore >= 40 ? "text-amber-600 bg-amber-500/10" : "text-destructive bg-destructive/10";
                  return (
                  <tr key={u.user_id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/user/${u.user_id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">{u.full_name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.oveercode}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">{u.account_type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${kycBadge(u.kyc_status)}`}>
                        {u.kyc_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${scoreColor}`}>
                        {pScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {u.last_online && <span className={`w-1.5 h-1.5 rounded-full ${Date.now() - new Date(u.last_online).getTime() < 300000 ? "bg-primary" : "bg-muted-foreground/40"}`} />}
                        {formatLastOnline(u.last_online)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {[u.city, u.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); assignRole(u.user_id, "admin"); }}>
                            <Shield className="w-4 h-4 mr-2" /> Jadikan Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); assignRole(u.user_id, "instructor"); }}>
                            Jadikan Instructor
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmDialog({ open: true, type: "deactivate", userId: u.user_id, name: u.full_name || "User" }); }}>
                            <UserX className="w-4 h-4 mr-2" /> Nonaktifkan
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmDialog({ open: true, type: "delete", userId: u.user_id, name: u.full_name || "User" }); }}>
                            <Trash2 className="w-4 h-4 mr-2" /> Hapus Profil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === "delete" ? "Hapus Profil User?" : "Nonaktifkan User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === "delete"
                ? `Profil "${confirmDialog.name}" akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`
                : `User "${confirmDialog.name}" akan dinonaktifkan dan tidak dapat mengakses platform.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className={confirmDialog.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={() =>
                confirmDialog.type === "delete"
                  ? deleteUserProfile(confirmDialog.userId)
                  : deactivateUser(confirmDialog.userId)
              }
            >
              {confirmDialog.type === "delete" ? "Hapus" : "Nonaktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
