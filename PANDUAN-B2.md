# Panduan Pindah Storage Foto/Video ke Backblaze B2

Yang berubah: **lokasi penyimpanan file** foto/video (dari Supabase
Storage ke Backblaze B2, 10GB gratis permanen, tanpa kartu kredit).

Yang **tidak** berubah: URL aplikasi (QR code tetap sama), tabel
database di Supabase (`laporan`, `foto_laporan`, `video_laporan`), dan
cara kerja halaman Riwayat.

**Catatan arsitektur:** bucket B2-nya dibuat **Private** (bukan
Public) — supaya tidak perlu verifikasi kartu kredit di Backblaze.
Sebagai gantinya, Cloudflare Worker yang jadi perantara baik saat
upload maupun saat foto/video ditampilkan. Ini transparan buat
pengguna — tetap tampil normal seperti biasa.

Kerjakan berurutan dari atas ke bawah.

---

## Bagian A — Siapkan akun & bucket Backblaze B2

1. Daftar gratis di https://www.backblaze.com/sign-up/cloud-storage
   (tidak perlu kartu kredit untuk tetap di batas free 10GB).
2. **Verifikasi email** — wajib, cek inbox setelah daftar.
3. Masuk ke **B2 Cloud Storage** → **Buckets** → **Create a Bucket**.
   Buat 2 bucket:
   - Nama bebas tapi harus unik secara global, contoh:
     `gempaflores-foto-<namaAnda>` dan `gempaflores-video-<namaAnda>`
     (kalau nama polos `gempaflores-foto` sudah dipakai orang lain,
     Backblaze akan minta ganti nama)
   - Privacy setting: pilih **Private** (BUKAN Public — ini kuncinya
     supaya tidak perlu kartu kredit)
4. Di halaman tiap bucket, catat nilai **Endpoint**-nya, bentuknya
   seperti `s3.us-west-004.backblazeb2.com`. Bagian tengahnya
   (`us-west-004`) itu **region** akun kamu — sama untuk kedua bucket.
   Catat nilai region ini.

---

## Bagian B — Buat Application Key & deploy Worker

1. Di Backblaze, buka **Application Keys** → **Add a New Application
   Key**.
   - Beri nama bebas, contoh `gempaflores-worker`
   - Allow access to Bucket(s): pilih **All** (atau pilih 2 bucket di
     atas kalau opsinya per-bucket)
   - Type of Access: **Read and Write**
   - Klik **Create New Key**
2. **Catat segera** `keyID` dan `applicationKey` yang muncul —
   `applicationKey` cuma ditampilkan **sekali**, tidak bisa dilihat
   lagi setelah halaman ditutup.

3. Kode Worker-nya sudah ada di folder `cloudflare-worker/`. Buka
   `cloudflare-worker/wrangler.toml`, isi 4 baris di bagian `[vars]`:
   - `ALLOWED_ORIGIN` → alamat GitHub Pages aplikasi kamu (tanpa slash
     di akhir)
   - `B2_REGION` → region dari Bagian A langkah 4
   - `B2_BUCKET_FOTO` / `B2_BUCKET_VIDEO` → nama 2 bucket dari Bagian A

4. Di terminal:
   ```bash
   cd cloudflare-worker
   npm install
   npx wrangler login
   ```

5. Isi kredensial B2 sebagai **secret** (supaya tidak nyangkut di kode/git):
   ```bash
   npx wrangler secret put B2_KEY_ID
   ```
   (tempel `keyID` dari langkah 2, Enter)
   ```bash
   npx wrangler secret put B2_APPLICATION_KEY
   ```
   (tempel `applicationKey` dari langkah 2, Enter)

6. Deploy:
   ```bash
   npm run deploy
   ```
   Setelah selesai, Wrangler menampilkan URL Worker-nya, bentuknya
   seperti:
   ```
   https://gempaflores-storage.pupr445.workers.dev
   ```
   **Catat URL ini** — dipakai di Bagian C & D.

---

## Bagian C — Sambungkan aplikasi utama ke Worker

1. Di root project, tambahkan baris berikut ke `.env.local` (untuk
   development lokal):
   ```
   NEXT_PUBLIC_UPLOAD_WORKER_URL=https://gempaflores-storage.pupr445.workers.dev
   ```

2. Untuk yang di-deploy ke GitHub Pages: repo di GitHub → **Settings**
   → **Secrets and variables** → **Actions** → **New repository
   secret**:
   - Name: `NEXT_PUBLIC_UPLOAD_WORKER_URL`
   - Value: URL Worker dari Bagian B

3. Commit & push:
   ```bash
   git add .
   git commit -m "Pindah upload foto/video ke Backblaze B2 (lewat Worker)"
   git push origin main
   ```

4. **Uji coba:** buka aplikasi yang sudah live, isi laporan dengan
   1 foto, kirim. Kalau berhasil, cek di Supabase Table Editor — baris
   baru di `foto_laporan` harus punya `url` yang diawali
   `https://gempaflores-storage....workers.dev/file/foto/...`. Buka
   halaman Riwayat, pastikan foto itu tampil normal (ini artinya
   Worker berhasil membaca dari B2 private dan meneruskannya).

---

## Bagian D — Migrasi foto/video yang sudah ada (data lama)

1. Ambil **Supabase service_role key**: Dashboard Supabase → Project
   Settings → API → salin yang **service_role** (bukan anon).

2. Siapkan skripnya:
   ```bash
   cd scripts/migrasi-ke-b2
   npm install
   cp .env.example .env
   ```
   Buka `.env`, isi semua nilainya (Supabase, kredensial B2 dari
   Bagian B, dan `WORKER_BASE_URL` dari Bagian B langkah 6).

3. **Cek dulu tanpa mengubah apa pun:**
   ```bash
   npm run migrasi:dry-run
   ```
   Baca ringkasannya — pastikan jumlah "berhasil" masuk akal dan tidak
   ada yang "GAGAL".

4. Kalau hasilnya wajar, jalankan sungguhan:
   ```bash
   npm run migrasi
   ```
   Aman dijalankan ulang kalau terhenti di tengah jalan.

5. **Verifikasi:** buka halaman Riwayat, pastikan semua foto & video
   lama masih tampil normal (sekarang lewat B2 + Worker).

6. **Opsional, tunggu beberapa hari dulu:** setelah yakin aman, file
   lama di Supabase Storage boleh dihapus manual untuk membebaskan
   kuota — tidak wajib.

---

## Ringkasan apa yang berubah di kode

| File | Perubahan |
|---|---|
| `cloudflare-worker/` (baru) | Worker: proxy upload DAN baca file dari B2 private |
| `src/lib/storageUpload.js` (baru) | Helper frontend memanggil Worker |
| `src/app/lapor/page.jsx` | Upload foto/video lewat `unggahFile()`, bukan `supabase.storage` lagi |
| `.env.local.example` | Tambah `NEXT_PUBLIC_UPLOAD_WORKER_URL` |
| `.github/workflows/deploy.yml` | Suntikkan secret `NEXT_PUBLIC_UPLOAD_WORKER_URL` saat build |
| `scripts/migrasi-ke-b2/` (baru) | Skrip sekali-jalan pindahkan data lama |

Tabel Supabase, RLS policy-nya, halaman Riwayat, dan fitur Export
Admin **sama sekali tidak berubah** — semua tetap baca kolom `url`
seperti biasa, cuma isinya sekarang mengarah ke Worker.
