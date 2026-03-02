
# Fitur Invite User (Batch)

## Overview
Menambahkan fitur di Admin Dashboard untuk mengundang user baru ke platform. Admin dapat memasukkan hingga 20 user sekaligus dengan data: nama lengkap, email, dan nomor ponsel. Sistem akan mengirim email undangan via Supabase Auth.

## Arsitektur

```text
Admin UI (Dialog Form)
       |
       v
Edge Function: invite-users
  - Validates input (max 20)
  - Checks admin role via user_roles table
  - Loops: supabase.auth.admin.inviteUserByEmail()
  - Stores phone & name in profiles after invite
       |
       v
Supabase Auth sends invite email to each user
```

## Langkah Implementasi

### 1. Edge Function `invite-users`
- Menerima array of `{ full_name, email, phone_number }` (max 20)
- Memverifikasi pemanggil adalah admin/superadmin via `user_roles`
- Menggunakan `supabase.auth.admin.inviteUserByEmail()` untuk setiap user
- Setelah invite berhasil, update `profiles` table dengan `phone_number` dan `full_name`
- Mengembalikan hasil per-user (sukses/gagal + alasan)
- Membutuhkan `SUPABASE_SERVICE_ROLE_KEY` sebagai secret

### 2. Database: Tabel `user_invitations` (opsional tracking)
- Mencatat siapa yang diundang, oleh siapa, dan statusnya
- Kolom: `id`, `email`, `full_name`, `phone_number`, `invited_by`, `status`, `created_at`
- RLS: hanya admin yang bisa read/write

### 3. UI: Dialog Invite di `AdminUsers.tsx`
- Tombol "Invite Users" di header halaman User Management
- Dialog berisi form dinamis: baris input (nama, email, telepon) yang bisa ditambah/hapus
- Tombol "Add Row" untuk menambah baris (max 20)
- Validasi client-side: email format, nama wajib diisi, max 20 entries
- Loading state per-batch dan hasil summary (berapa sukses, berapa gagal)

## Detail Teknis

### Edge Function Secret
- Membutuhkan `SUPABASE_SERVICE_ROLE_KEY` - akan diminta ke user untuk ditambahkan

### Keamanan
- Edge function memverifikasi JWT caller dan cek role admin di database
- Service role key hanya digunakan server-side (edge function), tidak di client
- Input divalidasi dengan zod schema (email, max length, max 20 items)

### UX Flow
1. Admin klik "Invite Users" di halaman User Management
2. Dialog muncul dengan 1 baris form kosong
3. Admin isi data dan bisa tambah baris (max 20)
4. Klik "Send Invitations" -> loading state
5. Hasil ditampilkan: list email yang berhasil/gagal
6. Refresh tabel user setelah dialog ditutup
