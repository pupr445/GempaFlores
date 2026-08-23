'use client';

import { useRouter } from 'next/navigation';
import { asetPublik } from '../lib/basePath';
import { keluarDariModeSurvey } from '../lib/aksesSurvey';
import { IconUsers, IconLogout } from './icons';

export default function SurveyHeader() {
  const router = useRouter();

  const handleKeluar = () => {
    keluarDariModeSurvey();
    router.replace('/');
  };

  return (
    <header className="app-header">
      <div className="app-header-inner admin-header-inner">
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
          <img src={asetPublik('/logo-pupr.jpg')} alt="Logo PUPR" className="instansi-logo" />
        </div>

        <p className="app-eyebrow admin-eyebrow">
          <IconUsers size={12} /> Tim Survey
        </p>
        <h1 className="app-title">Lapor PUPR NTT</h1>
        <p className="app-subtitle">Laporan cepat: koordinat, deskripsi, foto & video</p>

        <div className="admin-header-aksi">
          <button type="button" className="admin-tombol-logout" onClick={handleKeluar}>
            <IconLogout size={15} /> Keluar Mode Survey
          </button>
        </div>
      </div>
    </header>
  );
}
