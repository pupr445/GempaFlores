'use client';

import Seismogram from './Seismogram';
import NavTabs from './NavTabs';
import StatusOffline from './StatusOffline';
import { asetPublik } from '../lib/basePath';

export default function AppHeader({ subtitle }) {
  return (
    <header className="app-header">
      <StatusOffline />
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
        <p className="app-subtitle">
          {subtitle || 'Laporan lapangan tercatat lokasi & waktu otomatis'}
        </p>
        <Seismogram />
        <NavTabs />
      </div>
    </header>
  );
}
