import { BACKEND_URL } from '../context/backendConfig';

export type SessionState = { userId: string; offlineAccessUntil: string; api: string; blocked?: boolean };
type SessionResponse = { access_token: string; offline_access_until: string; user_id: string; refresh_token?: string };
export class SessionError extends Error { constructor(message = 'Session expirée. Reconnexion requise.') { super(message); } }
export class NetworkError extends Error { constructor(message = 'Serveur injoignable. Vérifiez votre connexion ou réessayez plus tard.') { super(message); } }
export class ApiError extends Error { constructor(public status: number, message: string, public details?: unknown) { super(message); } }
let accessToken = '';
let refreshing: Promise<string> | null = null;
const KEY = 'nstock_session';
const native = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
const base = () => BACKEND_URL.replace(/\/+$/, '');
const notify = () => window.dispatchEvent(new Event('nstock-session'));
export function getSession(): SessionState | null {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
// Existing sessions may reopen read-only after expiry; writes still require canWorkOffline.
export function hasStoredSessionFor(userId: string) {
  const state = getSession();
  return Boolean(userId && state?.userId === userId && state.api === base()
    && Number.isFinite(Date.parse(state.offlineAccessUntil)));
}
export function canWorkOffline(now = Date.now()) {
  const state = getSession();
  return Boolean(state?.userId && state.api === base() && !state.blocked && now < Date.parse(state.offlineAccessUntil));
}
export function assertSessionWritable() { if (!canWorkOffline()) throw new SessionError(); }
export function getAccessToken() { return accessToken; }
function validAccess() {
  try { return JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000 > Date.now() + 10000; }
  catch { return false; }
}
async function nativeToken(action: 'get' | 'set' | 'delete', token?: string): Promise<string | null> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke(`session_token_${action}`, action === 'set' ? { token } : {});
}
export async function acceptSession(result: SessionResponse) {
  if (!result.access_token || !result.user_id || !Number.isFinite(Date.parse(result.offline_access_until))) throw new SessionError('Réponse de session invalide.');
  if (native()) {
    if (!result.refresh_token) throw new SessionError('Session native incomplète.');
    await nativeToken('set', result.refresh_token);
  }
  accessToken = result.access_token;
  localStorage.removeItem('access_token');
  localStorage.removeItem('authToken');
  localStorage.setItem(KEY, JSON.stringify({ userId: result.user_id, offlineAccessUntil: result.offline_access_until, api: base() }));
  notify();
}
function blockSession() {
  accessToken = '';
  const state = getSession();
  if (state) localStorage.setItem(KEY, JSON.stringify({ ...state, blocked: true }));
  notify();
}
export async function sessionRequest(endpoint: string, payload: Record<string, unknown>) {
  if (!navigator.onLine) throw new NetworkError();
  const response = await fetch(`${base()}${endpoint}`, {
    method: 'POST', credentials: 'include',
    signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', ...(native() ? { 'X-Session-Transport': 'native' } : {}) },
    body: JSON.stringify(payload),
  }).catch(() => { throw new NetworkError(); });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status >= 500) throw new NetworkError();
    if (response.status === 401 && endpoint !== '/auth/logout') blockSession();
    throw new ApiError(response.status, data.message || `Erreur serveur ${response.status}`, data);
  }
  return data;
}
export function ensureAccessToken(): Promise<string> {
  if (validAccess() && canWorkOffline()) return Promise.resolve(accessToken);
  if (refreshing) return refreshing;
  assertSessionWritable();
  const refresh = async () => {
    if (validAccess()) return accessToken;
    assertSessionWritable();
    const data = await sessionRequest('/auth/refresh', native() ? { refresh_token: await nativeToken('get') } : {});
    if (data.user_id !== getSession()?.userId) {
      blockSession();
      throw new SessionError('Le compte de cette session a changé. Reconnectez-vous.');
    }
    await acceptSession(data);
    channel?.postMessage({ accessToken, state: getSession() });
    return accessToken;
  };
  refreshing = Promise.resolve(navigator.locks ? navigator.locks.request('nstock-session-refresh', refresh) : refresh()).finally(() => { refreshing = null; });
  return refreshing;
}
export function invalidateAccessToken() { accessToken = ''; }
export async function logoutSession() {
  // La session locale est immédiatement verrouillée, même si la révocation attend le réseau.
  blockSession();
  localStorage.setItem('nstock_logout_pending', 'true');
  try {
    await sessionRequest('/auth/logout', native() ? { refresh_token: await nativeToken('get') } : {});
    if (native()) await nativeToken('delete');
    localStorage.removeItem('nstock_logout_pending');
  } finally {
    localStorage.removeItem(KEY);
    notify();
  }
}
export async function finishPendingLogout() {
  if (localStorage.getItem('nstock_logout_pending')) await logoutSession();
}
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('nstock-session') : null;
if (channel) channel.onmessage = event => {
  if (event.data?.state?.userId === getSession()?.userId && canWorkOffline()) accessToken = event.data.accessToken || '';
};
window.addEventListener('storage', event => { if (event.key === KEY) { accessToken = ''; notify(); } });
window.addEventListener('online', () => { void finishPendingLogout().catch(() => {}); });
