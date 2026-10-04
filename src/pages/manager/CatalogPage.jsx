import { useUnitProductMatches } from '../../components/stock/useUnitProductMatches';
import React, { useEffect, useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '../../db/useQuery.js';
import { useShop } from '../../context/ShopContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { queryCategories, queryProducts, createProduct, updateProduct, deleteProduct } from '../../db/queries.js';
import { AddProductWizard } from '../../components/stock/AddProductWizard.jsx';
import { AddCategoryModal } from '../../components/stock/AddCategoryModal';
import { Search, Plus, Package, LayoutGrid, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from './catalog/ProductCard.jsx';
import { CatalogPagination } from './catalog/CatalogPagination.jsx';
import { ProductDetailPage } from '../common/ProductDetailPage.jsx';
import { attachProductPhotoAfterSave } from '../../services/productPhotoAfterSave.js';
import './catalog/catalog-shortcuts.css';

export function CatalogManagementPage() {
  const { currentShop, userName, userRole } = useShop();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const unitMatches = useUnitProductMatches(currentShop?.id, searchQuery);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [view, setView] = useState('grid');

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

  const brands = useMemo(() => {
    if (selectedCategory === 'ALL') return [];
    const groups = new Map();
    for (const product of products) {
      if (product.categoryId !== selectedCategory) continue;
      const name = String(product.brand || '').trim();
      if (!name) continue;
      const key = name.toLocaleLowerCase('fr');
      const current = groups.get(key);
      groups.set(key, { key, name: current?.name || name, count: (current?.count || 0) + 1 });
    }
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [products, selectedCategory]);

  const handleSaveProduct = async (productData, photoFile) => {
    try {
      if (productData.id) {
        const current = products.find(product => product.id === productData.id);
        const saved = await updateProduct(current, {
          ...productData,
          quantity: current.quantity,
          price: current.price,
          unit_cost: current.unitCost,
          status: current.status,
        });
        const photoWarning = await attachProductPhotoAfterSave(saved, photoFile, currentShop.id);
        showToast(photoWarning || 'Fiche produit mise à jour', photoWarning ? 'warning' : 'success');
        setEditingProduct(null);
        return;
      }
      const saved = await createProduct({ ...productData, shop_id: currentShop.id, added_by: userName });
      const photoWarning = await attachProductPhotoAfterSave(saved, photoFile, currentShop.id);
      showToast(photoWarning || (userRole === 'owner' ? 'Produit enregistré.' : 'Produit enregistré. L’administrateur fixera les prix.'), photoWarning ? 'warning' : 'success');
      setShowAddWizard(false);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct || deleting) return;
    setDeleting(true);
    try {
      await deleteProduct(deletingProduct);
      setDeletingProduct(null);
      showToast('Produit supprimé.', 'success');
    } catch (error) {
      showToast(error.message || 'Suppression impossible. Réessayez.', 'danger');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const q = (searchQuery || '').toLowerCase();
      const nameMatch = unitMatches.has(product.id) || (product.name || '').toLowerCase().includes(q) || (product.sku || '').toLowerCase().includes(q);
      const catMatch = selectedCategory === 'ALL' || product.categoryId === selectedCategory;
      const brandMatch = selectedBrand === 'ALL' || String(product.brand || '').trim().toLocaleLowerCase('fr') === selectedBrand;
      let statusMatch = true;
      if (statusFilter === 'IN_STOCK') statusMatch = product.quantity > 0 && product.status !== 'PENDING_PRICE';
      if (statusFilter === 'OUT_OF_STOCK') statusMatch = product.quantity === 0 && product.status !== 'PENDING_PRICE';
      if (statusFilter === 'PENDING') statusMatch = product.status === 'PENDING_PRICE';
      return nameMatch && catMatch && brandMatch && statusMatch;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, statusFilter, unitMatches]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setCurrentPage(1), [searchQuery, selectedCategory, selectedBrand, statusFilter, currentShop?.id]);
  useEffect(() => setSelectedBrand('ALL'), [currentShop?.id]);
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

        <div role="group" aria-label="Catégories de produits" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button 
            type="button"
            aria-pressed={selectedCategory === 'ALL'}
            onClick={() => { setSelectedCategory('ALL'); setSelectedBrand('ALL'); }}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: selectedCategory === 'ALL' ? 'none' : '1px solid var(--border-color)', backgroundColor: selectedCategory === 'ALL' ? BRAND : 'var(--bg-surface)', color: selectedCategory === 'ALL' ? '#fff' : 'var(--text-primary)' }}
          >
            Tous
          </button>
          {categories.map(c => (
            <button 
              key={c.id}
              type="button"
              aria-pressed={selectedCategory === c.id}
              onClick={() => { setSelectedCategory(c.id); setSelectedBrand('ALL'); }}
              style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: selectedCategory === c.id ? 'none' : '1px solid var(--border-color)', backgroundColor: selectedCategory === c.id ? BRAND : 'var(--bg-surface)', color: selectedCategory === c.id ? '#fff' : 'var(--text-primary)' }}
            >
              {c.name}
            </button>
          ))}
        </div>
        {brands.length > 0 && <div className="catalog-brand-shortcuts" role="group" aria-label="Marques de cette catégorie">
          <span className="catalog-brand-label">Marques</span>
          <button type="button" aria-pressed={selectedBrand === 'ALL'} onClick={() => setSelectedBrand('ALL')}>Toutes</button>
          {brands.map(brand => <button
            key={brand.key}
            type="button"
            aria-pressed={selectedBrand === brand.key}
            onClick={() => setSelectedBrand(brand.key)}
          >{brand.name} <small>{brand.count}</small></button>)}
        </div>}
      </div>

      {/* Product results */}
      {filteredProducts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="catalog-results">
          <div className="catalog-viewbar">
            <span className="catalog-viewbar-count">{filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}</span>
            <div className="catalog-view-switch" role="group" aria-label="Affichage des produits">
              <button type="button" aria-label="Afficher en grille" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><LayoutGrid size={17} /></button>
              <button type="button" aria-label="Afficher en liste" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={18} /></button>
            </div>
          </div>
          <div className={view === 'grid' ? 'catalog-grid' : 'catalog-list'}>
            {paginatedProducts.map(product => <ProductCard
              key={product.id}
              product={product}
              view={view}
              onOpen={() => setSelectedProductId(product.id)}
              onEdit={() => setEditingProduct(product)}
              onDelete={userRole === 'owner' ? () => setDeletingProduct(product) : undefined}
            />)}
          </div>
          <CatalogPagination
            page={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={size => { setPageSize(size); setCurrentPage(1); }}
          />
        </div>
      )}

      {/* Modals */}
      {showAddWizard && (
        <AddProductWizard 
          categories={categories} 
          onClose={() => setShowAddWizard(false)} 
          onSubmit={handleSaveProduct} 
        />
      )}

      {selectedProductId && <ProductDetailPage initialUnitSearch={unitMatches.has(selectedProductId) ? searchQuery : ''} productId={selectedProductId} onBack={() => setSelectedProductId(null)} onEdit={product => { setSelectedProductId(null); setEditingProduct(product); }} onDelete={userRole === 'owner' ? product => { setSelectedProductId(null); setDeletingProduct(product); } : undefined} />}

      <Dialog.Root open={Boolean(deletingProduct)} onOpenChange={open => { if (!open && !deleting) setDeletingProduct(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(5, 18, 35, .55)' }} />
          <Dialog.Content style={{ position: 'fixed', zIndex: 1201, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(420px, calc(100vw - 32px))', padding: 24, borderRadius: 16, background: 'var(--bg-surface)', color: 'var(--text-primary)', boxShadow: '0 18px 50px #0003' }}>
            <Dialog.Title style={{ margin: '0 0 8px', fontSize: '1.2rem' }}>Supprimer ce produit ?</Dialog.Title>
            <Dialog.Description style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {deletingProduct?.name} sera retiré du catalogue. Un produit déjà vendu, encore en stock ou contenant des appareils suivis ne peut pas être supprimé.
            </Dialog.Description>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button type="button" className="btn btn-secondary" disabled={deleting} onClick={() => setDeletingProduct(null)}>Annuler</button>
              <button type="button" className="btn" disabled={deleting} onClick={handleDeleteProduct} style={{ background: 'var(--danger)', color: '#fff' }}>{deleting ? 'Suppression…' : 'Supprimer'}</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {editingProduct && <AddProductWizard initialData={editingProduct} categories={categories} catalogOnly={userRole === 'manager'} onClose={() => setEditingProduct(null)} onSubmit={handleSaveProduct} />}

      {showAddCategory && <AddCategoryModal shopId={currentShop?.id} categories={categories} onClose={() => setShowAddCategory(false)} onCreated={() => showToast('Catégorie ajoutée.', 'success')} />}

    </div>
  );
}
