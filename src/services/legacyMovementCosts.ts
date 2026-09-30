import type { OperationPayload } from './operationQueue';

type Row = Record<string, any>;

function costByProduct(rows: Row[]) {
  const costs = new Map<string, number>();
  for (const row of rows) {
    if (typeof row.unit_cost === 'number' && Number.isFinite(row.unit_cost) && row.unit_cost >= 0) {
      costs.set(row.product_id || row.id, row.unit_cost);
    }
  }
  return costs;
}

// Older product creations and checkouts omitted unit_cost on their movement.
// Fill it only from the matching product or sale in the same atomic operation.
export function completeLegacyMovementCosts(payload: OperationPayload): OperationPayload['changes'] {
  if (payload.kind !== 'stock' && payload.kind !== 'checkout' && payload.kind !== undefined) return payload.changes;

  const products = [
    ...(payload.changes.products?.created || []),
    ...(payload.changes.products?.updated || []),
  ];
  const sales = [
    ...(payload.changes.sales?.created || []),
    ...(payload.changes.sales?.updated || []),
  ];
  const productCosts = costByProduct(products);
  const saleCosts = costByProduct(sales);
  const movements = payload.changes.stock_movements?.created || [];
  const costFor = (movement: Row) => {
    if (movement.unit_cost != null) return undefined;
    if (payload.kind === 'stock' && movement.type === 'IN' && movement.reason === 'Stock initial') {
      return productCosts.get(movement.product_id);
    }
    if ((payload.kind === 'checkout' || payload.kind === undefined)
      && movement.type === 'OUT' && movement.reason === 'Vente client') {
      return saleCosts.get(movement.product_id);
    }
    return undefined;
  };
  if (!movements.some(movement => costFor(movement) !== undefined)) return payload.changes;

  return {
    ...payload.changes,
    stock_movements: {
      ...payload.changes.stock_movements,
      created: movements.map(movement => {
        const cost = costFor(movement);
        return cost === undefined ? movement : { ...movement, unit_cost: cost };
      }),
    },
  };
}
