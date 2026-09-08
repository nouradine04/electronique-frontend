import { Model } from '@nozbe/watermelondb';

export default class Expense extends Model {
  static table = 'expenses';

  get shopId() { return this._getRaw('shop_id'); }
  set shopId(value) { this._setRaw('shop_id', value); }
  get category() { return this._getRaw('category'); }
  set category(value) { this._setRaw('category', value); }
  get description() { return this._getRaw('description'); }
  set description(value) { this._setRaw('description', value); }
  get amount() { return Number(this._getRaw('amount')) || 0; }
  set amount(value) { this._setRaw('amount', Number(value) || 0); }
  get date() { return this._getRaw('date'); }
  set date(value) { this._setRaw('date', value); }
  get recurrence() { return this._getRaw('recurrence'); }
  set recurrence(value) { this._setRaw('recurrence', value); }
  get employeeName() { return this._getRaw('employee_name'); }
  set employeeName(value) { this._setRaw('employee_name', value); }
  get createdBy() { return this._getRaw('created_by'); }
  set createdBy(value) { this._setRaw('created_by', value); }
  get synced() { return this._getRaw('synced'); }
  set synced(value) { this._setRaw('synced', value); }
}
