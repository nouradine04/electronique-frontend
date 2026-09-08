import type { ClientModel, ClientPaymentModel } from '../models/client';
import { requestJson } from './apiClient';

export function fetchClients(params: { tenantId: string; shopId: string; query?: string }) {
  const search = new URLSearchParams({
    tenantId: params.tenantId,
    shopId: params.shopId,
  });

  if (params.query?.trim()) search.set('query', params.query.trim());

  return requestJson<ClientModel[]>(`/clients?${search.toString()}`);
}

export function fetchClientById(id: string, tenantId: string) {
  const search = new URLSearchParams({ tenantId });
  return requestJson<ClientModel>(`/clients/${id}?${search.toString()}`);
}

export function createClient(params: { tenantId: string; shopId: string; client: Pick<ClientModel, 'id' | 'name' | 'phone'> }) {
  const search = new URLSearchParams({
    tenantId: params.tenantId,
    shopId: params.shopId,
  });

  return requestJson<ClientModel>(`/clients?${search.toString()}`, {
    method: 'POST',
    body: JSON.stringify(params.client),
  });
}

export function recordClientPayment(params: { tenantId: string; shopId: string; clientId: string; amount: number; date?: string }) {
  const search = new URLSearchParams({
    tenantId: params.tenantId,
    shopId: params.shopId,
  });

  return requestJson<ClientPaymentModel>(`/clients/${params.clientId}/payments?${search.toString()}`, {
    method: 'POST',
    body: JSON.stringify({ amount: params.amount, date: params.date }),
  });
}
