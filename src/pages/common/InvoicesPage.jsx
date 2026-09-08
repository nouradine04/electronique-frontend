import React, { useState, useMemo } from 'react';
import { useQuery } from '../../db/useQuery.js';
import { queryProducts, queryCategories, querySales, queryClients, queryPayments, queryStockMovements, queryInvoices, database } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { Search, FileText, X, ChevronLeft, ChevronRight, Download, ArrowUpDown, Calendar, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// jsPDF loaded dynamically to avoid bundler issues

import { InvoicePreview } from '../../components/finance/InvoicePreview.jsx';

const BRAND = '#0e6ba8';

export function InvoicesPage() {
  const { t } = useTranslation();
  const { currentShop } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showFullInvoice, setShowFullInvoice] = useState(false);
  const itemsPerPage = 10;

  const sales = useQuery(querySales(currentShop?.id || '')) || [];
  const products = useQuery(queryProducts(currentShop?.id || '')) || [];
  const clients = useQuery(queryClients(currentShop?.id || '')) || [];
  const payments = useQuery(queryPayments(currentShop?.id || '')) || [];
  const shopData = currentShop;

  const invoices = useMemo(() => {
    return sales.map(sale => {
      const client = clients.find(c => c.id === sale.client_id);
      const product = products.find(p => p.id === sale.product_id);
      
      const invoiceId = 'FAC-' + String(sale.id).slice(-6).toUpperCase();
      
      let amountPaid = 0;
      if (sale.payment_method === 'credit') {
        amountPaid = payments
          .filter(p => p.client_id === sale.client_id)
          .reduce((s, p) => s + (p.amount || 0), 0);
      } else {
        amountPaid = sale.total_price;
      }

      return {
        id: invoiceId,
        saleId: sale.id,
        date: sale.date,
        clientName: client?.name || 'Client inconnu',
        clientPhone: client?.phone || '',
        productName: product?.name || 'Produit inconnu',
        quantity: sale.quantity || 1,
        unitPrice: (sale.total_price || 0) / (sale.quantity || 1),
        totalAmount: sale.total_price || 0,
        paymentMethod: sale.payment_method || 'cash',
        amountPaid: amountPaid
      };
    });
  }, [sales, clients, products, payments]);

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv => 
        String(inv.id).toLowerCase().includes(query) ||
        String(inv.clientName).toLowerCase().includes(query) ||
        String(inv.productName).toLowerCase().includes(query)
      );
    }

    if (paymentFilter !== 'ALL') {
      filtered = filtered.filter(inv => inv.paymentMethod === paymentFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'amount_desc') return b.totalAmount - a.totalAmount;
      if (sortBy === 'amount_asc') return a.totalAmount - b.totalAmount;
      return 0;
    });

    return filtered;
  }, [invoices, searchQuery, paymentFilter, sortBy]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const currentInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const thisMonthInvoices = useMemo(() => {
    const now = new Date();
    return invoices.filter(inv => {
      const d = new Date(inv.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [invoices]);

  const totalAmountThisMonth = thisMonthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const handleOpenInvoice = (invoice) => {
    setSelectedSale(invoice);
    setShowInvoiceModal(true);
  };

  const getPaymentBadgeColor = (method) => {
    switch(method) {
      case 'cash': return { bg: 'var(--success-bg)', color: 'var(--success)' };
      case 'mobile_money': return { bg: 'rgba(14, 107, 168, 0.1)', color: BRAND };
      case 'credit': return { bg: '#ea580c', color: '#fff' };
      default: return { bg: 'var(--bg-surface)', color: 'var(--text-secondary)' };
    }
  };

  const getPaymentLabel = (method) => {
    switch(method) {
      case 'cash': return t('transactions_page.cash') || 'Espèces';
      case 'mobile_money': return t('transactions_page.mobile_money') || 'Mobile Money';
      case 'credit': return t('transactions_page.credit') || 'À Crédit';
      default: return method;
    }
  };

  return (
    <div style={{ paddingBottom: '80px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {t('invoices_page.title') || 'Factures'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          {t('invoices_page.subtitle') || 'Historique de toutes les ventes'}
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 500 }}>Factures ce mois</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{thisMonthInvoices.length}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 500 }}>Total ce mois</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: BRAND }}>{totalAmountThisMonth.toLocaleString('fr-FR')} FCFA</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 250px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder={t('common.search') || 'Rechercher...'}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="input-field"
              style={{ paddingLeft: '38px', width: '100%' }}
            />
          </div>
          <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={18} style={{ color: 'var(--text-secondary)' }} />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
              style={{ width: '100%' }}
            >
              <option value="date_desc">Plus récentes</option>
              <option value="date_asc">Plus anciennes</option>
              <option value="amount_desc">Montant ↓</option>
              <option value="amount_asc">Montant ↑</option>
            </select>
          </div>
        </div>
        
        {/* Payment Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['ALL', 'cash', 'mobile_money', 'credit'].map(method => (
            <button
              key={method}
              onClick={() => { setPaymentFilter(method); setCurrentPage(1); }}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: paymentFilter === method ? BRAND : 'var(--bg-main)',
                color: paymentFilter === method ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {method === 'ALL' ? 'Tous' : getPaymentLabel(method)}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {currentInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <FileText size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p style={{ margin: 0, fontSize: '1.1rem' }}>{t('invoices_page.no_invoices') || 'Aucune facture trouvée'}</p>
          </div>
        ) : (
          currentInvoices.map(inv => (
            <div 
              key={inv.id}
              onClick={() => handleOpenInvoice(inv)}
              style={{ 
                backgroundColor: 'var(--bg-surface)', 
                borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--border-color)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: BRAND }}>
                <FileText size={24} />
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {inv.id}
                  </div>
                  <div style={{ fontWeight: 800, color: BRAND, fontSize: '1.1rem', flexShrink: 0, marginLeft: '12px' }}>
                    {inv.totalAmount.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {inv.clientName} • {inv.productName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(inv.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    backgroundColor: getPaymentBadgeColor(inv.paymentMethod).bg,
                    color: getPaymentBadgeColor(inv.paymentMethod).color,
                  }}>
                    {getPaymentLabel(inv.paymentMethod)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', backgroundColor: currentPage === 1 ? 'var(--bg-main)' : 'var(--bg-surface)' }}
          >
            <ChevronLeft size={20} style={{ color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)' }} />
          </button>
          
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Page {currentPage} sur {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', backgroundColor: currentPage === totalPages ? 'var(--bg-main)' : 'var(--bg-surface)' }}
          >
            <ChevronRight size={20} style={{ color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)' }} />
          </button>
        </div>
      )}

      {showInvoiceModal && selectedSale && <InvoicePreview invoice={selectedSale} shop={shopData} onClose={() => setShowInvoiceModal(false)} />}
    </div>
  );
}
