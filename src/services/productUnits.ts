import { Q, type Database, type Model } from '@nozbe/watermelondb';
import { createLocalId } from '../db/localId';

export type TrackingMode = 'QUANTITY' | 'IMEI' | 'SERIAL';
export const unitRaw = (record: Model): Record<string, any> => record._raw;
export function normalizeIdentifierSearch(value: string): string {
  const text = String(value || '').trim().toUpperCase();
  return /^[\d\s-]+$/.test(text) ? text.replace(/[\s-]/g, '') : text;
}

export function parseIdentifiers(text: string, mode: TrackingMode): string[] {
  const values = String(text || '').split(/[\n,;]+/).map(value => value.trim().toUpperCase()).filter(Boolean);
  if (values.length > 100) throw new Error('Recevez au maximum 100 appareils à la fois.');
  for (const value of values) {
    if (mode === 'IMEI') {
      if (!/^\d{15}$/.test(value) || /^(\d)\1+$/.test(value)) throw new Error(`IMEI invalide : ${value}. Il faut 15 chiffres.`);
      const sum = [...value].reverse().reduce((sum, digit, index) => { const n = Number(digit) * (index % 2 ? 2 : 1); return sum + (n > 9 ? n - 9 : n); }, 0);
      if (sum % 10) throw new Error(`Vérifiez l’IMEI ${value} : son chiffre de contrôle est incorrect.`);
    } else if (value.length < 3 || value.length > 100 || /[\x00-\x1f]/.test(value)) throw new Error('Numéro de série invalide (3 à 100 caractères).');
  }
  if (new Set(values).size !== values.length) throw new Error('Le même identifiant apparaît plusieurs fois.');
  return values;
}
export function prepareUnitEvent(db: Database, data: Record<string, any>) {
  return db.get('unit_events').prepareCreateFromDirtyRaw({ id: createLocalId(), amount: 0, date: new Date().toISOString(), ...data, synced: false });
}
export async function prepareReceivedUnits(db: Database, product: Model, text: string, expected: number) {
  const productData = unitRaw(product);
  const mode = productData.tracking_mode || 'QUANTITY';
  if (mode === 'QUANTITY') return [];
  const identifiers = parseIdentifiers(text, mode);
  if (identifiers.length !== expected) throw new Error(`Identifiez les ${expected} appareils reçus (un identifiant par ligne).`);
  if (!identifiers.length) return [];
  const duplicates = await db.get('product_units').query(Q.where('identifier_type', mode), Q.where('identifier', Q.oneOf(identifiers))).fetchCount();
  if (duplicates) throw new Error('Un de ces identifiants existe déjà dans les données locales.');
  const now = new Date().toISOString();
  return identifiers.flatMap(identifier => {
    const unit = db.get('product_units').prepareCreateFromDirtyRaw({ id: createLocalId(), shop_id: productData.shop_id, product_id: product.id, identifier, identifier_type: mode, state: 'AVAILABLE', received_at: now, synced: false });
    return [unit, prepareUnitEvent(db, { shop_id: productData.shop_id, product_id: product.id, unit_id: unit.id, kind: 'RECEIVED', date: now })];
  });
}
export async function availableUnits(db: Database, productId: string) {
  return db.get('product_units').query(Q.where('product_id', productId), Q.where('state', 'AVAILABLE'), Q.sortBy('identifier', Q.asc)).fetch();
}
export async function validateSelectedUnits(db: Database, product: Model, ids: string[], quantity: number, state = 'AVAILABLE') {
  if ((unitRaw(product).tracking_mode || 'QUANTITY') === 'QUANTITY') return [];
  if (ids.length !== quantity || new Set(ids).size !== ids.length) throw new Error('Choisissez un appareil distinct pour chaque unité.');
  const units = await db.get('product_units').query(Q.where('id', Q.oneOf(ids))).fetch();
  if (units.length !== quantity || units.some(unit => unitRaw(unit).product_id !== product.id || unitRaw(unit).shop_id !== unitRaw(product).shop_id || unitRaw(unit).state !== state)) throw new Error('Un appareil sélectionné n’est plus disponible.');
  return units;
}
