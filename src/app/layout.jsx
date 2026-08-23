import './globals.css';
import PwaSetup from '../components/PwaSetup';

const BASE_PATH = process.env.NODE_ENV === 'production' ? '/GempaFlores' : '';

export const metadata = {
  title: 'Lapor PUPR NTT — Lapor Dampak Gempa',
  description: 'Form laporan dampak gempa di Flores, dengan foto ber-watermark lokasi & waktu. Bisa dipakai offline.',
  manifest: `${BASE_PATH}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lapor PUPR NTT',
  },
  icons: {
    icon: `${BASE_PATH}/icon-192.png`,
    apple: `${BASE_PATH}/apple-touch-icon.png`,
  },
};

export const viewport = {
  themeColor: '#1b4b66',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <PwaSetup />
        {children}
      </body>
    </html>
  );
}
