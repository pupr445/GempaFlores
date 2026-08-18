'use client';

import { useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import AdminHeader from '../../components/AdminHeader';
import {
  IconDownload,
  IconFileSpreadsheet,
  IconFileText,
  IconLoader,
  IconAlert,
  IconCheck,
} from '../../components/icons';
import { ambilLaporanRentang, exportExcel, exportPdf, unduhBlob } from '../../lib/exportLaporan';

function IsiDasbor() {
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [format, setFormat] = useState('excel'); // 'excel' | 'pdf'
  const [memproses, setMemproses] = useState(false);
  const [status, setStatus] = useState({ jenis: '', pesan: '' }); // '' | info | error | sukses

  const handleExport = async () => {
    setMemproses(true);
    setStatus({ jenis: 'info', pesan: 'Mengambil data laporan…' });

    try {
      const data = await ambilLaporanRentang(tanggalMulai || null, tanggalSelesai || null);

      if (data.length === 0) {
        setStatus({ jenis: 'error', pesan: 'Tidak ada laporan pada rentang tanggal tersebut.' });
        setMemproses(false);
        return;
      }

      const labelFormat = format === 'excel' ? 'Excel' : 'PDF';
      const onProgress = (selesai, total) =>
        setStatus({ jenis: 'info', pesan: `Menyusun ${labelFormat}… (${selesai}/${total} laporan, memuat foto)` });

      onProgress(0, data.length);

      const namaDari = tanggalMulai || 'semua';
      const namaSampai = tanggalSelesai || 'semua';
      const namaFileDasar = `riwayat-laporan-gempaflores_${namaDari}_${namaSampai}`;

      if (format === 'excel') {
        const { buffer, gagalFoto } = await exportExcel(data, { onProgress });
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        unduhBlob(blob, `${namaFileDasar}.xlsx`);
        setStatus({
          jenis: 'sukses',
          pesan: `Berhasil! ${data.length} laporan diekspor ke Excel.${
            gagalFoto ? ` (${gagalFoto} foto gagal dimuat & dilewati)` : ''
          }`,
        });
      } else {
        const { blob, gagalFoto } = await exportPdf(data, { onProgress });
        unduhBlob(blob, `${namaFileDasar}.pdf`);
        setStatus({
          jenis: 'sukses',
          pesan: `Berhasil! ${data.length} laporan diekspor ke PDF.${
            gagalFoto ? ` (${gagalFoto} foto gagal dimuat & dilewati)` : ''
          }`,
        });
      }
    } catch (err) {
      console.error(err);
      setStatus({ jenis: 'error', pesan: 'Gagal membuat file export. Periksa koneksi lalu coba lagi.' });
    } finally {
      setMemproses(false);
    }
  };

  return (
    <main className="halaman-admin">
      <section className="panel-export">
        <h2>Export Riwayat Laporan</h2>
        <p className="panel-export-desc">
          Unduh arsip laporan dalam rentang tanggal tertentu — Excel/PDF, lengkap dengan foto tertanam
          dan link video.
        </p>

        <div className="grid-tanggal">
          <label>
            Dari tanggal
            <input
              type="date"
              value={tanggalMulai}
              onChange={(e) => setTanggalMulai(e.target.value)}
              max={tanggalSelesai || undefined}
            />
          </label>
          <label>
            Sampai tanggal
            <input
              type="date"
              value={tanggalSelesai}
              onChange={(e) => setTanggalSelesai(e.target.value)}
              min={tanggalMulai || undefined}
            />
          </label>
        </div>
        <p className="hint-tanggal">Kosongkan salah satu atau keduanya untuk mengambil semua data.</p>

        <div className="pilihan-format">
          <button
            type="button"
            className={`format-opsi ${format === 'excel' ? 'format-opsi-aktif' : ''}`}
            onClick={() => setFormat('excel')}
          >
            <IconFileSpreadsheet size={18} /> Excel (.xlsx)
          </button>
          <button
            type="button"
            className={`format-opsi ${format === 'pdf' ? 'format-opsi-aktif' : ''}`}
            onClick={() => setFormat('pdf')}
          >
            <IconFileText size={18} /> PDF
          </button>
        </div>

        <button type="button" className="tombol-export" onClick={handleExport} disabled={memproses}>
          {memproses ? <IconLoader size={18} /> : <IconDownload size={18} />}
          {memproses ? 'Memproses…' : 'Export Sekarang'}
        </button>

        {status.pesan && (
          <p className={`pesan-status pesan-status-${status.jenis}`}>
            {status.jenis === 'error' && <IconAlert size={16} />}
            {status.jenis === 'sukses' && <IconCheck size={16} />}
            {status.jenis === 'info' && <IconLoader size={16} />}
            {status.pesan}
          </p>
        )}

        <p className="catatan-export">
          Catatan: video tidak bisa ditanam di dalam Excel/PDF (bukan media player), jadi yang
          disertakan adalah link yang bisa diklik menuju video aslinya. Untuk laporan dengan banyak
          foto, hanya foto pertama yang ditampilkan sebagai gambar di kolom "Foto" — semua link foto
          tetap tersedia di kolom "Link Semua Foto" (Excel) / dicetak berjajar (PDF).
        </p>
      </section>
    </main>
  );
}

export default function HalamanAdmin() {
  return (
    <AdminGuard>
      <AdminHeader subtitle="Dasbor Admin" />
      <IsiDasbor />
    </AdminGuard>
  );
}
