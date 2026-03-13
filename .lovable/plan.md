

## Plan: Ubah `/request-quote` menjadi `/order` dengan konsep marketplace

### Konsep
Halaman `/order` berfungsi sebagai cart/checkout untuk layanan on-demand. User bisa menambahkan layanan dari `/services`, lalu checkout di `/order`. Jika cart kosong, redirect ke `/services`. Ada dua opsi: **Pesan Langsung** atau **Diskusi Dulu**.

### Perubahan

#### 1. Buat Cart System (localStorage-based)
- Buat file `src/lib/cart.ts` — utility untuk manage cart di localStorage
  - `getCart()`, `addToCart(item)`, `removeFromCart(index)`, `clearCart()`, `getCartCount()`
  - Item shape: `{ categorySlug, categoryName, serviceName, description, tags[], quantity }`

#### 2. Buat halaman `/order` (replace `RequestQuote.tsx`)
- Rename/rewrite `src/pages/RequestQuote.tsx` → buat page baru `src/pages/Order.tsx`
- Tampilkan daftar item dari cart dengan quantity control
- Dua CTA button:
  - **"Diskusi Dulu"** — buka form ringkas (nama, email, phone, catatan) lalu submit via edge function `request-quote` yang sudah ada
  - **"Pesan Langsung"** — langsung submit order (juga pakai edge function existing)
- Jika cart kosong → tampilkan empty state dengan tombol "Pilih Layanan" redirect ke `/services`
- Form fields: nama, email, phone, lokasi, catatan tambahan, jadwal preferensi
- Sidebar: ringkasan cart items

#### 3. Update `/services` page
- Ubah link sub-service dari `/request-quote` → `addToCart()` + toast notification
- Tambahkan tombol "Tambah ke Keranjang" di setiap sub-service card
- Tambah floating cart indicator (badge count) yang link ke `/order`
- Update CTA card link dari `/request-quote` → `/order`

#### 4. Update routing (`App.tsx`)
- Ganti route `/request-quote` → `/order` dengan component `Order`
- Keep `/checkout` untuk program/event payment yang sudah ada

#### 5. Update semua referensi `/request-quote`
- `Navbar.tsx`, `Services.tsx`, `Footer.tsx`, landing sections — ubah semua link ke `/order`

#### 6. Update `FeaturesSection.tsx` (landing)
- Service card click → navigate ke `/services?category={slug}` (sudah ada) atau tambah ke cart

### Technical Details
- Cart disimpan di `localStorage` key `"oveersea_cart"`
- Tidak perlu migration DB — pakai edge function `request-quote` yang sudah ada untuk submit
- Edge function tetap create user + opportunity di Supabase
- Cart badge ditampilkan di Navbar menggunakan state dari localStorage + custom event listener untuk reactivity

### Files to Create/Edit
- **Create:** `src/lib/cart.ts`, `src/pages/Order.tsx`
- **Edit:** `src/App.tsx`, `src/pages/Services.tsx`, `src/components/landing/Navbar.tsx`, `src/components/landing/Footer.tsx`, `src/components/landing/CTASection.tsx`, `src/components/landing/HeroSection.tsx`
- **Delete:** `src/pages/RequestQuote.tsx` (replaced by Order.tsx)

