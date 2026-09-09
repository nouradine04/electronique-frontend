import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw } from 'lucide-react';

function movementInfo(movement) {
  if (movement.type === 'IN') return { label: String(movement.reason || '').startsWith('Retour client') ? 'Retour en stock' : 'Approvisionnement', className: 'in', Icon: ArrowDownToLine, sign: '+' };
  if (movement.type === 'OUT') return { label: String(movement.reason || '').toLowerCase().includes('vente') || !movement.reason ? 'Vente / sortie' : 'Sortie', className: 'out', Icon: ArrowUpFromLine, sign: '−' };
  return { label: 'Ajustement', className: 'adjust', Icon: RefreshCw, sign: '=' };
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date inconnue' : date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function ManagerStockJournal({ movements, productsById }) {
  if (!movements.length) return <div className="ms-empty"><RefreshCw size={28} /><strong>Aucun mouvement enregistré</strong><span>Les ventes, entrées et corrections apparaîtront ici.</span></div>;
  return <div className="ms-journal" role="table" aria-label="Journal des mouvements de stock">
    <div className="ms-journal-head" role="row"><span>Date</span><span>Produit</span><span>Mouvement</span><span>Motif</span><span>Quantité</span><span>Opérateur</span></div>
    {movements.map(movement => {
      const info = movementInfo(movement);
      const product = productsById.get(movement.productId || movement.product_id);
      return <article className="ms-journal-row" role="row" key={movement.id}>
        <time dateTime={movement.date}>{formatDate(movement.date)}</time>
        <strong>{product?.name || 'Produit conservé dans l’historique'}</strong>
        <span className={`ms-movement-kind ${info.className}`}><info.Icon size={15} />{info.label}</span>
        <span className="ms-journal-reason">{movement.reason || (movement.type === 'OUT' ? 'Vente enregistrée' : 'Mouvement manuel')}</span>
        <b className={info.className}>{info.sign}{Number(movement.quantity || 0)}</b>
        <span>{movement.userName || movement.user_name || 'Utilisateur'}</span>
      </article>;
    })}
  </div>;
}
