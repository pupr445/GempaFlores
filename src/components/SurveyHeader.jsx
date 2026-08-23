'use client';

import { useRouter } from 'next/navigation';
import { asetPublik } from '../lib/basePath';
import { keluarDariModeSurvey } from '../lib/aksesSurvey';
import { IconUsers, IconLogout, IconClipboard, IconHistory } from './icons';
import DasborTabs from './DasborTabs';

const TAB_SURVEY = [
  { key: 'form', label: 'Buat Laporan', icon: <IconClipboard size={16} /> },
  { key: 'riwayat', label: 'Riwayat Laporan', icon: <IconHistory size={16} /> },
];

export default function SurveyHeader({ tabAktif, onGantiTab }) {
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

        {tabAktif && onGantiTab && (
          <DasborTabs tabs={TAB_SURVEY} aktif={tabAktif} onGanti={onGantiTab} />
        )}
      </div>
    </header>
  );
}
