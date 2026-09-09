import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '../../db/useQuery.js';
import { queryProducts, queryCategories, updateProduct, createProduct } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { recordStockMovement } from '../../services/syncEngine.js';
import { AddProductWizard } from '../../components/stock/AddProductWizard.jsx';
import { ProductDetailPage } from '../common/ProductDetailPage.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { LocalImage } from '../../components/common/LocalImage.jsx';
import { AddCategoryModal } from '../../components/stock/AddCategoryModal';
import { Search, Plus, ChevronRight, Package, AlertCircle, X, DollarSign, Save, Check, ArrowDown, Clock3, CircleX } from 'lucide-react';
import './stock.css';

export function AdminStockPage() {
  const { t } = useTranslation();
  const { currentShop, userName } = useShop();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedProductForPrice, setSelectedProductForPrice] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const categories = useQuery(queryCategories(currentShop?.id || '')) || [];
  const products = useQuery(queryProducts(currentShop?.id || '')) || [];

  const pendingProducts = products.filter(p => p.status === 'PENDING_PRICE');

  const filteredProducts = products.filter(p => {
    const q = String(searchQuery || '').toLowerCase();
    const nameStr = String(p.name || '').toLowerCase();
    const catStr = String(categories.find(category => category.id === p.categoryId)?.name || '').toLowerCase();
    const matchesSearch = nameStr.includes(q) || catStr.includes(q);
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setCurrentPage(1), [searchQuery, selectedCategory, currentShop?.id]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  const handleAddProduct = async (productData) => {
    try {
      const initialQuantity = Number(productData.quantity || 0);
      const product = await createProduct({
        ...productData,
        status: 'ACTIVE',
        quantity: 0,
        shop_id: currentShop.id,
      });
      if (initialQuantity > 0) {
        await recordStockMovement({
          shop_id: currentShop.id,
          product_id: product.id,
          product_name: product.name,
          type: 'IN',
          quantity: initialQuantity,
          reason: 'Stock initial',
          user_name: userName,
        });
      }
      setShowAddProduct(false);
      showToast('Produit ajouté et disponible à la vente.', 'success');
    } catch (error) {
      showToast(`Impossible d’ajouter le produit : ${error.message}`, 'danger');
    }
  };

  if (selectedProductId) {
    return <ProductDetailPage productId={selectedProductId} onBack={() => setSelectedProductId(null)} />;
  }

  return (
    <div className="admin-stock">
      
      {/* Header */}
      <div className="as-header">
        <div className="as-title-row">
          <div><h2>{t('admin.stock_title', 'Stock & Produits')}</h2><p>{filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} dans {currentShop?.name}</p></div>
          <button type="button" aria-label="Ajouter un produit" onClick={() => setShowAddProduct(true)} className="btn btn-primary as-add">
            <Plus size={18} /> <span>Ajouter un produit</span>
          </button>
        </div>
        
        <div className="as-search">
          <Search size={17} />
          <input
            type="text"
            className="input-field"
            placeholder={t('admin.stock_search_placeholder', 'Rechercher un produit, une catégorie...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="as-stock-value">
        <div><span>Valeur du stock · prix de vente</span><strong>{filteredProducts.reduce((sum, product) => sum + Number(product.quantity || 0) * Number(product.price || 0), 0).toLocaleString('fr-FR')} <small>FCFA</small></strong></div>
        <div><span>Coût d’achat du stock</span><strong>{filteredProducts.reduce((sum, product) => sum + Number(product.quantity || 0) * Number(product.unitCost || 0), 0).toLocaleString('fr-FR')} <small>FCFA</small></strong></div>
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
      <button type="button" className="as-category-add" onClick={() => setShowAddCategory(true)}><Plus size={16} /><span>Catégorie</span></button>
      </div>

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
            <strong>{t('admin.no_products_found', 'Aucun produit trouvé.')}</strong>
            <span>Modifiez la recherche ou choisissez une autre catégorie.</span>
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
                    <span className="as-product-copy"><strong>{product.name}</strong><small>{product.sku || categories.find(category => category.id === product.categoryId)?.name || 'Sans référence'}</small></span>
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
      {showAddCategory && <AddCategoryModal shopId={currentShop?.id} categories={categories} onClose={() => setShowAddCategory(false)} onCreated={() => showToast('Catégorie ajoutée.', 'success')} />}

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

      {showAddProduct && (
        <AddProductWizard
          categories={categories}
          onClose={() => setShowAddProduct(false)}
          onSubmit={handleAddProduct}
        />
      )}

    </div>
  );
}
