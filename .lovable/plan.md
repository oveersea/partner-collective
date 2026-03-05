
Masalahnya bukan duplicate data, jadi **truncate/kosongkan `login_tokens` tidak akan menyelesaikan**.

### Temuan utama (dari code + DB + logs)
1. Log terbaru `generate-login-token` menunjukkan error:
   - `new row violates row-level security policy for table "login_tokens"` (code 42501).
2. Tabel `public.login_tokens` saat ini sudah kosong:
   - total rows = 0
   - duplicate token_hash = 0
3. Penyebab paling kuat ada di implementasi function:
   - `supabaseAdmin` (service role client) dipakai juga untuk `auth.signInWithPassword`.
   - Setelah sign-in, context auth client bisa berpindah ke JWT user (authenticated), sehingga query insert berikutnya **tidak lagi jalan sebagai service role**.
   - Akibatnya insert ke `login_tokens` kena RLS.

### Rencana perbaikan implementasi
1. **Pisahkan client Supabase di edge function `generate-login-token`**
   - `supabaseService` (pakai `SUPABASE_SERVICE_ROLE_KEY`) khusus untuk:
     - validasi API key (`api_keys`)
     - insert `login_tokens`
     - update `api_keys.last_used_at`
   - `supabaseAuth` (pakai `SUPABASE_ANON_KEY`) khusus untuk:
     - `auth.signInWithPassword(email, password)`

2. **Tambahkan guard env variable**
   - Pastikan function fail-fast kalau `SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_URL` tidak tersedia.
   - Return error config yang jelas (500) agar mudah trace.

3. **Pertahankan schema/RLS saat ini (tanpa truncate)**
   - Tidak perlu migration baru untuk truncate atau ubah struktur.
   - Policy existing boleh tetap, tetapi fix utama adalah pemisahan auth context client.

4. **Tambahkan logging diagnostik yang lebih spesifik**
   - Saat insert gagal, log:
     - code/message dari Postgres
     - step mana yang gagal (insert token vs update api_key)
   - Ini membantu bedakan error auth-context vs constraint lain.

### Rencana verifikasi setelah fix
1. Generate API key baru dari admin (copy full key).
2. Hit endpoint `generate-login-token` dengan email/password valid.
3. Validasi response 200 berisi `verification_url`, `token`, `expires_in`.
4. Cek table `login_tokens` bertambah 1 row.
5. Lanjut panggil `verify-login-token` dan pastikan token bisa ditandai `used_at`.
6. Cek edge logs untuk memastikan tidak ada lagi `42501`.

### Detail teknis singkat
```text
Sebelum:
1 client (service) -> signInWithPassword -> insert login_tokens (terkadang jadi role user) -> RLS fail

Sesudah:
client auth (anon) -> validasi email/password
client service (service role) -> insert login_tokens + update api_keys
```

Dengan pendekatan ini, error “Failed to create login token” karena RLS harusnya hilang tanpa perlu mengosongkan tabel.
