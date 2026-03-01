import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, User, MoreVertical } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  oveercode: string;
  account_type: string;
  kyc_status: string;
  city: string | null;
  country: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, oveercode, account_type, kyc_status, city, country, created_at")
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lokasi</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bergabung</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={7} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
              ) : (
                filtered.map((u) => (
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => assignRole(u.user_id, "admin")}>
                            <Shield className="w-4 h-4 mr-2" /> Jadikan Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => assignRole(u.user_id, "instructor")}>
                            Jadikan Instructor
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
      </div>
    </div>
  );
};

export default AdminUsers;
