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
  const [tampilKetikManual, setTampilKetikManual] = useState(false);
  const [latKetik, setLatKetik] = useState('');
  const [lngKetik, setLngKetik] = useState('');
  const [errorKetik, setErrorKetik] = useState('');

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

  const terapkanKoordinatKetik = useCallback((e) => {
    e.preventDefault();
    const lat = parseFloat(latKetik.replace(',', '.'));
    const lng = parseFloat(lngKetik.replace(',', '.'));
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setErrorKetik('Latitude dan longitude harus berupa angka.');
      return;
    }
    if (lat < -90 || lat > 90) {
      setErrorKetik('Latitude harus di antara -90 dan 90.');
      return;
    }
    if (lng < -180 || lng > 180) {
      setErrorKetik('Longitude harus di antara -180 dan 180.');
      return;
    }
    setErrorKetik('');
    setKoordinat({ lat, lng });
    setSumberKoordinat('ketik');
    setGpsStatus('ready');
    setPesanError('');
  }, [latKetik, lngKetik]);

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
              {sumberKoordinat === 'ketik' && (
                <span className="koordinat-sumber">(diketik manual)</span>
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
          <button
            type="button"
            className="btn-ghost-icon"
            onClick={() => {
              setTampilKetikManual((v) => !v);
              if (koordinat) {
                setLatKetik(String(koordinat.lat));
                setLngKetik(String(koordinat.lng));
              }
            }}
          >
            <IconMapPin size={16} />
            {tampilKetikManual ? 'Tutup Input Manual' : 'Ketik Koordinat'}
          </button>
        </div>
      </div>

      {tampilKetikManual && (
        <form className="koordinat-ketik-blok" onSubmit={terapkanKoordinatKetik}>
          <p className="field-hint">
            <IconMapPin size={14} /> Ketik langsung koordinat latitude &amp; longitude, misalnya dari Google Maps.
          </p>
          <div className="field-grid">
            <label className="field">
              <span className="field-label">Latitude</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="-10.152532"
                value={latKetik}
                onChange={(e) => setLatKetik(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Longitude</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="123.671848"
                value={lngKetik}
                onChange={(e) => setLngKetik(e.target.value)}
              />
            </label>
          </div>
          {errorKetik && (
            <p className="pesan-proses pesan-status-error">
              <IconAlert size={16} /> {errorKetik}
            </p>
          )}
          <button type="submit" className="btn-ghost-icon">
            <IconCheck size={16} />
            Gunakan Koordinat Ini
          </button>
        </form>
      )}

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
