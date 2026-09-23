import { prepareReceivedUnits, validateSelectedUnits, prepareUnitEvent, unitRaw } from '../services/productUnits';
/**
 * WatermelonDB Query & Mutation helpers
 *
 * Offline-first: toutes les opérations sont locales.
 * synced = false signale qu'il faut synchroniser avec le backend NestJS.
 */
import { Q, columnName } from '@nozbe/watermelondb';
import { markLocalChangesAsSynced } from '@nozbe/watermelondb/sync/impl';
import { protectedEntityIds, prepareOperation } from '../services/operationQueue';
import { syncDependencies } from '../services/syncConflicts';
import { acknowledgeVersions } from '../services/acknowledgeVersions';
import database from './watermelondb';
export { database };

// ─── Collections ─────────────────────────────────────────────────────────────
export const shops = database.get('shops');
export const categories = database.get('categories');
export const products = database.get('products');
export const sales = database.get('sales');
export const clients = database.get('clients');
export const payments = database.get('payments');
export const stockMovements = database.get('stock_movements');
export const invoices = database.get('invoices');
export const returns = database.get('returns');
export const expenses = database.get('expenses');
export const localUsers = database.get('local_users');

const syncCollections = [
  { table: 'shops', key: 'shops', collection: shops, shopColumn: 'id' },
  { table: 'users', localTable: 'local_users', key: 'users', collection: localUsers, shopColumn: 'shop_id', ownerOnly: true },
  { table: 'categories', key: 'categories', collection: categories, shopColumn: 'shop_id' },
  { table: 'products', key: 'products', collection: products, shopColumn: 'shop_id' },
  { table: 'clients', key: 'clients', collection: clients, shopColumn: 'shop_id' },
  { orderColumn: 'date', table: 'sales', key: 'sales', collection: sales, shopColumn: 'shop_id' },
  { table: 'payments', key: 'payments', collection: payments, shopColumn: 'shop_id' },
  { orderColumn: 'date', table: 'stock_movements', key: 'stockMovements', collection: stockMovements, shopColumn: 'shop_id' },
  { table: 'returns', key: 'returns', collection: returns, shopColumn: 'shop_id' },
  { table: 'expenses', key: 'expenses', collection: expenses, shopColumn: 'shop_id' },
  { table: 'invoices', key: 'invoices', collection: invoices, shopColumn: 'shop_id' },
];

const statusColumn = columnName('_status');

function syncScope(config, shopId) {
  return shopId ? [Q.where(config.shopColumn, shopId)] : [];
}

function eligibleSyncScope(config, shopId, excluded) {
  const conditions = syncScope(config, shopId);
  if (excluded[config.table]?.length) conditions.push(Q.where('id', Q.notIn(excluded[config.table])));
  for (const [column, table] of Object.entries(syncDependencies[config.table] || {})) {
    if (excluded[table]?.length) conditions.push(Q.or(Q.where(column, null), Q.where(column, Q.notIn(excluded[table]))));
  }
  return conditions;
}

// ─── SHOPS ────────────────────────────────────────────────────────────────────
export const queryAllShops = () => shops.query();

export const createShop = async (data) => {
  return database.write(async () => {
    return shops.create(shop => {
      shop.name = data.name;
      shop.address = data.address || '';
      shop.phone = data.phone || '';
      shop.nif = data.nif || '';
      shop.email = data.email || '';
      shop.code = data.code || '';
      shop.subscriptionPlan = data.subscription_plan || 'standard';
      shop.accountId = data.account_id || shop.id;
      shop.synced = false;
    });
  });
};

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
export const queryCategories = (shopId) =>
  categories.query(Q.where('shop_id', shopId));

export const createCategory = async (shopId, name) => {
  return database.write(async () => {
    return categories.create(cat => {
      cat.shopId = shopId;
      cat.name = name;
      cat.synced = false;
    });
  });
};

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const queryProducts = (shopId) =>
  products.query(Q.where('shop_id', shopId));

export const queryProductsInStock = (shopId) =>
  products.query(
    Q.where('shop_id', shopId),
    Q.where('quantity', Q.gt(0))
  );

export const createProduct = async (data) => {
  return database.write(async () => {
    const quantity = Number(data.quantity || 0);
    if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error('Quantité invalide.');
    const tracking = data.tracking_mode || 'QUANTITY';
    if (!['QUANTITY', 'IMEI', 'SERIAL'].includes(tracking)) throw new Error('Suivi invalide.');
    const product = products.prepareCreate(p => {
      p.trackingMode = tracking;
      p.shopId = data.shop_id;
      p.categoryId = data.category_id || '';
      p.name = data.name;
      p.description = data.description || '';
      p.sku = data.sku || '';
      p.price = Number(data.price) || 0;
      p.quantity = Number(data.quantity) || 0;
      p.minStock = Number(data.min_stock) || 0;
      p.status = data.status || 'active';
      p.imageUrl = data.image_url || '';
      p.location = data.location || '';
      p.unitCost = data.unit_cost || 0;
      p.catalogId = data.catalog_id || '';
      p.catalogSource = data.catalog_source || 'manual';
      p.brand = data.brand || '';
      p.model = data.model || '';
      p.ram = data.ram || '';
      p.storageCapacity = data.storage_capacity || '';
      p.color = data.color || '';
      p.simType = data.sim_type || '';
      p.network = data.network || '';
      p.battery = data.battery || '';
      p.screen = data.screen || '';
      p.operatingSystem = data.operating_system || '';
      p.releaseDate = data.release_date || '';
      p.specsJson = data.specs_json || '';
      p.addedBy = data.added_by || '';
      p.addedAt = data.added_at || new Date().toISOString();
      p.synced = false;
    });
    const units = await prepareReceivedUnits(database, product, data.identifiers || '', quantity);
    const operations = [product, ...units];
    if (quantity > 0) {
      operations.push(stockMovements.prepareCreate(m => {
        m.shopId = data.shop_id; m.productId = product.id; m.type = 'IN'; m.quantity = quantity;
        m.reason = 'Stock initial'; m.date = new Date().toISOString(); m.userName = data.added_by || ''; m.synced = false;
      }));
      const journal = await prepareOperation(database, data.shop_id, operations, { kind: 'stock', stock_before: 0 });
      operations.push(...journal);
    }
    await database.batch(...operations);
    return product;
  });
};

export const updateProduct = async (product, data) => {
  return database.write(async () => {
    product = await products.find(product.id);
    if (product.trackingMode !== 'QUANTITY' && data.quantity !== undefined && Number(data.quantity) !== product.quantity) throw new Error('Modifiez les unités identifiées depuis le stock.');
    if (data.tracking_mode && data.tracking_mode !== product.trackingMode) throw new Error('Le mode de suivi ne peut pas être changé sur une fiche existante.');
    return product.update(p => {
      if (data.name !== undefined) p.name = data.name;
      if (data.description !== undefined) p.description = data.description;
      if (data.price !== undefined) p.price = Number(data.price);
      if (data.quantity !== undefined) p.quantity = Number(data.quantity);
      if (data.min_stock !== undefined) p.minStock = Number(data.min_stock);
      if (data.status !== undefined) p.status = data.status;
      if (data.category_id !== undefined) p.categoryId = data.category_id;
      if (data.location !== undefined) p.location = data.location;
      if (data.image_url !== undefined) p.imageUrl = data.image_url;
      if (data.unit_cost !== undefined) p.unitCost = Number(data.unit_cost);
      if (data.catalog_id !== undefined) p.catalogId = data.catalog_id;
      if (data.catalog_source !== undefined) p.catalogSource = data.catalog_source;
      if (data.brand !== undefined) p.brand = data.brand;
      if (data.model !== undefined) p.model = data.model;
      if (data.ram !== undefined) p.ram = data.ram;
      if (data.storage_capacity !== undefined) p.storageCapacity = data.storage_capacity;
      if (data.color !== undefined) p.color = data.color;
      if (data.sim_type !== undefined) p.simType = data.sim_type;
      if (data.network !== undefined) p.network = data.network;
      if (data.battery !== undefined) p.battery = data.battery;
      if (data.screen !== undefined) p.screen = data.screen;
      if (data.operating_system !== undefined) p.operatingSystem = data.operating_system;
      if (data.release_date !== undefined) p.releaseDate = data.release_date;
      if (data.specs_json !== undefined) p.specsJson = data.specs_json;
      if (data.added_by !== undefined) p.addedBy = data.added_by;
      if (data.added_at !== undefined) p.addedAt = data.added_at;
      p.synced = false;
    });
  });
};

export const decrementProductStock = async (product, qty) => {
  return database.write(async () => {
    return product.update(p => {
      p.quantity = Math.max(0, p.quantity - qty);
      p.synced = false;
    });
  });
};

export const deleteProduct = async (product) => {
  return database.write(async () => {
    return product.update(record => {
      record.status = 'ARCHIVED';
      record.synced = false;
    });
  });
};

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
export const queryClients = (shopId) =>
  clients.query(Q.where('shop_id', shopId));

export const createClient = async (data) => {
  return database.write(async () => {
    return clients.create(c => {
      c.shopId = data.shop_id;
      c.name = data.name;
      c.phone = data.phone || '';
      c.email = data.email || '';
      c.synced = false;
    });
  });
};

// ─── SALES ────────────────────────────────────────────────────────────────────
export const querySales = (shopId) =>
  sales.query(Q.where('shop_id', shopId), Q.sortBy('date', Q.desc));

export const createSale = async (data) => {
  return database.write(async () => {
    return sales.create(s => {
      s.shopId = data.shop_id;
      s.productId = data.product_id;
      s.clientId = data.client_id || '';
      s.quantity = Number(data.quantity);
      s.totalPrice = Number(data.total_price);
      s.paymentMethod = data.payment_method;
      s.date = data.date || new Date().toISOString();
      s.sellerName = data.seller_name || '';
      s.sellerRole = data.seller_role || 'manager';
      s.unitCost = data.unit_cost || 0;
      s.returnedQuantity = data.returned_quantity || 0;
      s.refundedAmount = data.refunded_amount || 0;
      s.synced = false;
    });
  });
};

// ─── RETURNS ─────────────────────────────────────────────────────────────────
export const queryReturns = (shopId) =>
  returns.query(Q.where('shop_id', shopId), Q.sortBy('date', Q.desc));

export const queryReturnsBySale = (saleId) =>
  returns.query(Q.where('sale_id', saleId), Q.sortBy('date', Q.desc));

export const processSaleReturn = async ({
  sale,
  product,
  shop_id,
  quantity,
  reason,
  resolution = 'REFUND',
  restock = false,
  refund_amount = 0,
  processed_by = '',
  authorized_seller = '',
  unit_ids = [],
}) => {
  const returnedQuantity = Number(quantity);
  const refundAmount = Number(refund_amount) || 0;

  if (!sale || !product) throw new Error('Vente ou produit introuvable.');
  const expectedSeller = String(authorized_seller || '').trim().toLowerCase();
  const saleSeller = String(sale.sellerName || sale.seller_name || '').trim().toLowerCase();
  if (!expectedSeller || !saleSeller || expectedSeller !== saleSeller) {
    throw new Error('Vous ne pouvez enregistrer un retour que sur une vente que vous avez faite.');
  }
  if (!Number.isInteger(returnedQuantity) || returnedQuantity <= 0) {
    throw new Error('La quantité retournée doit être un nombre entier positif.');
  }
  if (!String(reason || '').trim()) throw new Error('Le motif du retour est obligatoire.');
  if (refundAmount < 0) throw new Error('Le remboursement ne peut pas être négatif.');
  if (resolution === 'REFUND' && refundAmount <= 0) {
    throw new Error('Un retour avec remboursement doit retirer un montant positif.');
  }

  return database.write(async () => {
    if (sale.productId !== product.id || product.shopId !== sale.shopId || (shop_id && shop_id !== sale.shopId)) throw new Error('Vente et produit incompatibles.');
    const existingReturns = await queryReturnsBySale(sale.id).fetch();
    const alreadyReturned = existingReturns.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const remainingQuantity = Number(sale.quantity || 0) - alreadyReturned;
    if (returnedQuantity > remainingQuantity) {
      throw new Error(`Cette vente ne permet plus que ${remainingQuantity} retour(s).`);
    }

    const remainingValue = (Number(sale.totalPrice || sale.total_price || 0) / Math.max(1, Number(sale.quantity || 1))) * remainingQuantity;
    if (refundAmount > remainingValue) {
      throw new Error('Le remboursement dépasse le montant encore retournable.');
    }

    const selectedUnits = await validateSelectedUnits(database, product, unit_ids, returnedQuantity, 'SOLD');
    for (const unit of selectedUnits) {
      const events = await database.get('unit_events').query(Q.where('unit_id', unit.id), Q.where('sale_id', sale.id)).fetch();
      if (!events.some(event => unitRaw(event).kind === 'SOLD') || events.some(event => unitRaw(event).kind === 'RETURNED')) throw new Error('Cet appareil n’est pas retournable sur cette vente.');
    }
    const now = new Date().toISOString();
    const operations = [];
    const returnRecord = returns.prepareCreate(record => {
      record.shopId = shop_id || sale.shopId;
      record.saleId = sale.id;
      record.productId = product.id;
      record.clientId = sale.clientId || '';
      record.quantity = returnedQuantity;
      record.reason = String(reason).trim();
      record.resolution = resolution;
      record.restock = Boolean(restock);
      record.refundAmount = refundAmount;
      record.processedBy = processed_by;
      record.date = now;
      record.synced = false;
    });
    operations.push(returnRecord);

    operations.push(sale.prepareUpdate(record => {
      record.returnedQuantity = alreadyReturned + returnedQuantity;
      record.refundedAmount = Number(record.refundedAmount || 0) + refundAmount;
      record.synced = false;
    }));

    if (restock) {
      operations.push(product.prepareUpdate(record => {
        record.quantity = Number(record.quantity || 0) + returnedQuantity;
        record.synced = false;
      }));
      operations.push(stockMovements.prepareCreate(movement => {
        movement.productId = product.id;
        movement.shopId = shop_id || sale.shopId;
        movement.type = 'IN';
        movement.quantity = returnedQuantity;
        movement.reason = `Retour client : ${String(reason).trim()}`;
        movement.userName = processed_by || 'Utilisateur';
        movement.date = now;
        movement.supplierName = '';
        movement.deliveryReference = `RETOUR-${sale.id}`;
        movement.unitCost = sale.unitCost || product.unitCost || 0;
        movement.synced = false;
      }));
    }

    for (const unit of selectedUnits) {
      operations.push(unit.prepareUpdate(record => { record._setRaw('state', restock ? 'AVAILABLE' : 'QUARANTINE'); record._setRaw('synced', false); }));
      operations.push(prepareUnitEvent(database, { shop_id: sale.shopId, product_id: product.id, unit_id: unit.id, kind: 'RETURNED', sale_id: sale.id, return_id: returnRecord.id, client_id: sale.clientId || null, amount: refundAmount / returnedQuantity, date: now }));
    }
    const journal = await prepareOperation(database, sale.shopId, operations, { kind: 'return' });
    await database.batch(...operations, ...journal);
    return returnRecord;
  });
};

// ─── EXPENSES ────────────────────────────────────────────────────────────────
export const queryExpenses = (shopId) =>
  expenses.query(Q.where('shop_id', shopId), Q.sortBy('date', Q.desc));

export const createExpense = async (data) => {
  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Le montant de la dépense doit être positif.');
  if (!String(data.description || '').trim()) throw new Error('La description est obligatoire.');

  return database.write(async () => expenses.create(expense => {
    expense.shopId = data.shop_id;
    expense.category = data.category || 'AUTRE';
    expense.description = String(data.description).trim();
    expense.amount = amount;
    expense.date = data.date || new Date().toISOString();
    expense.recurrence = data.recurrence || 'NONE';
    expense.employeeName = data.employee_name || '';
    expense.createdBy = data.created_by || '';
    expense.synced = false;
  }));
};

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export const queryPayments = (shopId) =>
  payments.query(Q.where('shop_id', shopId));

export const queryPaymentsByClient = (clientId) =>
  payments.query(Q.where('client_id', clientId));

export const createPayment = async (data) => {
  return database.write(async () => {
    return payments.create(p => {
      p.shopId = data.shop_id;
      p.clientId = data.client_id;
      p.amount = Number(data.amount);
      p.date = data.date || new Date().toISOString();
      p.synced = false;
    });
  });
};

// ─── STOCK MOVEMENTS ─────────────────────────────────────────────────────────
export const queryStockMovements = (shopId) =>
  stockMovements.query(Q.where('shop_id', shopId), Q.sortBy('date', Q.desc));

export const queryMovementsByProduct = (productId) =>
  stockMovements.query(Q.where('product_id', productId), Q.sortBy('date', Q.desc));

export const createStockMovement = async (data) => {
  return database.write(async () => {
    return stockMovements.create(m => {
      m.productId = data.product_id;
      m.shopId = data.shop_id;
      m.type = data.type; // 'IN' | 'OUT' | 'ADJUST'
      m.quantity = Number(data.quantity);
      m.reason = data.reason || '';
      m.userName = data.user_name || '';
      m.date = data.date || new Date().toISOString();
      m.supplierName = data.supplier_name || '';
      m.deliveryReference = data.delivery_reference || '';
      m.unitCost = data.unit_cost || 0;
      m.synced = false;
    });
  });
};

// ─── INVOICES ────────────────────────────────────────────────────────────────
export const queryInvoices = (shopId) =>
  invoices.query(Q.where('shop_id', shopId), Q.sortBy('date_emission', Q.desc));

export const createInvoice = async (data) => {
  return database.write(async () => {
    return invoices.create(inv => {
      inv.shopId = data.shop_id;
      inv.clientId = data.client_id || '';
      inv.clientName = data.client_name || '';
      inv.amount = Number(data.amount);
      inv.status = data.status || 'pending';
      inv.dateEmission = data.date_emission || new Date().toISOString();
      inv.dateEcheance = data.date_echeance || '';
      inv.itemsJson = data.items_json || '[]';
      inv.synced = false;
    });
  });
};

// ─── SEED ────────────────────────────────────────────────────────────────────
const DEFAULT_SHOP_ID_KEY = 'nstock_default_shop_id';

let seedPromise;
export const seedDefaultShopIfEmpty = () => {
  if (!seedPromise) seedPromise = seedDefaultShop().catch(error => { seedPromise = null; throw error; });
  return seedPromise;
};

const seedDefaultShop = async () => {
  const count = await shops.query().fetchCount();
  if (count > 0) {
    const allShops = await shops.query().fetch();
    return allShops[0];
  }

  const defaultShop = await createShop({
    name: 'Boutique Principale',
    address: '',
    phone: '',
    code: 'SHOP-001'
  });

  localStorage.setItem(DEFAULT_SHOP_ID_KEY, defaultShop.id);

  // Seed default categories
  const defaultCats = ['Téléphones', 'Accessoires', 'Tablettes', 'Informatique', 'Audio', 'Autres'];
  await database.write(async () => {
    for (const catName of defaultCats) {
      await categories.create(cat => {
        cat.shopId = defaultShop.id;
        cat.name = catName;
        cat.synced = false;
      });
    }
  });

  return defaultShop;
};

/**
 * Lit au maximum un lot de changements WatermelonDB. `_status` constitue déjà
 * la file d'attente durable native : created, updated puis synced après accusé
 * de réception. On évite ainsi de charger toutes les écritures hors ligne.
 */
export const getUnsyncedRecords = async (shopId, includeUsers = true, limit = 500, excluded = {}) => database.read(async () => {
  const safeLimit = Math.min(Math.max(Number(limit) || 500, 1), 500);
  let remaining = safeLimit;
  const result = { total: 0, changeStates: {}, syncSnapshot: { changes: {}, affectedRecords: [] } };

  for (const config of syncCollections) {
    const snapshotTable = config.localTable || config.table;
    const empty = { created: [], updated: [], deleted: [] };
    result[config.key] = [];
    result.changeStates[config.key] = empty;
    result.syncSnapshot.changes[snapshotTable] = { created: [], updated: [], deleted: [] };

    if (remaining === 0 || (config.ownerOnly && !includeUsers)) continue;
    const scope = eligibleSyncScope(config, shopId, excluded);
    const eligible = async status => {
      const found = [];
      let offset = 0;
      while (found.length < remaining) {
        const candidates = await config.collection.query(Q.where(statusColumn, status), ...scope,
          Q.sortBy(config.orderColumn || 'id', Q.asc), ...(config.orderColumn ? [Q.sortBy('id', Q.asc)] : []),
          Q.skip(offset), Q.take(500)).fetch();
        const protectedIds = await protectedEntityIds(database, snapshotTable, candidates.map(row => row.id));
        found.push(...candidates.filter(row => !protectedIds.has(row.id)).slice(0, remaining - found.length));
        if (candidates.length < 500) break;
        offset += candidates.length;
      }
      return found;
    };
    const created = await eligible('created');
    remaining -= created.length;
    const updated = remaining > 0 ? await eligible('updated') : [];
    remaining -= updated.length;

    // Les lignes supprimées ne sont plus interrogeables comme des modèles,
    // mais l'adaptateur conserve leurs identifiants jusqu'à l'accusé serveur.
    const tombstones = remaining > 0 ? await database.adapter.getDeletedRecords(snapshotTable) : [];
    const protectedDeleted = await protectedEntityIds(database, snapshotTable, tombstones);
    const deleted = tombstones.filter(id => !excluded[config.table]?.includes(id) && !protectedDeleted.has(id)).slice(0, remaining);
    remaining -= deleted.length;

    const records = [...created, ...updated];
    result[config.key] = records;
    result.changeStates[config.key] = { created, updated, deleted };
    result.syncSnapshot.changes[snapshotTable] = {
      created: created.map(record => ({ ...record._raw })),
      updated: updated.map(record => ({ ...record._raw })),
      deleted,
    };
    result.syncSnapshot.affectedRecords.push(...records);
    result.total += records.length + deleted.length;
  }

  return result;
});

export const getUnsyncedCount = async (shopId, includeUsers = true, excluded = {}) => {
  const counts = await Promise.all(syncCollections.map(async config => {
    if (config.ownerOnly && !includeUsers) return 0;
    const scope = eligibleSyncScope(config, shopId, excluded);
    const snapshotTable = config.localTable || config.table;
    const [created, updated, deleted] = await Promise.all([
      config.collection.query(Q.where(statusColumn, 'created'), ...scope).fetchCount(),
      config.collection.query(Q.where(statusColumn, 'updated'), ...scope).fetchCount(),
      database.adapter.getDeletedRecords(snapshotTable),
    ]);
    return created + updated + deleted.filter(id => !excluded[config.table]?.includes(id)).length;
  }));
  return counts.reduce((total, count) => total + count, 0);
};

export const markAsSynced = async (batch, rejectedIds = {}, versions = {}) => {
  if (!batch?.syncSnapshot || batch.total === 0) return;
  const localRejectedIds = {
    ...rejectedIds,
    local_users: rejectedIds.users || [],
  };
  // Persist the server base version first. If the process stops between these
  // writes, the record remains pending and its identical replay is safe.
  await acknowledgeVersions(database, versions);
  for (const [table, entries] of Object.entries(versions)) {
    const snapshot = batch.syncSnapshot.changes[table === 'users' ? 'local_users' : table];
    if (!snapshot) continue;
    for (const raw of [...snapshot.created, ...snapshot.updated]) {
      if (entries[raw.id] !== undefined) raw.version = entries[raw.id];
    }
  }
  await markLocalChangesAsSynced(database, batch.syncSnapshot, localRejectedIds);
};
