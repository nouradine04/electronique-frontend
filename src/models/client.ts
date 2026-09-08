export interface ClientModel {
  id: string;
  shop_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  total_purchases?: number;
  total_payments?: number;
  balance_due?: number;
  synced?: boolean;
}

export interface ClientPaymentModel {
  id: string;
  shop_id: string;
  client_id: string;
  amount: number;
  date: string;
}
