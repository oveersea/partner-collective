import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Shield, User, MoreVertical, Trash2, UserX, ArrowUpDown, ArrowUp, ArrowDown, CalendarDays, ChevronLeft, ChevronRight, FileUp, Download } from "lucide-react";
import InviteUsersDialog from "./InviteUsersDialog";
import AdminBulkCV from "./AdminBulkCV";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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

interface LoginActivity {
  user_id: string;
  total_logins: number;
  daily_breakdown: Record<string, number>;
  timestamps: string[];
}

const PAGE_SIZE = 25;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US");
};

type SortKey = "profile" | "activity" | "last_online" | "created_at" | "kyc" | null;
type SortDir = "asc" | "desc";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [activityMap, setActivityMap] = useState<Record<string, LoginActivity>>({});
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: "deactivate" | "delete"; userId: string; name: string }>({ open: false, type: "deactivate", userId: "", name: "" });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchLoginActivity();
  }, []);

  const fetchUsers = async () => {
    let allData: UserProfile[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, oveercode, account_type, kyc_status, city, country, created_at, last_online, skills, years_of_experience, highest_education, phone_number, bio, professional_summary, avatar_url, linkedin_url")
        .order("created_at", { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) {
        toast.error("Failed to load user data");
        break;
      }
      if (data) {
        allData = [...allData, ...data];
        hasMore = data.length === batchSize;
        from += batchSize;
      } else {
        hasMore = false;
      }
    }

    setUsers(allData);
    setLoading(false);
  };

  const fetchLoginActivity = async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data } = await supabase
      .from("login_logs")
      .select("user_id, logged_in_at")
      .gte("logged_in_at", weekAgo.toISOString())
      .order("logged_in_at", { ascending: false }) as any;

    if (data) {
      const map: Record<string, LoginActivity> = {};
      for (const log of data) {
        if (!map[log.user_id]) {
          map[log.user_id] = { user_id: log.user_id, total_logins: 0, daily_breakdown: {}, timestamps: [] };
        }
        map[log.user_id].total_logins++;
        map[log.user_id].timestamps.push(log.logged_in_at);
        const dayName = DAY_NAMES[new Date(log.logged_in_at).getDay()];
        map[log.user_id].daily_breakdown[dayName] = (map[log.user_id].daily_breakdown[dayName] || 0) + 1;
      }
      setActivityMap(map);
    }
  };

  const assignRole = async (userId: string, role: string) => {
    const { error } = await (supabase.from("user_roles") as any).upsert(
      { user_id: userId, role },
      { onConflict: "user_id,role" }
    );
    if (error) toast.error("Failed to assign role: " + error.message);
    else toast.success(`Role '${role}' assigned successfully`);
  };

  const deactivateUser = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: "deactivated" } as any)
      .eq("user_id", userId);
    if (error) toast.error("Failed to deactivate user: " + error.message);
    else {
      toast.success("User deactivated successfully");
      fetchUsers();
    }
    setConfirmDialog({ open: false, type: "deactivate", userId: "", name: "" });
  };

  const deleteUserProfile = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", userId);
    if (error) toast.error("Failed to delete profile: " + error.message);
    else {
      toast.success("User profile deleted successfully");
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    }
    setConfirmDialog({ open: false, type: "delete", userId: "", name: "" });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === "desc") setSortDir("asc");
      else { setSortKey(null); setSortDir("desc"); }
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === pagedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(pagedUsers.map((u) => u.user_id)));
    }
  };

  const handleBulkDownloadCV = async (includeContact: boolean) => {
    if (selectedUsers.size === 0) {
      toast.error("Pilih minimal satu user untuk download CV");
      return;
    }
    setBulkDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Session expired"); return; }

      // Load html2pdf.js dynamically
      if (!(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Gagal memuat html2pdf"));
          document.head.appendChild(script);
        });
      }

      let successCount = 0;
      for (const userId of selectedUsers) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cv`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ user_id: userId, include_contact: includeContact }),
            }
          );
          if (!res.ok) continue;
          const html = await res.text();

          // Use isolated iframe to prevent CSS conflicts while keeping it inside viewport for html2canvas
          const iframe = document.createElement("iframe");
          iframe.setAttribute("aria-hidden", "true");
          iframe.style.position = "fixed";
          iframe.style.top = "0";
          iframe.style.left = "0";
          iframe.style.width = "794px";
          iframe.style.height = "1123px";
          iframe.style.border = "0";
          iframe.style.opacity = "0.01";
          iframe.style.pointerEvents = "none";
          iframe.style.zIndex = "-1";
          document.body.appendChild(iframe);

          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) { document.body.removeChild(iframe); continue; }

          iframeDoc.open();
          iframeDoc.write(html);
          iframeDoc.close();

          // Wait for document, fonts, and images to render
          await new Promise((resolve) => setTimeout(resolve, 120));
          const iframeFonts = (iframeDoc as Document & { fonts?: FontFaceSet }).fonts;
          if (iframeFonts?.ready) {
            await iframeFonts.ready;
          }

          const iframeImgs = Array.from(iframeDoc.querySelectorAll("img"));
          await Promise.all(
            iframeImgs.map(
              (img) =>
                new Promise<void>((resolve) => {
                  if (img.complete) return resolve();
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                })
            )
          );
          await new Promise((resolve) => setTimeout(resolve, 120));

          const renderTarget = iframeDoc.querySelector(".page") as HTMLElement;
          if (!renderTarget) { document.body.removeChild(iframe); continue; }

          const nameEl = iframeDoc.querySelector(".cv-name");
          const userName = nameEl?.textContent?.replace(/[^a-zA-Z0-9]/g, "_") || userId.slice(0, 8);
          const contactLabel = includeContact ? "with_contact" : "without_contact";

          await (window as any).html2pdf()
            .set({
              margin: [10, 12, 10, 12],
              filename: `CV_${userName}_${contactLabel}.pdf`,
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: "#ffffff",
                scrollX: 0,
                scrollY: 0,
                windowWidth: renderTarget.scrollWidth || 794,
                windowHeight: renderTarget.scrollHeight || 1123,
              },
              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
              pagebreak: { mode: ["css", "legacy"] },
            })
            .from(renderTarget)
            .save();

          document.body.removeChild(iframe);
          successCount++;
        } catch {
          continue;
        }
      }
      if (successCount > 0) toast.success(`${successCount} CV siap didownload`);
    } catch (err: any) {
      toast.error("Gagal download CV: " + err.message);
    } finally {
      setBulkDownloading(false);
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "desc" ? <ArrowDown className="w-3 h-3 ml-1" /> : <ArrowUp className="w-3 h-3 ml-1" />;
  };

  const sortedFiltered = useMemo(() => {
    let list = users.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        u.oveercode.toLowerCase().includes(search.toLowerCase())
    );

    if (sortKey) {
      list = [...list].sort((a, b) => {
        let va: number, vb: number;
        switch (sortKey) {
          case "profile":
            va = calcProfileScore(a);
            vb = calcProfileScore(b);
            break;
          case "activity":
            va = activityMap[a.user_id]?.total_logins || 0;
            vb = activityMap[b.user_id]?.total_logins || 0;
            break;
          case "last_online":
            va = a.last_online ? new Date(a.last_online).getTime() : 0;
            vb = b.last_online ? new Date(b.last_online).getTime() : 0;
            break;
          case "created_at":
            va = new Date(a.created_at).getTime();
            vb = new Date(b.created_at).getTime();
            break;
          case "kyc": {
            const kycOrder: Record<string, number> = { approved: 4, verified: 4, pending: 3, rejected: 2, unverified: 1, deactivated: 0 };
            va = kycOrder[a.kyc_status] ?? 1;
            vb = kycOrder[b.kyc_status] ?? 1;
            break;
          }
          default:
            return 0;
        }
        return sortDir === "desc" ? vb - va : va - vb;
      });
    }
    return list;
  }, [users, search, sortKey, sortDir, activityMap]);

  useEffect(() => { setPage(1); setSelectedUsers(new Set()); }, [search]);

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE));
  const pagedUsers = sortedFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    <Tabs defaultValue="users" className="space-y-4">
      <TabsList>
        <TabsTrigger value="users"><User className="w-4 h-4 mr-1.5" />User Management</TabsTrigger>
        <TabsTrigger value="bulk_cv"><FileUp className="w-4 h-4 mr-1.5" />Bulk CV</TabsTrigger>
      </TabsList>

      <TabsContent value="users">
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">User Management</h2>
        <div className="flex items-center gap-3">
          {selectedUsers.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={bulkDownloading}>
                  <Download className="w-4 h-4 mr-1.5" />
                  Download CV ({selectedUsers.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkDownloadCV(true)}>
                  With Contact
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkDownloadCV(false)}>
                  Without Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <InviteUsersDialog onComplete={fetchUsers} />
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name or oveercode..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={pagedUsers.length > 0 && selectedUsers.size === pagedUsers.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Oveercode</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("kyc")}>
                  <span className="flex items-center">KYC <SortIcon col="kyc" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("profile")}>
                  <span className="flex items-center">Profile <SortIcon col="profile" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("activity")}>
                  <span className="flex items-center">Activity <SortIcon col="activity" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("last_online")}>
                  <span className="flex items-center">Last Online <SortIcon col="last_online" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("created_at")}>
                  <span className="flex items-center">Joined <SortIcon col="created_at" /></span>
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={11} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : sortedFiltered.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No data found</td></tr>
              ) : (
                pagedUsers.map((u) => {
                  const pScore = calcProfileScore(u);
                  const scoreColor = pScore >= 70 ? "text-primary bg-primary/10" : pScore >= 40 ? "text-amber-600 bg-amber-500/10" : "text-destructive bg-destructive/10";
                  const activity = activityMap[u.user_id];
                  const totalLogins = activity?.total_logins || 0;
                  return (
                  <tr key={u.user_id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/user/${u.oveercode}`)}>
                    <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedUsers.has(u.user_id)}
                        onCheckedChange={() => toggleSelectUser(u.user_id)}
                      />
                    </td>
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
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${scoreColor}`}>
                        {pScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex flex-col gap-1 text-left hover:bg-muted/50 rounded-lg px-1.5 py-1 -mx-1.5 -my-1 transition-colors">
                            <span className={`text-xs font-semibold ${totalLogins > 5 ? "text-primary" : totalLogins > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                              {totalLogins}x /week
                            </span>
                            {activity && totalLogins > 0 && (
                              <div className="flex gap-0.5">
                                {DAY_NAMES.map((day) => {
                                  const count = activity.daily_breakdown[day] || 0;
                                  return (
                                    <div
                                      key={day}
                                      title={`${day}: ${count}x`}
                                      className={`w-3 h-3 rounded-sm text-[6px] flex items-center justify-center font-bold ${
                                        count > 2 ? "bg-primary text-primary-foreground" :
                                        count > 0 ? "bg-primary/30 text-primary" :
                                        "bg-muted text-muted-foreground/50"
                                      }`}
                                    >
                                      {day[0]}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="start">
                          <div className="p-3 border-b border-border">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <CalendarDays className="w-4 h-4 text-primary" />
                              Sign-In History (7 days)
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{u.full_name || u.oveercode}</p>
                          </div>
                          {activity && activity.timestamps.length > 0 ? (
                            <>
                              <div className="p-3 border-b border-border">
                                <div className="grid grid-cols-7 gap-1">
                                  {DAY_NAMES.map((day) => {
                                    const count = activity.daily_breakdown[day] || 0;
                                    return (
                                      <div key={day} className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] text-muted-foreground font-medium">{day}</span>
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                          count > 2 ? "bg-primary text-primary-foreground" :
                                          count > 0 ? "bg-primary/20 text-primary" :
                                          "bg-muted text-muted-foreground/40"
                                        }`}>
                                          {count}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="max-h-40 overflow-y-auto p-2">
                                {activity.timestamps.map((ts, idx) => {
                                  const d = new Date(ts);
                                  return (
                                    <div key={idx} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/50 text-xs">
                                      <span className="text-muted-foreground">
                                        {d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
                                      </span>
                                      <span className="font-mono text-foreground">
                                        {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                              No sign-in data this week
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
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
                      {new Date(u.created_at).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); assignRole(u.user_id, "admin"); }}>
                            <Shield className="w-4 h-4 mr-2" /> Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); assignRole(u.user_id, "instructor"); }}>
                            Make Instructor
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmDialog({ open: true, type: "deactivate", userId: u.user_id, name: u.full_name || "User" }); }}>
                            <UserX className="w-4 h-4 mr-2" /> Deactivate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmDialog({ open: true, type: "delete", userId: u.user_id, name: u.full_name || "User" }); }}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Profile
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
        {!loading && sortedFiltered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, sortedFiltered.length)}–{Math.min(page * PAGE_SIZE, sortedFiltered.length)} of {sortedFiltered.length}
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

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === "delete" ? "Delete User Profile?" : "Deactivate User?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === "delete"
                ? `The profile "${confirmDialog.name}" will be permanently deleted. This action cannot be undone.`
                : `User "${confirmDialog.name}" will be deactivated and unable to access the platform.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmDialog.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={() =>
                confirmDialog.type === "delete"
                  ? deleteUserProfile(confirmDialog.userId)
                  : deactivateUser(confirmDialog.userId)
              }
            >
              {confirmDialog.type === "delete" ? "Delete" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
      </TabsContent>

      <TabsContent value="bulk_cv">
        <AdminBulkCV />
      </TabsContent>
    </Tabs>
  );
};

export default AdminUsers;
