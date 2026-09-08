import { Model } from '@nozbe/watermelondb';

export default class StockMovement extends Model {
  static table = 'stock_movements';

  get productId() { return this._getRaw('product_id'); }
  set productId(val) { this._setRaw('product_id', val); }

  get shopId() { return this._getRaw('shop_id'); }
  set shopId(val) { this._setRaw('shop_id', val); }

  get type() { return this._getRaw('type'); }
  set type(val) { this._setRaw('type', val); }

  get quantity() { return this._getRaw('quantity'); }
  set quantity(val) { this._setRaw('quantity', val); }

  get reason() { return this._getRaw('reason'); }
  set reason(val) { this._setRaw('reason', val); }

  get userName() { return this._getRaw('user_name'); }
  set userName(val) { this._setRaw('user_name', val); }

  get date() { return this._getRaw('date'); }
  set date(val) { this._setRaw('date', val); }

  get supplierName() { return this._getRaw('supplier_name'); }
  set supplierName(val) { this._setRaw('supplier_name', val); }

  get deliveryReference() { return this._getRaw('delivery_reference'); }
  set deliveryReference(val) { this._setRaw('delivery_reference', val); }

  get unitCost() { return Number(this._getRaw('unit_cost')) || 0; }
  set unitCost(val) { this._setRaw('unit_cost', Number(val) || 0); }

  get synced() { return this._getRaw('synced'); }
  set synced(val) { this._setRaw('synced', val); }

  // Compatibilité des vues utilisant les noms de colonnes.
  get product_id() { return this.productId; }
  get shop_id() { return this.shopId; }
  get user_name() { return this.userName; }
  get supplier_name() { return this.supplierName; }
  get delivery_reference() { return this.deliveryReference; }
  get unit_cost() { return this.unitCost; }
}
