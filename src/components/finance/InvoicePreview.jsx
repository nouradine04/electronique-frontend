import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildInvoicePdf } from '../../services/invoicePdf';
import '../../pages/common/invoices.css';

const money = value => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;

export function InvoicePreview({ invoice, shop, onClose }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const frame = useRef(null);
  useEffect(() => {
    let disposed = false;
    let url;
    buildInvoicePdf(invoice, shop).then(doc => {
      if (disposed) return;
      const blob = doc.output('blob');
      url = URL.createObjectURL(blob);
      setFile({ blob, url });
    }).catch(() => setError('Impossible de préparer la facture. Réessayez.'));
    return () => { disposed = true; if (url) URL.revokeObjectURL(url); };
  }, [invoice, shop]);
  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, [onClose]);
  const share = async () => {
    const attachment = new File([file.blob], `${invoice.id}.pdf`, { type: 'application/pdf' });
    try {
      if (navigator.canShare?.({ files: [attachment] })) await navigator.share({ files: [attachment], title: `Facture ${invoice.id}` });
      else { const link = document.createElement('a'); link.href = file.url; link.download = `${invoice.id}.pdf`; link.click(); }
    } catch (err) { if (err.name !== 'AbortError') setError('Partage indisponible. Téléchargez le PDF pour le transmettre.'); }
  };
  return createPortal(<div className="invoice-preview-overlay" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label="Aperçu de la facture" className="invoice-preview-dialog" onClick={event => event.stopPropagation()}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12, alignItems: 'center' }}>
        <strong style={{ flex: 1 }}>{invoice.id}</strong><button autoFocus className="btn btn-secondary" onClick={onClose}>Fermer</button>
      </div>
      {error && <p role="alert" style={{ padding: 12 }}>{error}</p>}
      <div className="invoice-preview-mobile">
        <div className="invoice-preview-mobile-heading"><span>FACTURE</span><strong>{invoice.id}</strong></div>
        <div className="invoice-preview-mobile-meta"><div><small>Boutique</small><strong>{shop?.name || 'Ma boutique'}</strong>{shop?.phone && <span>{shop.phone}</span>}</div><div><small>Date et heure</small><strong>{new Date(invoice.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</strong></div></div>
        <div className="invoice-preview-mobile-section"><small>CLIENT</small><strong>{invoice.clientName || 'Client comptoir'}</strong>{invoice.clientPhone && <span>{invoice.clientPhone}</span>}</div>
        <div className="invoice-preview-mobile-section"><small>PRODUIT</small><strong>{invoice.productName}</strong>{invoice.productDetails && <span>{invoice.productDetails}</span>}{invoice.unitIdentifiers?.map(unit => <span className="invoice-preview-identifier" key={`${unit.identifier_type}-${unit.identifier}`}>{unit.identifier_type === 'IMEI' ? 'IMEI' : 'N° de série'} : {unit.identifier}</span>)}</div>
        <div className="invoice-preview-mobile-row"><span>Quantité</span><strong>{invoice.quantity}</strong></div>
        <div className="invoice-preview-mobile-row"><span>Prix unitaire</span><strong>{money(invoice.unitPrice)}</strong></div>
        <div className="invoice-preview-mobile-row"><span>Paiement</span><strong>{({ cash: 'Espèces', mobile_money: 'Mobile Money', credit: 'Crédit' })[invoice.paymentMethod] || invoice.paymentMethod}</strong></div>
        <div className="invoice-preview-mobile-total"><span>Total</span><strong>{money(invoice.totalAmount)}</strong></div>
      </div>
      {file ? <iframe className="invoice-preview-frame" ref={frame} title={`Facture ${invoice.id}`} src={file.url} /> : <p className="invoice-preview-loading">Préparation du PDF…</p>}
      {file && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12 }}>
        <a className="btn btn-primary" href={file.url} download={`${invoice.id}.pdf`}>Télécharger PDF</a>
        <button className="btn btn-secondary" onClick={share}>Partager</button>
        <button className="btn btn-secondary" onClick={() => { try { frame.current.contentWindow.focus(); frame.current.contentWindow.print(); } catch { window.open(file.url, '_blank', 'noopener'); } }}>Imprimer</button>
        <a className="btn btn-secondary" href={file.url} target="_blank" rel="noreferrer">Ouvrir le PDF</a>
      </div>}
    </div>
  </div>, document.body);
}
