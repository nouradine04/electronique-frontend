import { BACKEND_URL } from '../context/backendConfig';

export function apiUrl(endpoint = '') {
  const baseUrl = localStorage.getItem('backend_url') || BACKEND_URL;
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${normalizedBase}${normalizedEndpoint}`;
}

export function getAuthHeaders(extraHeaders: HeadersInit = {}) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

export async function requestJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(endpoint), {
    ...options,
    headers: getAuthHeaders(options.headers),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur serveur ${response.status}`);
  }

  return response.json() as Promise<T>;
}
