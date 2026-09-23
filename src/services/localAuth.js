import { Q } from '@nozbe/watermelondb';
import database, { flushLocalDatabase } from '../db/watermelondb.js';
import { prepareLocalUser } from './prepareLocalUser.js';

const users = database.get('local_users');
const normalizeEmail = email => String(email || '').trim().toLowerCase().replace(/\\@/g, '@');
const emailCandidates = email => {
  const normalized = normalizeEmail(email);
  return Array.from(new Set([normalized, normalized.replace('@', '\\@')]));
};
const normalizePhone = phone => String(phone || '').trim().replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
const toHex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

export const SUBSCRIPTION_PLANS = {
  standard: { id: 'standard', label: 'Standard', maxShops: 1, maxManagers: 2 },
  multishop: { id: 'multishop', label: 'Multi-boutiques', maxShops: 5, maxManagers: Infinity },
};

export const getPlanLimits = plan => SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.standard;
export const queryLocalUsers = shopId => users.query(Q.where('shop_id', shopId));

export async function removeLegacyDemoUsers() {
  const demoUsers = await users.query(
    Q.where('email', Q.oneOf(['admin@nstock.com', 'gestionnaire@nstock.com'])),
  ).fetch();
  if (!demoUsers.length) return;
  await database.write(async () => {
    await database.batch(...demoUsers.map(user => user.prepareMarkAsDeleted()));
  });
}

async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 210000, hash: 'SHA-256' }, key, 256);
  return toHex(new Uint8Array(hash));
}

async function credentials(password) {
  const password_salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return { password_salt, password_hash: await passwordHash(password, password_salt) };
}

function prepareUser(data) {
  return prepareLocalUser(users, data);
}

export async function restoreLocalOwnerFromCloud(session, password) {
  const remoteUser = session?.user;
  const remoteShop = session?.shop;
  if (!remoteUser?.id || !remoteShop?.id) throw new Error('Sauvegarde cloud incomplète.');
  let existingUser = null;
  try { existingUser = await users.find(remoteUser.id); } catch { /* restauration */ }
  const hashed = password ? await credentials(password) : existingUser
    ? { password_hash: existingUser.passwordHash, password_salt: existingUser.passwordSalt }
    : await credentials(crypto.randomUUID());
  const restored = await database.write(async () => {
    let shop;
    let shopOperation = null;
    try { shop = await database.get('shops').find(remoteShop.id); }
    catch {
      shop = database.get('shops').prepareCreate(record => {
        record._raw.id = remoteShop.id;
        record.name = remoteShop.name || 'Ma boutique';
        record.address = remoteShop.address || '';
        record.phone = remoteShop.phone || '';
        record.email = remoteShop.email || remoteUser.email;
        record.logoUrl = remoteShop.logo_url || '';
        record.code = remoteShop.code || '';
        record.subscriptionPlan = remoteShop.subscription_plan || 'standard';
        record.accountId = remoteUser.tenant_id;
        record.synced = true;
        record._setRaw('version', Number(remoteShop.version) || 1);
      });
      shopOperation = shop;
    }
    const data = {
      id: remoteUser.id,
      shop_id: remoteShop.id,
      name: remoteUser.name,
      email: normalizeEmail(remoteUser.email),
      phone: '', role: String(remoteUser.role || 'OWNER').toLowerCase() === 'owner' ? 'owner' : 'manager',
      is_active: true, account_created_at: new Date().toISOString(), synced: true, ...hashed,
      version: Number(remoteUser.version) || 1,
    };
    const previousStatus = existingUser?._raw._status;
    const previousChanged = existingUser?._raw._changed;
    const user = existingUser ? existingUser.prepareUpdate(record => {
      for (const field of ['password_hash', 'password_salt', 'role', 'is_active', 'shop_id']) record._setRaw(field, data[field]);
      // Les identifiants de connexion sont un cache privé, pas une modification métier à renvoyer.
      record._raw._status = previousStatus;
      record._raw._changed = previousChanged;
      if (previousStatus === 'synced') record._raw.version = data.version;
    }) : prepareUser(data);
    if (!existingUser) { user._raw._status = 'synced'; user._raw._changed = ''; }
    if (shopOperation) { shopOperation._raw._status = 'synced'; shopOperation._raw._changed = ''; }
    await database.batch(...[shopOperation, user].filter(Boolean));
    return user;
  }, 'session-restore');
  await flushLocalDatabase();
  return restored;
}

export async function updateLocalUserProfile(userId, { name, phone }) {
  if (!userId) throw new Error('Reconnectez-vous pour modifier votre profil.');
  const user = await users.find(userId);
  const normalizedPhone = normalizePhone(phone);
  if (!name?.trim()) throw new Error('Indiquez votre nom.');
  if (normalizedPhone) {
    const matches = await users.query(Q.where('phone', normalizedPhone)).fetch();
    if (matches.some(account => account.id !== userId)) throw new Error('Ce numéro est déjà utilisé sur cet appareil.');
  }
  await database.write(() => user.update(account => {
    account._setRaw('name', name.trim());
    account._setRaw('phone', normalizedPhone);
    account._setRaw('synced', false);
  }));
  return user;
}

export async function createLocalManager({ shop, name, email, phone, password }) {
  if (!shop?.id) throw new Error('Sélectionnez une boutique.');
  email = normalizeEmail(email || '');
  phone = normalizePhone(phone);
  if (!name?.trim() || !email || !password) throw new Error('Veuillez remplir tous les champs.');
  if (password.length < 4) throw new Error('Le mot de passe doit contenir au moins 4 caractères.');

  const existing = await users.query(Q.where('email', email)).fetchCount();
  if (existing) throw new Error('Cet email est déjà utilisé sur cet appareil.');
  if (phone && await users.query(Q.where('phone', phone)).fetchCount()) throw new Error('Ce numéro est déjà utilisé sur cet appareil.');

  const plan = getPlanLimits(shop.subscriptionPlan);
  const shopUsers = await queryLocalUsers(shop.id).fetch();
  const activeManagers = shopUsers.filter(user => user.role === 'manager' && user.isActive).length;
  if (activeManagers >= plan.maxManagers) {
    throw new Error(`Le plan ${plan.label} autorise ${plan.maxManagers} gestionnaires actifs.`);
  }

  const hashed = await credentials(password);
  return database.write(async () => {
    const user = prepareUser({
      shop_id: shop.id,
      name: name.trim(),
      email,
      phone,
      role: 'manager',
      is_active: true,
      account_created_at: new Date().toISOString(),
      ...hashed,
    });
    await database.batch(user);
    return user;
  });
}

export async function setLocalUserActive(user, isActive, shop) {
  if (isActive) {
    const plan = getPlanLimits(shop?.subscriptionPlan);
    const shopUsers = await queryLocalUsers(user.shopId).fetch();
    const activeManagers = shopUsers.filter(account => account.role === 'manager' && account.isActive && account.id !== user.id).length;
    if (activeManagers >= plan.maxManagers) {
      throw new Error(`Le plan ${plan.label} autorise ${plan.maxManagers} gestionnaires actifs.`);
    }
  }

  return database.write(async () => user.update(account => {
    account._setRaw('is_active', Boolean(isActive));
    account._setRaw('synced', false);
  }));
}
