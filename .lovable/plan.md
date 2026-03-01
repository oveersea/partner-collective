

# Insight & Rekomendasi Learning untuk Match Score

## Overview
Menambahkan section insight di bawah breakdown kriteria match score pada halaman Job Detail. Section ini menampilkan:
1. Daftar aksi konkret yang harus dilakukan user untuk mencapai 70% match
2. Rekomendasi program Learning dari tabel `programs` yang relevan dengan skill yang belum dimiliki user

## Perubahan pada `src/pages/JobDetail.tsx`

### 1. Fetch Program Learning yang Relevan
- Setelah fetch data opportunity dan profile, query tabel `programs` untuk mencari program yang mengandung skill yang dibutuhkan job tapi belum dimiliki user
- Query: cari program `approved` yang title/description mengandung keyword dari missing skills
- Simpan di state `recommendedPrograms`

### 2. Hitung Missing Skills
- Di dalam `calcMatchDetails`, tambahkan return value `missingSkills` (array skill yang dibutuhkan job tapi tidak dimiliki user)
- Gunakan data ini untuk menampilkan insight dan filter program learning

### 3. Section Insight (di bawah criteria breakdown, sebelum tombol Lamar)
Tampilkan hanya jika `score < 70`. Berisi:

**Aksi yang Harus Dilakukan:**
- Jika skill kurang: "Tambahkan skill berikut ke profil Anda: [list missing skills]"
- Jika pengalaman kurang: "Tambahkan pengalaman kerja Anda (min X tahun)"
- Jika profil belum lengkap: "Lengkapi profil: skill, pengalaman, pendidikan"

**Rekomendasi Learning:**
- Tampilkan 1-3 program dari tabel `programs` yang cocok dengan missing skills
- Setiap kartu berisi: judul program, kategori, dan link ke `/learning/:slug`
- Jika tidak ada program yang cocok, tampilkan link umum ke `/learning`

### 4. UI Design
- Card dengan background `bg-amber-50` / `bg-amber-500/5` dan border kuning
- Icon `Lightbulb` sebagai header "Cara Meningkatkan Skor Anda"
- List aksi dengan bullet points
- Kartu mini program learning yang bisa diklik (link ke detail)

## Detail Teknis

**Query program learning:**
```sql
SELECT id, title, slug, category, thumbnail_url, price_cents
FROM programs
WHERE status = 'approved'
ORDER BY created_at DESC
```
Kemudian filter di client-side: cocokkan `title` atau `description` terhadap missing skills menggunakan `.toLowerCase().includes()`.

**State baru:**
- `recommendedPrograms: Program[]` - program yang relevan dengan missing skills

**Komponen baru (inline):**
- Insight card dengan aksi dan rekomendasi learning
- Mini card program learning (clickable link ke `/learning/:slug`)

## File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/pages/JobDetail.tsx` | Tambah fetch programs, hitung missing skills, tampilkan insight section dengan rekomendasi learning |

