

# Plan: Merge Features ke Services

## Ringkasan
Menghapus halaman Features (`/features`) yang berisi data hardcoded, dan menggantinya dengan halaman Services (`/services`) yang mengambil data langsung dari database Supabase (`services` dan `service_categories` tables). Semua link yang mengarah ke `/features` akan diarahkan ke halaman Services baru.

## Langkah-langkah

### 1. Buat halaman Services List (`/services`)
- Buat file `src/pages/Services.tsx` (halaman katalog semua services)
- Mengambil data dari tabel `service_categories` dan `services` di Supabase
- Mendukung filter berdasarkan kategori via query param (`/services?category=xxx`)
- Tampilan mirip Features page tapi data-driven dari database
- Termasuk breadcrumb, filter pills, dan grid 3 kolom

### 2. Update FeaturesSection di landing page
- Ubah `src/components/landing/FeaturesSection.tsx` menjadi menampilkan service categories dari database (bukan hardcoded)
- Semua link card mengarah ke `/services?category=xxx` bukan `/features?category=xxx`

### 3. Update routing di App.tsx
- Hapus route `/features` dan import `Features`
- Tambah route `/services` pointing ke halaman Services baru
- Route `/services/:slug` sudah ada (ServiceDetail)

### 4. Update Navbar links
- Semua href `/features` di megaMenus diganti ke `/services`
- CTA "Lihat semua layanan" mengarah ke `/services`

### 5. Hapus file Features.tsx
- Hapus `src/pages/Features.tsx` (data hardcoded, tidak diperlukan lagi)

### 6. Update Index.tsx
- Ganti import `FeaturesSection` dengan versi baru yang data-driven

## Detail Teknis

### Services.tsx (halaman baru)
- Fetch `service_categories` untuk filter pills
- Fetch `services` dengan filter optional `category_id`
- Fetch `user_services` count per service untuk menampilkan jumlah provider
- Grid layout `lg:grid-cols-3` konsisten dengan ServiceShowcaseSection
- Setiap card link ke `/services/:slug`

### FeaturesSection.tsx (refactor)
- Fetch `service_categories` dari Supabase
- Tampilkan kategori sebagai grid cards
- Klik card navigasi ke `/services?category={category_id}`
- Tetap retain layout bento grid yang ada, tapi data dari DB

### Tidak ada perubahan database
- Tidak ada tabel "features" di database yang perlu dihapus
- Semua data sudah tersedia di tabel `services` dan `service_categories`

