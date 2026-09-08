import type { PullChangesResponse, PushChangesResponse, SyncChanges } from '../models/sync';
import { requestJson } from './apiClient';

export function pullChanges(params: { lastPulledAt: number; tenantId: string; shopId: string; cursor?: string | null; limit?: number }) {
  const search = new URLSearchParams({
    lastPulledAt: String(params.lastPulledAt || 0),
    tenantId: params.tenantId,
    shopId: params.shopId,
    limit: String(params.limit || 500),
  });

  if (params.cursor) search.set('cursor', params.cursor);

  return requestJson<PullChangesResponse>(`/sync/pull?${search.toString()}`);
}

export function pushChanges(params: { changes: SyncChanges; lastPulledAt: number; tenantId: string; shopId: string; cursor?: string | null; limit?: number }) {
  const search = new URLSearchParams({
    lastPulledAt: String(params.lastPulledAt || 0),
    tenantId: params.tenantId,
    shopId: params.shopId,
    limit: String(params.limit || 500),
  });

  if (params.cursor) search.set('cursor', params.cursor);

  return requestJson<PushChangesResponse>(`/sync/push?${search.toString()}`, {
    method: 'POST',
    body: JSON.stringify({ changes: params.changes }),
  });
}
