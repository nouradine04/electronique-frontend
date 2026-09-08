import { Model } from '@nozbe/watermelondb';

export default class ReturnRecord extends Model {
  static table = 'returns';

  get shopId() { return this._getRaw('shop_id'); }
  set shopId(value) { this._setRaw('shop_id', value); }
  get saleId() { return this._getRaw('sale_id'); }
  set saleId(value) { this._setRaw('sale_id', value); }
  get productId() { return this._getRaw('product_id'); }
  set productId(value) { this._setRaw('product_id', value); }
  get clientId() { return this._getRaw('client_id'); }
  set clientId(value) { this._setRaw('client_id', value); }
  get quantity() { return Number(this._getRaw('quantity')) || 0; }
  set quantity(value) { this._setRaw('quantity', Number(value) || 0); }
  get reason() { return this._getRaw('reason'); }
  set reason(value) { this._setRaw('reason', value); }
  get resolution() { return this._getRaw('resolution'); }
  set resolution(value) { this._setRaw('resolution', value); }
  get restock() { return Boolean(this._getRaw('restock')); }
  set restock(value) { this._setRaw('restock', Boolean(value)); }
  get refundAmount() { return Number(this._getRaw('refund_amount')) || 0; }
  set refundAmount(value) { this._setRaw('refund_amount', Number(value) || 0); }
  get processedBy() { return this._getRaw('processed_by'); }
  set processedBy(value) { this._setRaw('processed_by', value); }
  get date() { return this._getRaw('date'); }
  set date(value) { this._setRaw('date', value); }
  get synced() { return this._getRaw('synced'); }
  set synced(value) { this._setRaw('synced', value); }
}
