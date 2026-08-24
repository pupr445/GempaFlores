'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { kondisiEfektif, WARNA_KERUSAKAN } from '../lib/statistikLaporan';

// Pusat & zoom default: kira-kira tengah Pulau Flores.
const PUSAT_DEFAULT = [-8.65, 121.3];
const ZOOM_DEFAULT = 8;

/**
 * Peta sebaran seluruh laporan yang punya koordinat, dikelompokkan
 * (cluster) supaya tetap ringan & terbaca walau jumlah titiknya puluhan
 * ribu. Tiap titik diwarnai sesuai tingkat kerusakannya.
 */
export default function PetaSebaranLaporan({ titikList }) {
  const titikValid = useMemo(
    () =>
      titikList.filter(
        (t) => typeof t.latitude === 'number' && typeof t.longitude === 'number'
      ),
    [titikList]
  );

  return (
    <MapContainer
      center={PUSAT_DEFAULT}
      zoom={ZOOM_DEFAULT}
      scrollWheelZoom
      className="peta-sebaran-laporan"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
        {titikValid.map((t, i) => {
          const kondisi = kondisiEfektif(t);
          const warna = WARNA_KERUSAKAN[kondisi];
          return (
            <CircleMarker
              key={i}
              center={[t.latitude, t.longitude]}
              radius={6}
              pathOptions={{ color: '#fff', weight: 1.5, fillColor: warna, fillOpacity: 0.9 }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <div className="peta-sebaran-tooltip">
                  <strong>{kondisi}</strong>
                  <br />
                  {t.jenis_infrastruktur || 'Jenis tidak diketahui'}
                  {t.sub_jenis_infrastruktur ? ` — ${t.sub_jenis_infrastruktur}` : ''}
                  <br />
                  {[t.kecamatan, t.kabupaten_kota].filter(Boolean).join(', ')}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
