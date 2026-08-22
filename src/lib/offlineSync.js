import { ambilSemuaAntrian, simpanKeAntrian, hapusDariAntrian } from './offlineQueue';
import { kirimDraftKeServer } from './kirimLaporanServer';

const EVENT_PERUBAHAN = 'gempaflores:antrian-berubah';
let sedangMemproses = false;

function kabarkanPerubahan() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_PERUBAHAN));
  }
}

export function dengarkanPerubahanAntrian(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_PERUBAHAN, callback);
  return () => window.removeEventListener(EVENT_PERUBAHAN, callback);
}

/**
 * Coba kirim semua laporan yang tertahan di antrian. Aman dipanggil
 * berkali-kali (mis. dari event 'online' dan interval) — kalau sedang
 * berjalan, panggilan berikutnya diabaikan.
 */
export async function prosesAntrian() {
  if (sedangMemproses) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

  sedangMemproses = true;
  try {
    const antrian = await ambilSemuaAntrian();
    for (const draft of antrian) {
      try {
        await kirimDraftKeServer(draft, (progresDraft) => {
          // simpan progres per-file supaya kalau putus lagi di tengah,
          // tidak upload ulang file yang sudah berhasil
          simpanKeAntrian(progresDraft).catch(() => {});
        });
        await hapusDariAntrian(draft.id);
        kabarkanPerubahan();
      } catch (err) {
        // gagal (masih offline / server error) — biarkan di antrian,
        // lanjut coba yang lain, akan dicoba lagi nanti.
        console.warn('Gagal mengirim dari antrian, akan dicoba lagi:', err);
      }
    }
  } finally {
    sedangMemproses = false;
  }
}

let sudahDipasang = false;

/**
 * Pasang listener sekali di awal (dipanggil dari komponen root/layout):
 * - saat browser event 'online' menyala
 * - tiap app dibuka/di-mount
 * - polling ringan tiap 30 detik selagi app terbuka (jaga-jaga event
 *   'online' tidak terpicu di sebagian browser/HP saat sinyal balik)
 */
export function pasangSinkronOtomatis() {
  if (sudahDipasang || typeof window === 'undefined') return;
  sudahDipasang = true;

  window.addEventListener('online', () => prosesAntrian());
  prosesAntrian();
  setInterval(() => prosesAntrian(), 30000);
}
