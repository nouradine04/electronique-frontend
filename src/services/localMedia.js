import { apiUrl, getAuthHeaders } from './apiClient';

const localPrefix = 'local-media://';
const pendingCache = () => `nstock-pending-images-${localStorage.getItem('currentUserId') || 'local'}`;
const privateCache = () => `nstock-private-images-${localStorage.getItem('currentUserId') || 'local'}`;
const localKey = value => `${location.origin}/__local-media/${value.slice(localPrefix.length)}`;
export function isPrivateMediaUrl(value) {
  try { const url = new URL(value); const base = new URL(apiUrl('/media/')); return url.origin === base.origin && url.pathname.startsWith(base.pathname); }
  catch { return false; }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Ce fichier image ne peut pas être lu.'));
    };
    image.src = url;
  });
}

async function compressImage(file, maxDimension = 1024, quality = 0.78) {
  const image = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('La compression des images est indisponible sur cet appareil.');
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/webp', quality);
}

export async function saveLocalImage(file, options = {}) {
  if (!file?.type?.startsWith('image/')) throw new Error('Choisissez un fichier image valide.');
  if (file.size > 15 * 1024 * 1024) throw new Error('L’image ne doit pas dépasser 15 Mo.');
  const dataUrl = await compressImage(file, options.maxDimension, options.quality);
  const blob = await (await fetch(dataUrl)).blob();
  const reference = `${localPrefix}${crypto.randomUUID()}.webp`;
  const cache = await caches.open(pendingCache());
  await cache.put(localKey(reference), new Response(blob, { headers: { 'Content-Type': 'image/webp' } }));
  return reference;
}

/** Conserve une image publique du catalogue pour son affichage hors connexion. */
export async function cacheCatalogImage(url) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url) || typeof caches === 'undefined') return false;
  const cache = await caches.open('nstock-product-images');
  const request = new Request(url, { mode: 'no-cors' });
  if (await cache.match(request)) return true;
  const response = await fetch(request);
  if (!response.ok && response.type !== 'opaque') return false;
  await cache.put(request, response.clone());
  return true;
}

export const isLocalMediaReference = value => String(value || '').startsWith(localPrefix) || isPrivateMediaUrl(value);

export async function resolveLocalImage(value) {
  if (String(value).startsWith(localPrefix)) {
    const response = await (await caches.open(pendingCache())).match(localKey(value));
    if (!response) throw new Error('Photo locale introuvable.');
    return URL.createObjectURL(await response.blob());
  }
  if (isPrivateMediaUrl(value)) {
    const cache = await caches.open(privateCache());
    let response = await cache.match(value);
    if (!response) {
      response = await fetch(value, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Image inaccessible.');
      await cache.put(value, response.clone());
      const entries = await cache.keys();
      for (const entry of entries.slice(0, Math.max(0, entries.length - 300))) await cache.delete(entry);
    }
    return URL.createObjectURL(await response.blob());
  }
  return value || '';
}

export async function uploadLocalImage(value, shopId) {
  const isPending = String(value).startsWith(localPrefix);
  if (!isPending && !String(value).startsWith('data:image/')) return value;
  const cache = await caches.open(pendingCache());
  const response = isPending ? await cache.match(localKey(value)) : await fetch(value);
  if (!response) throw new Error('Photo locale manquante : synchronisation conservée en attente.');
  const blob = await response.blob();
  const upload = await fetch(apiUrl(`/media/${encodeURIComponent(shopId)}`), {
    method: 'POST', headers: getAuthHeaders({ 'Content-Type': blob.type || 'image/webp' }), body: blob,
  });
  if (!upload.ok) throw new Error(`Envoi de la photo impossible (${upload.status}).`);
  const { url } = await upload.json();
  if (!isPrivateMediaUrl(url)) throw new Error('Adresse de photo invalide.');
  await (await caches.open(privateCache())).put(url, new Response(blob, { headers: { 'Content-Type': blob.type } }));
  // Keep the pending copy until the local record has durably stored the new URL.
  return url;
}

export async function imageAsDataUrl(value) {
  const resolved = await resolveLocalImage(value);
  try {
    const response = await fetch(resolved);
    if (!response.ok) throw new Error('Image inaccessible.');
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } finally { if (resolved.startsWith('blob:')) URL.revokeObjectURL(resolved); }
}
