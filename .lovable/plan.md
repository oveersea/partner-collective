

# Rombak Dashboard - Multi Device Friendly

## Masalah Saat Ini
- Padding terlalu besar di mobile (p-8, px-6)
- Quick Actions buttons terlalu kecil dan padat di layar kecil
- Tab bar horizontal scroll tanpa indikator, sulit digunakan
- DashboardNav redundan dengan MobileBottomNav di mobile
- Konten tertutup oleh bottom navigation (tidak ada padding bawah)
- Profile header layout pecah di layar kecil
- Edit form dan overview cards tidak responsive

## Perubahan yang Akan Dilakukan

### 1. Dashboard.tsx - Layout Utama
- Ubah padding dari `px-6 py-8` menjadi responsive: `px-4 py-4 md:px-6 md:py-8`
- Tambah `pb-24 md:pb-8` agar konten tidak tertutup bottom nav
- Quick Actions: ubah dari `flex-wrap` menjadi horizontal scroll di mobile (`flex overflow-x-auto gap-2 md:flex-wrap md:gap-3`), dengan tombol lebih compact
- Tabs: di mobile tampilkan hanya icon + label kecil dengan scroll horizontal yang lebih smooth, tambah `scrollbar-hide`
- Tambah `max-w-4xl mx-auto` untuk desktop agar konten tidak terlalu lebar

### 2. DashboardNav.tsx - Top Navigation
- Sembunyikan di mobile (`hidden md:block`) karena sudah ada MobileBottomNav
- Atau simplifikasi: hanya tampilkan logo + avatar di mobile (tanpa link Dashboard/Jobs)

### 3. ProfileHeader.tsx - Header Profil
- Padding responsive: `p-4 md:p-8`
- Avatar lebih kecil di mobile: `w-16 h-16 md:w-20 md:h-20`
- Edit button menjadi icon-only di mobile
- Badges wrap dengan gap lebih kecil di mobile

### 4. ProfileOverview.tsx - Overview Cards
- Padding responsive: `p-4 md:p-8`
- Grid satu kolom di mobile: `grid-cols-1 md:grid-cols-2`
- Skills section full-width tetap

### 5. ProfileEditForm.tsx - Form Edit
- Padding responsive: `p-4 md:p-8`
- Form fields tetap responsive (sudah `sm:grid-cols-2`)
- Sticky save button di bottom untuk mobile

### 6. KYCBanner.tsx
- Padding responsive: `p-3 md:p-5`

### 7. ExperienceTab.tsx & Tab Lainnya
- Card padding responsive
- Action buttons selalu terlihat di mobile (tidak hanya hover)

### 8. index.css
- Tambah `.scrollbar-hide` utility untuk tab scrolling

## Technical Details

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/pages/Dashboard.tsx` | Responsive padding, scroll quick actions, compact tabs, bottom padding |
| `src/components/dashboard/DashboardNav.tsx` | Hide di mobile, simplify |
| `src/components/dashboard/ProfileHeader.tsx` | Responsive padding & sizing |
| `src/components/dashboard/ProfileOverview.tsx` | Responsive grid & padding |
| `src/components/dashboard/ProfileEditForm.tsx` | Responsive padding, sticky save |
| `src/components/dashboard/KYCBanner.tsx` | Responsive padding |
| `src/components/dashboard/ExperienceTab.tsx` | Mobile-visible action buttons |
| `src/components/dashboard/ServicesTab.tsx` | Responsive stats grid & padding |
| `src/index.css` | scrollbar-hide utility |

### Prinsip Desain
- Mobile-first: semua styling dimulai dari mobile, lalu scale up dengan `md:` / `lg:`
- Bottom nav safe area: konten utama selalu punya padding bawah cukup
- Touch-friendly: minimum tap target 44px
- Scrollable sections: quick actions dan tabs bisa di-scroll horizontal di mobile
- Consistent spacing: `p-4` mobile, `p-6` tablet, `p-8` desktop

