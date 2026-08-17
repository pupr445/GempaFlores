'use client';

import { useRef } from 'react';
import { IconCamera } from './icons';

/**
 * Tombol untuk mengambil foto langsung dari kamera perangkat.
 * Setiap kali dipicu, membuka kamera lagi — TIDAK ada batas jumlah jepretan,
 * karena input di-reset setelah tiap pengambilan lalu foto ditambahkan
 * ke daftar (bukan menggantikan) oleh parent (page.jsx).
 */
export default function CameraCapture({ onCapture, disabled }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
    // reset value supaya kamera bisa dibuka lagi untuk jepretan berikutnya
    e.target.value = '';
  };

  return (
    <div className="camera-capture">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        className="btn-foto"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <IconCamera />
        Ambil Foto
      </button>
    </div>
  );
}
