import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { requestJson } from './apiClient';
import { NetworkError, getSession } from './session';
import { combineHybridRows, hybridFailureMode } from './hybridReadPolicy.js';

const PAGE_SIZE = 200;
const MAX_PAGES = 25;
const entries = new Map();
const empty = { rows: [], status: 'idle', error: null };

function keyFor(table, shopId, sinceDays) {
  const session = getSession();
  return session?.userId && shopId ? `${session.api}|${session.userId}|${shopId}|${table}|${sinceDays || 0}` : '';
}

function entryFor(key, table, shopId, sinceDays) {
  if (!key) return null;
  if (!entries.has(key)) entries.set(key, { ...empty, key, table, shopId, sinceDays, listeners: new Set(), promise: null, refreshAfterCurrent: false, revision: 0 });
  return entries.get(key);
}

function announce(entry) {
  entry.revision += 1;
  for (const listener of entry.listeners) listener();
}

async function refresh(entry, force = false) {
  if (!navigator.onLine) return;
  if (entry.promise) {
    if (force) entry.refreshAfterCurrent = true;
    return entry.promise;
  }
  entry.status = entry.rows.length ? 'refreshing' : 'loading';
  entry.error = null;
  announce(entry);
  entry.promise = (async () => {
    let cursor = null;
    const rows = [];
    const since = entry.sinceDays ? new Date(Date.now() - entry.sinceDays * 86400000).toISOString() : '';
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const params = new URLSearchParams({ shopId: entry.shopId, limit: String(PAGE_SIZE) });
      if (cursor) params.set('cursor', cursor);
      if (since) params.set('since', since);
      const response = await requestJson(`/sync/read/${entry.table}?${params}`);
      if (!Array.isArray(response.data)) throw new Error('Réponse de lecture invalide.');
      rows.push(...response.data);
      if (!response.next_cursor) {
        entry.rows = rows;
        entry.status = 'ready';
        entry.error = null;
        announce(entry);
        return;
      }
      cursor = response.next_cursor;
    }
    // An incomplete remote list must never hide the rest of the local cache.
    throw new NetworkError('Liste trop longue pour cette vue. Les données de cet appareil restent visibles.');
  })().catch(error => {
    entry.error = error;
    entry.status = hybridFailureMode(error);
    announce(entry);
  }).finally(() => {
    entry.promise = null;
    if (entry.refreshAfterCurrent) {
      entry.refreshAfterCurrent = false;
      void refresh(entry);
    }
  });
  return entry.promise;
}

if (typeof window !== 'undefined') {
  let activeUserId = getSession()?.userId || '';
  window.addEventListener('nstock-session', () => {
    const nextUserId = getSession()?.userId || '';
    if (nextUserId === activeUserId) return;
    activeUserId = nextUserId;
    for (const entry of entries.values()) {
      entry.rows = [];
      entry.status = 'idle';
      announce(entry);
    }
    entries.clear();
  });
  window.addEventListener('online', () => {
    for (const entry of entries.values()) if (entry.key.includes(`|${activeUserId}|`)) void refresh(entry, true);
  });
  window.addEventListener('offline', () => {
    for (const entry of entries.values()) {
      if (entry.status === 'error') continue;
      entry.status = 'fallback';
      announce(entry);
    }
  });
  window.addEventListener('nstock:sync-complete', event => {
    for (const entry of entries.values()) if (entry.key.includes(`|${activeUserId}|`) && entry.shopId === event.detail?.shopId) void refresh(entry, true);
  });
}

export function useHybridRead(table, shopId, localRows, { sinceDays = 0 } = {}) {
  const key = keyFor(table, shopId, sinceDays);
  const entry = entryFor(key, table, shopId, sinceDays);
  const snapshot = useSyncExternalStore(
    listener => { if (!entry) return () => {}; entry.listeners.add(listener); return () => entry.listeners.delete(listener); },
    () => entry?.revision || 0,
  );
  useEffect(() => { if (entry && entry.status === 'idle') void refresh(entry); }, [entry]);
  const status = entry?.status || 'idle';
  const error = entry?.error || null;
  const records = useMemo(() => combineHybridRows(localRows, entry?.rows || [],
    Boolean(entry && navigator.onLine && (status === 'ready' || status === 'refreshing'))),
  [localRows, entry, snapshot, status]);
  if (status === 'error') throw error;
  return { records, loading: status === 'loading' && !localRows.length, source: status === 'ready' ? 'server' : 'local', error };
}
