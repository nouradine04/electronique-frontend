import { getAuthHeaders, requestJson } from './apiClient';

export const supportsWebPush = () => typeof window !== 'undefined' && 'Notification' in window && 'PushManager' in window && 'serviceWorker' in navigator;
const readyWorker = () => Promise.race([
  navigator.serviceWorker.ready,
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Actualisez l’application pour activer les notifications.')), 10000)),
]);

export async function enableWebPush(publicKey: string) {
  if (!supportsWebPush()) throw new Error('Notifications indisponibles ici. Sur iPhone, ouvrez l’application ajoutée à l’écran d’accueil.');
  if (await Notification.requestPermission() !== 'granted') throw new Error('Autorisez les notifications dans les paramètres du navigateur.');
  const registration = await readyWorker();
  const key = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  try {
    await requestJson('/notifications/subscription', { method: 'POST', body: JSON.stringify(subscription.toJSON()) });
    registration.active?.postMessage({ type: 'PUSH_ACCOUNT', userId: localStorage.getItem('currentUserId') });
  } catch (error) { if (!existing) await subscription.unsubscribe(); throw error; }
}

export async function disableWebPush() {
  if (!supportsWebPush()) return;
  const headers = getAuthHeaders();
  const registration = await navigator.serviceWorker.getRegistration();
  registration?.active?.postMessage({ type: 'PUSH_ACCOUNT', userId: null });
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  try { await requestJson('/notifications/subscription', { method: 'DELETE', headers, body: JSON.stringify({ endpoint: subscription.endpoint }) }); }
  finally { await subscription.unsubscribe(); }
}
