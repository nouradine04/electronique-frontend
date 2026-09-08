import { BACKEND_URL, LOCAL_ONLY } from '../context/backendConfig.js';

export function getBackendUrl() {
  return localStorage.getItem('backend_url') || BACKEND_URL;
}

export function setBackendUrl(url) {
  localStorage.setItem('backend_url', url);
}

export async function checkServerHealth() {
  if (LOCAL_ONLY) return false;
  try {
    const res = await fetch(`${getBackendUrl()}/sync/pull?lastPulledAt=0`, { method: 'GET' });
    return res.ok;
  } catch (error) {
    return false;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${getBackendUrl()}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur serveur ${response.status}`);
  }

  return response.json();
}
