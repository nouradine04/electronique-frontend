import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '../../db/useQuery.js';
import { queryProducts, queryCategories, querySales, queryClients, queryPayments, queryStockMovements, queryInvoices, database, createPayment } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { useTranslation } from 'react-i18next';
import { Search, User, Users, Phone, CreditCard, X } from 'lucide-react';

export function ManagerClientsPage() {
  const { currentShop } = useShop();
  const { t } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'DEBT' | 'PAID'
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isDesktop = windowWidth >= 768;

  const clients = useQuery(queryClients(currentShop?.id || '')) || [];
  const sales = useQuery(querySales(currentShop?.id || '')) || [];
  const payments = useQuery(queryPayments(currentShop?.id || '')) || [];
  const products = useQuery(queryProducts(currentShop?.id || '')) || [];

  const clientsData = useMemo(() => {
    return clients.map(client => {
      const clientSales = sales.filter(s => s.client_id === client.id);
      const clientPayments = payments.filter(p => p.client_id === client.id);
      
      const totalPurchased = clientSales.reduce((sum, s) => sum + (s.total_price || 0), 0);
      const totalPaid = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const currentDebt = totalPurchased - totalPaid;
      
      let lastPurchaseDate = null;
      if (clientSales.length > 0) {
        lastPurchaseDate = clientSales.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
      }

      return {
        ...client,
        id: client.id,
        name: client.name,
        phone: client.phone,
        totalPurchased,
        totalPaid,
        currentDebt,
        lastPurchaseDate,
        purchaseCount: clientSales.length,
        sales: clientSales.sort((a, b) => new Date(b.date) - new Date(a.date))
      };
    });
  }, [clients, sales, payments]);

  const filteredClients = useMemo(() => {
    let result = clientsData;
    
    if (filterMode === 'DEBT') {
      result = result.filter(c => c.currentDebt > 0);
    } else if (filterMode === 'PAID') {
      result = result.filter(c => c.currentDebt <= 0);
    }

    if (searchQuery) {
      const q = String(searchQuery).toLowerCase();
      result = result.filter(c => 
        String(c.name || '').toLowerCase().includes(q) || 
        String(c.phone || '').toLowerCase().includes(q)
      );
    }
    
    return result.sort((a, b) => b.currentDebt - a.currentDebt);
  }, [clientsData, filterMode, searchQuery]);

  const clientsWithDebt = clientsData.filter(c => c.currentDebt > 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'FCFA');
  };

  const getProductName = (productId) => {
    const p = products.find(x => x.id === productId);
    return p ? p.name : 'Produit inconnu';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));
  };

  const handleAddPayment = async () => {
    if (!selectedClient || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (amount > selectedClient.currentDebt) {
      alert("Le montant remboursé ne peut pas dépasser la dette totale (" + selectedClient.currentDebt + " FCFA).");
      return;
    }

    try {
      await createPayment({
        shop_id: currentShop.id,
        client_id: selectedClient.id,
        amount: amount,
        date: new Date().toISOString()
      });
      setPaymentAmount('');
    } catch (error) {
      console.error('Failed to add payment', error);
    }
  };

  const currentSelectedClient = selectedClient ? clientsData.find(c => c.id === selectedClient.id) : null;

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'inherit', paddingBottom: '80px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '24px' }}>Clients & Crédits</h1>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '20px', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(14, 107, 168, 0.1)', 
            color: '#0e6ba8', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: 1.2 }}>{clientsData.length}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Total Clients</div>
          </div>
        </div>
        <div style={{ 
          backgroundColor: clientsWithDebt.length > 0 ? 'rgba(179, 6, 56, 0.05)' : 'var(--bg-surface)', 
          padding: '20px', 
          borderRadius: 'var(--radius-lg)', 
          border: clientsWithDebt.length > 0 ? '1px solid #b30638' : '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '50%', 
            backgroundColor: clientsWithDebt.length > 0 ? '#b30638' : 'var(--border-color)', 
            color: clientsWithDebt.length > 0 ? 'white' : 'var(--text-secondary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: clientsWithDebt.length > 0 ? '#b30638' : 'var(--text-primary)', lineHeight: 1.2 }}>{clientsWithDebt.length}</div>
            <div style={{ fontSize: '13px', color: clientsWithDebt.length > 0 ? '#b30638' : 'var(--text-secondary)', marginTop: '2px' }}>Avec crédit</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou téléphone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 12px 12px 40px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)', 
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setFilterMode('ALL')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              backgroundColor: filterMode === 'ALL' ? '#0e6ba8' : 'var(--bg-surface)',
              color: filterMode === 'ALL' ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >Tous ({clientsData.length})</button>
          <button 
            onClick={() => setFilterMode('DEBT')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              backgroundColor: filterMode === 'DEBT' ? '#b30638' : 'var(--bg-surface)',
              color: filterMode === 'DEBT' ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >Avec crédit ({clientsWithDebt.length})</button>
          <button 
            onClick={() => setFilterMode('PAID')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              backgroundColor: filterMode === 'PAID' ? 'var(--success)' : 'var(--bg-surface)',
              color: filterMode === 'PAID' ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >À jour ({clientsData.length - clientsWithDebt.length})</button>
        </div>
      </div>

      {/* Client List (Responsive Table/Cards) */}
      {isDesktop ? (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Client</th>
                <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Téléphone</th>
                <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Total acheté</th>
                <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Total payé</th>
                <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Dette actuelle</th>
                <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'center' }}>Statut</th>
                <th style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, idx) => (
                <tr key={client.id} style={{ borderBottom: idx !== filteredClients.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>{String(client.name || '?').charAt(0).toUpperCase()}</div>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{client.name}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{client.phone || '-'}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-primary)', textAlign: 'right' }}>{formatCurrency(client.totalPurchased)}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--success)', textAlign: 'right' }}>{formatCurrency(client.totalPaid)}</td>
                  <td style={{ padding: '14px 16px', color: client.currentDebt > 0 ? '#b30638' : 'var(--text-primary)', fontWeight: '600', textAlign: 'right' }}>
                    {formatCurrency(client.currentDebt)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {client.currentDebt > 0 ? (
                      <span style={{ backgroundColor: 'rgba(179, 6, 56, 0.1)', color: '#b30638', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        Impayé
                      </span>
                    ) : (
                      <span style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        À jour
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedClient(client)}
                      style={{
                        backgroundColor: '#0e6ba8',
                        color: 'white',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucun client trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredClients.map(client => (
            <div 
              key={client.id}
              onClick={() => setSelectedClient(client)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  {String(client.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{client.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{client.phone || 'Pas de téléphone'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                {client.currentDebt > 0 ? (
                  <span style={{ backgroundColor: 'rgba(179, 6, 56, 0.1)', color: '#b30638', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    -{formatCurrency(client.currentDebt)}
                  </span>
                ) : (
                  <span style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    À jour
                  </span>
                )}
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total: {formatCurrency(client.totalPurchased)}</div>
              </div>
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Aucun client trouvé.
            </div>
          )}
        </div>
      )}

      {/* Bottom Sheet Modal */}
      {currentSelectedClient && (
        <>
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999
            }}
            onClick={() => setSelectedClient(null)}
          />
          <div 
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              backgroundColor: 'var(--bg-main)',
              borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
              padding: '24px',
              zIndex: 1000,
              maxHeight: '85vh',
              overflowY: 'auto',
              transform: 'translateY(0)',
              transition: 'transform 0.3s ease-out',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{currentSelectedClient.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <Phone size={14} /> {currentSelectedClient.phone || 'N/A'}
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={24} color="var(--text-secondary)" />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', minWidth: '100px', flex: 1, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total acheté</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(currentSelectedClient.totalPurchased)}</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', minWidth: '100px', flex: 1, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total payé</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(currentSelectedClient.totalPaid)}</div>
              </div>
              <div style={{ backgroundColor: currentSelectedClient.currentDebt > 0 ? 'rgba(179, 6, 56, 0.05)' : 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', minWidth: '100px', flex: 1, border: currentSelectedClient.currentDebt > 0 ? '1px solid #b30638' : '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: currentSelectedClient.currentDebt > 0 ? '#b30638' : 'var(--text-muted)', textTransform: 'uppercase' }}>Reste dû</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: currentSelectedClient.currentDebt > 0 ? '#b30638' : 'var(--text-primary)' }}>{formatCurrency(currentSelectedClient.currentDebt)}</div>
              </div>
            </div>

            {currentSelectedClient.currentDebt > 0 && (
              <div style={{ marginBottom: '24px', backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Encaisser un remboursement</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="number" 
                    placeholder="Montant..." 
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}
                  />
                  <button onClick={handleAddPayment} style={{ backgroundColor: '#0e6ba8', color: 'white', border: 'none', padding: '0 16px', borderRadius: 'var(--radius-md)', fontWeight: 'bold', cursor: 'pointer' }}>
                    Valider
                  </button>
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Achats récents</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentSelectedClient.sales.length > 0 ? (
                currentSelectedClient.sales.map(sale => (
                  <div key={sale.id} style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{getProductName(sale.product_id)}</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(sale.total_price)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>{formatDate(sale.date)} • Qté: {sale.quantity}</span>
                      {String(sale.payment_method || '').toLowerCase() === 'credit' ? (
                        <span className="badge badge-credit">Crédit</span>
                      ) : (
                        <span>Comptant</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Aucun achat trouvé.</div>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
}
