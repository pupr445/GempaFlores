'use client';

import { IconTrash } from './icons';

/**
 * Menampilkan daftar video yang sudah diambil/diunggah, dengan tombol
 * hapus per video. Jumlah video tidak dibatasi (tiap file tetap harus
 * lolos validasi ukuran & durasi di page.jsx sebelum masuk daftar ini).
 */
export default function VideoPreview({ videos, onRemove }) {
  if (!videos.length) {
    return <p className="photo-preview-empty">Belum ada video ditambahkan.</p>;
  }

  return (
    <div className="video-preview-grid">
      {videos.map((video, index) => (
        <div key={video.id} className="video-preview-item">
          <video src={video.previewUrl} controls playsInline />
          <button
            type="button"
            className="photo-preview-hapus"
            onClick={() => onRemove(video.id)}
            aria-label={`Hapus video ${index + 1}`}
          >
            <IconTrash />
          </button>
        </div>
      ))}
    </div>
  );
}
