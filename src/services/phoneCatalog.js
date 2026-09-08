import { getBackendUrl } from './backendClient.js';

export async function searchPhoneCatalog(query, { signal } = {}) {
  const normalizedQuery = String(query || '').trim();
  if (normalizedQuery.length < 2) return [];

  const response = await fetch(
    `${getBackendUrl()}/phones/search?query=${encodeURIComponent(normalizedQuery)}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Catalogue indisponible (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}
