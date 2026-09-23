export const REMOTE_REFRESH_MS = 5 * 60 * 1000;

export function shouldSync({ pending, lastSuccess, retryAt, now, force, visible }) {
  if (now < retryAt) return false;
  return force || pending > 0 || (visible && now - lastSuccess >= REMOTE_REFRESH_MS);
}

export function retryDelay(failures) {
  return Math.min(15000 * 2 ** Math.min(Math.max(failures - 1, 0), 5), REMOTE_REFRESH_MS);
}

// Spread reconnections across devices without delaying a normal local sale.
export function reconnectDelay(random = Math.random) { return 500 + Math.floor(random() * 4500); }
export function jitteredRetryDelay(failures, random = Math.random) {
  return Math.round(retryDelay(failures) * (.8 + random() * .4));
}
