// Cache Storage is missing in some installed iOS web views. Keep pending photos
// durable in IndexedDB in that case; business records stay in WatermelonDB.
let databasePromise;

function openImageDatabase() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Le stockage des photos est indisponible sur cet appareil.'));
  if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('nstock-image-cache', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch(error => { databasePromise = undefined; throw error; });
  return databasePromise;
}

async function openCache(name) {
  if (typeof caches === 'undefined') return null;
  try { return await caches.open(name); } catch { return null; }
}

async function readIndexedImage(name, key) {
  const db = await openImageDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('images', 'readonly').objectStore('images').get(`${name}:${key}`);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function writeIndexedImage(name, key, blob) {
  const db = await openImageDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('images', 'readwrite');
    transaction.objectStore('images').put(blob, `${name}:${key}`);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function readStoredImage(name, key) {
  const cache = await openCache(name);
  try {
    const response = await cache?.match(key);
    if (response) return response;
  } catch { /* Try the durable fallback. */ }
  try {
    const blob = await readIndexedImage(name, key);
    return blob ? new Response(blob, { headers: { 'Content-Type': blob.type || 'image/webp' } }) : null;
  } catch { return null; }
}

export async function writeStoredImage(name, key, response, { required = false } = {}) {
  const cache = await openCache(name);
  if (cache) {
    try {
      await cache.put(key, response.clone());
      if (name.startsWith('nstock-private-images-')) {
        const keys = await cache.keys();
        for (const old of keys.slice(0, Math.max(0, keys.length - 300))) await cache.delete(old);
      }
      return;
    } catch { /* Safari may expose CacheStorage but refuse writes. */ }
  }
  try { await writeIndexedImage(name, key, await response.blob()); }
  catch (error) {
    if (required) throw new Error('Impossible de conserver la photo sur cet appareil. Vérifiez l’espace disponible et réessayez.', { cause: error });
  }
}
