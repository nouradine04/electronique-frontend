import { X } from 'lucide-react';
import { UnitPicker } from '../../../components/stock/UnitPicker';
import { variantLabel } from './constants';
import './pos-unit-selector.css';

export function PosUnitSelector({ product, selected, suggestedUnitId, suffix, onSelect, onClose }) {
  if (!product) return null;
  return <div className="pos-unit-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="pos-unit-dialog" role="dialog" aria-modal="true" aria-label={`Choisir un appareil ${product.name}`}>
      <header><div><h2>{product.name}</h2><p>{variantLabel(product)} · {product.quantity} disponible{product.quantity > 1 ? 's' : ''}</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={19} /></button></header>
      <p className="pos-unit-instruction">Choisissez l’IMEI de l’appareil remis au client. Les chiffres complets apparaissent après sélection.</p>
      <UnitPicker key={`${product.id}:${suffix}`} productId={product.id} shopId={product.shopId} quantity={selected.length + 1} selected={selected} lockedSelected initialSearch={suffix} suggestedUnitId={suggestedUnitId} onChange={ids => {
        const added = ids.find(id => !selected.includes(id));
        if (added) onSelect(added);
      }} />
      <footer><button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button></footer>
    </section>
  </div>;
}
