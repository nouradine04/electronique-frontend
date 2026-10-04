import React, { useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { Check } from 'lucide-react';
import database from '../../db/watermelondb';
import { useQuery } from '../../db/useQuery';
import { normalizeIdentifierSearch, unitRaw } from '../../services/productUnits';
import { shortIdentifier } from '../../pages/manager/pos/search.js';
import './unit-picker.css';

type Props = {
  productId: string;
  shopId?: string;
  selected: string[];
  onChange: (ids: string[]) => void;
  quantity: number;
  saleId?: string;
  initialSearch?: string;
  suggestedUnitId?: string;
  lockedSelected?: boolean;
};

export function UnitPicker({ productId, shopId, selected, onChange, quantity, saleId, initialSearch = '', suggestedUnitId = '', lockedSelected = false }: Props) {
  const [search, setSearch] = useState(initialSearch);
  const events = useQuery(saleId ? database.get('unit_events').query(Q.where('sale_id', saleId), ...(shopId ? [Q.where('shop_id', shopId)] : [])) : null);
  const returned = new Set(events.filter(event => unitRaw(event).kind === 'RETURNED').map(event => unitRaw(event).unit_id));
  const soldIds = events.filter(event => unitRaw(event).kind === 'SOLD' && !returned.has(unitRaw(event).unit_id)).map(event => unitRaw(event).unit_id);
  const query = normalizeIdentifierSearch(search);
  const units = useQuery(database.get('product_units').query(
    Q.where('product_id', productId), ...(shopId ? [Q.where('shop_id', shopId)] : []),
    Q.where('state', saleId ? 'SOLD' : 'AVAILABLE'),
    ...(saleId ? [Q.where('id', Q.oneOf(soldIds))] : []),
    Q.where('identifier', Q.like(`%${Q.sanitizeLikeString(query)}%`)),
    Q.sortBy('identifier', Q.asc), Q.take(31),
  ));
  const selectedRecords = useQuery(selected.length ? database.get('product_units').query(
    Q.where('product_id', productId), ...(shopId ? [Q.where('shop_id', shopId)] : []), Q.where('id', Q.oneOf(selected)),
  ) : null);
  const visible = [...selectedRecords, ...units].filter((unit, index, all) => all.findIndex(other => other.id === unit.id) === index);
  const shown = visible.slice(0, 30);
  const identifierType = shown[0] ? unitRaw(shown[0]).identifier_type : 'IMEI';
  const suffix = unit => {
    const identifier = unitRaw(unit).identifier || '';
    for (const length of [4, 6, 8]) {
      const ending = identifier.slice(-length);
      if (shown.filter(other => String(unitRaw(other).identifier || '').endsWith(ending)).length === 1) return shortIdentifier(identifier, length);
    }
    return identifier;
  };

  return <fieldset className="unit-picker">
    <legend>{saleId ? 'Appareils à retourner' : 'Appareils disponibles'} · {selected.length}/{quantity}</legend>
    <input aria-label="Rechercher un IMEI ou numéro de série" placeholder="Rechercher par derniers chiffres ou IMEI complet" value={search} onChange={event => setSearch(event.target.value)} className="input-field" />
    {!saleId && suggestedUnitId && <p className="unit-picker-hint">Correspondance trouvée : vérifiez l’IMEI sur l’appareil avant de choisir.</p>}
    <div className="unit-picker-grid">
      {shown.map(unit => {
        const identifier = String(unitRaw(unit).identifier || '');
        const isSelected = selected.includes(unit.id);
        const isSuggested = unit.id === suggestedUnitId;
        return <button type="button" key={unit.id} className={`unit-picker-badge${isSelected ? ' selected' : ''}${isSuggested ? ' suggested' : ''}`} aria-pressed={isSelected} aria-label={`${isSelected && lockedSelected ? 'Déjà dans le panier' : isSelected ? 'Retirer' : 'Choisir'} ${identifierType === 'IMEI' ? 'IMEI' : 'numéro de série'} ${identifier}`} title={identifier} disabled={(isSelected && lockedSelected) || (!isSelected && selected.length >= quantity)} onClick={() => onChange(isSelected ? selected.filter(id => id !== unit.id) : [...selected, unit.id])}>
          {isSelected && <Check size={13} aria-hidden="true" />}{suffix(unit)}
        </button>;
      })}
    </div>
    {!shown.length && <p className="unit-picker-empty">Aucun appareil correspondant.</p>}
    {units.length > 30 && <small>Affinez la recherche pour voir d’autres appareils.</small>}
    {selectedRecords.length > 0 && <div className="unit-picker-confirm"><strong>Identifiant{selectedRecords.length > 1 ? 's' : ''} choisi{selectedRecords.length > 1 ? 's' : ''}</strong>{selectedRecords.map(unit => <span key={unit.id}>{unitRaw(unit).identifier}</span>)}</div>}
  </fieldset>;
}
