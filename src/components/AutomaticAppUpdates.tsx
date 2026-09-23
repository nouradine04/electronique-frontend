import { useEffect } from 'react';

// Download and activate new app versions without reloading an unfinished form.
// The next page opening uses the updated shell. Business sync is separate.
export function AutomaticAppUpdates() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let disposed = false;
    let checking = false;
    const check = async () => {
      if (!navigator.onLine || checking || disposed) return;
      checking = true;
      try {
        const registration = await navigator.serviceWorker.ready;
        if (!disposed && navigator.onLine) await registration.update();
      } catch { /* Retry at the next opening or network reconnection. */ }
      finally { checking = false; }
    };
    void check();
    window.addEventListener('online', check);
    return () => { disposed = true; window.removeEventListener('online', check); };
  }, []);
  return null;
}
