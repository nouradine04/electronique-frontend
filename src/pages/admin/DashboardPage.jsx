import React, { useState } from 'react';
import { Banknote, ShoppingBag, CreditCard, Plus, ArrowRight, Package, Check, Bell, TrendingUp } from 'lucide-react';
import { RevenueChart } from './RevenueChart.jsx';
import { useQuery } from '../../db/useQuery.js';
import { queryPayments, queryReturns } from '../../db/queries.js';
import './dashboard.css';

const money = value => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
const value = (record, camel, snake) => record[camel] ?? record[snake];

export function OwnerDashboardView({ shop, products = [], sales = [], onNavigate }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const payments = useQuery(shop ? queryPayments(shop.id) : null, [shop?.id]) || [];
  const returns = useQuery(shop ? queryReturns(shop.id) : null, [shop?.id]) || [];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const today = record => new Date(record.date).getTime() >= start && new Date(record.date).getTime() < end;
  const isCredit = sale => String(value(sale, 'paymentMethod', 'payment_method')).toLowerCase() === 'credit';
  const daySales = sales.filter(today);
  const received = daySales.filter(sale => !isCredit(sale)).reduce((sum, sale) => sum + Number(value(sale, 'totalPrice', 'total_price') || 0), 0)
    + payments.filter(today).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    - returns.filter(today).reduce((sum, item) => sum + Number(value(item, 'refundAmount', 'refund_amount') || 0), 0);
  const debts = new Map();
  sales.filter(isCredit).forEach(sale => {
    const client = value(sale, 'clientId', 'client_id');
    debts.set(client, (debts.get(client) || 0) + Number(value(sale, 'totalPrice', 'total_price') || 0) - Number(value(sale, 'refundedAmount', 'refunded_amount') || 0));
  });
  payments.forEach(payment => {
    const client = value(payment, 'clientId', 'client_id');
    if (debts.has(client)) debts.set(client, debts.get(client) - Number(payment.amount || 0));
  });
  const debt = [...debts.values()].reduce((sum, amount) => sum + Math.max(0, amount), 0);
  const pending = products.filter(p => String(p.status).toUpperCase() === 'PENDING_PRICE').length;
  const active = products.filter(p => String(p.status).toUpperCase() === 'ACTIVE');
  const empty = active.filter(p => p.quantity <= 0).length;
  const low = active.filter(p => p.quantity > 0 && p.quantity <= Number(value(p, 'minStock', 'min_stock') ?? 5)).length;
  const recent = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const tasks = [pending && `${pending} produit(s) à valider`, empty && `${empty} produit(s) épuisé(s)`, low && `${low} produit(s) bientôt épuisé(s)`].filter(Boolean);
  return <div className="owner-home">
    <header className="owner-heading"><div><h2>{shop?.name || 'Ma boutique'}</h2><p>Aujourd’hui · {now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p></div><button className="owner-notification" aria-label={`Notifications : ${pending + empty + low} produits à traiter`} aria-expanded={notificationsOpen} aria-controls="owner-notifications" onClick={() => setNotificationsOpen(open => !open)}><Bell size={23} /><span>Notifications</span>{pending + empty + low > 0 && <b>{pending + empty + low}</b>}</button></header>
    {notificationsOpen && <section id="owner-notifications" className="owner-panel"><h3>Notifications de la boutique</h3>{tasks.map(task => <button key={task} className="owner-row" onClick={() => onNavigate('inventory')}><Package size={22} /><span>{task}</span><ArrowRight size={18} /></button>)}{!tasks.length && <p className="owner-empty"><Check size={20} /> Aucune alerte pour le moment.</p>}</section>}
    <section className="owner-metrics" aria-label="Les chiffres essentiels">
      <div className="owner-metric owner-money"><Banknote size={24} /><p>Argent reçu aujourd’hui</p><strong>{money(received)}</strong><small>Paiements reçus, remboursements déduits</small></div>
      <button className="owner-metric" onClick={() => onNavigate('crm')}><CreditCard size={24} /><p>Crédits à récupérer</p><strong>{money(debt)}</strong><small>Voir les clients →</small></button>
    </section>
    <p className="owner-daily-count"><ShoppingBag size={17} aria-hidden="true" /><span><strong>{daySales.length}</strong> vente{daySales.length > 1 ? 's' : ''} aujourd’hui</span></p>
    <nav className="owner-actions" aria-label="Actions rapides">
      <button className="primary" onClick={() => onNavigate('pos')}><ShoppingBag size={22} /> Vendre</button>
      <button onClick={() => onNavigate('add')}><Plus size={22} /> Ajouter un produit</button>
      <button onClick={() => onNavigate('transactions')}><ArrowRight size={22} /> Voir les ventes</button>
    </nav>
    <RevenueChart sales={sales} payments={payments} returns={returns} />
    <button className="owner-profit owner-panel" onClick={() => onNavigate('profit')}><TrendingUp size={26} /><span><strong>Rentabilité de ma boutique</strong><small>Voir les bénéfices, les coûts d’achat et les dépenses</small></span><ArrowRight size={20} /></button>
    <section className="owner-panel owner-recent"><div className="owner-section-heading"><h3>Dernières ventes</h3><button onClick={() => onNavigate('transactions')}>Voir tout <ArrowRight size={16} /></button></div>
      {!recent.length && <p className="owner-empty">Aucune vente pour le moment. Utilisez « Vendre » pour commencer.</p>}
      {recent.map(sale => <div className="owner-sale" key={sale.id}><div><strong>{products.find(p => p.id === value(sale, 'productId', 'product_id'))?.name || 'Produit indisponible'}</strong><p>Vendu par <strong>{value(sale, 'sellerName', 'seller_name') || 'Vendeur non renseigné'}</strong></p><small>{new Date(sale.date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></div><div className="owner-sale-amount"><strong>{money(Number(value(sale, 'totalPrice', 'total_price') || 0) - Number(value(sale, 'refundedAmount', 'refunded_amount') || 0))}</strong><small className={`owner-payment ${isCredit(sale) ? 'credit' : ''}`}>{isCredit(sale) ? 'Crédit' : String(value(sale, 'paymentMethod', 'payment_method')).toLowerCase() === 'cash' ? 'Espèces' : 'Mobile Money'}</small></div></div>)}
    </section>
  </div>;
}
