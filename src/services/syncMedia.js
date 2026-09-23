import database, { flushLocalDatabase } from '../db/watermelondb.js';
import { uploadLocalImage } from './localMedia.js';

export async function prepareBatchMedia(batch, shopId) {
  let changed = false;
  for (const [records, field, property] of [[batch.products, 'image_url', 'imageUrl'], [batch.shops, 'logo_url', 'logoUrl']]) {
    for (const record of records) {
      const original = record._raw[field];
      const url = await uploadLocalImage(original, shopId);
      if (url === original) continue;
      await database.write(() => {
        if (record._raw[field] !== original) return;
        return record.update(item => { item[property] = url; item.synced = false; });
      });
      changed = true;
    }
  }
  if (changed) await flushLocalDatabase();
  return changed;
}
