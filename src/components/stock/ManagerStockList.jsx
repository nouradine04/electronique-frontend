import React, { useState } from 'react';
import { Package, ChevronDown, Eye, Plus, Minus, Pencil } from 'lucide-react';
import { LocalImage } from '../common/LocalImage.jsx';

export function ManagerStockList({ products, onView, onMovement, onEdit }) {
  const [expanded, setExpanded] = useState(null);
  return <div className="ms-products">{products.length === 0 ? <p className="ms-empty">Aucun produit trouvé. Essayez un autre filtre.</p> : products.map(product => {
    const pending = product.status === 'PENDING_PRICE';
    const status = pending ? 'En attente admin' : product.quantity <= 0 ? 'Épuisé' : product.quantity <= (product.minStock ?? 5) ? 'Stock faible' : 'En stock';
    const open = expanded === product.id;
    return <article className="ms-product" key={product.id}>
      <div className="ms-product-main">
        <button className="ms-product-view" onClick={() => onView(product.id)} aria-label={`Voir ${product.name}`}>
          <span className="ms-product-image">{product.imageUrl ? <LocalImage src={product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Package size={24} />}</span>
          <span className="ms-product-copy"><strong>{product.name}</strong><span>{pending ? 'Prix à définir par l’admin' : `${Number(product.price || 0).toLocaleString('fr-FR')} FCFA`}</span>{product.location && <small>{product.location}</small>}</span>
        </button>
        <div className="ms-product-stock"><strong>{product.quantity}</strong><small>en stock</small></div>
      </div>
      <div className="ms-product-bottom"><span className={`ms-product-status ${pending || status === 'Stock faible' ? 'waiting' : status === 'Épuisé' ? 'empty' : ''}`}>{status}</span><button className="ms-manage" onClick={() => setExpanded(open ? null : product.id)} aria-expanded={open} aria-controls={`ms-actions-${product.id}`}>Gérer <ChevronDown size={15} style={{ transform: open ? 'rotate(180deg)' : undefined }} /></button></div>
      {open && <div className="ms-product-menu" id={`ms-actions-${product.id}`}><button onClick={() => onView(product.id)}><Eye size={16} /> Détails</button><button onClick={() => onMovement(product, 'IN')}><Plus size={16} /> Entrée</button><button onClick={() => onMovement(product, 'OUT')}><Minus size={16} /> Sortie</button><button onClick={() => onEdit(product)}><Pencil size={16} /> Modifier</button></div>}
    </article>;
  })}</div>;
}
