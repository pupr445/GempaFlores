'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { IconLoader } from './icons';

/**
 * Karena aplikasi ini situs statis (output: export, di-hosting di GitHub
 * Pages), TIDAK ada server yang bisa menolak permintaan sebelum halaman
 * terkirim — proteksi di sini murni cek sesi Supabase Auth di sisi
 * browser, lalu redirect kalau belum login. Ini cukup untuk tujuannya:
 * mengontrol siapa yang bisa memakai fitur Export, BUKAN untuk
 * menyembunyikan data laporan (data laporan memang sudah publik lewat
 * halaman Riwayat).
 */
export default function AdminGuard({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState('checking'); // checking | ok

  useEffect(() => {
    let aktif = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!aktif) return;
      if (!data.session) {
        router.replace('/admin/login');
      } else {
        setStatus('ok');
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/admin/login');
      }
    });

    return () => {
      aktif = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (status === 'checking') {
    return (
      <main className="admin-cek-sesi">
        <IconLoader size={20} />
        Memeriksa sesi admin…
      </main>
    );
  }

  return children;
}
