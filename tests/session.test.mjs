import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');

function setup() {
  const storage = new Map();
  let requests = 0;
  let reply = async () => ({ ok: true, json: async () => ({ access_token: token(900), user_id: 'u1', offline_access_until: expiry }) });
  const expiry = new Date(Date.now() + 86400000).toISOString();
  const token = seconds => `x.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })).toString('base64url')}.x`;
  const context = {
    exports: {}, require: () => ({ BACKEND_URL: 'https://api.medaaris.com' }), AbortSignal,
    window: { dispatchEvent() {}, addEventListener() {} }, Event,
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    navigator: { onLine: true },
    fetch: async () => { requests++; return reply(); },
    atob: value => Buffer.from(value, 'base64').toString(),
  };
  const source = fs.readFileSync(new URL('../src/services/session.ts', import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return { api: context.exports, storage, context, expiry, token, requests: () => requests, reply: value => { reply = value; } };
}

test('session: memory-only access token, coalesced refresh, fixed offline deadline and read-only expiry', async () => {
  const s = setup();
  await s.api.acceptSession({ access_token: s.token(-10), offline_access_until: s.expiry, user_id: 'u1' });
  assert.equal(s.storage.has('access_token'), false);
  assert.equal(s.storage.has('refresh_token'), false);
  await Promise.all(Array.from({ length: 12 }, () => s.api.ensureAccessToken()));
  assert.equal(s.requests(), 1);
  assert.equal(s.api.canWorkOffline(Date.parse(s.expiry) - 1), true);
  assert.equal(s.api.canWorkOffline(Date.parse(s.expiry)), false);
  s.context.navigator.onLine = false;
  s.api.invalidateAccessToken();
  await assert.rejects(s.api.ensureAccessToken(), /Serveur injoignable/);
  assert.equal(s.api.canWorkOffline(), true, 'network failure must not revoke offline access');
  assert.equal(s.requests(), 1, 'no network attempt when offline');
});

test('session: explicit server refusal locks local writes; no local fallback', async () => {
  const s = setup();
  await s.api.acceptSession({ access_token: s.token(-1), offline_access_until: s.expiry, user_id: 'u1' });
  s.reply(async () => ({ ok: false, status: 401, json: async () => ({ message: 'Session expirée' }) }));
  await assert.rejects(s.api.ensureAccessToken(), /Session expirée/);
  assert.equal(s.api.canWorkOffline(), false);
  assert.throws(() => s.api.assertSessionWritable(), /Reconnexion/);
  assert.ok(s.storage.has('nstock_session'), 'metadata kept to explain lock without deleting business data');
});
