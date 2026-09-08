import React, { useState } from 'react';
import { useQuery } from '../../db/useQuery.js';
import { queryMovementsByProduct, products as productsCollection } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import {
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  Smartphone,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';

function formatDate(value, withTime = false) {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return withTime ? date.toLocaleString('fr-FR') : date.toLocaleDateString('fr-FR');
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
}

function InfoValue({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{value}</div>
    </div>
  );
}

export function ProductDetailPage({ productId, onBack }) {
  const { userRole } = useShop();
  const isOwner = userRole === 'owner';
  const [filterType, setFilterType] = useState('ALL');
  const allProducts = useQuery(productsCollection.query()) || [];
  const product = allProducts.find(item => item.id === productId);
  const movements = useQuery(queryMovementsByProduct(productId)) || [];

  if (!product) return null;

  const filteredMovements = movements.filter(movement => filterType === 'ALL' || movement.type === filterType);
  const deliveries = movements.filter(movement => movement.type === 'IN');
  const totalIn = deliveries.reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
  const totalOut = movements.filter(movement => movement.type === 'OUT').reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
  const isOutOfStock = product.quantity === 0;
  const isLowStock = !isOutOfStock && product.quantity <= product.minStock;
  const status = isOutOfStock
    ? { label: 'Rupture', color: 'var(--danger)', icon: XCircle }
    : isLowStock
      ? { label: 'Stock bas', color: 'var(--warning)', icon: AlertTriangle }
      : { label: 'En stock', color: 'var(--success)', icon: CheckCircle2 };
  const StatusIcon = status.icon;

  let customSpecifications = [];
  try {
    const parsedSpecs = JSON.parse(product.specsJson || '{}');
    customSpecifications = Array.isArray(parsedSpecs.custom_fields)
      ? parsedSpecs.custom_fields.map(field => [field.label, field.value])
      : [];
  } catch {
    customSpecifications = [];
  }

  const specifications = [
    ['Marque', product.brand],
    ['Modèle', product.model],
    ['RAM', product.ram],
    ['Capacité', product.storageCapacity],
    ['Couleur', product.color],
    ['SIM', product.simType],
    ['Batterie', product.battery],
    ['Écran', product.screen],
    ['Système', product.operatingSystem],
    ['Date de sortie', product.releaseDate ? formatDate(product.releaseDate) : ''],
    ...customSpecifications,
  ].filter(([, value]) => Boolean(value));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100, padding: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.58)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: '1120px', maxHeight: '94vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', background: 'var(--bg-main)',
        border: '1px solid var(--border-color)', borderRadius: '18px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
      }}>
        <header style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px',
          background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--info-bg)', color: 'var(--info)', display: 'grid', placeItems: 'center' }}>
            <Smartphone size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h2>
            <div style={{ marginTop: '3px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{product.sku || 'Sans référence'} · Fiche et traçabilité</div>
          </div>
          <button type="button" onClick={onBack} aria-label="Fermer la fiche" style={{ width: '36px', height: '36px', border: '1px solid var(--border-color)', borderRadius: '50%', background: 'var(--bg-main)', color: 'var(--text-secondary)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </header>

        <div style={{ overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))', gap: '14px' }}>
            <section className="surface-panel" style={{ padding: '18px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Stock actuel</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <strong style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>{product.quantity}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>pièce(s)</span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: status.color, fontSize: '0.85rem', fontWeight: 700 }}>
                <StatusIcon size={16} /> {status.label}
              </div>
              <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <InfoValue label="Emplacement" value={product.location || 'Non défini'} />
                <InfoValue label="Seuil d’alerte" value={`${product.minStock || 0} pièce(s)`} />
                <InfoValue label="Ajouté par" value={product.addedBy || 'Non renseigné'} />
                <InfoValue label="Date d’ajout" value={formatDate(product.addedAt)} />
              </div>
            </section>

            <section className="surface-panel" style={{ padding: '18px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Caractéristiques</h3>
              {specifications.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                  {specifications.map(([label, value]) => <InfoValue key={label} label={label} value={value} />)}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Aucune caractéristique renseignée.</div>
              )}
            </section>

            <section className="surface-panel" style={{ padding: '18px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Prix et mouvements</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {isOwner && <InfoValue label="Coût d’achat actuel" value={formatMoney(product.unitCost)} />}
                <InfoValue label="Prix de vente" value={formatMoney(product.price)} />
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>Entrées</span>
                  <strong style={{ color: 'var(--success)', display: 'flex', gap: '4px', alignItems: 'center' }}><TrendingUp size={15} /> {totalIn}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>Sorties</span>
                  <strong style={{ color: 'var(--danger)', display: 'flex', gap: '4px', alignItems: 'center' }}><TrendingDown size={15} /> {totalOut}</strong>
                </div>
              </div>
            </section>
          </div>

          <section className="surface-panel" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' }}>
              <PackageCheck size={19} color="var(--success)" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Historique des livraisons</h3>
              <span className="badge badge-outline">{deliveries.length}</span>
            </div>
            {deliveries.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Aucune réception enregistrée.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {deliveries.map(delivery => (
                  <div key={delivery.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-main)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      <strong>+{delivery.quantity} pièce(s)</strong>
                      <span style={{ color: 'var(--text-muted)' }}>{formatDate(delivery.date)}</span>
                    </div>
                    <div style={{ marginTop: '7px', fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                      <div>Fournisseur : {delivery.supplierName || 'Non renseigné'}</div>
                      <div>Référence : {delivery.deliveryReference || '—'}</div>
                      {isOwner && delivery.unitCost > 0 && <div>Coût unitaire : {formatMoney(delivery.unitCost)}</div>}
                      {delivery.reason && <div>Motif : {delivery.reason}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="surface-panel" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Tous les mouvements</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  ['ALL', 'Tous'],
                  ['IN', 'Entrées'],
                  ['OUT', 'Sorties'],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setFilterType(value)} style={{
                    padding: '6px 10px', borderRadius: '999px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                    border: filterType === value ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: filterType === value ? 'var(--accent-primary)' : 'var(--bg-main)',
                    color: filterType === value ? '#fff' : 'var(--text-secondary)',
                  }}>{label}</button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Type</th><th>Date</th><th>Opérateur</th><th>Motif</th><th style={{ textAlign: 'right' }}>Quantité</th><th>Stockage</th></tr></thead>
                <tbody>
                  {filteredMovements.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun mouvement enregistré.</td></tr>
                  ) : filteredMovements.map(movement => (
                    <tr key={movement.id}>
                      <td><span className={`badge ${movement.type === 'IN' ? 'badge-success' : movement.type === 'OUT' ? 'badge-danger' : 'badge-warning'}`}>{movement.type === 'IN' ? 'Entrée' : movement.type === 'OUT' ? 'Sortie' : 'Ajustement'}</span></td>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(movement.date, true)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{movement.userName || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{movement.reason || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: movement.type === 'IN' ? 'var(--success)' : movement.type === 'OUT' ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : '='}{movement.quantity}
                      </td>
                      <td>{movement.synced ? <span className="badge badge-outline">Synchronisé</span> : <span className="badge badge-warning">Local</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
