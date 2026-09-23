import { BACKEND_URL } from '../context/backendConfig.js';

export function getBackendUrl() {
  return localStorage.getItem('backend_url') || BACKEND_URL;
}
