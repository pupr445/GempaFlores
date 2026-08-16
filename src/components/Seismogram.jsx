'use client';

/**
 * Elemen visual khas aplikasi: garis menyerupai rekaman seismograf.
 * Dipakai sebagai pembatas di bawah header dan sebagai penanda "terverifikasi"
 * pada tiap kartu laporan — bukan dekorasi kosong, tapi merujuk langsung ke
 * konteks aplikasi (pelaporan gempa).
 */
export default function Seismogram({ className = '', height = 28 }) {
  return (
    <svg
      className={`seismogram ${className}`}
      viewBox="0 0 400 40"
      height={height}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline
        points="0,20 30,20 40,20 48,6 56,34 64,12 72,28 80,20 120,20 130,20 138,4 146,36 154,10 162,30 170,20 220,20 400,20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
