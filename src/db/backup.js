import database from './watermelondb.js';
import { deriveKey, encryptText, decryptText, decryptSync } from '../utils/crypto.js';

export async function encodeLocalBackup(backup) {
  const password = sessionStorage.getItem('encryption_pin');
  if (!password) throw new Error('Reconnectez-vous pour chiffrer la sauvegarde avec votre mot de passe.');
  const ciphertext = await encryptText(JSON.stringify(backup), await deriveKey(password));
  return JSON.stringify({ format: 'nstock-aes-gcm', ciphertext });
}

export async function decodeLocalBackup(text) {
  let envelope;
  try { envelope = JSON.parse(text); } catch { /* Legacy backup below. */ }
  if (envelope?.format === 'nstock-aes-gcm') {
    const password = sessionStorage.getItem('encryption_pin');
    if (!password) throw new Error('Reconnectez-vous avec le mot de passe de la sauvegarde.');
    return JSON.parse(await decryptText(envelope.ciphertext, await deriveKey(password)));
  }
  try { return JSON.parse(decodeURIComponent(escape(atob(text)))); }
  catch { return JSON.parse(decryptSync(text, sessionStorage.getItem('encryption_pin'))); }
}

export async function exportLocalBackup() {
  const data = await database.read(async () => {
    const data = {};
    for (const table of Object.keys(database.schema.tables)) {
      data[table] = (await database.get(table).query().fetch()).map(record => ({ ...record._raw }));
    }
    return data;
  });
  return { version: 2, timestamp: new Date().toISOString(), data };
}

export async function restoreLocalBackup(backup) {
  if (![1, 2].includes(backup?.version) || !backup.data || typeof backup.data !== 'object') {
    throw new Error('Format de sauvegarde invalide.');
  }
  const data = { ...backup.data };
  // Compatibilité avec les sauvegardes créées pendant la courte phase où les
  // images étaient séparées de WatermelonDB.
  if (Array.isArray(backup.media) && backup.media.length > 0) {
    const mediaByReference = new Map(
      backup.media
        .filter(item => item?.id && typeof item.dataUrl === 'string')
        .map(item => [`nstock-media://${item.id}`, item.dataUrl]),
    );
    for (const row of data.products || []) {
      if (mediaByReference.has(row.image_url)) row.image_url = mediaByReference.get(row.image_url);
    }
    for (const row of data.shops || []) {
      if (mediaByReference.has(row.logo_url)) row.logo_url = mediaByReference.get(row.logo_url);
    }
  }
  if (data.movements) {
    data.stock_movements = data.movements;
    delete data.movements;
  }
  // Validate everything before preparing any change to the local database.
  for (const [table, rows] of Object.entries(data)) {
    const schema = database.schema.tables[table];
    if (!schema || !Array.isArray(rows)) throw new Error('Table de sauvegarde invalide.');
    const ids = new Set();
    for (const row of rows) {
      if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id)) throw new Error('Identifiant invalide ou dupliqué.');
      ids.add(row.id);
      for (const column of Object.values(schema.columns)) {
        const value = row[column.name];
        if (value == null && column.isOptional) continue;
        if (column.name === 'synced') continue;
        if (typeof value !== column.type || (column.type === 'number' && !Number.isFinite(value))) {
          throw new Error(`Valeur invalide : ${table}.${column.name}`);
        }
      }
    }
  }
  await database.write(async () => {
    const existing = {};
    for (const table of Object.keys(data)) {
      existing[table] = new Map((await database.get(table).query().fetch()).map(r => [r.id, r]));
    }
    const operations = [];
    for (const [table, rows] of Object.entries(data)) {
      const collection = database.get(table);
      for (const row of rows) {
        const fill = record => {
          for (const column of Object.values(collection.schema.columns)) {
            record._setRaw(column.name, column.name === 'synced' ? false : row[column.name]);
          }
        };
        const record = existing[table].get(row.id);
        operations.push(record ? record.prepareUpdate(fill) : collection.prepareCreate(r => {
          r._raw.id = row.id;
          fill(r);
        }));
      }
    }
    await database.batch(operations);
  });
}
