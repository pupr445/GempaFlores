'use client';

import { useState, useCallback } from 'react';
import SurveyHeader from '../../components/SurveyHeader';
import SurveyGuard from '../../components/SurveyGuard';
import RiwayatLaporan from '../../components/RiwayatLaporan';
import SurveyLocationTagger from '../../components/SurveyLocationTagger';
import CameraCapture from '../../components/CameraCapture';
import FileUpload from '../../components/FileUpload';
import PhotoPreview from '../../components/PhotoPreview';
import VideoCapture from '../../components/VideoCapture';
import VideoUpload from '../../components/VideoUpload';
import VideoPreview from '../../components/VideoPreview';
import { IconLoader, IconAlert, IconCheck } from '../../components/icons';
import { tambahWatermark } from '../../lib/watermark';
import { validasiUkuranVideo, validasiDurasiVideo, MAKS_UKURAN_VIDEO_MB, MAKS_DURASI_VIDEO_DETIK } from '../../lib/video';
import { kirimDraftKeServer } from '../../lib/kirimLaporanServer';
import { simpanKeAntrian } from '../../lib/offlineQueue';
import { prosesAntrian } from '../../lib/offlineSync';

let idCounter = 0;
const buatId = (prefix = 'foto') => `survey-${prefix}-${Date.now()}-${idCounter++}`;

function HalamanSurveyIsi() {
  const [tabAktif, setTabAktif] = useState('form');
  const [lokasi, setLokasi] = useState(null);
  const [deskripsi, setDeskripsi] = useState('');
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [memproses, setMemproses] = useState(false);
  const [memprosesVideo, setMemprosesVideo] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  const [status, setStatus] = useState({ jenis: '', pesan: '' });

  const handleLocationReady = useCallback((data) => setLokasi(data), []);

  const wajibLengkap = Boolean(lokasi) && photos.length > 0;

  const prosesFotoBaru = async (file) => {
    if (!lokasi) {
      setStatus({ jenis: 'error', pesan: 'Tunggu lokasi selesai diambil sebelum menambahkan foto.' });
      return;
    }
    setMemproses(true);
    try {
      const blobBerwatermark = await tambahWatermark(file, lokasi);
      const previewUrl = URL.createObjectURL(blobBerwatermark);
      setPhotos((prev) => [...prev, { id: buatId(), blob: blobBerwatermark, previewUrl }]);
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
      setVideos((prev) => [...prev, { id: buatId('video'), blob: file, previewUrl }]);
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
    if (!lokasi) {
      setStatus({ jenis: 'error', pesan: 'Tunggu koordinat lokasi selesai diambil.' });
      return;
    }
    if (photos.length === 0) {
      setStatus({ jenis: 'error', pesan: 'Tambahkan minimal satu foto sebelum mengirim.' });
      return;
    }

    setMengirim(true);
    setStatus({ jenis: 'info', pesan: 'Mengirim laporan…' });

    const draft = {
      id: crypto.randomUUID(),
      dibuatPada: new Date().toISOString(),
      fields: {
        deskripsi,
        latitude: lokasi.lat,
        longitude: lokasi.lng,
        sumber: 'tim_survey',
      },
      photos: photos.map((p) => ({ id: p.id, namaFile: `${p.id}.jpg`, blob: p.blob })),
      videos: videos.map((v) => {
        const ekstensi = (v.blob.name?.split('.').pop() || 'mp4').toLowerCase();
        return { id: v.id, namaFile: `${v.id}.${ekstensi}`, blob: v.blob };
      }),
    };

    const resetForm = () => {
      setDeskripsi('');
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPhotos([]);
      videos.forEach((v) => URL.revokeObjectURL(v.previewUrl));
      setVideos([]);
    };

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      try {
        await simpanKeAntrian(draft);
        setStatus({
          jenis: 'sukses',
          pesan: 'Sinyal tidak ada — laporan tersimpan di HP dan akan otomatis terkirim begitu ada sinyal.',
        });
        resetForm();
      } catch (err) {
        console.error(err);
        setStatus({ jenis: 'error', pesan: 'Gagal menyimpan laporan di HP. Coba lagi.' });
      } finally {
        setMengirim(false);
      }
      return;
    }

    try {
      await kirimDraftKeServer(draft);
      setStatus({ jenis: 'sukses', pesan: 'Laporan terkirim. Terima kasih.' });
      resetForm();
    } catch (err) {
      console.error(err);
      try {
        await simpanKeAntrian(draft);
        setStatus({
          jenis: 'sukses',
          pesan: 'Sinyal tidak stabil — laporan tersimpan di HP dan akan dicoba kirim ulang otomatis.',
        });
        resetForm();
        prosesAntrian();
      } catch (errSimpan) {
        console.error(errSimpan);
        setStatus({ jenis: 'error', pesan: 'Laporan gagal terkirim. Periksa koneksi lalu coba lagi.' });
      }
    } finally {
      setMengirim(false);
    }
  };

  return (
    <>
      <SurveyHeader tabAktif={tabAktif} onGantiTab={setTabAktif} />

      {tabAktif === 'form' ? (
        <main className="halaman-laporan">
          <section>
            <p className="section-eyebrow">01 &middot; Koordinat</p>
            <SurveyLocationTagger onLocationReady={handleLocationReady} />
          </section>

          <section>
            <p className="section-eyebrow">02 &middot; Deskripsi</p>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Kondisi di lapangan: kerusakan, situasi terkini…"
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

          <section>
            <p className="section-eyebrow">04 &middot; Video (opsional)</p>
            <div className="tombol-foto">
              <VideoCapture onCapture={prosesVideoBaru} disabled={memprosesVideo || !wajibLengkap} />
              <VideoUpload onUpload={prosesVideoBaru} disabled={memprosesVideo || !wajibLengkap} />
            </div>
            {memprosesVideo && (
              <p className="pesan-proses"><IconLoader size={16} /> Memeriksa video…</p>
            )}
            {!wajibLengkap && (
              <p className="pesan-proses">
                <IconAlert size={16} /> Lengkapi koordinat dan minimal satu foto dahulu sebelum menambahkan video.
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
              <IconAlert size={16} /> Lengkapi koordinat dan minimal satu foto sebelum mengirim laporan.
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
      ) : (
        <main className="halaman-admin">
          <section className="panel-riwayat">
            <h2>Riwayat Laporan</h2>
            <p className="panel-export-desc">
              Arsip laporan lapangan yang sudah tercatat, termasuk yang masuk dari mode Tim Survey.
            </p>
            <RiwayatLaporan includeSumberFilter />
          </section>
        </main>
      )}
    </>
  );
}

export default function HalamanSurvey() {
  return (
    <SurveyGuard>
      <HalamanSurveyIsi />
    </SurveyGuard>
  );
}
