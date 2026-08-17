'use client';

import Seismogram from './Seismogram';
import NavTabs from './NavTabs';

export default function AppHeader({ subtitle }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
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
