import { parseIdentifiers, type TrackingMode } from './productUnits';

export function identifiersFromText(text: string, mode: TrackingMode): string[] {
  const candidates = mode === 'IMEI'
    ? [...text.matchAll(/(?<!\d)(?:\d[ \t-]?){14}\d(?!\d)/g)].map(match => match[0].replace(/[ \t-]/g, ''))
    : [...text.matchAll(/(?:\bS\s*\/\s*N|\bSN|\bSERIAL(?:\s*(?:NUMBER|NO))?|\bS[ÉE]RIE)\s*[:#.-]?\s*([A-Z0-9][A-Z0-9-]{2,99})/gi)].map(match => match[1].toUpperCase());
  return [...new Set(candidates)].filter(value => { try { return parseIdentifiers(value, mode).length === 1; } catch { return false; } });
}
async function imageCanvas(file: File) {
  if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) throw new Error('Choisissez une photo de moins de 20 Mo.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    const scale = Math.min(1, 2200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
    const ctx = canvas.getContext('2d'); if (!ctx || !canvas.width) throw new Error('Photo illisible.');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally { URL.revokeObjectURL(url); }
}
export async function readIdentifierPhoto(file: File, mode: TrackingMode, progress: (value: number) => void, signal: AbortSignal) {
  const { createWorker, PSM } = await import('tesseract.js');
  if (signal.aborted) throw new Error('Lecture annulée.');
  const canvas = await imageCanvas(file);
  if (signal.aborted) throw new Error('Lecture annulée.');
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  let expired = false;
  let rejectStop: (reason: Error) => void = () => {};
  const stopped = new Promise<never>((_, reject) => { rejectStop = reject; });
  const stop = () => { expired = true; void worker?.terminate(); rejectStop(new Error('Lecture interrompue. Réessayez avec une photo nette.')); };
  const timeout = setTimeout(stop, 90000);
  signal.addEventListener('abort', stop, { once: true });
  try {
    const work = (async () => {
      worker = await createWorker('eng', 1, {
        workerPath: '/ocr/v6/worker.min.js', corePath: '/ocr/v6', langPath: '/ocr/v6', workerBlobURL: false,
        // Files are cached by the service worker; avoid a second language-file copy.
        cacheMethod: 'none', logger: event => progress(event.status === 'recognizing text' ? Math.round(event.progress * 100) : 0),
      });
      if (expired || signal.aborted) { await worker.terminate(); throw new Error('Lecture annulée.'); }
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
      const result = await worker.recognize(canvas);
      return identifiersFromText(result.data.text, mode);
    })();
    return await Promise.race([work, stopped]);
  } finally { clearTimeout(timeout); signal.removeEventListener('abort', stop); await worker?.terminate(); canvas.width = 0; canvas.height = 0; }
}
