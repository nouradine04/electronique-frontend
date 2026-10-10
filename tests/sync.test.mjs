import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createRemoteChangesApplier } from '../src/services/remoteChanges.js';
import { deletedIdsForShop, forgetDeletedShop, markRecordDeleted } from '../src/db/deletionScope.js';
import { shouldSync } from '../src/services/syncPolicy.js';
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
const legacyStockSource = fs.readFileSync(new URL('../src/services/legacyMovementCosts.ts', import.meta.url), 'utf8');
const legacyStockJs = ts.transpileModule(legacyStockSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { completeLegacyMovementCosts } = await import('data:text/javascript;base64,' + Buffer.from(legacyStockJs).toString('base64'));
const diagnosticSource = fs.readFileSync(new URL('../src/services/syncOperationDiagnostic.ts', import.meta.url), 'utf8');
const diagnosticJs = ts.transpileModule(diagnosticSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { describeSyncFailure, syncFailureMessage } = await import('data:text/javascript;base64,' + Buffer.from(diagnosticJs).toString('base64'));
const { markLocalChangesAsSynced } = require('@nozbe/watermelondb/sync/impl');

test('sync rejection keeps a useful cause and operation reference without exposing a payload', () => {
  const failure = { status: 400, details: { code: 'SYNC_VALIDATION', table: 'stock_movements',
    issues: [{ message: 'unit_cost : champ obligatoire' }] } };
  const diagnostic = describeSyncFailure(failure, 'operation-1');
  assert.deepEqual(diagnostic, { operationId: 'operation-1', status: 400, code: 'SYNC_VALIDATION',
    table: 'stock_movements', field: 'unit_cost' });
  assert.equal(syncFailureMessage(diagnostic), 'Coût d’achat manquant dans une opération de stock.');
});

test('old initial stock operation recovers its cost without changing unrelated movements', () => {
  const product = { id: 'phone-1', unit_cost: 75000 };
  const initial = { id: 'movement-1', product_id: product.id, type: 'IN', reason: 'Stock initial' };
  const other = { id: 'movement-2', product_id: product.id, type: 'IN', reason: 'Réapprovisionnement' };
  const changes = {
    products: { created: [product], updated: [], deleted: [] },
    stock_movements: { created: [initial, other], updated: [], deleted: [] },
  };
  const completed = completeLegacyMovementCosts({ kind: 'stock', changes });
  assert.equal(completed.stock_movements.created[0].unit_cost, product.unit_cost);
  assert.equal(completed.stock_movements.created[1].unit_cost, undefined);
  assert.equal(initial.unit_cost, undefined, 'the stored operation remains untouched');
  assert.equal(completeLegacyMovementCosts({ kind: 'checkout', changes }), changes);
});

test('old checkout recovers movement cost from its sale without changing the queued payload', () => {
  const sale = { id: 'sale-1', product_id: 'phone-1', unit_cost: 75000 };
  const movement = { id: 'movement-1', product_id: sale.product_id, type: 'OUT', reason: 'Vente client' };
  const changes = {
    sales: { created: [sale], updated: [], deleted: [] },
    stock_movements: { created: [movement], updated: [], deleted: [] },
  };
  const completed = completeLegacyMovementCosts({ kind: 'checkout', changes });
  assert.equal(completed.stock_movements.created[0].unit_cost, sale.unit_cost);
  assert.equal(movement.unit_cost, undefined);
  assert.equal(completeLegacyMovementCosts({ kind: 'return', changes }), changes);
});

class Product extends Model { static table = 'products'; }

test('deleted IDs stay with their original shop until acknowledged', async () => {
  const schema = appSchema({ version: 1, tables: [tableSchema({ name: 'products', columns: [
    { name: 'shop_id', type: 'string', isIndexed: true }, { name: 'name', type: 'string' },
  ] })] });
  const adapter = new LokiAdapter({ schema, useWebWorker: false, useIncrementalIndexedDB: false,
    _testLokiAdapter: new Loki.LokiMemoryAdapter(), extraLokiOptions: { autosave: false } });
  const db = new Database({ adapter, modelClasses: [Product] });
  const products = db.get('products');
  const create = (id, shopId) => products.prepareCreateFromDirtyRaw({ id, shop_id: shopId, name: id,
    _status: 'synced', _changed: '' });
  await db.write(() => db.batch(create('a1', 'shop-a'), create('b1', 'shop-b')));
  await markRecordDeleted(db, await products.find('a1'));
  await markRecordDeleted(db, await products.find('b1'));
  const ids = await db.adapter.getDeletedRecords('products');
  assert.deepEqual(await deletedIdsForShop(db.adapter, 'products', ids, 'shop-a'), ['a1']);
  assert.deepEqual(await deletedIdsForShop(db.adapter, 'products', ids, 'shop-b'), ['b1']);
  assert.deepEqual(await deletedIdsForShop(db.adapter, 'products', ids, 'shop-c'), []);
  await db.adapter.setLocal('nstock_deleted_shop_v1:products:legacy', '');
  assert.deepEqual(await deletedIdsForShop(db.adapter, 'products', [...ids, 'legacy'], 'shop-a'), ['a1']);
  await db.adapter.destroyDeletedRecords('products', ['a1']);
  await forgetDeletedShop(db.adapter, 'products', ['a1']);
  assert.deepEqual(await deletedIdsForShop(db.adapter, 'products', ['a1'], 'shop-a'), []);
  assert.deepEqual(await deletedIdsForShop(db.adapter, 'products', await db.adapter.getDeletedRecords('products'), 'shop-b'), ['b1']);
  const unsent = await db.write(() => products.create(record => {
    record._setRaw('shop_id', 'shop-a'); record._setRaw('name', 'Unsent');
  }));
  await markRecordDeleted(db, unsent);
  assert.deepEqual(await db.adapter.getDeletedRecords('products'), ['b1'], 'an unsent creation needs no server tombstone');
});

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
    { name: 'synced', type: 'boolean' }, { name: 'image_url', type: 'string', isOptional: true },
    { name: 'version', type: 'number', isOptional: true },
  ] })] });
  const adapter = new LokiAdapter({ schema, useWebWorker: false, useIncrementalIndexedDB: false,
    _testLokiAdapter: new Loki.LokiMemoryAdapter(), extraLokiOptions: { autosave: false } });
  const db = new Database({ adapter, modelClasses: [Product] });
  let flushes = 0;
  const apply = createRemoteChangesApplier(db, async () => { flushes++; });
  const imageUrl = `https://api.example.test/media/shop/user/${'a'.repeat(64)}.webp`;
  const snapshot = quantity => ({ products: { created: [], updated: [{ id: 'phone1', name: 'Phone', quantity, image_url: imageUrl }], deleted: [] } });
  await apply(snapshot(4));
  const product = await db.get('products').find('phone1');
  assert.equal(product._raw._status, 'synced');
  await apply(snapshot(5));
  assert.equal(product._raw.quantity, 5);
  assert.equal(product._raw.image_url, imageUrl, 'a second device receives the product photo URL from the pull');
  assert.equal(product._raw._status, 'synced');
  assert.equal(product._raw._changed, '');
  const written = flushes;
  for (let i = 0; i < 20; i++) await apply(snapshot(5));
  assert.equal(flushes, written, 'identical remote data must not write');
  assert.equal(await db.get('products').query(Q.where('_status', 'updated')).fetchCount(), 0);

  await apply({ products: { created: [], updated: [{ id: 'phone1', name: 'Phone', quantity: 5, image_url: null }], deleted: [] } });
  assert.equal(product._raw.image_url, null, 'a photo removed on another device must disappear locally');

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

test('sync runs only for pending changes or an explicit event', () => {
  assert.equal(shouldSync({ pending: 0, force: false }), false);
  assert.equal(shouldSync({ pending: 1, force: false }), true);
  assert.equal(shouldSync({ pending: 0, force: true }), true);
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
