'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { asetPublik } from '../lib/basePath';
import { IconLock, IconLogout } from './icons';

export default function AdminHeader({ subtitle, showLogout = true }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
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
          <img
            src={asetPublik('/logo-pupr.jpg')}
            alt="Logo PUPR"
            className="instansi-logo"
          />
        </div>

        <p className="app-eyebrow admin-eyebrow">
          <IconLock size={12} /> Area Admin
        </p>
        <h1 className="app-title">GempaFlores</h1>
        <p className="app-subtitle">{subtitle}</p>

        <div className="admin-header-aksi">
          <Link href="/" className="admin-link-beranda">
            ← Kembali ke Beranda
          </Link>
          {showLogout && (
            <button type="button" className="admin-tombol-logout" onClick={handleLogout}>
              <IconLogout size={15} /> Keluar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
