import { ShoppingCart, Package, Clock, TrendingUp } from 'lucide-react';

export function DashboardSummary({ formatCurrency, todayRevenue, t, todayCount, activeProducts, pendingProducts }) {
  return (
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
  );
}
