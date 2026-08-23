'use client';

import { useEffect, useState, useCallback } from 'react';
import { IconLoader, IconAlert, IconMapPin, IconUsers } from './icons';
import { supabase } from '../lib/supabaseClient';
import { DAFTAR_JENIS_INFRASTRUKTUR } from '../lib/infrastruktur';

const OPSI_SEMUA_JENIS = 'Semua Jenis';
const JUMLAH_PER_HALAMAN = 20;

/**
 * Menampilkan arsip laporan lapangan (murni baca, tidak ada tombol edit/hapus).
 * Dipakai di halaman publik /riwayat, dan disematkan di dasbor Admin & Tim Survey.
 *
 * - includeSumberFilter: tampilkan kartu filter tambahan "Dari Tim Survey"
 *   untuk menyaring laporan yang masuk lewat mode Tim Survey (sumber = 'tim_survey').
 * - showBadge / showCatatanKategori: kontrol tampilan elemen opsional agar
 *   tetap ringkas saat disematkan di dasbor lain.
 */
export default function RiwayatLaporan({
  includeSumberFilter = false,
  showBadge = true,
  showCatatanKategori = true,
}) {
  const [laporanList, setLaporanList] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [halaman, setHalaman] = useState(0);
  const [sedangMuatLagi, setSedangMuatLagi] = useState(false);
  const [masihAdaLagi, setMasihAdaLagi] = useState(true);
  const [filterJenis, setFilterJenis] = useState(OPSI_SEMUA_JENIS);
  const [filterTimSurvey, setFilterTimSurvey] = useState(false);
  const [hitungan, setHitungan] = useState(null); // { total, perJenis: {jenis: n}, timSurvey }

  const ambilData = useCallback(async (halamanKe, jenisAktif, sumberAktif) => {
    const dari = halamanKe * JUMLAH_PER_HALAMAN;
    const sampai = dari + JUMLAH_PER_HALAMAN - 1;

    let query = supabase
      .from('laporan')
      .select('*, foto_laporan(id, url), video_laporan(id, url)')
      .order('created_at', { ascending: false })
      .range(dari, sampai);

    if (jenisAktif && jenisAktif !== OPSI_SEMUA_JENIS) {
      query = query.eq('jenis_infrastruktur', jenisAktif);
    }
    if (sumberAktif) {
      query = query.eq('sumber', 'tim_survey');
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setStatus('error');
      return;
    }

    setLaporanList((sebelumnya) =>
      halamanKe === 0 ? (data || []) : [...sebelumnya, ...(data || [])]
    );
    setMasihAdaLagi((data || []).length === JUMLAH_PER_HALAMAN);
    setStatus('ready');
  }, []);

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

    const queryTimSurvey = includeSumberFilter
      ? supabase
          .from('laporan')
          .select('id', { count: 'exact', head: true })
          .eq('sumber', 'tim_survey')
      : null;

    const hasil = await Promise.all([
      queryTotal,
      ...queryPerJenis,
      ...(queryTimSurvey ? [queryTimSurvey] : []),
    ]);

    const hasilTotal = hasil[0];
    const hasilPerJenis = hasil.slice(1, 1 + DAFTAR_JENIS_INFRASTRUKTUR.length);
    const hasilTimSurvey = includeSumberFilter ? hasil[hasil.length - 1] : null;

    const perJenis = {};
    DAFTAR_JENIS_INFRASTRUKTUR.forEach((jenis, i) => {
      perJenis[jenis] = hasilPerJenis[i]?.count ?? 0;
    });

    setHitungan({
      total: hasilTotal?.count ?? 0,
      perJenis,
      timSurvey: includeSumberFilter ? hasilTimSurvey?.count ?? 0 : 0,
    });
  }, [includeSumberFilter]);

  // Muat ulang daftar dari awal setiap kali filter jenis atau filter sumber berganti.
  useEffect(() => {
    setStatus('loading');
    setHalaman(0);
    ambilData(0, filterJenis, filterTimSurvey);
  }, [filterJenis, filterTimSurvey, ambilData]);

  // Hitungan realtime: ambil sekali di awal, lalu perbarui otomatis setiap
  // ada laporan baru masuk (tanpa perlu memuat ulang halaman).
  useEffect(() => {
    ambilHitungan();

    const channel = supabase
      .channel(`hitungan-laporan-${includeSumberFilter ? 'dasbor' : 'publik'}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'laporan' },
        () => ambilHitungan()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ambilHitungan, includeSumberFilter]);

  async function muatLebihBanyak() {
    setSedangMuatLagi(true);
    const halamanBaru = halaman + 1;
    await ambilData(halamanBaru, filterJenis, filterTimSurvey);
    setHalaman(halamanBaru);
    setSedangMuatLagi(false);
  }

  return (
    <>
      {showBadge && (
        <span className="riwayat-badge"><IconMapPin size={13} /> Hanya lihat &middot; tidak bisa diubah</span>
      )}

      {hitungan && (
        <div className="riwayat-stats">
          <button
            type="button"
            className={`riwayat-stat-kartu${filterJenis === OPSI_SEMUA_JENIS ? ' riwayat-stat-aktif' : ''}`}
            onClick={() => setFilterJenis(OPSI_SEMUA_JENIS)}
          >
            <span className="riwayat-stat-angka">{hitungan.total}</span>
            <span className="riwayat-stat-label">Semua Laporan</span>
          </button>
          {DAFTAR_JENIS_INFRASTRUKTUR.map((jenis) => (
            <button
              type="button"
              key={jenis}
              className={`riwayat-stat-kartu${filterJenis === jenis ? ' riwayat-stat-aktif' : ''}`}
              onClick={() => setFilterJenis(jenis)}
            >
              <span className="riwayat-stat-angka">{hitungan.perJenis[jenis] ?? 0}</span>
              <span className="riwayat-stat-label">{jenis}</span>
            </button>
          ))}
          {includeSumberFilter && (
            <button
              type="button"
              className={`riwayat-stat-kartu riwayat-stat-kartu-survey${filterTimSurvey ? ' riwayat-stat-aktif' : ''}`}
              onClick={() => setFilterTimSurvey((sebelumnya) => !sebelumnya)}
            >
              <span className="riwayat-stat-angka">{hitungan.timSurvey}</span>
              <span className="riwayat-stat-label"><IconUsers size={11} /> Dari Tim Survey</span>
            </button>
          )}
        </div>
      )}

      {showCatatanKategori && (
        <p className="riwayat-catatan-kategori">
          Kategori jenis infrastruktur (Jalan dan Jembatan, Sumber Daya Air, Cipta Karya,
          Perumahan dan Permukiman) baru mulai dicatat sejak <strong>21 Agustus 2026, pukul 12.00 WITA</strong>.
          Laporan yang masuk sebelum tanggal tersebut belum memiliki kategori dan hanya
          terhitung pada kartu &ldquo;Semua Laporan&rdquo;.
        </p>
      )}

      <label className="field riwayat-filter">
        <span className="field-label">Tampilkan jenis</span>
        <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}>
          <option value={OPSI_SEMUA_JENIS}>{OPSI_SEMUA_JENIS}</option>
          {DAFTAR_JENIS_INFRASTRUKTUR.map((jenis) => (
            <option key={jenis} value={jenis}>{jenis}</option>
          ))}
        </select>
      </label>

      {status === 'loading' && (
        <p className="riwayat-loading"><IconLoader size={16} /> Memuat data laporan…</p>
      )}

      {status === 'error' && (
        <p className="riwayat-error">
          <IconAlert size={16} /> Gagal memuat data. Periksa koneksi lalu muat ulang halaman.
        </p>
      )}

      {status === 'ready' && laporanList.length === 0 && (
        <p className="riwayat-kosong">
          {filterTimSurvey && filterJenis !== OPSI_SEMUA_JENIS
            ? `Belum ada laporan Tim Survey untuk jenis "${filterJenis}".`
            : filterTimSurvey
              ? 'Belum ada laporan yang masuk dari Tim Survey.'
              : filterJenis === OPSI_SEMUA_JENIS
                ? 'Belum ada laporan yang masuk.'
                : `Belum ada laporan untuk jenis "${filterJenis}".`}
        </p>
      )}

      {status === 'ready' &&
        laporanList.map((laporan) => (
          <article key={laporan.id} className="kartu-laporan">
            <div className="kartu-laporan-header">
              <p className="kartu-laporan-waktu">
                {new Date(laporan.created_at).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                {laporan.sumber === 'tim_survey' && (
                  <span className="badge-tim-survey">Tim Survey</span>
                )}
              </p>
              {laporan.kabupaten_kota && (
                <p className="kartu-laporan-lokasi">
                  {laporan.desa_kelurahan}, {laporan.kecamatan}
                  <br />
                  {laporan.kabupaten_kota}
                </p>
              )}
              <p className="kartu-laporan-koordinat">
                {laporan.latitude?.toFixed(6)}, {laporan.longitude?.toFixed(6)}
              </p>
            </div>

            {laporan.jenis_infrastruktur && (
              <p className="kartu-laporan-jenis">
                {laporan.jenis_infrastruktur}
                {laporan.sub_jenis_infrastruktur && ` · ${laporan.sub_jenis_infrastruktur}`}
                {laporan.nama_ruas_jalan && ` · ${laporan.nama_ruas_jalan}`}
                {laporan.daerah_irigasi && ` · ${laporan.daerah_irigasi}`}
                {laporan.tingkat_kerusakan && ` · ${laporan.tingkat_kerusakan}`}
              </p>
            )}

            {(laporan.nama_pelapor || laporan.no_hp) && (
              <p className="kartu-laporan-kontak">
                {laporan.nama_pelapor}
                {laporan.nama_pelapor && laporan.no_hp && ' · '}
                {laporan.no_hp && (
                  <a href={`https://wa.me/${laporan.no_hp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                    {laporan.no_hp}
                  </a>
                )}
              </p>
            )}

            {laporan.deskripsi && (
              <p className="kartu-laporan-deskripsi">{laporan.deskripsi}</p>
            )}

            {laporan.foto_laporan?.length > 0 && (
              <div className="kartu-laporan-foto-grid">
                {laporan.foto_laporan.map((foto) => (
                  <a
                    key={foto.id}
                    href={foto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src={foto.url} alt="Foto laporan" loading="lazy" />
                  </a>
                ))}
              </div>
            )}

            {laporan.video_laporan?.length > 0 && (
              <div className="kartu-laporan-video-grid">
                {laporan.video_laporan.map((video) => (
                  <video key={video.id} src={video.url} controls playsInline />
                ))}
              </div>
            )}
          </article>
        ))}

      {status === 'ready' && masihAdaLagi && (
        <button
          type="button"
          className="riwayat-muat-lagi"
          onClick={muatLebihBanyak}
          disabled={sedangMuatLagi}
        >
          {sedangMuatLagi ? (
            <>
              <IconLoader size={16} /> Memuat…
            </>
          ) : (
            'Muat lebih banyak'
          )}
        </button>
      )}
    </>
  );
}
