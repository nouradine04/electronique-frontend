import { Q } from '@nozbe/watermelondb';
import database from '../../db/watermelondb';
import { useQuery } from '../../db/useQuery';
import { normalizeIdentifierSearch, unitRaw } from '../../services/productUnits';
export function useUnitProductMatches(shopId: string, search: string, state?: string) {
  const value = normalizeIdentifierSearch(search);
  const units = useQuery(shopId && value.length >= 3 ? database.get('product_units').query(Q.where('shop_id', shopId), ...(state ? [Q.where('state', state)] : []), Q.where('identifier', Q.like(`${Q.sanitizeLikeString(value)}%`)), Q.take(100)) : null);
  return new Set(units.map(unit => unitRaw(unit).product_id));
}
