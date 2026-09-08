import { Model } from '@nozbe/watermelondb';

export default class Category extends Model {
  static table = 'categories';

  get shopId() { return this._getRaw('shop_id'); }
  set shopId(val) { this._setRaw('shop_id', val); }

  get name() { return this._getRaw('name'); }
  set name(val) { this._setRaw('name', val); }

  get synced() { return this._getRaw('synced'); }
  set synced(val) { this._setRaw('synced', val); }

  // Compatibilité des vues utilisant les noms de colonnes.
  get shop_id() { return this.shopId; }
}
