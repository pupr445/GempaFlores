'use client';

import AppHeader from '../../components/AppHeader';
import RiwayatLaporan from '../../components/RiwayatLaporan';

/**
 * Halaman ini murni untuk MEMBACA data — tidak ada tombol edit atau hapus
 * sama sekali di UI, dan Supabase (lewat RLS di supabase-schema.sql) memang
 * sengaja tidak diberi izin UPDATE/DELETE untuk kunci publik, jadi data
 * yang sudah masuk tidak bisa diubah siapa pun lewat aplikasi ini.
 */
export default function HalamanRiwayat() {
  return (
    <>
      <AppHeader subtitle="Arsip laporan lapangan yang sudah tercatat" />

      <main className="halaman-riwayat">
        <RiwayatLaporan />
      </main>
    </>
  );
}
