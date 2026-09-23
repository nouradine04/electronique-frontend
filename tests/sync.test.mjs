import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createRemoteChangesApplier } from '../src/services/remoteChanges.js';
import { shouldSync, retryDelay, REMOTE_REFRESH_MS, reconnectDelay, jitteredRetryDelay } from '../src/services/syncPolicy.js';
import { prepareLocalUser } from '../src/services/prepareLocalUser.js';
import LocalUser from '../src/db/models/LocalUser.js';
import { localUserSchema } from '../src/db/schema.js';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { Database, Model, appSchema, tableSchema, Q } = require('@nozbe/watermelondb');
const LokiAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
const Loki = require('lokijs');
const ts = require('typescript');
const versionsSource = fs.readFileSync(new URL('../src/services/acknowledgeVersions.ts', import.meta.url), 'utf8');
const versionsJs = ts.transpileModule(versionsSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { acknowledgeVersions } = await import('data:text/javascript;base64,' + Buffer.from(versionsJs).toString('base64'));
const { markLocalChangesAsSynced } = require('@nozbe/watermelondb/sync/impl');

class Product extends Model { static table = 'products'; }

test('cloud account restoration preserves the server ID without treating it as a schema column', async () => {
  const schema = appSchema({ version: 1, tables: [tableSchema(localUserSchema)] });
  const adapter = new LokiAdapter({ schema, useWebWorker: false, useIncrementalIndexedDB: false,
    _testLokiAdapter: new Loki.LokiMemoryAdapter(), extraLokiOptions: { autosave: false } });
  const db = new Database({ adapter, modelClasses: [LocalUser] });
  const users = db.get('local_users');
  const data = { id: 'remote-user-123', shop_id: 'remote-shop', name: 'Test',
    email: 'test@example.com', role: 'owner', is_active: true,
    password_hash: 'test-hash', password_salt: 'test-salt', synced: true };
  await db.write(async () => { await db.batch(prepareLocalUser(users, data)); });
  const restored = await users.find(data.id);
  assert.equal(restored.email, data.email);
  assert.equal(restored.shopId, data.shop_id);
  assert.equal(restored.passwordHash, data.password_hash);
  assert.equal(restored.isActive, true);
  await db.write(async () => {
    const { id, ...localData } = data;
    await db.batch(prepareLocalUser(users, localData));
  });
  const all = await users.query().fetch();
  assert.equal(all.length, 2);
  assert.ok(all.find(user => user.id !== data.id)?.id, 'local registration still generates an ID');
});

test('real Watermelon: remote updates stay synced, replay is read-only, local edits survive', async () => {
  const schema = appSchema({ version: 1, tables: [tableSchema({ name: 'products', columns: [
    { name: 'name', type: 'string' }, { name: 'quantity', type: 'number' },
    { name: 'synced', type: 'boolean' }, { name: 'image_url', type: 'string' },
    { name: 'version', type: 'number', isOptional: true },
  ] })] });
  const adapter = new LokiAdapter({ schema, useWebWorker: false, useIncrementalIndexedDB: false,
    _testLokiAdapter: new Loki.LokiMemoryAdapter(), extraLokiOptions: { autosave: false } });
  const db = new Database({ adapter, modelClasses: [Product] });
  let flushes = 0;
  const apply = createRemoteChangesApplier(db, async () => { flushes++; });
  const snapshot = quantity => ({ products: { created: [], updated: [{ id: 'phone1', name: 'Phone', quantity }], deleted: [] } });
  await apply(snapshot(4));
  const product = await db.get('products').find('phone1');
  assert.equal(product._raw._status, 'synced');
  await apply(snapshot(5));
  assert.equal(product._raw.quantity, 5);
  assert.equal(product._raw._status, 'synced');
  assert.equal(product._raw._changed, '');
  const written = flushes;
  for (let i = 0; i < 20; i++) await apply(snapshot(5));
  assert.equal(flushes, written, 'identical remote data must not write');
  assert.equal(await db.get('products').query(Q.where('_status', 'updated')).fetchCount(), 0);

  await db.write(() => product.update(p => p._setRaw('quantity', 6)));
  assert.equal(product._raw._status, 'updated');
  await apply(snapshot(5));
  assert.equal(product._raw.quantity, 6, 'pending local changes must survive pull');
  const sent = { changes: { products: { created: [], updated: [{ ...product._raw }], deleted: [] } }, affectedRecords: [product] };
  await db.write(() => product.update(p => p._setRaw('quantity', 7)));
  await markLocalChangesAsSynced(db, sent);
  assert.equal(product._raw._status, 'updated', 'edit made during push must remain pending');
  const changedFields = product._raw._changed;
  await acknowledgeVersions(db, { products: { phone1: 2 } });
  assert.equal(product._raw.version, 2);
  assert.equal(product._raw._status, 'updated');
  assert.equal(product._raw._changed, changedFields);
  assert.equal(product._raw.quantity, 7, 'version acknowledgement preserves a newer local sale');
  sent.changes.products.updated = [{ ...product._raw }];
  await markLocalChangesAsSynced(db, sent);
  await apply(snapshot(7));
  assert.equal(product._raw._status, 'synced');
  await apply({ products: { created: [], updated: [], deleted: ['phone1'] } });
  assert.deepEqual(await db.adapter.getDeletedRecords('products'), []);
});

test('idle network checks are throttled; pending changes and retries follow policy', () => {
  const base = { pending: 0, lastSuccess: 1000000, retryAt: 0, force: false, visible: true };
  for (let elapsed = 15000; elapsed < REMOTE_REFRESH_MS; elapsed += 15000) {
    assert.equal(shouldSync({ ...base, now: base.lastSuccess + elapsed }), false);
  }
  assert.equal(shouldSync({ ...base, now: base.lastSuccess + REMOTE_REFRESH_MS }), true);
  assert.equal(shouldSync({ ...base, now: base.lastSuccess + REMOTE_REFRESH_MS, visible: false }), false);
  assert.equal(shouldSync({ ...base, now: base.lastSuccess + 15000, pending: 1 }), true);
  assert.equal(shouldSync({ ...base, now: 1000001, force: true }), true);
  assert.equal(shouldSync({ ...base, now: 1000001, retryAt: 1000002, pending: 1 }), false);
  assert.deepEqual([1, 2, 3, 100].map(retryDelay), [15000, 30000, 60000, 300000]);
});

test('conflict registry survives reload, remains shop-scoped and deduplicates IDs', async () => {
  const source = fs.readFileSync(new URL('../src/services/syncConflicts.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const registry = await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  const stored = new Map();
  const previous = globalThis.localStorage;
  globalThis.localStorage = {getItem:key=>stored.get(key),setItem:(key,value)=>stored.set(key,value),removeItem:key=>stored.delete(key)};
  try {
    registry.saveSyncConflicts('tenant:a', {}, {products:['p1']});
    registry.saveSyncConflicts('tenant:a',registry.readSyncConflicts('tenant:a'),{products:['p1','p2']});
    assert.deepEqual(registry.readSyncConflicts('tenant:a'),{products:['p1','p2']});
    assert.deepEqual(registry.readSyncConflicts('tenant:b'),{});
    registry.clearSyncConflicts('tenant:a');
    assert.deepEqual(registry.readSyncConflicts('tenant:a'),{});
  } finally { globalThis.localStorage=previous; }
});


test('reconnections and retries are spread across devices without waiting for a full batch', () => {
  assert.equal(reconnectDelay(() => 0), 500);
  assert.equal(reconnectDelay(() => .999), 4995);
  assert.equal(jitteredRetryDelay(1, () => 0), 12000);
  assert.equal(jitteredRetryDelay(1, () => 1), 18000);
  assert.ok(shouldSync({pending:1,lastSuccess:1000,retryAt:0,now:1100,force:false,visible:true}));
  assert.equal(shouldSync({pending:1,lastSuccess:1000,retryAt:2000,now:1100,force:false,visible:true}),false);
});


test('serialization uses the captured stock even if a checkout changes the live model during upload', async () => {
  const code=ts.transpileModule(fs.readFileSync(new URL('../src/services/syncSnapshot.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const {snapshotBatch}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  const model={id:'p1',_raw:{id:'p1',quantity:5,version:1},get quantity(){return this._raw.quantity;}};
  const captured={...model._raw};
  const batch={products:[model],changeStates:{products:{created:[model],updated:[],deleted:[]}},syncSnapshot:{changes:{products:{created:[captured],updated:[],deleted:[]}}}};
  model._raw.quantity=4;
  const frozen=snapshotBatch(batch);
  assert.equal(frozen.products[0].quantity,5);
  assert.equal(batch.products[0].quantity,4);
  assert.equal(frozen.changeStates.products.created[0]._raw.quantity,5);
});
