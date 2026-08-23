-- Jalankan di Supabase Dashboard -> SQL Editor.
-- Aman dijalankan berkali-kali (pakai IF NOT EXISTS).
-- Menambah kolom Kategori Bangunan Gedung — muncul di form Lapor
-- Masyarakat saat Jenis Infrastruktur "Cipta Karya" dan Sub Jenis
-- "Bangunan Gedung/Fasilitas Umum" dipilih.

alter table laporan add column if not exists kategori_bangunan_gedung text;
