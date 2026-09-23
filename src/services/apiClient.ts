import { BACKEND_URL } from '../context/backendConfig';
import { ApiError, NetworkError, ensureAccessToken, getAccessToken, invalidateAccessToken } from './session';

export function apiUrl(endpoint = '') {
  const baseUrl = localStorage.getItem('backend_url') || BACKEND_URL;
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${normalizedBase}${normalizedEndpoint}`;
}

export function getAuthHeaders(extraHeaders: HeadersInit = {}) {
  const token = getAccessToken();

  return {
    'Content-Type': 'application/json',
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function requestJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const authenticated = endpoint !== '/auth/google/verify' && !endpoint.startsWith('/phones/');
  if (authenticated) await ensureAccessToken();
  const send = async () => {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (options.signal?.aborted) abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 30000);
    try {
      return await fetch(apiUrl(endpoint), { ...options, signal: controller.signal, headers: getAuthHeaders(options.headers) });
    } catch { throw new NetworkError(); }
    finally { clearTimeout(timer); options.signal?.removeEventListener('abort', abort); }
  };
  let response = await send();
  if (authenticated && response.status === 401) {
    invalidateAccessToken();
    await ensureAccessToken();
    response = await send();
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || `Erreur serveur ${response.status}`, errorData);
  }

  return response.json() as Promise<T>;
}
