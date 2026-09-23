import { prepareUpdateFromRaw } from '@nozbe/watermelondb/sync/impl/helpers.js';

const SUPPORTED_TABLES = new Set([
  'product_units', 'unit_events', 'shops', 'users', 'categories', 'products', 'clients', 'sales', 'payments',
  'stock_movements', 'returns', 'expenses', 'invoices',
]);

function sanitizedRaw(database, table, row) {
  const localTable = table === 'users' ? 'local_users' : table;
  const tableSchema = database.schema.tables[localTable];
  const raw = { id: String(row.id), _status: 'synced', _changed: '' };
  for (const column of tableSchema.columnArray) {
    let value = row[column.name];
    if (table === 'stock_movements' && column.name === 'type') value = row.movement_type ?? row.type;
    if (table === 'stock_movements' && column.name === 'date') value = row.local_timestamp ?? row.date;
    if (table === 'users' && column.name === 'account_created_at') value = row.created_at;
    if (table === 'users' && column.name === 'role') value = String(row.role || '').toLowerCase();
    if (table === 'products' && column.name === 'status' && typeof value === 'string') {
      value = value === 'ACTIVE' ? 'active' : value;
    }
    if (value === undefined || value === null) {
      value = column.isOptional ? null : column.type === 'string' ? '' : column.type === 'boolean' ? false : 0;
    }
    raw[column.name] = value;
  }
  if ('synced' in raw) raw.synced = true;
  return raw;
}

async function findExisting(collection, ids) {
  const found = new Map();
  await Promise.all(ids.map(async id => {
    try { found.set(id, await collection.find(id)); }
    catch { /* Nouvelle ligne distante. */ }
  }));
  return found;
}

export function createRemoteChangesApplier(database, flushLocalDatabase) {
  return (changes = {}) => applyRemoteChanges(database, flushLocalDatabase, changes);
}

async function applyRemoteChanges(database, flushLocalDatabase, changes) {
  let changed = false;
  for (const [table, changeSet] of Object.entries(changes)) {
    if (!SUPPORTED_TABLES.has(table) || !changeSet) continue;
    const incoming = [...(changeSet.created || []), ...(changeSet.updated || [])];
    const deletedIds = (changeSet.deleted || []).map(String);
    const ids = [...new Set([...incoming.map(row => String(row.id)), ...deletedIds])];
    if (!ids.length) continue;
    const collection = database.get(table === 'users' ? 'local_users' : table);
    const existing = await findExisting(collection, ids);
    const acknowledgedRemoteDeletes = [];

    await database.write(async () => {
      const operations = [];
      for (const row of incoming) {
        const id = String(row.id);
        const current = existing.get(id);
        const raw = sanitizedRaw(database, table, row);
        if (!current) {
          operations.push(collection.prepareCreateFromDirtyRaw(raw));
        } else if (current._raw._status === 'synced') {
          for (const key of Object.keys(raw)) {
            if (key === 'image_url' && String(current._raw.image_url || '').startsWith('data:image') && !row.image_url) raw[key] = current._raw[key];
            if (table === 'users' && ['password_hash', 'password_salt'].includes(key) && row.password_algorithm !== 'PBKDF2-SHA256-210000') raw[key] = current._raw[key];
          }
          // Apply server snapshots without recording a new local change.
          // Watermelon also skips identical snapshots without writing them.
          const operation = prepareUpdateFromRaw(current._raw, raw, collection);
          if (operation) operations.push(operation);
        }
      }
      for (const id of deletedIds) {
        const current = existing.get(id);
        if (current && current._raw._status === 'synced') {
          operations.push(current.prepareMarkAsDeleted());
          acknowledgedRemoteDeletes.push(id);
        }
      }
      if (operations.length) await database.batch(...operations);
      if (operations.length) changed = true;
    });
    // La suppression est déjà confirmée par le serveur. Le tombstone local peut
    // donc être nettoyé sans être renvoyé au prochain push.
    if (acknowledgedRemoteDeletes.length) {
      await database.adapter.destroyDeletedRecords(collection.table, acknowledgedRemoteDeletes);
    }
  }
  if (changed) await flushLocalDatabase();
}
