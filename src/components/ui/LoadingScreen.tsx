import React from 'react';
import { LoaderCircle } from 'lucide-react';

export function LoadingScreen({ label = 'Ouverture de votre boutique…' }: { label?: string }) {
  return <div role="status" aria-live="polite" style={{ minHeight: '100dvh', display: 'grid', placeContent: 'center', justifyItems: 'center', gap: 16, background: 'var(--bg-main)', color: 'var(--accent-primary)' }}>
    <LoaderCircle size={34} className="spin" aria-hidden="true" />
    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
  </div>;
}
