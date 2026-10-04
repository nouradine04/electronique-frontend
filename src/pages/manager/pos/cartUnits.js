export function addTrackedUnitToCart(cart, product, unitId) {
  const current = cart.find(item => item.productId === product.id);
  const ids = current?.unitIds || [];
  if (ids.includes(unitId) || ids.length >= Number(product.quantity || 0)) return cart;
  const unitIds = [...ids, unitId];
  return current
    ? cart.map(item => item.productId === product.id ? { ...item, unitIds, quantity: unitIds.length } : item)
    : [...cart, { productId: product.id, quantity: 1, unitIds }];
}
