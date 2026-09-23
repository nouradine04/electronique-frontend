import React from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw, SearchX, WifiOff } from 'lucide-react';
import './app-error.css';
export type ErrorKind = 'not-found' | 'connection' | 'unexpected';
export function AppErrorPage({ kind, onRetry, onBack }: { kind: ErrorKind; onRetry?: () => void; onBack?: () => void }) {
  const data = {
    'not-found': { Icon: SearchX, code: '404', title: 'Cette page est introuvable', text: 'Le lien est incorrect ou cette page n’existe plus.' },
    connection: { Icon: WifiOff, code: 'Connexion', title: 'Connexion indisponible', text: 'Cette action nécessite Internet. Vérifiez votre connexion puis réessayez. Vos données locales ne sont pas supprimées.' },
    unexpected: { Icon: AlertTriangle, code: 'Un problème est survenu', title: 'Impossible d’afficher cet écran', text: 'Réessayez d’ouvrir l’application. Aucune réinitialisation de vos données ne sera effectuée.' },
  }[kind];
  return <main className="app-error-page"><section aria-labelledby="app-error-title">
    <data.Icon size={42} strokeWidth={1.6} aria-hidden="true" /><p className="app-error-code">{data.code}</p>
    <h1 id="app-error-title">{data.title}</h1><p>{data.text}</p>
    <div>{onRetry && <button type="button" className="btn btn-primary" onClick={onRetry}><RefreshCw size={18} />Réessayer</button>}
      <button type="button" className="btn btn-secondary" onClick={onBack || (() => window.location.assign('/?app=1'))}><ArrowLeft size={18} />{onBack ? 'Retour' : 'Ouvrir l’application'}</button></div>
  </section></main>;
}
