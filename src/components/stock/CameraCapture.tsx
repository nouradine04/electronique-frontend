import React, { useEffect, useRef, useState } from 'react';
import { Camera, LoaderCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import './camera-capture.css';

function cameraError(cause: unknown): string {
  if (!window.isSecureContext) return 'La caméra du navigateur exige HTTPS. Ouvrez le site sécurisé ou utilisez la photo de l’appareil.';
  if (!navigator.mediaDevices?.getUserMedia) return 'Ce navigateur ne propose pas de caméra intégrée. Utilisez la photo de l’appareil.';
  const name = cause instanceof DOMException ? cause.name : '';
  if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(name)) return 'Accès caméra refusé. Autorisez la caméra pour ce site dans les réglages du navigateur, puis réessayez.';
  if (['NotFoundError', 'DevicesNotFoundError'].includes(name)) return 'Aucune caméra disponible. Vérifiez l’appareil ou prenez une photo.';
  if (['NotReadableError', 'TrackStartError'].includes(name)) return 'La caméra est occupée par une autre application. Fermez-la et réessayez.';
  return 'Le flux caméra ne démarre pas sur ce navigateur. Essayez « Prendre avec l’appareil photo ».';
}

export function CameraCapture({ onCapture, onClose, mode = 'product' }: { onCapture: (file: File) => Promise<void>; onClose: () => void; mode?: 'product' | 'identifier' }) {
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const nativeCamera = useRef<HTMLInputElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const closed = useRef(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(false);
  const stopCamera = () => { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; setReady(false); };
  useEffect(() => {
    closed.current = false;
    const previousFocus = document.activeElement as HTMLElement | null;
    const closeButton = document.querySelector<HTMLButtonElement>('.capture-panel header button');
    closeButton?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopImmediatePropagation(); onClose(); }
      if (event.key === 'Tab') {
        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.capture-panel button:not(:disabled)'));
        const next = (buttons.indexOf(document.activeElement as HTMLButtonElement) + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        event.preventDefault(); buttons[next]?.focus();
      } };
    document.addEventListener('keydown', escape, true);
    return () => { closed.current = true; stream.current?.getTracks().forEach(track => track.stop()); document.removeEventListener('keydown', escape, true); previousFocus?.focus(); };
  }, [onClose]);
  const startCamera = async () => {
    // On some iPhone browser containers getUserMedia is absent although the
    // system camera picker remains available. Keep the user's click gesture.
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      nativeCamera.current?.click();
      return;
    }
    setError(''); setReady(false); setStarting(true);
    try {
      stopCamera();
      let opened: MediaStream;
      try { opened = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); }
      catch (cause) {
        if (!(cause instanceof DOMException) || !['OverconstrainedError', 'NotFoundError'].includes(cause.name)) throw cause;
        opened = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      if (closed.current) { opened.getTracks().forEach(track => track.stop()); return; }
      stream.current = opened;
      if (!video.current) throw new Error('video-unavailable');
      video.current.srcObject = opened;
      await video.current.play();
      if (!closed.current) setReady(true);
    } catch (cause) {
      if (!closed.current) setError(cameraError(cause));
      console.warn('[Caméra] Ouverture impossible :', cause instanceof DOMException ? cause.name : cause);
      stopCamera();
    } finally { if (!closed.current) setStarting(false); }
  };
  const captureNative = async (file?: File) => {
    if (!file || busy) return;
    setBusy(true); setError(''); stopCamera();
    try { await onCapture(file); onClose(); }
    catch { setError('La photo n’a pas pu être enregistrée. Réessayez.'); }
    finally { setBusy(false); }
  };
  const capture = async () => {
    const source = video.current;
    const target = frame.current;
    if (!source?.videoWidth || !target || busy) return;
    setBusy(true); setError('');
    try {
      const shown = source.getBoundingClientRect();
      const opening = target.getBoundingClientRect();
      // Même recadrage que l'ouverture visible avec object-fit: cover.
      const scale = Math.max(shown.width / source.videoWidth, shown.height / source.videoHeight);
      const visibleWidth = source.videoWidth * scale;
      const visibleHeight = source.videoHeight * scale;
      const offsetX = (shown.width - visibleWidth) / 2;
      const offsetY = (shown.height - visibleHeight) / 2;
      const x = Math.max(0, (opening.left - shown.left - offsetX) / scale);
      const y = Math.max(0, (opening.top - shown.top - offsetY) / scale);
      const width = Math.min(source.videoWidth - x, opening.width / scale);
      const height = Math.min(source.videoHeight - y, opening.height / scale);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width); canvas.height = Math.round(height);
      const context = canvas.getContext('2d');
      if (!context || !canvas.width || !canvas.height) throw new Error('Capture impossible.');
      context.drawImage(source, x, y, width, height, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Capture impossible.')), 'image/jpeg', .92));
      stopCamera();
      await onCapture(new File([blob], mode === 'identifier' ? 'identifiant.jpg' : 'photo-produit.jpg', { type: blob.type }));
      onClose();
    } catch { setError('La photo n’a pas pu être enregistrée. Réessayez.'); }
    finally { setBusy(false); }
  };
  return createPortal(<div className="capture-backdrop" role="dialog" aria-modal="true" aria-label={mode === 'identifier' ? 'Scanner un identifiant' : 'Prendre une photo'}>
    <div className="capture-panel">
      <header><div><strong>{mode === 'identifier' ? 'Scanner l’IMEI ou le numéro de série' : 'Prendre une photo'}</strong><p>{mode === 'identifier' ? 'Alignez une seule ligne de chiffres dans la fente.' : 'Placez le produit dans le cadre.'}</p></div><button type="button" onClick={onClose} aria-label="Fermer la caméra"><X /></button></header>
      <div className={`capture-view${mode === 'identifier' ? ' capture-view--identifier' : ''}`}><video ref={video} muted playsInline autoPlay /><div ref={frame} className={`capture-frame${mode === 'identifier' ? ' capture-frame--identifier' : ''}`} aria-hidden="true" />{!ready && <button type="button" className="capture-start" disabled={starting || busy} onClick={startCamera}>{starting || busy ? <LoaderCircle className="spin" size={18} /> : <Camera size={18} />} {busy ? 'Lecture…' : starting ? 'Ouverture…' : 'Activer la caméra'}</button>}</div>
      {error && <p className="capture-error" role="alert">{error}</p>}
      <footer><span>{mode === 'identifier' ? 'Seule la ligne dans la fente sera analysée.' : 'Seule la zone encadrée sera conservée.'}</span><input ref={nativeCamera} type="file" accept="image/*" capture="environment" hidden onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void captureNative(file); }} /><button className="btn btn-secondary" type="button" disabled={busy} onClick={() => nativeCamera.current?.click()}>Prendre avec l’appareil photo</button><button className="btn btn-primary" type="button" disabled={!ready || busy} onClick={capture}>{busy ? <LoaderCircle className="spin" size={18} /> : <Camera size={18} />} {mode === 'identifier' ? 'Lire l’IMEI' : 'Capturer'}</button></footer>
    </div>
  </div>, document.body);
}
