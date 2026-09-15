import { Q } from '@nozbe/watermelondb';
import database, { flushLocalDatabase } from '../db/watermelondb.js';
import { isTauriDesktop, upsertDesktopRecord } from './desktopVault';

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
  return users.prepareCreate(user => {
    for (const [field, value] of Object.entries(data)) user._setRaw(field, value);
    user._setRaw('synced', data.synced === true);
  });
}

async function persistDesktopRegistration(shop, user, categories) {
  if (!isTauriDesktop()) return;
  const tenantId = shop.accountId || shop.id;
  const now = new Date().toISOString();
  const records = [
    { collection: 'shops', record: shop, shopId: shop.id },
    { collection: 'local_users', record: user, shopId: shop.id },
    ...categories.map(record => ({ collection: 'categories', record, shopId: shop.id })),
  ];
  await Promise.all(records.map(({ collection, record, shopId }) => upsertDesktopRecord({
    collection,
    id: record.id,
    tenantId,
    shopId,
    payload: { ...record._raw },
    updatedAt: now,
    deletedAt: null,
    syncStatus: 'pending',
  })));
}

export async function loginLocalUser(identifier, password) {
  const value = String(identifier || '').trim();
  const field = value.includes('@') ? 'email' : 'phone';
  const normalized = field === 'email' ? normalizeEmail(value) : normalizePhone(value);
  const matches = await users.query(Q.where(field, field === 'email' ? Q.oneOf(emailCandidates(normalized)) : normalized)).fetch();
  for (const user of matches) {
    if (user.isActive && await passwordHash(password, user.passwordSalt) === user.passwordHash) return user;
  }
  throw new Error('Identifiant ou mot de passe incorrect');
}

export async function loginLocalGoogleUser(email) {
  const user = (await users.query(Q.where('email', Q.oneOf(emailCandidates(email)))).fetch()).find(account => account.isActive);
  if (!user || !user.isActive) throw new Error('Aucun compte actif ne correspond à cette adresse Google. Créez d’abord votre boutique ou demandez à votre administrateur de vous ajouter.');
  return user;
}

export async function registerLocalShop({ name, code, email, phone, password, adminName, subscriptionPlan = 'standard' }) {
  email = normalizeEmail(email);
  phone = normalizePhone(phone);
  if (!name.trim() || !adminName.trim() || !email || !password) throw new Error('Veuillez remplir tous les champs');
  const plan = getPlanLimits(subscriptionPlan);
  const hashed = await credentials(password);
  const registration = await database.write(async () => {
    if (await users.query(Q.where('email', Q.oneOf(emailCandidates(email)))).fetchCount()) throw new Error('Cet email est déjà utilisé sur cet appareil.');
    if (phone && await users.query(Q.where('phone', phone)).fetchCount()) throw new Error('Ce numéro est déjà utilisé sur cet appareil.');
    const shop = database.get('shops').prepareCreate(s => {
      s.name = name.trim(); s.code = code; s.email = email; s.phone = phone; s.subscriptionPlan = plan.id; s.accountId = s.id; s.synced = false;
    });
    const user = prepareUser({
      shop_id: shop.id,
      name: adminName.trim(),
      email,
      phone,
      role: 'owner',
      is_active: true,
      account_created_at: new Date().toISOString(),
      ...hashed,
    });
    const categories = ['Téléphones', 'Accessoires', 'Tablettes', 'Informatique', 'Audio', 'Autres'].map(name =>
      database.get('categories').prepareCreate(c => { c.shopId = shop.id; c.name = name; c.synced = false; })
    );
    await database.batch(shop, user, ...categories);
    await persistDesktopRegistration(shop, user, categories);
    return { shop, user };
  });
  await flushLocalDatabase();
  return registration;
}

export async function restoreLocalOwnerFromCloud(session, password) {
  const remoteUser = session?.user;
  const remoteShop = session?.shop;
  if (!remoteUser?.id || !remoteShop?.id) throw new Error('Sauvegarde cloud incomplète.');
  try { return await users.find(remoteUser.id); } catch { /* restauration */ }
  const hashed = await credentials(password);
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
      });
      shopOperation = shop;
    }
    const user = prepareUser({
      id: remoteUser.id,
      shop_id: remoteShop.id,
      name: remoteUser.name,
      email: normalizeEmail(remoteUser.email),
      phone: '', role: String(remoteUser.role || 'OWNER').toLowerCase() === 'owner' ? 'owner' : 'manager',
      is_active: true, account_created_at: new Date().toISOString(), synced: true, ...hashed,
    });
    await database.batch(...[shopOperation, user].filter(Boolean));
    return user;
  });
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
