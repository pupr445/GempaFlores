'use client';

import { useRef } from 'react';
import { IconVideo } from './icons';

/**
 * Tombol untuk merekam video langsung dari kamera perangkat.
 * Sama seperti CameraCapture — input di-reset tiap kali supaya kamera
 * bisa dibuka lagi untuk rekaman berikutnya (tidak ada batas jumlah).
 */
export default function VideoCapture({ onCapture, disabled }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
    e.target.value = '';
  };

  return (
    <div className="video-capture">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
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
        <IconVideo />
        Rekam Video
      </button>
    </div>
  );
}
