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
  if (!navigator.onLine) throw new NetworkError();
  await finishPendingLogout();
  return saveSession(await sessionRequest('/auth/login', { email: email.trim().toLowerCase(), password: password.trim() }));
}

export async function registerCloudAccount(input: { shop_name: string; name: string; email: string; password: string }) {
  if (!navigator.onLine) throw new NetworkError('Connexion Internet requise pour créer votre compte.');
  await finishPendingLogout();
  const session = await sessionRequest('/auth/register', { ...input, email: input.email.trim().toLowerCase(), password: input.password.trim() });
  if (!session?.user?.id || !session?.shop?.id || session.user_id !== session.user.id || session.user.shop_id !== session.shop.id) {
    throw new Error('Le serveur n’a pas confirmé la création de votre compte et de votre boutique.');
  }
  return saveSession(session);
}
