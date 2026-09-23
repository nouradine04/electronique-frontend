import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export function prepareOcrAssets() {
  const target = new URL('../public/ocr/v6/', import.meta.url);
  mkdirSync(target, { recursive: true });
  const copy = (source, name) => cpSync(new URL(source, import.meta.url), fileURLToPath(new URL(name, target)));
  copy('../node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js');
  for (const name of ['tesseract-core.wasm.js', 'tesseract-core-simd.wasm.js', 'tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js']) copy(`../node_modules/tesseract.js-core/${name}`, name);
  copy('../node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'eng.traineddata.gz');
}
