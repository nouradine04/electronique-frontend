import { Model } from '@nozbe/watermelondb';

export default class Client extends Model {
  static table = 'clients';

  get shopId() { return this._getRaw('shop_id'); }
  set shopId(val) { this._setRaw('shop_id', val); }

  get name() { return this._getRaw('name'); }
  set name(val) { this._setRaw('name', val); }

  get phone() { return this._getRaw('phone'); }
  set phone(val) { this._setRaw('phone', val); }

  get email() { return this._getRaw('email'); }
  set email(val) { this._setRaw('email', val); }

  get synced() { return this._getRaw('synced'); }
  set synced(val) { this._setRaw('synced', val); }

  // Compatibilité des vues utilisant les noms de colonnes.
  get shop_id() { return this.shopId; }
}
