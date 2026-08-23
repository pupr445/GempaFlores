-- Jalankan di Supabase Dashboard -> SQL Editor.
-- Aman dijalankan berkali-kali (pakai IF NOT EXISTS).
--
-- Menandai laporan dari jalur "Tim Survey" (kode akses) supaya bisa
-- dibedakan dari laporan masyarakat umum. Default 'publik' supaya
-- baris-baris lama yang sudah ada otomatis dianggap dari masyarakat.

alter table laporan add column if not exists sumber text default 'publik';

create index if not exists idx_laporan_sumber on laporan(sumber);
