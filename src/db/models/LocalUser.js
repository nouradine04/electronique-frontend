import { Model } from '@nozbe/watermelondb';

export default class LocalUser extends Model {
  static table = 'local_users';
  get shopId() { return this._getRaw('shop_id'); }
  get name() { return this._getRaw('name'); }
  get email() { return this._getRaw('email'); }
  get phone() { return this._getRaw('phone') || ''; }
  get role() { return this._getRaw('role'); }
  get passwordHash() { return this._getRaw('password_hash'); }
  get passwordSalt() { return this._getRaw('password_salt'); }
  get isActive() { return this._getRaw('is_active') !== false; }
  get createdAt() { return this._getRaw('account_created_at') || ''; }
}
