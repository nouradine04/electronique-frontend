import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('service worker displays only the subscribed account alert and forgets account on logout', async () => {
  const handlers = {};
  const stored = new Map();
  const displayed = [];
  const worker = { location: { origin: 'https://shop.example' }, addEventListener: (type, fn) => { handlers[type] = fn; }, registration: { showNotification: async (...args) => displayed.push(args) } };
  const cache = { put: async (key, response) => stored.set(key, await response.text()), match: async key => stored.has(key) ? new Response(stored.get(key)) : undefined, delete: async key => stored.delete(key) };
  vm.runInNewContext(readFileSync(new URL('../public/push-events.js', import.meta.url), 'utf8'), { self: worker, caches: { open: async () => cache }, URL, Response });
  async function emit(type, data) { let promise; handlers[type]({ data, waitUntil: value => { promise = value; } }); await promise; }
  await emit('message', { type: 'PUSH_ACCOUNT', userId: 'owner1' });
  await emit('push', { json: () => ({ userId: 'other', body: 'Hidden' }) });
  assert.equal(displayed.length, 0);
  await emit('push', { json: () => ({ userId: 'owner1', body: 'Stock', tag: 'event1' }) });
  assert.equal(displayed.length, 1);
  assert.equal(displayed[0][1].tag, 'event1');
  assert.equal(displayed[0][1].renotify, false);
  await emit('message', { type: 'PUSH_ACCOUNT', userId: null });
  await emit('push', { json: () => ({ userId: 'owner1', body: 'Stock' }) });
  assert.equal(displayed.length, 1);
});
