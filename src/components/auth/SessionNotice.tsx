import React, { useEffect, useState } from 'react';
import { canWorkOffline, getSession } from '../../services/session';
import { useSync } from '../../context/SyncContext';

export function SessionNotice({ reconnect }: { reconnect: () => void }) {
  const { syncError } = useSync();
  const [allowed, setAllowed] = useState(canWorkOffline);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      clearTimeout(timer);
      setAllowed(canWorkOffline());
      const remaining = Date.parse(getSession()?.offlineAccessUntil || '') - Date.now();
      // Horloge locale uniquement, aucune requête réseau.
      if (remaining > 0) timer = setTimeout(check, Math.min(remaining + 10, 86400000));
    };
    check();
    window.addEventListener('nstock-session', check);
    window.addEventListener('focus', check);
    return () => { clearTimeout(timer); window.removeEventListener('nstock-session', check); window.removeEventListener('focus', check); };
  }, []);
  if (allowed && !syncError) return null;
  return <div role="alert" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, padding: '12px 16px', background: 'var(--bg-card, white)', boxShadow: '0 2px 10px #0002', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <span>{allowed ? syncError : <><strong>Reconnexion requise</strong> — Lecture seule. Vos données sont conservées.</>}</span>
    {!allowed && <button className="btn btn-primary" onClick={reconnect}>Se reconnecter</button>}
  </div>;
}
