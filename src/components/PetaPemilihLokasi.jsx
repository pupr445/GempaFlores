'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

function PenangkapKlik({ onPilihTitik }) {
  useMapEvents({
    click(e) {
      onPilihTitik({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
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
