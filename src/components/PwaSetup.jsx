'use client';

import { useEffect } from 'react';
import { pasangSinkronOtomatis } from '../lib/offlineSync';
import { BASE_PATH } from '../lib/basePath';

export default function PwaSetup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(`${BASE_PATH}/sw.js`)
        .catch((err) => console.warn('Gagal mendaftarkan service worker:', err));
    }
    pasangSinkronOtomatis();
  }, []);

  return null;
}
