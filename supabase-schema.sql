-- Jalankan script ini di Supabase SQL Editor

create table if not exists laporan (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  deskripsi text,
  kabupaten_kota text,
  kecamatan text,
  desa_kelurahan text,
  latitude double precision,
  longitude double precision
);

create table if not exists foto_laporan (
  id uuid primary key default gen_random_uuid(),
  laporan_id uuid references laporan(id) on delete cascade,
  url text not null,
  created_at timestamptz default now()
);

-- Aktifkan Row Level Security
alter table laporan enable row level security;
alter table foto_laporan enable row level security;

-- Karena tidak ada login/data pelapor, izinkan publik untuk insert
create policy "publik boleh insert laporan"
  on laporan for insert
  with check (true);

create policy "publik boleh insert foto"
  on foto_laporan for insert
  with check (true);

-- (Opsional) izinkan publik membaca laporan, misal untuk halaman riwayat
-- create policy "publik boleh baca laporan" on laporan for select using (true);
-- create policy "publik boleh baca foto" on foto_laporan for select using (true);

-- Setelah menjalankan script ini, buat Storage bucket bernama "foto-laporan"
-- lewat Supabase Dashboard > Storage > New bucket, set sebagai Public bucket.
