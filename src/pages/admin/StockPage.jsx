import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '../../db/useQuery.js';
import { queryProducts, queryCategories, updateProduct, createProduct } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { recordStockMovement } from '../../services/syncEngine.js';
import { AddProductWizard } from '../../components/stock/AddProductWizard.jsx';
import { ProductDetailPage } from '../common/ProductDetailPage.jsx';
import { Search, Plus, ChevronRight, Eye, Package, Smartphone, Tv, Laptop, Watch, Headphones, AlertCircle, X, DollarSign, Save } from 'lucide-react';

export function AdminStockPage() {
  const { t } = useTranslation();
  const { currentShop, userName } = useShop();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedProductForPrice, setSelectedProductForPrice] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const categories = useQuery(queryCategories(currentShop?.id || '')) || [];
  const products = useQuery(queryProducts(currentShop?.id || '')) || [];

  const pendingProducts = products.filter(p => p.status === 'PENDING_PRICE');

  const filteredProducts = products.filter(p => {
    const q = String(searchQuery || '').toLowerCase();
    const nameStr = String(p.name || '').toLowerCase();
    const catStr = String(p.categoryId || '').toLowerCase();
    const matchesSearch = nameStr.includes(q) || catStr.includes(q);
    const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  const getProductIcon = (category) => {
    const cat = String(category || '').toLowerCase();
    if (cat.includes('téléphone') || cat.includes('smartphone')) return <Smartphone size={24} color="#3b82f6" />;
    if (cat.includes('tv') || cat.includes('télévision')) return <Tv size={24} color="#8b5cf6" />;
    if (cat.includes('pc') || cat.includes('laptop') || cat.includes('ordinateur')) return <Laptop size={24} color="#10b981" />;
    if (cat.includes('montre') || cat.includes('watch')) return <Watch size={24} color="#f59e0b" />;
    if (cat.includes('audio') || cat.includes('casque')) return <Headphones size={24} color="#ef4444" />;
    return <Package size={24} color="#6b7280" />;
  };

  if (selectedProductId) {
    return <ProductDetailPage productId={selectedProductId} onBack={() => setSelectedProductId(null)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '1400px', margin: '0 auto', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: '0 0 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{t('admin.stock_title', 'Stock & Produits')}</h2>
          <button type="button" onClick={() => setShowAddProduct(true)} className="btn btn-primary" style={{ minHeight: '42px', padding: '9px 14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', whiteSpace: 'nowrap' }}>
            <Plus size={18} /> Ajouter un produit
          </button>
        </div>
        
        <div style={{ position: 'relative', maxWidth: '500px' }}>
          <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            style={{ 
              width: '100%', 
              padding: '14px 16px 14px 44px', 
              backgroundColor: 'var(--bg-surface)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '12px', 
              fontSize: '1rem',
              color: 'var(--text-primary)',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
            placeholder={t('admin.stock_search_placeholder', 'Rechercher un produit, une catégorie...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '8px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <button
          onClick={() => setSelectedCategory('ALL')}
          style={{
            padding: '8px 20px',
            borderRadius: '24px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            border: selectedCategory === 'ALL' ? 'none' : '1px solid var(--border-color)',
            backgroundColor: selectedCategory === 'ALL' ? '#3b82f6' : 'var(--bg-surface)',
            color: selectedCategory === 'ALL' ? 'white' : 'var(--text-secondary)',
          }}
        >
          {t('common.all', 'Tous')}
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '8px 20px',
              borderRadius: '24px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: selectedCategory === cat.id ? 'none' : '1px solid var(--border-color)',
              backgroundColor: selectedCategory === cat.id ? '#3b82f6' : 'var(--bg-surface)',
              color: selectedCategory === cat.id ? 'white' : 'var(--text-secondary)',
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Pending Products Banner */}
      {pendingProducts.length > 0 && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={24} color="#dc2626" />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#991b1b' }}>{t('admin.action_required', 'Action requise :')} {pendingProducts.length} {t('admin.products_pending_validation', 'produit(s) en attente de validation')}</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#b91c1c' }}>{t('admin.pending_products_description', 'Veuillez définir le prix de base et le prix de vente pour que ces produits soient disponibles en caisse.')}</p>
          </div>
        </div>
      )}

      {/* Product List (Responsive Grid) */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '32px' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
            <Package size={48} style={{ opacity: 0.3, margin: '0 auto 16px auto' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{t('admin.no_products_found', 'Aucun produit trouvé.')}</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {filteredProducts.map((product) => {
              const isActive = product.quantity > 0;
              const isPending = product.status === 'PENDING_PRICE';
              
              return (
                <div 
                  key={product.id} 
                  onClick={() => {
                    if (isPending) {
                      setSelectedProductForPrice(product);
                    } else {
                      setSelectedProductId(product.id);
                    }
                  }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '16px',
                    backgroundColor: isPending ? '#fef2f2' : 'var(--bg-surface)',
                    border: isPending ? '1px solid #fecaca' : '1px solid var(--border-color)',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => { 
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isPending ? '0 4px 6px -1px rgba(254, 202, 202, 0.5)' : '0 4px 10px rgba(0,0,0,0.08)';
                  }}
                  onMouseOut={(e) => { 
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                  }}
                >
                  {/* Image Placeholder */}
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '14px', 
                    backgroundColor: isPending ? '#fee2e2' : 'var(--bg-main)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: '16px',
                    border: '1px solid var(--border-color)',
                    flexShrink: 0
                  }}>
                    {getProductIcon(categories.find(category => category.id === product.categoryId)?.name)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                      {product.name}
                    </div>
                    
                    {!isPending ? (
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '6px' }}>
                        {Number(product.price || 0).toLocaleString('fr-FR')} FCFA
                      </div>
                    ) : (
                      <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.9rem', marginBottom: '6px' }}>
                        {t('admin.price_to_define', 'Prix à définir')}
                      </div>
                    )}

                    <div style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 700,
                      color: isPending ? '#dc2626' : (isActive ? '#059669' : '#dc2626'),
                      backgroundColor: isPending ? '#fee2e2' : (isActive ? '#d1fae5' : '#fee2e2'),
                      padding: '2px 8px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      textTransform: 'capitalize'
                    }}>
                      {isPending ? t('admin.validation_required', 'Validation Requise') : (isActive ? t('common.active', 'Active') : t('common.inactive', 'Non Active'))}
                    </div>
                    
                    {!isPending && (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: product.quantity === 0 ? '#7f1d1d' : (product.quantity < (product.minStock || 5) ? '#fee2e2' : '#d1fae5'),
                          color: product.quantity === 0 ? '#fca5a5' : (product.quantity < (product.minStock || 5) ? '#dc2626' : '#059669'),
                        }}>
                          {product.quantity === 0 ? t('admin.out_of_stock', 'RUPTURE') : (product.quantity < (product.minStock || 5) ? `${t('admin.low_stock', 'Stock Faible')} (${product.quantity})` : `${t('admin.in_stock', 'En stock')} (${product.quantity})`)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ marginLeft: '12px' }}>
                    {isPending ? <ChevronRight size={20} color="#dc2626" /> : <Eye size={19} color="var(--text-muted)" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
