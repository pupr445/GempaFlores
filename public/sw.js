// Service worker GempaFlores.
// Strategi:
// - Halaman (navigasi): network-first, fallback ke cache, fallback terakhir
//   ke halaman /lapor yang sudah pernah di-cache (app shell).
// - Aset statis (_next/static, gambar, dst): cache-first + perbarui cache
//   di belakang layar (stale-while-revalidate).
// - Request ke Supabase / Worker upload (POST/PUT, beda origin) TIDAK
//   di-cache sama sekali — dibiarkan lewat apa adanya. Kalau gagal karena
//   offline, itu ditangani oleh kode aplikasi (disimpan ke antrian).

const CACHE_VERSION = 'gempaflores-v2';
const BASE = '/GempaFlores';

const APP_SHELL = [
  `${BASE}/`,
  `${BASE}/lapor`,
  `${BASE}/riwayat`,
  `${BASE}/survey`,
  `${BASE}/survey/login`,
  `${BASE}/manifest.json`,
  `${BASE}/icon-192.png`,
  `${BASE}/icon-512.png`,
  `${BASE}/logo-ntt.png`,
  `${BASE}/logo-pupr.jpg`,
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      // best-effort: kalau offline saat install (jarang terjadi), jangan
      // sampai gagal total, cache satu-satu dan lewati yang error.
      await Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch(() => {
            /* lewati, akan ke-cache nanti saat sempat online */
          })
        )
      );
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const namaCache = await caches.keys();
      await Promise.all(
        namaCache
          .filter((n) => n !== CACHE_VERSION)
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Cuma tangani GET dan same-origin. Request lain (POST ke Supabase/Worker,
  // atau domain luar) dibiarkan lewat jalur normal browser.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigasi = request.mode === 'navigate';

  if (isNavigasi) {
    event.respondWith(
      (async () => {
        try {
          const respons = await fetch(request);
          const cache = await caches.open(CACHE_VERSION);
          cache.put(request, respons.clone());
          return respons;
        } catch {
          const cache = await caches.open(CACHE_VERSION);
          const tercache = await cache.match(request);
          if (tercache) return tercache;
          // fallback terakhir: app shell halaman lapor
          const shell = await cache.match(`${BASE}/lapor`);
          if (shell) return shell;
          return new Response(
            '<h1>Sedang offline</h1><p>Buka halaman ini minimal sekali saat ada sinyal, supaya bisa dibuka offline nanti.</p>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // Aset statis: cache-first, refresh di belakang layar.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const tercache = await cache.match(request);
      const fetchDanSimpan = fetch(request)
        .then((respons) => {
          if (respons && respons.status === 200) {
            cache.put(request, respons.clone());
          }
          return respons;
        })
        .catch(() => null);

      return tercache || (await fetchDanSimpan) || Response.error();
    })()
  );
});
