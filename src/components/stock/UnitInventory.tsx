import { IdentifierPhotoReader } from './IdentifierPhotoReader';
import React, { useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { Search, Plus, LoaderCircle } from 'lucide-react';
import database from '../../db/watermelondb';
import { useQuery } from '../../db/useQuery';
import { parseIdentifiers, unitRaw } from '../../services/productUnits';
import { recordStockMovement } from '../../services/syncEngine';

function UnitHistory({ id }: { id: string }) {
  const [page, setPage] = useState(0);
  const events = useQuery(database.get('unit_events').query(Q.where('unit_id', id), Q.sortBy('date', Q.desc), Q.skip(page * 10), Q.take(11)));
  return <div style={{ padding: 12, background: 'var(--bg-main)', borderRadius: 8 }}>
    {events.slice(0, 10).map(event => { const e = unitRaw(event); return <div key={event.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
      <strong>{{ RECEIVED: 'Réception', SOLD: 'Vente', RETURNED: 'Retour' }[e.kind] || e.kind}</strong> · {new Date(e.date).toLocaleString('fr-FR')}
      {e.kind !== 'RECEIVED' && <div>{e.client_name || 'Client'} {e.client_phone ? `· ${e.client_phone}` : ''} · {Number(e.amount).toLocaleString('fr-FR')} FCFA</div>}
      {e.sale_id && <small>Vente : {e.sale_id}</small>}
    </div>; })}
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><button type="button" className="btn btn-secondary" disabled={!page} onClick={() => setPage(p => p - 1)}>Précédent</button><button type="button" className="btn btn-secondary" disabled={events.length <= 10} onClick={() => setPage(p => p + 1)}>Suivant</button></div>
  </div>;
}
export function UnitInventory({ product, userName }: { product: any; userName: string }) {
  const [search, setSearch] = useState(''), [page, setPage] = useState(0), [expanded, setExpanded] = useState('');
  const [receiving, setReceiving] = useState(false), [text, setText] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const units = useQuery(database.get('product_units').query(Q.where('product_id', product.id), Q.where('identifier', Q.like(`%${Q.sanitizeLikeString(search.trim().toUpperCase())}%`)), Q.sortBy('identifier', Q.asc), Q.skip(page * 20), Q.take(21)));
  async function receive(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const ids = parseIdentifiers(text, product.trackingMode);
      if (!ids.length) throw new Error('Ajoutez au moins un identifiant.');
      await recordStockMovement({ shop_id: product.shopId, product_id: product.id, type: 'IN', quantity: ids.length, identifiers: text, user_name: userName, reason: 'Réception d’appareils' } as any);
      setText(''); setReceiving(false); setPage(0);
    } catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <section className="pd-content">
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 180px' }}><Search size={18} /><input className="input-field" aria-label="Rechercher un appareil" placeholder="IMEI / numéro de série" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} style={{ minWidth: 0, width: '100%' }} /></label>
      <button type="button" className="btn btn-primary" onClick={() => setReceiving(v => !v)}><Plus size={16} /> Réception</button>
    </div>
    {receiving && <form onSubmit={receive} style={{ marginBottom: 16, display: 'grid', gap: 8 }}>
      <IdentifierPhotoReader mode={product.trackingMode} value={text} onChange={setText} />
      <label>Un {product.trackingMode === 'IMEI' ? 'IMEI principal' : 'numéro de série'} par appareil
        <textarea className="input-field" aria-label="Identifiants des appareils reçus" rows={4} value={text} onChange={e => setText(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} placeholder="Un identifiant par ligne" />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy && <LoaderCircle size={16} className="animate-spin" />} Enregistrer la réception</button>
    </form>}
    {!units.length && <p>Aucun appareil trouvé.</p>}
    {units.slice(0, 20).map(unit => { const u = unitRaw(unit); return <div key={unit.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
      <button type="button" onClick={() => setExpanded(expanded === unit.id ? '' : unit.id)} aria-expanded={expanded === unit.id} style={{ width: '100%', padding: '14px 0', background: 'none', border: 0, color: 'var(--text-primary)', textAlign: 'left', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
        <strong style={{ overflowWrap: 'anywhere' }}>{u.identifier}</strong><span>{{ AVAILABLE: 'Disponible', SOLD: 'Vendu', QUARANTINE: 'Retourné · hors vente' }[u.state]}</span>
      </button>
      {expanded === unit.id && <UnitHistory id={unit.id} />}
    </div>; })}
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}><button type="button" className="btn btn-secondary" disabled={!page} onClick={() => setPage(p => p - 1)}>Précédent</button><button type="button" className="btn btn-secondary" disabled={units.length <= 20} onClick={() => setPage(p => p + 1)}>Suivant</button></div>
  </section>;
}
