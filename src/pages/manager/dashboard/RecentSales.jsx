import { User, ArrowUpRight } from 'lucide-react';

import { BRAND } from './constants';

export function RecentSales({
  t,
  todaySales,
  setActiveTab,
  formatTime,
  getProductName,
  getClientName,
  formatCurrency,
  getPaymentBadge,
}) {
  return (
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
  );
}
