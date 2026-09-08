import { Q } from '@nozbe/watermelondb';
import database from '../db/watermelondb.js';

const users = database.get('local_users');
const normalizeEmail = email => email.trim().toLowerCase();
const toHex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

export const SUBSCRIPTION_PLANS = {
  standard: { id: 'standard', label: 'Standard', maxShops: 1, maxManagers: 2 },
  multishop: { id: 'multishop', label: 'Multi-boutiques', maxShops: 5, maxManagers: Infinity },
};

export const getPlanLimits = plan => SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.standard;
export const queryLocalUsers = shopId => users.query(Q.where('shop_id', shopId));

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
  });
}

export async function loginLocalUser(email, password) {
  const [user] = await users.query(Q.where('email', normalizeEmail(email))).fetch();
  if (!user || !user.isActive || await passwordHash(password, user.passwordSalt) !== user.passwordHash) {
    throw new Error('Email ou mot de passe incorrect');
  }
  return user;
}

export async function registerLocalShop({ name, code, email, password, adminName, subscriptionPlan = 'standard' }) {
  email = normalizeEmail(email);
  if (!name.trim() || !adminName.trim() || !email || !password) throw new Error('Veuillez remplir tous les champs');
  const plan = getPlanLimits(subscriptionPlan);
  const hashed = await credentials(password);
  return database.write(async () => {
    if (await users.query(Q.where('email', email)).fetchCount()) throw new Error('Cet email est déjà utilisé sur cet appareil.');
    const shop = database.get('shops').prepareCreate(s => {
      s.name = name.trim(); s.code = code; s.email = email; s.subscriptionPlan = plan.id; s.accountId = s.id; s.synced = false;
    });
    const user = prepareUser({
      shop_id: shop.id,
      name: adminName.trim(),
      email,
      role: 'owner',
      is_active: true,
      account_created_at: new Date().toISOString(),
      ...hashed,
    });
    const categories = ['Téléphones', 'Accessoires', 'Tablettes', 'Informatique', 'Audio', 'Autres'].map(name =>
      database.get('categories').prepareCreate(c => { c.shopId = shop.id; c.name = name; c.synced = false; })
    );
    await database.batch(shop, user, ...categories);
    return shop;
  });
}

export async function createLocalManager({ shop, name, email, password }) {
  if (!shop?.id) throw new Error('Sélectionnez une boutique.');
  email = normalizeEmail(email || '');
  if (!name?.trim() || !email || !password) throw new Error('Veuillez remplir tous les champs.');
  if (password.length < 4) throw new Error('Le mot de passe doit contenir au moins 4 caractères.');

  const existing = await users.query(Q.where('email', email)).fetchCount();
  if (existing) throw new Error('Cet email est déjà utilisé sur cet appareil.');

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
  }));
}

// Same development accounts as the old local seed, never created in production.
let demoPromise;
export function seedLocalDemoUsers(shop) {
  if (!import.meta.env.DEV) return Promise.resolve();
  if (!demoPromise) demoPromise = (async () => {
    if (await users.query().fetchCount()) return;
    const admin = await credentials('admin');
    const manager = await credentials('gest');
    await database.write(async () => {
      if (await users.query().fetchCount()) return;
      await database.batch(
        prepareUser({ shop_id: shop.id, name: 'Administrateur', email: 'admin@nstock.com', role: 'owner', is_active: true, account_created_at: new Date().toISOString(), ...admin }),
        prepareUser({ shop_id: shop.id, name: 'Gestionnaire', email: 'gestionnaire@nstock.com', role: 'manager', is_active: true, account_created_at: new Date().toISOString(), ...manager }),
      );
    });
  })().catch(error => { demoPromise = null; throw error; });
  return demoPromise;
}
