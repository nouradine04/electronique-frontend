import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = fs.readFileSync(new URL('../src/services/localMedia.js', import.meta.url), 'utf8');
const storeSource = fs.readFileSync(new URL('../src/services/browserMediaStore.js', import.meta.url), 'utf8');
const afterSaveSource = fs.readFileSync(new URL('../src/services/productPhotoAfterSave.js', import.meta.url), 'utf8');
const compiledStore = ts.transpileModule(storeSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function mediaHarness({ downloadStatus = 200, withoutCache = false } = {}) {
  let token = 'expired';
  let refreshes = 0;
  let uploads = 0;
  let reads = 0;
  const stored = new Map();
  const mediaUrl = `https://api.example.test/media/shop/user/${'a'.repeat(64)}.webp`;
  let browserStore;
  const context = {
    exports: {}, URL, Response, Blob, crypto: globalThis.crypto,
    Image: class { naturalWidth = 800; naturalHeight = 600; set src(_value) { queueMicrotask(() => this.onload?.()); } },
    document: { createElement: () => ({ getContext: () => ({ drawImage() {} }), toDataURL: () => 'data:image/webp;base64,b3JpZ2luYWw=' }) },
    localStorage: { getItem: () => 'user' },
    location: { origin: 'https://app.example.test' },
    caches: { open: async () => ({
      put: async (key, response) => { stored.set(String(key), response); },
      match: async key => stored.get(String(key)),
      keys: async () => [...stored.keys()],
      delete: async key => stored.delete(String(key)),
    }) },
    require(specifier) {
      if (specifier === './browserMediaStore') return browserStore;
      if (specifier === './apiClient') return {
        apiUrl: path => `https://api.example.test${path}`,
        getAuthHeaders: extra => ({ ...extra, Authorization: `Bearer ${token}` }),
      };
      if (specifier === './session') return {
        ensureAccessToken: async () => { if (token === 'expired') { token = 'valid'; refreshes += 1; } },
        invalidateAccessToken: () => { token = 'expired'; },
      };
      throw new Error(`Unexpected import: ${specifier}`);
    },
    fetch: async (url, options = {}) => {
      if (String(url).startsWith('data:image/')) return new Response(new Blob(['original'], { type: 'image/webp' }));
      if (options.method === 'POST') {
        uploads += 1;
        assert.equal(options.headers.Authorization, 'Bearer valid');
        return Response.json({ url: mediaUrl });
      }
      reads += 1;
      assert.equal(options.headers.Authorization, 'Bearer valid');
      return new Response('processed', { status: downloadStatus });
    },
  };
  if (withoutCache) delete context.caches;
  const storeContext = { ...context, exports: {} };
  vm.runInNewContext(compiledStore, storeContext);
  browserStore = storeContext.exports;
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  return { media: context.exports, stored, mediaUrl, counts: () => ({ refreshes, uploads, reads }) };
}

test('iPhone fallback preserves a photo when Cache Storage is unavailable', async () => {
  const records = new Map();
  const indexedDB = { open: () => {
    const request = {};
    queueMicrotask(() => {
      request.result = {
        createObjectStore() {},
        transaction() {
          const transaction = {};
          transaction.objectStore = () => ({
            get(key) {
              const read = {};
              queueMicrotask(() => { read.result = records.get(key); read.onsuccess?.(); });
              return read;
            },
            put(blob, key) { records.set(key, blob); queueMicrotask(() => transaction.oncomplete?.()); },
          });
          return transaction;
        },
      };
      request.onupgradeneeded?.(); request.onsuccess?.();
    });
    return request;
  } };
  const context = { exports: {}, indexedDB, Response, Blob };
  vm.runInNewContext(compiledStore, context);
  await context.exports.writeStoredImage('pending-user', 'photo-1', new Response(new Blob(['photo'], { type: 'image/webp' })), { required: true });
  const image = await context.exports.readStoredImage('pending-user', 'photo-1');
  assert.equal(await image.text(), 'photo');
});

test('a product photo is linked only after authenticated upload and processed-image read', async () => {
  const harness = mediaHarness();
  const url = await harness.media.uploadLocalImage('data:image/webp;base64,b3JpZ2luYWw=', 'shop');
  assert.equal(url, harness.mediaUrl);
  assert.deepEqual(harness.counts(), { refreshes: 1, uploads: 1, reads: 1 });
  assert.equal(await harness.stored.get(url).text(), 'processed');
});

test('an online iPhone uploads a photo without relying on local photo storage', async () => {
  const harness = mediaHarness({ withoutCache: true });
  const photo = new Blob(['photo'], { type: 'image/jpeg' });
  const url = await harness.media.uploadImageFile(photo, 'shop');
  assert.equal(url, harness.mediaUrl);
  assert.deepEqual(harness.counts(), { refreshes: 1, uploads: 1, reads: 1 });
});

test('a photo that cannot be read back is not marked ready for another device', async () => {
  const harness = mediaHarness({ downloadStatus: 503 });
  await assert.rejects(
    harness.media.uploadLocalImage('data:image/webp;base64,b3JpZ2luYWw=', 'shop'),
    /lecture a échoué/,
  );
  assert.equal(harness.stored.size, 0);
});

test('another device can fetch a synced private photo using its own session', async () => {
  const harness = mediaHarness();
  const objectUrl = await harness.media.resolveLocalImage(harness.mediaUrl);
  try {
    assert.match(objectUrl, /^blob:/);
    assert.deepEqual(harness.counts(), { refreshes: 1, uploads: 0, reads: 1 });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
});

test('a synced private photo remains visible without Cache Storage', async () => {
  const harness = mediaHarness({ withoutCache: true });
  const objectUrl = await harness.media.resolveLocalImage(harness.mediaUrl);
  try {
    assert.match(objectUrl, /^blob:/);
    assert.deepEqual(harness.counts(), { refreshes: 1, uploads: 0, reads: 1 });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
});

test('a refused private photo exposes its HTTP status for diagnosis', async () => {
  const harness = mediaHarness({ downloadStatus: 404 });
  await assert.rejects(harness.media.resolveLocalImage(harness.mediaUrl), error => {
    assert.equal(error.status, 404);
    return true;
  });
});

test('photo attachment starts only when passed an already saved product', async () => {
  const actions = [];
  const context = {
    exports: {}, navigator: { onLine: true },
    require(specifier) {
      if (specifier === '../db/queries.js') return { updateProduct: async (product, data) => { actions.push(['attach', product.id, data.image_url]); } };
      if (specifier === './localMedia.js') return {
        uploadImageFile: async () => { actions.push(['upload']); return 'https://api.example.test/media/image.webp'; },
        saveLocalImage: async () => { throw new Error('Local storage unavailable'); },
      };
      throw new Error(`Unexpected import: ${specifier}`);
    },
  };
  vm.runInNewContext(ts.transpileModule(afterSaveSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  assert.equal(actions.length, 0);
  const product = { id: 'saved-product' };
  const warning = await context.exports.attachProductPhotoAfterSave(product, new Blob(['photo'], { type: 'image/jpeg' }), 'shop');
  assert.equal(warning, '');
  assert.deepEqual(actions.map(item => item[0]), ['upload', 'attach']);
  assert.equal(actions[1][1], product.id);
});
