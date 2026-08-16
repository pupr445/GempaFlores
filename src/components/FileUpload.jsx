'use client';

import { useRef } from 'react';

/**
 * Tombol untuk mengunggah satu atau beberapa foto dari galeri/penyimpanan.
 */
export default function FileUpload({ onUpload, disabled }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => onUpload(file));
    e.target.value = '';
  };

  return (
    <div className="file-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        🖼️ Unggah Foto
      </button>
    </div>
  );
}
