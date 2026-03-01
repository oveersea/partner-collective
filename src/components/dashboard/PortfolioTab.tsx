import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FolderKanban, ExternalLink, Image as ImageIcon, Plus, X, Loader2, Trash2, Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Portfolio {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
  created_at: string;
}

const PortfolioTab = () => {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ title: "", description: "", project_url: "", image_url: "" });
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  const fetchPortfolios = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_portfolios")
      .select("id, title, description, image_url, project_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPortfolios((data as Portfolio[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPortfolios();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("portfolios").upload(path, file);
    if (error) {
      toast.error("Gagal mengunggah gambar");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("portfolios").getPublicUrl(path);
    setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
    setPreviewFile(urlData.publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.title.trim()) {
      toast.error("Judul portfolio wajib diisi");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("user_portfolios").insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      project_url: form.project_url.trim() || null,
      image_url: form.image_url || null,
    });

    if (error) {
      toast.error("Gagal menyimpan portfolio");
    } else {
      toast.success("Portfolio berhasil ditambahkan!");
      setForm({ title: "", description: "", project_url: "", image_url: "" });
      setPreviewFile(null);
      setShowForm(false);
      fetchPortfolios();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeleting(id);
    const { error } = await supabase
      .from("user_portfolios")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Gagal menghapus portfolio");
    } else {
      toast.success("Portfolio dihapus");
      setPortfolios(prev => prev.filter(p => p.id !== id));
    }
    setDeleting(null);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Batal" : "Tambah Portfolio"}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
              <h3 className="font-semibold text-card-foreground">Tambah Portfolio Baru</h3>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Judul *</label>
                <Input
                  placeholder="Nama proyek / karya"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Deskripsi</label>
                <Textarea
                  placeholder="Deskripsi singkat tentang proyek ini"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">URL Project</label>
                <Input
                  placeholder="https://..."
                  value={form.project_url}
                  onChange={e => setForm(f => ({ ...f, project_url: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Gambar</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {previewFile ? (
                  <div className="relative w-full max-w-xs">
                    <img src={previewFile} alt="Preview" className="rounded-xl border border-border object-cover aspect-video w-full" />
                    <button
                      onClick={() => { setPreviewFile(null); setForm(f => ({ ...f, image_url: "" })); }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Mengunggah..." : "Unggah gambar (maks. 5MB)"}
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan
                </button>
                <button
                  onClick={() => { setShowForm(false); setForm({ title: "", description: "", project_url: "", image_url: "" }); setPreviewFile(null); }}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio grid */}
      {portfolios.length === 0 && !showForm ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
          <FolderKanban className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-card-foreground mb-1">Belum ada portofolio</h3>
          <p className="text-sm text-muted-foreground">Proyek dan karya Anda akan tampil di sini.</p>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {portfolios.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all relative"
            >
              {/* Delete button */}
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deleting === item.id}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-background/80 border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors opacity-0 group-hover:opacity-100"
              >
                {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>

              {/* Image */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-card-foreground mb-1 line-clamp-1">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
                )}
                {item.project_url && (
                  <a
                    href={item.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Lihat Project
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioTab;
