import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { requestJson } from './apiClient';
import { visibleSaleHistory } from './saleHistoryPolicy.js';
import { ApiError, SessionError, getSession } from './session';

const PAGE_SIZE = 50;
const historyCache = new Map();

function saleFromServer(row) {
  return {
    id: row.id,
    productId: row.product_id || '',
    clientId: row.client_id || '',
    shopId: row.shop_id || '',
    quantity: Number(row.quantity || 0),
    totalPrice: Number(row.total_price || 0),
    paymentMethod: String(row.payment_method || 'cash').toLowerCase(),
    date: row.date,
    sellerName: row.seller_name || '',
    sellerRole: row.seller_role || '',
    returnedQuantity: Number(row.returned_quantity || 0),
    refundedAmount: Number(row.refunded_amount || 0),
    productName: row.product_name || '',
    clientName: row.client_name || '',
    clientPhone: row.client_phone || '',
    remoteOnly: true,
  };
}

// Recent sales stay in WatermelonDB for offline use. Older history is read in
// small pages only when a sales or invoices screen is opened.
export function useSaleHistory(shopId, localSales, pageSize = PAGE_SIZE, productId = '') {
  const cacheKey = `${getSession()?.api || ''}|${getSession()?.userId || ''}|${shopId || ''}|${pageSize}|${productId}`;
  const [online, setOnline] = useState(() => navigator.onLine);
  const [history, setHistory] = useState(() => historyCache.get(cacheKey) || { shopId: '', rows: [], cursor: null, status: 'idle', error: '' });
  const [refreshVersion, setRefreshVersion] = useState(0);
  const loadingMore = useRef(false);

  useEffect(() => {
    const onOnline = () => { setOnline(true); setRefreshVersion(version => version + 1); };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  useEffect(() => {
    const refreshAfterPush = event => {
      if (navigator.onLine && event.detail?.shopId === shopId) setRefreshVersion(version => version + 1);
    };
    window.addEventListener('nstock:sync-complete', refreshAfterPush);
    return () => window.removeEventListener('nstock:sync-complete', refreshAfterPush);
  }, [shopId]);

  useEffect(() => {
    if (!shopId || !online) return;
    if (refreshVersion === 0 && historyCache.has(cacheKey)) {
      setHistory(historyCache.get(cacheKey));
      return;
    }
    const controller = new AbortController();
    setHistory(previous => previous.shopId === shopId
      ? { ...previous, status: previous.rows.length ? 'refreshing' : 'loading', error: '' }
      : { shopId, rows: [], cursor: null, status: 'loading', error: '' });
    const query = new URLSearchParams({ shopId, limit: String(pageSize) });
    if (productId) query.set('productId', productId);
    requestJson(`/sales/history?${query}`, { signal: controller.signal }).then(response => {
      if (!controller.signal.aborted) {
        const next = { shopId, rows: response.data.map(saleFromServer), cursor: response.next_cursor, status: 'ready', error: '' };
        historyCache.set(cacheKey, next);
        setHistory(next);
      }
    }).catch(error => {
      if (!controller.signal.aborted) setHistory(previous => previous.shopId === shopId
        ? { ...previous, status: error instanceof SessionError || error instanceof ApiError && [401, 403].includes(error.status) ? 'denied' : 'error',
          accessError: error, error: 'Historique en ligne indisponible. Les ventes présentes sur cet appareil restent visibles.' }
        : previous);
    });
    return () => controller.abort();
  }, [shopId, online, pageSize, productId, refreshVersion, cacheKey]);

  const loadMore = useCallback(async () => {
    if (!online || history.shopId !== shopId || history.status !== 'ready' || !history.cursor || loadingMore.current) return;
    loadingMore.current = true;
    const cursor = history.cursor;
    setHistory(previous => ({ ...previous, status: 'loading-more', error: '' }));
    try {
      const query = new URLSearchParams({ shopId, limit: String(pageSize), cursor });
      if (productId) query.set('productId', productId);
      const response = await requestJson(`/sales/history?${query}`);
      setHistory(previous => {
        if (previous.shopId !== shopId || previous.cursor !== cursor) return previous;
        const next = { ...previous, rows: [...previous.rows, ...response.data.map(saleFromServer)], cursor: response.next_cursor, status: 'ready' };
        historyCache.set(cacheKey, next);
        return next;
      });
      return true;
    } catch (error) {
      setHistory(previous => previous.shopId === shopId
        ? { ...previous, status: error instanceof SessionError || error instanceof ApiError && [401, 403].includes(error.status) ? 'denied' : 'ready',
          accessError: error, error: 'Impossible de charger la suite de l’historique. Réessayez.' }
        : previous);
      return false;
    } finally { loadingMore.current = false; }
  }, [history.cursor, history.shopId, online, pageSize, shopId, productId, cacheKey]);

  const serverRows = history.shopId === shopId ? history.rows : [];
  if (history.shopId === shopId && history.status === 'denied') throw history.accessError;
  const sales = useMemo(() => visibleSaleHistory(localSales, serverRows, online,
    history.shopId === shopId && ['ready', 'loading-more', 'refreshing'].includes(history.status)),
  [localSales, serverRows, online, history.shopId, history.status, shopId]);

  return {
    sales,
    loading: Boolean(shopId && online && (history.shopId !== shopId || history.status === 'loading')),
    loadingMore: history.shopId === shopId && history.status === 'loading-more',
    hasMore: online && history.shopId === shopId && history.status === 'ready' && Boolean(history.cursor),
    error: history.shopId === shopId ? history.error : '',
    loadMore,
  };
}
