

# Fix CV PDF Download - Hanya Garis Tanpa Tulisan

## Akar Masalah

CV HTML dari edge function diinjeksi sebagai `<div>` ke dalam halaman admin. Halaman admin sudah memiliki **Tailwind CSS global reset** yang menimpa semua style CV:

- `* { border-border }` dari Tailwind menambah border ke semua elemen
- `body { font-family, color }` dari Tailwind menimpa font IBM Plex Sans
- `h1-h6 { font-display }` menimpa heading CV
- Opacity `0.01` pada container menyebabkan html2canvas merender warna teks hampir transparan

Hasilnya: teks tidak terlihat, hanya garis-garis border yang muncul di PDF.

## Solusi: Gunakan Iframe Terisolasi

Ganti pendekatan dari `<div>` menjadi **hidden `<iframe>`**. Iframe memiliki document terpisah sehingga CSS halaman admin tidak bocor ke dalam CV.

### Alur baru:
1. Panggil edge function → dapat HTML lengkap
2. Buat `<iframe>` tersembunyi, tulis HTML ke dalamnya via `srcdoc` atau `contentDocument.write()`
3. Tunggu font + gambar selesai dimuat di dalam iframe
4. Jalankan `html2pdf().from(iframe.contentDocument.querySelector('.page')).save()`
5. Hapus iframe setelah selesai

### Perubahan File

**1. `src/pages/AdminUserDetail.tsx`** — Fungsi `handleDownloadCV`
- Hapus pembuatan `<div>` container
- Ganti dengan `<iframe>` yang ditulis via `contentDocument.open/write/close`
- Target html2pdf ke `iframe.contentDocument.querySelector('.page')`
- Tambahkan `allowTaint: true` pada html2canvas config

**2. `src/components/admin/AdminUsers.tsx`** — Fungsi `handleBulkDownloadCV`
- Perubahan yang sama: ganti `<div>` dengan `<iframe>` terisolasi

**3. `supabase/functions/generate-cv/index.ts`** — Perkuat CSS
- Hapus `@import url()` untuk Google Fonts (tidak reliable di iframe/html2canvas)
- Ganti dengan `@font-face` inline atau fallback ke system font stack yang pasti ada
- Tambahkan `!important` pada properti kritis (color, font-size, font-weight) sebagai safety net

### Detail Teknis

```text
SEBELUM (broken):
  Page DOM (Tailwind CSS active)
    └── <div style="opacity:0.01"> ← CSS conflict
         └── <style>CV styles</style>  ← kalah vs Tailwind
         └── <div class="page">...</div>

SESUDAH (fixed):
  Page DOM (Tailwind CSS active)
    └── <iframe style="position:fixed;left:-9999px"> ← isolated document
         └── <!DOCTYPE html>
              └── <style>CV styles only</style> ← no conflict
              └── <div class="page">...</div>
```

