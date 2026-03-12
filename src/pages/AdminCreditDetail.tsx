import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2, XCircle, Trash2, Loader2 } from "lucide-react";

const AdminCreditDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "deposit"; // "order" or "deposit"
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id, type]);

  const fetchDetail = async () => {
    setLoading(true);

    // Check superadmin
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      setIsSuperadmin(roleData?.some((r: any) => r.role === "superadmin") || false);
    }

    if (type === "order") {
      const { data: row } = await (supabase as any)
        .from("credit_orders")
        .select("*")
        .eq("id", id!)
        .single();
      if (row) {
        setData(row);
        setAdminNotes((row as any).admin_notes || "");
        // Fetch user name
        const { data: p } = await supabase.from("profiles").select("full_name").eq("user_id", (row as any).user_id).single();
        if (p) setUserName(p.full_name || "");
        if ((row as any).business_id) {
          const { data: b } = await supabase.from("business_profiles").select("name").eq("id", (row as any).business_id).single();
          if (b) setBusinessName(b.name || "");
        }
      }
    } else {
      const { data: row } = await (supabase as any)
        .from("wallet_deposits")
        .select("*")
        .eq("id", id!)
        .single();
      if (row) {
        setData(row);
        setAdminNotes((row as any).admin_notes || "");
        const { data: p } = await supabase.from("profiles").select("full_name").eq("user_id", (row as any).user_id).single();
        if (p) setUserName(p.full_name || "");
        if ((row as any).business_id) {
          const { data: b } = await supabase.from("business_profiles").select("name").eq("id", (row as any).business_id).single();
          if (b) setBusinessName(b.name || "");
        }
      }
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    setSaving(true);
    const table = type === "order" ? "credit_orders" : "wallet_deposits";
    const { error } = await (supabase as any).from(table).update({ status: "paid", admin_notes: adminNotes }).eq("id", id!);
    if (error) toast.error("Gagal approve: " + error.message);
    else { toast.success("Berhasil diapprove"); fetchDetail(); }
    setSaving(false);
  };

  const handleReject = async () => {
    setSaving(true);
    const table = type === "order" ? "credit_orders" : "wallet_deposits";
    const { error } = await supabase.from(table).update({ status: "rejected", admin_notes: adminNotes }).eq("id", id!);
    if (error) toast.error("Gagal reject: " + error.message);
    else { toast.success("Berhasil ditolak"); fetchDetail(); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus data ini? Aksi ini tidak bisa dibatalkan.")) return;
    setSaving(true);
    const table = type === "order" ? "credit_orders" : "wallet_deposits";
    const { error } = await supabase.from(table).delete().eq("id", id!);
    if (error) toast.error("Gagal menghapus: " + error.message);
    else { toast.success("Data berhasil dihapus"); navigate("/admin?tab=credits"); }
    setSaving(false);
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    const table = type === "order" ? "credit_orders" : "wallet_deposits";
    const { error } = await supabase.from(table).update({ admin_notes: adminNotes }).eq("id", id!);
    if (error) toast.error("Gagal simpan catatan");
    else toast.success("Catatan disimpan");
    setSaving(false);
  };

  const statusBadge = (s: string) => {
    if (s === "paid" || s === "confirmed") return "bg-primary/10 text-primary";
    if (s === "pending") return "bg-amber-500/10 text-amber-600";
    if (s === "rejected" || s === "cancelled") return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Button variant="ghost" onClick={() => navigate("/admin?tab=credits")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
        <p className="mt-8 text-center text-muted-foreground">Data tidak ditemukan</p>
      </div>
    );
  }

  const isOrder = type === "order";
  const number = isOrder ? data.order_number : data.deposit_number;
  const amount = isOrder
    ? new Intl.NumberFormat("id-ID", { style: "currency", currency: data.currency || "IDR", maximumFractionDigits: 0 }).format(data.amount_cents)
    : new Intl.NumberFormat("id-ID", { style: "currency", currency: data.currency || "IDR", maximumFractionDigits: 0 }).format(data.amount);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin?tab=credits")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {isOrder ? "Detail Credit Order" : "Detail Wallet Deposit"}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">{number}</p>
          </div>
          <span className={`ml-auto text-xs font-medium px-3 py-1 rounded-full ${statusBadge(data.status)}`}>
            {data.status}
          </span>
        </div>

        {/* Info Card */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">User</p>
              <p className="font-medium text-foreground">{userName || "—"}</p>
            </div>
            {businessName && (
              <div>
                <p className="text-muted-foreground">Perusahaan</p>
                <p className="font-medium text-foreground">{businessName}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Jumlah</p>
              <p className="font-semibold text-foreground text-lg">{amount}</p>
            </div>
            {isOrder && (
              <div>
                <p className="text-muted-foreground">Kredit</p>
                <p className="font-semibold text-foreground text-lg">{data.credits}</p>
              </div>
            )}
            {isOrder && (
              <div>
                <p className="text-muted-foreground">Tipe Pembeli</p>
                <Badge variant="secondary">{data.buyer_type}</Badge>
              </div>
            )}
            {!isOrder && (
              <div>
                <p className="text-muted-foreground">Metode</p>
                <p className="font-medium text-foreground">{data.method}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Tanggal Dibuat</p>
              <p className="font-medium text-foreground">
                {new Date(data.created_at).toLocaleString("id-ID")}
              </p>
            </div>
            {data.xendit_invoice_id && (
              <div>
                <p className="text-muted-foreground">Xendit Invoice ID</p>
                <p className="font-mono text-xs text-foreground">{data.xendit_invoice_id}</p>
              </div>
            )}
            {data.xendit_paid_at && (
              <div>
                <p className="text-muted-foreground">Xendit Paid At</p>
                <p className="font-medium text-foreground">
                  {new Date(data.xendit_paid_at).toLocaleString("id-ID")}
                </p>
              </div>
            )}
            {data.payment_proof_url && (
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">Bukti Pembayaran</p>
                <a href={data.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm break-all">
                  {data.payment_proof_url}
                </a>
              </div>
            )}
            {data.description && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Deskripsi</p>
                <p className="text-foreground">{data.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin Notes */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Catatan Admin</h3>
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Tambahkan catatan..."
            className="mb-3"
            rows={3}
          />
          <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={saving}>
            Simpan Catatan
          </Button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {data.status === "pending" && (
            <>
              <Button onClick={handleApprove} disabled={saving} className="gap-1">
                <CheckCircle2 className="w-4 h-4" /> Approve
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={saving} className="gap-1">
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </>
          )}
          {isSuperadmin && (
            <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1 ml-auto" onClick={handleDelete} disabled={saving}>
              <Trash2 className="w-4 h-4" /> Hapus
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCreditDetail;
