import { test } from 'node:test';
import assert from 'node:assert/strict';
import { combineHybridRows, hybridFailureMode } from '../src/services/hybridReadPolicy.js';

test('server rows replace stale synced copies while pending local writes remain visible', () => {
  const local = [
    { id: 'a', name: 'stale', _raw: { _status: 'synced' } },
    { id: 'b', name: 'edited', _raw: { _status: 'updated' } },
    { id: 'c', name: 'new', _raw: { _status: 'created' } },
    { id: 'd', name: 'removed', _raw: { _status: 'deleted' } },
  ];
  const remote = [
    { id: 'a', name: 'fresh', shop_id: 'shop-a' },
    { id: 'b', name: 'old' },
    { id: 'd', name: 'old' },
  ];
  const result = combineHybridRows(local, remote, true);
  assert.deepEqual(result.map(row => row.id), ['a', 'b', 'c']);
  assert.equal(result[0].name, 'fresh');
  assert.equal(result[0].shopId, 'shop-a');
  assert.equal(result[1], local[1]);
  assert.equal(result[2], local[2]);
  assert.equal(combineHybridRows(local, remote, false), local);
});

test('only connectivity and server failures may fall back; authorization never does', () => {
  assert.equal(hybridFailureMode({ name: 'NetworkError' }), 'fallback');
  assert.equal(hybridFailureMode({ status: 503 }), 'fallback');
  assert.equal(hybridFailureMode({ status: 401 }), 'error');
  assert.equal(hybridFailureMode({ status: 403 }), 'error');
  assert.equal(hybridFailureMode({ status: 400 }), 'error');
});
