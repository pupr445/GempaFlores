import './globals.css';

export const metadata = {
  title: 'GempaFlores — Lapor Dampak Gempa',
  description: 'Form laporan dampak gempa di Flores, dengan foto ber-watermark lokasi & waktu.',
};

export const viewport = {
  themeColor: '#1b4b66',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
