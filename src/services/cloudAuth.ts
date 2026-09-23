import { LOCAL_ONLY } from '../context/backendConfig';
import { acceptSession, finishPendingLogout, NetworkError, sessionRequest } from './session';

export type CloudSession = {
  access_token: string;
  offline_access_until: string;
  user_id: string;
  user: { id: string; name: string; email: string; role: string; tenant_id: string; shop_id: string };
  shop: Record<string, unknown> | null;
};

async function saveSession(session: CloudSession) {
  await acceptSession(session);
  return session;
}

export async function loginCloudAccount(email: string, password: string) {
  if (LOCAL_ONLY || !navigator.onLine) throw new NetworkError();
  await finishPendingLogout();
  return saveSession(await sessionRequest('/auth/login', { email: email.trim().toLowerCase(), password }));
}

export async function ensureCloudOwnerAccount(shop: any, user: any, password: string) {
  if (LOCAL_ONLY || !navigator.onLine) throw new NetworkError();
  await finishPendingLogout();
  return saveSession(await sessionRequest('/auth/register', {
      tenant_id: shop.accountId || shop.id,
      shop_id: shop.id,
      user_id: user.id,
      shop_name: shop.name,
      name: user.name,
      email: user.email,
      password,
  }));
}

export async function registerCloudAccount(input: { shop_name: string; name: string; email: string; password: string }) {
  await finishPendingLogout();
  return saveSession(await sessionRequest('/auth/register', input));
}
