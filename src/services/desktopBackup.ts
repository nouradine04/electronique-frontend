import database from '../db/watermelondb';
import { getDesktopVaultSnapshot, isTauriDesktop, upsertDesktopRecord } from './desktopVault';

const TABLES = [
  'local_users', 'shops', 'categories', 'products', 'sales', 'returns',
  'expenses', 'payments', 'clients', 'stock_movements', 'invoices',
] as const;

let stopSubscriptions: Array<() => void> = [];
let activeTenant = '';
let allowedShopIds = new Set<string>();

const rawOf = (record: any) => ({ ...record._raw }) as Record<string, unknown>;
const shopIdOf = (table: string, raw: Record<string, any>) =>
  table === 'shops' ? String(raw.id || '') : String(raw.shop_id || '');

function belongsToAccount(table: string, raw: Record<string, any>) {
  if (table === 'shops') return String(raw.account_id || raw.id) === activeTenant;
  return allowedShopIds.has(shopIdOf(table, raw));
}

async function mirrorRecord(table: string, record: any, changeType?: string) {
  const raw = rawOf(record);
  if (!belongsToAccount(table, raw)) return;
  const deleted = changeType === 'destroyed' || raw._status === 'deleted';
  await upsertDesktopRecord({
    collection: table,
    id: String(raw.id),
    tenantId: activeTenant,
    shopId: shopIdOf(table, raw) || null,
    payload: raw,
    updatedAt: new Date().toISOString(),
    deletedAt: deleted ? new Date().toISOString() : null,
    syncStatus: raw._status === 'synced' ? 'synced' : 'pending',
  });
}

async function refreshAllowedShops() {
  const shops = await database.get('shops').query().fetch();
  allowedShopIds = new Set(
    shops.filter((shop: any) => String(shop.accountId || shop.id) === activeTenant).map((shop: any) => shop.id),
  );
}

export async function mirrorWatermelonToDesktop(tenantId: string) {
  if (!isTauriDesktop()) return;
  activeTenant = tenantId;
  await refreshAllowedShops();
  for (const table of TABLES) {
    const records = await database.get(table).query().fetch();
    await Promise.all(records.map(record => mirrorRecord(table, record)));
  }
}

export async function startDesktopBackup(tenantId: string) {
  if (!isTauriDesktop()) return;
  stopDesktopBackup();
  activeTenant = tenantId;
  await refreshAllowedShops();
  stopSubscriptions = TABLES.map(table => {
    const subscription = database.get(table).changes.subscribe(async changes => {
      try {
        await Promise.all(changes.map(({ record, type }) => mirrorRecord(table, record, type)));
        if (table === 'shops') await refreshAllowedShops();
      } catch (error) {
        console.error('[Coffre desktop] Sauvegarde locale impossible.', error);
      }
    });
    return () => subscription.unsubscribe();
  });
  await mirrorWatermelonToDesktop(tenantId);
}

export async function startDesktopBackupForShop(shopId: string) {
  if (!isTauriDesktop()) return;
  const shop: any = await database.get('shops').find(shopId);
  await startDesktopBackup(String(shop.accountId || shop.id));
}

export function stopDesktopBackup() {
  stopSubscriptions.forEach(stop => stop());
  stopSubscriptions = [];
  activeTenant = '';
  allowedShopIds = new Set();
}

export async function restoreWatermelonFromDesktop() {
  if (!isTauriDesktop()) return 0;
  const snapshot = [];
  for (let offset = 0; ; offset += 500) {
    const page = await getDesktopVaultSnapshot(offset, 500);
    snapshot.push(...page);
    if (page.length < 500) break;
  }
  const liveRecords = snapshot.filter(record => !record.deletedAt && record.payload && record.collection);
  if (!liveRecords.length) return 0;
  const existingIds = new Map<string, Set<string>>();
  for (const table of TABLES) {
    const records = await database.get(table).query().fetch();
    existingIds.set(table, new Set(records.map((record: any) => record.id)));
  }
  let restored = 0;
  await database.write(async () => {
    const creates = [];
    for (const item of liveRecords) {
      if (!existingIds.has(item.collection) || existingIds.get(item.collection)?.has(item.id)) continue;
      const collection = database.get(item.collection);
      const raw = { ...item.payload, id: item.id } as any;
      raw._status = raw._status || (item.syncStatus === 'synced' ? 'synced' : 'created');
      raw._changed = raw._changed || '';
      creates.push(collection.prepareCreateFromDirtyRaw(raw));
      restored += 1;
    }
    if (creates.length) await database.batch(...creates);
  });
  return restored;
}
