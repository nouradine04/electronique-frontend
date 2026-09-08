import React, { useState } from 'react';
import { useQuery } from '../../db/useQuery.js';
import { queryProducts, queryCategories, querySales, queryClients, queryPayments, queryStockMovements, queryInvoices, database, createSale } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { Search, Eye, Edit2, Trash2, Filter } from 'lucide-react';
import { LocalImage } from '../../components/common/LocalImage.jsx';

export function SalesPage() {
  const { currentShop } = useShop();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, WEEK, MONTH
  const [statusFilter, setStatusFilter] = useState('ALL');

  // We query all sales for the current shop
  const sales = useQuery(querySales(currentShop?.id || '')) || [];
  const products = useQuery(queryProducts(currentShop?.id || '')) || [];

  // Map products for easy access
  const productMap = products.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  // Seed mock sales if empty
  React.useEffect(() => {
    const seedMockSales = async () => {
      if (!currentShop?.id) return;
      if (sales.length === 0 && products.length > 0) {
        const mockSales = [
          { shop_id: currentShop.id, product_id: products[0]?.id || '1', quantity: 2, total_price: 214, payment_method: 'CASH', date: '2023-04-08T10:00:00Z' },
          { shop_id: currentShop.id, product_id: products[1]?.id || '2', quantity: 1, total_price: 185, payment_method: 'CASH', date: '2023-04-09T14:30:00Z' },
          { shop_id: currentShop.id, product_id: products[2]?.id || '3', quantity: 3, total_price: 356, payment_method: 'CASH', date: '2023-04-10T09:15:00Z' },
        ];
        for (const m of mockSales) {
          await createSale(m);
        }
      }
    };
    if (products.length > 0 && currentShop?.id) {
      seedMockSales();
    }
  }, [products.length, currentShop?.id]);

  // Filtering logic
  const filteredSales = sales.filter(sale => {
    const productId = sale.productId || sale.product_id;
    const product = productMap[productId];
    const productName = product?.name || 'Produit inconnu';
    const q = String(searchQuery || '').toLowerCase();
    const nameStr = String(productName).toLowerCase();
    const idStr = String(sale.id || '');
    const matchesSearch = nameStr.includes(q) || idStr.includes(searchQuery || '');
    
    let matchesDate = true;
    if (dateFilter !== 'ALL') {
      const saleDate = new Date(sale.date);
      const now = new Date();
      if (dateFilter === 'TODAY') {
        matchesDate = saleDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'WEEK') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = saleDate >= weekAgo;
      } else if (dateFilter === 'MONTH') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        matchesDate = saleDate >= monthAgo;
      }
    }

    return matchesSearch && matchesDate;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette vente ?')) {
      const targetSale = sales.find(s => s.id === id);
      if (targetSale) {
        await database.write(async () => {
          await targetSale.destroyPermanently();
        });
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Commandes récentes</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Gérez et filtrez les ventes récentes de votre boutique.
        </p>
      </div>

      {/* Main Panel */}
      <div className="surface-panel" style={{ overflow: 'hidden', padding: '24px' }}>
        
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Commandes récentes</h3>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '36px', height: '40px' }}
              placeholder="Rechercher par ID ou produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Filter size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <select
                className="input-field"
                style={{ paddingLeft: '36px', height: '40px', width: '160px', cursor: 'pointer' }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="ALL">Toutes les dates</option>
                <option value="TODAY">Aujourd'hui</option>
                <option value="WEEK">7 derniers jours</option>
                <option value="MONTH">30 derniers jours</option>
              </select>
            </div>
            
            <button className="btn btn-primary" style={{ height: '40px' }}>
              Nouvelle Vente
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.875rem' }}>#IDENTIFIANT</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.875rem' }}>Produit</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.875rem' }}>Quantité</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.875rem' }}>Prix</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.875rem' }}>Date</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.875rem', textAlign: 'right' }}>Actes</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Aucune vente trouvée.</td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const product = productMap[sale.product_id];
                  return (
                    <tr key={sale.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        #{sale.id}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {product?.image_url ? (
                              <LocalImage src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IMG</div>
                            )}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {product?.name || 'Produit inconnu'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {sale.quantity}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {sale.total_price} $
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {new Date(sale.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }} title="Voir">
                            <Eye size={16} />
                          </button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', padding: '4px' }} title="Modifier">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(sale.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }} title="Supprimer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
