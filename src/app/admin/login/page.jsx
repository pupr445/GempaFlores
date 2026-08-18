'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '../../../components/AdminHeader';
import { IconLoader, IconAlert, IconLock } from '../../../components/icons';
import { supabase } from '../../../lib/supabaseClient';

export default function HalamanAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [memproses, setMemproses] = useState(false);
  const [error, setError] = useState('');
  const [cekSesi, setCekSesi] = useState(true);

  // Kalau sudah login, langsung lempar ke dasbor — tidak perlu isi form lagi.
  useEffect(() => {
    let aktif = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!aktif) return;
      if (data.session) {
        router.replace('/admin');
      } else {
        setCekSesi(false);
      }
    });
    return () => {
      aktif = false;
    };
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMemproses(true);

    const { error: errLogin } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setMemproses(false);

    if (errLogin) {
      setError('Email atau kata sandi salah.');
      return;
    }

    router.replace('/admin');
  };

  if (cekSesi) {
    return (
      <main className="admin-cek-sesi">
        <IconLoader size={20} />
        Memeriksa sesi…
      </main>
    );
  }

  return (
    <>
      <AdminHeader subtitle="Masuk untuk mengakses dasbor admin" showLogout={false} />

      <main className="halaman-admin-login">
        <form className="form-admin-login" onSubmit={handleLogin}>
          <div className="form-admin-login-icon">
            <IconLock size={26} />
          </div>
          <h2>Login Admin</h2>

          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="admin@contoh.com"
            />
          </label>

          <label>
            Kata sandi
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="pesan-status pesan-status-error">
              <IconAlert size={16} /> {error}
            </p>
          )}

          <button type="submit" className="tombol-kirim" disabled={memproses}>
            {memproses ? <IconLoader size={16} /> : <IconLock size={16} />}
            {memproses ? 'Memeriksa…' : 'Masuk'}
          </button>

          <Link href="/" className="link-kembali-landing">
            ← Kembali ke halaman utama
          </Link>
        </form>
      </main>
    </>
  );
}
