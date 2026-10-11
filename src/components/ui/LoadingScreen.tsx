import React from 'react';
import { LoaderCircle } from 'lucide-react';

export function LoadingScreen({ label = 'Ouverture de votre boutique…' }: { label?: string }) {
  return <div role="status" aria-live="polite" style={{ minHeight: '100dvh', display: 'grid', placeContent: 'center', justifyItems: 'center', gap: 16, background: 'var(--bg-main)', color: 'var(--accent-primary)' }}>
    <LoaderCircle size={34} className="nstock-loading-icon" aria-hidden="true" />
    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
  </div>;
}

export function LoadingIndicator() {
  return <div role="status" aria-label="Chargement de l’écran" style={{ minHeight: '45vh', display: 'grid', placeItems: 'center', color: 'var(--accent-primary)' }}>
    <LoaderCircle size={34} className="nstock-loading-icon" aria-hidden="true" />
  </div>;
}
