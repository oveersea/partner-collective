import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Plus, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface InviteRow {
  full_name: string;
  email: string;
  phone_number: string;
}

interface InviteResult {
  email: string;
  success: boolean;
  error?: string;
}

const emptyRow = (): InviteRow => ({ full_name: "", email: "", phone_number: "" });

const InviteUsersDialog = ({ onComplete }: { onComplete?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<InviteRow[]>([emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InviteResult[] | null>(null);

  const updateRow = (index: number, field: keyof InviteRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const addRow = () => {
    if (rows.length >= 20) return;
    setRows((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const isValid = rows.every((r) => r.full_name.trim() && r.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim()));

  const handleSubmit = async () => {
    setLoading(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("invite-users", {
        body: { invites: rows },
      });
      if (error) throw error;
      setResults(data.results);
      const { success, failed } = data.summary;
      if (failed === 0) toast.success(`${success} user berhasil diundang!`);
      else toast.warning(`${success} berhasil, ${failed} gagal`);
    } catch (err: any) {
      toast.error("Gagal mengirim undangan: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setRows([emptyRow()]);
    setResults(null);
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" /> Invite Users
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Users</DialogTitle>
        </DialogHeader>

        {results ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Hasil undangan:</p>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${r.success ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"}`}>
                  {r.success ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> : <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.email}</p>
                    {r.error && <p className="text-xs text-destructive">{r.error}</p>}
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handleClose} className="w-full">Tutup</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Masukkan data user yang ingin diundang (maks. 20 per batch).</p>

            <div className="space-y-3">
              {rows.map((row, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground mt-3 w-5 shrink-0">{i + 1}.</span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      placeholder="Nama lengkap *"
                      value={row.full_name}
                      onChange={(e) => updateRow(i, "full_name", e.target.value)}
                    />
                    <Input
                      type="email"
                      placeholder="Email *"
                      value={row.email}
                      onChange={(e) => updateRow(i, "email", e.target.value)}
                    />
                    <Input
                      placeholder="No. ponsel"
                      value={row.phone_number}
                      onChange={(e) => updateRow(i, "phone_number", e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 mt-0.5"
                    disabled={rows.length <= 1}
                    onClick={() => removeRow(i)}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={addRow} disabled={rows.length >= 20} className="gap-1">
                <Plus className="w-4 h-4" /> Tambah baris
              </Button>
              <span className="text-xs text-muted-foreground">{rows.length}/20</span>
            </div>

            <Button onClick={handleSubmit} disabled={loading || !isValid} className="w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? "Mengirim undangan..." : `Kirim Undangan (${rows.length})`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteUsersDialog;
