'use client';

import { useEffect, useState, useCallback } from 'react';
import AppHeader from '../../components/AppHeader';
import { IconLoader, IconAlert, IconMapPin } from '../../components/icons';
import { supabase } from '../../lib/supabaseClient';
import { DAFTAR_JENIS_INFRASTRUKTUR } from '../../lib/infrastruktur';

const OPSI_SEMUA_JENIS = 'Semua Jenis';

/**
 * Halaman ini murni untuk MEMBACA data — tidak ada tombol edit atau hapus
 * sama sekali di UI, dan Supabase (lewat RLS di supabase-schema.sql) memang
 * sengaja tidak diberi izin UPDATE/DELETE untuk kunci publik, jadi data
 * yang sudah masuk tidak bisa diubah siapa pun lewat aplikasi ini.
 */
const JUMLAH_PER_HALAMAN = 20;

export default function HalamanRiwayat() {
  const [laporanList, setLaporanList] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [halaman, setHalaman] = useState(0);
  const [sedangMuatLagi, setSedangMuatLagi] = useState(false);
  const [masihAdaLagi, setMasihAdaLagi] = useState(true);
  const [filterJenis, setFilterJenis] = useState(OPSI_SEMUA_JENIS);
  const [hitungan, setHitungan] = useState(null); // { total, perJenis: {jenis: n} }

  const ambilData = useCallback(async (halamanKe, jenisAktif) => {
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

    const [hasilTotal, ...hasilPerJenis] = await Promise.all([queryTotal, ...queryPerJenis]);

    const perJenis = {};
    DAFTAR_JENIS_INFRASTRUKTUR.forEach((jenis, i) => {
      perJenis[jenis] = hasilPerJenis[i]?.count ?? 0;
    });

    setHitungan({ total: hasilTotal?.count ?? 0, perJenis });
  }, []);

  // Muat ulang daftar dari awal setiap kali filter jenis berganti.
  useEffect(() => {
    setStatus('loading');
    setHalaman(0);
    ambilData(0, filterJenis);
  }, [filterJenis, ambilData]);

  // Hitungan realtime: ambil sekali di awal, lalu perbarui otomatis setiap
  // ada laporan baru masuk (tanpa perlu memuat ulang halaman).
  useEffect(() => {
    ambilHitungan();

    const channel = supabase
      .channel('hitungan-laporan')
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

  async function muatLebihBanyak() {
    setSedangMuatLagi(true);
    const halamanBaru = halaman + 1;
    await ambilData(halamanBaru, filterJenis);
    setHalaman(halamanBaru);
    setSedangMuatLagi(false);
  }

  return (
    <>
      <AppHeader subtitle="Arsip laporan lapangan yang sudah tercatat" />

      <main className="halaman-riwayat">
        <span className="riwayat-badge"><IconMapPin size={13} /> Hanya lihat &middot; tidak bisa diubah</span>

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
          </div>
        )}

        <p className="riwayat-catatan-kategori">
          Kategori jenis infrastruktur (Jalan dan Jembatan, Sumber Daya Air, Cipta Karya,
          Perumahan dan Permukiman) baru mulai dicatat sejak <strong>21 Agustus 2026, pukul 12.00 WITA</strong>.
          Laporan yang masuk sebelum tanggal tersebut belum memiliki kategori dan hanya
          terhitung pada kartu &ldquo;Semua Laporan&rdquo;.
        </p>

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
            {filterJenis === OPSI_SEMUA_JENIS
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
                </p>
                <p className="kartu-laporan-lokasi">
                  {laporan.desa_kelurahan}, {laporan.kecamatan}
                  <br />
                  {laporan.kabupaten_kota}
                </p>
                <p className="kartu-laporan-koordinat">
                  {laporan.latitude?.toFixed(6)}, {laporan.longitude?.toFixed(6)}
                </p>
              </div>

              {laporan.jenis_infrastruktur && (
                <p className="kartu-laporan-jenis">
                  {laporan.jenis_infrastruktur}
                  {laporan.sub_jenis_infrastruktur && ` · ${laporan.sub_jenis_infrastruktur}`}
                  {laporan.nama_ruas_jalan && ` · ${laporan.nama_ruas_jalan}`}
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
      </main>
    </>
  );
}
