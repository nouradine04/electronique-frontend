// WatermelonDB keeps only an ID after markAsDeleted. Keep its shop in the
// adapter's existing local storage before removing the model, so a later sync
// cannot send that ID while another shop is selected.
const keyFor = (table, id) => `nstock_deleted_shop_v1:${table}:${id}`;

export async function markRecordDeleted(database, record) {
  // A record created and removed before its first push does not exist remotely.
  if (record._raw._status === 'created') {
    await database.write(() => database.batch(record.prepareDestroyPermanently()));
    return;
  }
  const shopId = record.table === 'shops' ? record.id : record._raw.shop_id;
  if (!shopId) throw new Error('Boutique introuvable pour cette suppression.');
  await database.adapter.setLocal(keyFor(record.table, record.id), String(shopId));
  await database.write(() => database.batch(record.prepareMarkAsDeleted()));
}

export async function deletedIdsForShop(adapter, table, ids, shopId) {
  if (!shopId || !ids.length) return [];
  const owners = await Promise.all(ids.map(id => adapter.getLocal(keyFor(table, id))));
  // Older tombstones without a recorded owner stay local. Guessing their shop
  // from the currently selected shop would risk a cross-shop delete.
  return ids.filter((id, index) => owners[index] === shopId);
}

export async function forgetDeletedShop(adapter, table, ids) {
  await Promise.all(ids.map(id => adapter.removeLocal(keyFor(table, id))));
}
