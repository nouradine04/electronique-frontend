export function filterStockProducts(products, categories, selectedCategory, searchQuery, matchedIds = new Set()) {
  const query = String(searchQuery || '').trim().toLocaleLowerCase('fr');
  const categoryNames = new Map(categories.map(category => [category.id, category.name]));
  return products.filter(product => {
    if (selectedCategory !== 'ALL' && product.categoryId !== selectedCategory) return false;
    if (!query) return true;
    return matchedIds.has(product.id)
      || String(product.name || '').toLocaleLowerCase('fr').includes(query)
      || String(categoryNames.get(product.categoryId) || '').toLocaleLowerCase('fr').includes(query);
  });
}

export function calculateStockFinance(products) {
  let saleValue = 0;
  let purchaseCost = 0;
  let unpricedCount = 0;
  for (const product of products) {
    const quantity = Number(product.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    if (product.status === 'PENDING_PRICE' || !Number.isFinite(Number(product.price)) || Number(product.price) <= 0) {
      unpricedCount += 1;
      continue;
    }
    const price = Number(product.price);
    const cost = Number(product.unitCost);
    saleValue += quantity * price;
    purchaseCost += quantity * (Number.isFinite(cost) && cost >= 0 ? cost : 0);
  }
  const margin = saleValue - purchaseCost;
  return {
    saleValue,
    purchaseCost,
    margin,
    marginPercent: purchaseCost > 0 ? (margin / purchaseCost) * 100 : null,
    unpricedCount,
  };
}
