'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '../../../components/AdminHeader';
import { IconLoader, IconAlert, IconLock } from '../../../components/icons';
import { timSurveyTerverifikasi, verifikasiKodeSurvey } from '../../../lib/aksesSurvey';

export default function HalamanSurveyLogin() {
  const router = useRouter();
  const [kode, setKode] = useState('');
  const [error, setError] = useState('');
  const [cekSesi, setCekSesi] = useState(true);

  // Kalau di HP ini sudah pernah masukin kode benar, langsung lempar ke form.
  useEffect(() => {
    if (timSurveyTerverifikasi()) {
      router.replace('/survey');
    } else {
      setCekSesi(false);
    }
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (verifikasiKodeSurvey(kode)) {
      router.replace('/survey');
    } else {
      setError('Kode akses salah. Hubungi koordinator tim survey.');
    }
  };

  if (cekSesi) {
    return (
      <main className="admin-cek-sesi">
        <IconLoader size={20} />
        Memeriksa akses…
      </main>
    );
  }

  return (
    <>
      <AdminHeader subtitle="Khusus tim survey lapangan" showLogout={false} />

      <main className="halaman-admin-login">
        <form className="form-admin-login" onSubmit={handleSubmit}>
          <div className="form-admin-login-icon">
            <IconLock size={26} />
          </div>
          <h2>Akses Tim Survey</h2>
          <p className="field-hint" style={{ justifyContent: 'center', marginBottom: 4 }}>
            Masukkan kode akses yang diberikan koordinator. Kode ini dibagikan
            ke seluruh anggota tim survey, bukan akun pribadi.
          </p>

          <label>
            Kode akses
            <input
              type="password"
              required
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              autoComplete="off"
              placeholder="Masukkan kode akses"
              autoFocus
            />
          </label>

          {error && (
            <p className="pesan-status pesan-status-error">
              <IconAlert size={16} /> {error}
            </p>
          )}

          <button type="submit" className="tombol-kirim">
            <IconLock size={16} /> Masuk
          </button>

          <Link href="/" className="link-kembali-landing">
            ← Kembali ke halaman utama
          </Link>
        </form>
      </main>
    </>
  );
}
