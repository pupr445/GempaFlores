'use client';

import Link from 'next/link';
import Seismogram from '../components/Seismogram';
import { asetPublik } from '../lib/basePath';
import { IconUsers, IconLock } from '../components/icons';

export default function HalamanBeranda() {
  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="instansi-row">
            <img
              src={asetPublik('/logo-ntt.png')}
              alt="Lambang Provinsi Nusa Tenggara Timur"
              className="instansi-logo"
            />
            <div className="instansi-text">
              <p>Pemerintah Provinsi Nusa Tenggara Timur</p>
              <p>Dinas Pekerjaan Umum dan Perumahan Rakyat</p>
            </div>
            <img
              src={asetPublik('/logo-pupr.jpg')}
              alt="Logo PUPR"
              className="instansi-logo"
            />
          </div>

          <p className="app-eyebrow">GempaFlores</p>
          <h1 className="app-title">Lapor Dampak Gempa</h1>
          <p className="app-subtitle">Pilih cara masuk sesuai kebutuhan Anda</p>
          <Seismogram />
        </div>
      </header>

      <main className="halaman-beranda">
        <Link href="/lapor" className="kartu-pilihan kartu-pilihan-masyarakat">
          <div className="kartu-pilihan-ikon">
            <IconUsers size={26} />
          </div>
          <div className="kartu-pilihan-teks">
            <h2>Masyarakat / Pelapor</h2>
            <p>Buat laporan dampak gempa atau lihat riwayat laporan. Tidak perlu login.</p>
          </div>
          <span className="kartu-pilihan-panah" aria-hidden="true">→</span>
        </Link>

        <Link href="/admin/login" className="kartu-pilihan kartu-pilihan-admin">
          <div className="kartu-pilihan-ikon">
            <IconLock size={24} />
          </div>
          <div className="kartu-pilihan-teks">
            <h2>Admin</h2>
            <p>Masuk untuk mengakses fitur export riwayat laporan.</p>
          </div>
          <span className="kartu-pilihan-panah" aria-hidden="true">→</span>
        </Link>
      </main>
    </>
  );
}
