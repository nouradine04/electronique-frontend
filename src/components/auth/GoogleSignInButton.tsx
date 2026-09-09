import React, { useEffect, useRef } from 'react';
import { BACKEND_URL } from '../../context/backendConfig.js';

declare global {
  interface Window { google?: { accounts: { id: { initialize(options: unknown): void; renderButton(element: HTMLElement, options: unknown): void } } } }
}

let googleScript: Promise<void> | null = null;
function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScript) googleScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client?hl=fr';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google est indisponible. Vérifiez votre connexion.'));
    document.head.appendChild(script);
  });
  return googleScript;
}

export function GoogleSignInButton({ onVerified, onError }: { onVerified: (profile: { sub: string; email: string; name: string }) => void | Promise<void>; onError: (message: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const verified = useRef(onVerified);
  const reportError = useRef(onError);
  verified.current = onVerified;
  reportError.current = onError;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId || !container.current) return;
    let cancelled = false;
    loadGoogleIdentity().then(() => {
      if (cancelled || !container.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }: { credential?: string }) => {
          try {
            const response = await fetch(`${BACKEND_URL}/auth/google/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }) });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.message || 'Connexion Google impossible.');
            await verified.current(payload);
          } catch (error) { reportError.current(error instanceof Error ? error.message : 'Connexion Google impossible.'); }
        },
      });
      container.current.replaceChildren();
      window.google.accounts.id.renderButton(container.current, { type: 'standard', theme: 'outline', size: 'large', shape: 'rectangular', width: Math.min(336, container.current.clientWidth), text: 'continue_with', locale: 'fr' });
    }).catch(error => reportError.current(error.message));
    return () => { cancelled = true; };
  }, [clientId]);

  if (!clientId) return <button type="button" className="google-unconfigured" onClick={() => onError('La connexion Google nécessite encore la clé VITE_GOOGLE_CLIENT_ID.')}>Continuer avec Google</button>;
  return <div ref={container} className="google-signin" aria-label="Connexion avec Google" />;
}
