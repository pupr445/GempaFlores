import { supabase } from './supabaseClient';
import { unggahFile } from './storageUpload';

/**
 * Mengirim satu draft laporan (insert laporan + unggah foto/video) ke
 * Supabase & Worker upload. Dipakai baik untuk pengiriman langsung (form)
 * maupun saat menyinkronkan antrian offline — jadi logikanya cuma satu
 * tempat, tidak dobel.
 *
 * `draft.id` dibuat di sisi klien (crypto.randomUUID()) supaya kalau
 * proses ini diulang (retry), baris laporan yang sama tidak dobel —
 * dikirim eksplisit sebagai id, bukan dibiarkan Supabase generate sendiri.
 *
 * @param {Object} draft
 * @param {string} draft.id
 * @param {Object} draft.fields - kolom-kolom tabel laporan
 * @param {Array<{id:string, namaFile:string, blob:Blob, terkirim?:boolean}>} draft.photos
 * @param {Array<{id:string, namaFile:string, blob:Blob, terkirim?:boolean}>} draft.videos
 * @param {(draft:Object)=>void} [onProgress] - dipanggil tiap satu file
 *   selesai terkirim, supaya pemanggil bisa simpan progres ke IndexedDB.
 *   Kalau sinyal putus lagi di tengah proses, retry berikutnya tidak akan
 *   mengulang upload file yang sudah `terkirim: true`.
 */
export async function kirimDraftKeServer(draft, onProgress) {
  // upsert supaya aman diulang: kalau baris dengan id ini sudah pernah
  // berhasil ke-insert di percobaan sebelumnya (mis. laporan sukses tapi
  // foto gagal), percobaan berikutnya tidak menduplikasi baris laporan.
  const { data: laporan, error: errLaporan } = await supabase
    .from('laporan')
    .upsert({ id: draft.id, ...draft.fields }, { onConflict: 'id' })
    .select()
    .single();

  if (errLaporan) throw errLaporan;

  for (const foto of draft.photos) {
    if (foto.terkirim) continue;
    const url = await unggahFile({
      blob: foto.blob,
      laporanId: laporan.id,
      kind: 'foto',
      namaFile: foto.namaFile,
    });
    const { error } = await supabase.from('foto_laporan').insert({
      laporan_id: laporan.id,
      url,
    });
    if (error) throw error;
    foto.terkirim = true;
    onProgress?.(draft);
  }

  for (const video of draft.videos) {
    if (video.terkirim) continue;
    const url = await unggahFile({
      blob: video.blob,
      laporanId: laporan.id,
      kind: 'video',
      namaFile: video.namaFile,
    });
    const { error } = await supabase.from('video_laporan').insert({
      laporan_id: laporan.id,
      url,
    });
    if (error) throw error;
    video.terkirim = true;
    onProgress?.(draft);
  }

  return laporan;
}
