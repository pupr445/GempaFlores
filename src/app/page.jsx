'use client';

import { useState, useCallback } from 'react';
import CameraCapture from '../components/CameraCapture';
import FileUpload from '../components/FileUpload';
import PhotoPreview from '../components/PhotoPreview';
import LocationTagger from '../components/LocationTagger';
import { tambahWatermark } from '../lib/watermark';
import { supabase } from '../lib/supabaseClient';

let idCounter = 0;
const buatId = () => `foto-${Date.now()}-${idCounter++}`;

export default function HalamanLaporan() {
  const [lokasi, setLokasi] = useState(null);
  const [deskripsi, setDeskripsi] = useState('');
  const [photos, setPhotos] = useState([]); // { id, blob, previewUrl }
  const [memproses, setMemproses] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  const [pesanStatus, setPesanStatus] = useState('');

  const handleLocationReady = useCallback((data) => {
    setLokasi(data);
  }, []);

  const prosesFotoBaru = async (file) => {
    if (!lokasi) {
      setPesanStatus(
        'Tunggu lokasi selesai diambil sebelum menambahkan foto.'
      );
      return;
    }
    setMemproses(true);
    try {
      const blobBerwatermark = await tambahWatermark(file, lokasi);
      const previewUrl = URL.createObjectURL(blobBerwatermark);
      setPhotos((prev) => [
        ...prev,
        { id: buatId(), blob: blobBerwatermark, previewUrl },
      ]);
    } catch (err) {
      console.error(err);
      setPesanStatus('Gagal memproses foto. Coba lagi.');
    } finally {
      setMemproses(false);
    }
  };

  const hapusFoto = (id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const kirimLaporan = async (e) => {
    e.preventDefault();
    if (!lokasi) {
      setPesanStatus('Lokasi belum tersedia.');
      return;
    }
    if (photos.length === 0) {
      setPesanStatus('Tambahkan minimal satu foto.');
      return;
    }

    setMengirim(true);
    setPesanStatus('Mengirim laporan…');

    try {
      // 1. Simpan data laporan (tanpa data pelapor)
      const { data: laporan, error: errLaporan } = await supabase
        .from('laporan')
        .insert({
          deskripsi,
          kabupaten_kota: lokasi.kabupatenKota,
          kecamatan: lokasi.kecamatan,
          desa_kelurahan: lokasi.desaKelurahan,
          latitude: lokasi.lat,
          longitude: lokasi.lng,
        })
        .select()
        .single();

      if (errLaporan) throw errLaporan;

      // 2. Upload tiap foto ke Supabase Storage, lalu simpan URL-nya
      for (const foto of photos) {
        const namaFile = `${laporan.id}/${buatId()}.jpg`;
        const { error: errUpload } = await supabase.storage
          .from('foto-laporan')
          .upload(namaFile, foto.blob, { contentType: 'image/jpeg' });

        if (errUpload) throw errUpload;

        const { data: publicUrlData } = supabase.storage
          .from('foto-laporan')
          .getPublicUrl(namaFile);

        const { error: errInsertFoto } = await supabase
          .from('foto_laporan')
          .insert({
            laporan_id: laporan.id,
            url: publicUrlData.publicUrl,
          });

        if (errInsertFoto) throw errInsertFoto;
      }

      setPesanStatus('Laporan berhasil dikirim. Terima kasih.');
      setDeskripsi('');
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPhotos([]);
    } catch (err) {
      console.error(err);
      setPesanStatus('Terjadi kesalahan saat mengirim laporan. Coba lagi.');
    } finally {
      setMengirim(false);
    }
  };

  return (
    <main className="halaman-laporan">
      <h1>Form Laporan</h1>

      <section>
        <h2>Lokasi</h2>
        <LocationTagger onLocationReady={handleLocationReady} />
      </section>

      <section>
        <h2>Deskripsi</h2>
        <textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Tuliskan keterangan laporan…"
          rows={4}
        />
      </section>

      <section>
        <h2>Foto</h2>
        <div className="tombol-foto">
          <CameraCapture onCapture={prosesFotoBaru} disabled={memproses || !lokasi} />
          <FileUpload onUpload={prosesFotoBaru} disabled={memproses || !lokasi} />
        </div>
        {memproses && <p>Memproses watermark foto…</p>}
        <PhotoPreview photos={photos} onRemove={hapusFoto} />
      </section>

      <button
        type="button"
        className="tombol-kirim"
        onClick={kirimLaporan}
        disabled={mengirim || memproses}
      >
        {mengirim ? 'Mengirim…' : 'Kirim Laporan'}
      </button>

      {pesanStatus && <p className="pesan-status">{pesanStatus}</p>}
    </main>
  );
}
