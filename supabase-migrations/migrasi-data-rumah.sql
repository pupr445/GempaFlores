-- Jalankan di Supabase Dashboard -> SQL Editor.
-- Aman dijalankan berkali-kali (pakai IF NOT EXISTS).
-- Menambah kolom Data Rumah/Pemilik — muncul di form Lapor Masyarakat
-- saat Jenis Infrastruktur "Perumahan dan Permukiman" dan Sub Jenis
-- "Rumah/Perumahan" dipilih.

alter table laporan add column if not exists nama_kepala_keluarga text;
alter table laporan add column if not exists jumlah_kk integer;
alter table laporan add column if not exists kelompok_rentan text;
alter table laporan add column if not exists jumlah_penghuni integer;
alter table laporan add column if not exists status_rumah text;
alter table laporan add column if not exists kondisi_rumah text;
alter table laporan add column if not exists kondisi_sanitasi text;
