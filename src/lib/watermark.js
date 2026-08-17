/**
 * Menempelkan watermark koordinat + alamat + waktu di pojok bawah foto,
 * SEKALIGUS mengompres foto (batasi dimensi terpanjang + turunkan kualitas
 * JPEG) supaya hemat kuota Supabase Storage tanpa mengorbankan kejelasan
 * foto untuk keperluan pelaporan lapangan.
 *
 * Menerima Blob/File foto asli, mengembalikan Blob foto baru (JPEG).
 */

// Sisi terpanjang foto dibatasi maksimal segini (px). 1600px sudah lebih
// dari cukup untuk dilihat di layar HP/laptop maupun dicetak A4 kecil,
// tapi ukuran filenya jauh lebih kecil dibanding foto asli kamera HP
// (yang biasanya 3000-4000px).
const MAKS_SISI_TERPANJANG = 1600;
const KUALITAS_JPEG = 0.75;

export async function tambahWatermark(fotoBlob, lokasi) {
  const { lat, lng, kabupatenKota, kecamatan, desaKelurahan } = lokasi;

  const imgBitmap = await createImageBitmap(fotoBlob);

  // Hitung dimensi hasil kompresi, jaga rasio aspek foto asli.
  const skala = Math.min(
    1,
    MAKS_SISI_TERPANJANG / Math.max(imgBitmap.width, imgBitmap.height)
  );
  const lebar = Math.round(imgBitmap.width * skala);
  const tinggi = Math.round(imgBitmap.height * skala);

  const canvas = document.createElement('canvas');
  canvas.width = lebar;
  canvas.height = tinggi;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgBitmap, 0, 0, lebar, tinggi);

  const waktu = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const baris = [
    `${desaKelurahan}, ${kecamatan}, ${kabupatenKota}`,
    `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
    waktu,
  ];

  // Ukuran font menyesuaikan lebar foto agar tetap terbaca di HP.
  const fontSize = Math.max(16, Math.round(canvas.width / 32));
  const lineHeight = fontSize * 1.4;
  const padding = fontSize * 0.6;
  const tinggiOverlay = baris.length * lineHeight + padding * 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(
    0,
    canvas.height - tinggiOverlay,
    canvas.width,
    tinggiOverlay
  );

  ctx.fillStyle = '#ffffff';
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = 'top';

  baris.forEach((teks, i) => {
    ctx.fillText(
      teks,
      padding,
      canvas.height - tinggiOverlay + padding + i * lineHeight
    );
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', KUALITAS_JPEG);
  });
}
