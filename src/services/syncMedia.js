import database, { flushLocalDatabase } from '../db/watermelondb.js';
import { Q } from '@nozbe/watermelondb';
import { uploadLocalImage } from './localMedia.js';

const retryAfter = new Map();
const MEDIA_RETRY_DELAY = 5 * 60 * 1000;
const canRetry = reference => Date.now() >= (retryAfter.get(reference) || 0);
function holdPhoto(reference) {
  retryAfter.set(reference, Date.now() + MEDIA_RETRY_DELAY);
  if (retryAfter.size > 500) retryAfter.delete(retryAfter.keys().next().value);
}

// Les produits créés avec un stock initial passent d'abord par le journal
// d'opérations. Une ancienne opération peut avoir été confirmée sans photo :
// retrouvez ces références locales et publiez l'URL lors du push suivant.
export async function recoverLocalProductMedia(shopId) {
  const products = await database.get('products').query(
    Q.where('shop_id', shopId),
    Q.or(
      Q.where('image_url', Q.like('local-media://%')),
      Q.where('image_url', Q.like('data:image/%')),
    ),
    Q.take(50),
  ).fetch();
  const shops = await database.get('shops').query(
    Q.where('id', shopId),
    Q.or(Q.where('logo_url', Q.like('local-media://%')), Q.where('logo_url', Q.like('data:image/%'))),
  ).fetch();
  let changed = false;
  let failed = 0;
  const failedRefs = new Set();
  for (const [record, property] of [...products.map(record => [record, 'imageUrl']), ...shops.map(record => [record, 'logoUrl'])]) {
    const original = record[property];
    if (!canRetry(original)) { failed += 1; failedRefs.add(original); continue; }
    try {
      const url = await uploadLocalImage(original, shopId);
      if (url === original) continue;
      await database.write(() => {
        if (record[property] !== original) return;
        return record.update(item => { item[property] = url; item.synced = false; });
      });
      changed = true;
    } catch (error) {
      failed += 1;
      failedRefs.add(original);
      holdPhoto(original);
      console.warn('[Sync] Photo en attente :', error.message);
    }
  }
  if (changed) await flushLocalDatabase();
  return { changed, failed, failedRefs };
}

export async function prepareBatchMedia(batch, shopId, failedRefs = new Set()) {
  let changed = false;
  let failed = 0;
  for (const [records, field, property] of [[batch.products, 'image_url', 'imageUrl'], [batch.shops, 'logo_url', 'logoUrl']]) {
    for (const record of records) {
      const original = record._raw[field];
      if (failedRefs.has(original) || !canRetry(original)) continue;
      try {
        const url = await uploadLocalImage(original, shopId);
        if (url === original) continue;
        await database.write(() => {
          if (record._raw[field] !== original) return;
          return record.update(item => { item[property] = url; item.synced = false; });
        });
        changed = true;
      } catch (error) {
        failed += 1;
        failedRefs.add(original);
        holdPhoto(original);
        console.warn('[Sync] Photo en attente :', error.message);
      }
    }
  }
  if (changed) await flushLocalDatabase();
  return { changed, failed };
}
