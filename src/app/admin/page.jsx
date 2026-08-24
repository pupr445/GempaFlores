'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminGuard from '../../components/AdminGuard';
import AdminHeader from '../../components/AdminHeader';
import RiwayatLaporan from '../../components/RiwayatLaporan';
import {
  IconDownload,
  IconFileSpreadsheet,
  IconFileText,
  IconLoader,
  IconAlert,
  IconCheck,
} from '../../components/icons';
import { ambilLaporanRentang, exportExcel, exportPdf, unduhBlob } from '../../lib/exportLaporan';
import { DAFTAR_JENIS_INFRASTRUKTUR } from '../../lib/infrastruktur';
import { supabase } from '../../lib/supabaseClient';

const OPSI_SEMUA_JENIS = 'Semua Jenis';
const SUMBER_TIM_SURVEY = 'tim_survey';

function PanelExport() {
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [jenisInfrastruktur, setJenisInfrastruktur] = useState(OPSI_SEMUA_JENIS);
  const [sumberFilter, setSumberFilter] = useState(null); // null | 'tim_survey'
  const [format, setFormat] = useState('excel'); // 'excel' | 'pdf'
  const [memproses, setMemproses] = useState(false);
  const [status, setStatus] = useState({ jenis: '', pesan: '' }); // '' | info | error | sukses
  const [hitungan, setHitungan] = useState(null); // { total, perJenis: {jenis: n}, timSurvey: n }

  const ambilHitungan = useCallback(async () => {
    const queryTotal = supabase
      .from('laporan')
      .select('id', { count: 'exact', head: true });

    const queryPerJenis = DAFTAR_JENIS_INFRASTRUKTUR.map((jenis) =>
      supabase
        .from('laporan')
        .select('id', { count: 'exact', head: true })
        .eq('jenis_infrastruktur', jenis)
    );

    const queryTimSurvey = supabase
      .from('laporan')
      .select('id', { count: 'exact', head: true })
      .eq('sumber', SUMBER_TIM_SURVEY);

    const [hasilTotal, hasilTimSurvey, ...hasilPerJenis] = await Promise.all([
      queryTotal,
      queryTimSurvey,
      ...queryPerJenis,
    ]);

    const perJenis = {};
    DAFTAR_JENIS_INFRASTRUKTUR.forEach((jenis, i) => {
      perJenis[jenis] = hasilPerJenis[i]?.count ?? 0;
    });

    setHitungan({
      total: hasilTotal?.count ?? 0,
      perJenis,
      timSurvey: hasilTimSurvey?.count ?? 0,
    });
  }, []);

  // Hitungan realtime: ambil sekali di awal, lalu perbarui otomatis setiap
  // ada laporan baru masuk — sama seperti di halaman Riwayat.
  useEffect(() => {
    ambilHitungan();

    const channel = supabase
      .channel('hitungan-laporan-admin')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'laporan' },
        () => ambilHitungan()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ambilHitungan]);

  const handleExport = async () => {
    setMemproses(true);
    setStatus({ jenis: 'info', pesan: 'Mengambil data laporan…' });

    try {
      const filterJenis = jenisInfrastruktur === OPSI_SEMUA_JENIS ? null : jenisInfrastruktur;
      const onProgressAmbil = (jumlah) =>
        setStatus({ jenis: 'info', pesan: `Mengambil data laporan… (${jumlah} terambil sejauh ini)` });
      const data = await ambilLaporanRentang(
        tanggalMulai || null,
        tanggalSelesai || null,
        filterJenis,
        sumberFilter,
        onProgressAmbil
      );

      if (data.length === 0) {
        setStatus({
          jenis: 'error',
          pesan:
            filterJenis
              ? `Tidak ada laporan jenis "${filterJenis}" pada rentang tanggal tersebut.`
              : sumberFilter
                ? 'Tidak ada laporan dari Tim Survey pada rentang tanggal tersebut.'
                : 'Tidak ada laporan pada rentang tanggal tersebut.',
        });
        setMemproses(false);
        return;
      }

      const labelFormat = format === 'excel' ? 'Excel' : 'PDF';
      const onProgress = (selesai, total) =>
        setStatus({ jenis: 'info', pesan: `Menyusun ${labelFormat}… (${selesai}/${total} laporan, memuat foto)` });

      onProgress(0, data.length);

      const namaDari = tanggalMulai || 'semua';
      const namaSampai = tanggalSelesai || 'semua';
      const namaJenisSlug = filterJenis
        ? `_${filterJenis.toLowerCase().replace(/\s+/g, '-')}`
        : '';
      const namaSumberSlug = sumberFilter ? '_tim-survey' : '';
      const namaFileDasar = `riwayat-laporan-pupr-ntt_${namaDari}_${namaSampai}${namaJenisSlug}${namaSumberSlug}`;

      const labelFilterUntukPesan = filterJenis
        ? ` (${filterJenis})`
        : sumberFilter
          ? ' (Tim Survey)'
          : '';

      if (format === 'excel') {
        const { buffer, gagalFoto } = await exportExcel(data, { onProgress });
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        unduhBlob(blob, `${namaFileDasar}.xlsx`);
        setStatus({
          jenis: 'sukses',
          pesan: `Berhasil! ${data.length} laporan${labelFilterUntukPesan} diekspor ke Excel.${
            gagalFoto ? ` (${gagalFoto} foto gagal dimuat & dilewati)` : ''
          }`,
        });
      } else {
        const { blob, gagalFoto } = await exportPdf(data, { onProgress });
        unduhBlob(blob, `${namaFileDasar}.pdf`);
        setStatus({
          jenis: 'sukses',
          pesan: `Berhasil! ${data.length} laporan${labelFilterUntukPesan} diekspor ke PDF.${
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
    <section className="panel-export">
      <h2>Export Riwayat Laporan</h2>
      <p className="panel-export-desc">
        Unduh arsip laporan dalam rentang tanggal tertentu — Excel/PDF, lengkap dengan foto tertanam
        dan link video.
      </p>

      {hitungan && (
        <div className="riwayat-stats">
          <button
            type="button"
            className={`riwayat-stat-kartu${jenisInfrastruktur === OPSI_SEMUA_JENIS && !sumberFilter ? ' riwayat-stat-aktif' : ''}`}
            onClick={() => {
              setJenisInfrastruktur(OPSI_SEMUA_JENIS);
              setSumberFilter(null);
            }}
          >
            <span className="riwayat-stat-angka">{hitungan.total}</span>
            <span className="riwayat-stat-label">Semua Laporan</span>
          </button>
          {DAFTAR_JENIS_INFRASTRUKTUR.map((jenis) => (
            <button
              type="button"
              key={jenis}
              className={`riwayat-stat-kartu${jenisInfrastruktur === jenis && !sumberFilter ? ' riwayat-stat-aktif' : ''}`}
              onClick={() => {
                setJenisInfrastruktur(jenis);
                setSumberFilter(null);
              }}
            >
              <span className="riwayat-stat-angka">{hitungan.perJenis[jenis] ?? 0}</span>
              <span className="riwayat-stat-label">{jenis}</span>
            </button>
          ))}
          <button
            type="button"
            className={`riwayat-stat-kartu${sumberFilter === SUMBER_TIM_SURVEY ? ' riwayat-stat-aktif' : ''}`}
            onClick={() => {
              setSumberFilter(SUMBER_TIM_SURVEY);
              setJenisInfrastruktur(OPSI_SEMUA_JENIS);
            }}
          >
            <span className="riwayat-stat-angka">{hitungan.timSurvey}</span>
            <span className="riwayat-stat-label">Tim Survey</span>
          </button>
        </div>
      )}

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

      <label className="field field-jenis-export">
        <span className="field-label">Jenis infrastruktur</span>
        <select
          value={jenisInfrastruktur}
          onChange={(e) => {
            setJenisInfrastruktur(e.target.value);
            setSumberFilter(null);
          }}
        >
          <option value={OPSI_SEMUA_JENIS}>{OPSI_SEMUA_JENIS}</option>
          {DAFTAR_JENIS_INFRASTRUKTUR.map((jenis) => (
            <option key={jenis} value={jenis}>{jenis}</option>
          ))}
        </select>
      </label>

      {sumberFilter === SUMBER_TIM_SURVEY && (
        <p className="field-hint">
          Filter aktif: hanya laporan dari <strong>Tim Survey</strong>. Klik kartu "Semua Laporan" atau
          pilih jenis infrastruktur untuk membatalkan filter ini.
        </p>
      )}

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
  );
}

function PanelRiwayat() {
  return (
    <section className="panel-riwayat">
      <h2>Riwayat Laporan</h2>
      <p className="panel-export-desc">
        Arsip laporan lapangan yang sudah tercatat, termasuk yang masuk dari mode Tim Survey.
      </p>
      <RiwayatLaporan includeSumberFilter />
    </section>
  );
}

export default function HalamanAdmin() {
  const [tabAktif, setTabAktif] = useState('export');

  return (
    <AdminGuard>
      <AdminHeader subtitle="Dasbor Admin" tabAktif={tabAktif} onGantiTab={setTabAktif} />
      <main className="halaman-admin">
        {tabAktif === 'export' ? <PanelExport /> : <PanelRiwayat />}
      </main>
    </AdminGuard>
  );
}
