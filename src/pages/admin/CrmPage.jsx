import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '../../db/useQuery.js';
import { queryProducts, querySales, queryClients, queryPayments } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { FaTimes, FaSearch, FaChevronRight, FaPhoneAlt, FaUser, FaCreditCard, FaCoins } from 'react-icons/fa';

const BRAND = '#0e6ba8';

export function CrmPage() {
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'credit'
  const [selectedClient, setSelectedClient] = useState(null);

  const clients = useQuery(queryClients(currentShop?.id || '')) || [];
  const sales = useQuery(querySales(currentShop?.id || '')) || [];
  const payments = useQuery(queryPayments(currentShop?.id || '')) || [];
  const products = useQuery(queryProducts(currentShop?.id || '')) || [];

  const clientStats = useMemo(() => {
    return clients.map(client => {
      const clientSales = sales.filter(s => (s.clientId || s.client_id) === client.id);
      const clientPayments = payments.filter(p => (p.clientId || p.client_id) === client.id);
      
      const totalBought = clientSales.reduce((sum, s) => sum + (Number(s.totalPrice || s.total_price) || 0), 0);
      
      const totalPaidFromSales = clientSales.reduce((sum, s) => {
        const method = String(s.paymentMethod || s.payment_method || '').toLowerCase();
        if (method === 'credit') return sum;
        return sum + (Number(s.totalPrice || s.total_price) || 0);
      }, 0);
      
      const totalPayments = clientPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const totalPaid = totalPaidFromSales + totalPayments;
      const resteAPayer = Math.max(0, totalBought - totalPaid);
      
      const sortedSales = [...clientSales].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      const lastPurchaseDate = sortedSales.length > 0 ? sortedSales[0].date : null;
      const totalSalesCount = clientSales.length;

      return { ...client, name: client.name, phone: client.phone, totalBought, totalPaid, resteAPayer, lastPurchaseDate, sales: sortedSales, totalSalesCount };
    }).sort((a, b) => b.totalBought - a.totalBought);
  }, [clients, sales, payments]);

  const filteredClients = useMemo(() => {
    let list = clientStats;
    if (filter === 'credit') list = list.filter(c => c.resteAPayer > 0);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => String(c.name || '').toLowerCase().includes(q) || String(c.phone || '').toLowerCase().includes(q));
    }
    return list;
  }, [clientStats, filter, search]);

  const totalClients = clientStats.length;
  const clientsWithDebt = clientStats.filter(c => c.resteAPayer > 0).length;
  const totalDebt = clientStats.reduce((sum, c) => sum + c.resteAPayer, 0);

  if (!currentShop) return <div style={{ padding: '20px' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '80px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{t('clients_page.title')}</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.85rem' }}>{t('clients_page.subtitle')}</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <FaUser size={20} color={BRAND} />
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>{totalClients}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{t('clients_page.title')}</div>
        </div>
        <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <FaCreditCard size={20} color={clientsWithDebt > 0 ? '#ea580c' : BRAND} />
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>{clientsWithDebt}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{t('clients_page.with_credit_filter')}</div>
        </div>
        <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <FaCoins size={20} color={totalDebt > 0 ? '#dc2626' : BRAND} />
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>{totalDebt.toLocaleString('fr-FR')}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{t('clients_page.total_debt')} (F)</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setFilter('all')} style={{
          padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
          backgroundColor: filter === 'all' ? BRAND : 'var(--bg-main)', color: filter === 'all' ? 'var(--bg-surface)' : 'var(--text-secondary)'
        }}>{t('clients_page.all')}</button>
        <button onClick={() => setFilter('credit')} style={{
          padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
          backgroundColor: filter === 'credit' ? '#ea580c' : 'var(--bg-main)', color: filter === 'credit' ? 'var(--bg-surface)' : 'var(--text-secondary)'
        }}>{t('clients_page.with_credit_filter')}</button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <FaSearch size={14} color='var(--text-muted)' style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text" placeholder={t('clients_page.search')} value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.9rem', backgroundColor: 'var(--bg-surface)', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Client List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredClients.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            Aucun client trouvé.
          </div>
        )}

        {filteredClients.map(client => (
          <div
            key={client.id}
            onClick={() => setSelectedClient(client)}
            style={{
              padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            {/* Avatar */}
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: client.resteAPayer > 0 ? '#fff7ed' : '#eef6fc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FaUser size={16} color={client.resteAPayer > 0 ? '#ea580c' : BRAND} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{client.name || 'Client'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <FaPhoneAlt size={9} /> {client.phone || '-'}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600 }}>
                  {client.totalBought.toLocaleString('fr-FR')} F dépensé
                </span>
                {client.resteAPayer > 0 && (
                  <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
                    Doit {client.resteAPayer.toLocaleString('fr-FR')} F
                  </span>
                )}
                {client.totalSalesCount > 0 && (
                  <span style={{ backgroundColor: '#eef6fc', color: BRAND, padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600 }}>
                    {client.totalSalesCount} achat(s)
                  </span>
                )}
              </div>
            </div>

            <FaChevronRight size={12} color='var(--text-muted)' />
          </div>
        ))}
      </div>

      {/* Client Detail Bottom Sheet */}
      {selectedClient && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={() => setSelectedClient(null)}>
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              backgroundColor: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', maxHeight: '88vh',
              display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
              animation: 'slideUp 0.3s ease'
            }}
          >
            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--text-muted)' }} />
            </div>

            {/* Header */}
            <div style={{ padding: '12px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedClient.name}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <FaPhoneAlt size={10} /> {selectedClient.phone || 'Non renseigné'}
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} style={{ background: 'var(--bg-main)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <FaTimes size={14} color='var(--text-secondary)' />
              </button>
            </div>

            {/* Financial Summary */}
            <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div style={{ textAlign: 'center', padding: '12px 4px', backgroundColor: 'var(--bg-main)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{t('clients_page.total_bought')}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{selectedClient.totalBought.toLocaleString('fr-FR')} F</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 4px', backgroundColor: '#f0fdf4', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6rem', color: '#065f46', fontWeight: 600, textTransform: 'uppercase' }}>{t('clients_page.paid')}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>{selectedClient.totalPaid.toLocaleString('fr-FR')} F</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 4px', backgroundColor: selectedClient.resteAPayer > 0 ? '#fef2f2' : 'var(--bg-main)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.6rem', color: selectedClient.resteAPayer > 0 ? '#dc2626' : 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{t('clients_page.remaining')}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: selectedClient.resteAPayer > 0 ? '#dc2626' : 'var(--text-primary)', marginTop: '2px' }}>{selectedClient.resteAPayer.toLocaleString('fr-FR')} F</div>
              </div>
            </div>

            {/* Purchase History */}
            <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Historique ({selectedClient.sales.length})</h4>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
              {selectedClient.sales.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('clients_page.no_purchase')}</div>
              ) : (
                selectedClient.sales.map((sale, i) => {
                  const product = products.find(p => p.id === (sale.productId || sale.product_id));
                  const isCredit = String(sale.paymentMethod || sale.payment_method || '').toLowerCase() === 'credit';
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {product?.name || 'Produit'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span>{sale.date ? new Date(sale.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '-'}</span>
                          <span>×{sale.quantity}</span>
                          {isCredit && (
                            <span className="badge badge-credit">{t('profit_page.credit')}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                        {(Number(sale.totalPrice || sale.total_price) || 0).toLocaleString('fr-FR')} F
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
