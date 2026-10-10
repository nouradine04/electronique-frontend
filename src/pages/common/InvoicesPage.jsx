import React, { useMemo, useState } from 'react';
import { Search, FileText, Eye, ReceiptText, Wallet, CreditCard } from 'lucide-react';
import { useQuery, useQueryState } from '../../db/useQuery.js';
import { queryProducts, querySales, queryClients } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { InvoicePreview } from '../../components/finance/InvoicePreview.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { useTranslation } from 'react-i18next';
import { useSaleHistory } from '../../services/useSaleHistory.js';
import './invoices.css';

const money = value => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
const paymentLabels = { cash: 'Espèces', mobile_money: 'Mobile Money', credit: 'Crédit' };
const dateLabel = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date inconnue' : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
};

export function InvoicesPage() {
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const pageSize = 10;

  const localSalesState = useQueryState(currentShop ? querySales(currentShop.id) : null);
  const { sales, loading: historyLoading, loadingMore, hasMore, error: historyError, loadMore } = useSaleHistory(currentShop?.id, localSalesState.records);
  const products = useQuery(queryProducts(currentShop?.id || '')) || [];
  const clients = useQuery(queryClients(currentShop?.id || '')) || [];

  const invoices = useMemo(() => {
    const productsById = new Map(products.map(product => [product.id, product]));
    const clientsById = new Map(clients.map(client => [client.id, client]));
    return sales.map(sale => {
      const client = clientsById.get(sale.clientId);
      return {
        id: `FAC-${String(sale.id).slice(-6).toUpperCase()}`,
        saleId: sale.id,
        date: sale.date,
        clientName: client?.name || sale.clientName || 'Client comptoir',
        clientPhone: client?.phone || sale.clientPhone || '',
        productName: productsById.get(sale.productId)?.name || sale.productName || 'Produit indisponible',
        quantity: Number(sale.quantity || 1),
        unitPrice: Number(sale.totalPrice || 0) / Number(sale.quantity || 1),
        totalAmount: Number(sale.totalPrice || 0),
        paymentMethod: sale.paymentMethod || 'cash',
      };
    });
  }, [sales, clients, products]);

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('fr');
    return invoices.filter(invoice =>
      (paymentFilter === 'ALL' || invoice.paymentMethod === paymentFilter) &&
      (!query || [invoice.id, invoice.clientName, invoice.productName].some(value => String(value).toLocaleLowerCase('fr').includes(query)))
    ).sort((a, b) => {
      if (sortBy === 'amount_desc') return b.totalAmount - a.totalAmount;
      if (sortBy === 'amount_asc') return a.totalAmount - b.totalAmount;
      return sortBy === 'date_asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
    });
  }, [invoices, searchQuery, paymentFilter, sortBy]);

  const monthlyInvoices = useMemo(() => {
    const now = new Date();
    return invoices.filter(invoice => {
      const date = new Date(invoice.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [invoices]);
  const monthlyTotal = monthlyInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const monthlyCredits = monthlyInvoices.filter(invoice => invoice.paymentMethod === 'credit').length;
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const currentInvoices = filteredInvoices.slice((safePage - 1) * pageSize, safePage * pageSize);
  const changeFilter = (setter, value) => { setter(value); setCurrentPage(1); };

  return <main className="invoices-page">
    <header className="invoices-heading"><div><h1>{t('invoices_page.title', 'Factures')}</h1><p>{t('invoices_page.subtitle', 'Historique des ventes')}</p></div></header>
    {hasMore && <small>Historique chargé progressivement. Les totaux affichés concernent les factures chargées.</small>}
    {historyError && <p role="alert" style={{ color: 'var(--danger)' }}>{historyError}</p>}

    <section className="invoices-summary" aria-label="Résumé des factures du mois">
      <div className="invoices-summary-card"><span className="invoices-summary-icon"><ReceiptText size={19} /></span><span>Factures ce mois</span><strong>{monthlyInvoices.length}</strong></div>
      <div className="invoices-summary-card"><span className="invoices-summary-icon"><Wallet size={19} /></span><span>Montant facturé ce mois</span><strong>{money(monthlyTotal)}</strong></div>
      <div className="invoices-summary-card"><span className="invoices-summary-icon"><CreditCard size={19} /></span><span>Ventes à crédit ce mois</span><strong>{monthlyCredits}</strong></div>
    </section>

    <section className="invoices-panel" aria-label="Liste des factures">
      <div className="invoices-toolbar">
        <label className="invoices-search"><Search size={18} /><input className="input-field" type="search" placeholder="N° de facture, client ou produit" value={searchQuery} onChange={event => changeFilter(setSearchQuery, event.target.value)} aria-label="Rechercher une facture" /></label>
        <select className="input-field" value={paymentFilter} onChange={event => changeFilter(setPaymentFilter, event.target.value)} aria-label="Filtrer par paiement">
          <option value="ALL">Tous les paiements</option><option value="cash">Espèces</option><option value="mobile_money">Mobile Money</option><option value="credit">Crédit</option>
        </select>
        <select className="input-field" value={sortBy} onChange={event => changeFilter(setSortBy, event.target.value)} aria-label="Trier les factures">
          <option value="date_desc">Plus récentes</option><option value="date_asc">Plus anciennes</option><option value="amount_desc">Montant décroissant</option><option value="amount_asc">Montant croissant</option>
        </select>
      </div>

      {currentInvoices.length === 0 ? <div className="invoices-empty"><FileText size={26} /><strong>{localSalesState.loading || historyLoading ? 'Chargement des factures…' : hasMore ? 'Aucune facture dans les pages chargées' : t('invoices_page.no_invoices', 'Aucune facture')}</strong><span>{localSalesState.loading || historyLoading ? 'Recherche des ventes de cette boutique.' : hasMore ? 'Chargez la suite de l’historique.' : 'Essayez une autre recherche ou un autre filtre.'}</span></div> : <>
        <div className="invoices-table-wrap"><table className="invoices-table"><thead><tr><th>Facture</th><th>Client</th><th>Produit</th><th>Date</th><th>Paiement</th><th>Montant</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{currentInvoices.map(invoice => <tr key={invoice.saleId}>
          <td><strong>{invoice.id}</strong></td><td>{invoice.clientName}</td><td><span className="invoices-product-name">{invoice.productName}</span></td><td>{dateLabel(invoice.date)}</td><td><span className={`invoices-payment ${invoice.paymentMethod}`}>{paymentLabels[invoice.paymentMethod] || invoice.paymentMethod}</span></td><td className="invoices-amount">{money(invoice.totalAmount)}</td><td><button type="button" className="invoices-open" onClick={() => setSelectedInvoice(invoice)} aria-label={`Voir la facture ${invoice.id}`}><Eye size={16} /></button></td>
        </tr>)}</tbody></table></div>
        <div className="invoices-mobile-list">{currentInvoices.map(invoice => <button type="button" className="invoices-mobile-card" key={invoice.saleId} onClick={() => setSelectedInvoice(invoice)} aria-label={`Voir la facture ${invoice.id}`}>
          <span className="invoices-mobile-top"><span className="invoices-mobile-icon"><FileText size={18} /></span><strong>{invoice.id}</strong><span className={`invoices-payment ${invoice.paymentMethod}`}>{paymentLabels[invoice.paymentMethod] || invoice.paymentMethod}</span></span>
          <span className="invoices-mobile-client">{invoice.clientName}</span><span className="invoices-mobile-product">{invoice.productName}</span>
          <span className="invoices-mobile-bottom"><small>{dateLabel(invoice.date)}</small><strong>{money(invoice.totalAmount)}</strong></span>
        </button>)}</div>
      </>}
    </section>
    <Pagination page={safePage} totalPages={totalPages} totalItems={filteredInvoices.length} itemLabel="facture" onPageChange={setCurrentPage} />
    {hasMore && <button type="button" className="btn btn-secondary" disabled={loadingMore} onClick={loadMore}>{loadingMore ? 'Chargement…' : 'Charger les factures plus anciennes'}</button>}
    {selectedInvoice && <InvoicePreview invoice={selectedInvoice} shop={currentShop} onClose={() => setSelectedInvoice(null)} />}
  </main>;
}
