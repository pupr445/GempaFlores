'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { asetPublik } from '../lib/basePath';
import { supabase } from '../lib/supabaseClient';
import { IconUsers, IconLock, IconClipboard } from '../components/icons';

// Kabupaten se-Pulau Flores (barat -> timur) + Lembata, ditampilkan
// sebagai titik berdenyut di sepanjang garis seismograf pada hero.
// Urutan & posisi x mengikuti urutan geografis kasar, bukan peta presisi.
const TITIK_KABUPATEN = [
  { label: 'MABAR', x: 40 },
  { label: 'MANGGARAI', x: 110 },
  { label: 'MATIM', x: 180 },
  { label: 'NGADA', x: 250 },
  { label: 'NAGEKEO', x: 320 },
  { label: 'ENDE', x: 390 },
  { label: 'SIKKA', x: 460 },
  { label: 'FLOTIM', x: 530 },
  { label: 'LEMBATA', x: 600, italic: true },
];

export default function HalamanBeranda() {
  const [totalLaporan, setTotalLaporan] = useState(null);

  useEffect(() => {
    let batal = false;
    supabase
      .from('laporan')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => {
        if (!batal && typeof count === 'number') setTotalLaporan(count);
      });
    return () => {
      batal = true;
    };
  }, []);

  return (
    <>
      <div className="beranda-instansi-bar">
        <img
          src={asetPublik('/logo-ntt.png')}
          alt="Lambang Provinsi Nusa Tenggara Timur"
          className="beranda-instansi-logo"
        />
        <div className="beranda-instansi-text">
          <strong>Pemerintah Provinsi Nusa Tenggara Timur</strong>
          <br />
          Dinas Pekerjaan Umum dan Perumahan Rakyat
        </div>
        <img src={asetPublik('/logo-pupr.jpg')} alt="Logo PUPR" className="beranda-instansi-logo" />
      </div>

      <header className="beranda-hero">
        <div className="beranda-hero-inner">
          <p className="beranda-eyebrow">
            <span className="beranda-titik-hidup" /> Tanggap Darurat &middot; Lapor PUPR NTT
          </p>
          <h1 className="beranda-judul">
            Lapor dampak
            <br />
            <em>gempa Flores</em>,
            <br />
            sekarang.
          </h1>
          <p className="beranda-lede">
            Satu titik laporan untuk warga se-Pulau Flores, tim survey, dan Dinas PUPR — lokasi &amp;
            waktu tercatat otomatis, tanpa perlu login untuk melapor.
          </p>

          <div className="beranda-stat-strip">
            <div>
              <span className="beranda-stat-angka">
                {totalLaporan != null ? totalLaporan.toLocaleString('id-ID') : '…'}
              </span>
              <span className="beranda-stat-label">Laporan diterima</span>
            </div>
            <div>
              <span className="beranda-stat-angka">24/7</span>
              <span className="beranda-stat-label">Diterima kapan saja</span>
            </div>
          </div>

          <div className="beranda-peta-wrap">
            <svg
              className="beranda-peta-svg"
              viewBox="0 0 640 128"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                className="beranda-horizon-gunung-2"
                d="M0,90 L60,58 L100,84 L150,40 L190,86 L260,64 L300,88 L360,36 L410,90 L470,60 L520,88 L580,50 L640,86 L640,128 L0,128 Z"
              />
              <path
                className="beranda-horizon-gunung"
                d="M0,108 L45,88 L90,110 L140,78 L185,112 L245,92 L295,114 L345,82 L400,112 L455,90 L505,114 L560,86 L610,112 L640,104 L640,128 L0,128 Z"
              />
              <polyline
                className="beranda-garis-seismo"
                points="0,30 40,30 52,30 62,10 72,44 82,14 92,36 104,30 170,30 182,30 192,8 202,46 212,12 222,38 234,30 640,30"
              />
              <g className="beranda-titik-kabupaten">
                {TITIK_KABUPATEN.map((t, i) => (
                  <g key={t.label}>
                    <circle className="pulsa" cx={t.x} cy="30" r="3" style={{ animationDelay: `${i * 0.22}s` }} />
                    <circle className="inti" cx={t.x} cy="30" r="3" />
                    <text
                      className={t.italic ? 'beranda-label-lembata' : undefined}
                      x={t.x}
                      y="48"
                      textAnchor="middle"
                    >
                      {t.label}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
          </div>
        </div>
      </header>

      <main className="halaman-beranda">
        <Link href="/lapor" className="beranda-cta-utama">
          <div className="beranda-cta-ikon">
            <IconUsers size={24} />
          </div>
          <div className="beranda-cta-teks">
            <h2>Buat Laporan</h2>
            <p>Untuk masyarakat — tanpa login, langsung dari HP</p>
          </div>
          <span className="beranda-cta-panah" aria-hidden="true">→</span>
        </Link>

        <p className="beranda-pembagi-internal">Akses internal</p>

        <div className="beranda-baris-internal">
          <Link href="/survey" className="beranda-kartu-internal">
            <div className="beranda-kartu-internal-ikon">
              <IconClipboard size={18} />
            </div>
            <h3>Tim Survey</h3>
            <p>Laporan cepat lapangan.</p>
            <span className="beranda-tag-kunci">Perlu kode akses</span>
          </Link>
          <Link href="/admin/login" className="beranda-kartu-internal">
            <div className="beranda-kartu-internal-ikon">
              <IconLock size={18} />
            </div>
            <h3>Admin</h3>
            <p>Riwayat &amp; export data.</p>
            <span className="beranda-tag-kunci">Perlu login</span>
          </Link>
        </div>
      </main>

      <footer className="beranda-footer">
        Dinas Pekerjaan Umum dan Perumahan Rakyat &middot; Provinsi Nusa Tenggara Timur
        <br />
        Data laporan digunakan untuk penanganan darurat pascagempa Flores
      </footer>
    </>
  );
}
