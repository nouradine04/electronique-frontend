import { Package } from 'lucide-react';
import { LocalImage } from '../../../components/common/LocalImage.jsx';
import './product-card.css';

export function ProductCard({ product, categoryName, onOpen }) {
  const quantity = Number(product.quantity || 0);
  const minimum = Number(product.minStock ?? 5);
  const pending = product.status === 'PENDING_PRICE';
  const status = pending
    ? { label: 'À valider', tone: 'pending' }
    : quantity <= 0
      ? { label: 'Rupture', tone: 'out' }
      : quantity <= minimum
        ? { label: 'Stock bas', tone: 'low' }
        : { label: 'En stock', tone: 'available' };

  return <button type="button" className="product-tile" onClick={onOpen} aria-label={`Voir ${product.name}, ${status.label}`}>
    <span className="product-tile-image">
      <LocalImage
        src={product.imageUrl || product.image_url}
        alt=""
        loading="lazy"
        fallback={<span className="product-tile-placeholder"><Package size={30} strokeWidth={1.5} aria-hidden="true" /></span>}
      />
    </span>
    <span className="product-tile-body">
      <span className="product-tile-category">{categoryName || 'Sans catégorie'}</span>
      <strong className="product-tile-name">{product.name}</strong>
      <span className="product-tile-bottom">
        <strong className="product-tile-price">{pending ? 'Prix à définir' : `${Number(product.price || 0).toLocaleString('fr-FR')} FCFA`}</strong>
        <span className="product-tile-quantity">{quantity} unité{quantity > 1 ? 's' : ''}</span>
      </span>
      <span className={`product-tile-badge ${status.tone}`}>{status.label}</span>
    </span>
  </button>;
}
