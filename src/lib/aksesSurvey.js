// "Login" tim survey cuma satu kode akses yang sama untuk semua anggota
// (bukan otentikasi sungguhan — lihat catatan di halaman /survey/login).
// Kode dicek di sisi klien karena aplikasi ini full static (GitHub Pages,
// tidak ada server sendiri).

export const KODE_AKSES_SURVEY = 'surveypupr26';

const KUNCI_PENYIMPANAN = 'gempaflores:tim-survey-terverifikasi';

export function timSurveyTerverifikasi() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(KUNCI_PENYIMPANAN) === 'true';
}

export function verifikasiKodeSurvey(kode) {
  const cocok = kode.trim() === KODE_AKSES_SURVEY;
  if (cocok && typeof window !== 'undefined') {
    window.localStorage.setItem(KUNCI_PENYIMPANAN, 'true');
  }
  return cocok;
}

export function keluarDariModeSurvey() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(KUNCI_PENYIMPANAN);
  }
}
