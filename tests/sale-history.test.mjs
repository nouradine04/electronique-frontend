import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleSaleHistory } from '../src/services/saleHistoryPolicy.js';

test('online sale history prefers PostgreSQL over a synced stale local copy, preserving pending sales', () => {
  const date = '2026-10-01T12:00:00.000Z';
  const local = [
    { id: 'sale-1', date, totalPrice: 100, _raw: { _status: 'synced' } },
    { id: 'sale-2', date, totalPrice: 200, _raw: { _status: 'created' } },
  ];
  const server = [
    { id: 'sale-1', date, totalPrice: 90 },
    { id: 'sale-2', date, totalPrice: 150 },
  ];
  const sales = visibleSaleHistory(local, server, true, true);
  assert.equal(sales.find(sale => sale.id === 'sale-1').totalPrice, 90);
  assert.equal(sales.find(sale => sale.id === 'sale-1').localRecord, local[0]);
  assert.equal(sales.find(sale => sale.id === 'sale-1').remoteOnly, false);
  assert.equal(sales.find(sale => sale.id === 'sale-2').totalPrice, 200);
  assert.equal(visibleSaleHistory(local, server, true, false).find(sale => sale.id === 'sale-1').totalPrice, 100);
});

test('online history is paginated from the API and does not silently add older synced local rows', () => {
  const date = '2026-10-01T12:00:00.000Z';
  const local = [
    { id: 'old-synced', date, _raw: { _status: 'synced' } },
    { id: 'pending', date, _raw: { _status: 'created' } },
  ];
  const server = [{ id: 'server-page', date }];
  assert.deepEqual(visibleSaleHistory(local, server, true, true).map(sale => sale.id), ['server-page', 'pending']);
  assert.equal(visibleSaleHistory(local, server, true, false).length, 2, 'local cache remains visible while API is loading');
});

test('offline view shows recent local sales without deleting older saved rows', () => {
  const now = Date.parse('2026-10-09T12:00:00.000Z');
  const local = [
    { id: 'recent', date: '2026-09-20T12:00:00.000Z' },
    { id: 'older', date: '2026-08-01T12:00:00.000Z' },
  ];
  assert.deepEqual(visibleSaleHistory(local, [], false, false, now).map(sale => sale.id), ['recent']);
  assert.equal(local.length, 2);
  assert.deepEqual(visibleSaleHistory(local, [], true, false, now).map(sale => sale.id), ['recent', 'older']);
});
