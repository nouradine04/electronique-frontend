import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePosSearch, matchesPosProduct, shortIdentifier } from '../src/pages/manager/pos/search.js';
import { addTrackedUnitToCart } from '../src/pages/manager/pos/cartUnits.js';

test('combined model and four IMEI digits keep the model filter and suffix separate', () => {
  assert.deepEqual(parsePosSearch('  iPhone   13   0139 '), { productText: 'iphone 13', imeiSuffix: '0139' });
  assert.deepEqual(parsePosSearch('0139'), { productText: '', imeiSuffix: '0139' });
  assert.deepEqual(parsePosSearch('iPhone 13'), { productText: 'iphone 13', imeiSuffix: '' });
  assert.equal(matchesPosProduct({ name: 'Apple iPhone 13 · 128GB · Bleu' }, 'iphone 13'), true);
  assert.equal(matchesPosProduct({ name: 'Apple iPhone 14' }, 'iphone 13'), false);
  assert.equal(shortIdentifier('490154203237139'), '…7139');
});

test('a tracked device is added once and cart quantity always follows selected IMEIs', () => {
  const product = { id: 'iphone-13', quantity: 2 };
  const first = addTrackedUnitToCart([], product, 'unit-0139');
  assert.deepEqual(first, [{ productId: product.id, quantity: 1, unitIds: ['unit-0139'] }]);
  assert.equal(addTrackedUnitToCart(first, product, 'unit-0139'), first);
  const second = addTrackedUnitToCart(first, product, 'unit-4613');
  assert.deepEqual(second[0], { productId: product.id, quantity: 2, unitIds: ['unit-0139', 'unit-4613'] });
  assert.equal(addTrackedUnitToCart(second, product, 'unit-9822'), second);
});
