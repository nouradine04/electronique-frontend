import { ShoppingCart, Bell } from 'lucide-react';

import { BRAND } from './constants';

export function DashboardHeader({ t, userName, formatDateFrench, setShowAlertsModal, lowStockProducts, setActiveTab }) {
  return (
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
  );
}
