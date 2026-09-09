import React, { useState, useEffect } from 'react';
import { useQuery } from '../../db/useQuery.js';
import { queryProducts, queryCategories, queryStockMovements, updateProduct, createProduct } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { recordStockMovement } from '../../services/syncEngine.js';
import { StockMovementModal } from '../../components/stock/StockMovementModal.jsx';
import { AddProductWizard } from '../../components/stock/AddProductWizard.jsx';
import { ProductDetailPage } from '../common/ProductDetailPage.jsx';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react';

import './stock.css';
import { ManagerStockList } from '../../components/stock/ManagerStockList.jsx';
import { ManagerStockJournal } from '../../components/stock/ManagerStockJournal.jsx';

export function ManagerStockPage({ onOpenAddProduct }) {
  const { currentShop, userName } = useShop();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'OUT'
  const [activeView, setActiveView] = useState('inventory');
  const [movementType, setMovementType] = useState('ALL');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory, statusFilter, movementType, activeView, currentShop?.id]);

  const [movementModal, setMovementModal] = useState({ open: false, product: null, type: 'OUT' });
  const [productFormModal, setProductFormModal] = useState({ open: false, product: null });

  const [selectedProductId, setSelectedProductId] = useState(null);

  // Requête WatermelonDB réactive sur le stock de la boutique active
  const categories = useQuery(queryCategories(currentShop?.id || '')) || [];
  const products = useQuery(queryProducts(currentShop?.id || '')) || [];
  const movements = useQuery(queryStockMovements(currentShop?.id || '')) || [];

  // Filter & Sort Logic
  const filteredProducts = products.filter(product => {
    const q = String(searchQuery || '').toLowerCase();
    const nameStr = String(product.name || '').toLowerCase();
    const skuStr = String(product.sku || '').toLowerCase();
    const locStr = String(product.location || '').toLowerCase();
    
    const matchesSearch = nameStr.includes(q) || skuStr.includes(q) || locStr.includes(q);

    const matchesCategory = selectedCategory === 'ALL' || product.category_id === selectedCategory;

    let matchesStatus = true;
    if (statusFilter === 'PENDING') matchesStatus = product.status === 'PENDING_PRICE';
    if (statusFilter === 'LOW') matchesStatus = product.status !== 'PENDING_PRICE' && product.quantity <= product.min_stock && product.quantity > 0;
    if (statusFilter === 'OUT') matchesStatus = product.status !== 'PENDING_PRICE' && product.quantity === 0;

    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculation
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const productsById = new Map(products.map(product => [product.id, product]));
  const filteredMovements = movements.filter(movement => {
    const product = productsById.get(movement.productId || movement.product_id);
    const query = searchQuery.trim().toLowerCase();
    const matchesType = movementType === 'ALL' || movement.type === movementType;
    const matchesSearch = !query || [product?.name, movement.reason, movement.userName, movement.deliveryReference].some(value => String(value || '').toLowerCase().includes(query));
    return matchesType && matchesSearch;
  });
  const paginatedMovements = filteredMovements.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil((activeView === 'inventory' ? filteredProducts.length : filteredMovements.length) / rowsPerPage) || 1;

  const handleExecuteMovement = async (movementData) => {
    try {
      const newQty = await recordStockMovement({
        ...movementData,
        shop_id: currentShop.id,
        user_name: userName
      });
      setMovementModal({ open: false, product: null, type: 'OUT' });

      showToast(`Mouvement enregistré. Nouveau stock : ${newQty} pcs`, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (productData.id) {
        const currentProduct = products.find(product => product.id === productData.id);
        const requestedQuantity = Number(productData.quantity || 0);
        await updateProduct(productData, {
          ...productData,
          quantity: currentProduct?.quantity ?? requestedQuantity,
        });
        if (currentProduct && requestedQuantity !== Number(currentProduct.quantity || 0)) {
          await recordStockMovement({
            shop_id: currentShop.id,
            product_id: currentProduct.id,
            product_name: currentProduct.name,
            type: 'ADJUST',
            quantity: requestedQuantity,
            reason: 'Correction depuis la fiche produit',
            user_name: userName,
          });
        }
        showToast('Composant mis à jour.', 'success');
      } else {
        const initialQuantity = Number(productData.quantity || 0);
        const createdProduct = await createProduct({
          ...productData,
          quantity: 0,
          shop_id: currentShop.id,
        });
        if (initialQuantity > 0) {
          await recordStockMovement({
            shop_id: currentShop.id,
            product_id: createdProduct.id,
            product_name: createdProduct.name,
            type: 'IN',
            quantity: initialQuantity,
            reason: 'Stock initial',
            user_name: userName,
          });
        }
        showToast('Nouveau composant ajouté.', 'success');
      }
      setProductFormModal({ open: false, product: null });
    } catch (err) {
      showToast('Erreur: ' + err.message, 'danger');
    }
  };

  // Metrics summary
  const lowStockCount = products.filter(p => p.status !== 'PENDING_PRICE' && p.quantity <= (p.minStock || 5) && p.quantity > 0).length;
  const outOfStockCount = products.filter(p => p.status !== 'PENDING_PRICE' && p.quantity === 0).length;
  const pendingCount = products.filter(p => p.status === 'PENDING_PRICE').length;
  const totalUnits = products.reduce((sum, product) => sum + Number(product.quantity || 0), 0);

  if (selectedProductId) {
    return <ProductDetailPage productId={selectedProductId} onBack={() => setSelectedProductId(null)} />;
  }

  return (
    <div className="manager-stock" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      


      <header className="ms-heading"><div><h2>Stock</h2><p>{currentShop?.name} · inventaire de la boutique</p></div><button className="btn btn-primary ms-add" aria-label="Ajouter un produit" onClick={() => setProductFormModal({ open: true, product: null })}><Plus size={18} /><span>Ajouter un produit</span></button></header>
      <div className="ms-overview" aria-label="Résumé du stock">
        <button type="button" onClick={() => { setActiveView('inventory'); setStatusFilter('ALL'); }}><span>Produits</span><strong>{products.length}</strong></button>
        <div><span>Unités disponibles</span><strong>{totalUnits}</strong></div>
        <button type="button" className="low" onClick={() => { setActiveView('inventory'); setStatusFilter('LOW'); }}><span>Stock faible</span><strong>{lowStockCount}</strong></button>
        <button type="button" className="alert" onClick={() => { setActiveView('inventory'); setStatusFilter('OUT'); }}><span>Ruptures</span><strong>{outOfStockCount}</strong></button>
        {pendingCount > 0 && <button type="button" className="low" onClick={() => { setActiveView('inventory'); setStatusFilter('PENDING'); }}><span>En attente</span><strong>{pendingCount}</strong></button>}
      </div>
      <div className="ms-view-tabs" role="tablist" aria-label="Contenu du stock">
        <button type="button" role="tab" aria-selected={activeView === 'inventory'} onClick={() => { setActiveView('inventory'); setCurrentPage(1); }}>État du stock</button>
        <button type="button" role="tab" aria-selected={activeView === 'history'} onClick={() => { setActiveView('history'); setCurrentPage(1); }}>Mouvements <span>{movements.length}</span></button>
      </div>
      {/* Main Table Panel */}
      <div className="ms-stock-panel">
        
        {/* Controls Toolbar */}
        <div className="ms-toolbar">
          <div className="ms-search">
            <Search size={16} />
            <input
              type="text"
              className="input-field"
              placeholder="Nom, référence ou emplacement…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

            {activeView === 'inventory' && <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
              aria-label="Filtrer par catégorie"
            >
              <option value="ALL">Toutes catégories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>}

            {activeView === 'inventory' ? <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              aria-label="Filtrer par état du stock"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">En attente admin</option>
              <option value="LOW">Stock faible</option>
              <option value="OUT">Rupture</option>
            </select> : <select value={movementType} onChange={event => { setMovementType(event.target.value); setCurrentPage(1); }} className="input-field" aria-label="Filtrer par type de mouvement">
              <option value="ALL">Tous les mouvements</option><option value="IN">Approvisionnements</option><option value="OUT">Ventes et sorties</option><option value="ADJUST">Ajustements</option>
            </select>}
        </div>

        {activeView === 'inventory'
          ? <ManagerStockList products={paginatedProducts} onView={setSelectedProductId} onMovement={(product, type) => setMovementModal({ open: true, product, type })} onEdit={product => setProductFormModal({ open: true, product })} />
          : <ManagerStockJournal movements={paginatedMovements} productsById={productsById} />}

        {/* Pagination Footer */}
        <div className="ms-pagination">
          <span>{activeView === 'inventory' ? `${filteredProducts.length} produit${filteredProducts.length > 1 ? 's' : ''}` : `${filteredMovements.length} mouvement${filteredMovements.length > 1 ? 's' : ''}`}</span>
          <div className="ms-page-controls">
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                aria-label="Page précédente"
              >
                <ChevronLeft size={16} />
              </button>
              <span>Page {currentPage} / {totalPages}</span>
              <button
                className="btn btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                aria-label="Page suivante"
              >
                <ChevronRight size={16} />
              </button>
          </div>
        </div>

      </div>

      {/* Modals */}
      {movementModal.open && (
        <StockMovementModal
          product={movementModal.product}
          defaultType={movementModal.type}
          onClose={() => setMovementModal({ open: false, product: null, type: 'OUT' })}
          onSubmit={handleExecuteMovement}
        />
      )}

      {(productFormModal.open || onOpenAddProduct) && (
        <AddProductWizard
          initialData={productFormModal.product}
          categories={categories}
          onClose={() => { setProductFormModal({ open: false, product: null }); }}
          onSubmit={handleSaveProduct}
        />
      )}

    </div>
  );
}
