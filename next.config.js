/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export: menghasilkan file HTML/JS statis di folder "out",
  // sehingga bisa di-hosting langsung di GitHub Pages tanpa server tambahan.
  output: 'export',
  images: { unoptimized: true },
  // Ganti '/laporan-app' sesuai nama repo GitHub kamu.
  basePath: process.env.NODE_ENV === 'production' ? '/GempaFlores' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/GempaFlores/' : '',
};

module.exports = nextConfig;
