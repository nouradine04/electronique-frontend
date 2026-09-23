import { Bell, X, CheckCircle2 } from 'lucide-react';

export function StockAlertsModal({ setShowAlertsModal, lowStockProducts, handleDismissAlert }) {
  return (
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
  );
}
