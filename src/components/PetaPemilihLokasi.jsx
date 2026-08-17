'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IconSearch, IconX, IconMapPin, IconLoader } from './icons';

// Ikon default Leaflet mengandalkan path gambar relatif yang tidak cocok
// dengan bundler Next.js — pakai ikon SVG inline sederhana sebagai gantinya
// supaya tidak perlu meng-host file marker-icon.png terpisah.
const ikonPin = new L.DivIcon({
  className: 'peta-pin-marker',
  html: `<svg width="30" height="42" viewBox="0 0 24 24" fill="#c4571c" stroke="#fff" stroke-width="1.2">
    <path d="M12 21s7-6.4 7-12a7 7 0 1 0-14 0c0 5.6 7 12 7 12Z"/>
    <circle cx="12" cy="9" r="2.6" fill="#fff"/>
  </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

// Pusat peta default: kira-kira tengah Pulau Flores, dipakai kalau belum
// ada koordinat GPS/manual sama sekali.
const PUSAT_DEFAULT = [-8.65, 121.3];

// Kotak batas pencarian (barat, selatan, timur, utara) — kira-kira
// mencakup seluruh Pulau Flores + perairan sekitarnya, supaya hasil
// pencarian tidak melebar ke luar NTT.
const BATAS_PENCARIAN = '119.4,-9.3,123.9,-7.6';

function PenangkapKlik({ onPilihTitik }) {
  useMapEvents({
    click(e) {
      onPilihTitik({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/**
 * Kotak pencarian nama tempat di atas peta — pakai Nominatim (OpenStreetMap),
 * layanan geocoding gratis tanpa API key, sejalan dengan ubin peta yang
 * sudah dipakai. Pencarian di-debounce ~600ms dan dibatasi ke area Flores
 * supaya tetap ringan dan sopan terhadap kuota layanan gratis tsb.
 */
function PencarianLokasi({ onPilihTitik }) {
  const map = useMap();
  const [kueri, setKueri] = useState('');
  const [hasil, setHasil] = useState([]);
  const [mencari, setMencari] = useState(false);
  const [tampilHasil, setTampilHasil] = useState(false);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);

    if (kueri.trim().length < 3) {
      setHasil([]);
      setMencari(false);
      return;
    }

    setMencari(true);
    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const params = new URLSearchParams({
          format: 'json',
          q: kueri.trim(),
          countrycodes: 'id',
          viewbox: BATAS_PENCARIAN,
          bounded: '1',
          limit: '6',
          'accept-language': 'id',
        });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setHasil(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'AbortError') setHasil([]);
      } finally {
        setMencari(false);
      }
    }, 600);

    return () => clearTimeout(timerRef.current);
  }, [kueri]);

  const pilihHasil = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    map.flyTo([lat, lng], 16, { duration: 1 });
    onPilihTitik({ lat, lng });
    setKueri(item.display_name);
    setTampilHasil(false);
    setHasil([]);
  };

  return (
    <div className="peta-pencarian" onClick={(e) => e.stopPropagation()}>
      <div className="peta-pencarian-box">
        <IconSearch size={16} className="peta-pencarian-ikon" />
        <input
          type="text"
          value={kueri}
          placeholder="Cari nama tempat, jalan, desa…"
          onChange={(e) => {
            setKueri(e.target.value);
            setTampilHasil(true);
          }}
          onFocus={() => setTampilHasil(true)}
          onBlur={() => setTimeout(() => setTampilHasil(false), 150)}
        />
        {mencari && <IconLoader size={15} className="peta-pencarian-loader" />}
        {!mencari && kueri && (
          <button
            type="button"
            className="peta-pencarian-clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setKueri('');
              setHasil([]);
            }}
            aria-label="Hapus pencarian"
          >
            <IconX size={14} />
          </button>
        )}
      </div>

      {tampilHasil && hasil.length > 0 && (
        <ul className="peta-pencarian-hasil">
          {hasil.map((item) => (
            <li key={item.place_id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pilihHasil(item)}>
                <IconMapPin size={14} />
                <span>{item.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {tampilHasil && !mencari && kueri.trim().length >= 3 && hasil.length === 0 && (
        <div className="peta-pencarian-kosong">Tidak ditemukan. Coba kata kunci lain.</div>
      )}
    </div>
  );
}

export default function PetaPemilihLokasi({ koordinat, onPilihTitik }) {
  const pusatAwal = useMemo(
    () => (koordinat ? [koordinat.lat, koordinat.lng] : PUSAT_DEFAULT),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="peta-pemilih-wrapper">
      <MapContainer
        center={pusatAwal}
        zoom={koordinat ? 15 : 9}
        scrollWheelZoom
        className="peta-pemilih-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PenangkapKlik onPilihTitik={onPilihTitik} />
        <PencarianLokasi onPilihTitik={onPilihTitik} />
        {koordinat && (
          <Marker
            position={[koordinat.lat, koordinat.lng]}
            icon={ikonPin}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const pos = e.target.getLatLng();
                onPilihTitik({ lat: pos.lat, lng: pos.lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
