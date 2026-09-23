import React, { useEffect, useRef, useState } from 'react';
import { Camera, LoaderCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import './camera-capture.css';

export function CameraCapture({ onCapture, onClose }: { onCapture: (file: File) => Promise<void>; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let closed = false;
    let stream: MediaStream | undefined;
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Caméra indisponible ici. Importez une photo depuis votre appareil.');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false });
        if (closed) { stream.getTracks().forEach(track => track.stop()); return; }
        if (video.current) { video.current.srcObject = stream; await video.current.play(); }
      } catch { if (!closed) setError('Caméra indisponible ou autorisation refusée. Fermez cette fenêtre pour importer une photo.'); }
    };
    const previousFocus = document.activeElement as HTMLElement | null;
    const closeButton = document.querySelector<HTMLButtonElement>('.capture-panel header button');
    closeButton?.focus();
    void start();
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopImmediatePropagation(); onClose(); }
      if (event.key === 'Tab') {
        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.capture-panel button:not(:disabled)'));
        const next = (buttons.indexOf(document.activeElement as HTMLButtonElement) + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        event.preventDefault(); buttons[next]?.focus();
      } };
    document.addEventListener('keydown', escape, true);
    return () => { closed = true; stream?.getTracks().forEach(track => track.stop()); document.removeEventListener('keydown', escape, true); previousFocus?.focus(); };
  }, [onClose]);
  const capture = async () => {
    const source = video.current;
    if (!source?.videoWidth || busy) return;
    setBusy(true); setError('');
    try {
      // Le cadre et le recadrage utilisent les mêmes proportions que la vidéo affichée.
      const width = Math.round(source.videoWidth * .84);
      const height = Math.round(source.videoHeight * .5);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Capture impossible.');
      context.drawImage(source, (source.videoWidth - width) / 2, (source.videoHeight - height) / 2, width, height, 0, 0, width, height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Capture impossible.')), 'image/jpeg', .92));
      await onCapture(new File([blob], 'photo-produit.jpg', { type: blob.type }));
      onClose();
    } catch { setError('La photo n’a pas pu être enregistrée. Réessayez.'); }
    finally { setBusy(false); }
  };
  return createPortal(<div className="capture-backdrop" role="dialog" aria-modal="true" aria-label="Prendre une photo">
    <div className="capture-panel">
      <header><div><strong>Prendre une photo</strong><p>Placez la zone à photographier dans le cadre.</p></div><button type="button" onClick={onClose} aria-label="Fermer la caméra"><X /></button></header>
      <div className="capture-view"><video ref={video} muted playsInline onLoadedData={() => setReady(true)} /><div className="capture-frame" aria-hidden="true" />{!ready && !error && <LoaderCircle className="spin capture-loading" />}</div>
      {error && <p className="capture-error" role="alert">{error}</p>}
      <footer><span>Seule la zone encadrée sera conservée.</span><button className="btn btn-primary" type="button" disabled={!ready || busy} onClick={capture}>{busy ? <LoaderCircle className="spin" size={18} /> : <Camera size={18} />} Capturer</button></footer>
    </div>
  </div>, document.body);
}
