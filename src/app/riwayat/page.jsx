'use client';

import { useEffect, useState } from 'react';
import AppHeader from '../../components/AppHeader';
import { IconLoader, IconAlert, IconMapPin } from '../../components/icons';
import { supabase } from '../../lib/supabaseClient';

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

  async function ambilData(halamanKe) {
    const dari = halamanKe * JUMLAH_PER_HALAMAN;
    const sampai = dari + JUMLAH_PER_HALAMAN - 1;

    const { data, error } = await supabase
      .from('laporan')
      .select('*, foto_laporan(id, url), video_laporan(id, url)')
      .order('created_at', { ascending: false })
      .range(dari, sampai);

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
  }

  useEffect(() => {
    setStatus('loading');
    setHalaman(0);
    ambilData(0);
  }, []);

  async function muatLebihBanyak() {
    setSedangMuatLagi(true);
    const halamanBaru = halaman + 1;
    await ambilData(halamanBaru);
    setHalaman(halamanBaru);
    setSedangMuatLagi(false);
  }

  return (
    <>
      <AppHeader subtitle="Arsip laporan lapangan yang sudah tercatat" />

      <main className="halaman-riwayat">
        <span className="riwayat-badge"><IconMapPin size={13} /> Hanya lihat &middot; tidak bisa diubah</span>

        {status === 'loading' && (
          <p className="riwayat-loading"><IconLoader size={16} /> Memuat data laporan…</p>
        )}

        {status === 'error' && (
          <p className="riwayat-error">
            <IconAlert size={16} /> Gagal memuat data. Periksa koneksi lalu muat ulang halaman.
          </p>
        )}

        {status === 'ready' && laporanList.length === 0 && (
          <p className="riwayat-kosong">Belum ada laporan yang masuk.</p>
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
