// Upload foto/video lewat Cloudflare Worker (proxy ke Backblaze B2) —
// BUKAN langsung ke B2, karena kredensial B2 tidak boleh ada di kode
// frontend. Worker-nya ada di /cloudflare-worker, panduan setup di
// /PANDUAN-B2.md.
//
// Worker yang mengembalikan URL juga otomatis jadi URL "baca" file itu
// (lihat endpoint GET /file/... di Worker) — jadi hasil dari fungsi ini
// bisa langsung dipakai di <img src>/<video src> seperti biasa.

const WORKER_URL = process.env.NEXT_PUBLIC_UPLOAD_WORKER_URL;

/**
 * @param {Object} params
 * @param {Blob} params.blob - isi file (foto/video)
 * @param {string} params.laporanId - uuid laporan induk
 * @param {'foto'|'video'} params.kind
 * @param {string} params.namaFile - nama file untuk FormData (bebas, cuma metadata request)
 * @returns {Promise<string>} URL untuk menampilkan file (lewat Worker)
 */
export async function unggahFile({ blob, laporanId, kind, namaFile }) {
  if (!WORKER_URL) {
    throw new Error(
      'NEXT_PUBLIC_UPLOAD_WORKER_URL belum diisi di .env.local / secret GitHub Actions.'
    );
  }

  const formData = new FormData();
  formData.append('file', blob, namaFile);
  formData.append('laporanId', laporanId);
  formData.append('kind', kind);

  const res = await fetch(`${WORKER_URL.replace(/\/$/, '')}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let pesan = `Upload gagal (status ${res.status}).`;
    try {
      const data = await res.json();
      if (data?.error) pesan = data.error;
    } catch {
      // respons bukan JSON, pakai pesan default di atas
    }
    throw new Error(pesan);
  }

  const data = await res.json();
  if (!data.url) throw new Error('Respons Worker tidak berisi url.');
  return data.url;
}
