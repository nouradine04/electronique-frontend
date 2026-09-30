import type { OperationPayload } from './operationQueue';

// Older product creations saved their initial stock movement without unit_cost.
// Recover only that known field from the product in the same atomic operation.
export function completeInitialStockCost(payload: OperationPayload): OperationPayload['changes'] {
  if (payload.kind !== 'stock') return payload.changes;

  const products = [
    ...(payload.changes.products?.created || []),
    ...(payload.changes.products?.updated || []),
  ];
  const productCosts = new Map(products
    .filter(product => typeof product.unit_cost === 'number' && Number.isFinite(product.unit_cost) && product.unit_cost >= 0)
    .map(product => [product.id, product.unit_cost]));
  const movements = payload.changes.stock_movements?.created || [];
  if (!movements.some(movement => movement.unit_cost === undefined
    && movement.type === 'IN' && movement.reason === 'Stock initial'
    && productCosts.has(movement.product_id))) return payload.changes;

  return {
    ...payload.changes,
    stock_movements: {
      ...payload.changes.stock_movements,
      created: movements.map(movement => movement.unit_cost === undefined
        && movement.type === 'IN' && movement.reason === 'Stock initial'
        && productCosts.has(movement.product_id)
        ? { ...movement, unit_cost: productCosts.get(movement.product_id) }
        : movement),
    },
  };
}
