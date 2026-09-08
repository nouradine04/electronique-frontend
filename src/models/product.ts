export interface ProductModel {
  id: string;
  shop_id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  sku?: string | null;
  price: number;
  quantity: number;
  min_stock: number;
  status: string;
  image_url?: string | null;
  location?: string | null;
  unit_cost?: number;
  brand?: string | null;
  model?: string | null;
  ram?: string | null;
  storage_capacity?: string | null;
  color?: string | null;
  sim_type?: string | null;
  synced?: boolean;
}
