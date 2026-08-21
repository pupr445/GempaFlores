-- Jalankan di Supabase Dashboard -> SQL Editor.
-- Aman dijalankan berkali-kali (pakai IF NOT EXISTS).

alter table laporan add column if not exists jenis_infrastruktur text;
alter table laporan add column if not exists sub_jenis_infrastruktur text;
alter table laporan add column if not exists nama_ruas_jalan text;

create index if not exists idx_laporan_jenis_infrastruktur on laporan(jenis_infrastruktur);
