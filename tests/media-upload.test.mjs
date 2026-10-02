import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = fs.readFileSync(new URL('../src/services/localMedia.js', import.meta.url), 'utf8');

function mediaHarness({ downloadStatus = 200 } = {}) {
  let token = 'expired';
  let refreshes = 0;
  let uploads = 0;
  let reads = 0;
  const stored = new Map();
  const mediaUrl = `https://api.example.test/media/shop/user/${'a'.repeat(64)}.webp`;
  const context = {
    exports: {}, URL, Response, Blob, crypto: globalThis.crypto,
    localStorage: { getItem: () => 'user' },
    location: { origin: 'https://app.example.test' },
    caches: { open: async () => ({
      put: async (key, response) => { stored.set(String(key), response); },
      match: async key => stored.get(String(key)),
      keys: async () => [...stored.keys()],
      delete: async key => stored.delete(String(key)),
    }) },
    require(specifier) {
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
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  return { media: context.exports, stored, mediaUrl, counts: () => ({ refreshes, uploads, reads }) };
}

test('a product photo is linked only after authenticated upload and processed-image read', async () => {
  const harness = mediaHarness();
  const url = await harness.media.uploadLocalImage('data:image/webp;base64,b3JpZ2luYWw=', 'shop');
  assert.equal(url, harness.mediaUrl);
  assert.deepEqual(harness.counts(), { refreshes: 1, uploads: 1, reads: 1 });
  assert.equal(await harness.stored.get(url).text(), 'processed');
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
