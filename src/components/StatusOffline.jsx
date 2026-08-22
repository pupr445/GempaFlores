'use client';

import { useEffect, useState } from 'react';
import { hitungAntrian } from '../lib/offlineQueue';
import { dengarkanPerubahanAntrian, prosesAntrian } from '../lib/offlineSync';
import { IconWifiOff, IconLoader } from './icons';

export default function StatusOffline() {
  const [online, setOnline] = useState(true);
  const [jumlahAntrian, setJumlahAntrian] = useState(0);

  useEffect(() => {
    setOnline(navigator.onLine);
    const perbaruiAntrian = () => hitungAntrian().then(setJumlahAntrian);
    perbaruiAntrian();

    const onOnline = () => {
      setOnline(true);
      prosesAntrian();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const lepasListener = dengarkanPerubahanAntrian(perbaruiAntrian);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      lepasListener();
    };
  }, []);

  if (online && jumlahAntrian === 0) return null;

  return (
    <div className={`status-offline-banner ${!online ? 'status-offline-banner-merah' : ''}`}>
      {!online && (
        <span>
          <IconWifiOff size={14} /> Tidak ada sinyal — laporan baru akan disimpan di HP dulu.
        </span>
      )}
      {jumlahAntrian > 0 && (
        <span>
          {online ? <IconLoader size={14} /> : null}{' '}
          {jumlahAntrian} laporan menunggu dikirim{online ? ', sedang dicoba…' : '.'}
        </span>
      )}
    </div>
  );
}
