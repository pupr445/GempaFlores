'use client';

import { useState, useEffect, useCallback } from 'react';
import { reverseGeocode } from '../lib/geocode';

/**
 * Mengambil koordinat presisi perangkat (GPS) lalu menerjemahkannya
 * menjadi kabupaten/kota, kecamatan, desa/kelurahan lewat Google Maps.
 * Memanggil onLocationReady setiap kali lokasi berhasil didapat.
 */
export default function LocationTagger({ onLocationReady }) {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [lokasi, setLokasi] = useState(null);
  const [pesanError, setPesanError] = useState('');

  const ambilLokasi = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setPesanError('Perangkat tidak mendukung GPS/geolocation.');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const alamat = await reverseGeocode(latitude, longitude);
          const dataLokasi = {
            lat: latitude,
            lng: longitude,
            kabupatenKota: alamat.kabupatenKota,
            kecamatan: alamat.kecamatan,
            desaKelurahan: alamat.desaKelurahan,
            alamatLengkap: alamat.alamatLengkap,
          };
          setLokasi(dataLokasi);
          setStatus('ready');
          onLocationReady?.(dataLokasi);
        } catch (err) {
          setStatus('error');
          setPesanError('Gagal menerjemahkan koordinat ke alamat.');
        }
      },
      (err) => {
        setStatus('error');
        setPesanError(
          err.code === 1
            ? 'Izin lokasi ditolak. Aktifkan izin lokasi di browser.'
            : 'Gagal mengambil lokasi. Pastikan GPS aktif.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [onLocationReady]);

  useEffect(() => {
    ambilLokasi();
  }, [ambilLokasi]);

  return (
    <div className="location-tagger">
      {status === 'loading' && <p>Mengambil koordinat presisi…</p>}

      {status === 'error' && (
        <div className="location-error">
          <p>{pesanError}</p>
          <button type="button" onClick={ambilLokasi}>
            Coba Ambil Lokasi Lagi
          </button>
        </div>
      )}

      {status === 'ready' && lokasi && (
        <div className="location-info">
          <p><strong>Kab/Kota:</strong> {lokasi.kabupatenKota}</p>
          <p><strong>Kecamatan:</strong> {lokasi.kecamatan}</p>
          <p><strong>Desa/Kelurahan:</strong> {lokasi.desaKelurahan}</p>
          <p className="koordinat-kecil">
            {lokasi.lat.toFixed(6)}, {lokasi.lng.toFixed(6)}
          </p>
          <button type="button" onClick={ambilLokasi}>
            Perbarui Lokasi
          </button>
        </div>
      )}
    </div>
  );
}
