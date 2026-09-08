import { Model } from '@nozbe/watermelondb';

export default class Sale extends Model {
  static table = 'sales';

  get shopId() { return this._getRaw('shop_id'); }
  set shopId(val) { this._setRaw('shop_id', val); }

  get productId() { return this._getRaw('product_id'); }
  set productId(val) { this._setRaw('product_id', val); }

  get clientId() { return this._getRaw('client_id'); }
  set clientId(val) { this._setRaw('client_id', val); }

  get quantity() { return this._getRaw('quantity'); }
  set quantity(val) { this._setRaw('quantity', val); }

  get totalPrice() { return this._getRaw('total_price'); }
  set totalPrice(val) { this._setRaw('total_price', val); }

  get paymentMethod() { return this._getRaw('payment_method'); }
  set paymentMethod(val) { this._setRaw('payment_method', val); }

  get date() { return this._getRaw('date'); }
  set date(val) { this._setRaw('date', val); }

  get sellerName() { return this._getRaw('seller_name'); }
  set sellerName(val) { this._setRaw('seller_name', val); }

  get sellerRole() { return this._getRaw('seller_role'); }
  set sellerRole(val) { this._setRaw('seller_role', val); }

  get unitCost() { return Number(this._getRaw('unit_cost')) || 0; }
  set unitCost(val) { this._setRaw('unit_cost', Number(val) || 0); }

  get returnedQuantity() { return Number(this._getRaw('returned_quantity')) || 0; }
  set returnedQuantity(val) { this._setRaw('returned_quantity', Number(val) || 0); }

  get refundedAmount() { return Number(this._getRaw('refunded_amount')) || 0; }
  set refundedAmount(val) { this._setRaw('refunded_amount', Number(val) || 0); }

  get synced() { return this._getRaw('synced'); }
  set synced(val) { this._setRaw('synced', val); }

  // Compatibilité des vues utilisant les noms de colonnes.
  get shop_id() { return this.shopId; }
  get product_id() { return this.productId; }
  get client_id() { return this.clientId; }
  get total_price() { return this.totalPrice; }
  get payment_method() { return this.paymentMethod; }
  get seller_name() { return this.sellerName; }
  get seller_role() { return this.sellerRole; }
  get unit_cost() { return this.unitCost; }
  get returned_quantity() { return this.returnedQuantity; }
  get refunded_amount() { return this.refundedAmount; }
}
