

# Bulk CV Upload & Parsing (Superadmin)

## Overview
Menambahkan fitur di panel Superadmin untuk upload dan parsing CV secara bulk (maksimal 20 file per batch). File CV (PDF/DOCX) akan di-upload ke storage bucket `cv-uploads`, lalu diproses oleh AI (Lovable AI Gateway + Gemini) untuk mengekstrak data kandidat secara otomatis ke tabel `candidates_archive`.

## Arsitektur

```text
Admin UI (Bulk Upload Dialog)
       |
       v  upload files ke storage bucket "cv-uploads"
       |
       v  insert records ke tabel "cv_uploads" (status: pending)
       |
       v  panggil edge function "parse-cv" per file
       |
Edge Function: parse-cv
  - Download file dari storage
  - Kirim konten ke Lovable AI Gateway (Gemini) via tool calling
  - Extract: nama, email, phone, skills, pengalaman, pendidikan, dll
  - Insert/update ke tabel "candidates_archive"
  - Update cv_uploads status -> "completed"
       |
       v
Data kandidat tersimpan di candidates_archive
```

## Komponen yang Dibuat/Dimodifikasi

### 1. Edge Function `parse-cv`
- Menerima `{ cv_upload_id }` sebagai input
- Download file dari storage bucket `cv-uploads` menggunakan service role
- Konversi file ke base64 (untuk PDF) atau text
- Kirim ke Lovable AI Gateway dengan tool calling untuk structured output
- Ekstrak: full_name, email, phone, city, country, current_title, current_company, skills[], years_of_experience, education (JSON), work_experience (JSON), certifications (JSON), summary
- Insert hasil ke `candidates_archive`, link via `candidate_id` di `cv_uploads`
- Update `cv_uploads.parsing_status` menjadi "completed" atau "failed"
- Menggunakan `LOVABLE_API_KEY` (sudah tersedia) dan `SB_SERVICE_ROLE_KEY`

### 2. Admin UI: `AdminBulkCV.tsx`
- Section baru di sidebar admin: "Bulk CV"
- Halaman utama menampilkan daftar CV uploads dengan status parsing
- Tombol "Upload CVs" membuka dialog upload
- Dialog mendukung multi-file selection (max 20 files, PDF/DOCX only)
- Progress bar per file (upload -> parsing -> done)
- Tabel hasil: nama file, status parsing, nama kandidat (jika berhasil), actions
- Bisa re-parse jika gagal

### 3. Modifikasi Sidebar & Dashboard
- Tambah menu "Bulk CV" di `AdminSidebar.tsx`
- Tambah routing di `AdminDashboard.tsx`

### 4. Database
- Tabel `cv_uploads` dan `candidates_archive` sudah ada, tidak perlu migrasi baru
- Storage bucket `cv-uploads` sudah ada

## Detail Teknis

### Edge Function: parse-cv

Menggunakan Lovable AI Gateway dengan tool calling untuk mendapatkan structured output:

```typescript
// Tool definition untuk extract CV data
tools: [{
  type: "function",
  function: {
    name: "extract_cv_data",
    parameters: {
      type: "object",
      properties: {
        full_name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        skills: { type: "array", items: { type: "string" } },
        current_title: { type: "string" },
        current_company: { type: "string" },
        years_of_experience: { type: "number" },
        education: { type: "array", items: { ... } },
        work_experience: { type: "array", items: { ... } },
        // dll
      }
    }
  }
}]
```

Model: `google/gemini-3-flash-preview` (default, cepat dan akurat)

### Upload Flow
1. Admin pilih hingga 20 file PDF/DOCX
2. Client upload semua file ke `cv-uploads` bucket via Supabase Storage
3. Client insert record ke `cv_uploads` tabel per file (status: pending)
4. Client panggil edge function `parse-cv` per file secara paralel (max 5 concurrent)
5. Edge function proses dan update status
6. UI polling atau realtime untuk update status

### Keamanan
- Edge function memverifikasi JWT caller dan cek role superadmin
- Storage bucket `cv-uploads` sudah private
- File hanya bisa diakses via service role di edge function

### Config
```toml
[functions.parse-cv]
verify_jwt = false
```

## File yang Akan Dibuat/Dimodifikasi

| File | Aksi |
|------|------|
| `supabase/functions/parse-cv/index.ts` | Baru |
| `src/components/admin/AdminBulkCV.tsx` | Baru |
| `src/components/admin/AdminSidebar.tsx` | Modifikasi (tambah menu) |
| `src/pages/AdminDashboard.tsx` | Modifikasi (tambah section) |
| `supabase/config.toml` | Modifikasi (tambah function config) |

