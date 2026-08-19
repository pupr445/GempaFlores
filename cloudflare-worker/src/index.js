/**
 * Worker GempaFlores — perantara ke Backblaze B2.
 *
 * 1. POST /upload
 * 2. GET /file/:kind/:laporanId/:namaFile
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

const MAKS_UKURAN_FOTO = 8 * 1024 * 1024;
const MAKS_UKURAN_VIDEO = 20 * 1024 * 1024;

const POLA_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    headers: {
      'Content-Type': 'application/json',
      ...headerCors(env),
    },
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
    return jsonResponse(
      {
        error: 'Body harus multipart/form-data.',
      },
      400,
      env
    );
  }

  const file = form.get('file');
  const laporanId = form.get('laporanId');
  const kind = form.get('kind');

  if (!(file instanceof File)) {
    return jsonResponse(
      {
        error: 'Field "file" wajib berupa file.',
      },
      400,
      env
    );
  }

  if (
    typeof laporanId !== 'string' ||
    !POLA_UUID.test(laporanId)
  ) {
    return jsonResponse(
      {
        error: 'Field "laporanId" tidak valid.',
      },
      400,
      env
    );
  }

  if (kind !== 'foto' && kind !== 'video') {
    return jsonResponse(
      {
        error: 'Field "kind" harus "foto" atau "video".',
      },
      400,
      env
    );
  }

  const isFoto = kind === 'foto';

  const tabelTipe = isFoto
    ? TIPE_FOTO_DIIZINKAN
    : TIPE_VIDEO_DIIZINKAN;

  const ekstensi = tabelTipe[file.type];

  const maksUkuran = isFoto
    ? MAKS_UKURAN_FOTO
    : MAKS_UKURAN_VIDEO;

  if (!ekstensi) {
    return jsonResponse(
      {
        error: `Tipe file "${file.type}" tidak diizinkan.`,
      },
      415,
      env
    );
  }

  if (file.size > maksUkuran) {
    return jsonResponse(
      {
        error: `File terlalu besar (maks ${Math.round(
          maksUkuran / 1024 / 1024
        )}MB).`,
      },
      413,
      env
    );
  }

  const namaBucket = isFoto
    ? env.B2_BUCKET_FOTO
    : env.B2_BUCKET_VIDEO;

  const namaFile = `${crypto.randomUUID()}.${ekstensi}`;

  const key = `${laporanId}/${namaFile}`;

  // =========================================================
  // UPLOAD KE BACKBLAZE B2
  // =========================================================

  try {
    const client = buatClientB2(env);

    const bodyBuffer = await file.arrayBuffer();

    const urlB2 = urlObjekB2(
      env,
      namaBucket,
      key
    );

    console.log('B2 UPLOAD:', {
      bucket: namaBucket,
      key,
      url: urlB2,
      contentType: file.type,
      size: file.size,
    });

    const resUpload = await client.fetch(
      urlB2,
      {
        method: 'PUT',
        body: bodyBuffer,
        headers: {
          'Content-Type': file.type,
        },
      }
    );

    if (!resUpload.ok) {
      const detail = await resUpload.text();

      console.error('B2 upload gagal:', {
        status: resUpload.status,
        detail,
        bucket: namaBucket,
        key,
      });

      return jsonResponse(
        {
          error: 'Gagal menyimpan file ke B2.',
          b2Status: resUpload.status,
          b2Detail: detail,
        },
        500,
        env
      );
    }

    console.log('B2 UPLOAD BERHASIL:', {
      bucket: namaBucket,
      key,
      status: resUpload.status,
    });

  } catch (err) {
    console.error('Error upload:', err);

    return jsonResponse(
      {
        error: 'Terjadi kesalahan saat mengunggah.',
        detail: String(
          err?.message || err
        ),
      },
      500,
      env
    );
  }

  // =========================================================
  // URL FILE MELALUI WORKER
  // =========================================================

  const origin = new URL(request.url).origin;

  const urlPublik =
    `${origin}/file/${kind}/${key}`;

  return jsonResponse(
    {
      url: urlPublik,
    },
    200,
    env
  );
}

async function tanganiBaca(
  env,
  kind,
  laporanId,
  namaFile
) {
  // =========================================================
  // VALIDASI URL
  // =========================================================

  if (
    kind !== 'foto' &&
    kind !== 'video'
  ) {
    return new Response(
      'Not found',
      {
        status: 404,
      }
    );
  }

  if (
    !POLA_UUID.test(laporanId) ||
    !POLA_NAMA_FILE.test(namaFile)
  ) {
    return new Response(
      'Not found',
      {
        status: 404,
      }
    );
  }

  // =========================================================
  // TENTUKAN BUCKET
  // =========================================================

  const namaBucket =
    kind === 'foto'
      ? env.B2_BUCKET_FOTO
      : env.B2_BUCKET_VIDEO;

  const key =
    `${laporanId}/${namaFile}`;

  // =========================================================
  // AMBIL FILE DARI B2
  // =========================================================

  try {
    const client = buatClientB2(env);

    const urlB2 = urlObjekB2(
      env,
      namaBucket,
      key
    );

    console.log('B2 GET:', {
      bucket: namaBucket,
      key,
      url: urlB2,
    });

    /*
     * Sengaja TIDAK memakai:
     *
     * cf: {
     *   cacheTtl: 86400,
     *   cacheEverything: true
     * }
     *
     * dulu.
     *
     * Kita sedang debugging supaya response
     * langsung berasal dari B2.
     */

    const resB2 = await client.fetch(
      urlB2,
      {
        method: 'GET',
      }
    );

    // =======================================================
    // JIKA B2 GAGAL
    // =======================================================

    if (!resB2.ok) {
      const detail = await resB2.text();

      console.error(
        'B2 BACA FILE GAGAL:',
        {
          status: resB2.status,
          statusText: resB2.statusText,
          detail,
          bucket: namaBucket,
          key,
          url: urlB2,
        }
      );

      /*
       * Untuk sementara tampilkan error asli B2.
       * Ini penting untuk mengetahui apakah:
       *
       * 403 = masalah permission / application key
       * 404 = file/key tidak ditemukan
       * 401 = kredensial bermasalah
       */

      return new Response(
        `B2 GET gagal (${resB2.status})\n\n${detail}`,
        {
          status: resB2.status,
          headers: {
            'Content-Type':
              'text/plain; charset=utf-8',

            ...headerCors(env),
          },
        }
      );
    }

    // =======================================================
    // FILE BERHASIL DARI B2
    // =======================================================

    console.log(
      'B2 BACA FILE BERHASIL:',
      {
        bucket: namaBucket,
        key,
        status: resB2.status,
      }
    );

    const headers =
      new Headers(resB2.headers);

    headers.set(
      'Access-Control-Allow-Origin',
      env.ALLOWED_ORIGIN || '*'
    );

    headers.set(
      'Cache-Control',
      'public, max-age=604800, immutable'
    );

    return new Response(
      resB2.body,
      {
        status: 200,
        headers,
      }
    );

  } catch (err) {
    console.error(
      'ERROR MEMBACA B2:',
      err
    );

    return new Response(
      `Terjadi kesalahan saat mengambil file dari B2.\n\n${String(
        err?.message || err
      )}`,
      {
        status: 500,
        headers: {
          'Content-Type':
            'text/plain; charset=utf-8',

          ...headerCors(env),
        },
      }
    );
  }
}

export default {
  async fetch(request, env) {

    // =======================================================
    // CORS PREFLIGHT
    // =======================================================

    if (request.method === 'OPTIONS') {
      return new Response(
        null,
        {
          headers: headerCors(env),
        }
      );
    }

    const url =
      new URL(request.url);

    // =======================================================
    // POST /upload
    // =======================================================

    if (
      request.method === 'POST' &&
      url.pathname === '/upload'
    ) {
      return tanganiUpload(
        request,
        env
      );
    }

    // =======================================================
    // GET /file/:kind/:laporanId/:namaFile
    // =======================================================

    if (
      request.method === 'GET' &&
      url.pathname.startsWith('/file/')
    ) {

      const bagian =
        url.pathname
          .split('/')
          .filter(Boolean);

      /*
       * Bentuk yang benar:
       *
       * /file/foto/UUID/nama.jpg
       *
       * menjadi:
       *
       * ['file', 'foto', 'UUID', 'nama.jpg']
       */

      if (bagian.length !== 4) {
        return new Response(
          'Not found',
          {
            status: 404,
          }
        );
      }

      const [
        ,
        kind,
        laporanId,
        namaFile,
      ] = bagian;

      return tanganiBaca(
        env,
        kind,
        laporanId,
        namaFile
      );
    }

    // =======================================================
    // ROUTE TIDAK DITEMUKAN
    // =======================================================

    return jsonResponse(
      {
        error: 'Not found.',
      },
      404,
      env
    );
  },
};