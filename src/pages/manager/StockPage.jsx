import React, { useState, useEffect } from 'react';
import { useQuery } from '../../db/useQuery.js';
import { queryProducts, queryCategories, querySales, queryClients, queryPayments, queryStockMovements, queryInvoices, database, updateProduct, createProduct } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { recordStockMovement } from '../../services/syncEngine.js';
import { ProductCard } from '../../components/stock/ProductCard.jsx';
import { StockMovementModal } from '../../components/stock/StockMovementModal.jsx';
import { AddProductWizard } from '../../components/stock/AddProductWizard.jsx';
import { ProductDetailPage } from '../common/ProductDetailPage.jsx';
import {
  Search,
  Plus,
  Filter,
  AlertTriangle,
  Layers,
  Cpu,
  LayoutGrid,
  List,
  ArrowUpDown,
  MoreVertical,
  Minus,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  MapPin,
  FileText,
  Eye,
  DollarSign
} from 'lucide-react';

import './stock.css';
import { ManagerStockList } from '../../components/stock/ManagerStockList.jsx';

export function ManagerStockPage({ onOpenAddProduct }) {
  const { currentShop, userName, userRole } = useShop();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'OUT'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory, statusFilter, currentShop?.id]);

  const [movementModal, setMovementModal] = useState({ open: false, product: null, type: 'OUT' });
  const [productFormModal, setProductFormModal] = useState({ open: false, product: null });

  const [selectedProductId, setSelectedProductId] = useState(null);

  // Requête WatermelonDB réactive sur le stock de la boutique active
  const categories = useQuery(queryCategories(currentShop?.id || '')) || [];
  const products = useQuery(queryProducts(currentShop?.id || '')) || [];

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
  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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

  const [pendingPriceModal, setPendingPriceModal] = useState({ open: false, product: null });
  const [pendingPrices, setPendingPrices] = useState({ unit_cost: 0, price: 0 });

  // Metrics summary
  const lowStockCount = products.filter(p => p.status !== 'PENDING_PRICE' && p.quantity <= (p.minStock || 5) && p.quantity > 0).length;
  const outOfStockCount = products.filter(p => p.status !== 'PENDING_PRICE' && p.quantity === 0).length;
  const pendingCount = products.filter(p => p.status === 'PENDING_PRICE').length;

  if (selectedProductId) {
    return <ProductDetailPage productId={selectedProductId} onBack={() => setSelectedProductId(null)} />;
  }

  const handleFixPrice = async (e) => {
    e.preventDefault();
    try {
      const unitCost = Number(pendingPrices.unit_cost);
      const salePrice = Number(pendingPrices.price);
      if (unitCost <= 0 || salePrice <= 0) {
        showToast('Le coût d’achat et le prix de vente doivent être supérieurs à zéro.', 'danger');
        return;
      }
      await updateProduct(pendingPriceModal.product, {
        unit_cost: unitCost,
        price: salePrice,
        status: 'ACTIVE'
      });
      showToast('Prix validés avec succès ! Le produit est maintenant actif.', 'success');
      setPendingPriceModal({ open: false, product: null });
    } catch (err) {
      showToast('Erreur: ' + err.message, 'danger');
    }
  };

  return (
    <div className="manager-stock" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      


      <header className="ms-heading"><div><h2>Stock & Produits</h2><p>{currentShop?.name} · {products.length} produits</p></div><button className="btn btn-primary ms-add" onClick={() => setProductFormModal({ open: true, product: null })}><Plus size={18} /> Ajouter un produit</button></header>
      {userRole === 'owner' && pendingCount > 0 && (
        <div style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AlertTriangle size={24} color="var(--warning)" />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--warning)', margin: 0 }}>Action requise : {pendingCount} produit(s) en attente de prix</h3>
            <p style={{ fontSize: '0.875rem', margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Des produits ont été ajoutés par le gestionnaire. Fixez leurs prix pour les rendre disponibles à la vente.</p>
          </div>
        </div>
      )}

      {/* Main Table Panel */}
      <div className="surface-panel" style={{ overflow: 'hidden' }}>
        
        {/* Controls Toolbar */}
        <div className="ms-toolbar" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '36px' }}
              placeholder="Rechercher un produit…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
              style={{ width: 'auto', py: '6px' }}
            >
              <option value="ALL">Toutes Catégories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', py: '6px' }}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">En attente admin</option>
              <option value="LOW">Stock Bas</option>
              <option value="OUT">Rupture</option>
            </select>
          </div>
        </div>

        <ManagerStockList products={paginatedProducts} onView={setSelectedProductId} onMovement={(product, type) => setMovementModal({ open: true, product, type })} onEdit={product => setProductFormModal({ open: true, product })} />

        {/* Pagination Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderTop: '1px solid var(--border-color)',
          fontSize: '0.875rem', color: 'var(--text-muted)'
        }}>
          <div>
            Total : {filteredProducts.length} produit(s)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <span>Lignes par page : {rowsPerPage}</span>
            <span>Page {currentPage} sur {totalPages}</span>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                style={{ padding: '4px' }}
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '4px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '4px' }}
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="btn btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                style={{ padding: '4px' }}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
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

      {pendingPriceModal.open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div className="surface-panel" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Fixer les Prix</h3>
              <button type="button" onClick={() => setPendingPriceModal({ open: false, product: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <form onSubmit={handleFixPrice} style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Produit : <strong>{pendingPriceModal.product?.name}</strong>
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Coût d'achat (FCFA)</label>
                <input type="number" className="input-field" value={pendingPrices.unit_cost} onChange={e => setPendingPrices(p => ({ ...p, unit_cost: e.target.value }))} required />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Prix de vente (FCFA)</label>
                <input type="number" className="input-field" value={pendingPrices.price} onChange={e => setPendingPrices(p => ({ ...p, price: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPendingPriceModal({ open: false, product: null })}>Annuler</button>
                <button type="submit" className="btn btn-primary">Valider les Prix</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
