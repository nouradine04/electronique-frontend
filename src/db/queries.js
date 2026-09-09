/**
 * WatermelonDB Query & Mutation helpers
 *
 * Offline-first: toutes les opérations sont locales.
 * synced = false signale qu'il faut synchroniser avec le backend NestJS.
 */
import { Q } from '@nozbe/watermelondb';
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
    return products.create(p => {
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
  });
};

export const updateProduct = async (product, data) => {
  return database.write(async () => {
    product = await products.find(product.id);
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

  return database.write(async () => {
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

    await database.batch(...operations);
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

export const getUnsyncedRecords = async () => {
  const [
    unsyncedSales,
    unsyncedProducts,
    unsyncedClients,
    unsyncedPayments,
    unsyncedMovements,
    unsyncedInvoices,
    unsyncedShops,
    unsyncedReturns,
    unsyncedExpenses,
  ] = await Promise.all([
    sales.query(Q.where('synced', false)).fetch(),
    products.query(Q.where('synced', false)).fetch(),
    clients.query(Q.where('synced', false)).fetch(),
    payments.query(Q.where('synced', false)).fetch(),
    stockMovements.query(Q.where('synced', false)).fetch(),
    invoices.query(Q.where('synced', false)).fetch(),
    shops.query(Q.where('synced', false)).fetch(),
    returns.query(Q.where('synced', false)).fetch(),
    expenses.query(Q.where('synced', false)).fetch(),
  ]);

  return {
    sales: unsyncedSales,
    products: unsyncedProducts,
    clients: unsyncedClients,
    payments: unsyncedPayments,
    stockMovements: unsyncedMovements,
    invoices: unsyncedInvoices,
    shops: unsyncedShops,
    returns: unsyncedReturns,
    expenses: unsyncedExpenses,
    total:
      unsyncedSales.length +
      unsyncedProducts.length +
      unsyncedClients.length +
      unsyncedPayments.length +
      unsyncedMovements.length +
      unsyncedInvoices.length +
      unsyncedShops.length +
      unsyncedReturns.length +
      unsyncedExpenses.length,
  };
};

export const markAsSynced = async (records) => {
  await database.write(async () => {
    for (const record of records) {
      await record.update(r => { r.synced = true; });
    }
  });
};
