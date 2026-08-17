// Harus sinkron dengan basePath di next.config.js — dipakai untuk
// menyusun path aset publik (logo, dll) secara manual karena <img> biasa
// tidak otomatis mendapat prefix basePath seperti next/image.
export const BASE_PATH = process.env.NODE_ENV === 'production' ? '/GempaFlores' : '';

export function asetPublik(path) {
  return `${BASE_PATH}${path}`;
}
