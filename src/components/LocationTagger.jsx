'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { DAFTAR_KABUPATEN, kecamatanUntuk } from '../lib/wilayahFlores';
import { IconMapPin, IconRefresh, IconLoader, IconCheck, IconAlert } from './icons';

// Dimuat hanya di browser (ssr: false) — Leaflet mengakses `window`, yang
// tidak tersedia saat proses build statis (next build / output: export).
const PetaPemilihLokasi = dynamic(() => import('./PetaPemilihLokasi'), {
  ssr: false,
  loading: () => <p className="peta-loading">Memuat peta…</p>,
});

const OPSI_LAINNYA = 'Lainnya (ketik manual)';

/**
 * Koordinat dari GPS perangkat ATAU dipilih/digeser manual di peta —
 * TIDAK memanggil layanan reverse-geocoding apa pun (semua API geocoding
 * berbayar setelah kuota gratis habis). Kab/kota, kecamatan, dan
 * desa/kelurahan semuanya dipilih/diketik manual oleh pelapor. Peta
 * pakai ubin OpenStreetMap gratis (Leaflet), link "Lihat di Google Maps"
 * hanya URL biasa (maps.google.com/?q=lat,lng) — tidak memanggil API
 * apa pun, jadi tidak ada biaya.
 */
export default function LocationTagger({ onLocationReady }) {
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | loading | ready | error
  const [pesanError, setPesanError] = useState('');
  const [koordinat, setKoordinat] = useState(null); // { lat, lng }
  const [sumberKoordinat, setSumberKoordinat] = useState('gps'); // 'gps' | 'manual' | 'ketik'
  const [tampilPeta, setTampilPeta] = useState(false);
  const [tampilKetikManual, setTampilKetikManual] = useState(false);
  const [latKetik, setLatKetik] = useState('');
  const [lngKetik, setLngKetik] = useState('');
  const [errorKetik, setErrorKetik] = useState('');

  const [kabupatenKota, setKabupatenKota] = useState('');
  const [kabupatenManual, setKabupatenManual] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kecamatanManual, setKecamatanManual] = useState('');
  const [desaKelurahan, setDesaKelurahan] = useState('');

  const kabupatenTerpilih =
    kabupatenKota === OPSI_LAINNYA ? kabupatenManual.trim() : kabupatenKota;
  const kecamatanTerpilih =
    kecamatan === OPSI_LAINNYA ? kecamatanManual.trim() : kecamatan;

  const daftarKecamatan = useMemo(
    () => kecamatanUntuk(kabupatenKota),
    [kabupatenKota]
  );

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
    if (koordinat && kabupatenTerpilih && kecamatanTerpilih) {
      onLocationReady?.({
        lat: koordinat.lat,
        lng: koordinat.lng,
        kabupatenKota: kabupatenTerpilih,
        kecamatan: kecamatanTerpilih,
        desaKelurahan: desaKelurahan.trim() || '-',
      });
    }
  }, [koordinat, kabupatenTerpilih, kecamatanTerpilih, desaKelurahan, onLocationReady]);

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

      <div className="field-grid">
        <label className="field">
          <span className="field-label">Kabupaten/Kota</span>
          <select
            value={kabupatenKota}
            onChange={(e) => {
              setKabupatenKota(e.target.value);
              setKecamatan('');
            }}
          >
            <option value="">Pilih kabupaten/kota…</option>
            {DAFTAR_KABUPATEN.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
            <option value={OPSI_LAINNYA}>{OPSI_LAINNYA}</option>
          </select>
          {kabupatenKota === OPSI_LAINNYA && (
            <input
              type="text"
              className="field-manual"
              placeholder="Ketik nama kabupaten/kota"
              value={kabupatenManual}
              onChange={(e) => setKabupatenManual(e.target.value)}
            />
          )}
        </label>

        <label className="field">
          <span className="field-label">Kecamatan</span>
          <select
            value={kecamatan}
            onChange={(e) => setKecamatan(e.target.value)}
            disabled={!kabupatenKota}
          >
            <option value="">
              {kabupatenKota ? 'Pilih kecamatan…' : 'Pilih kabupaten/kota dulu'}
            </option>
            {daftarKecamatan.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
            {kabupatenKota && <option value={OPSI_LAINNYA}>{OPSI_LAINNYA}</option>}
          </select>
          {kecamatan === OPSI_LAINNYA && (
            <input
              type="text"
              className="field-manual"
              placeholder="Ketik nama kecamatan"
              value={kecamatanManual}
              onChange={(e) => setKecamatanManual(e.target.value)}
            />
          )}
        </label>

        <label className="field field-full">
          <span className="field-label">Desa/Kelurahan</span>
          <input
            type="text"
            placeholder="Ketik nama desa/kelurahan"
            value={desaKelurahan}
            onChange={(e) => setDesaKelurahan(e.target.value)}
          />
        </label>
      </div>

      <p className="field-hint">
        <IconMapPin size={14} /> Koordinat dari GPS perangkat atau dipilih manual di peta —
        kab/kota, kecamatan, dan desa dipilih/diketik sendiri di atas.
      </p>
    </div>
  );
}
