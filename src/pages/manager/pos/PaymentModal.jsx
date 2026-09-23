import { UnitPicker } from '../../../components/stock/UnitPicker';

import { User, Check, X } from 'lucide-react';

import { BRAND } from './constants';

export function PaymentModal({
  setShowPaymentModal,
  cartTotal,
  cartItems,
  setCart,
  paymentMethods,
  paymentMethod,
  setPaymentMethod,
  selectedClient,
  setSelectedClient,
  clientSearch,
  setClientSearch,
  filteredClients,
  newClientName,
  setNewClientName,
  newClientPhone,
  setNewClientPhone,
  amountReceived,
  setAmountReceived,
  finalizeCheckout,
  isCheckingOut,
}) {
  return (
<div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: '20px', color: 'var(--text-primary)' }}>Paiement</h2>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>

            {/* Total recap */}
            <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Montant total</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: BRAND }}>{cartTotal.toLocaleString('fr-FR')} FCFA</div>
            </div>

            {cartItems.filter(item => item.product.trackingMode !== 'QUANTITY').map(item => <div key={item.productId}><strong>{item.product.name}</strong>
                  {item.product.trackingMode !== 'QUANTITY' && <UnitPicker productId={item.productId} quantity={item.quantity} selected={item.unitIds || []} onChange={ids => setCart(prev => prev.map(row => row.productId === item.productId ? { ...row, unitIds: ids } : row))} />}
            </div>)}

            {/* Payment method */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>Mode de paiement</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {paymentMethods.map(pm => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      className={`payment-method-btn ${paymentMethod === pm.id ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(pm.id)}
                    >
                      <Icon size={22} color={paymentMethod === pm.id ? BRAND : 'var(--text-muted)'} style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '12px', fontWeight: 600, color: paymentMethod === pm.id ? BRAND : 'var(--text-secondary)' }}>{pm.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Client search */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                <User size={14} style={{ display: 'inline', marginRight: '6px' }} />Client {cartItems.some(item => item.product.trackingMode !== 'QUANTITY') ? '(obligatoire)' : '(optionnel)'}
              </label>
              {selectedClient ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-main)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ flex: 1, fontWeight: 600 }}>{selectedClient.name}</span>
                  <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    className="input-field"
                    style={{ marginBottom: '8px' }}
                    placeholder="Rechercher un client existant..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                  />
                  {filteredClients.length > 0 && (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
                      {filteredClients.slice(0, 4).map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedClient(c); setClientSearch(''); }}
                          style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'var(--bg-surface)', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}
                        >
                          <User size={14} color="var(--text-muted)" />
                          <span>{c.name}</span>
                          {c.phone && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>— {c.phone}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input type="text" className="input-field" placeholder="Nouveau client (nom)" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                    <input type="tel" className="input-field" placeholder="Téléphone" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* Credit partial */}
            {paymentMethod === 'credit' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Acompte reçu (FCFA)</label>
                <input type="number" className="input-field" placeholder="0" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} />
                {amountReceived > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>
                    Reste à payer: {(cartTotal - Number(amountReceived)).toLocaleString('fr-FR')} FCFA
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 800, borderRadius: '12px' }}
              onClick={finalizeCheckout}
              disabled={isCheckingOut}
            >
              <Check size={18} style={{ display: 'inline', marginRight: '8px' }} />
              Confirmer la vente
            </button>
          </div>
        </div>
  );
}
