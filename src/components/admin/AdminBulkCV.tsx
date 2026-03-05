import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Upload, FileText, RefreshCw, CheckCircle2, XCircle, Loader2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type CvUpload = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number | null;
  parsing_status: string;
  parsing_error: string | null;
  candidate_id: string | null;
  created_at: string;
  updated_at: string;
};

const MAX_FILES = 20;
const MAX_CONCURRENT = 5;
const ARCHIVE_PAGE_SIZE = 25;
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const AdminBulkCV = () => {
  const [uploads, setUploads] = useState<CvUpload[]>([]);
  const [archivedAll, setArchivedAll] = useState<CvUpload[]>([]);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const [archivePage, setArchivePage] = useState(0);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<CvUpload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invitedIdsRef = useRef<Set<string>>(new Set());

  const fetchActiveUploads = useCallback(async () => {
    const { data, error } = await supabase
      .from("cv_uploads")
      .select("*")
      .neq("parsing_status", "completed")
      .order("created_at", { ascending: false });
    if (!error && data) setUploads(data as CvUpload[]);
    setLoading(false);
  }, []);

  const fetchArchiveCount = useCallback(async () => {
    const { count } = await supabase
      .from("cv_uploads")
      .select("*", { count: "exact", head: true })
      .eq("parsing_status", "completed");
    setArchiveTotal(count || 0);
  }, []);

  const fetchArchivePage = useCallback(async (page: number) => {
    setArchiveLoading(true);
    const from = page * ARCHIVE_PAGE_SIZE;
    const to = from + ARCHIVE_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("cv_uploads")
      .select("*")
      .eq("parsing_status", "completed")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (!error && data) setArchivedAll(data as CvUpload[]);
    setArchiveLoading(false);
  }, []);

  const fetchUploads = useCallback(async () => {
    await Promise.all([fetchActiveUploads(), fetchArchiveCount(), fetchArchivePage(archivePage)]);
  }, [fetchActiveUploads, fetchArchiveCount, fetchArchivePage, archivePage]);

  useEffect(() => {
    fetchActiveUploads();
    fetchArchiveCount();
    fetchArchivePage(0);
  }, []);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  // Auto-invite newly completed candidates
  const autoInviteCandidate = useCallback(async (candidateId: string) => {
    if (invitedIdsRef.current.has(candidateId)) return;
    invitedIdsRef.current.add(candidateId);

    try {
      const { data: candidate } = await supabase
        .from("candidates_archive")
        .select("id, full_name, email, phone")
        .eq("id", candidateId)
        .single();

      if (!candidate?.email) return;

      // Check if already invited
      const { data: existing } = await supabase
        .from("user_invitations")
        .select("id")
        .eq("email", candidate.email.toLowerCase().trim())
        .limit(1);

      if (existing && existing.length > 0) return;

      await supabase.functions.invoke("invite-users", {
        body: {
          invites: [{
            full_name: candidate.full_name || "",
            email: candidate.email,
            phone_number: candidate.phone || "",
          }],
        },
      });
    } catch (err) {
      console.error("Auto-invite error for candidate:", candidateId, err);
    }
  }, []);

  // Poll for status updates & auto-invite completed ones
  useEffect(() => {
    const hasProcessing = uploads.some(u => u.parsing_status === "processing" || u.parsing_status === "pending");
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("cv_uploads")
        .select("*")
        .neq("parsing_status", "completed")
        .order("created_at", { ascending: false });

      if (data) {
        const newUploads = data as CvUpload[];
        // Auto-invite newly completed candidates
        for (const u of newUploads) {
          if (u.parsing_status === "completed" && u.candidate_id) {
            autoInviteCandidate(u.candidate_id);
          }
        }
        setUploads(newUploads);
        // Refresh archive count when items move to completed
        fetchArchiveCount();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [uploads, autoInviteCandidate, fetchArchiveCount]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => ACCEPTED_TYPES.includes(f.type));
    const invalid = files.length - valid.length;

    if (invalid > 0) toast.warning(`${invalid} file dilewati (hanya PDF/DOCX)`);
    if (valid.length > MAX_FILES) {
      toast.error(`Maksimal ${MAX_FILES} file per batch`);
      setSelectedFiles(valid.slice(0, MAX_FILES));
    } else {
      setSelectedFiles(valid);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFile = async (file: File, userId: string) => {
    const fileId = `${file.name}-${Date.now()}`;
    try {
      setUploadProgress(prev => ({ ...prev, [fileId]: "uploading" }));

      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("cv-uploads")
        .upload(storagePath, file);

      if (storageError) throw new Error("Upload gagal: " + storageError.message);

      setUploadProgress(prev => ({ ...prev, [fileId]: "saving" }));

      const { data: record, error: insertError } = await supabase
        .from("cv_uploads")
        .insert({
          file_name: file.name,
          file_url: storagePath,
          file_type: ext,
          file_size_bytes: file.size,
          parsing_status: "pending",
          uploaded_by: userId,
        })
        .select()
        .single();

      if (insertError || !record) throw new Error("Gagal menyimpan record: " + (insertError?.message || ""));

      setUploadProgress(prev => ({ ...prev, [fileId]: "parsing" }));

      // Auto-parse immediately
      const { error: fnError } = await supabase.functions.invoke("parse-cv", {
        body: { cv_upload_id: record.id },
      });

      if (fnError) {
        console.error("Parse error:", fnError);
        setUploadProgress(prev => ({ ...prev, [fileId]: "error" }));
      } else {
        setUploadProgress(prev => ({ ...prev, [fileId]: "done" }));
      }
    } catch (err: any) {
      console.error("Process file error:", err);
      setUploadProgress(prev => ({ ...prev, [fileId]: "error" }));
      toast.error(`Gagal: ${file.name} - ${err.message}`);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadProgress({});

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sesi kadaluarsa, silakan login ulang");
      setUploading(false);
      return;
    }

    const files = [...selectedFiles];
    for (let i = 0; i < files.length; i += MAX_CONCURRENT) {
      const batch = files.slice(i, i + MAX_CONCURRENT);
      await Promise.allSettled(batch.map(f => processFile(f, user.id)));
    }

    setUploading(false);
    setSelectedFiles([]);
    setDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchUploads();
    toast.success("Upload selesai — parsing & invite otomatis berjalan");
  };

  const handleReparse = async (upload: CvUpload) => {
    toast.info(`Re-parsing ${upload.file_name}...`);
    await supabase
      .from("cv_uploads")
      .update({ parsing_status: "pending", parsing_error: null, updated_at: new Date().toISOString() })
      .eq("id", upload.id);

    const { error } = await supabase.functions.invoke("parse-cv", {
      body: { cv_upload_id: upload.id },
    });

    if (error) {
      toast.error("Re-parse gagal: " + error.message);
    } else {
      toast.success("Re-parse dimulai");
    }
    fetchUploads();
  };

  const handleDelete = async (upload: CvUpload) => {
    try {
      await supabase.storage.from("cv-uploads").remove([upload.file_url]);

      const { error } = await supabase
        .from("cv_uploads")
        .delete()
        .eq("id", upload.id);

      if (error) throw error;

      setUploads(prev => prev.filter(u => u.id !== upload.id));
      setArchivedAll(prev => prev.filter(u => u.id !== upload.id));
      if (upload.parsing_status === "completed") {
        setArchiveTotal(prev => Math.max(0, prev - 1));
      }
      setDeleteTarget(null);
      toast.success(`"${upload.file_name}" berhasil dihapus`);
    } catch (err: any) {
      toast.error("Gagal menghapus: " + err.message);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" />Selesai</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Proses</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Gagal</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const failedCount = uploads.filter(u => u.parsing_status === "failed").length;
  const processingCount = uploads.filter(u => u.parsing_status === "processing" || u.parsing_status === "pending").length;
  const activeUploads = uploads;
  const totalPages = Math.ceil(archiveTotal / ARCHIVE_PAGE_SIZE);

  const goToArchivePage = (page: number) => {
    setArchivePage(page);
    fetchArchivePage(page);
  };

  const renderTable = (items: CvUpload[], emptyMsg: string) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{emptyMsg}</p>
        </div>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File</TableHead>
            <TableHead>Ukuran</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Kandidat</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(u => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate max-w-[200px]">{u.file_name}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">{u.file_type}</Badge>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{formatSize(u.file_size_bytes)}</TableCell>
              <TableCell>
                {statusBadge(u.parsing_status)}
                {u.parsing_error && (
                  <p className="text-xs text-destructive mt-1 max-w-[200px] truncate" title={u.parsing_error}>
                    {u.parsing_error}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {u.candidate_id ? (
                  <Badge variant="outline" className="text-green-600 border-green-500/30">Tersimpan</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {(u.parsing_status === "failed" || u.parsing_status === "pending") && (
                    <Button size="sm" variant="outline" onClick={() => handleReparse(u)}>
                      <RefreshCw className="w-3 h-3 mr-1" />Re-parse
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(u)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bulk CV Upload</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload CV — parsing & invite kandidat berjalan otomatis (maks {MAX_FILES} per batch)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUploads} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload CVs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-foreground">{uploads.length + archiveTotal}</div>
            <div className="text-sm text-muted-foreground">Total Upload</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-green-600">{archiveTotal}</div>
            <div className="text-sm text-muted-foreground">Berhasil Diparse</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-blue-600">{processingCount}</div>
            <div className="text-sm text-muted-foreground">Sedang Diproses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-destructive">{failedCount}</div>
            <div className="text-sm text-muted-foreground">Gagal</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Active & Archive */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Aktif {activeUploads.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{activeUploads.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="archive" onClick={() => { if (archivedAll.length === 0) fetchArchivePage(0); }}>
            Arsip {archiveTotal > 0 && <Badge variant="secondary" className="ml-2 text-xs">{archiveTotal}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sedang Diproses / Berkendala</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeUploads.length === 0 && archiveTotal === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Belum ada CV yang diupload</p>
                  <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />Upload CV Pertama
                  </Button>
                </div>
              ) : (
                renderTable(activeUploads, "Semua CV berhasil diproses — cek tab Arsip")
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Arsip — Berhasil Diparse</CardTitle>
                {archiveTotal > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {archivePage * ARCHIVE_PAGE_SIZE + 1}–{Math.min((archivePage + 1) * ARCHIVE_PAGE_SIZE, archiveTotal)} dari {archiveTotal}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {archiveLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {renderTable(archivedAll, "Belum ada CV yang selesai diparse")}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={archivePage === 0}
                        onClick={() => goToArchivePage(archivePage - 1)}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Sebelumnya
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          let page: number;
                          if (totalPages <= 7) {
                            page = i;
                          } else if (archivePage < 4) {
                            page = i;
                          } else if (archivePage > totalPages - 5) {
                            page = totalPages - 7 + i;
                          } else {
                            page = archivePage - 3 + i;
                          }
                          return (
                            <Button
                              key={page}
                              variant={page === archivePage ? "default" : "ghost"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => goToArchivePage(page)}
                            >
                              {page + 1}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={archivePage >= totalPages - 1}
                        onClick={() => goToArchivePage(archivePage + 1)}
                      >
                        Selanjutnya <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!uploading) setDialogOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Bulk CV</DialogTitle>
            <DialogDescription>
              Pilih hingga {MAX_FILES} file CV (PDF/DOCX). Parsing dan invite kandidat akan berjalan otomatis setelah upload.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Klik untuk memilih file atau drag & drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX (maks {MAX_FILES} file, 20MB per file)</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-auto">
                {selectedFiles.map((file, i) => {
                  const fileId = `${file.name}-${Date.now()}`;
                  const status = uploadProgress[fileId];
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                      {!uploading && (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeFile(i)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengupload, parsing & invite {selectedFiles.length} file...</span>
                </div>
                <Progress value={
                  (Object.values(uploadProgress).filter(s => s === "done" || s === "error").length / selectedFiles.length) * 100
                } className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>
              Batal
            </Button>
            <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Upload {selectedFiles.length} File</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus CV Upload?</AlertDialogTitle>
            <AlertDialogDescription>
              File "{deleteTarget?.file_name}" akan dihapus dari storage dan daftar upload.
              {deleteTarget?.candidate_id
                ? " Data kandidat yang sudah diparse tetap tersimpan di database dan tidak akan terpengaruh."
                : " Belum ada data kandidat yang tersimpan dari file ini."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBulkCV;
