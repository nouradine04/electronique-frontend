import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateStockFinance, filterStockProducts } from '../src/pages/admin/stockFinance.js';

test('category selection scopes both the visible stock and its financial estimate, even for an IMEI match', () => {
  const categories = [{ id: 'phones', name: 'Téléphones' }, { id: 'accessories', name: 'Accessoires' }];
  const products = [
    { id: 'phone', categoryId: 'phones', name: 'iPhone', quantity: 2, price: 150000, unitCost: 100000 },
    { id: 'charger', categoryId: 'accessories', name: 'Chargeur', quantity: 3, price: 15000, unitCost: 10000 },
  ];
  const phones = filterStockProducts(products, categories, 'phones', 'imei connu', new Set(['phone', 'charger']));
  assert.deepEqual(phones.map(product => product.id), ['phone']);
  assert.deepEqual(calculateStockFinance(phones), {
    saleValue: 300000, purchaseCost: 200000, margin: 100000, marginPercent: 50, unpricedCount: 0,
  });
  assert.equal(calculateStockFinance(filterStockProducts(products, categories, 'accessories', '', new Set())).margin, 15000);
});

test('unpriced stock is excluded and a zero purchase cost never produces an invalid percentage', () => {
  const totals = calculateStockFinance([
    { quantity: 2, price: 0, unitCost: 50000, status: 'PENDING_PRICE' },
    { quantity: 1, price: 20000, unitCost: 0, status: 'ACTIVE' },
    { quantity: 0, price: 10000, unitCost: 1000, status: 'ACTIVE' },
  ]);
  assert.deepEqual(totals, {
    saleValue: 20000, purchaseCost: 0, margin: 20000, marginPercent: null, unpricedCount: 1,
  });
});
