import { Q, type Model } from '@nozbe/watermelondb';
import database from '../db/watermelondb';
import { markAsSynced } from '../db/queries';
import { requestJson } from './apiClient';
import type { OperationPayload } from './operationQueue';
import type { PushChangesResponse } from '../models/sync';

const raw = (record: Model) => record._raw as unknown as Record<string, any>;

export async function pushPendingOperations(shopId: string, retryBlocked = false) {
  const collection = database.get('sync_operations');
  const scope = [Q.where('shop_id', shopId), Q.where('user_id', localStorage.getItem('currentUserId') || '')];
  if (retryBlocked) {
    const blocked = await collection.query(...scope, Q.where('state', 'blocked')).fetch();
    if (blocked.length) await database.write(async () => { await database.batch(...blocked.map(record => record.prepareUpdate(item => { raw(item).state = 'pending'; raw(item).error = ''; }))); });
  }
  const operations = await collection.query(...scope, Q.where('state', 'pending'), Q.sortBy('created_at', Q.asc), Q.sortBy('id', Q.asc), Q.take(20)).fetch();
  for (const operation of operations) {
    const payload: OperationPayload = JSON.parse(String(raw(operation).payload));
    const blockedLinks = await database.get('sync_operations').query(...scope, Q.where('state', 'blocked')).fetchIds();
    if (blockedLinks.length) {
      const links = await database.get('sync_operation_links').query(Q.where('operation_id', Q.oneOf(blockedLinks))).fetch();
      const blockedKeys = new Set(links.map(link => `${raw(link).entity_table}:${raw(link).entity_id}`));
      const dependsOnBlocked = Object.entries(payload.snapshots).some(([table, changes]) => [...changes.created, ...changes.updated].some(raw => blockedKeys.has(`${table}:${raw.id}`)));
      if (dependsOnBlocked) {
        await database.write(() => operation.update(item => { raw(item).state = 'blocked'; raw(item).error = 'Une opération liée attend une correction.'; }));
        continue;
      }
    }
    const baseVersions: Record<string, Record<string, number>> = {};
    const affectedRecords = [];
    for (const [table, changes] of Object.entries(payload.snapshots)) {
      baseVersions[table] = {};
      for (const snapshot of [...changes.created, ...changes.updated]) {
        const record = await database.get(table).find(snapshot.id);
        affectedRecords.push(record);
        baseVersions[table][snapshot.id] = Number(raw(record).version) || 0;
      }
    }
    let ack: PushChangesResponse;
    try {
      ack = await requestJson<PushChangesResponse>(`/sync/operations?shopId=${encodeURIComponent(shopId)}`, {
        method: 'POST', body: JSON.stringify({ id: operation.id, kind: payload.kind || 'checkout', stock_before: payload.stock_before, changes: payload.changes, base_versions: baseVersions }),
      });
    } catch (error) {
      if (![400, 403, 409].includes(error.status)) throw error;
      await database.write(() => operation.update(item => { raw(item).state = 'blocked'; raw(item).error = String(error.message); }));
      continue;
    }
    const total = Object.values(payload.snapshots).reduce((n, group) => n + group.created.length + group.updated.length, 0);
    if (ack.has_more || ack.processed !== total || Object.values(ack.rejected_ids || {}).some(ids => ids.length)) throw new Error('Confirmation incomplète. L’opération reste en attente.');
    await markAsSynced({total, syncSnapshot:{ changes: payload.snapshots, affectedRecords }}, {}, ack.versions);
    const links = await database.get('sync_operation_links').query(Q.where('operation_id', operation.id)).fetch();
    // Only the local delivery journal is deleted, after the server confirmation.
    await database.write(async () => { await database.batch(operation.prepareDestroyPermanently(), ...links.map(link => link.prepareDestroyPermanently())); });
  }
  const blocked = await collection.query(...scope, Q.where('state', 'blocked')).fetchCount();
  return { blocked, remaining: await collection.query(...scope).fetchCount() };
}

export function pendingOperationCount(shopId: string) {
  return database.get('sync_operations').query(Q.where('shop_id', shopId), Q.where('user_id', localStorage.getItem('currentUserId') || ''), Q.where('state', 'pending')).fetchCount();
}
