// Batas video agar tetap wajar diunggah dari lapangan dengan koneksi seadanya,
// sekaligus menjaga kuota Storage free tier Supabase (1GB) tidak cepat penuh.
export const MAKS_UKURAN_VIDEO_MB = 20;
export const MAKS_DURASI_VIDEO_DETIK = 30;

/**
 * Memvalidasi ukuran & durasi video sebelum ditambahkan ke daftar upload.
 * Mengembalikan { ok: true } atau { ok: false, pesan }.
 */
export function validasiUkuranVideo(file) {
  const maksBytes = MAKS_UKURAN_VIDEO_MB * 1024 * 1024;
  if (file.size > maksBytes) {
    return {
      ok: false,
      pesan: `Video "${file.name}" terlalu besar (maks ${MAKS_UKURAN_VIDEO_MB}MB).`,
    };
  }
  return { ok: true };
}

export function validasiDurasiVideo(file) {
  return new Promise((resolve) => {
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    const url = URL.createObjectURL(file);
    videoEl.src = url;

    videoEl.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (videoEl.duration > MAKS_DURASI_VIDEO_DETIK) {
        resolve({
          ok: false,
          pesan: `Video "${file.name}" terlalu panjang (maks ${MAKS_DURASI_VIDEO_DETIK} detik).`,
        });
      } else {
        resolve({ ok: true });
      }
    };

    videoEl.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, pesan: `Video "${file.name}" gagal dibaca. Coba file lain.` });
    };
  });
}
