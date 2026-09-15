import { LOCAL_ONLY } from '../context/backendConfig';
import { requestJson } from './apiClient';

export type CloudSession = {
  access_token: string;
  user: { id: string; name: string; email: string; role: string; tenant_id: string; shop_id: string };
  shop: Record<string, unknown> | null;
};

function saveSession(session: CloudSession) {
  localStorage.setItem('access_token', session.access_token);
  return session;
}

export async function loginCloudAccount(email: string, password: string) {
  if (LOCAL_ONLY || !navigator.onLine || !email.includes('@')) return null;
  return saveSession(await requestJson<CloudSession>('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  }));
}

export async function ensureCloudOwnerAccount(shop: any, user: any, password: string) {
  if (LOCAL_ONLY || !navigator.onLine) return null;
  return saveSession(await requestJson<CloudSession>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: shop.accountId || shop.id,
      shop_id: shop.id,
      user_id: user.id,
      shop_name: shop.name,
      name: user.name,
      email: user.email,
      password,
    }),
  }));
}
