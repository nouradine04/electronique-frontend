/**
 * SyncContext — Offline-first sync engine
 *
 * Stratégie :
 * 1. Toute donnée est d'abord écrite localement (WatermelonDB, synced=false)
 * 2. Quand la connexion revient → push vers NestJS, pull les mises à jour
 * 3. L'icône header reflète l'état : vert=ok, orange=pending, rouge=offline
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getUnsyncedCount, getUnsyncedRecords, markAsSynced } from '../db/queries';
import { LOCAL_ONLY } from './backendConfig';
import { useShop } from './ShopContext.jsx';
import { pullChanges, pushChanges } from '../services/syncService';
import { applyRemoteChanges } from '../services/applyRemoteChanges.js';

const SyncContext = createContext();

const RETRY_INTERVAL = 15000; // 15s entre les tentatives
const SYNC_ON_FOCUS = true;   // Re-sync quand l'onglet devient actif
const SYNC_BATCH_SIZE = 500;
const MAX_PUSH_BATCHES_PER_RUN = 10;
const cloudImage = value => /^https?:\/\//i.test(String(value || '')) ? value : undefined;

const payloadStateKeys = {
  users: 'users',
  shops: 'shops',
  categories: 'categories',
  products: 'products',
  clients: 'clients',
  sales: 'sales',
  payments: 'payments',
  stock_movements: 'stockMovements',
  returns: 'returns',
  expenses: 'expenses',
  invoices: 'invoices',
};

function finalizePayloadStates(payload, batch) {
  for (const [table, stateKey] of Object.entries(payloadStateKeys)) {
    const state = batch.changeStates[stateKey];
    const rows = payload[table].created;
    const updatedIds = new Set(state.updated.map(record => record.id));
    const versions = new Map(
      [...state.created, ...state.updated].map(record => [record.id, Number(record._raw.version) || 0]),
    );
    const serialized = rows.map(row => ({ ...row, version: versions.get(row.id) || 0 }));
    payload[table] = {
      created: serialized.filter(row => !updatedIds.has(row.id)),
      updated: serialized.filter(row => updatedIds.has(row.id)),
      deleted: state.deleted,
    };
  }
  return payload;
}

export function SyncProvider({ children }) {
  const { currentShop, userRole } = useShop();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const retryTimer = useRef(null);
  const syncLock = useRef(false);

  // Mise à jour du compteur de pending en temps réel
  const refreshPendingCount = useCallback(async () => {
    try {
      if (!currentShop) {
        setPendingCount(0);
        return;
      }
      setPendingCount(await getUnsyncedCount(currentShop.id, userRole === 'owner'));
    } catch (e) {
      // DB pas encore prête
    }
  }, [currentShop, userRole]);

  const buildChangesPayload = useCallback((unsynced) => finalizePayloadStates({
    users: {
      created: unsynced.users.map(user => ({
        id: user.id,
        shop_id: user.shopId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        password_hash: user.passwordHash,
        password_salt: user.passwordSalt,
        password_algorithm: 'PBKDF2-SHA256-210000',
        is_active: user.isActive,
      })),
      updated: [], deleted: [],
    },
    shops: {
      created: unsynced.shops.map(s => ({
        id: s.id,
        name: s.name,
        address: s.address,
        phone: s.phone,
        nif: s.nif,
        email: s.email,
        logo_url: s.logoUrl,
      })),
      updated: [],
      deleted: [],
    },
    categories: {
      created: unsynced.categories.map(category => ({
        id: category.id,
        shop_id: category.shopId,
        name: category.name,
      })),
      updated: [],
      deleted: [],
    },
    products: {
      created: unsynced.products.map(p => ({
        id: p.id,
        shop_id: p.shopId,
        category_id: p.categoryId,
        name: p.name,
        description: p.description,
        sku: p.sku,
        price: p.price,
        quantity: p.quantity,
        min_stock: p.minStock,
        status: p.status,
        image_url: cloudImage(p.imageUrl),
        location: p.location,
        unit_cost: p.unitCost,
        catalog_id: p.catalogId,
        catalog_source: p.catalogSource,
        brand: p.brand,
        model: p.model,
        ram: p.ram,
        storage_capacity: p.storageCapacity,
        color: p.color,
        sim_type: p.simType,
        network: p.network,
        battery: p.battery,
        screen: p.screen,
        operating_system: p.operatingSystem,
        release_date: p.releaseDate,
        specs_json: p.specsJson,
        added_by: p.addedBy,
        added_at: p.addedAt,
      })),
      updated: [],
      deleted: [],
    },
    clients: {
      created: unsynced.clients.map(c => ({
        id: c.id,
        shop_id: c.shopId,
        name: c.name,
        phone: c.phone,
        email: c.email,
      })),
      updated: [],
      deleted: [],
    },
    sales: {
      created: unsynced.sales.map(s => ({
        id: s.id,
        shop_id: s.shopId,
        product_id: s.productId,
        variant_id: s.productId,
        client_id: s.clientId,
        quantity: s.quantity,
        total_price: s.totalPrice,
        payment_method: s.paymentMethod,
        date: s.date,
        seller_name: s.sellerName,
        seller_role: s.sellerRole,
        unit_cost: s.unitCost,
        returned_quantity: s.returnedQuantity,
        refunded_amount: s.refundedAmount,
      })),
      updated: [],
      deleted: [],
    },
    payments: {
      created: unsynced.payments.map(p => ({
        id: p.id,
        shop_id: p.shopId,
        client_id: p.clientId,
        amount: p.amount,
        date: p.date,
      })),
      updated: [],
      deleted: [],
    },
    stock_movements: {
      created: unsynced.stockMovements.map(m => ({
        id: m.id,
        shop_id: m.shopId,
        product_id: m.productId,
        variant_id: m.productId,
        movement_type: m.type,
        quantity: m.quantity,
        reason: m.reason,
        user_name: m.userName,
        local_timestamp: m.date,
        supplier_name: m.supplierName,
        delivery_reference: m.deliveryReference,
        unit_cost: m.unitCost,
      })),
      updated: [],
      deleted: [],
    },
    returns: {
      created: unsynced.returns.map(r => ({
        id: r.id,
        shop_id: r.shopId,
        sale_id: r.saleId,
        product_id: r.productId,
        client_id: r.clientId,
        quantity: r.quantity,
        reason: r.reason,
        resolution: r.resolution,
        restock: r.restock,
        refund_amount: r.refundAmount,
        processed_by: r.processedBy,
        date: r.date,
      })),
      updated: [],
      deleted: [],
    },
    expenses: {
      created: unsynced.expenses.map(e => ({
        id: e.id,
        shop_id: e.shopId,
        category: e.category,
        description: e.description,
        amount: e.amount,
        date: e.date,
        recurrence: e.recurrence,
        employee_name: e.employeeName,
        created_by: e.createdBy,
      })),
      updated: [],
      deleted: [],
    },
    invoices: {
      created: unsynced.invoices.map(invoice => ({
        id: invoice.id,
        shop_id: invoice.shopId,
        client_id: invoice.clientId,
        client_name: invoice.clientName,
        amount: invoice.amount,
        status: invoice.status,
        date_emission: invoice.dateEmission,
        date_echeance: invoice.dateEcheance,
        items_json: invoice.itemsJson,
      })),
      updated: [],
      deleted: [],
    },
  }, unsynced), []);

  // Sync principale : push local → NestJS, pull NestJS → local
  const syncWithBackend = useCallback(async () => {
    if (LOCAL_ONLY || !navigator.onLine || syncLock.current || !currentShop) return;

    syncLock.current = true;
    setIsSyncing(true);
    try {
      const tenantId = currentShop.accountId || currentShop.id;
      const cursorKey = `lastPulledAt:${tenantId}:${currentShop.id}`;
      const storedPullTimestamp = Number(localStorage.getItem(cursorKey) || 0);
      for (let batchIndex = 0; batchIndex < MAX_PUSH_BATCHES_PER_RUN; batchIndex += 1) {
        const batch = await getUnsyncedRecords(
          currentShop.id,
          userRole === 'owner',
          SYNC_BATCH_SIZE,
        );
        if (batch.total === 0) break;

        const response = await pushChanges({
          changes: buildChangesPayload(batch),
          lastPulledAt: storedPullTimestamp,
          tenantId,
          shopId: currentShop.id,
          limit: SYNC_BATCH_SIZE,
        });
        if (response.has_more || response.processed !== batch.total) {
          throw new Error('Le serveur n’a pas confirmé la totalité du lot de synchronisation.');
        }
        const rejectedIds = response.rejected_ids || {};
        const rejectedCount = Object.values(rejectedIds)
          .reduce((total, ids) => total + ids.length, 0);
        await markAsSynced(batch, rejectedIds);
        if (rejectedCount > 0) break;
      }

      let pullCursor = null;
      let finalPullTimestamp = null;
      do {
        const response = await pullChanges({
          lastPulledAt: storedPullTimestamp,
          tenantId,
          shopId: currentShop.id,
          cursor: pullCursor,
          limit: SYNC_BATCH_SIZE,
        });
        await applyRemoteChanges(response.changes);
        finalPullTimestamp = response.timestamp;
        pullCursor = response.next_cursor;
      } while (pullCursor);
      if (finalPullTimestamp) {
        localStorage.setItem(cursorKey, String(finalPullTimestamp));
      }

      setLastSyncedAt(new Date());
      await refreshPendingCount();

    } catch (err) {
      console.warn('[Sync] Échec — données conservées localement:', err.message);
    } finally {
      syncLock.current = false;
      setIsSyncing(false);
    }
  }, [buildChangesPayload, currentShop, refreshPendingCount, userRole]);

  // Écoute online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncWithBackend();
    };
    const handleOffline = () => {
      setIsOnline(false);
      if (retryTimer.current) clearInterval(retryTimer.current);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncWithBackend]);

  // Auto-retry quand online
  useEffect(() => {
    if (!LOCAL_ONLY && isOnline) {
      retryTimer.current = setInterval(syncWithBackend, RETRY_INTERVAL);
    }
    return () => {
      if (retryTimer.current) clearInterval(retryTimer.current);
    };
  }, [isOnline, syncWithBackend]);

  // Synchronisation immédiate à l'ouverture d'une boutique. Les retries et
  // l'événement `online` prennent ensuite le relais sans demander à l'utilisateur.
  useEffect(() => {
    if (!LOCAL_ONLY && isOnline && currentShop) void syncWithBackend();
  }, [currentShop, isOnline, syncWithBackend]);

  // Re-sync au focus de l'onglet
  useEffect(() => {
    if (LOCAL_ONLY || !SYNC_ON_FOCUS) return;
    const handleFocus = () => { if (isOnline) syncWithBackend(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isOnline, syncWithBackend]);

  // Compteur initial
  useEffect(() => {
    refreshPendingCount();
    const iv = setInterval(refreshPendingCount, 10000);
    return () => clearInterval(iv);
  }, [refreshPendingCount]);

  const triggerManualSync = useCallback(() => {
    if (isOnline) syncWithBackend();
  }, [isOnline, syncWithBackend]);

  return (
    <SyncContext.Provider value={{
      isOnline,
      isLocalOnly: LOCAL_ONLY,
      isSyncing,
      pendingCount,
      lastSyncedAt,
      triggerManualSync
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
