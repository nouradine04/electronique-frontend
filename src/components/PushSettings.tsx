import React, { useEffect, useState } from 'react';
import { Bell, LoaderCircle } from 'lucide-react';
import { requestJson } from '../services/apiClient';
import { disableWebPush, enableWebPush, supportsWebPush } from '../services/webPush';

export function PushSettings() {
  const [config, setConfig] = useState<{ enabled: boolean; publicKey: string } | null>(null);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let mounted = true;
    requestJson<{ enabled: boolean; publicKey: string }>('/notifications/config').then(value => { if (mounted) setConfig(value); }).catch(() => { if (mounted) setMessage('Connectez-vous au serveur pour configurer les notifications.'); });
    if (supportsWebPush()) navigator.serviceWorker.getRegistration().then(registration => registration?.pushManager.getSubscription()).then(subscription => { if (mounted) setActive(Boolean(subscription)); });
    return () => { mounted = false; };
  }, []);
  const toggle = async () => {
    setBusy(true); setMessage('');
    try {
      if (active) await disableWebPush(); else await enableWebPush(config!.publicKey);
      setActive(!active);
      setMessage(active ? 'Notifications désactivées sur cet appareil.' : 'Notifications activées sur cet appareil.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Activation impossible.'); }
    finally { setBusy(false); }
  };
  return <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20 }}>
    <h3 style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Bell size={20} color="var(--primary-color, #0e6ba8)" /> Notifications importantes</h3>
    <p>Recevez les alertes de rupture de stock et les demandes de validation des produits.</p>
    {!supportsWebPush() && <p>Sur iPhone, ajoutez l’application à l’écran d’accueil puis ouvrez-la depuis son icône.</p>}
    {config && !config.enabled && <p>Les notifications seront disponibles après leur activation sur le serveur.</p>}
    <button type="button" className="btn btn-primary" disabled={busy || !supportsWebPush() || (!active && !config?.enabled)} onClick={toggle}>
      {busy && <LoaderCircle size={16} className="animate-spin" />} {active ? 'Désactiver sur cet appareil' : 'Activer sur cet appareil'}
    </button>
    {message && <p role="status">{message}</p>}
  </section>;
}
