import { apiUrl, getAuthHeaders } from './apiClient';
import { ensureAccessToken, invalidateAccessToken } from './session';
import { readStoredImage, writeStoredImage } from './browserMediaStore';

const localPrefix = 'local-media://';
const pendingCache = () => `nstock-pending-images-${localStorage.getItem('currentUserId') || 'local'}`;
const privateCache = () => `nstock-private-images-${localStorage.getItem('currentUserId') || 'local'}`;
const localKey = value => `${location.origin}/__local-media/${value.slice(localPrefix.length)}`;
function privateMediaPath(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol)
      && /^\/media\/[\w-]{1,36}\/[\w-]{1,36}\/[a-f0-9]{64}\.webp$/.test(url.pathname)
      ? url.pathname : '';
  } catch { return ''; }
}
export const isPrivateMediaUrl = value => Boolean(privateMediaPath(value));

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
  await writeStoredImage(pendingCache(), localKey(reference), new Response(blob, { headers: { 'Content-Type': blob.type || 'image/webp' } }), { required: true });
  return reference;
}

/** Upload immediately while online, without requiring browser photo storage. */
export async function uploadImageFile(file, shopId) {
  if (!file?.type?.startsWith('image/')) throw new Error('Choisissez un fichier image valide.');
  if (file.size > 15 * 1024 * 1024) throw new Error('L’image ne doit pas dépasser 15 Mo.');
  const dataUrl = await compressImage(file);
  return uploadLocalImage(dataUrl, shopId);
}

/** Conserve une image publique du catalogue pour son affichage hors connexion. */
export async function cacheCatalogImage(url) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url) || typeof caches === 'undefined') return false;
  try {
    const cache = await caches.open('nstock-product-images');
    const request = new Request(url, { mode: 'no-cors' });
    if (await cache.match(request)) return true;
    const response = await fetch(request);
    if (!response.ok && response.type !== 'opaque') return false;
    await cache.put(request, response.clone());
    return true;
  } catch { return false; }
}

export const isLocalMediaReference = value => String(value || '').startsWith(localPrefix) || isPrivateMediaUrl(value);

async function fetchPrivateMedia(url, options = {}) {
  await ensureAccessToken();
  const send = () => fetch(url, { ...options, headers: getAuthHeaders(options.headers) });
  let response = await send();
  if (response.status === 401) {
    invalidateAccessToken();
    await ensureAccessToken();
    response = await send();
  }
  return response;
}

export async function resolveLocalImage(value) {
  if (String(value).startsWith(localPrefix)) {
    const response = await readStoredImage(pendingCache(), localKey(value));
    if (!response) throw new Error('Photo locale introuvable.');
    return URL.createObjectURL(await response.blob());
  }
  if (isPrivateMediaUrl(value)) {
    const canonicalUrl = apiUrl(privateMediaPath(value));
    let response = await readStoredImage(privateCache(), canonicalUrl) || await readStoredImage(privateCache(), value);
    if (!response) {
      response = await fetchPrivateMedia(canonicalUrl);
      if (!response.ok) {
        const error = new Error(`Lecture de la photo impossible (${response.status}).`);
        error.status = response.status;
        throw error;
      }
      await writeStoredImage(privateCache(), canonicalUrl, response.clone());
    }
    return URL.createObjectURL(await response.blob());
  }
  return value || '';
}

export async function uploadLocalImage(value, shopId) {
  const isPending = String(value).startsWith(localPrefix);
  if (!isPending && !String(value).startsWith('data:image/')) return value;
  const response = isPending ? await readStoredImage(pendingCache(), localKey(value)) : await fetch(value);
  if (!response) throw new Error('Photo locale manquante : synchronisation conservée en attente.');
  const blob = await response.blob();
  const upload = await fetchPrivateMedia(apiUrl(`/media/${encodeURIComponent(shopId)}`), {
    method: 'POST', headers: { 'Content-Type': blob.type || 'image/webp' }, body: blob,
  });
  if (!upload.ok) {
    const problem = await upload.json().catch(() => null);
    const reason = typeof problem?.message === 'string' ? problem.message : '';
    const error = new Error(reason || `Envoi de la photo impossible (${upload.status}).`);
    error.status = upload.status;
    throw error;
  }
  const { url } = await upload.json();
  if (!isPrivateMediaUrl(url)) throw new Error('Adresse de photo invalide.');
  // The server returns a cut-out WebP. Never cache the original photo under its new URL.
  const processed = await fetchPrivateMedia(apiUrl(privateMediaPath(url)));
  if (!processed.ok) throw new Error(`La photo a été envoyée, mais sa lecture a échoué (${processed.status}).`);
  await writeStoredImage(privateCache(), apiUrl(privateMediaPath(url)), processed.clone());
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
