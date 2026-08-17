/**
 * Data wilayah administratif Pulau Flores (kabupaten & kecamatan),
 * disusun dari data BPS/Wikipedia untuk kebutuhan pengisian manual
 * lokasi laporan. Desa/kelurahan sengaja TIDAK didaftar penuh di sini
 * (jumlahnya ribuan dan rawan berubah) — kolom itu diisi bebas oleh
 * pelapor lewat teks.
 *
 * Jika ada kecamatan yang sudah dimekarkan/berubah nama dan belum
 * tercantum, pelapor tetap bisa memilih "Kecamatan lainnya" lalu
 * mengetik nama kecamatan secara manual.
 */
export const WILAYAH_FLORES = [
  {
    kabupaten: 'Manggarai Barat',
    kecamatan: [
      'Boleng', 'Kuwus', 'Kuwus Barat', 'Komodo', 'Lembor',
      'Lembor Selatan', 'Macang Pacar', 'Mbeliling', 'Ndoso',
      'Pacar', 'Sano Nggoang', 'Welak',
    ],
  },
  {
    kabupaten: 'Manggarai',
    kecamatan: [
      'Cibal', 'Cibal Barat', 'Langke Rembong', 'Lelak', 'Rahong Utara',
      'Reok', 'Reok Barat', 'Ruteng', 'Satar Mese', 'Satar Mese Barat',
      'Satar Mese Utara', 'Wae Rii',
    ],
  },
  {
    kabupaten: 'Manggarai Timur',
    kecamatan: [
      'Borong', 'Elar', 'Elar Selatan', 'Kota Komba', 'Lamba Leda',
      'Poco Ranaka', 'Poco Ranaka Timur', 'Rana Mese', 'Sambi Rampas',
    ],
  },
  {
    kabupaten: 'Ngada',
    kecamatan: [
      'Aimere', 'Bajawa', 'Bajawa Utara', 'Golewa', 'Golewa Barat',
      'Golewa Selatan', 'Inerie', 'Jerebuu', 'Riung', 'Riung Barat',
      'Soa', 'Wolomeze',
    ],
  },
  {
    kabupaten: 'Nagekeo',
    kecamatan: [
      'Aesesa', 'Aesesa Selatan', 'Boawae', 'Keo Tengah', 'Mauponggo',
      'Nangaroro', 'Wolowae',
    ],
  },
  {
    kabupaten: 'Ende',
    kecamatan: [
      'Detukeli', 'Detusoko', 'Ende', 'Ende Selatan', 'Ende Tengah',
      'Ende Timur', 'Ende Utara', 'Kelimutu', 'Kota Baru',
      'Lepembusu Kelisoke', 'Lio Timur', 'Maukaro', 'Maurole',
      'Nangapanda', 'Ndona', 'Ndona Timur', 'Ndori', 'Pulau Ende',
      'Wewaria', 'Wolojita', 'Wolowaru',
    ],
  },
  {
    kabupaten: 'Sikka',
    kecamatan: [
      'Alok', 'Alok Barat', 'Alok Timur', 'Bola', 'Doreng',
      'Hewokloang', 'Kangae', 'Kewapante', 'Koting', 'Lela',
      'Magepanda', 'Mapitara', 'Mego', 'Nelle', 'Nita', 'Paga',
      'Palue', 'Talibura', 'Tanawawo', 'Waiblama', 'Waigete',
    ],
  },
  {
    kabupaten: 'Flores Timur',
    kecamatan: [
      'Adonara', 'Adonara Barat', 'Adonara Tengah', 'Adonara Timur',
      'Demon Pagong', 'Ile Boleng', 'Ile Bura', 'Ile Mandiri',
      'Kelubagolit', 'Larantuka', 'Lewolema', 'Solor Barat',
      'Solor Selatan', 'Solor Timur', 'Tanjung Bunga', 'Titehena',
      'Witihama', 'Wotan Ulu Mado', 'Wulanggitang',
    ],
  },
];

export const DAFTAR_KABUPATEN = WILAYAH_FLORES.map((w) => w.kabupaten);

export function kecamatanUntuk(kabupaten) {
  return WILAYAH_FLORES.find((w) => w.kabupaten === kabupaten)?.kecamatan || [];
}
