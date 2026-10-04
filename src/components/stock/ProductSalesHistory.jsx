import React, { useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { ShoppingBag } from 'lucide-react';
import database from '../../db/watermelondb';
import { useQuery } from '../../db/useQuery.js';
import './product-sales-history.css';

export function ProductSalesHistory({ shopId, productId }) {
  const [page, setPage] = useState(0);
  const sales = useQuery(database.get('sales').query(
    Q.where('shop_id', shopId), Q.where('product_id', productId),
    Q.sortBy('date', Q.desc), Q.skip(page * 10), Q.take(11),
  ));
  const clientIds = [...new Set(sales.slice(0, 10).map(sale => sale.clientId).filter(Boolean))];
  const clients = useQuery(clientIds.length ? database.get('clients').query(Q.where('shop_id', shopId), Q.where('id', Q.oneOf(clientIds))) : null);
  const clientsById = new Map(clients.map(client => [client.id, client]));

  return <section className="pd-content product-sales-history">
    <p className="pd-sales-intro">Ventes de ce produit dans cette boutique, de la plus récente à la plus ancienne.</p>
    {sales.length === 0 && <div className="pd-sales-empty"><ShoppingBag size={22} /><span>Aucune vente enregistrée pour ce produit.</span></div>}
    {sales.slice(0, 10).map(sale => {
      const date = new Date(sale.date);
      const client = clientsById.get(sale.clientId);
      const returned = Number(sale.returnedQuantity || 0);
      return <article className="pd-sale-row" key={sale.id}>
        <span className="pd-sale-icon"><ShoppingBag size={17} /></span>
        <div className="pd-sale-copy">
          <div className="pd-sale-heading"><strong>{client?.name || 'Client non renseigné'}</strong><strong className="pd-sale-amount">{Number(sale.totalPrice || 0).toLocaleString('fr-FR')} FCFA</strong></div>
          <span>{Number(sale.quantity || 0)} unité{Number(sale.quantity || 0) > 1 ? 's' : ''}{client?.phone ? ` · ${client.phone}` : ''}{returned ? ` · ${returned} retournée${returned > 1 ? 's' : ''}` : ''}</span>
          <small>{Number.isNaN(date.getTime()) ? 'Date inconnue' : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })} · Vendu par {sale.sellerName || 'Utilisateur'}</small>
        </div>
      </article>;
    })}
    {(page > 0 || sales.length > 10) && <div className="pd-sales-pages"><button type="button" className="btn btn-secondary" disabled={!page} onClick={() => setPage(value => value - 1)}>Précédent</button><span>Page {page + 1}</span><button type="button" className="btn btn-secondary" disabled={sales.length <= 10} onClick={() => setPage(value => value + 1)}>Suivant</button></div>}
  </section>;
}
