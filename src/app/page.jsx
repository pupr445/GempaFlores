'use client';

import { useState, useCallback } from 'react';
import AppHeader from '../components/AppHeader';
import CameraCapture from '../components/CameraCapture';
import FileUpload from '../components/FileUpload';
import PhotoPreview from '../components/PhotoPreview';
import LocationTagger from '../components/LocationTagger';
import { IconLoader, IconAlert, IconCheck } from '../components/icons';
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
  const [status, setStatus] = useState({ jenis: '', pesan: '' }); // jenis: '' | 'info' | 'error' | 'sukses'

  const handleLocationReady = useCallback((data) => {
    setLokasi(data);
  }, []);

  const prosesFotoBaru = async (file) => {
    if (!lokasi) {
      setStatus({ jenis: 'error', pesan: 'Tunggu lokasi selesai diambil sebelum menambahkan foto.' });
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
      setStatus({ jenis: 'error', pesan: 'Foto gagal diproses. Coba ambil/unggah ulang.' });
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
      setStatus({ jenis: 'error', pesan: 'Lengkapi kabupaten/kota dan kecamatan sebelum mengirim.' });
      return;
    }
    if (photos.length === 0) {
      setStatus({ jenis: 'error', pesan: 'Tambahkan minimal satu foto sebelum mengirim.' });
      return;
    }

    setMengirim(true);
    setStatus({ jenis: 'info', pesan: 'Mengirim laporan…' });

    try {
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

      setStatus({ jenis: 'sukses', pesan: 'Laporan terkirim. Terima kasih atas laporannya.' });
      setDeskripsi('');
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPhotos([]);
    } catch (err) {
      console.error(err);
      setStatus({ jenis: 'error', pesan: 'Laporan gagal terkirim. Periksa koneksi lalu coba lagi.' });
    } finally {
      setMengirim(false);
    }
  };

  return (
    <>
      <AppHeader />

      <main className="halaman-laporan">
        <section>
          <p className="section-eyebrow">01 &middot; Lokasi</p>
          <LocationTagger onLocationReady={handleLocationReady} />
        </section>

        <section>
          <p className="section-eyebrow">02 &middot; Deskripsi</p>
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Ceritakan kondisi di lapangan: kerusakan, korban, kebutuhan mendesak…"
            rows={4}
          />
        </section>

        <section>
          <p className="section-eyebrow">03 &middot; Foto</p>
          <div className="tombol-foto">
            <CameraCapture onCapture={prosesFotoBaru} disabled={memproses || !lokasi} />
            <FileUpload onUpload={prosesFotoBaru} disabled={memproses || !lokasi} />
          </div>
          {memproses && (
            <p className="pesan-proses"><IconLoader size={16} /> Membubuhkan watermark lokasi ke foto…</p>
          )}
          <PhotoPreview photos={photos} onRemove={hapusFoto} />
        </section>

        <button
          type="button"
          className="tombol-kirim"
          onClick={kirimLaporan}
          disabled={mengirim || memproses}
        >
          {mengirim ? (<><IconLoader size={18} /> Mengirim…</>) : 'Kirim Laporan'}
        </button>

        {status.pesan && (
          <p className={`pesan-status pesan-status-${status.jenis}`}>
            {status.jenis === 'error' && <IconAlert size={16} />}
            {status.jenis === 'sukses' && <IconCheck size={16} />}
            {status.jenis === 'info' && <IconLoader size={16} />}
            {status.pesan}
          </p>
        )}
      </main>
    </>
  );
}
