import { IdentifierPhotoReader } from './IdentifierPhotoReader';
import React, { useState, useEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import { Search, Plus, LoaderCircle, ChevronDown, ShoppingBag, RotateCcw, PackageCheck } from 'lucide-react';
import database from '../../db/watermelondb';
import { useQuery } from '../../db/useQuery';
import { normalizeIdentifierSearch, parseIdentifiers, unitRaw } from '../../services/productUnits';
import { recordStockMovement } from '../../services/syncEngine';
import './unit-inventory.css';

const STATE_LABELS: Record<string, string> = { AVAILABLE: 'Disponible', SOLD: 'Vendu', QUARANTINE: 'Retour · hors vente' };
const EVENT_LABELS: Record<string, string> = { RECEIVED: 'Entrée en stock', SOLD: 'Vente', RETURNED: 'Retour client' };

function colorValue(color: string) {
  const value = String(color || '').toLocaleLowerCase('fr');
  if (/bleu|blue/.test(value)) return '#2877d5';
  if (/noir|black/.test(value)) return '#252a35';
  if (/blanc|white/.test(value)) return '#f5f5f2';
  if (/gris|gray|grey|graphite/.test(value)) return '#9098a4';
  if (/argent|silver/.test(value)) return '#c7cbd1';
  if (/\bor\b|gold|doré/.test(value)) return '#d8b663';
  if (/rose|pink/.test(value)) return '#e79cb5';
  if (/rouge|red/.test(value)) return '#ce4b52';
  if (/vert|green/.test(value)) return '#4a9a6a';
  if (/violet|purple/.test(value)) return '#8d72b2';
  return '#d4dce6';
}

function UnitHistory({ id, shopId }: { id: string; shopId: string }) {
  const [page, setPage] = useState(0);
  const events = useQuery(database.get('unit_events').query(Q.where('shop_id', shopId), Q.where('unit_id', id), Q.sortBy('date', Q.desc), Q.skip(page * 10), Q.take(11)));
  const saleIds = [...new Set(events.slice(0, 10).map(event => unitRaw(event).sale_id).filter(Boolean))];
  const sales = useQuery(saleIds.length ? database.get('sales').query(Q.where('shop_id', shopId), Q.where('id', Q.oneOf(saleIds))) : null);
  const salesById = new Map(sales.map(sale => [sale.id, sale]));
  return <div className="unit-history">
    <h4>Historique de cet appareil</h4>
    {!events.length && <p>Aucun mouvement enregistré.</p>}
    {events.slice(0, 10).map(event => {
      const entry = unitRaw(event);
      const Icon = entry.kind === 'SOLD' ? ShoppingBag : entry.kind === 'RETURNED' ? RotateCcw : PackageCheck;
      const date = new Date(entry.date);
      return <div key={event.id} className="unit-history-event">
        <span className="unit-history-icon"><Icon size={16} aria-hidden="true" /></span>
        <div className="unit-history-copy">
          <div className="unit-history-title"><strong>{EVENT_LABELS[entry.kind] || entry.kind}</strong><time dateTime={Number.isNaN(date.getTime()) ? undefined : date.toISOString()}>{Number.isNaN(date.getTime()) ? 'Date inconnue' : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</time></div>
          {entry.kind !== 'RECEIVED' && <p>{entry.client_name || 'Client non renseigné'}{entry.client_phone ? ` · ${entry.client_phone}` : ''}{Number(entry.amount) > 0 ? ` · ${Number(entry.amount).toLocaleString('fr-FR')} FCFA` : ''}</p>}
          {entry.kind === 'SOLD' && <small>Vendu par {salesById.get(entry.sale_id)?.sellerName || 'Utilisateur'}</small>}
        </div>
      </div>;
    })}
    {(page > 0 || events.length > 10) && <div className="unit-history-pages"><button type="button" className="btn btn-secondary" disabled={!page} onClick={() => setPage(p => p - 1)}>Précédent</button><span>Page {page + 1}</span><button type="button" className="btn btn-secondary" disabled={events.length <= 10} onClick={() => setPage(p => p + 1)}>Suivant</button></div>}
  </div>;
}

export function UnitInventory({ product, userName, initialSearch = '' }: { product: any; userName: string; initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch), [page, setPage] = useState(0), [expanded, setExpanded] = useState('');
  const [receiving, setReceiving] = useState(false), [text, setText] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const normalizedSearch = normalizeIdentifierSearch(search);
  const units = useQuery(database.get('product_units').query(Q.where('shop_id', product.shopId), Q.where('product_id', product.id), Q.where('identifier', Q.like(`%${Q.sanitizeLikeString(normalizedSearch)}%`)), Q.sortBy('identifier', Q.asc), Q.skip(page * 20), Q.take(21)));
  useEffect(() => {
    if (!initialSearch) return;
    const match = units.find(unit => unitRaw(unit).identifier === normalizeIdentifierSearch(initialSearch));
    if (match) setExpanded(match.id);
  }, [initialSearch, units]);
  async function receive(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const ids = parseIdentifiers(text, product.trackingMode);
      if (!ids.length) throw new Error('Ajoutez au moins un identifiant.');
      await recordStockMovement({ shop_id: product.shopId, product_id: product.id, type: 'IN', quantity: ids.length, identifiers: text, user_name: userName, reason: 'Réception d’appareils' } as any);
      setText(''); setReceiving(false); setPage(0);
    } catch (error: any) { setError(error.message); } finally { setBusy(false); }
  }
  return <section className="pd-content unit-inventory">
    <p className="unit-intro">Sélectionnez un appareil pour voir son entrée en stock, ses ventes et ses retours.</p>
    <div className="unit-toolbar">
      <label className="unit-search"><Search size={18} /><input className="input-field" aria-label="Rechercher un appareil" placeholder="IMEI / numéro de série" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /></label>
      <button type="button" className="btn btn-primary" onClick={() => setReceiving(v => !v)}><Plus size={16} /> Ajouter des appareils</button>
    </div>
    {receiving && <form onSubmit={receive} className="unit-receive-form">
      <IdentifierPhotoReader mode={product.trackingMode} value={text} onChange={setText} />
      <label>Un {product.trackingMode === 'IMEI' ? 'IMEI principal' : 'numéro de série'} par appareil
        <textarea className="input-field" aria-label="Identifiants des appareils reçus" rows={4} value={text} onChange={e => setText(e.target.value)} placeholder="Un identifiant par ligne" />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy && <LoaderCircle size={16} className="animate-spin" />} Enregistrer la réception</button>
    </form>}
    {!units.length && <p>Aucun appareil trouvé.</p>}
    <div className="unit-list">{units.slice(0, 20).map(unit => {
      const item = unitRaw(unit);
      const isMatch = Boolean(normalizedSearch && item.identifier === normalizedSearch);
      return <div key={unit.id} className={`unit-item${isMatch ? ' is-match' : ''}`}>
        <button type="button" className="unit-row" onClick={() => setExpanded(expanded === unit.id ? '' : unit.id)} aria-expanded={expanded === unit.id} aria-label={`${product.color || 'Couleur non renseignée'}, ${product.storageCapacity || 'Capacité non renseignée'}, ${item.identifier}, ${STATE_LABELS[item.state] || item.state}`}>
          <span className="unit-identity"><span className="unit-color" style={{ backgroundColor: colorValue(product.color) }} aria-hidden="true" /><span className="unit-identity-text"><strong>{[product.color, product.storageCapacity].filter(Boolean).join(' · ') || product.name}</strong><small>{item.identifier_type === 'IMEI' ? 'IMEI' : 'N° de série'} : {item.identifier}</small></span></span>
          <span className={`unit-state ${String(item.state || '').toLowerCase()}`}>{STATE_LABELS[item.state] || item.state}</span><ChevronDown className="unit-chevron" size={17} aria-hidden="true" />
        </button>
        {expanded === unit.id && <UnitHistory id={unit.id} shopId={product.shopId} />}
      </div>;
    })}</div>
    {(page > 0 || units.length > 20) && <div className="unit-pages"><button type="button" className="btn btn-secondary" disabled={!page} onClick={() => setPage(p => p - 1)}>Précédent</button><span>Page {page + 1}</span><button type="button" className="btn btn-secondary" disabled={units.length <= 20} onClick={() => setPage(p => p + 1)}>Suivant</button></div>}
  </section>;
}
