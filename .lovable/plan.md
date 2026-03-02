
# Company Dashboard

## Ringkasan
Membuat halaman Company Dashboard yang dapat diakses oleh member perusahaan (business_members). Desain dan fungsionalitas mirip dengan Vendor Dashboard yang sudah ada, namun khusus untuk `business_type = 'company'`.

## Apa yang akan dibangun

### 1. Halaman CompanyDashboard (`src/pages/CompanyDashboard.tsx`)
- Route: `/company/:slug`
- Mengambil data dari tabel `business_profiles` dengan filter `business_type = 'company'`
- Validasi akses: hanya user yang terdaftar di `business_members` untuk company tersebut yang bisa mengakses
- Role admin (owner/admin/created_by) mendapat akses kelola member

**Tab yang tersedia:**
- **Overview** - Informasi bisnis (industry, lokasi, website, email, phone, NPWP, NIB, deskripsi) + quick stats (members, documents, credits)
- **Members** - Daftar member dengan invite/remove (khusus admin)
- **Documents** - Dokumen perusahaan dari `business_documents`
- **KYC** - Status verifikasi KYC bisnis
- **Projects** - Placeholder untuk proyek perusahaan
- **Credits** - Saldo kredit dari `company_credits`

### 2. Route baru di App.tsx
```
/company/:slug -> CompanyDashboard
```

### 3. Akses kontrol
- Query `business_members` untuk cek apakah user login adalah member aktif
- Role owner/admin mendapat fitur invite & remove member
- RLS sudah ada di tabel `business_profiles` dan `business_members`

## Detail Teknis

- File baru: `src/pages/CompanyDashboard.tsx` (mengikuti pola `VendorDashboard.tsx`)
- Edit: `src/App.tsx` - tambah route `/company/:slug`
- Tidak perlu migrasi database karena tabel dan RLS sudah tersedia
- Menggunakan tabel: `business_profiles`, `business_members`, `business_documents`, `company_credits`, `profiles`
