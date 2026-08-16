import './globals.css';

export const metadata = {
  title: 'Form Laporan',
  description: 'Form laporan dengan foto ber-koordinat',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
