'use client';

import { URUTAN_KERUSAKAN, LABEL_TIDAK_ADA_DATA, WARNA_KERUSAKAN } from '../lib/statistikLaporan';

const SEMUA_KATEGORI = [...URUTAN_KERUSAKAN, LABEL_TIDAK_ADA_DATA];

/**
 * Legenda warna tingkat kerusakan — dipakai bareng di atas peta & grafik
 * supaya warnanya konsisten dan tidak perlu diulang-ulang tiap komponen.
 */
export function LegendaKerusakan() {
  return (
    <div className="legenda-kerusakan">
      {SEMUA_KATEGORI.map((k) => (
        <span key={k} className="legenda-kerusakan-item">
          <span className="legenda-kerusakan-dot" style={{ background: WARNA_KERUSAKAN[k] }} />
          {k}
        </span>
      ))}
    </div>
  );
}

/**
 * Satu baris grafik batang bertumpuk (stacked horizontal bar) — dipakai
 * untuk ringkasan total maupun tiap baris per kabupaten/kecamatan.
 * `data` = { 'Rusak Aman': n, 'Rusak Ringan': n, ..., total }
 */
export function BarisGrafikKerusakan({ label, data, totalMaksimum }) {
  const total = data.total ?? SEMUA_KATEGORI.reduce((acc, k) => acc + (data[k] || 0), 0);
  const lebarBar = totalMaksimum > 0 ? Math.max((total / totalMaksimum) * 100, total > 0 ? 2 : 0) : 0;

  return (
    <div className="baris-grafik-kerusakan">
      <div className="baris-grafik-kerusakan-label">
        <span>{label}</span>
        <span className="baris-grafik-kerusakan-total">{total.toLocaleString('id-ID')}</span>
      </div>
      <div className="baris-grafik-kerusakan-track">
        <div className="baris-grafik-kerusakan-bar" style={{ width: `${lebarBar}%` }}>
          {SEMUA_KATEGORI.map((k) =>
            data[k] > 0 ? (
              <span
                key={k}
                className="baris-grafik-kerusakan-segmen"
                style={{
                  width: `${(data[k] / total) * 100}%`,
                  background: WARNA_KERUSAKAN[k],
                }}
                title={`${k}: ${data[k].toLocaleString('id-ID')}`}
              />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Kartu grafik lengkap: judul + daftar baris grafik kerusakan, diurutkan
 * dari total terbesar (data sudah diurutkan oleh fungsi hitung* di
 * statistikLaporan.js). `rows` = [{ label, ...dataKerusakan }]
 */
export default function GrafikKerusakan({ judul, rows, labelKosong, batasBaris }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="kartu-grafik-kerusakan">
        {judul && <h3 className="kartu-grafik-kerusakan-judul">{judul}</h3>}
        <p className="kartu-grafik-kerusakan-kosong">{labelKosong || 'Belum ada data.'}</p>
      </div>
    );
  }

  const totalMaksimum = Math.max(...rows.map((r) => r.total ?? 0));
  const ditampilkan = batasBaris ? rows.slice(0, batasBaris) : rows;

  return (
    <div className="kartu-grafik-kerusakan">
      {judul && <h3 className="kartu-grafik-kerusakan-judul">{judul}</h3>}
      <div className="kartu-grafik-kerusakan-daftar">
        {ditampilkan.map((r) => (
          <BarisGrafikKerusakan key={r.label} label={r.label} data={r} totalMaksimum={totalMaksimum} />
        ))}
      </div>
      {batasBaris && rows.length > batasBaris && (
        <p className="kartu-grafik-kerusakan-lainnya">
          +{rows.length - batasBaris} wilayah lain dengan laporan lebih sedikit
        </p>
      )}
    </div>
  );
}
