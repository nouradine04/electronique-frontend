import { Model } from '@nozbe/watermelondb';

export default class Shop extends Model {
  static table = 'shops';

  get name() { return this._getRaw('name'); }
  set name(val) { this._setRaw('name', val); }

  get address() { return this._getRaw('address'); }
  set address(val) { this._setRaw('address', val); }

  get phone() { return this._getRaw('phone'); }
  set phone(val) { this._setRaw('phone', val); }

  get nif() { return this._getRaw('nif'); }
  set nif(val) { this._setRaw('nif', val); }

  get email() { return this._getRaw('email'); }
  set email(val) { this._setRaw('email', val); }

  get logoUrl() { return this._getRaw('logo_url'); }
  set logoUrl(val) { this._setRaw('logo_url', val); }

  get code() { return this._getRaw('code'); }
  set code(val) { this._setRaw('code', val); }

  get subscriptionPlan() { return this._getRaw('subscription_plan') || 'standard'; }
  set subscriptionPlan(val) { this._setRaw('subscription_plan', val || 'standard'); }

  get accountId() { return this._getRaw('account_id') || this.id; }
  set accountId(val) { this._setRaw('account_id', val || this.id); }

  get synced() { return this._getRaw('synced'); }
  set synced(val) { this._setRaw('synced', val); }

  // Compatibilité des vues utilisant les noms de colonnes.
  get logo_url() { return this.logoUrl; }
  get subscription_plan() { return this.subscriptionPlan; }
  get account_id() { return this.accountId; }
}
