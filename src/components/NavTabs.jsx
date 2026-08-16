'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavTabs() {
  const pathname = usePathname();
  const isRiwayat = pathname?.includes('/riwayat');

  return (
    <nav className="nav-tabs">
      <Link href="/" className={`nav-tab ${!isRiwayat ? 'nav-tab-active' : ''}`}>
        Buat Laporan
      </Link>
      <Link
        href="/riwayat"
        className={`nav-tab ${isRiwayat ? 'nav-tab-active' : ''}`}
      >
        Riwayat Laporan
      </Link>
    </nav>
  );
}
