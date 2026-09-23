import { Check, FileText } from 'lucide-react';

import { variantLabel, BRAND } from './constants';

export function SaleReceipt({ invoiceData, generatePDF, setInvoiceData }) {
  return (
<div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Check size={28} color="#10b981" />
              </div>
              <h2 style={{ margin: '0 0 4px', fontWeight: 800, color: 'var(--text-primary)' }}>Vente enregistrée !</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
                {invoiceData.pendingSync ? '⏳ Données sauvegardées localement, sync en attente' : '✅ Synchronisé'}
              </p>
            </div>

            <div style={{ background: 'var(--bg-main)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              {invoiceData.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>{item.product.name} x{item.quantity}<small className="pos-variant">{variantLabel(item.product)}</small></span>
                  <span style={{ fontWeight: 600 }}>{(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '16px' }}>
                <span>Total</span>
                <span color={BRAND}>{invoiceData.total.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={generatePDF}>
                <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} />
                PDF
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setInvoiceData(null)}>
                Nouvelle vente
              </button>
            </div>
          </div>
        </div>
  );
}
