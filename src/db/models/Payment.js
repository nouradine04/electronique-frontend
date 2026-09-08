import { Model } from '@nozbe/watermelondb';

export default class Payment extends Model {
  static table = 'payments';

  get shopId() { return this._getRaw('shop_id'); }
  set shopId(val) { this._setRaw('shop_id', val); }

  get clientId() { return this._getRaw('client_id'); }
  set clientId(val) { this._setRaw('client_id', val); }

  get amount() { return this._getRaw('amount'); }
  set amount(val) { this._setRaw('amount', val); }

  get date() { return this._getRaw('date'); }
  set date(val) { this._setRaw('date', val); }

  get synced() { return this._getRaw('synced'); }
  set synced(val) { this._setRaw('synced', val); }

  // Compatibilité des vues utilisant les noms de colonnes.
  get shop_id() { return this.shopId; }
  get client_id() { return this.clientId; }
}
