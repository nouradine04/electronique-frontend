import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildInvoicePdf } from '../../services/invoicePdf';

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
    const handler = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); previous?.focus(); };
  }, [onClose]);
  const share = async () => {
    const attachment = new File([file.blob], `${invoice.id}.pdf`, { type: 'application/pdf' });
    try {
      if (navigator.canShare?.({ files: [attachment] })) await navigator.share({ files: [attachment], title: `Facture ${invoice.id}` });
      else { const link = document.createElement('a'); link.href = file.url; link.download = `${invoice.id}.pdf`; link.click(); }
    } catch (err) { if (err.name !== 'AbortError') setError('Partage indisponible. Téléchargez le PDF pour le transmettre.'); }
  };
  return createPortal(<div style={{ position: 'fixed', inset: 0, zIndex: 1200, padding: 12, background: 'rgba(15,23,42,.6)', display: 'grid', placeItems: 'center' }}>
    <div role="dialog" aria-modal="true" aria-label="Aperçu de la facture" style={{ width: '100%', maxWidth: 850, height: '92dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12, alignItems: 'center' }}>
        <strong style={{ flex: 1 }}>{invoice.id}</strong><button autoFocus className="btn btn-secondary" onClick={onClose}>Fermer</button>
      </div>
      {error && <p role="alert" style={{ padding: 12 }}>{error}</p>}
      {file ? <iframe ref={frame} title={`Facture ${invoice.id}`} src={file.url} style={{ flex: 1, width: '100%', border: 0, background: '#f1f5f9' }} /> : <p style={{ padding: 16 }}>Préparation du document…</p>}
      {file && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12 }}>
        <a className="btn btn-primary" href={file.url} download={`${invoice.id}.pdf`}>Télécharger PDF</a>
        <button className="btn btn-secondary" onClick={share}>Partager</button>
        <button className="btn btn-secondary" onClick={() => { try { frame.current.contentWindow.focus(); frame.current.contentWindow.print(); } catch { window.open(file.url, '_blank', 'noopener'); } }}>Imprimer</button>
        <a className="btn btn-secondary" href={file.url} target="_blank" rel="noreferrer">Ouvrir le PDF</a>
      </div>}
    </div>
  </div>, document.body);
}
