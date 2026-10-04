import { parseIdentifiers, type TrackingMode } from './productUnits';
import { apiUrl, getAuthHeaders } from './apiClient';
import { ensureAccessToken, invalidateAccessToken } from './session';

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
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Cette photo ne peut pas être ouverte. Essayez une capture JPG ou PNG.'));
      image.src = url;
    });
    const scale = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
    const ctx = canvas.getContext('2d'); if (!ctx || !canvas.width) throw new Error('Photo illisible.');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally { URL.revokeObjectURL(url); }
}

async function readBarcode(canvas: HTMLCanvasElement, mode: TrackingMode): Promise<string[]> {
  const Detector = (globalThis as typeof globalThis & { BarcodeDetector?: {
    new (options: { formats: string[] }): { detect: (source: HTMLCanvasElement) => Promise<Array<{ rawValue: string }>> };
    getSupportedFormats?: () => Promise<string[]>;
  } }).BarcodeDetector;
  if (!Detector) return [];
  try {
    const wanted = ['code_128', 'code_39', 'itf', 'qr_code', 'data_matrix'];
    const supported = await Detector.getSupportedFormats?.();
    const formats = supported ? wanted.filter(format => supported.includes(format)) : wanted;
    if (!formats.length) return [];
    const detector = new Detector({ formats });
    const codes = await detector.detect(canvas);
    const values = codes.flatMap(code => mode === 'IMEI'
      ? identifiersFromText(code.rawValue, mode)
      : [code.rawValue.trim().toUpperCase()].filter(value => { try { return parseIdentifiers(value, mode).length === 1; } catch { return false; } }));
    return [...new Set(values)];
  } catch {
    // BarcodeDetector may exist but reject a format on this browser. OCR remains available.
    return [];
  }
}

async function readFromServer(canvas: HTMLCanvasElement, mode: TrackingMode, shopId: string, signal: AbortSignal): Promise<string[]> {
  if (!shopId || mode === 'QUANTITY') throw new Error('Boutique ou suivi du produit indisponible.');
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Photo illisible.')), 'image/jpeg', .82));
  await ensureAccessToken();
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const timer = setTimeout(abort, 28_000);
  const send = () => fetch(apiUrl(`/media/ocr/${encodeURIComponent(shopId)}?mode=${mode}`), {
    method: 'POST', headers: getAuthHeaders({ 'Content-Type': 'image/jpeg' }), body: blob, signal: controller.signal,
  });
  try {
    let response = await send();
    if (response.status === 401) { invalidateAccessToken(); await ensureAccessToken(); response = await send(); }
    if (!response.ok) throw new Error(`Lecture serveur indisponible (${response.status}).`);
    const body = await response.json();
    return Array.isArray(body.identifiers) ? [...new Set(body.identifiers.filter((id: unknown) => {
      if (typeof id !== 'string') return false;
      try { return parseIdentifiers(id, mode).length === 1; } catch { return false; }
    }))] as string[] : [];
  } finally { clearTimeout(timer); signal.removeEventListener('abort', abort); }
}

async function readLocalOcr(canvas: HTMLCanvasElement, mode: TrackingMode, progress: (value: number) => void, signal: AbortSignal) {
  if (signal.aborted) throw new Error('Lecture annulée.');
  let createWorker: typeof import('tesseract.js').createWorker;
  let PSM: typeof import('tesseract.js').PSM;
  try { ({ createWorker, PSM } = await import('tesseract.js')); }
  catch (error) { throw new Error('Le lecteur IMEI ne peut pas être chargé. Vérifiez la connexion et réessayez.', { cause: error }); }
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  let expired = false;
  let rejectStop: (reason: Error) => void = () => {};
  const stopped = new Promise<never>((_, reject) => { rejectStop = reject; });
  const stop = () => { expired = true; void worker?.terminate(); rejectStop(new Error('Lecture interrompue. Réessayez avec une photo nette.')); };
  const timeout = setTimeout(stop, 90000);
  signal.addEventListener('abort', stop, { once: true });
  try {
    const work = (async () => {
      const assetRoot = `${location.origin}${import.meta.env.BASE_URL}ocr/v6`.replace(/\/$/, '');
      const options = {
        workerPath: `${assetRoot}/worker.min.js`, langPath: assetRoot, workerBlobURL: false,
        // Files are cached by the service worker; avoid a second language-file copy.
        cacheMethod: 'none' as const,
        logger: (event: { status: string; progress: number }) => progress(event.status === 'recognizing text' ? Math.round(event.progress * 100) : 0),
      };
      try { worker = await createWorker('eng', 1, { ...options, corePath: assetRoot }); }
      catch (firstError) {
        // Some WebKit devices report SIMD support but fail to initialize that core.
        console.warn('[IMEI] Moteur optimisé indisponible, essai du moteur standard :', firstError);
        try { worker = await createWorker('eng', 1, { ...options, corePath: `${assetRoot}/tesseract-core-lstm.wasm.js` }); }
        catch (error) {
          console.warn('[IMEI] Initialisation OCR :', error);
          throw new Error(navigator.onLine === false
            ? 'Le lecteur IMEI n’est pas encore disponible hors ligne. Connectez-vous une fois puis réessayez.'
            : 'Le lecteur IMEI n’a pas pu démarrer. Réessayez avec une photo nette ou saisissez le numéro.', { cause: error });
        }
      }
      if (expired || signal.aborted) { await worker.terminate(); throw new Error('Lecture annulée.'); }
      await worker.setParameters({
        tessedit_pageseg_mode: canvas.width > canvas.height * 2 ? PSM.SINGLE_LINE : PSM.SPARSE_TEXT,
        ...(mode === 'IMEI' ? { tessedit_char_whitelist: '0123456789 -' } : {}),
      });
      const result = await worker.recognize(canvas);
      return identifiersFromText(result.data.text, mode);
    })();
    return await Promise.race([work, stopped]);
  } finally { clearTimeout(timeout); signal.removeEventListener('abort', stop); await worker?.terminate(); }
}

export async function readIdentifierPhoto(file: File, mode: TrackingMode, progress: (value: number) => void, signal: AbortSignal, shopId = '') {
  if (signal.aborted) throw new Error('Lecture annulée.');
  const canvas = await imageCanvas(file);
  try {
    if (signal.aborted) throw new Error('Lecture annulée.');
    const barcodes = await readBarcode(canvas, mode);
    if (barcodes.length) return barcodes;
    // WebKit on iPhone can reject its WASM OCR worker even while camera/photo
    // capture works. Prefer the authenticated server for this browser online.
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const preferServer = isIos && navigator.onLine !== false && Boolean(shopId);
    let serverError: unknown;
    if (preferServer) {
      try { return await readFromServer(canvas, mode, shopId, signal); }
      catch (error) { if (signal.aborted) throw error; serverError = error; console.warn('[IMEI] Lecture serveur indisponible, essai local :', error); }
    }
    try { return await readLocalOcr(canvas, mode, progress, signal); }
    catch (error) {
      if (signal.aborted || navigator.onLine === false || !shopId) throw error;
      if (preferServer) throw serverError instanceof Error ? serverError : error;
      console.warn('[IMEI] Lecture locale indisponible, essai serveur :', error);
      return readFromServer(canvas, mode, shopId, signal);
    }
  } finally { canvas.width = 0; canvas.height = 0; }
}
