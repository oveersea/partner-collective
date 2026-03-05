import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, UserPlus, X, Star, Loader2, Users, Archive,
  CheckCircle2, XCircle, Send,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MatchedCandidate {
  id: string;
  source_type: "profile" | "archive";
  profile_user_id: string | null;
  candidate_archive_id: string | null;
  match_score: number;
  status: string;
  notes: string | null;
  created_at: string;
  // resolved
  name: string;
  email: string | null;
  skills: string[];
  title: string | null;
  oveercode: string | null;
}

interface CandidateOption {
  id: string;
  name: string;
  email: string | null;
  skills: string[];
  title: string | null;
  source: "profile" | "archive";
  oveercode: string | null;
}

interface Props {
  hiringRequestId: string;
  requiredSkills: string[];
}

const HiringCandidatePanel = ({ hiringRequestId, requiredSkills }: Props) => {
  const { user } = useAuth();
  const [matched, setMatched] = useState<MatchedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CandidateOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [noteDialog, setNoteDialog] = useState<{ id: string; notes: string } | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState<"profile" | "archive">("profile");

  const fetchMatched = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("hiring_matched_candidates")
      .select("*")
      .eq("hiring_request_id", hiringRequestId)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setMatched([]);
      setLoading(false);
      return;
    }

    const profileIds = data.filter(d => d.profile_user_id).map(d => d.profile_user_id!);
    const archiveIds = data.filter(d => d.candidate_archive_id).map(d => d.candidate_archive_id!);

    const [profilesRes, archivesRes] = await Promise.all([
      profileIds.length > 0
        ? supabase.from("profiles").select("user_id, full_name, skills, current_title, oveercode").in("user_id", profileIds)
        : { data: [] },
      archiveIds.length > 0
        ? supabase.from("candidates_archive").select("id, full_name, skills, current_title, oveercode, email").in("id", archiveIds)
        : { data: [] },
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
    const archiveMap = new Map((archivesRes.data || []).map((a: any) => [a.id, a]));

    const resolved: MatchedCandidate[] = data.map((d: any) => {
      if (d.source_type === "profile" && d.profile_user_id) {
        const p = profileMap.get(d.profile_user_id);
        return { ...d, name: p?.full_name || "Unknown", email: null, skills: p?.skills || [], title: p?.current_title, oveercode: p?.oveercode };
      }
      const a = archiveMap.get(d.candidate_archive_id);
      return { ...d, name: a?.full_name || "Unknown", email: a?.email, skills: a?.skills || [], title: a?.current_title, oveercode: a?.oveercode };
    });

    setMatched(resolved);
    setLoading(false);
  }, [hiringRequestId]);

  useEffect(() => { fetchMatched(); }, [fetchMatched]);

  const searchCandidates = async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);

    const existingProfileIds = matched.filter(m => m.profile_user_id).map(m => m.profile_user_id);
    const existingArchiveIds = matched.filter(m => m.candidate_archive_id).map(m => m.candidate_archive_id);

    if (activeSearchTab === "profile") {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, skills, current_title, oveercode")
        .ilike("full_name", `%${query}%`)
        .limit(20);

      setSearchResults(
        (data || [])
          .filter((p: any) => !existingProfileIds.includes(p.user_id))
          .map((p: any) => ({
            id: p.user_id,
            name: p.full_name,
            email: null,
            skills: p.skills || [],
            title: p.current_title,
            source: "profile" as const,
            oveercode: p.oveercode,
          }))
      );
    } else {
      const { data } = await supabase
        .from("candidates_archive")
        .select("id, full_name, skills, current_title, oveercode, email")
        .ilike("full_name", `%${query}%`)
        .limit(20);

      setSearchResults(
        (data || [])
          .filter((a: any) => !existingArchiveIds.includes(a.id))
          .map((a: any) => ({
            id: a.id,
            name: a.full_name,
            email: a.email,
            skills: a.skills || [],
            title: a.current_title,
            source: "archive" as const,
            oveercode: a.oveercode,
          }))
      );
    }
    setSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => searchCandidates(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeSearchTab]);

  const addCandidate = async (candidate: CandidateOption) => {
    if (!user) return;
    setAdding(candidate.id);

    // Calculate simple skill match score
    const matchedSkills = requiredSkills.filter(rs =>
      candidate.skills.some(cs => cs.toLowerCase() === rs.toLowerCase())
    );
    const score = requiredSkills.length > 0
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 0;

    const insert: any = {
      hiring_request_id: hiringRequestId,
      source_type: candidate.source,
      match_score: score,
      matched_by: user.id,
    };
    if (candidate.source === "profile") insert.profile_user_id = candidate.id;
    else insert.candidate_archive_id = candidate.id;

    const { error } = await supabase.from("hiring_matched_candidates").insert(insert);
    if (error) {
      toast.error("Gagal menambahkan kandidat");
    } else {
      toast.success(`${candidate.name} ditambahkan ke shortlist`);
      setSearchResults(prev => prev.filter(r => r.id !== candidate.id));
      fetchMatched();
    }
    setAdding(null);
  };

  const removeCandidate = async (id: string) => {
    const { error } = await supabase.from("hiring_matched_candidates").delete().eq("id", id);
    if (error) toast.error("Gagal menghapus kandidat");
    else { toast.success("Kandidat dihapus"); fetchMatched(); }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("hiring_matched_candidates").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Gagal update status");
    else { toast.success(`Status diubah ke ${status}`); fetchMatched(); }
  };

  const saveNote = async () => {
    if (!noteDialog) return;
    setSavingNote(true);
    const { error } = await supabase.from("hiring_matched_candidates").update({ notes: noteDialog.notes, updated_at: new Date().toISOString() }).eq("id", noteDialog.id);
    if (error) toast.error("Gagal simpan catatan");
    else { toast.success("Catatan disimpan"); fetchMatched(); }
    setSavingNote(false);
    setNoteDialog(null);
  };

  const skillMatch = (candidateSkills: string[]) => {
    if (!requiredSkills.length) return 0;
    const matched = requiredSkills.filter(rs => candidateSkills.some(cs => cs.toLowerCase() === rs.toLowerCase()));
    return Math.round((matched.length / requiredSkills.length) * 100);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      shortlisted: "bg-blue-500/10 text-blue-600",
      submitted: "bg-amber-500/10 text-amber-600",
      accepted: "bg-emerald-500/10 text-emerald-600",
      rejected: "bg-destructive/10 text-destructive",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold text-foreground">Matched Candidates ({matched.length})</Label>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setAddDialogOpen(true); setSearchQuery(""); setSearchResults([]); }}>
          <UserPlus className="w-3.5 h-3.5" /> Add Candidate
        </Button>
      </div>

      {/* Required skills */}
      {requiredSkills.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground">Required Skills</Label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {requiredSkills.map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Matched list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : matched.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
          Belum ada kandidat yang ditambahkan
        </div>
      ) : (
        <div className="space-y-2">
          {matched.map((c) => (
            <div key={c.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {c.source_type === "profile" ? <Users className="w-3.5 h-3.5 text-primary" /> : <Archive className="w-3.5 h-3.5 text-amber-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  {c.oveercode && <span className="text-[10px] text-muted-foreground">#{c.oveercode}</span>}
                  <Badge variant="outline" className={`text-[10px] ${statusBadge(c.status)}`}>{c.status}</Badge>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.match_score >= 70 ? "bg-emerald-500/10 text-emerald-600" : c.match_score >= 40 ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                    <Star className="w-2.5 h-2.5 inline mr-0.5" />{c.match_score}%
                  </span>
                </div>
                {c.title && <p className="text-xs text-muted-foreground mt-0.5">{c.title}</p>}
                {c.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.skills.slice(0, 6).map(s => {
                      const isMatch = requiredSkills.some(rs => rs.toLowerCase() === s.toLowerCase());
                      return (
                        <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded ${isMatch ? "bg-emerald-500/10 text-emerald-600 font-medium" : "bg-muted text-muted-foreground"}`}>{s}</span>
                      );
                    })}
                    {c.skills.length > 6 && <span className="text-[10px] text-muted-foreground">+{c.skills.length - 6}</span>}
                  </div>
                )}
                {c.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{c.notes}"</p>}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {c.status === "shortlisted" && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary" onClick={() => updateStatus(c.id, "submitted")}>
                    <Send className="w-3 h-3" /> Submit
                  </Button>
                )}
                {c.status === "submitted" && (
                  <>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-emerald-600" onClick={() => updateStatus(c.id, "accepted")}>
                      <CheckCircle2 className="w-3 h-3" /> Accept
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive" onClick={() => updateStatus(c.id, "rejected")}>
                      <XCircle className="w-3 h-3" /> Reject
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setNoteDialog({ id: c.id, notes: c.notes || "" })}>
                  Note
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => removeCandidate(c.id)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Candidate Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Tambah Kandidat</DialogTitle>
          </DialogHeader>
          <Tabs value={activeSearchTab} onValueChange={(v) => { setActiveSearchTab(v as any); setSearchQuery(""); setSearchResults([]); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Profiles</TabsTrigger>
              <TabsTrigger value="archive" className="gap-1.5"><Archive className="w-3.5 h-3.5" /> CV Archive</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Cari nama kandidat..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[400px]">
            {searching && (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            )}
            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">Tidak ditemukan</p>
            )}
            {searchResults.map((c) => {
              const score = skillMatch(c.skills);
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      {c.oveercode && <span className="text-[10px] text-muted-foreground">#{c.oveercode}</span>}
                      {score > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${score >= 70 ? "bg-emerald-500/10 text-emerald-600" : score >= 40 ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                          {score}% match
                        </span>
                      )}
                    </div>
                    {c.title && <p className="text-xs text-muted-foreground">{c.title}</p>}
                    {c.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.skills.slice(0, 5).map(s => {
                          const isMatch = requiredSkills.some(rs => rs.toLowerCase() === s.toLowerCase());
                          return <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded ${isMatch ? "bg-emerald-500/10 text-emerald-600 font-medium" : "bg-muted text-muted-foreground"}`}>{s}</span>;
                        })}
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="gap-1 shrink-0" disabled={adding === c.id} onClick={() => addCandidate(c)}>
                    {adding === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    Add
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={!!noteDialog} onOpenChange={() => setNoteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Catatan Kandidat</DialogTitle></DialogHeader>
          <Textarea rows={3} value={noteDialog?.notes || ""} onChange={(e) => setNoteDialog(prev => prev ? { ...prev, notes: e.target.value } : null)} placeholder="Tulis catatan..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(null)}>Batal</Button>
            <Button onClick={saveNote} disabled={savingNote}>
              {savingNote ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HiringCandidatePanel;
