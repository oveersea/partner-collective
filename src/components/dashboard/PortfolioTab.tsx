import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FolderKanban, ExternalLink, Image as ImageIcon, Plus, X, Loader2, Trash2, Upload, Video, Link as LinkIcon, HardDrive,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_STORAGE = 50 * 1024 * 1024; // 50MB total per user

interface Portfolio {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  media_urls: string[] | null;
  video_url: string | null;
  video_type: string | null;
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
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [storageUsed, setStorageUsed] = useState(0);

  const [form, setForm] = useState({
    title: "", description: "", project_url: "",
    image_url: "", media_urls: [] as string[],
    video_url: "", video_type: "url" as "url" | "upload",
  });
  const [previewFiles, setPreviewFiles] = useState<string[]>([]);

  const fetchStorageUsage = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_storage_usage")
      .select("total_bytes")
      .eq("user_id", user.id)
      .maybeSingle();
    setStorageUsed(data?.total_bytes || 0);
  }, [user]);

  const fetchPortfolios = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_portfolios")
      .select("id, title, description, image_url, media_urls, video_url, video_type, project_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPortfolios((data as Portfolio[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPortfolios();
    fetchStorageUsage();
  }, [fetchPortfolios, fetchStorageUsage]);

  const updateStorageUsage = async (bytesChange: number) => {
    if (!user) return;
    // Upsert storage usage
    const { data: existing } = await supabase
      .from("user_storage_usage")
      .select("total_bytes")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_storage_usage")
        .update({ total_bytes: Math.max(0, existing.total_bytes + bytesChange), updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("user_storage_usage")
        .insert({ user_id: user.id, total_bytes: Math.max(0, bytesChange) });
    }
    setStorageUsed(prev => Math.max(0, prev + bytesChange));
  };

  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const totalNewBytes = Array.from(files).reduce((sum, f) => sum + f.size, 0);
    if (storageUsed + totalNewBytes > MAX_STORAGE) {
      toast.error(`Storage penuh. Sisa: ${formatBytes(MAX_STORAGE - storageUsed)}`);
      return;
    }

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} melebihi 10MB, dilewati.`);
        continue;
      }
    }

    setUploading(true);
    const newUrls: string[] = [];
    let totalUploaded = 0;

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) continue;
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("portfolios").upload(path, file);
      if (error) {
        toast.error(`Gagal upload: ${file.name}`);
        continue;
      }
      const { data: urlData } = supabase.storage.from("portfolios").getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
      totalUploaded += file.size;
    }

    if (newUrls.length > 0) {
      setForm(prev => ({
        ...prev,
        media_urls: [...prev.media_urls, ...newUrls],
        image_url: prev.image_url || newUrls[0], // first image as thumbnail
      }));
      setPreviewFiles(prev => [...prev, ...newUrls]);
      await updateStorageUsage(totalUploaded);
      toast.success(`${newUrls.length} gambar berhasil diunggah`);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran video maksimal 10MB");
      return;
    }
    if (storageUsed + file.size > MAX_STORAGE) {
      toast.error(`Storage penuh. Sisa: ${formatBytes(MAX_STORAGE - storageUsed)}`);
      return;
    }

    setUploadingVideo(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/vid-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("portfolios").upload(path, file);
    if (error) {
      toast.error("Gagal mengunggah video");
      setUploadingVideo(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("portfolios").getPublicUrl(path);
    setForm(prev => ({ ...prev, video_url: urlData.publicUrl, video_type: "upload" }));
    await updateStorageUsage(file.size);
    setUploadingVideo(false);
  };

  const removeMedia = (idx: number) => {
    setForm(prev => {
      const updated = prev.media_urls.filter((_, i) => i !== idx);
      return {
        ...prev,
        media_urls: updated,
        image_url: updated[0] || "",
      };
    });
    setPreviewFiles(prev => prev.filter((_, i) => i !== idx));
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
      image_url: form.media_urls[0] || form.image_url || null,
      media_urls: form.media_urls.length > 0 ? form.media_urls : null,
      video_url: form.video_url.trim() || null,
      video_type: form.video_url.trim() ? form.video_type : null,
    });

    if (error) {
      toast.error("Gagal menyimpan portfolio");
    } else {
      toast.success("Portfolio berhasil ditambahkan!");
      resetForm();
      fetchPortfolios();
    }
    setSaving(false);
  };

  const resetForm = () => {
    setForm({ title: "", description: "", project_url: "", image_url: "", media_urls: [], video_url: "", video_type: "url" });
    setPreviewFiles([]);
    setShowForm(false);
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

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const storagePercent = Math.min(100, (storageUsed / MAX_STORAGE) * 100);

  const getVideoEmbed = (url: string, type: string | null) => {
    if (type === "upload") {
      return <video src={url} controls className="w-full rounded-lg" style={{ maxHeight: "300px" }} />;
    }
    // YouTube / Vimeo embed
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
      return <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} className="w-full aspect-video rounded-lg" allowFullScreen />;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return <iframe src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} className="w-full aspect-video rounded-lg" allowFullScreen />;
    }
    return <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline flex items-center gap-1"><Video className="w-4 h-4" /> Lihat Video</a>;
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Storage indicator + Add button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="min-w-[160px]">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{formatBytes(storageUsed)} / {formatBytes(MAX_STORAGE)}</span>
              <span>{storagePercent.toFixed(0)}%</span>
            </div>
            <Progress value={storagePercent} className="h-1.5" />
          </div>
        </div>
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
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-5">
              <h3 className="font-semibold text-card-foreground">Tambah Portfolio Baru</h3>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Judul *</label>
                <Input placeholder="Nama proyek / karya" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Deskripsi</label>
                <Textarea placeholder="Deskripsi singkat tentang proyek ini" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">URL Project</label>
                <Input placeholder="https://..." value={form.project_url} onChange={e => setForm(f => ({ ...f, project_url: e.target.value }))} />
              </div>

              {/* ───── Multi-Image Upload ───── */}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Gambar (bisa upload banyak, maks 10MB/file)</label>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMultiImageUpload} />

                {previewFiles.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                    {previewFiles.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square">
                        <img src={url} alt={`Preview ${idx + 1}`} className="rounded-lg border border-border object-cover w-full h-full" />
                        <button
                          onClick={() => removeMedia(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-background/80 border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm hover:border-primary/40 hover:text-foreground transition-colors w-full justify-center"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Mengunggah..." : "Pilih gambar untuk diunggah"}
                </button>
              </div>

              {/* ───── Video Embed ───── */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Video (opsional)</label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setForm(f => ({ ...f, video_type: "url", video_url: "" }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${form.video_type === "url" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
                  >
                    <LinkIcon className="w-3 h-3" /> URL (YouTube/Vimeo)
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, video_type: "upload", video_url: "" }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${form.video_type === "upload" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
                  >
                    <Upload className="w-3 h-3" /> Upload Video
                  </button>
                </div>

                {form.video_type === "url" ? (
                  <Input placeholder="https://youtube.com/watch?v=... atau https://vimeo.com/..." value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} />
                ) : (
                  <>
                    <input ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                    {form.video_url ? (
                      <div className="relative">
                        <video src={form.video_url} controls className="w-full max-w-sm rounded-xl border border-border" style={{ maxHeight: "200px" }} />
                        <button
                          onClick={() => setForm(f => ({ ...f, video_url: "" }))}
                          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => videoFileRef.current?.click()}
                        disabled={uploadingVideo}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm hover:border-primary/40 hover:text-foreground transition-colors w-full justify-center"
                      >
                        {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                        {uploadingVideo ? "Mengunggah video..." : "Upload video (maks. 10MB)"}
                      </button>
                    )}
                  </>
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
                  onClick={resetForm}
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
          {portfolios.map((item, i) => {
            const allMedia = item.media_urls && item.media_urls.length > 0 ? item.media_urls : item.image_url ? [item.image_url] : [];
            return (
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

                {/* Media gallery */}
                {allMedia.length > 0 ? (
                  allMedia.length === 1 ? (
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img src={allMedia[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className={`grid gap-0.5 bg-muted overflow-hidden ${allMedia.length === 2 ? "grid-cols-2" : "grid-cols-3"}`} style={{ height: "160px" }}>
                      {allMedia.slice(0, 3).map((url, idx) => (
                        <div key={idx} className="relative overflow-hidden">
                          <img src={url} alt={`${item.title} ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          {idx === 2 && allMedia.length > 3 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">+{allMedia.length - 3}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="aspect-video bg-muted relative overflow-hidden flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/20" />
                  </div>
                )}

                {/* Video badge */}
                {item.video_url && (
                  <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md bg-background/80 border border-border text-xs font-medium flex items-center gap-1 text-muted-foreground">
                    <Video className="w-3 h-3" /> Video
                  </div>
                )}

                <div className="p-5">
                  <h3 className="font-semibold text-card-foreground mb-1 line-clamp-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
                  )}

                  {/* Video embed */}
                  {item.video_url && (
                    <div className="mb-3">
                      {getVideoEmbed(item.video_url, item.video_type)}
                    </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PortfolioTab;
