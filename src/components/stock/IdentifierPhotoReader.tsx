import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, LoaderCircle, Check } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { readIdentifierPhoto } from '../../services/identifierOcr';
import { parseIdentifiers, type TrackingMode } from '../../services/productUnits';

export function IdentifierPhotoReader({ mode, value, onChange }: { mode: TrackingMode; value: string; onChange: (text: string) => void }) {
  const [camera, setCamera] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  const [error, setError] = useState(''), [choices, setChoices] = useState<string[]>([]), [selected, setSelected] = useState(''), [preview, setPreview] = useState(''), [detected, setDetected] = useState('');
  const input = useRef<HTMLInputElement>(null), nativeCamera = useRef<HTMLInputElement>(null), job = useRef<AbortController | null>(null), previewUrl = useRef('');
  useEffect(() => () => { job.current?.abort(); if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);
  const closeCamera = useCallback(() => setCamera(false), []);
  async function read(file: File) {
    if (busy) return;
    job.current?.abort(); const controller = new AbortController(); job.current = controller;
    setCamera(false); setBusy(true); setProgress(0); setError(''); setChoices([]); setSelected(''); setDetected('');
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = URL.createObjectURL(file); setPreview(previewUrl.current);
    try {
      const values = await readIdentifierPhoto(file, mode, setProgress, controller.signal);
      if (controller.signal.aborted) return;
      if (values.length === 1) {
        const identifier = values[0];
        const combined = value.trim() ? `${value.trim()}\n${identifier}` : identifier;
        parseIdentifiers(combined, mode);
        onChange(combined);
        setDetected(identifier);
      } else {
        setChoices(values);
      }
      if (!values.length) setError('Aucun identifiant valide détecté. Rapprochez la caméra de la ligne IMEI ou S/N, puis reprenez la photo.');
    } catch (err) {
      if (!controller.signal.aborted) {
        console.warn('[IMEI] Lecture photo impossible :', err instanceof Error ? err.message : 'erreur inconnue');
        setError(err instanceof Error && /photo|lecteur IMEI|format|illisible|identifiant|IMEI invalide|même identifiant|chiffre de contrôle/i.test(err.message)
          ? err.message
          : navigator.onLine ? 'La lecture IMEI a échoué. Réessayez ou saisissez le numéro indiqué sur l’appareil.' : 'Lecture hors ligne indisponible sur cet appareil. Réessayez avec une connexion.');
      }
    }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  function accept() {
    try {
      const combined = value.trim() ? `${value.trim()}\n${selected}` : selected;
      parseIdentifiers(combined, mode); onChange(combined); setChoices([]); setPreview('');
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); previewUrl.current = '';
    } catch (err) { setError(err.message); }
  }
  return <div style={{ display: 'grid', gap: 10, margin: '12px 0' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) nativeCamera.current?.click();
        else setCamera(true);
      }}><Camera size={17} />Scanner</button>
      <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => input.current?.click()}><ImagePlus size={17} />Photo</button>
    </div>
    <small style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>Alignez l’IMEI ou S/N dans la fente. Si la caméra intégrée ne s’ouvre pas, prenez une photo avec l’appareil. La première lecture OCR nécessite Internet.</small>
    <input ref={input} type="file" accept="image/*" hidden onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void read(file); }} />
    <input ref={nativeCamera} type="file" accept="image/*" capture="environment" hidden onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void read(file); }} />
    {camera && <CameraCapture mode="identifier" onCapture={read} onClose={closeCamera} />}
    {busy && <p role="status" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><LoaderCircle size={18} className="spin" />{progress ? `Lecture… ${progress} %` : 'Préparation de la lecture…'}</p>}
    {preview && <img src={preview} alt="Étiquette photographiée à vérifier" style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 8 }} />}
    {detected && <p role="status" style={{ color: 'var(--success,#167545)', fontSize: 13, margin: 0 }}><Check size={16} /> Numéro ajouté : {detected}. Vérifiez-le sur l’appareil.</p>}
    {!!choices.length && <fieldset style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 10 }}>
      <legend>Vérifiez le numéro sur la photo</legend>
      {choices.length > 1 && <p style={{ fontSize: 12 }}>Plusieurs numéros détectés : choisissez un seul IMEI principal pour cet appareil.</p>}
      {choices.map(id => <label key={id} style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 44, overflowWrap: 'anywhere' }}><input type="radio" checked={selected === id} onChange={() => setSelected(id)} />{id}</label>)}
      <button type="button" className="btn btn-primary" disabled={!selected} onClick={accept}><Check size={17} />Confirmer ce numéro</button>
    </fieldset>}
    {error && <p role="alert" style={{ fontSize: 13, color: 'var(--danger,#b42318)' }}>{error}</p>}
  </div>;
}
