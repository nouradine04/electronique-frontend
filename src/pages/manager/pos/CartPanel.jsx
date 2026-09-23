import { Plus, Minus, Trash2, ShoppingCart, Package } from 'lucide-react';

import { LocalImage } from '../../../components/common/LocalImage.jsx';

import { variantLabel, BRAND } from './constants';

export function CartPanel({ cart, cartItems, updateQty, removeFromCart, cartTotal, setShowPaymentModal }) {
  return (
<div style={{ width: '340px', borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={20} color={BRAND} />
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>Panier</span>
            {cart.length > 0 && (
              <span style={{ marginLeft: 'auto', background: BRAND, color: '#fff', borderRadius: '12px', padding: '2px 10px', fontSize: '13px', fontWeight: 700 }}>
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <ShoppingCart size={36} style={{ opacity: 0.2, marginBottom: '8px' }} />
                <p style={{ fontSize: '14px' }}>Cliquez sur un produit pour l'ajouter</p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.product.id} className="pos-cart-item">
                  <span className="pos-cart-photo"><LocalImage src={item.product.imageUrl || item.product.image_url} alt="" fallback={<Package size={18} />} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.product.name}
                    </div>
                    <div className="pos-variant">{variantLabel(item.product)}</div>
                    <div style={{ fontSize: '13px', color: BRAND, fontWeight: 700 }}>
                      {(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button className="qty-btn" onClick={() => updateQty(item.product.id, -1)}><Minus size={14} /></button>
                    <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.product.id, 1)} disabled={item.quantity >= item.product.quantity}><Plus size={14} /></button>
                    <button className="qty-btn" onClick={() => removeFromCart(item.product.id)} style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: '20px', color: BRAND }}>
                  {cartTotal.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700 }}
                onClick={() => setShowPaymentModal(true)}
              >
                Procéder au paiement
              </button>
            </div>
          )}
        </div>
  );
}
