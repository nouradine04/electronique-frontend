import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '../../db/useQuery.js';
import { queryMovementsByProduct, products as productsCollection } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { LocalImage } from '../../components/common/LocalImage.jsx';
import { AlertTriangle, CheckCircle2, MapPin, Package, Pencil, TrendingDown, TrendingUp, X, XCircle } from 'lucide-react';
import './product-detail.css';

function formatDate(value, withTime = false) {
  if (!value) return 'Non renseignée';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return withTime ? date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : date.toLocaleDateString('fr-FR');
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
}

function movementLabel(movement) {
  if (movement.type === 'IN') return String(movement.reason || '').startsWith('Retour client') ? 'Retour' : 'Entrée';
  if (movement.type === 'OUT') return !movement.reason || String(movement.reason).toLowerCase().includes('vente') ? 'Vente' : 'Sortie';
  return 'Ajustement';
}

export function ProductDetailPage({ productId, onBack, onEdit }) {
  const { userRole } = useShop();
  const isOwner = userRole === 'owner';
  const reducedMotion = useReducedMotion();
  const [filterType, setFilterType] = useState('ALL');
  const allProducts = useQuery(productsCollection.query()) || [];
  const product = allProducts.find(item => item.id === productId);
  const movements = useQuery(queryMovementsByProduct(productId)) || [];

  if (!product) return null;

  const filteredMovements = movements.filter(item => filterType === 'ALL' || item.type === filterType);
  const totalIn = movements.filter(item => item.type === 'IN').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalOut = movements.filter(item => item.type === 'OUT').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const out = Number(product.quantity || 0) === 0;
  const low = !out && Number(product.quantity || 0) <= Number(product.minStock || 0);
  const status = out ? { label: 'Rupture', className: 'out', Icon: XCircle } : low ? { label: 'Stock faible', className: 'low', Icon: AlertTriangle } : { label: 'En stock', className: 'ok', Icon: CheckCircle2 };
  const StatusIcon = status.Icon;

  let custom = [];
  try {
    const parsed = JSON.parse(product.specsJson || '{}');
    custom = Array.isArray(parsed.custom_fields) ? parsed.custom_fields.map(field => [field.label, field.value]) : [];
  } catch { custom = []; }
  const specifications = [
    ['Marque', product.brand], ['Modèle', product.model], ['RAM', product.ram], ['Capacité', product.storageCapacity],
    ['Couleur', product.color], ['SIM', product.simType], ['Batterie', product.battery], ['Écran', product.screen],
    ['Système', product.operatingSystem], ['Sortie', product.releaseDate ? formatDate(product.releaseDate) : ''], ...custom,
  ].filter(([, value]) => Boolean(value));

  return <Dialog.Root open onOpenChange={open => !open && onBack()}>
    <Dialog.Portal>
      <Dialog.Overlay asChild><motion.div className="pd-overlay" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} /></Dialog.Overlay>
      <Dialog.Content asChild onOpenAutoFocus={event => event.preventDefault()}>
        <motion.div className="pd-dialog" initial={reducedMotion ? false : { opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reducedMotion ? 0 : .22, ease: 'easeOut' }}>
          <header className="pd-header">
            <div className="pd-thumb">{product.imageUrl ? <LocalImage src={product.imageUrl} alt="" /> : <Package size={23} />}</div>
            <div className="pd-heading">
              <Dialog.Title>{product.name}</Dialog.Title>
              <Dialog.Description>{product.sku || 'Sans référence'}</Dialog.Description>
            </div>
            <span className={`pd-status ${status.className}`}><StatusIcon size={14} />{status.label}</span>
            <Dialog.Close className="pd-close" aria-label="Fermer"><X size={18} /></Dialog.Close>
          </header>

          <div className="pd-summary">
            <div><span>Disponible</span><strong>{product.quantity} <small>pièce{Number(product.quantity) > 1 ? 's' : ''}</small></strong></div>
            <div><span>Prix de vente</span><strong>{formatMoney(product.price)}</strong></div>
            <div><span>Emplacement</span><strong><MapPin size={14} />{product.location || 'Non défini'}</strong></div>
          </div>

          <Tabs.Root defaultValue="information" className="pd-tabs">
            <Tabs.List className="pd-tabs-list" aria-label="Détails du produit">
              <Tabs.Trigger value="information">Informations</Tabs.Trigger>
              <Tabs.Trigger value="movements">Mouvements <span>{movements.length}</span></Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="information" asChild>
              <motion.div className="pd-content" initial={reducedMotion ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
                {product.description && <p className="pd-description">{product.description}</p>}
                <section>
                  <h3>Caractéristiques</h3>
                  {specifications.length ? <dl className="pd-specs">{specifications.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p className="pd-muted">Aucune caractéristique renseignée.</p>}
                </section>
                <div className="pd-meta">
                  <span>Seuil d’alerte <strong>{product.minStock || 0}</strong></span>
                  <span>Ajouté par <strong>{product.addedBy || 'Non renseigné'}</strong></span>
                  <span>Date d’ajout <strong>{formatDate(product.addedAt)}</strong></span>
                  {isOwner && <span>Coût d’achat <strong>{formatMoney(product.unitCost)}</strong></span>}
                </div>
              </motion.div>
            </Tabs.Content>

            <Tabs.Content value="movements" asChild>
              <motion.div className="pd-content" initial={reducedMotion ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
                <div className="pd-flow"><span><TrendingUp size={16} />Entrées <strong>{totalIn}</strong></span><span><TrendingDown size={16} />Sorties <strong>{totalOut}</strong></span></div>
                <div className="pd-filters">{[['ALL', 'Tous'], ['IN', 'Entrées'], ['OUT', 'Sorties']].map(([value, label]) => <button type="button" key={value} className={filterType === value ? 'active' : ''} onClick={() => setFilterType(value)}>{label}</button>)}</div>
                <div className="pd-movements">{filteredMovements.length ? filteredMovements.map(item => {
                  const incoming = item.type === 'IN';
                  return <div className="pd-movement" key={item.id}><span className={incoming ? 'in' : item.type === 'OUT' ? 'out' : 'adjust'}>{incoming ? '+' : item.type === 'OUT' ? '−' : '='}{item.quantity}</span><div><strong>{movementLabel(item)}</strong><small>{item.reason || (item.type === 'OUT' ? 'Vente enregistrée' : 'Mouvement manuel')} · {item.userName || 'Utilisateur'}</small></div><time>{formatDate(item.date, true)}</time></div>;
                }) : <p className="pd-muted">Aucun mouvement enregistré.</p>}</div>
              </motion.div>
            </Tabs.Content>
          </Tabs.Root>

          <footer className="pd-footer">
            {onEdit && <button type="button" className="btn btn-primary" onClick={() => onEdit(product)}><Pencil size={16} />Modifier la fiche</button>}
            <Dialog.Close className="btn btn-secondary">Fermer</Dialog.Close>
          </footer>
        </motion.div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
