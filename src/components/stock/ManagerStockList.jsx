import React from 'react';
import { Package, Eye, Plus, Minus, Pencil, MapPin } from 'lucide-react';
import { LocalImage } from '../common/LocalImage.jsx';

export function ManagerStockList({ products, onView, onMovement, onEdit }) {
  if (products.length === 0) return <div className="ms-empty"><Package size={28} /><strong>Aucun produit trouvé</strong><span>Modifiez la recherche ou les filtres.</span></div>;

  return <div className="ms-inventory" role="table" aria-label="État du stock">
    <div className="ms-inventory-head" role="row">
      <span role="columnheader">Produit</span><span role="columnheader">Emplacement</span><span role="columnheader">Disponible</span><span role="columnheader">État</span><span role="columnheader">Actions</span>
    </div>
    {products.map(product => {
    const pending = product.status === 'PENDING_PRICE';
    const minimum = product.minStock ?? product.min_stock ?? 5;
    const status = pending ? 'En attente' : product.quantity <= 0 ? 'Rupture' : product.quantity <= minimum ? 'Stock faible' : 'En stock';
    const statusClass = pending ? 'pending' : product.quantity <= 0 ? 'out' : product.quantity <= minimum ? 'low' : 'ok';
    return <article className="ms-inventory-row" role="row" key={product.id}>
      <button className="ms-item" role="cell" onClick={() => onView(product.id)} aria-label={`Voir la fiche de ${product.name}`}>
        <span className="ms-item-image">{product.imageUrl ? <LocalImage src={product.imageUrl} alt="" /> : <Package size={22} />}</span>
        <span className="ms-item-copy"><strong>{product.name}</strong><small>{product.sku || 'Sans référence'}{!pending && product.price ? ` · ${Number(product.price).toLocaleString('fr-FR')} FCFA` : ''}</small></span>
      </button>
      <div className="ms-location" role="cell"><MapPin size={15} /><span>{product.location || 'Non indiqué'}</span></div>
      <div className="ms-quantity" role="cell"><strong>{Number(product.quantity || 0)}</strong><span>pièce{Number(product.quantity || 0) > 1 ? 's' : ''}</span><small>Seuil : {minimum}</small></div>
      <div className="ms-status-cell" role="cell"><span className={`ms-stock-badge ${statusClass}`}>{status}</span>{pending && <small>Validation admin requise</small>}</div>
      <div className="ms-row-actions" role="cell">
        <button className="ms-movement in" title="Enregistrer une entrée" aria-label={`Ajouter une entrée pour ${product.name}`} onClick={() => onMovement(product, 'IN')}><Plus size={16} /><span>Entrée</span></button>
        <button className="ms-movement out" title="Enregistrer une sortie" aria-label={`Ajouter une sortie pour ${product.name}`} onClick={() => onMovement(product, 'OUT')} disabled={Number(product.quantity || 0) === 0}><Minus size={16} /><span>Sortie</span></button>
        <button className="ms-icon-action" onClick={() => onView(product.id)} aria-label={`Détails de ${product.name}`}><Eye size={17} /></button>
        <button className="ms-icon-action" onClick={() => onEdit(product)} aria-label={`Modifier ${product.name}`}><Pencil size={17} /></button>
      </div>
    </article>;
  })}</div>;
}
