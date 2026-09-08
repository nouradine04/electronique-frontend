import { Model } from '@nozbe/watermelondb';

export default class Invoice extends Model {
  static table = 'invoices';

  get shopId() { return this._getRaw('shop_id'); }
  set shopId(val) { this._setRaw('shop_id', val); }

  get clientId() { return this._getRaw('client_id'); }
  set clientId(val) { this._setRaw('client_id', val); }

  get clientName() { return this._getRaw('client_name'); }
  set clientName(val) { this._setRaw('client_name', val); }

  get amount() { return this._getRaw('amount'); }
  set amount(val) { this._setRaw('amount', val); }

  get status() { return this._getRaw('status'); }
  set status(val) { this._setRaw('status', val); }

  get dateEmission() { return this._getRaw('date_emission'); }
  set dateEmission(val) { this._setRaw('date_emission', val); }

  get dateEcheance() { return this._getRaw('date_echeance'); }
  set dateEcheance(val) { this._setRaw('date_echeance', val); }

  get itemsJson() { return this._getRaw('items_json'); }
  set itemsJson(val) { this._setRaw('items_json', val); }

  get synced() { return this._getRaw('synced'); }
  set synced(val) { this._setRaw('synced', val); }

  // Compatibilité des vues utilisant les noms de colonnes.
  get shop_id() { return this.shopId; }
  get client_id() { return this.clientId; }
  get client_name() { return this.clientName; }
  get date_emission() { return this.dateEmission; }
  get date_echeance() { return this.dateEcheance; }
  get items_json() { return this.itemsJson; }
}
