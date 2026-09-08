import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

const fieldStyle = {
  width: '100%',
  minHeight: '44px',
  padding: '10px 12px',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  background: 'var(--bg-main)',
  color: 'var(--text-primary)',
  font: 'inherit',
  boxSizing: 'border-box',
  outline: 'none',
};

export function ReturnSaleModal({ sale, product, client, alreadyReturned = 0, onClose, onSubmit }) {
  const remaining = Math.max(0, Number(sale?.quantity || 0) - Number(alreadyReturned || 0));
  const unitPrice = Number(sale?.totalPrice || sale?.total_price || 0) / Math.max(1, Number(sale?.quantity || 1));
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [resolution, setResolution] = useState('REFUND');
  const [restock, setRestock] = useState(true);
  const [refundAmount, setRefundAmount] = useState(unitPrice);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const suggestedRefund = useMemo(() => Math.round(unitPrice * Number(quantity || 0)), [unitPrice, quantity]);
  const refundRequired = resolution === 'REFUND';

  useEffect(() => {
    setRefundAmount(resolution === 'REFUND' ? suggestedRefund : 0);
  }, [resolution, suggestedRefund]);

  if (!sale || !product) return null;

  const submit = async event => {
    event.preventDefault();
    setSubmitting(true);
    setLocalError('');
    try {
      if (refundRequired && Number(refundAmount || 0) <= 0) {
        setLocalError('Le montant remboursé doit être positif.');
        return;
      }
      try {
        await onSubmit({
          quantity: Number(quantity),
          reason: reason.trim(),
          resolution,
          restock,
          refund_amount: Number(refundAmount || 0),
        });
      } catch (error) {
        setLocalError(error.message || 'Impossible d’enregistrer ce retour.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="presentation"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,.58)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-sale-title"
        onSubmit={submit}
        style={{ width: '100%', maxWidth: '520px', maxHeight: '92vh', overflowY: 'auto', background: 'var(--bg-surface)', color: 'var(--text-primary)', borderRadius: '18px', border: '1px solid var(--border-color)', boxShadow: '0 24px 70px rgba(0,0,0,.28)' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', flexShrink: 0, borderRadius: '12px', display: 'grid', placeItems: 'center', background: '#fff7ed', color: '#c2410c' }}>
              <RotateCcw size={21} />
            </div>
            <div>
              <h2 id="return-sale-title" style={{ margin: 0, fontSize: '18px' }}>Enregistrer un retour</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>{product.name} · {client?.name || 'Client anonyme'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" style={{ border: 0, background: 'var(--bg-main)', color: 'var(--text-secondary)', borderRadius: '50%', width: '34px', height: '34px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '20px', display: 'grid', gap: '16px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '11px', background: 'rgba(14,107,168,.08)', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 700 }}>
            {remaining} article{remaining > 1 ? 's' : ''} encore retournable{remaining > 1 ? 's' : ''} sur {sale.quantity}
          </div>

          <label style={{ display: 'grid', gap: '7px', fontSize: '13px', fontWeight: 700 }}>
            Quantité retournée
            <input style={fieldStyle} type="number" min="1" max={remaining} step="1" value={quantity} onChange={event => setQuantity(event.target.value)} required />
          </label>

          <label style={{ display: 'grid', gap: '7px', fontSize: '13px', fontWeight: 700 }}>
            Motif du retour
            <textarea style={{ ...fieldStyle, minHeight: '92px', resize: 'vertical' }} value={reason} onChange={event => setReason(event.target.value)} placeholder="Ex. appareil défectueux, mauvaise capacité…" required />
          </label>

          <label style={{ display: 'grid', gap: '7px', fontSize: '13px', fontWeight: 700 }}>
            Solution choisie
            <select style={fieldStyle} value={resolution} onChange={event => setResolution(event.target.value)}>
              <option value="REFUND">Remboursement</option>
              <option value="EXCHANGE">Échange</option>
              <option value="REPAIR">Prise en charge / réparation</option>
            </select>
          </label>

          <label style={{ display: 'grid', gap: '7px', fontSize: '13px', fontWeight: 700 }}>
            Montant à retirer / rembourser (FCFA)
            <input style={fieldStyle} type="number" min={refundRequired ? 1 : 0} max={Math.round(unitPrice * remaining)} value={refundAmount} onChange={event => setRefundAmount(event.target.value)} disabled={!refundRequired} required={refundRequired} />
            {refundRequired && <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Prérempli avec le montant de la vente retournée : {suggestedRefund.toLocaleString('fr-FR')} F</span>}
          </label>

          {localError && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#f8d7da', color: '#842029', border: '1px solid #f5c2c7', fontSize: '13px', fontWeight: 700 }}>
              {localError}
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', borderRadius: '11px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            <input type="checkbox" checked={restock} onChange={event => setRestock(event.target.checked)} style={{ marginTop: '2px' }} />
            <span>
              <strong style={{ display: 'block', fontSize: '13px' }}>Remettre dans le stock</strong>
              <span style={{ display: 'block', marginTop: '3px', color: 'var(--text-secondary)', fontSize: '12px' }}>Décochez si l’appareil est défectueux ou part en réparation.</span>
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid var(--border-color)', position: 'sticky', bottom: 0, background: 'var(--bg-surface)' }}>
          <button type="button" onClick={onClose} style={{ minHeight: '44px', padding: '0 18px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button type="submit" disabled={submitting || remaining === 0} style={{ minHeight: '44px', padding: '0 18px', borderRadius: '10px', border: 0, background: 'var(--accent-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: submitting ? .65 : 1 }}>
            {submitting ? 'Enregistrement…' : 'Valider le retour'}
          </button>
        </div>
      </form>
    </div>
  );
}
