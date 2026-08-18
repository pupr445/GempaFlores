'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconClipboard, IconHistory } from './icons';

export default function NavTabs() {
  const pathname = usePathname();
  const isRiwayat = pathname?.includes('/riwayat');

  return (
    <nav className="nav-tabs">
      <Link href="/lapor" className={`nav-tab ${!isRiwayat ? 'nav-tab-active' : ''}`}>
        <IconClipboard size={16} />
        Buat Laporan
      </Link>
      <Link
        href="/riwayat"
        className={`nav-tab ${isRiwayat ? 'nav-tab-active' : ''}`}
      >
        <IconHistory size={16} />
        Riwayat Laporan
      </Link>
    </nav>
  );
}
