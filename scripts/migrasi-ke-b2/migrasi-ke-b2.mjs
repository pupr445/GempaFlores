// Skrip sekali-jalan: pindahkan semua foto & video dari Supabase Storage
// ke Backblaze B2 (bucket private), lalu perbarui kolom `url` di tabel
// foto_laporan & video_laporan supaya menunjuk ke Worker (yang jadi
// perantara baca file dari B2 private itu).
//
// Dijalankan dari komputer sendiri (BUKAN dari browser), jadi aman
// memakai kredensial B2 & Supabase service_role secara langsung.
//
// Cara pakai:
//   1. cd scripts/migrasi-ke-b2
//   2. npm install
//   3. cp .env.example .env   -> isi sesuai punya kamu
//   4. npm run migrasi:dry-run   (cek dulu tanpa mengubah apa pun)
//   5. npm run migrasi           (jalankan sungguhan)
//
// Aman dijalankan ulang (idempotent): baris yang url-nya sudah mengarah
// ke Worker, atau yang filenya sudah ada di B2, akan dilewati.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const WAJIB_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'B2_REGION',
  'B2_KEY_ID',
  'B2_APPLICATION_KEY',
  'B2_BUCKET_FOTO',
  'B2_BUCKET_VIDEO',
  'WORKER_BASE_URL',
];

for (const nama of WAJIB_ENV) {
  if (!process.env[nama]) {
    console.error(`Env "${nama}" belum diisi. Salin .env.example ke .env lalu lengkapi dulu.`);
    process.exit(1);
  }
}

const DRY_RUN = process.argv.includes('--dry-run');
const WORKER_BASE_URL = process.env.WORKER_BASE_URL.replace(/\/$/, '');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://s3.${process.env.B2_REGION}.backblazeb2.com`,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

const DAFTAR_TABEL = [
  { tabel: 'foto_laporan', kind: 'foto', bucketB2: process.env.B2_BUCKET_FOTO },
  { tabel: 'video_laporan', kind: 'video', bucketB2: process.env.B2_BUCKET_VIDEO },
];

// URL lama polanya: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<laporan_id>/<file>
// Fungsi ini mengambil bagian "<laporan_id>/<file>" saja.
function keyDariUrlSupabase(urlLama) {
  const penanda = '/object/public/';
  const idx = urlLama.indexOf(penanda);
  if (idx === -1) return null;
  const sisa = urlLama.slice(idx + penanda.length);
  const bagian = sisa.split('/');
  bagian.shift(); // buang nama bucket, sisakan "<laporan_id>/<file>"
  if (bagian.length < 2) return null;
  return bagian.join('/');
}

async function sudahAdaDiB2(bucketB2, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucketB2, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function migrasiTabel({ tabel, kind, bucketB2 }) {
  console.log(`\n=== Migrasi tabel: ${tabel} ===`);

  const { data: baris, error } = await supabase.from(tabel).select('id, url');
  if (error) throw error;

  console.log(`Ditemukan ${baris.length} baris.`);

  let berhasil = 0;
  let dilewati = 0;
  let gagal = 0;

  for (const row of baris) {
    if (row.url.startsWith(WORKER_BASE_URL)) {
      dilewati++;
      continue;
    }

    const key = keyDariUrlSupabase(row.url);
    if (!key) {
      console.warn(`  [lewat] id=${row.id} — pola url tidak dikenali: ${row.url}`);
      dilewati++;
      continue;
    }

    try {
      const sudahAda = await sudahAdaDiB2(bucketB2, key);

      if (!sudahAda) {
        const res = await fetch(row.url);
        if (!res.ok) throw new Error(`Gagal download dari Supabase (status ${res.status})`);
        const contentType = res.headers.get('content-type') || 'application/octet-stream';
        const buffer = Buffer.from(await res.arrayBuffer());

        if (!DRY_RUN) {
          await s3.send(
            new PutObjectCommand({
              Bucket: bucketB2,
              Key: key,
              Body: buffer,
              ContentType: contentType,
            })
          );
        }
      }

      const urlBaru = `${WORKER_BASE_URL}/file/${kind}/${key}`;

      if (!DRY_RUN) {
        const { error: errUpdate } = await supabase.from(tabel).update({ url: urlBaru }).eq('id', row.id);
        if (errUpdate) throw errUpdate;
      }

      console.log(`  [ok] id=${row.id} -> ${urlBaru}${DRY_RUN ? '  (dry-run, belum disimpan)' : ''}`);
      berhasil++;
    } catch (err) {
      console.error(`  [GAGAL] id=${row.id} — ${err.message}`);
      gagal++;
    }
  }

  console.log(`Ringkasan ${tabel}: ${berhasil} berhasil, ${dilewati} dilewati, ${gagal} gagal.`);
  return { berhasil, dilewati, gagal };
}

async function main() {
  if (DRY_RUN) {
    console.log('>>> MODE DRY-RUN: file akan didownload untuk dicek, tapi TIDAK ada yang diupload/disimpan.\n');
  }

  const total = { berhasil: 0, dilewati: 0, gagal: 0 };
  for (const cfg of DAFTAR_TABEL) {
    const hasil = await migrasiTabel(cfg);
    total.berhasil += hasil.berhasil;
    total.dilewati += hasil.dilewati;
    total.gagal += hasil.gagal;
  }

  console.log(`\n=== TOTAL: ${total.berhasil} berhasil, ${total.dilewati} dilewati, ${total.gagal} gagal ===`);
  if (total.gagal > 0) {
    console.log('Ada yang gagal — jalankan skrip ini lagi, baris yang sudah sukses akan otomatis dilewati.');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Migrasi berhenti karena error fatal:', err);
  process.exit(1);
});
