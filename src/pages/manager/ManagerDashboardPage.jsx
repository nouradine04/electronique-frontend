import './recent-sales.css';
import { exportLocalBackup, restoreLocalBackup, encodeLocalBackup, decodeLocalBackup } from '../../db/backup.js';
import React, { useState, useMemo } from 'react';
import { useQuery } from '../../db/useQuery.js';
import { queryProducts, queryCategories, querySales, queryClients, queryPayments, queryStockMovements, queryInvoices, database } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { 
  ShoppingCart, Package, Clock, TrendingUp, Bell, AlertTriangle, 
  X, CheckCircle2, CreditCard, Smartphone, Banknote, User, AlertCircle, ArrowUpRight,
  ShieldAlert, Download, Upload
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BRAND = '#0e6ba8';

export function ManagerDashboardPage({ setActiveTab }) {
  const { currentShop, userName } = useShop();
  const { t } = useTranslation();
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [dismissedProductIds, setDismissedProductIds] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_stock_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const products = useQuery(queryProducts(currentShop?.id || '')) || [];
  const sales = useQuery(querySales(currentShop?.id || '')) || [];
  const clients = useQuery(queryClients(currentShop?.id || '')) || [];

  const todayStr = new Date().toISOString().split('T')[0];

  const todaySales = useMemo(() => {
    return sales
      .filter(s => s.date && s.date.startsWith(todayStr))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sales, todayStr]);

  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const todayCount = todaySales.length;

  const activeProducts = products.filter(p => p.status !== 'PENDING_PRICE' && p.quantity > 0);
  const pendingProducts = products.filter(p => p.status === 'PENDING_PRICE');

  // Filter alerts: only validated by admin (status !== 'PENDING_PRICE') AND under min_stock threshold
  const lowStockProducts = useMemo(() => {
    const activeAlerts = products.filter(p => p.status !== 'PENDING_PRICE' && p.quantity < (p.min_stock || 5));
    return activeAlerts.filter(p => !dismissedProductIds.includes(p.id));
  }, [products, dismissedProductIds]);

  // Automatically clean up dismissedProductIds when products are restocked
  React.useEffect(() => {
    const activeAlerts = products.filter(p => p.status !== 'PENDING_PRICE' && p.quantity < (p.min_stock || 5));
    const activeAlertsIds = activeAlerts.map(p => p.id);
    const cleaned = dismissedProductIds.filter(id => activeAlertsIds.includes(id));
    if (cleaned.length !== dismissedProductIds.length) {
      setDismissedProductIds(cleaned);
      localStorage.setItem('dismissed_stock_alerts', JSON.stringify(cleaned));
    }
  }, [products, dismissedProductIds]);

  const handleDismissAlert = (productId, e) => {
    e.stopPropagation();
    const updated = [...dismissedProductIds, productId];
    setDismissedProductIds(updated);
    localStorage.setItem('dismissed_stock_alerts', JSON.stringify(updated));
  };

  // En mode local, conserver tout l’historique sur cet appareil.

  // 7-day sales chart data
  const { chartData, weekTotalRevenue } = useMemo(() => {
    const labels = [];
    const revenueData = [];

    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = i === 0 ? "Aujourd'hui" : `${d.getDate()} ${months[d.getMonth()]}`;
      labels.push(dayLabel);

      const daySales = sales.filter(s => s.date && s.date.startsWith(dateStr));
      const dayRevenue = daySales.reduce((sum, s) => sum + (s.total_price || 0), 0);
      revenueData.push(dayRevenue);
    }

    const total = revenueData.reduce((a, b) => a + b, 0);

    return {
      weekTotalRevenue: total,
      chartData: {
        labels,
        datasets: [
          {
            label: 'Chiffre d\'affaires (FCFA)',
            data: revenueData,
            backgroundColor: BRAND,
            hoverBackgroundColor: '#095382',
            borderRadius: 0,
            barThickness: 24
          }
        ]
      }
    };
  }, [sales]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleFont: { size: 12, weight: 'normal' },
        bodyFont: { size: 13, weight: 'bold' },
        padding: 10,
        cornerRadius: 0,
        displayColors: false,
        callbacks: {
          label: (context) => `Ventes : ${context.parsed.y.toLocaleString('fr-FR')} FCFA`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-secondary)', font: { size: 12 } }
      },
      y: {
        grid: { color: 'var(--border-color)' },
        border: { display: false },
        ticks: {
          color: 'var(--text-secondary)',
          font: { size: 12 },
          maxTicksLimit: 5,
          callback: (value) => value >= 1000 ? `${(value / 1000).toLocaleString('fr-FR')}k F` : `${value} F`
        }
      }
    }
  };

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('fr-FR') + ' FCFA';
  };

  const getProductName = (productId) => {
    const p = products.find(x => x.id === productId);
    return p ? p.name : 'Produit inconnu';
  };

  const getClientName = (clientId) => {
    if (!clientId) return 'Client de passage';
    const c = clients.find(x => x.id === clientId);
    return c ? `${c.name} ${c.phone ? `(${c.phone})` : ''}` : 'Client inconnu';
  };

  const formatDateFrench = () => {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d);
  };

  const getPaymentBadge = (method) => {
    switch (method) {
      case 'cash':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
            <Banknote size={14} strokeWidth={2} /> Espèces
          </span>
        );
      case 'mobile_money':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--info)' }}>
            <Smartphone size={14} strokeWidth={2} /> Mobile Money
          </span>
        );
      case 'credit':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#ea580c' }}>
            <CreditCard size={14} strokeWidth={2} /> À Crédit
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Autre
          </span>
        );
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'inherit' }}>
      
      {/* Section 1 - Header & Notification button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{t('manager_dashboard.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>{t('manager_dashboard.greeting')} <strong>{userName}</strong>, {formatDateFrench()}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Notification Bell Button for Stock Alerts */}
          <button
            onClick={() => setShowAlertsModal(true)}
            style={{
              position: 'relative',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.2s'
            }}
            title={t('manager_dashboard.stock_alerts')}
          >
            <Bell size={20} />
            {lowStockProducts.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: 'var(--danger)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                minWidth: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 2px'
              }}>
                {lowStockProducts.length}
              </span>
            )}
          </button>

          {/* New Sale Action Button */}
          <button 
            onClick={() => setActiveTab && setActiveTab('pos')}
            style={{ 
              backgroundColor: BRAND, 
              color: '#fff', 
              border: 'none', 
              padding: '12px 20px', 
              borderRadius: 'var(--radius-md)', 
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(14, 107, 168, 0.25)'
            }}>
            <ShoppingCart size={18} />
            {t('manager_dashboard.new_sale')}
          </button>
        </div>
      </div>

      {/* Section 2 - KPI Cards */}
      <div className="manager-kpi-grid">
        <div className="kpi-card" style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{formatCurrency(todayRevenue)}</div>
            <div className="kpi-label" style={{ opacity: 0.9 }}>{t('manager_dashboard.today_sales')}</div>
          </div>
        </div>

        <div className="kpi-card" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--accent-primary)', color: 'white', opacity: 0.8 }}>
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>{todayCount}</div>
            <div className="kpi-label" style={{ color: 'var(--text-secondary)' }}>{t('manager_dashboard.sale_count')}</div>
          </div>
        </div>

        <div className="kpi-card" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--accent-primary)', color: 'white', opacity: 0.8 }}>
            <Package size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>{activeProducts.length}</div>
            <div className="kpi-label" style={{ color: 'var(--text-secondary)' }}>{t('manager_dashboard.in_stock')}</div>
          </div>
        </div>

        <div className="kpi-card" style={{ 
          borderColor: pendingProducts.length > 0 ? '#f59e0b' : 'var(--border-color)', 
          backgroundColor: pendingProducts.length > 0 ? 'var(--warning-bg)' : 'var(--bg-surface)'
        }}>
          <div className="kpi-icon-wrapper" style={{ 
            backgroundColor: pendingProducts.length > 0 ? '#f59e0b' : 'var(--border-color)', 
            color: pendingProducts.length > 0 ? 'white' : 'var(--text-secondary)' 
          }}>
            <Clock size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value" style={{ color: pendingProducts.length > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{pendingProducts.length}</div>
            <div className="kpi-label" style={{ color: pendingProducts.length > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>{t('manager_dashboard.pending')}</div>
          </div>
        </div>
      </div>

      {/* Section 3 - Stats Chart */}
      <div style={{ 
        backgroundColor: 'var(--bg-surface)', 
        border: '1px solid var(--border-color)', 
        padding: '24px', 
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} />
              Statistiques de ventes
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Chiffre d'affaires sur les 7 derniers jours</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Moyenne/Jour</span>
              <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                {Math.round(weekTotalRevenue / 7).toLocaleString('fr-FR')} F
              </span>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total 7j</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: BRAND }}>
                {weekTotalRevenue.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>
        </div>

        <div style={{ height: '240px', width: '100%' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Section 4 - Recent Sales Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: '28px'
      }}>
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{t('manager_dashboard.recent_sales')}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              <strong>{todaySales.length}</strong> {t('transactions_page.num_sales').toLowerCase()}
            </p>
          </div>
          {setActiveTab && (
            <button 
              onClick={() => setActiveTab('invoices')}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {t('dashboard.see_all')} <ArrowUpRight size={14} />
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="manager-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                <th>{t('transactions_page.date')}</th>
                <th>{t('transactions_page.product')}</th>
                <th>{t('transactions_page.client')}</th>
                <th style={{ textAlign: 'right' }}>{t('transactions_page.quantity')}</th>
                <th style={{ textAlign: 'right' }}>{t('transactions_page.amount')}</th>
                <th style={{ textAlign: 'center' }}>{t('transactions_page.payment')}</th>
              </tr>
            </thead>
            <tbody>
              {!todaySales.length ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {t('manager_dashboard.no_sales_today')}
                  </td>
                </tr>
              ) : (
                todaySales.slice(0, 8).map((sale, index) => (
                  <tr key={sale.id} style={{ borderBottom: index !== Math.min(todaySales.length, 8) - 1 ? '1px solid var(--border-color)' : 'none', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {formatTime(sale.date)}
                    </td>
                    <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                      {getProductName(sale.product_id)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} />
                        <span className="manager-table-client" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                          {getClientName(sale.client_id)}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: '500', color: 'var(--text-primary)', textAlign: 'right' }}>
                      {sale.quantity || 1}
                    </td>
                    <td style={{ fontWeight: '700', color: BRAND, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {formatCurrency(sale.total_price)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="payment-badge-container" style={{ display: 'inline-block', backgroundColor: 'var(--bg-main)', padding: '4px 10px', borderRadius: '100px', border: '1px solid var(--border-color)' }}>
                        {getPaymentBadge(String(sale.payment_method).toLowerCase())}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5 - Local Encrypted Backup & Restore */}
      <div style={{ 
        marginTop: '32px', 
        backgroundColor: 'var(--bg-surface)', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border-color)', 
        padding: '20px' 
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} color="#b30638" />
          Sécurité & Sauvegarde d'urgence
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          Pour éviter de perdre vos ventes ou remboursements saisis hors-ligne avant d'avoir pu vous connecter au serveur, vous pouvez exporter un fichier de sauvegarde hautement chiffré de cet appareil. Vous pourrez le restaurer sur ce support ou un autre appareil (téléphone, tablette, PC) à tout moment.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={async () => {
              try {
                const backupObj = await exportLocalBackup();
                
                const encryptedData = await encodeLocalBackup(backupObj);
                
                const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nstock_sauvegarde_${new Date().toISOString().split('T')[0]}.data`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                alert('Erreur lors de la création de la sauvegarde : ' + e.message);
              }
            }}
            style={{
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
          >
            <Download size={14} /> Exporter sauvegarde chiffrée
          </button>
          
          <label
            style={{
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
          >
            <Upload size={14} /> Restaurer un fichier
            <input
              type="file"
              accept=".data"
              onChange={(event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = async (e) => {
                  try {
                    const encryptedData = e.target.result;
                    const backupObj = await decodeLocalBackup(encryptedData);
                    
                    await restoreLocalBackup(backupObj);
                    
                    alert('Sauvegarde restaurée avec succès ! L\'application va s\'actualiser.');
                    window.location.reload();
                  } catch (err) {
                    alert('Fichier de sauvegarde invalide ou mot de passe incorrect : ' + err.message);
                  }
                };
                reader.readAsText(file);
              }}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Stock Alerts Modal */}
      {showAlertsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }} onClick={() => setShowAlertsModal(false)}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid var(--border-color)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="var(--text-primary)" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Alertes de stock ({lowStockProducts.length})
                </h3>
              </div>
              <button 
                onClick={() => setShowAlertsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
 
            {/* Modal Content */}
            <div style={{ padding: '0 20px', overflowY: 'auto', flex: 1 }}>
              {lowStockProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} color="var(--success)" style={{ marginBottom: '12px', opacity: 0.8 }} />
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Stock à jour</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Aucun produit en dessous du seuil d'alerte.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {lowStockProducts.map((p, idx) => {
                    const isOutOfStock = p.quantity === 0;
                    return (
                      <div key={p.id} style={{
                        padding: '16px 0',
                        borderBottom: idx !== lowStockProducts.length - 1 ? '1px solid var(--border-color)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '14px' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Seuil d'alerte : {p.min_stock || 5} unités
                          </div>
                        </div>
 
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            {isOutOfStock ? (
                              <span style={{
                                color: 'var(--danger)',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                padding: '4px 8px',
                                borderRadius: '4px'
                              }}>
                                Rupture de stock
                              </span>
                            ) : (
                              <span style={{
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                fontWeight: '500'
                              }}>
                                Stock : <strong style={{ color: p.quantity <= (p.min_stock || 5) / 2 ? 'var(--danger)' : 'var(--text-primary)' }}>{p.quantity}</strong>
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => handleDismissAlert(p.id, e)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              transition: 'background-color 0.2s'
                            }}
                            title="Masquer cette alerte"
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
 
            {/* Modal Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--bg-main)' }}>
              <button
                onClick={() => setShowAlertsModal(false)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}>
                Fermer
              </button>
            </div>
 
          </div>
        </div>
      )}

    </div>
  );
}
