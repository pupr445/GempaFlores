'use client';

import { useState, useCallback } from 'react';
import AppHeader from '../../components/AppHeader';
import CameraCapture from '../../components/CameraCapture';
import FileUpload from '../../components/FileUpload';
import PhotoPreview from '../../components/PhotoPreview';
import VideoCapture from '../../components/VideoCapture';
import VideoUpload from '../../components/VideoUpload';
import VideoPreview from '../../components/VideoPreview';
import LocationTagger from '../../components/LocationTagger';
import { IconLoader, IconAlert, IconCheck } from '../../components/icons';
import { tambahWatermark } from '../../lib/watermark';
import { validasiUkuranVideo, validasiDurasiVideo, MAKS_UKURAN_VIDEO_MB, MAKS_DURASI_VIDEO_DETIK } from '../../lib/video';
import { supabase } from '../../lib/supabaseClient';

let idCounter = 0;
const buatId = (prefix = 'foto') => `${prefix}-${Date.now()}-${idCounter++}`;

export default function HalamanLaporan() {
  const [lokasi, setLokasi] = useState(null);
  const [namaPelapor, setNamaPelapor] = useState('');
  const [noHp, setNoHp] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [photos, setPhotos] = useState([]); // { id, blob, previewUrl }
  const [videos, setVideos] = useState([]); // { id, blob, previewUrl }
  const [memproses, setMemproses] = useState(false);
  const [memprosesVideo, setMemprosesVideo] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  const [status, setStatus] = useState({ jenis: '', pesan: '' }); // jenis: '' | 'info' | 'error' | 'sukses'

  const handleLocationReady = useCallback((data) => {
    setLokasi(data);
  }, []);

  // Video opsional, jadi tidak termasuk di sini — hanya syarat wajib.
  const wajibLengkap = Boolean(lokasi) && namaPelapor.trim() !== '' && noHp.trim() !== '' && photos.length > 0;

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

  const prosesVideoBaru = async (file) => {
    const cekUkuran = validasiUkuranVideo(file);
    if (!cekUkuran.ok) {
      setStatus({ jenis: 'error', pesan: cekUkuran.pesan });
      return;
    }

    setMemprosesVideo(true);
    try {
      const cekDurasi = await validasiDurasiVideo(file);
      if (!cekDurasi.ok) {
        setStatus({ jenis: 'error', pesan: cekDurasi.pesan });
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setVideos((prev) => [
        ...prev,
        { id: buatId('video'), blob: file, previewUrl },
      ]);
    } catch (err) {
      console.error(err);
      setStatus({ jenis: 'error', pesan: 'Video gagal diproses. Coba ambil/unggah ulang.' });
    } finally {
      setMemprosesVideo(false);
    }
  };

  const hapusVideo = (id) => {
    setVideos((prev) => {
      const target = prev.find((v) => v.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((v) => v.id !== id);
    });
  };

  const kirimLaporan = async (e) => {
    e.preventDefault();
    if (!namaPelapor.trim() || !noHp.trim()) {
      setStatus({ jenis: 'error', pesan: 'Lengkapi nama dan nomor HP/WA sebelum mengirim.' });
      return;
    }
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
          nama_pelapor: namaPelapor.trim(),
          no_hp: noHp.trim(),
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

      // File foto/video disimpan di Supabase Storage, metadatanya di
      // tabel foto_laporan/video_laporan.
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

      for (const video of videos) {
        const ekstensi = (video.blob.name?.split('.').pop() || 'mp4').toLowerCase();
        const namaFile = `${laporan.id}/${buatId('video')}.${ekstensi}`;
        const { error: errUpload } = await supabase.storage
          .from('video-laporan')
          .upload(namaFile, video.blob, { contentType: video.blob.type || 'video/mp4' });

        if (errUpload) throw errUpload;

        const { data: publicUrlData } = supabase.storage
          .from('video-laporan')
          .getPublicUrl(namaFile);

        const { error: errInsertVideo } = await supabase
          .from('video_laporan')
          .insert({
            laporan_id: laporan.id,
            url: publicUrlData.publicUrl,
          });

        if (errInsertVideo) throw errInsertVideo;
      }

      setStatus({ jenis: 'sukses', pesan: 'Laporan terkirim. Terima kasih atas laporannya.' });
      setNamaPelapor('');
      setNoHp('');
      setDeskripsi('');
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPhotos([]);
      videos.forEach((v) => URL.revokeObjectURL(v.previewUrl));
      setVideos([]);
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
          <p className="section-eyebrow">03 &middot; Kontak Pelapor</p>
          <div className="field-grid">
            <label className="field">
              <span className="field-label">Nama Pelapor <span className="field-wajib">*</span></span>
              <input
                type="text"
                placeholder="Nama lengkap"
                value={namaPelapor}
                onChange={(e) => setNamaPelapor(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span className="field-label">No HP/WA <span className="field-wajib">*</span></span>
              <input
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                required
              />
            </label>
          </div>
          <p className="field-hint">
            Nama dan No HP/WA wajib diisi untuk memudahkan komunikasi dan koordinasi.
          </p>
        </section>

        <section>
          <p className="section-eyebrow">04 &middot; Foto</p>
          <div className="tombol-foto">
            <CameraCapture onCapture={prosesFotoBaru} disabled={memproses || !lokasi} />
            <FileUpload onUpload={prosesFotoBaru} disabled={memproses || !lokasi} />
          </div>
          {memproses && (
            <p className="pesan-proses"><IconLoader size={16} /> Membubuhkan watermark lokasi ke foto…</p>
          )}
          <PhotoPreview photos={photos} onRemove={hapusFoto} />
        </section>

        <section>
          <p className="section-eyebrow">05 &middot; Video (opsional)</p>
          <div className="tombol-foto">
            <VideoCapture onCapture={prosesVideoBaru} disabled={memprosesVideo || !wajibLengkap} />
            <VideoUpload onUpload={prosesVideoBaru} disabled={memprosesVideo || !wajibLengkap} />
          </div>
          {memprosesVideo && (
            <p className="pesan-proses"><IconLoader size={16} /> Memeriksa video…</p>
          )}
          {!wajibLengkap && (
            <p className="pesan-proses">
              <IconAlert size={16} /> Lengkapi lokasi, nama, No HP/WA, dan minimal satu foto dahulu sebelum menambahkan video.
            </p>
          )}
          <VideoPreview videos={videos} onRemove={hapusVideo} />
          <p className="field-hint">
            Maks {MAKS_UKURAN_VIDEO_MB}MB dan {MAKS_DURASI_VIDEO_DETIK} detik per video.
          </p>
        </section>

        <button
          type="button"
          className="tombol-kirim"
          onClick={kirimLaporan}
          disabled={mengirim || memproses || memprosesVideo || !wajibLengkap}
        >
          {mengirim ? (<><IconLoader size={18} /> Mengirim…</>) : 'Kirim Laporan'}
        </button>

        {!wajibLengkap && !mengirim && (
          <p className="pesan-proses">
            <IconAlert size={16} /> Lengkapi lokasi, nama, No HP/WA, dan minimal satu foto sebelum mengirim laporan. Video bersifat opsional.
          </p>
        )}

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
