import { Q, type Database, type Model } from '@nozbe/watermelondb';
import { createLocalId } from '../db/localId';

type Raw = Record<string, any>;
export interface OperationPayload { kind?: 'checkout' | 'stock' | 'return'; stock_before?: number; changes: Record<string, { created: Raw[]; updated: Raw[]; deleted: string[] }>; snapshots: Record<string, { created: Raw[]; updated: Raw[]; deleted: string[] }> }

// Called inside the same writer and batch as the sale. No network in checkout.
export async function prepareOperation(db: Database, shopId: string, records: Model[], options: Pick<OperationPayload, 'kind' | 'stock_before'> = { kind: 'checkout' }) {
  const snapshots: OperationPayload['snapshots'] = {};
  const all = new Map(records.map(record => [`${record.table}:${record.id}`, record]));
  for (const record of records) {
    const raw = record._raw as unknown as Raw;
    for (const [field, table] of [['category_id', 'categories'], ['client_id', 'clients']]) {
      if (!raw[field]) continue;
      const dependency = await db.get(table).find(raw[field]).catch(() => null);
      if (dependency && dependency._raw._status !== 'synced') all.set(`${table}:${dependency.id}`, dependency);
    }
  }
  if (all.size > 500) throw new Error('Ce panier est trop volumineux. Répartissez-le en plusieurs ventes.');
  const changes: OperationPayload['changes'] = {};
  for (const record of all.values()) {
    const raw = { ...record._raw } as Raw;
    const state = raw._status === 'created' ? 'created' : 'updated';
    (snapshots[record.table] ||= { created: [], updated: [], deleted: [] })[state].push(raw);
    const cloud = { ...raw };
    delete cloud._status; delete cloud._changed; delete cloud.synced;
    for (const field of ['image_url', 'logo_url']) if (cloud[field] && !/^https?:\/\//i.test(cloud[field])) delete cloud[field];
    (changes[record.table] ||= { created: [], updated: [], deleted: [] })[state].push(cloud);
  }
  const previous = await db.get('sync_operations').query(Q.where('shop_id', shopId), Q.sortBy('created_at', Q.desc), Q.take(1)).fetch();
  const createdAt = Math.max(Date.now(), Number((previous[0]?._raw as unknown as Raw)?.created_at || 0) + 1);
  const id = createLocalId();
  const journal = db.get('sync_operations').prepareCreateFromDirtyRaw({ id, shop_id: shopId,
    user_id: localStorage.getItem('currentUserId') || '', created_at: createdAt, state: 'pending', error: '',
    payload: JSON.stringify({ ...options, changes, snapshots }),
  });
  const links = [...all.values()].map(record => db.get('sync_operation_links').prepareCreateFromDirtyRaw({
    id: createLocalId(), shop_id: shopId, operation_id: id, entity_table: record.table, entity_id: record.id,
  }));
  return [journal, ...links];
}

export async function protectedEntityIds(db: Database, table: string, ids: string[]) {
  if (!ids.length) return new Set<string>();
  const links = await db.get('sync_operation_links').query(Q.where('entity_table', table), Q.where('entity_id', Q.oneOf(ids))).fetch();
  return new Set(links.map(record => (record._raw as unknown as Raw).entity_id as string));
}

export const prepareCheckoutOperation = (db: Database, shopId: string, records: Model[]) => prepareOperation(db, shopId, records);
