/**
 * Worker GempaFlores — perantara ke Backblaze B2.
 *
 * Buckets B2-nya PRIVATE (supaya tidak perlu verifikasi kartu kredit di
 * Backblaze, yang disyaratkan untuk bucket "Public"). Worker ini yang
 * pegang kredensial rahasia B2, jadi dia yang bertugas RANGKAP DUA:
 *
 * 1. POST /upload        — terima foto/video dari form pelaporan, simpan ke B2
 * 2. GET  /file/:kind/:laporanId/:namaFile — ambil file dari B2 & teruskan ke browser
 *
 * Kredensial B2 (B2_KEY_ID, B2_APPLICATION_KEY) diisi lewat
 * `wrangler secret put`, BUKAN di wrangler.toml — supaya tidak nyasar ke
 * git. Detail setup ada di /PANDUAN-B2.md.
 */

import { AwsClient } from 'aws4fetch';

const TIPE_FOTO_DIIZINKAN = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const TIPE_VIDEO_DIIZINKAN = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

// Foto sudah dikompres di browser sebelum dikirim; ini jaring pengaman saja.
const MAKS_UKURAN_FOTO = 8 * 1024 * 1024;
// Samakan dengan MAKS_UKURAN_VIDEO_MB di src/lib/video.js pada aplikasi utama.
const MAKS_UKURAN_VIDEO = 20 * 1024 * 1024;

const POLA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Nama file yang kita generate sendiri (crypto.randomUUID + ekstensi),
// pola ini cuma jaring pengaman supaya endpoint /file tidak bisa dipakai
// untuk path traversal ke key sembarangan di bucket.
const POLA_NAMA_FILE = /^[a-zA-Z0-9._-]+$/;

function headerCors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headerCors(env) },
  });
}

function buatClientB2(env) {
  return new AwsClient({
    accessKeyId: env.B2_KEY_ID,
    secretAccessKey: env.B2_APPLICATION_KEY,
    service: 's3',
    region: env.B2_REGION,
  });
}

function urlObjekB2(env, namaBucket, key) {
  return `https://${namaBucket}.s3.${env.B2_REGION}.backblazeb2.com/${key}`;
}

async function tanganiUpload(request, env) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: 'Body harus multipart/form-data.' }, 400, env);
  }

  const file = form.get('file');
  const laporanId = form.get('laporanId');
  const kind = form.get('kind');

  if (!(file instanceof File)) {
    return jsonResponse({ error: 'Field "file" wajib berupa file.' }, 400, env);
  }
  if (typeof laporanId !== 'string' || !POLA_UUID.test(laporanId)) {
    return jsonResponse({ error: 'Field "laporanId" tidak valid.' }, 400, env);
  }
  if (kind !== 'foto' && kind !== 'video') {
    return jsonResponse({ error: 'Field "kind" harus "foto" atau "video".' }, 400, env);
  }

  const isFoto = kind === 'foto';
  const tabelTipe = isFoto ? TIPE_FOTO_DIIZINKAN : TIPE_VIDEO_DIIZINKAN;
  const ekstensi = tabelTipe[file.type];
  const maksUkuran = isFoto ? MAKS_UKURAN_FOTO : MAKS_UKURAN_VIDEO;

  if (!ekstensi) {
    return jsonResponse({ error: `Tipe file "${file.type}" tidak diizinkan.` }, 415, env);
  }
  if (file.size > maksUkuran) {
    return jsonResponse(
      { error: `File terlalu besar (maks ${Math.round(maksUkuran / 1024 / 1024)}MB).` },
      413,
      env
    );
  }

  const namaBucket = isFoto ? env.B2_BUCKET_FOTO : env.B2_BUCKET_VIDEO;
  const namaFile = `${crypto.randomUUID()}.${ekstensi}`;
  const key = `${laporanId}/${namaFile}`;

  try {
    const client = buatClientB2(env);
    const bodyBuffer = await file.arrayBuffer();

    const resUpload = await client.fetch(urlObjekB2(env, namaBucket, key), {
      method: 'PUT',
      body: bodyBuffer,
      headers: { 'Content-Type': file.type },
    });

    if (!resUpload.ok) {
      return jsonResponse({ error: 'Gagal menyimpan file ke B2.' }, 500, env);
    }
  } catch (err) {
    return jsonResponse({ error: 'Terjadi kesalahan saat mengunggah.' }, 500, env);
  }

  // URL yang disimpan ke database adalah URL Worker ini sendiri
  // (bukan URL B2 langsung), karena bucket-nya private — semua
  // pembacaan file juga harus lewat Worker ini (lihat tanganiBaca).
  const origin = new URL(request.url).origin;
  const urlPublik = `${origin}/file/${kind}/${key}`;
  return jsonResponse({ url: urlPublik }, 200, env);
}

async function tanganiBaca(env, kind, laporanId, namaFile) {
  if (kind !== 'foto' && kind !== 'video') {
    return new Response('Not found', { status: 404 });
  }
  if (!POLA_UUID.test(laporanId) || !POLA_NAMA_FILE.test(namaFile)) {
    return new Response('Not found', { status: 404 });
  }

  const namaBucket = kind === 'foto' ? env.B2_BUCKET_FOTO : env.B2_BUCKET_VIDEO;
  const key = `${laporanId}/${namaFile}`;

  try {
    const client = buatClientB2(env);
    const resB2 = await client.fetch(urlObjekB2(env, namaBucket, key), {
      method: 'GET',
      cf: { cacheTtl: 86400, cacheEverything: true },
    });

    if (!resB2.ok) {
      return new Response('File tidak ditemukan.', { status: resB2.status });
    }

    const headers = new Headers(resB2.headers);
    headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGIN || '*');
    // File hasil upload immutable (nama filenya random per upload), jadi
    // aman di-cache lama-lama di browser & Cloudflare edge.
    headers.set('Cache-Control', 'public, max-age=604800, immutable');

    return new Response(resB2.body, { status: 200, headers });
  } catch (err) {
    return new Response('Terjadi kesalahan saat mengambil file.', { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: headerCors(env) });
    }

    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/upload') {
      return tanganiUpload(request, env);
    }

    if (request.method === 'GET' && url.pathname.startsWith('/file/')) {
      const bagian = url.pathname.split('/').filter(Boolean); // ['file', kind, laporanId, namaFile]
      if (bagian.length !== 4) return new Response('Not found', { status: 404 });
      const [, kind, laporanId, namaFile] = bagian;
      return tanganiBaca(env, kind, laporanId, namaFile);
    }

    return jsonResponse({ error: 'Not found.' }, 404, env);
  },
};
