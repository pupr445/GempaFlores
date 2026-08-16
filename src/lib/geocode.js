/**
 * Mengubah koordinat (lat, lng) menjadi nama wilayah administratif
 * (kabupaten/kota, kecamatan, desa/kelurahan) menggunakan
 * Nominatim (OpenStreetMap) — gratis, tanpa perlu API key.
 *
 * Catatan penggunaan wajar (usage policy Nominatim):
 * - Maksimal 1 request per detik.
 * - Untuk trafik besar/produksi serius, sebaiknya self-host Nominatim atau
 *   pakai provider berbayar. Untuk skala kecil-menengah ini sudah cukup.
 */
export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=id`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) throw new Error('Gagal memanggil Nominatim');

    const data = await res.json();
    const alamat = data.address || {};

    // Nominatim tidak punya struktur administratif yang seragam untuk
    // seluruh dunia, jadi kita coba beberapa kemungkinan field yang biasa
    // muncul untuk wilayah Indonesia.
    const kabupatenKota =
      alamat.county || alamat.city || alamat.regency || alamat.state_district || '-';
    const kecamatan =
      alamat.suburb || alamat.district || alamat.municipality || '-';
    const desaKelurahan =
      alamat.village || alamat.hamlet || alamat.neighbourhood || alamat.quarter || '-';

    return {
      kabupatenKota,
      kecamatan,
      desaKelurahan,
      alamatLengkap: data.display_name || '-',
    };
  } catch (err) {
    return {
      kabupatenKota: '-',
      kecamatan: '-',
      desaKelurahan: '-',
      alamatLengkap: '-',
    };
  }
}
