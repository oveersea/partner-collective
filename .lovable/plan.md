
# Fitur Download CV (With/Without Contact) - Admin Dashboard

## Ringkasan
Menambahkan tombol "Download CV" pada halaman detail user di admin dashboard. Admin/superadmin dapat mengunduh CV dalam format PDF dengan dua opsi: **dengan kontak** (email, phone, alamat) atau **tanpa kontak** (privasi terjaga).

## Pendekatan
CV akan di-generate di **server-side** menggunakan Supabase Edge Function yang menghasilkan file HTML yang dirender sebagai PDF-style document. Karena Deno edge functions tidak mendukung library PDF native yang berat, kita akan menggunakan pendekatan **HTML-to-downloadable-HTML** yang bisa langsung di-print/save-as-PDF dari browser, atau menggunakan library ringan `jsPDF` di client-side.

**Pendekatan yang dipilih: Client-side PDF generation** menggunakan native browser print API (`window.print()`), yang lebih ringan dan tidak butuh dependency tambahan.

## Perubahan yang akan dilakukan

### 1. Buat Edge Function `generate-cv` 
**File:** `supabase/functions/generate-cv/index.ts`

- Menerima parameter: `user_id`, `include_contact` (boolean)
- Hanya bisa diakses oleh admin/superadmin (cek `user_roles`)
- Query semua data profil user: profiles, user_education, user_experiences, user_certifications, user_trainings, user_awards, user_organizations
- Jika `include_contact = false`: redact email, phone_number, address
- Menghasilkan response berupa **HTML document** yang terformat sebagai CV profesional
- HTML sudah di-style dengan inline CSS agar siap print/save as PDF

### 2. Update Halaman Admin User Detail
**File:** `src/pages/AdminUserDetail.tsx`

- Tambahkan tombol dropdown "Download CV" di header (sebelah tombol Edit Profil)
- Dropdown berisi dua opsi:
  - "Download CV (With Contact)" -- termasuk email, phone, alamat lengkap
  - "Download CV (Without Contact)" -- tanpa info kontak sensitif
- Saat diklik:
  1. Panggil edge function `generate-cv`
  2. Buka HTML response di tab/window baru
  3. Otomatis trigger `window.print()` sehingga user bisa Save as PDF

### 3. Update Supabase Config
**File:** `supabase/config.toml`

- Tambahkan entry untuk edge function `generate-cv` dengan `verify_jwt = true` (hanya authenticated admin)

## Format CV yang Dihasilkan

```text
+------------------------------------------+
| [Nama Lengkap]                           |
| [Headline]                               |
| [Kontak: Email, Phone, Lokasi]*          |
| [LinkedIn, Website]*                     |
+------------------------------------------+
| RINGKASAN PROFESIONAL                    |
| [professional_summary / bio]             |
+------------------------------------------+
| SKILLS                                   |
| [tag] [tag] [tag] ...                    |
+------------------------------------------+
| PENGALAMAN KERJA                         |
| - Position @ Company (start - end)       |
|   Description                            |
+------------------------------------------+
| PENDIDIKAN                               |
| - Degree, Field @ Institution (year)     |
+------------------------------------------+
| SERTIFIKASI                              |
| - Cert Name - Issuer (date)              |
+------------------------------------------+
| PELATIHAN                                |
| - Training Title - Organizer (date)      |
+------------------------------------------+
| PENGHARGAAN                              |
| - Award Name - Issuer (date)             |
+------------------------------------------+
| ORGANISASI                               |
| - Role @ Organization (start - end)      |
+------------------------------------------+
```

*Bagian kontak hanya muncul jika `include_contact = true`

## Detail Teknis

### Edge Function Logic
- Auth check: verify JWT, lalu query `user_roles` untuk memastikan caller adalah admin/superadmin
- Fetch email dari `auth.users` menggunakan fungsi `get_user_email(user_id)` yang sudah ada
- Query 7 tabel secara paralel (profiles, education, experiences, certifications, trainings, awards, organizations)
- Return `Content-Type: text/html` dengan inline print styles (`@media print`, `@page`)

### UI Button di AdminUserDetail
- Menggunakan komponen `DropdownMenu` yang sudah ada
- Icon: `Download` dari lucide-react
- Posisi: di sebelah tombol "Edit Profil" pada header sticky
- State loading saat fetching CV
