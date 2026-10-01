import database, { flushLocalDatabase } from '../db/watermelondb.js';
import { Q } from '@nozbe/watermelondb';
import { uploadLocalImage } from './localMedia.js';

// Les produits créés avec un stock initial passent d'abord par le journal
// d'opérations. Une ancienne opération peut avoir été confirmée sans photo :
// retrouvez ces références locales et publiez l'URL lors du push suivant.
export async function recoverLocalProductMedia(shopId) {
  const records = await database.get('products').query(
    Q.where('shop_id', shopId),
    Q.or(
      Q.where('image_url', Q.like('local-media://%')),
      Q.where('image_url', Q.like('data:image/%')),
    ),
    Q.take(50),
  ).fetch();
  let changed = false;
  let failed = 0;
  for (const record of records) {
    const original = record.imageUrl;
    try {
      const url = await uploadLocalImage(original, shopId);
      if (url === original) continue;
      await database.write(() => {
        if (record.imageUrl !== original) return;
        return record.update(item => { item.imageUrl = url; item.synced = false; });
      });
      changed = true;
    } catch (error) {
      failed += 1;
      console.warn('[Sync] Photo de produit en attente :', error.message);
    }
  }
  if (changed) await flushLocalDatabase();
  return { changed, failed };
}

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
