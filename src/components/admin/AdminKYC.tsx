import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, FileText, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface KycSubmission {
  id: string;
  user_id: string;
  status: string;
  primary_doc_type: string;
  primary_doc_file_name: string;
  primary_doc_file_url: string;
  support_doc1_file_name: string;
  support_doc1_file_url: string;
  support_doc1_label: string;
  support_doc2_file_name: string;
  support_doc2_file_url: string;
  support_doc2_label: string;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  profiles: { full_name: string | null; oveercode: string } | null;
}

const AdminKYC = () => {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState<KycSubmission | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    let query = supabase
      .from("kyc_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter !== "all") query = query.eq("status", filter);

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to load KYC data");
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((d: any) => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, oveercode")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, { full_name: p.full_name, oveercode: p.oveercode }])
      );

      setSubmissions(
        data.map((d: any) => ({
          ...d,
          profiles: profileMap.get(d.user_id) || null,
        })) as KycSubmission[]
      );
    } else {
      setSubmissions([]);
    }
    setLoading(false);
  };

  const handleApprove = async (sub: KycSubmission) => {
    setProcessing(true);
    const { error: e1 } = await supabase
      .from("kyc_submissions")
      .update({ status: "approved", admin_notes: notes || null, reviewed_at: new Date().toISOString() })
      .eq("id", sub.id);

    const { error: e2 } = await supabase
      .from("profiles")
      .update({ kyc_status: "approved" })
      .eq("user_id", sub.user_id);

    if (e1 || e2) toast.error("Failed to approve KYC");
    else {
      toast.success("KYC approved successfully");
      setSelected(null);
      fetchSubmissions();
    }
    setProcessing(false);
  };

  const handleReject = async (sub: KycSubmission) => {
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    setProcessing(true);
    const { error: e1 } = await supabase
      .from("kyc_submissions")
      .update({ status: "rejected", rejection_reason: rejectionReason, admin_notes: notes || null, reviewed_at: new Date().toISOString() })
      .eq("id", sub.id);

    const { error: e2 } = await supabase
      .from("profiles")
      .update({ kyc_status: "rejected" })
      .eq("user_id", sub.user_id);

    if (e1 || e2) toast.error("Failed to reject KYC");
    else {
      toast.success("KYC rejected");
      setSelected(null);
      fetchSubmissions();
    }
    setProcessing(false);
  };

  const statusIcon = (s: string) => {
    if (s === "approved" || s === "verified") return <CheckCircle2 className="w-4 h-4 text-primary" />;
    if (s === "rejected") return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  const filters = ["pending", "approved", "rejected", "all"];

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-6">KYC Verification</h2>

      <div className="flex gap-2 mb-4">
        {filters.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
            {f === "all" ? "All" : f}
          </Button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Document</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={5} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : submissions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No data found</td></tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {sub.profiles?.full_name || "—"}
                      <span className="block text-xs text-muted-foreground font-mono">{sub.profiles?.oveercode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs uppercase">{sub.primary_doc_type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(sub.status)}
                        <span className="text-xs capitalize">{sub.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(sub.created_at).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => { setSelected(sub); setNotes(sub.admin_notes || ""); setRejectionReason(""); }}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review KYC — {selected?.profiles?.full_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Primary Document ({selected.primary_doc_type.toUpperCase()})</p>
                <a href={selected.primary_doc_file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <FileText className="w-4 h-4" /> {selected.primary_doc_file_name} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {selected.support_doc1_file_url && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{selected.support_doc1_label}</p>
                  <a href={selected.support_doc1_file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <FileText className="w-4 h-4" /> {selected.support_doc1_file_name} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {selected.support_doc2_file_url && selected.support_doc2_file_url !== "" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{selected.support_doc2_label}</p>
                  <a href={selected.support_doc2_file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <FileText className="w-4 h-4" /> {selected.support_doc2_file_name} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-foreground">Admin Notes</label>
                <Textarea className="mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes..." />
              </div>

              {selected.status === "pending" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-foreground">Rejection Reason (if rejecting)</label>
                    <Textarea className="mt-1" rows={2} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Fill if rejecting..." />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={() => handleApprove(selected)} disabled={processing}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleReject(selected)} disabled={processing}>
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKYC;
