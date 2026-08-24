// Logika export Riwayat Laporan ke Excel (.xlsx) & PDF.
//
// Semua proses ini jalan sepenuhnya di BROWSER (bukan server), karena
// aplikasi ini situs statis. Foto diambil ulang dari URL-nya, diperkecil
// lewat <canvas> supaya file hasil export tidak raksasa, baru ditanam ke
// dokumen. Video TIDAK ditanam (Excel/PDF bukan media player) — yang
// disertakan cuma link yang bisa diklik ke video aslinya.

import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { supabase } from './supabaseClient';

/**
 * Ambil semua laporan dalam rentang tanggal (inklusif), lengkap dengan
 * relasi foto & video. Tanggal boleh null/kosong untuk "tanpa batas".
 * jenisInfrastruktur boleh null/kosong untuk "semua jenis". sumber boleh
 * null/kosong untuk "semua sumber", atau diisi 'tim_survey' untuk hanya
 * laporan yang masuk dari mode Tim Survey.
 *
 * PENTING: Supabase/PostgREST membatasi maksimal 1000 baris per satu kali
 * panggilan query (pengaturan default "max rows"), berapa pun jumlah data
 * sebenarnya. Kalau tidak di-paginasi, laporan ke-1001 dst akan diam-diam
 * terpotong tanpa error apa pun. Karena itu di sini query diulang per
 * halaman 1000 baris (pakai .range()) sampai halaman terakhir habis,
 * supaya SEMUA laporan pada rentang tanggal ikut terambil.
 *
 * onProgress(jumlahTerambilSejauhIni) opsional, dipanggil setiap satu
 * halaman selesai diambil — dipakai untuk menampilkan progres di UI.
 */
export async function ambilLaporanRentang(
  tanggalMulai,
  tanggalSelesai,
  jenisInfrastruktur,
  sumber,
  onProgress
) {
  const UKURAN_HALAMAN = 1000;
  let semuaData = [];
  let dari = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let query = supabase
      .from('laporan')
      .select('*, foto_laporan(id, url), video_laporan(id, url)')
      .order('created_at', { ascending: true })
      .range(dari, dari + UKURAN_HALAMAN - 1);

    if (tanggalMulai) query = query.gte('created_at', `${tanggalMulai}T00:00:00`);
    if (tanggalSelesai) query = query.lte('created_at', `${tanggalSelesai}T23:59:59`);
    if (jenisInfrastruktur) query = query.eq('jenis_infrastruktur', jenisInfrastruktur);
    if (sumber) query = query.eq('sumber', sumber);

    const { data, error } = await query;
    if (error) throw error;

    const halaman = data || [];
    semuaData = semuaData.concat(halaman);
    if (onProgress) onProgress(semuaData.length);

    if (halaman.length < UKURAN_HALAMAN) break; // halaman terakhir — berhenti
    dari += UKURAN_HALAMAN;
  }

  return semuaData;
}

// Download foto dari URL-nya lalu perkecil lewat canvas. Karena bytes-nya
// didownload sendiri lewat fetch() (bukan lewat elemen <img> lintas
// domain), canvas tidak "tainted" — hasilnya tetap bisa diekspor jadi
// base64 walau fotonya berasal dari domain lain (Supabase Storage).
async function ambilFotoDiperkecil(url, maksLebar) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal mengambil foto (status ${res.status})`);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);

  const skala = Math.min(1, maksLebar / bitmap.width);
  const lebar = Math.max(1, Math.round(bitmap.width * skala));
  const tinggi = Math.max(1, Math.round(bitmap.height * skala));

  const canvas = document.createElement('canvas');
  canvas.width = lebar;
  canvas.height = tinggi;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, lebar, tinggi);
  bitmap.close?.();

  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  return { dataUrl, base64: dataUrl.split(',')[1], lebar, tinggi };
}

function formatWaktu(iso) {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

// Kolom "Detail" — ruas jalan (Jalan dan Jembatan), D.I. (Sumber Daya
// Air), atau kategori bangunan gedung (Cipta Karya) saling meniadakan,
// jadi cukup satu kolom gabungan.
function detailInfrastruktur(lp) {
  return lp.nama_ruas_jalan || lp.daerah_irigasi || lp.kategori_bangunan_gedung || '';
}

// Kolom "Kondisi/Kerusakan" — tingkat kerusakan (Cipta Karya) atau
// kondisi rumah (Perumahan dan Permukiman) saling meniadakan.
function kondisiKerusakan(lp) {
  return lp.tingkat_kerusakan || lp.kondisi_rumah || '';
}

// Ringkasan Data Rumah/Pemilik (hanya terisi untuk laporan Perumahan
// dan Permukiman sub jenis Rumah/Perumahan) — digabung jadi satu blok
// teks multi-baris supaya tidak perlu banyak kolom kosong untuk
// laporan jenis lain.
function dataRumahTeks(lp) {
  const baris = [];
  if (lp.nama_kepala_keluarga) baris.push(`KK: ${lp.nama_kepala_keluarga}`);
  if (lp.jumlah_kk != null) baris.push(`Jumlah KK: ${lp.jumlah_kk}`);
  if (lp.jumlah_penghuni != null) baris.push(`Jumlah Penghuni: ${lp.jumlah_penghuni}`);
  if (lp.status_rumah) baris.push(`Status Rumah: ${lp.status_rumah}`);
  if (lp.kelompok_rentan) baris.push(`Kelompok Rentan: ${lp.kelompok_rentan}`);
  if (lp.kondisi_sanitasi) baris.push(`Sanitasi: ${lp.kondisi_sanitasi}`);
  return baris.join('\n');
}

// ---------------------------------------------------------------------
// EXCEL
// ---------------------------------------------------------------------

export async function exportExcel(laporanList, { onProgress } = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Lapor PUPR NTT';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Riwayat Laporan', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Waktu', key: 'waktu', width: 19 },
    { header: 'Sumber', key: 'sumber', width: 12 },
    { header: 'Pelapor', key: 'pelapor', width: 20 },
    { header: 'No. HP/WA', key: 'hp', width: 16 },
    { header: 'Kabupaten/Kota', key: 'kab', width: 18 },
    { header: 'Kecamatan', key: 'kec', width: 16 },
    { header: 'Desa/Kelurahan', key: 'desa', width: 18 },
    { header: 'Koordinat', key: 'koordinat', width: 22 },
    { header: 'Jenis Infrastruktur', key: 'jenisInfra', width: 20 },
    { header: 'Sub Jenis Infrastruktur', key: 'subJenisInfra', width: 24 },
    { header: 'Detail (Ruas Jalan/D.I./Kategori Bangunan)', key: 'detailInfra', width: 28 },
    { header: 'Tingkat Kerusakan/Kondisi', key: 'kondisi', width: 20 },
    { header: 'Data Rumah/Pemilik', key: 'dataRumah', width: 32 },
    { header: 'Deskripsi', key: 'deskripsi', width: 42 },
    { header: 'Foto', key: 'foto', width: 20 },
    { header: 'Link Semua Foto', key: 'linkFoto', width: 45 },
    { header: 'Link Video', key: 'linkVideo', width: 45 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4B66' } };
    cell.alignment = { vertical: 'middle' };
  });

  let gagalFoto = 0;
  const KOLOM_FOTO_INDEX = 15; // 0-based, sejajar dengan urutan sheet.columns di atas

  for (let i = 0; i < laporanList.length; i++) {
    const lp = laporanList[i];
    const nomorBaris = i + 2; // baris 1 = header
    const row = sheet.getRow(nomorBaris);

    row.getCell('no').value = i + 1;
    row.getCell('waktu').value = formatWaktu(lp.created_at);
    row.getCell('sumber').value = lp.sumber === 'tim_survey' ? 'Tim Survey' : 'Publik';
    row.getCell('pelapor').value = lp.nama_pelapor || '';
    row.getCell('hp').value = lp.no_hp || '';
    row.getCell('kab').value = lp.kabupaten_kota || '';
    row.getCell('kec').value = lp.kecamatan || '';
    row.getCell('desa').value = lp.desa_kelurahan || '';
    row.getCell('koordinat').value =
      lp.latitude != null && lp.longitude != null
        ? `${lp.latitude.toFixed(6)}, ${lp.longitude.toFixed(6)}`
        : '';
    row.getCell('jenisInfra').value = lp.jenis_infrastruktur || '';
    row.getCell('subJenisInfra').value = lp.sub_jenis_infrastruktur || '';
    row.getCell('detailInfra').value = detailInfrastruktur(lp);
    row.getCell('kondisi').value = kondisiKerusakan(lp);

    const selDataRumah = row.getCell('dataRumah');
    selDataRumah.value = dataRumahTeks(lp);
    selDataRumah.alignment = { wrapText: true, vertical: 'top' };

    const selDeskripsi = row.getCell('deskripsi');
    selDeskripsi.value = lp.deskripsi || '';
    selDeskripsi.alignment = { wrapText: true, vertical: 'top' };

    if (lp.foto_laporan?.length) {
      const selLinkFoto = row.getCell('linkFoto');
      selLinkFoto.value = lp.foto_laporan.map((f) => f.url).join('\n');
      selLinkFoto.alignment = { wrapText: true, vertical: 'top' };
      selLinkFoto.font = { size: 8, color: { argb: 'FF5B6560' } };
    }

    if (lp.video_laporan?.length === 1) {
      row.getCell('linkVideo').value = { text: 'Buka Video', hyperlink: lp.video_laporan[0].url };
      row.getCell('linkVideo').font = { color: { argb: 'FF1155CC' }, underline: true };
    } else if (lp.video_laporan?.length > 1) {
      const selVideo = row.getCell('linkVideo');
      selVideo.value = lp.video_laporan.map((v, idx) => `Video ${idx + 1}: ${v.url}`).join('\n');
      selVideo.alignment = { wrapText: true, vertical: 'top' };
      selVideo.font = { size: 8, color: { argb: 'FF5B6560' } };
    }

    let tinggiBaris = 22;

    if (lp.foto_laporan?.length) {
      try {
        const { base64, lebar, tinggi } = await ambilFotoDiperkecil(lp.foto_laporan[0].url, 160);
        const imgId = workbook.addImage({ base64, extension: 'jpeg' });
        const skalaCetak = 0.62; // px -> perkiraan satuan Excel supaya tidak kebesaran
        const w = lebar * skalaCetak;
        const h = tinggi * skalaCetak;
        sheet.addImage(imgId, {
          tl: { col: KOLOM_FOTO_INDEX, row: nomorBaris - 1 },
          ext: { width: w, height: h },
        });
        tinggiBaris = Math.max(tinggiBaris, h * 0.78);
      } catch {
        gagalFoto++;
      }
    }

    row.height = tinggiBaris;
    onProgress?.(i + 1, laporanList.length);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, gagalFoto };
}

// ---------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------

export async function exportPdf(laporanList, { onProgress } = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxImgWidth = 150;
  let y = 50;
  let gagalFoto = 0;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Riwayat Laporan Dampak Gempa — Flores', marginX, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(`Diekspor: ${formatWaktu(new Date().toISOString())} · Total ${laporanList.length} laporan`, marginX, y);
  doc.setTextColor(0, 0, 0);
  y += 22;

  for (let i = 0; i < laporanList.length; i++) {
    const lp = laporanList[i];

    if (y > pageHeight - 130) {
      doc.addPage();
      y = 50;
    }

    doc.setDrawColor(210);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${i + 1}. ${lp.nama_pelapor || 'Tanpa nama'}  —  ${formatWaktu(lp.created_at)}`, marginX, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${lp.desa_kelurahan || '-'}, ${lp.kecamatan || '-'}, ${lp.kabupaten_kota || '-'}`, marginX, y);
    y += 12;

    const koordinatTeks =
      lp.latitude != null && lp.longitude != null
        ? `${lp.latitude.toFixed(6)}, ${lp.longitude.toFixed(6)}`
        : '-';
    doc.text(`Koordinat: ${koordinatTeks}   ·   HP: ${lp.no_hp || '-'}`, marginX, y);
    y += 14;

    if (lp.jenis_infrastruktur) {
      const detail = detailInfrastruktur(lp);
      const kondisi = kondisiKerusakan(lp);
      let baris = lp.jenis_infrastruktur;
      if (lp.sub_jenis_infrastruktur) baris += ` — ${lp.sub_jenis_infrastruktur}`;
      if (detail) baris += ` (${detail})`;
      if (kondisi) baris += `   ·   ${kondisi}`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(baris, pageWidth - marginX * 2);
      doc.text(lines, marginX, y);
      y += lines.length * 11 + 2;
      doc.setFont('helvetica', 'normal');
    }

    const dataRumah = dataRumahTeks(lp);
    if (dataRumah) {
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      const lines = doc.splitTextToSize(dataRumah.replace(/\n/g, '   ·   '), pageWidth - marginX * 2);
      doc.text(lines, marginX, y);
      y += lines.length * 11 + 4;
      doc.setTextColor(0, 0, 0);
    }

    if (lp.deskripsi) {
      const lines = doc.splitTextToSize(lp.deskripsi, pageWidth - marginX * 2);
      doc.text(lines, marginX, y);
      y += lines.length * 11 + 6;
    }

    if (lp.foto_laporan?.length) {
      let x = marginX;
      let tinggiBarisFoto = 0;

      for (const foto of lp.foto_laporan) {
        try {
          const { dataUrl, lebar, tinggi } = await ambilFotoDiperkecil(foto.url, 260);
          const skalaCetak = Math.min(maxImgWidth / lebar, 1);
          const w = lebar * skalaCetak;
          const h = tinggi * skalaCetak;

          if (x + w > pageWidth - marginX) {
            x = marginX;
            y += tinggiBarisFoto + 8;
            tinggiBarisFoto = 0;
          }
          if (y + h > pageHeight - 60) {
            doc.addPage();
            y = 50;
            x = marginX;
          }

          doc.addImage(dataUrl, 'JPEG', x, y, w, h);
          x += w + 8;
          tinggiBarisFoto = Math.max(tinggiBarisFoto, h);
        } catch {
          gagalFoto++;
        }
      }
      y += tinggiBarisFoto + 12;
    }

    if (lp.video_laporan?.length) {
      doc.setFontSize(9);
      doc.setTextColor(20, 80, 140);
      lp.video_laporan.forEach((v, idx) => {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 50;
        }
        doc.textWithLink(`▶ Video ${idx + 1} (klik untuk buka)`, marginX, y, { url: v.url });
        y += 13;
      });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
    }

    y += 12;
    onProgress?.(i + 1, laporanList.length);
  }

  return { blob: doc.output('blob'), gagalFoto };
}

// ---------------------------------------------------------------------

export function unduhBlob(blob, namaFile) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
