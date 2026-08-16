'use client';

/**
 * Menampilkan daftar foto yang sudah diambil/diunggah (sudah ber-watermark),
 * dengan tombol hapus per foto. Jumlah foto tidak dibatasi.
 */
export default function PhotoPreview({ photos, onRemove }) {
  if (!photos.length) {
    return <p className="photo-preview-empty">Belum ada foto.</p>;
  }

  return (
    <div className="photo-preview-grid">
      {photos.map((photo, index) => (
        <div key={photo.id} className="photo-preview-item">
          <img src={photo.previewUrl} alt={`Foto ${index + 1}`} />
          <button type="button" onClick={() => onRemove(photo.id)}>
            Hapus
          </button>
        </div>
      ))}
    </div>
  );
}
