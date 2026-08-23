-- Jalankan di Supabase Dashboard -> SQL Editor.
-- Aman dijalankan berkali-kali (pakai IF NOT EXISTS).
-- Menambah kolom untuk Daerah Irigasi (D.I.) — Sumber Daya Air — dan
-- tingkat kerusakan — Cipta Karya.

alter table laporan add column if not exists daerah_irigasi text;
alter table laporan add column if not exists tingkat_kerusakan text;

create index if not exists idx_laporan_tingkat_kerusakan on laporan(tingkat_kerusakan);
