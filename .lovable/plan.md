
# Fitur Learning - Halaman Program & Detail

## Overview
Membangun halaman Learning yang menampilkan semua program dari tabel `programs` (Certification & Bootcamp), lengkap dengan filter, search, dan halaman detail program.

## Halaman yang Dibuat

### 1. Halaman Learning (`/learning`)
Halaman katalog yang menampilkan semua program dengan status `approved`.

**Komponen:**
- **Header** dengan judul "Learning Programs" dan deskripsi singkat
- **Search bar** untuk cari berdasarkan judul
- **Filter** berdasarkan:
  - Kategori (Certification, Bootcamp)
  - Level (Beginner, Intermediate, Beginner - Intermediate)
  - Delivery mode (Offline / In-Person, Intensive)
- **Grid kartu program** menampilkan:
  - Thumbnail gambar
  - Badge (Popular, dll) jika ada
  - Judul, kategori, level
  - Durasi, delivery mode
  - Rating dan jumlah siswa
  - Harga (format Rupiah)
- **Pagination** (20 item per halaman)

### 2. Halaman Detail Program (`/learning/:slug`)
Halaman detail lengkap untuk satu program.

**Komponen:**
- Thumbnail besar
- Judul, deskripsi, badge
- Info: kategori, level, durasi, delivery mode, lokasi
- Harga dan tombol "Daftar Program"
- Rating dan jumlah siswa
- Syllabus (dari JSON)
- Learning outcomes, target audience, prerequisites (dari array)
- Info instruktur (nama, bio, avatar)
- FAQ (dari JSON)

## Integrasi Navigasi
- Tambahkan link "Learning" di `DashboardNav` (dropdown menu)
- Tambahkan route `/learning` dan `/learning/:slug` di `App.tsx`
- Gunakan `DashboardNav` sebagai navigasi di halaman learning

## File yang Dibuat/Diubah

| File | Aksi |
|------|------|
| `src/pages/Learning.tsx` | Buat baru - halaman katalog |
| `src/pages/LearningDetail.tsx` | Buat baru - halaman detail |
| `src/App.tsx` | Tambah 2 route baru |
| `src/components/dashboard/DashboardNav.tsx` | Tambah link Learning |

## Detail Teknis

**Query Supabase untuk katalog:**
```sql
SELECT id, title, slug, description, category, level, 
       duration, delivery_mode, price_cents, currency, 
       rating, student_count, badge, thumbnail_url, 
       location, instructor_name
FROM programs 
WHERE status = 'approved'
ORDER BY created_at DESC
```

**Query Supabase untuk detail:**
```sql
SELECT * FROM programs WHERE slug = :slug AND status = 'approved'
```

**Format harga:** `price_cents` dibagi 1 (sudah dalam Rupiah cents) lalu format dengan `toLocaleString("id-ID")`.

**Styling:** Mengikuti pola yang sama dengan Matchmaking page - menggunakan DashboardNav, kartu dengan border/shadow, badge warna, dan animasi framer-motion.
