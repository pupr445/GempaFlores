'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { IconMapPin, IconRefresh, IconLoader, IconCheck, IconAlert } from './icons';

const PetaPemilihLokasi = dynamic(() => import('./PetaPemilihLokasi'), {
  ssr: false,
  loading: () => <p className="peta-loading">Memuat peta…</p>,
});

/**
 * Versi ringkas LocationTagger, khusus form Tim Survey — cuma koordinat
 * (GPS atau pilih di peta), tanpa isian kabupaten/kecamatan/desa manual.
 * Dibuat cepat untuk dipakai di lapangan.
 */
export default function SurveyLocationTagger({ onLocationReady }) {
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [pesanError, setPesanError] = useState('');
  const [koordinat, setKoordinat] = useState(null);
  const [sumberKoordinat, setSumberKoordinat] = useState('gps');
  const [tampilPeta, setTampilPeta] = useState(false);

  const ambilLokasiGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setPesanError('Perangkat ini tidak mendukung GPS.');
      return;
    }
    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setKoordinat({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSumberKoordinat('gps');
        setGpsStatus('ready');
      },
      (err) => {
        setGpsStatus('error');
        setPesanError(
          err.code === 1
            ? 'Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser.'
            : 'Gagal mengambil koordinat GPS. Pastikan GPS aktif lalu coba lagi.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const pilihTitikManual = useCallback(({ lat, lng }) => {
    setKoordinat({ lat, lng });
    setSumberKoordinat('manual');
    setGpsStatus('ready');
    setPesanError('');
  }, []);

  useEffect(() => {
    ambilLokasiGPS();
  }, [ambilLokasiGPS]);

  useEffect(() => {
    if (koordinat) {
      onLocationReady?.({ lat: koordinat.lat, lng: koordinat.lng });
    }
  }, [koordinat, onLocationReady]);

  return (
    <div className="location-tagger">
      <div className="gps-row">
        <div className={`gps-status gps-status-${gpsStatus}`}>
          {gpsStatus === 'loading' && (
            <>
              <IconLoader /> <span>Mengambil koordinat GPS…</span>
            </>
          )}
          {gpsStatus === 'ready' && koordinat && (
            <>
              <IconCheck />
              <span className="koordinat-mono">
                {koordinat.lat.toFixed(6)}, {koordinat.lng.toFixed(6)}
              </span>
              {sumberKoordinat === 'manual' && (
                <span className="koordinat-sumber">(dipilih manual di peta)</span>
              )}
            </>
          )}
          {gpsStatus === 'error' && (
            <>
              <IconAlert /> <span>{pesanError}</span>
            </>
          )}
          {gpsStatus === 'idle' && <span>Menyiapkan GPS…</span>}
        </div>
        <div className="gps-tombol-grup">
          <button type="button" className="btn-ghost-icon" onClick={ambilLokasiGPS}>
            <IconRefresh size={16} />
            Perbarui GPS
          </button>
          <button
            type="button"
            className="btn-ghost-icon"
            onClick={() => setTampilPeta((v) => !v)}
          >
            <IconMapPin size={16} />
            {tampilPeta ? 'Tutup Peta' : 'Pilih di Peta'}
          </button>
        </div>
      </div>

      {tampilPeta && (
        <div className="peta-pemilih-blok">
          <p className="field-hint">
            <IconMapPin size={14} /> Ketuk atau geser pin di peta untuk menentukan titik lokasi sendiri.
          </p>
          <PetaPemilihLokasi koordinat={koordinat} onPilihTitik={pilihTitikManual} />
        </div>
      )}

      {gpsStatus === 'ready' && koordinat && (
        <a
          className="link-gmaps"
          href={`https://www.google.com/maps?q=${koordinat.lat},${koordinat.lng}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconMapPin size={14} /> Lihat titik ini di Google Maps
        </a>
      )}
    </div>
  );
}
