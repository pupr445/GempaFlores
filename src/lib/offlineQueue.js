// Antrian laporan offline, disimpan di IndexedDB (bukan localStorage) karena
// perlu menyimpan Blob foto/video langsung — IndexedDB mendukung ini tanpa
// perlu encode ke base64 (yang bikin ukuran data 33% lebih besar & lambat).

const DB_NAME = 'gempaflores-offline';
const DB_VERSION = 1;
const STORE = 'antrian_laporan';

function bukaDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak tersedia di browser ini.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * @param {Object} draft - { id, dibuatPada, fields: {...}, photos: [{namaFile, blob}], videos: [{namaFile, blob}] }
 */
export async function simpanKeAntrian(draft) {
  const db = await bukaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(draft);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function ambilSemuaAntrian() {
  const db = await bukaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function hapusDariAntrian(id) {
  const db = await bukaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function hitungAntrian() {
  const semua = await ambilSemuaAntrian().catch(() => []);
  return semua.length;
}
