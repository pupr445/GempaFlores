import { supabase } from './supabaseClient';

// Urutan & label tetap untuk tingkat kerusakan — dipakai konsisten di
// peta, grafik, dan legenda supaya warna & urutannya selalu sama.
export const URUTAN_KERUSAKAN = ['Rusak Aman', 'Rusak Ringan', 'Rusak Sedang', 'Rusak Berat'];
export const LABEL_TIDAK_ADA_DATA = 'Belum ada data kerusakan';

export const WARNA_KERUSAKAN = {
  'Rusak Aman': '#3c7a5b', // moss
  'Rusak Ringan': '#d9a441', // amber
  'Rusak Sedang': '#c4571c', // ember
  'Rusak Berat': '#ab2f22', // danger
  [LABEL_TIDAK_ADA_DATA]: '#b9c2bf', // abu-abu netral
};

// Tingkat kerusakan "efektif" satu laporan — kolom tingkat_kerusakan
// (Jalan dan Jembatan / Sumber Daya Air / Cipta Karya) atau kondisi_rumah
// (Perumahan dan Permukiman - Rumah/Perumahan) saling meniadakan, jadi
// cukup satu nilai gabungan per laporan.
export function kondisiEfektif(lp) {
  return lp.tingkat_kerusakan || lp.kondisi_rumah || LABEL_TIDAK_ADA_DATA;
}

/**
 * Ambil kolom-kolom ringan (lokasi, wilayah, tingkat kerusakan) untuk
 * SEMUA laporan yang punya koordinat — dipakai untuk peta sebaran &
 * grafik statistik. Sengaja tidak ikut mengambil foto/video/deskripsi
 * supaya jauh lebih ringan & cepat dibanding export lengkap.
 *
 * Sama seperti ambilLaporanRentang di exportLaporan.js, di-paginasi per
 * 1000 baris (batas default Supabase) supaya tidak terpotong.
 */
export async function ambilTitikStatistik({ jenisInfrastruktur, onProgress } = {}) {
  const UKURAN_HALAMAN = 1000;
  let semuaData = [];
  let dari = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let query = supabase
      .from('laporan')
      .select(
        'latitude, longitude, jenis_infrastruktur, sub_jenis_infrastruktur, tingkat_kerusakan, kondisi_rumah, kabupaten_kota, kecamatan'
      )
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .range(dari, dari + UKURAN_HALAMAN - 1);

    if (jenisInfrastruktur) query = query.eq('jenis_infrastruktur', jenisInfrastruktur);

    const { data, error } = await query;
    if (error) throw error;

    const halaman = data || [];
    semuaData = semuaData.concat(halaman);
    if (onProgress) onProgress(semuaData.length);

    if (halaman.length < UKURAN_HALAMAN) break;
    dari += UKURAN_HALAMAN;
  }

  return semuaData;
}

// Hitung total per tingkat kerusakan, dari sekumpulan laporan.
export function hitungTotalKerusakan(titikList) {
  const hasil = {};
  for (const t of URUTAN_KERUSAKAN) hasil[t] = 0;
  hasil[LABEL_TIDAK_ADA_DATA] = 0;
  for (const lp of titikList) {
    const k = kondisiEfektif(lp);
    hasil[k] = (hasil[k] ?? 0) + 1;
  }
  return hasil;
}

// Hitung per kabupaten -> { [kabupaten]: { [tingkat]: jumlah, total } },
// diurutkan dari total terbanyak.
export function hitungPerKabupaten(titikList) {
  const map = new Map();
  for (const lp of titikList) {
    const kab = lp.kabupaten_kota?.trim() || 'Tidak diketahui';
    const k = kondisiEfektif(lp);
    if (!map.has(kab)) {
      const awal = {};
      for (const t of URUTAN_KERUSAKAN) awal[t] = 0;
      awal[LABEL_TIDAK_ADA_DATA] = 0;
      awal.total = 0;
      map.set(kab, awal);
    }
    const baris = map.get(kab);
    baris[k] = (baris[k] ?? 0) + 1;
    baris.total += 1;
  }
  return [...map.entries()]
    .map(([kabupaten, hitung]) => ({ kabupaten, ...hitung }))
    .sort((a, b) => b.total - a.total);
}

// Hitung per kecamatan DALAM SATU kabupaten tertentu -> array serupa
// hitungPerKabupaten, tapi dikelompokkan per kecamatan.
export function hitungPerKecamatan(titikList, kabupaten) {
  const map = new Map();
  for (const lp of titikList) {
    if ((lp.kabupaten_kota?.trim() || 'Tidak diketahui') !== kabupaten) continue;
    const kec = lp.kecamatan?.trim() || 'Tidak diketahui';
    const k = kondisiEfektif(lp);
    if (!map.has(kec)) {
      const awal = {};
      for (const t of URUTAN_KERUSAKAN) awal[t] = 0;
      awal[LABEL_TIDAK_ADA_DATA] = 0;
      awal.total = 0;
      map.set(kec, awal);
    }
    const baris = map.get(kec);
    baris[k] = (baris[k] ?? 0) + 1;
    baris.total += 1;
  }
  return [...map.entries()]
    .map(([kecamatan, hitung]) => ({ kecamatan, ...hitung }))
    .sort((a, b) => b.total - a.total);
}
