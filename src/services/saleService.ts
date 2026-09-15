import type { SaleHistoryPage, SaleHistoryParams } from '../models/sale';
import { requestJson } from './apiClient';

export function fetchSaleHistory(params: SaleHistoryParams): Promise<SaleHistoryPage> {
  const search = new URLSearchParams({
    shopId: params.shopId,
    limit: String(params.limit || 50),
  });
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);

  return requestJson<SaleHistoryPage>(`/sales/history?${search.toString()}`);
}
