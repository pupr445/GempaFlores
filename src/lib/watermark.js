/**
 * Menempelkan watermark koordinat + alamat + waktu di pojok bawah foto.
 * Menerima Blob/File foto asli, mengembalikan Blob foto baru (JPEG).
 */
export async function tambahWatermark(fotoBlob, lokasi) {
  const { lat, lng, kabupatenKota, kecamatan, desaKelurahan } = lokasi;

  const imgBitmap = await createImageBitmap(fotoBlob);

  const canvas = document.createElement('canvas');
  canvas.width = imgBitmap.width;
  canvas.height = imgBitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgBitmap, 0, 0);

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
  const fontSize = Math.max(18, Math.round(canvas.width / 32));
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
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
  });
}
