export type RejectedIds = Record<string, string[]>;
const prefix = 'nstock_sync_conflicts:';

export function readSyncConflicts(scope: string): RejectedIds {
  try {
    const value = JSON.parse(localStorage.getItem(prefix + scope) || '{}');
    return Object.fromEntries(Object.entries(value).filter(([, ids]) => Array.isArray(ids) && ids.every(id => typeof id === 'string'))) as RejectedIds;
  } catch { return {}; }
}

export function saveSyncConflicts(scope: string, previous: RejectedIds, incoming: RejectedIds): RejectedIds {
  const next = { ...previous };
  for (const [table, ids] of Object.entries(incoming)) next[table] = [...new Set([...(next[table] || []), ...ids])];
  localStorage.setItem(prefix + scope, JSON.stringify(next));
  return next;
}

export function clearSyncConflicts(scope: string) { localStorage.removeItem(prefix + scope); }

// The queries apply these constraints before LIMIT, so held records cannot
// starve later clean records. No business data is removed by this filter.
export const syncDependencies: Record<string, Record<string, string>> = {
  products: { category_id: 'categories' },
  sales: { product_id: 'products', client_id: 'clients' },
  payments: { client_id: 'clients' },
  stock_movements: { product_id: 'products' },
  returns: { product_id: 'products', sale_id: 'sales', client_id: 'clients' },
  invoices: { client_id: 'clients' },
};
