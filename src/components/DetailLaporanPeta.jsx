'use client';

import { useEffect, useState } from 'react';
import { IconLoader, IconAlert, IconMapPin } from './icons';
import { supabase } from '../lib/supabaseClient';

/**
 * Modal detail satu laporan — dibuka saat satu titik di Peta Sebaran
 * diklik.
 *
 * Peta sengaja hanya memuat kolom ringan (lihat ambilTitikStatistik),
 * jadi detail lengkapnya — termasuk identitas pelapor, deskripsi, foto,
 * dan video — baru ditarik di sini per laporan saat benar-benar dibuka.
 * Dengan begitu peta tetap ringan walau titiknya puluhan ribu.
 */
export default function DetailLaporanPeta({ laporanId, titikRingkas, onTutup }) {
  const [laporan, setLaporan] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  // Tarik data lengkap laporan setiap kali id yang dibuka berganti.
  useEffect(() => {
    let dibatalkan = false;

    async function ambilDetail() {
      setStatus('loading');
      setLaporan(null);

      const { data, error } = await supabase
        .from('laporan')
        .select('*, foto_laporan(id, url), video_laporan(id, url)')
        .eq('id', laporanId)
        .single();

      if (dibatalkan) return;

      if (error || !data) {
        console.error(error);
        setStatus('error');
        return;
      }

      setLaporan(data);
      setStatus('ready');
    }

    if (laporanId) ambilDetail();

    return () => {
      dibatalkan = true;
    };
  }, [laporanId]);

  // Tombol Esc menutup modal, sama seperti klik tombol tutup / latar.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onTutup();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onTutup]);

  const noHpBersih = laporan?.no_hp ? laporan.no_hp.replace(/[^0-9]/g, '') : '';
  const koordinat =
    laporan?.latitude != null && laporan?.longitude != null
      ? `${laporan.latitude.toFixed(6)}, ${laporan.longitude.toFixed(6)}`
      : null;

  return (
    <div className="detail-laporan-overlay" role="dialog" aria-modal="true" onClick={onTutup}>
      <div className="detail-laporan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-laporan-modal-header">
          <h3>Detail Laporan</h3>
          <button
            type="button"
            className="detail-laporan-tutup"
            onClick={onTutup}
            aria-label="Tutup detail laporan"
          >
            &times;
          </button>
        </div>

        <div className="detail-laporan-modal-isi">
          {status === 'loading' && (
            <p className="riwayat-loading">
              <IconLoader size={16} /> Memuat detail laporan…
            </p>
          )}

          {status === 'error' && (
            <p className="riwayat-error">
              <IconAlert size={16} /> Gagal memuat detail laporan. Periksa koneksi lalu klik titiknya
              lagi.
            </p>
          )}

          {status === 'ready' && laporan && (
            <>
              <p className="detail-laporan-waktu">
                {new Date(laporan.created_at).toLocaleString('id-ID', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
                {laporan.sumber === 'tim_survey' && (
                  <span className="badge-tim-survey">Tim Survey</span>
                )}
              </p>

              <section className="detail-laporan-blok">
                <h4>Data Pelapor</h4>
                <dl className="detail-laporan-daftar">
                  <div>
                    <dt>Nama pelapor</dt>
                    <dd>{laporan.nama_pelapor || '—'}</dd>
                  </div>
                  <div>
                    <dt>No. HP</dt>
                    <dd>
                      {laporan.no_hp ? (
                        <a
                          href={`https://wa.me/${noHpBersih}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {laporan.no_hp}
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Sumber laporan</dt>
                    <dd>{laporan.sumber === 'tim_survey' ? 'Tim Survey' : 'Masyarakat (publik)'}</dd>
                  </div>
                  <div>
                    <dt>ID laporan</dt>
                    <dd className="detail-laporan-id">{laporan.id}</dd>
                  </div>
                </dl>
              </section>

              <section className="detail-laporan-blok">
                <h4>Lokasi</h4>
                <dl className="detail-laporan-daftar">
                  <div>
                    <dt>Desa/Kelurahan</dt>
                    <dd>{laporan.desa_kelurahan || '—'}</dd>
                  </div>
                  <div>
                    <dt>Kecamatan</dt>
                    <dd>{laporan.kecamatan || '—'}</dd>
                  </div>
                  <div>
                    <dt>Kabupaten/Kota</dt>
                    <dd>{laporan.kabupaten_kota || '—'}</dd>
                  </div>
                  <div>
                    <dt>Koordinat</dt>
                    <dd>
                      {koordinat ? (
                        <a
                          href={`https://www.google.com/maps?q=${laporan.latitude},${laporan.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconMapPin size={13} /> {koordinat}
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="detail-laporan-blok">
                <h4>Infrastruktur &amp; Kerusakan</h4>
                <dl className="detail-laporan-daftar">
                  <div>
                    <dt>Jenis</dt>
                    <dd>{laporan.jenis_infrastruktur || '—'}</dd>
                  </div>
                  <div>
                    <dt>Sub jenis</dt>
                    <dd>{laporan.sub_jenis_infrastruktur || '—'}</dd>
                  </div>
                  {laporan.nama_ruas_jalan && (
                    <div>
                      <dt>Ruas jalan</dt>
                      <dd>{laporan.nama_ruas_jalan}</dd>
                    </div>
                  )}
                  {laporan.daerah_irigasi && (
                    <div>
                      <dt>Daerah irigasi</dt>
                      <dd>{laporan.daerah_irigasi}</dd>
                    </div>
                  )}
                  {laporan.kategori_bangunan_gedung && (
                    <div>
                      <dt>Kategori bangunan</dt>
                      <dd>{laporan.kategori_bangunan_gedung}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Tingkat kerusakan</dt>
                    <dd>{laporan.tingkat_kerusakan || laporan.kondisi_rumah || '—'}</dd>
                  </div>
                </dl>
              </section>

              {(laporan.nama_kepala_keluarga ||
                laporan.jumlah_kk != null ||
                laporan.jumlah_penghuni != null ||
                laporan.status_rumah ||
                laporan.kelompok_rentan ||
                laporan.kondisi_sanitasi) && (
                <section className="detail-laporan-blok">
                  <h4>Data Rumah / Pemilik</h4>
                  <dl className="detail-laporan-daftar">
                    <div>
                      <dt>Nama kepala keluarga</dt>
                      <dd>{laporan.nama_kepala_keluarga || '—'}</dd>
                    </div>
                    <div>
                      <dt>Jumlah KK</dt>
                      <dd>{laporan.jumlah_kk ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Jumlah penghuni</dt>
                      <dd>{laporan.jumlah_penghuni ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Status rumah</dt>
                      <dd>{laporan.status_rumah || '—'}</dd>
                    </div>
                    <div>
                      <dt>Kelompok rentan</dt>
                      <dd>{laporan.kelompok_rentan || '—'}</dd>
                    </div>
                    <div>
                      <dt>Kondisi sanitasi</dt>
                      <dd>{laporan.kondisi_sanitasi || '—'}</dd>
                    </div>
                  </dl>
                </section>
              )}

              {laporan.deskripsi && (
                <section className="detail-laporan-blok">
                  <h4>Deskripsi</h4>
                  <p className="detail-laporan-deskripsi">{laporan.deskripsi}</p>
                </section>
              )}

              {laporan.foto_laporan?.length > 0 && (
                <section className="detail-laporan-blok">
                  <h4>Foto ({laporan.foto_laporan.length})</h4>
                  <div className="kartu-laporan-foto-grid">
                    {laporan.foto_laporan.map((foto) => (
                      <a key={foto.id} href={foto.url} target="_blank" rel="noopener noreferrer">
                        <img src={foto.url} alt="Foto laporan" loading="lazy" />
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {laporan.video_laporan?.length > 0 && (
                <section className="detail-laporan-blok">
                  <h4>Video ({laporan.video_laporan.length})</h4>
                  <div className="kartu-laporan-video-grid">
                    {laporan.video_laporan.map((video) => (
                      <video key={video.id} src={video.url} controls playsInline />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Saat detail masih dimuat, tampilkan dulu info ringkas dari titik
              peta supaya pengguna langsung tahu titik mana yang diklik. */}
          {status === 'loading' && titikRingkas && (
            <p className="detail-laporan-ringkas">
              {[
                titikRingkas.jenis_infrastruktur,
                titikRingkas.kecamatan,
                titikRingkas.kabupaten_kota,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
