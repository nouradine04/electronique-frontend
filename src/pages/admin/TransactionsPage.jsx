import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '../../db/useQuery.js';
import { useShop } from '../../context/ShopContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { querySales, queryProducts, queryClients, queryReturns, processSaleReturn } from '../../db/queries.js';
import { ReturnSaleModal } from '../../components/sales/ReturnSaleModal.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { Search, Filter, Calendar, Banknote, Receipt, CreditCard, AlertCircle, Check, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function TransactionsPage() {
  const { t } = useTranslation();
  const { currentShop, userRole, userName } = useShop();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('tout');
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentFilter, setPaymentFilter] = useState('tous');
  const [selectedReturnSale, setSelectedReturnSale] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const allSales = useQuery(
    currentShop ? querySales(currentShop.id) : null,
    [currentShop?.id]
  ) || [];

  const allProducts = useQuery(
    currentShop ? queryProducts(currentShop.id) : null,
    [currentShop?.id]
  ) || [];

  const allClients = useQuery(
    currentShop ? queryClients(currentShop.id) : null,
    [currentShop?.id]
  ) || [];

  const allReturns = useQuery(
    currentShop ? queryReturns(currentShop.id) : null,
    [currentShop?.id]
  ) || [];

  const returnsBySale = useMemo(() => {
    const result = new Map();
    allReturns.forEach(item => {
      const current = result.get(item.saleId) || { quantity: 0, refund: 0 };
      current.quantity += Number(item.quantity || 0);
      current.refund += Number(item.refundAmount || 0);
      result.set(item.saleId, current);
    });
    return result;
  }, [allReturns]);

  const getDateRange = (filter) => {
    const now = new Date();
    switch (filter) {
      case 'aujourd_hui': {
        const start = new Date(now); start.setHours(0, 0, 0, 0);
        const end = new Date(start); end.setDate(end.getDate() + 1);
        return { start, end };
      }
      case 'semaine': {
        const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0);
        return { start, end: null };
      }
      case 'mois': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: null };
      case 'annee': return { start: new Date(now.getFullYear(), 0, 1), end: null };
      case 'date': {
        const [year, month, day] = customDate.split('-').map(Number);
        if (!year || !month || !day) return { start: new Date(0), end: null };
        const start = new Date(year, month - 1, day);
        const end = new Date(year, month - 1, day + 1);
        return { start, end };
      }
      default: return { start: new Date(0), end: null };
    }
  };

  const filteredSales = useMemo(() => {
    const { start, end } = getDateRange(timeFilter);
    return allSales.filter(sale => {
      const saleDate = new Date(sale.date);
      if (saleDate < start || (end && saleDate >= end)) return false;
      if (paymentFilter !== 'tous' && sale.paymentMethod !== paymentFilter) return false;
      const product = allProducts.find(p => p.id === sale.productId);
      const client = allClients.find(c => c.id === sale.clientId);
      const q = (searchQuery || '').toLowerCase();
      if (q && !(product?.name || '').toLowerCase().includes(q) && !(client?.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allSales, allProducts, allClients, timeFilter, customDate, paymentFilter, searchQuery]);
  const pageSize = isMobile ? 6 : 12;
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const paginatedSales = filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setCurrentPage(1), [searchQuery, timeFilter, customDate, paymentFilter, currentShop?.id]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  const totalEncaisse = filteredSales
    .filter(sale => sale.paymentMethod !== 'credit')
    .reduce((total, sale) => total + (Number(sale.totalPrice) || 0) - (returnsBySale.get(sale.id)?.refund || 0), 0);
  const totalCredit = filteredSales
    .filter(sale => sale.paymentMethod === 'credit')
    .reduce((total, sale) => total + (Number(sale.totalPrice) || 0) - (returnsBySale.get(sale.id)?.refund || 0), 0);

  const handleReturn = async data => {
    const sale = selectedReturnSale;
    const product = allProducts.find(item => item.id === sale?.productId);
    try {
      await processSaleReturn({
        ...data,
        sale,
        product,
        shop_id: currentShop.id,
        processed_by: userName,
        authorized_seller: userName,
      });
      setSelectedReturnSale(null);
      showToast('Retour enregistré et historique mis à jour.', 'success');
    } catch (error) {
      showToast(error.message || 'Impossible d’enregistrer le retour.', 'danger');
    }
  };

  const paymentLabels = { cash: 'Espèces', mobile_money: 'Mobile Money', credit: 'Crédit' };

  const getPaymentBadge = (m) => {
    const styles = {
      cash: 'badge-success',
      mobile_money: 'badge-primary',
      credit: 'badge-credit'
    };
    return styles[m] || 'badge-secondary';
  };

  const normalizeName = value => String(value || '').trim().toLowerCase();
  const canUserReturnSale = sale => normalizeName(sale?.sellerName || sale?.seller_name) === normalizeName(userName);

  const formatDate = (d) => {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(dt);
  };

  const formatCurrency = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

  if (!currentShop) return <div style={{ padding: '24px' }}>Sélectionnez une boutique.</div>;

  const timeFilters = [
    { id: 'aujourd_hui', label: "Aujourd'hui" },
    { id: 'semaine', label: 'Cette semaine' },
    { id: 'mois', label: 'Ce mois' },
    { id: 'annee', label: 'Cette année' },
    { id: 'date', label: 'Date précise' },
    { id: 'tout', label: 'Tout' }
  ];
  const paymentFilters = [
    { id: 'tous', label: 'Tous' },
    { id: 'cash', label: 'Espèces' },
    { id: 'mobile_money', label: 'Mobile Money' },
    { id: 'credit', label: 'Crédit' }
  ];

  return (
    <div style={{ padding: isMobile ? '16px 12px 96px' : '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .tp-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; }
        .tp-transaction-card { background: var(--bg-surface); border: 1px solid #dee2e6; border-radius: 8px; padding: 14px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
        .tp-transaction-main { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: start; }
        .tp-mobile-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color); }
        .tp-meta-label { display: block; color: var(--text-muted); font-size: 11px; font-weight: 700; margin-bottom: 2px; }
        .tp-meta-value { color: var(--text-primary); font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
        .badge { display: inline-flex; align-items: center; justify-content: center; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; line-height: 1; white-space: nowrap; }
        .badge-success { color: #fff; background-color: #28a745; }
        .badge-danger { color: #fff; background-color: #dc3545; }
        .badge-warning { color: #212529; background-color: #ffc107; }
        .badge-credit { color: #fff; background-color: #ea580c; }
        .badge-primary { color: #fff; background-color: #007bff; }
        .badge-secondary { color: #fff; background-color: #6c757d; }
        .tp-return-btn { min-height: 34px; border: 1px solid #ffc107; border-radius: 4px; background: #ffc107; color: #212529; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
        .tp-filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(105px, 1fr)); gap: 8px; }
        .tp-filter-title { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: var(--text-secondary); font-size: 13px; font-weight: 700; }
        .tp-filter-btn { min-height: 42px; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-primary); cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; text-align: center; }
        .tp-filter-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
        .tp-filter-btn.active { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); box-shadow: 0 4px 12px rgba(14, 107, 168, 0.2); }
        .tp-period-mobile { display: none; }
        .tp-period-select, .tp-date-input { width: 100%; min-height: 46px; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-main); color: var(--text-primary); font: inherit; font-size: 14px; font-weight: 600; outline: none; box-sizing: border-box; }
        .tp-period-select:focus, .tp-date-input:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(14, 107, 168, 0.12); }
        .tp-custom-date { display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 10px 12px; border-radius: 10px; background: rgba(14, 107, 168, 0.08); color: var(--accent-primary); }
        .tp-payment-filter-btn { padding: 8px 16px; border-radius: 20px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary); cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; white-space: nowrap; }
        .tp-payment-filter-btn:hover { background: var(--bg-main); }
        .tp-payment-filter-btn.active { background: var(--text-primary); color: var(--bg-surface); border-color: var(--text-primary); }
        .tp-table { width: 100%; border-collapse: collapse; }
        .tp-table th { text-align: left; padding: 16px; border-bottom: 1px solid var(--border-color); font-weight: 600; color: var(--text-secondary); font-size: 14px; }
        .tp-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-color); font-size: 14px; color: var(--text-primary); }
        .tp-table tr:last-child td { border-bottom: none; }
        .tp-table tbody tr:hover { background: var(--bg-main); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 520px) {
          .tp-period-desktop { display: none; }
          .tp-period-mobile { display: block; }
          .tp-transaction-card { padding: 12px; }
          .tp-mobile-meta { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px 12px; }
          .tp-transaction-main > div:first-child > div:first-child { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        }
        @media (max-width: 350px) {
          .tp-transaction-main { grid-template-columns: 1fr; }
          .tp-transaction-main > div:last-child { text-align: left !important; }
        }
      `}</style>

      <div style={{ marginBottom: isMobile ? '18px' : '24px' }}>
        <h1 style={{ fontSize: isMobile ? '21px' : '24px', fontWeight: 'bold', margin: '0 0 8px', color: 'var(--text-primary)' }}>
          {userRole === 'owner' ? 'Historique des transactions' : 'Ventes'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          {userRole === 'owner' ? 'Toutes les transactions' : 'Toutes les ventes et leurs vendeurs'} de {currentShop.name}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {[
          { icon: <Banknote size={24} />, label: 'Total encaissé', value: formatCurrency(totalEncaisse), highlighted: true },
          { icon: <Receipt size={24} />, label: 'Nombre de ventes', value: filteredSales.length },
          { icon: <CreditCard size={24} />, label: 'Montant à crédit', value: formatCurrency(totalCredit) }
        ].map((card, i) => (
          <div key={i} className="tp-card" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: card.highlighted ? 'var(--accent-primary)' : 'var(--bg-surface)',
            borderColor: card.highlighted ? 'var(--accent-primary)' : 'var(--border-color)',
            boxShadow: card.highlighted ? '0 8px 22px rgba(14, 107, 168, 0.22)' : undefined
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: card.highlighted ? 'rgba(255,255,255,0.18)' : 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.highlighted ? '#fff' : 'var(--text-primary)', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', color: card.highlighted ? 'rgba(255,255,255,0.88)' : 'var(--text-secondary)', fontWeight: 500, marginBottom: '4px' }}>{card.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: card.highlighted ? '#fff' : 'var(--text-primary)', overflowWrap: 'anywhere' }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="tp-card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" style={{ width: '100%', padding: '10px 16px 10px 38px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} placeholder="Rechercher produit ou client..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div>
            <div className="tp-filter-title">
              <Calendar size={16} />
              <span>Période</span>
            </div>
            <div className="tp-period-desktop">
              <div className="tp-filter-grid">
                {timeFilters.map(f => (
                  <button
                    key={f.id}
                    className={`tp-filter-btn ${timeFilter === f.id ? 'active' : ''}`}
                    aria-pressed={timeFilter === f.id}
                    onClick={() => setTimeFilter(f.id)}
                  >
                    {timeFilter === f.id && <Check size={14} />}
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="tp-period-mobile">
              <select
                className="tp-period-select"
                aria-label="Choisir la période"
                value={timeFilter}
                onChange={event => setTimeFilter(event.target.value)}
              >
                {timeFilters.map(filter => <option key={filter.id} value={filter.id}>{filter.label}</option>)}
              </select>
            </div>
            {timeFilter === 'date' && (
              <label className="tp-custom-date">
                <Calendar size={18} aria-hidden="true" />
                <input
                  className="tp-date-input"
                  type="date"
                  aria-label="Date des ventes"
                  value={customDate}
                  onChange={event => setCustomDate(event.target.value)}
                />
              </label>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Filter size={15} color="var(--text-muted)" />
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {paymentFilters.map(f => (
                <button key={f.id} className={`tp-payment-filter-btn ${paymentFilter === f.id ? 'active' : ''}`} onClick={() => setPaymentFilter(f.id)}>{f.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="tp-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredSales.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', fontWeight: 500 }}>{userRole === 'owner' ? 'Aucune transaction trouvée' : 'Aucune vente trouvée'}</p>
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
            {paginatedSales.map((sale, idx) => {
              const product = allProducts.find(p => p.id === sale.productId);
              const client = allClients.find(c => c.id === sale.clientId);
              const returnInfo = returnsBySale.get(sale.id) || { quantity: 0, refund: 0 };
              const isOwnSale = canUserReturnSale(sale);
              const canReturn = Boolean(product) && isOwnSale && returnInfo.quantity < Number(sale.quantity || 0);
              const netAmount = Number(sale.totalPrice || 0) - Number(returnInfo.refund || 0);
              return (
                <div key={sale.id || idx} className="tp-transaction-card">
                  <div className="tp-transaction-main">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.35, overflowWrap: 'anywhere' }}>{product?.name || 'Produit inconnu'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Client : {client?.name || 'Anonyme'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#0d6efd', fontSize: '15px', whiteSpace: 'nowrap' }}>{formatCurrency(netAmount)}</div>
                      {returnInfo.refund > 0 && <div style={{ color: '#6c757d', fontSize: '11px', marginTop: '2px' }}>net retour</div>}
                    </div>
                  </div>
                  <div className="tp-mobile-meta">
                    <div><span className="tp-meta-label">Vendeur</span><strong className="tp-meta-value">{sale.sellerName || 'Non renseigné'}</strong></div>
                    <div><span className="tp-meta-label">Paiement</span><span className={`badge ${getPaymentBadge(sale.paymentMethod)}`}>{paymentLabels[sale.paymentMethod] || sale.paymentMethod}</span></div>
                    <div><span className="tp-meta-label">Quantité</span><span className="tp-meta-value">{sale.quantity}</span></div>
                    <div><span className="tp-meta-label">Date</span><span className="tp-meta-value">{formatDate(sale.date)}</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {returnInfo.quantity > 0 && (
                      <span className="badge badge-warning">
                        Retour {returnInfo.quantity}/{sale.quantity}
                      </span>
                    )}
                    {!isOwnSale && (
                      <span className="badge badge-secondary">
                        Retour réservé au vendeur
                      </span>
                    )}
                  </div>
                  {canReturn && (
                    <button onClick={() => setSelectedReturnSale(sale)} className="tp-return-btn" style={{ marginTop: '10px', width: '100%', minHeight: '40px' }}>
                      <RotateCcw size={15} /> Enregistrer un retour
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tp-table">
              <thead style={{ background: 'var(--bg-main)' }}>
                <tr>
                  <th>Produit</th>
                  <th>Client</th>
                  <th>Vendeur</th>
                  <th>Quantité</th>
                  <th>Montant</th>
                  <th>Paiement</th>
                  <th>Date</th>
                  <th>Retour</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.map((sale, idx) => {
                  const product = allProducts.find(p => p.id === sale.productId);
                  const client = allClients.find(c => c.id === sale.clientId);
                  const returnInfo = returnsBySale.get(sale.id) || { quantity: 0, refund: 0 };
                  const canReturn = Boolean(product) && canUserReturnSale(sale) && returnInfo.quantity < Number(sale.quantity || 0);
                  return (
                    <tr key={sale.id || idx}>
                      <td style={{ fontWeight: 500 }}>{product?.name || 'Produit inconnu'}</td>
                      <td style={{ color: client ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: client ? 'normal' : 'italic' }}>
                        {client?.name || 'Anonyme'}
                      </td>
                      <td>
                        {sale.sellerName
                          ? <strong>{sale.sellerName}</strong>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>
                        }
                      </td>
                      <td>{sale.quantity}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(sale.totalPrice)}</td>
                      <td>
                        <span className={`badge ${getPaymentBadge(sale.paymentMethod)}`}>
                          {paymentLabels[sale.paymentMethod] || sale.paymentMethod}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{formatDate(sale.date)}</td>
                      <td>
                        {canReturn ? (
                          <button onClick={() => setSelectedReturnSale(sale)} className="tp-return-btn" style={{ padding: '0 10px', fontSize: '12px' }}>
                            <RotateCcw size={13} /> Retour
                          </button>
                        ) : returnInfo.quantity > 0 ? (
                          <span style={{ color: '#c2410c', fontSize: '12px', fontWeight: 700 }}>{returnInfo.quantity}/{sale.quantity}</span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={currentPage} totalPages={totalPages} totalItems={filteredSales.length} itemLabel="vente" onPageChange={setCurrentPage} />

      {selectedReturnSale && (
        <ReturnSaleModal
          sale={selectedReturnSale}
          product={allProducts.find(item => item.id === selectedReturnSale.productId)}
          client={allClients.find(item => item.id === selectedReturnSale.clientId)}
          alreadyReturned={returnsBySale.get(selectedReturnSale.id)?.quantity || 0}
          onClose={() => setSelectedReturnSale(null)}
          onSubmit={handleReturn}
        />
      )}
    </div>
  );
}
