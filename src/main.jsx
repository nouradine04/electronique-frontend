import { AppErrorBoundary } from './components/errors/AppErrorBoundary';
import { AppErrorPage } from './components/errors/AppErrorPage';
import React from 'react';
import './services/installPrompt';
import ReactDOM from 'react-dom/client';
import './index.css';

const isPlatform = ['/platform', '/platform/'].includes(window.location.pathname);
const App = React.lazy(() => import('./App.jsx'));
const PlatformPage = React.lazy(() => import('./pages/platform/PlatformPage.jsx').then(module => ({ default: module.PlatformPage })));

// Une seule origine en développement évite de créer deux stockages distincts
// entre localhost et 127.0.0.1. En production, le domaine public est l'origine
// stable utilisée par la PWA installée.
if (import.meta.env.DEV && window.location.hostname === '127.0.0.1') {
  const canonicalUrl = new URL(window.location.href);
  canonicalUrl.hostname = 'localhost';
  window.location.replace(canonicalUrl.toString());
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary><React.Suspense fallback={<div role="status" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><span className="loading-spinner" aria-label="Chargement" /></div>}>{isPlatform ? <PlatformPage /> : ['/', '/index.html', '/app', '/app/'].includes(window.location.pathname) ? <App /> : <AppErrorPage kind="not-found" />}</React.Suspense></AppErrorBoundary>
  </React.StrictMode>
);
