import React, { useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import database from '../../db/watermelondb';
import { useQuery } from '../../db/useQuery';
import { unitRaw } from '../../services/productUnits';

export function UnitPicker({ productId, selected, onChange, quantity, saleId }: { productId: string; selected: string[]; onChange: (ids: string[]) => void; quantity: number; saleId?: string }) {
  const [search, setSearch] = useState('');
  const events = useQuery(saleId ? database.get('unit_events').query(Q.where('sale_id', saleId)) : null);
  const returned = new Set(events.filter(e => unitRaw(e).kind === 'RETURNED').map(e => unitRaw(e).unit_id));
  const soldIds = events.filter(e => unitRaw(e).kind === 'SOLD' && !returned.has(unitRaw(e).unit_id)).map(e => unitRaw(e).unit_id);
  const units = useQuery(database.get('product_units').query(Q.where('product_id', productId), Q.where('state', saleId ? 'SOLD' : 'AVAILABLE'), ...(saleId ? [Q.where('id', Q.oneOf(soldIds))] : []), Q.where('identifier', Q.like(`%${Q.sanitizeLikeString(search.trim().toUpperCase())}%`)), Q.sortBy('identifier', Q.asc), Q.take(30)));
  return <fieldset style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 10, minWidth: 0, margin: '8px 0' }}>
    <legend style={{ fontSize: 12 }}>Appareils · {selected.length}/{quantity} sélectionné(s)</legend>
    <input aria-label="Rechercher un IMEI ou numéro de série" placeholder="IMEI / numéro de série" value={search} onChange={e => setSearch(e.target.value)} className="input-field" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }} />
    <div style={{ maxHeight: 150, overflowY: 'auto' }}>
      {units.map(unit => <label key={unit.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40, fontSize: 13, overflowWrap: 'anywhere' }}>
        <input type="checkbox" checked={selected.includes(unit.id)} disabled={!selected.includes(unit.id) && selected.length >= quantity} onChange={e => onChange(e.target.checked ? [...selected, unit.id] : selected.filter(id => id !== unit.id))} />
        {unitRaw(unit).identifier}
      </label>)}
      {!units.length && <p style={{ fontSize: 12 }}>Aucun appareil disponible pour cette recherche.</p>}
    </div>
    {units.length === 30 && <small>Affinez la recherche pour trouver un autre appareil.</small>}
  </fieldset>;
}
