import { Search, Plus, Package } from 'lucide-react';

import { LocalImage } from '../../../components/common/LocalImage.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';

import { variantLabel, BRAND } from './constants';

export function ProductGrid({ searchQuery, setSearchQuery, filteredProducts, productPage, addToCart, cart }) {
  return (
<div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Search */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ position: 'relative', maxWidth: '480px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '40px', height: '40px' }}
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Package size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>Aucun produit en stock</p>
            </div>
          ) : (
            <div className="pos-products-grid">
              {productPage.items.map(product => (
                <button type="button" key={product.id} className="pos-product-card" onClick={() => addToCart(product)} aria-label={`Ajouter ${product.name}, ${variantLabel(product)}, ${product.price} FCFA`}>
                  <div className="pos-product-photo"><LocalImage src={product.imageUrl || product.image_url} alt="" fallback={<Package size={30} />} /></div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                      {product.name}
                    </div>
                    <div className="pos-variant">{variantLabel(product) || 'Caractéristiques non renseignées'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      {product.sku || 'Sans SKU'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: BRAND }}>
                        {Number(product.price).toLocaleString('fr-FR')} <span style={{ fontSize: '11px', fontWeight: 600 }}>FCFA</span>
                      </div>
                      <div style={{
                        fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
                        backgroundColor: product.quantity <= product.minStock ? '#FEF2F2' : '#F0FDF4',
                        color: product.quantity <= product.minStock ? '#EF4444' : '#16A34A'
                      }}>
                        {product.quantity} restant{product.quantity > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: '3px', backgroundColor: BRAND, opacity: 0.2 }} />
                  <span className="pos-add-label"><Plus size={14} /> Ajouter{cart.find(item => item.productId === product.id) ? ` · ${cart.find(item => item.productId === product.id).quantity} au panier` : ''}</span>
                </button>
              ))}
            </div>
          )}
          <Pagination {...productPage.props} itemLabel="produit" />
        </div>
      </div>
  );
}
