import { useUnitProductMatches } from '../../components/stock/useUnitProductMatches';
import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '../../db/useQuery.js';
import { useShop } from '../../context/ShopContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { queryCategories, queryProducts, createProduct, createCategory, updateProduct } from '../../db/queries.js';
import { recordStockMovement } from '../../services/syncEngine.js';
import { AddProductWizard } from '../../components/stock/AddProductWizard.jsx';
import { Search, Plus, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from './catalog/ProductCard.jsx';
import { ProductDetailPage } from '../common/ProductDetailPage.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';

export function CatalogManagementPage() {
  const { currentShop, userName, userRole } = useShop();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const unitMatches = useUnitProductMatches(currentShop?.id, searchQuery);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [catName, setCatName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const BRAND = '#0e6ba8';

  // WatermelonDB reactive queries
  const categories = useQuery(
    currentShop ? queryCategories(currentShop.id) : null,
    [currentShop?.id]
  ) || [];

  const products = useQuery(
    currentShop ? queryProducts(currentShop.id) : null,
    [currentShop?.id]
  ) || [];

  const handleSaveProduct = async (productData) => {
    try {
      if (productData.id) {
        const current = products.find(product => product.id === productData.id);
        await updateProduct(current, {
          ...productData,
          quantity: current.quantity,
          price: current.price,
          unit_cost: current.unitCost,
          status: current.status,
        });
        showToast('Fiche produit mise à jour', 'success');
        setEditingProduct(null);
        return;
      }
      await createProduct({ ...productData, shop_id: currentShop.id, added_by: userName });
      showToast(userRole === 'owner' ? 'Produit enregistré.' : 'Produit enregistré. L’administrateur fixera les prix.', 'success');
      setShowAddWizard(false);
    } catch (err) {
      throw err;
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await createCategory(currentShop.id, catName.trim());
      setCatName('');
      setShowAddCategory(false);
      showToast('Catégorie ajoutée', 'success');
    } catch (err) {
      showToast('Erreur: ' + err.message, 'danger');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const q = (searchQuery || '').toLowerCase();
      const nameMatch = unitMatches.has(product.id) || (product.name || '').toLowerCase().includes(q) || (product.sku || '').toLowerCase().includes(q);
      const catMatch = selectedCategory === 'ALL' || product.categoryId === selectedCategory;
      let statusMatch = true;
      if (statusFilter === 'IN_STOCK') statusMatch = product.quantity > 0 && product.status !== 'PENDING_PRICE';
      if (statusFilter === 'OUT_OF_STOCK') statusMatch = product.quantity === 0 && product.status !== 'PENDING_PRICE';
      if (statusFilter === 'PENDING') statusMatch = product.status === 'PENDING_PRICE';
      return unitMatches.has(product.id) || (nameMatch && catMatch && statusMatch);
    });
  }, [products, searchQuery, selectedCategory, statusFilter, unitMatches]);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setCurrentPage(1), [searchQuery, selectedCategory, statusFilter, currentShop?.id]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  const pendingCount = products.filter(p => p.status === 'PENDING_PRICE').length;
  const outOfStockCount = products.filter(p => p.quantity === 0 && p.status !== 'PENDING_PRICE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0 32px' }}>
      
      {/* Header Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Produits</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowAddCategory(true)}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', backgroundColor: 'transparent', fontWeight: 600, cursor: 'pointer' }}
          >
            Nouvelle catégorie
          </button>
          <button 
            onClick={() => setShowAddWizard(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: BRAND, color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={18} /> Ajouter un produit
          </button>
        </div>
      </div>

      {/* Stats bar (plain text summary) */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginTop: '-8px' }}>
        <span>Total produits : <strong style={{ color: 'var(--text-primary)' }}>{products.length}</strong></span>
        <span>En attente : <strong style={{ color: pendingCount > 0 ? '#c71f37' : 'var(--text-primary)' }}>{pendingCount}</strong></span>
        <span>Ruptures : <strong style={{ color: outOfStockCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{outOfStockCount}</strong></span>
      </div>

      {/* Filters (with dropdown status filter to the right of search input) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Produit, IMEI ou numéro de série…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ width: 'auto', minWidth: '150px', height: '40px', fontWeight: 600 }}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="IN_STOCK">En stock</option>
            <option value="PENDING">En attente</option>
            <option value="OUT_OF_STOCK">Rupture</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button 
            onClick={() => setSelectedCategory('ALL')}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: selectedCategory === 'ALL' ? 'none' : '1px solid var(--border-color)', backgroundColor: selectedCategory === 'ALL' ? BRAND : 'var(--bg-surface)', color: selectedCategory === 'ALL' ? '#fff' : 'var(--text-primary)' }}
          >
            Tous
          </button>
          {categories.map(c => (
            <button 
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: selectedCategory === c.id ? 'none' : '1px solid var(--border-color)', backgroundColor: selectedCategory === c.id ? BRAND : 'var(--bg-surface)', color: selectedCategory === c.id ? '#fff' : 'var(--text-primary)' }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="catalog-grid">
          {paginatedProducts.map(product => <ProductCard
            key={product.id}
            product={product}
            categoryName={categories.find(category => category.id === product.categoryId)?.name}
            onOpen={() => setSelectedProductId(product.id)}
          />)}
        </div>
      )}
      <Pagination page={currentPage} totalPages={totalPages} totalItems={filteredProducts.length} itemLabel="produit" onPageChange={setCurrentPage} />

      {/* Modals */}
      {showAddWizard && (
        <AddProductWizard 
          categories={categories} 
          onClose={() => setShowAddWizard(false)} 
          onSubmit={handleSaveProduct} 
        />
      )}

      {selectedProductId && <ProductDetailPage initialUnitSearch={unitMatches.has(selectedProductId) ? searchQuery : ''} productId={selectedProductId} onBack={() => setSelectedProductId(null)} onEdit={product => { setSelectedProductId(null); setEditingProduct(product); }} />}

      {editingProduct && <AddProductWizard initialData={editingProduct} categories={categories} catalogOnly={userRole === 'manager'} onClose={() => setEditingProduct(null)} onSubmit={handleSaveProduct} />}

      {showAddCategory && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Nouvelle catégorie</h3>
            <form onSubmit={handleSaveCategory}>
              <input 
                type="text"
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder="Nom de la catégorie"
                required
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddCategory(false)} style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: BRAND, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
