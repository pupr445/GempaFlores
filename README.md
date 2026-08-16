# Laporan App

Aplikasi form laporan sederhana: foto (kamera/unggah, tanpa batas jumlah) otomatis
diberi watermark koordinat presisi (kab/kota, kecamatan, desa/kelurahan) yang
didapat dari Google Maps, lalu dikirim ke Supabase. Tidak ada data pelapor.

**Stack:** Next.js (static export) — GitHub (version control + hosting via GitHub Pages) — Supabase (database & storage) — Nominatim/OpenStreetMap (reverse geocoding, gratis tanpa API key).

## 1. Setup Supabase

1. Buat project baru di https://supabase.com.
2. Buka **SQL Editor**, jalankan isi file `supabase-schema.sql`.
3. Buka **Storage**, buat bucket baru bernama `foto-laporan`, set sebagai **Public**.
4. Catat `Project URL` dan `anon public key` dari **Settings > API**.

## 2. Reverse geocoding (lokasi)

Tidak perlu setup apa pun — aplikasi ini memakai **Nominatim (OpenStreetMap)**,
layanan gratis tanpa API key untuk mengubah koordinat GPS menjadi nama
kabupaten/kota, kecamatan, dan desa/kelurahan. Logikanya ada di
`src/lib/geocode.js`.

Catatan: Nominatim punya batas wajar 1 request/detik dan tidak sepresisi
Google Maps untuk level desa/kelurahan di sebagian wilayah Indonesia. Kalau
nanti aplikasi butuh trafik besar atau akurasi lebih tinggi, bisa
dipertimbangkan self-hosting Nominatim atau menambah fallback data wilayah
resmi (misal dataset `emsifa/api-wilayah-indonesia` di GitHub).

## 3. Jalankan secara lokal

```bash
npm install
cp .env.local.example .env.local
# isi .env.local dengan URL & anon key dari langkah 1
npm run dev
```

Buka `http://localhost:3000`.

## 4. Deploy ke GitHub Pages

1. Push project ini ke repo GitHub, misal bernama `laporan-app`.
2. Di `next.config.js`, pastikan `basePath` sesuai nama repo kamu.
3. Buka **Settings > Secrets and variables > Actions** di repo, tambahkan 2 secret:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Buka **Settings > Pages**, set **Source** ke "GitHub Actions".
5. Push ke branch `main` — workflow `.github/workflows/deploy.yml` akan otomatis
   build dan deploy ke GitHub Pages.

## Halaman Riwayat (lihat data, read-only)

Aplikasi punya 2 halaman:
- **Buat Laporan** (`/`) — form kirim laporan baru.
- **Riwayat Laporan** (`/riwayat`) — daftar semua laporan yang sudah masuk,
  lengkap dengan foto dan lokasinya.

Halaman Riwayat murni untuk **melihat data saja** — tidak ada tombol edit
maupun hapus di UI. Ini juga ditegakkan di sisi Supabase: `supabase-schema.sql`
sengaja hanya membuat izin (RLS policy) untuk **insert** dan **select**, tanpa
policy **update** maupun **delete** untuk kunci publik. Artinya walau seseorang
mencoba memanggil Supabase API secara langsung dari luar aplikasi, mereka tetap
tidak akan bisa mengubah atau menghapus data yang sudah masuk — hanya pemilik
project yang bisa, itu pun lewat Dashboard Supabase.

## Catatan penting

- **Kalau kamu sudah pernah menjalankan `supabase-schema.sql` versi sebelumnya**,
  jalankan ulang bagian policy `select` di SQL Editor Supabase (bagian
  "publik boleh baca laporan" dan "publik boleh baca foto"), karena versi
  lama belum mengizinkan pembacaan data — halaman Riwayat akan kosong/error
  tanpa policy ini.

- Karena tidak ada backend server, key Supabase di atas ter-*bundle* ke dalam
  JavaScript publik saat build. Ini aman untuk **anon key**, karena akses
  ditentukan lewat Row Level Security (RLS) yang sudah diatur di
  `supabase-schema.sql`.
- Fitur ambil foto tidak dibatasi jumlahnya — user bisa menjepret berkali-kali,
  tiap hasil ditambahkan ke daftar foto, bukan menggantikan foto sebelumnya.
"# Gempa" 
