export interface SaleHistoryItem {
  id: string;
  shop_id: string;
  product_id?: string | null;
  variant_id?: string | null;
  client_id?: string | null;
  quantity: number;
  total_price: number;
  payment_method: string;
  date: string;
  seller_name?: string | null;
  seller_role?: string | null;
  returned_quantity: number;
  refunded_amount: number;
  version: number;
}

export interface SaleHistoryPage {
  data: SaleHistoryItem[];
  has_more: boolean;
  next_cursor: string | null;
  limit: number;
}

export interface SaleHistoryParams {
  shopId: string;
  cursor?: string | null;
  limit?: number;
  from?: string;
  to?: string;
}
