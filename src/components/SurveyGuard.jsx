'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { timSurveyTerverifikasi } from '../lib/aksesSurvey';
import { IconLoader } from './icons';

export default function SurveyGuard({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState('checking'); // checking | ok

  useEffect(() => {
    if (timSurveyTerverifikasi()) {
      setStatus('ok');
    } else {
      router.replace('/survey/login');
    }
  }, [router]);

  if (status === 'checking') {
    return (
      <main className="admin-cek-sesi">
        <IconLoader size={20} />
        Memeriksa akses…
      </main>
    );
  }

  return children;
}
