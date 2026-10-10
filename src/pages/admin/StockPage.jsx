import { useExactUnitMatch, useUnitProductMatches } from '../../components/stock/useUnitProductMatches';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryState } from '../../db/useQuery.js';
import { queryProducts, queryCategories, updateProduct } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { useSync } from '../../context/SyncContext.jsx';
import { ProductDetailPage } from '../common/ProductDetailPage.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { LocalImage } from '../../components/common/LocalImage.jsx';
import { calculateStockFinance, filterStockProducts } from './stockFinance.js';
import { normalizeIdentifierSearch } from '../../services/productUnits';
import { useHybridRead } from '../../services/useHybridRead.js';
import { Search, ChevronRight, Package, AlertCircle, X, DollarSign, Save, Check, ArrowDown, ArrowUpRight, ArrowDownRight, Minus, Clock3, CircleX } from 'lucide-react';
import './stock.css';

export function AdminStockPage() {
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const { initialPullPending, syncError } = useSync();
  const [searchQuery, setSearchQuery] = useState('');
  const unitMatches = useUnitProductMatches(currentShop?.id, searchQuery);
  const exactUnit = useExactUnitMatch(currentShop?.id, searchQuery);
  const lastOpenedUnit = useRef('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedProductForPrice, setSelectedProductForPrice] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const localCategories = useQuery(queryCategories(currentShop?.id || '')) || [];
  const categories = useHybridRead('categories', currentShop?.id, localCategories).records;
  const productQuery = useQueryState(currentShop ? queryProducts(currentShop.id) : null);
  const products = useHybridRead('products', currentShop?.id, productQuery.records).records;

  const filteredProducts = filterStockProducts(products, categories, selectedCategory, searchQuery, unitMatches);
  const pendingProducts = filteredProducts.filter(product => product.status === 'PENDING_PRICE');
  const { saleValue, purchaseCost, margin, marginPercent, unpricedCount } = calculateStockFinance(filteredProducts);
  const MarginIcon = margin > 0 ? ArrowUpRight : margin < 0 ? ArrowDownRight : Minus;
  const money = value => value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setCurrentPage(1), [searchQuery, selectedCategory, currentShop?.id]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);
  useEffect(() => {
    const identifier = normalizeIdentifierSearch(searchQuery);
    const key = `${currentShop?.id}:${identifier}`;
    if (!exactUnit || exactUnit.identifier !== identifier || selectedProductId || lastOpenedUnit.current === key) return;
    const timer = setTimeout(() => {
      lastOpenedUnit.current = key;
      setSelectedCategory('ALL');
      setSelectedProductId(exactUnit.product_id);
    }, 350);
    return () => clearTimeout(timer);
  }, [currentShop?.id, exactUnit?.id, exactUnit?.identifier, exactUnit?.product_id, searchQuery, selectedProductId]);

  if (selectedProductId) {
    return <ProductDetailPage initialUnitSearch={exactUnit?.product_id === selectedProductId ? searchQuery : unitMatches.has(selectedProductId) ? searchQuery : ''} productId={selectedProductId} onBack={() => setSelectedProductId(null)} />;
  }

  return (
    <div className="admin-stock">
      
      {/* Header */}
      <div className="as-header">
        <div className="as-title-row">
          <div><h2>Stock</h2><p>{filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} dans {currentShop?.name}</p></div>
        </div>
        
        <div className="as-search">
          <Search size={17} />
          <input
            type="text"
            className="input-field"
            placeholder="Produit, IMEI ou numéro de série…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="as-category-toolbar">
      <div className="as-filters">
        <button
          onClick={() => setSelectedCategory('ALL')}
          aria-pressed={selectedCategory === 'ALL'}
        >
          {t('common.all', 'Tous')}
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            aria-pressed={selectedCategory === cat.id}
          >
            {cat.name}
          </button>
        ))}
      </div>
      </div>

      <section className="as-stock-value" aria-label="Estimation financière du stock filtré">
        <div><span>Valeur de vente du stock</span><strong>{money(saleValue)} <small>FCFA</small></strong></div>
        <div><span>Coût d’achat du stock</span><strong>{money(purchaseCost)} <small>FCFA</small></strong></div>
        <div className={`as-margin${margin < 0 ? ' is-negative' : ''}`}>
          <span className="as-margin-label"><MarginIcon size={17} aria-hidden="true" />Marge bénéficiaire estimée</span>
          <div className="as-margin-result">
            <strong>{money(margin)} <small>FCFA</small></strong>
            <small className="as-margin-rate">{marginPercent === null ? 'Taux non disponible' : `${marginPercent.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % du coût d’achat`}</small>
          </div>
        </div>
        {unpricedCount > 0 && <p className="as-finance-note">{unpricedCount} produit{unpricedCount > 1 ? 's' : ''} en stock sans prix de vente exclu{unpricedCount > 1 ? 's' : ''} de cette estimation.</p>}
      </section>

      {/* Pending Products Banner */}
      {pendingProducts.length > 0 && (
        <div className="as-pending">
          <AlertCircle size={19} />
          <div>
            <strong>{pendingProducts.length} produit{pendingProducts.length > 1 ? 's' : ''} à valider</strong>
            <span>Ajoutez les prix pour les rendre disponibles à la vente.</span>
          </div>
        </div>
      )}

      {/* Product List (Responsive Grid) */}
      <div className="as-list-panel">
        <div className="as-panel-heading">
          <div><Package size={18} /><strong>Inventaire</strong><span className="as-count">{filteredProducts.length}</span></div>
          <span>{filteredProducts.reduce((total, product) => total + Number(product.quantity || 0), 0).toLocaleString('fr-FR')} unités en stock</span>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="as-empty">
            <Package size={32} />
            <strong>{productQuery.loading || initialPullPending && !products.length ? 'Chargement des produits…' : syncError && !products.length ? 'Synchronisation interrompue.' : t('admin.no_products_found', 'Aucun produit trouvé.')}</strong>
            <span>{productQuery.loading || initialPullPending && !products.length ? 'Lecture de la boutique en cours.' : syncError && !products.length ? 'Les données locales sont conservées. Réessayez lorsque le serveur répond.' : 'Modifiez la recherche ou choisissez une autre catégorie.'}</span>
          </div>
        ) : (
          <div className="as-inventory" role="table" aria-label="Inventaire des produits">
            <div className="as-inventory-head" role="row"><span>Produit</span><span>Prix unitaire</span><span>Stock</span><span>État</span><span></span></div>
            {paginatedProducts.map((product) => {
              const isPending = product.status === 'PENDING_PRICE';
              const minimum = Number(product.minStock || 5);
              const isOut = Number(product.quantity || 0) === 0;
              const isLow = !isOut && Number(product.quantity || 0) <= minimum;
              const statusLabel = isPending ? 'À valider' : isOut ? 'Rupture' : isLow ? 'Stock faible' : 'En stock';
              const statusClass = isPending ? 'pending' : isOut ? 'out' : isLow ? 'low' : 'ok';
              const StatusIcon = isPending ? Clock3 : isOut ? CircleX : isLow ? ArrowDown : Check;
              
              return (
                <button
                  type="button"
                  key={product.id} 
                  className="as-product-row"
                  onClick={() => {
                    if (isPending) {
                      setSelectedProductForPrice(product);
                    } else {
                      setSelectedProductId(product.id);
                    }
                  }}
                >
                  <span className="as-product-main" role="cell">
                    <span className="as-product-image">
                      <LocalImage src={product.imageUrl || product.image_url} alt="" fallback={<Package size={20} />} />
                    </span>
                    <span className="as-product-copy"><strong>{product.name}</strong><small>{categories.find(category => category.id === product.categoryId)?.name || 'Produit'}</small></span>
                  </span>
                  <strong className="as-price" role="cell">{isPending ? 'Prix à définir' : `${Number(product.price || 0).toLocaleString('fr-FR')} FCFA`}<small className="as-unit-label"> / unité</small></strong>
                  <span className="as-quantity" role="cell"><strong>{Number(product.quantity || 0)}</strong><small>pièce{Number(product.quantity || 0) > 1 ? 's' : ''}</small></span>
                  <span role="cell"><span className={`as-status ${statusClass}`}><StatusIcon size={12} aria-hidden="true" />{statusLabel}</span></span>
                  <ChevronRight className="as-chevron" size={18} />
                </button>
              );
            })}
          </div>
        )}
      </div>
      <Pagination page={currentPage} totalPages={totalPages} totalItems={filteredProducts.length} itemLabel="produit" onPageChange={setCurrentPage} />

      {/* Admin Price Completion Modal */}
      {selectedProductForPrice && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px'
        }}>
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding: '20px 24px', backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <DollarSign size={24} color="#1e40af" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('admin.validate_product', 'Valider le produit')}</h3>
              </div>
              <button onClick={() => setSelectedProductForPrice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                await updateProduct(selectedProductForPrice, {
                  unit_cost: Number(formData.get('unit_cost')),
                  price: Number(formData.get('price')),
                  min_stock: Number(formData.get('min_stock')),
                  status: 'ACTIVE'
                });
                setSelectedProductForPrice(null);
              }}
              style={{ padding: '24px' }}
            >
              <div style={{ marginBottom: '24px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('admin.product_to_validate', 'Produit à valider :')}</p>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedProductForPrice.name}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('admin.quantity_received', 'Quantité reçue :')} <strong>{selectedProductForPrice.quantity}</strong></p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Coût d’achat unitaire (FCFA)</label>
                  <input name="unit_cost" type="number" required min="1" step="0.01" defaultValue={selectedProductForPrice.unitCost || ''} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem', outline: 'none', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin.sale_price_fcfa', 'Prix de vente FCFA')}</label>
                  <input name="price" type="number" required min="1" step="0.01" defaultValue={selectedProductForPrice.price || ''} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem', outline: 'none', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('admin.alert_threshold', "Seuil d'alerte (Min. Stock)")}</label>
                  <input name="min_stock" type="number" required min="0" defaultValue={selectedProductForPrice.minStock || 5} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '1rem', outline: 'none', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" onClick={() => setSelectedProductForPrice(null)} style={{ padding: '12px 20px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>{t('common.cancel', 'Annuler')}</button>
                <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={18} /> {t('admin.activate_product', 'Activer le produit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
