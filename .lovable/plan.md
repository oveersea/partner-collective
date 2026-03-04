
Tujuan: perbaiki CV auto-download supaya output PDF kembali normal (teks tampil jelas, layout rapi) untuk **single** dan **bulk**.

Ringkasan temuan:
1) HTML dari edge function `generate-cv` sudah benar (network response berisi teks + style lengkap).
2) Kerusakan terjadi di tahap render PDF pada frontend.
3) Di kedua flow (`AdminUserDetail` dan `AdminUsers`) iframe dirender dengan `opacity: 0.01`; ini sangat berisiko membuat hasil raster html2canvas jadi pudar/“hilang teks” (pola yang sama dengan issue sebelumnya).
4) Konfigurasi html2canvas juga masih agresif (`allowTaint: true`, ukuran window dinamis dari `scrollWidth/scrollHeight`) yang dapat membuat hasil tidak konsisten.
5) Ada warning React ref di `AdminUserDetail` (Dropdown/SkillRadar). Bukan penyebab utama CV rusak, tapi akan saya bereskan agar halaman bersih dari warning.

Rencana implementasi:

1. Stabilkan “render stage” PDF (single + bulk)
- File: `src/pages/AdminUserDetail.tsx`, `src/components/admin/AdminUsers.tsx`
- Ganti style iframe render:
  - hapus `opacity: 0.01`
  - gunakan elemen tetap ter-render penuh (opacity 1), non-interaktif, dan tidak mengganggu UI (`pointer-events:none`, `z-index` sangat kecil, fixed, ukuran A4 px).
- Pastikan hanya 1 target render: `.page` dalam iframe, lalu cleanup iframe di `finally`.

2. Harden opsi html2canvas/html2pdf
- Samakan opsi di dua flow agar identik:
  - `allowTaint: false`
  - `useCORS: true`
  - ukuran render fixed A4 px (bukan `scrollWidth/scrollHeight` dinamis)
  - `backgroundColor: "#ffffff"`
- Tambahkan guard error eksplisit jika canvas gagal terbentuk, agar tidak silent menghasilkan PDF rusak.

3. Sanitasi HTML CV untuk mode capture
- File: `supabase/functions/generate-cv/index.ts`
- Tambahkan blok CSS khusus capture supaya deterministic:
  - pastikan warna teks eksplisit di level container (`.page, .page * { color: ... }` untuk elemen teks penting)
  - nonaktifkan elemen yang tidak perlu untuk PDF (`.print-bar` tetap tidak ikut capture)
  - pertahankan font fallback system (tanpa dependency font eksternal).
- Tujuan: hasil sama walau dieksekusi dari iframe/html2canvas.

4. Samakan util logic agar tidak drift
- Ekstrak helper internal (di frontend) untuk:
  - create iframe render host
  - wait document/fonts/images
  - run html2pdf
- Dipakai oleh single dan bulk, supaya 1 sumber logika (menghindari satu flow fixed, satu flow rusak).

5. Bereskan warning ref di AdminUserDetail
- Audit komponen yang jadi child komponen Radix/framer/recharts yang butuh ref.
- Pastikan child yang menerima ref menggunakan elemen DOM/`forwardRef`.
- Hasil target: console bersih dari warning “Function components cannot be given refs”.

Validasi setelah implementasi (wajib):
1) Single download: With Contact + Without Contact
2) Bulk download: With Contact + Without Contact (minimal 2 user)
3) Cek isi PDF: nama, headline, summary, section title, experience text, footer, QR
4) Cek tidak ada warning/error baru di console pada halaman `/admin/user/:oveercode`
5) Cek konsistensi output antar percobaan (3x run, hasil tetap terbaca)

Deliverables:
- Fix di 3 file utama:
  - `src/pages/AdminUserDetail.tsx`
  - `src/components/admin/AdminUsers.tsx`
  - `supabase/functions/generate-cv/index.ts`
- Plus cleanup warning ref terkait `AdminUserDetail`.
