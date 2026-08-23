// Data referensi untuk kategori "Jenis Infrastruktur" pada form laporan
// dan filter di halaman Riwayat.

export const OPSI_LAINNYA_RUAS = 'Ruas lain (ketik manual)';

export const DAFTAR_JENIS_INFRASTRUKTUR = [
  'Jalan dan Jembatan',
  'Sumber Daya Air',
  'Cipta Karya',
  'Perumahan dan Permukiman',
];

export const DAFTAR_SUB_JALAN_JEMBATAN = [
  'Jalan',
  'Jembatan',
  'Gorong-gorong',
  'Drainase',
  'Talud/Dinding Penahan Jalan',
];

// Sub-jenis per kategori infrastruktur. Setiap jenis infrastruktur punya
// daftar sub-jenisnya sendiri, ditampilkan sebagai dropdown kedua setelah
// jenis infrastruktur dipilih.
export const SUB_JENIS_DAERAH_IRIGASI = 'Daerah Irigasi (D.I.)';

export const SUB_JENIS_INFRASTRUKTUR = {
  'Jalan dan Jembatan': DAFTAR_SUB_JALAN_JEMBATAN,
  'Sumber Daya Air': [
    'Bendungan',
    'Embung',
    'Saluran Irigasi',
    SUB_JENIS_DAERAH_IRIGASI,
    'Bangunan/Sarana Pengendali Banjir',
    'Infrastruktur Air Baku',
  ],
  'Cipta Karya': [
    'Sistem Penyediaan Air Minum (SPAM)',
    'Sanitasi',
    'Drainase Permukiman',
    'Bangunan Gedung/Fasilitas Umum',
    'Infrastruktur Persampahan',
  ],
  'Perumahan dan Permukiman': [
    'Rumah/Perumahan',
    'Prasarana, Sarana dan Utilitas (PSU) Permukiman',
    'Infrastruktur Kawasan Permukiman',
  ],
};

export function subJenisUntuk(jenisInfrastruktur) {
  return SUB_JENIS_INFRASTRUKTUR[jenisInfrastruktur] || [];
}

// PENTING: daftar ruas jalan di bawah ini baru mencakup Kabupaten
// Manggarai Barat s.d. Lembata (berdasarkan dokumen "Total Panjang Jalan
// Provinsi" yang tersedia saat file ini dibuat). Kabupaten/kota lain di
// NTT (mis. Kupang, TTS, TTU, Belu, Malaka, Alor, Rote Ndao, Sabu Raijua,
// dan Sumba) BELUM tercantum karena datanya belum diberikan — tinggal
// tambahkan blok baru di array ini begitu datanya tersedia. Pelapor tetap
// bisa memilih "Ruas lain (ketik manual)" untuk ruas yang belum terdaftar.
export const DAFTAR_RUAS_JALAN = [
  {
    kabupaten: 'Manggarai Barat',
    ruas: [
      'Sp. Nggorang - Sp. Terang',
      'Sp. Terang - Sp. Noa',
      'Sp. Noa - Wontong (Bts. Kab. Manggarai)',
      'Sp. Noa - Golowelu (Bts. Kab. Manggarai)',
    ],
  },
  {
    kabupaten: 'Manggarai',
    ruas: [
      'Nggalak (Bts. Kab. Manggarai Barat) - Kedindi',
      'Reo - Wae Gongger (Bts. Kab. Manggarai Timur)',
      'Sp. Cumbi – Iteng',
    ],
  },
  {
    kabupaten: 'Manggarai Timur',
    ruas: [
      'Wae Gongger (Bts. Kab. Manggarai) - Pota',
      'Pota - Labuan Kelambu (Bts. Kab. Ngada)',
      'Bealaing - Wae Rasan (Bts. Kab. Ngada)',
      'Borong - Nceang',
      'Sp. Dangka Mangkang - Dampek',
    ],
  },
  {
    kabupaten: 'Ngada',
    ruas: [
      'Mbazang (Bts. Kab. Manggarai Timur) - Sp. Waepana',
      'Malanuza - Maumbawa (Bts. Kab. Nagekeo)',
      'Labuan Kelambu (Bts. Kab. Manggarai Timur) – Riung',
      'Riung – Poma',
      'Poma – Bajawa',
      'Riung - Lengkosambi (Bts. Kab. Nagekeo)',
    ],
  },
  {
    kabupaten: 'Nagekeo',
    ruas: [
      'Nggolonio (Bts. Kab. Ngada) - Danga',
      'Marapokot – Aeramo',
      'Aeramo - Kaburea (Bts. Kab. Ende)',
      'Maumbawa (Bts. Kab. Ngada) - Sp. Gako',
    ],
  },
  {
    kabupaten: 'Ende',
    ruas: [
      'Kaburea (Bts. Kab. Nagekeo) - Ranakolo',
      'Detusoko – Maurole',
      'Maurole - Koro (Bts. Kab. Sikka)',
      'Wologai – Detukeli',
      'Ende – Nuabosi',
    ],
  },
  {
    kabupaten: 'Sikka',
    ruas: [
      'Koro (Bts. Kab. Ende) - Maumere',
      'Hepang – Sikka',
      'Waepare – Bola',
      'Napungmali - Mudajebak (Bts. Kab. Flores Timur)',
    ],
  },
  {
    kabupaten: 'Flores Timur',
    ruas: [
      'Mudajebak (Bts. Kab. Sikka) - Wairunu',
      'Larantuka – Watowiti',
      'Watowiti – Waiklibang',
      'Wailebe – Waiwerang',
      'Waiwerang - Sp. Withiama',
      'Sp. Kolilanang – Sagu',
      'Ritaebang – Lamakera',
    ],
  },
  {
    kabupaten: 'Lembata',
    ruas: ['Balauring – Wairiang', 'Waijarang – Wulandoni'],
  },
];

export function ruasUntukKabupaten(kabupaten) {
  return DAFTAR_RUAS_JALAN.find((k) => k.kabupaten === kabupaten)?.ruas || [];
}

// Daftar Daerah Irigasi (D.I.) yang terdampak bencana, per kabupaten —
// sumber: dokumen "D.I TERDAMPAK BENCANA". Ditampilkan sebagai dropdown
// tambahan begitu jenis infrastruktur "Sumber Daya Air" dipilih.
export const OPSI_LAINNYA_DI = 'D.I. lain (ketik manual)';

export const DAFTAR_DAERAH_IRIGASI = [
  { kabupaten: 'Sikka', daftar: ['D.I. Kolesia'] },
  { kabupaten: 'Nagekeo', daftar: ['D.I. Malawitu'] },
  {
    kabupaten: 'Ngada',
    daftar: ['D.I. Ganggong', 'D.I. Luwurweton', 'D.I. Malatawa', 'D.I. Nuakua'],
  },
  {
    kabupaten: 'Manggarai Timur',
    daftar: ['D.I. Wae Mokel I,II', 'D.I. Waerana'],
  },
  {
    kabupaten: 'Manggarai',
    daftar: ['D.I. Cancar', 'D.I. Golowoi', 'D.I. Satar Lenda', 'D.I. Wae Ces 1-4'],
  },
  {
    kabupaten: 'Manggarai Barat',
    daftar: ['D.I. Wae Ganggang', 'D.I. Wae Paku', 'D.I. Wae Tiwo Lawo', 'D.I. Wae Racang'],
  },
];

// Tingkat/jenis kerusakan — dipakai untuk kategori Cipta Karya setelah
// sub jenis infrastrukturnya dipilih.
export const DAFTAR_TINGKAT_KERUSAKAN = ['Rusak Ringan', 'Rusak Sedang', 'Rusak Berat'];

// Kategori Bangunan Gedung — muncul begitu jenis infrastruktur "Cipta
// Karya" dipilih dan sub jenisnya "Bangunan Gedung/Fasilitas Umum".
export const SUB_JENIS_BANGUNAN_GEDUNG = 'Bangunan Gedung/Fasilitas Umum';

export const DAFTAR_KATEGORI_BANGUNAN_GEDUNG = [
  { kategori: 'Keagamaan', contoh: 'masjid, gereja, pura, dll' },
  { kategori: 'Perkantoran', contoh: 'kantor termasuk juga rumah negara' },
  { kategori: 'Perdagangan', contoh: 'warung, toko, pasar dan mal' },
  { kategori: 'Perindustrian', contoh: 'pabrik, laboratorium dan perbengkelan' },
  { kategori: 'Perhotelan', contoh: 'wisma, losmen, hostel, motel, rumah kos, dan hotel' },
  { kategori: 'Terminal', contoh: 'terminal angkutan darat, bandara dan pelabuhan laut' },
  { kategori: 'Pendidikan', contoh: 'SD/SMP/SMA/PT, dll' },
  { kategori: 'Kebudayaan', contoh: 'museum, gedung pameran dan gedung kesenian' },
  { kategori: 'Kesehatan', contoh: 'puskesmas, klinik, rumah sakit, tempat praktik dan laboratorium' },
];

// Data Rumah/Pemilik — muncul begitu jenis infrastruktur "Perumahan dan
// Permukiman" dipilih dan sub jenisnya "Rumah/Perumahan".
export const SUB_JENIS_RUMAH = 'Rumah/Perumahan';

export const DAFTAR_KELOMPOK_RENTAN = ['Balita', 'Lansia', 'Ibu Hamil', 'Disabilitas'];

export const DAFTAR_STATUS_RUMAH = [
  'Milik Sendiri',
  'Sewa/Kontrak',
  'Menumpang',
  'Rumah Dinas',
  'Lainnya',
];

export const DAFTAR_KONDISI_RUMAH = ['Rusak Aman', 'Rusak Ringan', 'Rusak Sedang', 'Rusak Berat'];

export const DAFTAR_KONDISI_SANITASI = [
  'Baik',
  'Rusak Ringan',
  'Rusak Sedang',
  'Rusak Berat',
  'Tidak Ada Sanitasi',
];
