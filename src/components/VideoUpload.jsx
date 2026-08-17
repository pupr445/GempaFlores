'use client';

import { useRef } from 'react';
import { IconUpload } from './icons';

/**
 * Tombol untuk mengunggah satu atau beberapa video dari galeri/penyimpanan.
 */
export default function VideoUpload({ onUpload, disabled }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => onUpload(file));
    e.target.value = '';
  };

  return (
    <div className="video-upload">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        className="btn-foto btn-foto-secondary"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <IconUpload />
        Unggah Video
      </button>
    </div>
  );
}
