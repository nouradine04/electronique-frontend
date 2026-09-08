import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '../../db/useQuery.js';
import { createExpense, queryCategories, queryExpenses, queryProducts, queryReturns, querySales } from '../../db/queries.js';
import { useShop } from '../../context/ShopContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ExpenseModal, EXPENSE_CATEGORY_LABELS } from '../../components/finance/ExpenseModal.jsx';
import { FaChevronRight, FaSearch, FaTimes } from 'react-icons/fa';
import { Plus, RotateCcw } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

import './profit.css';

const BRAND = '#0e6ba8';
const money = value => `${Math.round(Number(value) || 0).toLocaleString('fr-FR')} F`;

const isInPeriod = (dateValue, period, now = new Date()) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  if (period === 'month') return date >= new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === 'year') return date >= new Date(now.getFullYear(), 0, 1);
  return true;
};

const saleProductId = sale => sale.productId || sale.product_id;
const saleTotal = sale => Number(sale.totalPrice || sale.total_price || 0);

export function ProfitPage() {
  const { t } = useTranslation();
  const { currentShop, userName } = useShop();
  const { showToast } = useToast();
  const [timeFilter, setTimeFilter] = useState('month');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const products = useQuery(currentShop ? queryProducts(currentShop.id) : null, [currentShop?.id]) || [];
  const sales = useQuery(currentShop ? querySales(currentShop.id) : null, [currentShop?.id]) || [];
  const categories = useQuery(currentShop ? queryCategories(currentShop.id) : null, [currentShop?.id]) || [];
  const returns = useQuery(currentShop ? queryReturns(currentShop.id) : null, [currentShop?.id]) || [];
  const expenses = useQuery(currentShop ? queryExpenses(currentShop.id) : null, [currentShop?.id]) || [];

  const salesById = useMemo(() => new Map(sales.map(sale => [sale.id, sale])), [sales]);
  const productsById = useMemo(() => new Map(products.map(product => [product.id, product])), [products]);
  const costForSale = sale => Number(sale?.unitCost || sale?.unit_cost || productsById.get(saleProductId(sale))?.unitCost || 0);

  const filteredSales = sales.filter(item => isInPeriod(item.date, timeFilter));
  const filteredReturns = returns.filter(item => isInPeriod(item.date, timeFilter));
  const filteredExpenses = expenses.filter(item => isInPeriod(item.date, timeFilter));

  const grossRevenue = filteredSales.reduce((sum, sale) => sum + saleTotal(sale), 0);
  const refunds = filteredReturns.reduce((sum, item) => sum + Number(item.refundAmount || 0), 0);
  const periodRevenue = grossRevenue - refunds;
  const soldCost = filteredSales.reduce((sum, sale) => sum + costForSale(sale) * Number(sale.quantity || 0), 0);
  const recoveredCost = filteredReturns
    .filter(item => item.restock)
    .reduce((sum, item) => sum + costForSale(salesById.get(item.saleId)) * Number(item.quantity || 0), 0);
  const operatingExpenses = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const periodProfit = periodRevenue - (soldCost - recoveredCost) - operatingExpenses;
  const totalInvestment = products.reduce((sum, product) => sum + Number(product.unitCost || 0) * Number(product.quantity || 0), 0);

  const returnsByProduct = useMemo(() => {
    const result = new Map();
    returns.forEach(item => {
      const current = result.get(item.productId) || { quantity: 0, refund: 0 };
      current.quantity += Number(item.quantity || 0);
      current.refund += Number(item.refundAmount || 0);
      result.set(item.productId, current);
    });
    return result;
  }, [returns]);

  const productProfitability = useMemo(() => products
    .filter(product => Number(product.price || 0) > 0)
    .map(product => {
      const cost = Number(product.unitCost || 0);
      const price = Number(product.price || 0);
      const marginValue = price - cost;
      const marginPercent = cost > 0 ? (marginValue / cost) * 100 : 0;
      const productSales = sales.filter(sale => saleProductId(sale) === product.id);
      const returnInfo = returnsByProduct.get(product.id) || { quantity: 0, refund: 0 };
      const totalSold = Math.max(0, productSales.reduce((sum, sale) => sum + Number(sale.quantity || 0), 0) - returnInfo.quantity);
      const totalRevenue = productSales.reduce((sum, sale) => sum + saleTotal(sale), 0) - returnInfo.refund;
      const category = categories.find(item => item.id === (product.categoryId || product.category_id));
      return { product, cost, price, marginValue, marginPercent, totalSold, totalRevenue, returned: returnInfo.quantity, categoryName: category?.name || '' };
    })
    .filter(item => {
      const query = search.trim().toLowerCase();
      return !query || item.product.name.toLowerCase().includes(query) || item.categoryName.toLowerCase().includes(query);
    })
    .sort((a, b) => b.marginPercent - a.marginPercent), [products, sales, returnsByProduct, categories, search]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const labels = [];
    const revenue = [];
    const profit = [];

    for (let offset = 11; offset >= 0; offset -= 1) {
      const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const start = new Date(month.getFullYear(), month.getMonth(), 1);
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      const monthSales = sales.filter(item => new Date(item.date) >= start && new Date(item.date) < end);
      const monthReturns = returns.filter(item => new Date(item.date) >= start && new Date(item.date) < end);
      const monthExpenses = expenses.filter(item => new Date(item.date) >= start && new Date(item.date) < end);
      const monthRevenue = monthSales.reduce((sum, sale) => sum + saleTotal(sale), 0) - monthReturns.reduce((sum, item) => sum + Number(item.refundAmount || 0), 0);
      const monthSoldCost = monthSales.reduce((sum, sale) => sum + costForSale(sale) * Number(sale.quantity || 0), 0);
      const monthRecoveredCost = monthReturns.filter(item => item.restock).reduce((sum, item) => sum + costForSale(salesById.get(item.saleId)) * Number(item.quantity || 0), 0);
      const monthExpensesTotal = monthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

      labels.push(monthNames[month.getMonth()]);
      revenue.push(monthRevenue);
      profit.push(monthRevenue - (monthSoldCost - monthRecoveredCost) - monthExpensesTotal);
    }
    return { labels, datasets: [
      { label: 'CA net', data: revenue, backgroundColor: BRAND, borderRadius: 4 },
      { label: 'Bénéfice net', data: profit, backgroundColor: '#16a34a', borderRadius: 4 },
    ] };
  }, [sales, returns, expenses, productsById, salesById]);

  const productHistory = useMemo(() => {
    if (!selectedProduct) return [];
    return sales
      .filter(sale => saleProductId(sale) === selectedProduct.product.id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .map(sale => ({
        id: sale.id,
        date: new Date(sale.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
        quantity: sale.quantity,
        total: saleTotal(sale),
        method: sale.paymentMethod || sale.payment_method,
        returned: returns.filter(item => item.saleId === sale.id).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      }));
  }, [selectedProduct, sales, returns]);

  const addExpense = async values => {
    try {
      await createExpense({ ...values, shop_id: currentShop.id, created_by: userName });
      setShowExpenseModal(false);
      showToast('Dépense enregistrée dans la comptabilité.', 'success');
    } catch (error) {
      showToast(error.message || 'Impossible d’enregistrer la dépense.', 'danger');
    }
  };

  if (!currentShop) return <div style={{ padding: '24px' }}>Veuillez sélectionner une boutique.</div>;

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { boxWidth: 12, color: '#64748b' } } },
    scales: { x: { grid: { display: false }, ticks: { color: '#64748b', maxTicksLimit: 6, maxRotation: 0 } }, y: { grid: { color: 'rgba(148,163,184,.15)' }, ticks: { color: '#64748b', maxTicksLimit: 5, callback: value => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(value) } } },
  };

  return (
    <div className="profit-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{t('profit_page.title')}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '14px' }}>Ventes, retours, coût du stock et charges de {currentShop.name}</p>
        </div>
        <button onClick={() => setShowExpenseModal(true)} style={{ minHeight: '44px', padding: '0 16px', border: 0, borderRadius: '10px', background: BRAND, color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> Ajouter une dépense</button>
      </div>

      <label className="profit-period">Période<select value={timeFilter} onChange={event => setTimeFilter(event.target.value)}><option value="month">Ce mois</option><option value="year">Cette année</option><option value="all">Depuis le début</option></select></label>
      <section className="profit-summary" aria-label="Résultat de la période">
        <div className="profit-result"><small>{periodProfit < 0 ? 'Perte sur la période' : 'Bénéfice sur la période'}</small><strong>{money(periodProfit)}</strong><p>Après coûts d’achat, remboursements et dépenses.</p></div>
        <dl className="profit-breakdown"><div><dt>Ventes après remboursements</dt><dd>{money(periodRevenue)}</dd></div><div><dt>Coût des produits vendus</dt><dd>{money(soldCost - recoveredCost)}</dd></div><div><dt>Dépenses de la boutique</dt><dd>{money(operatingExpenses)}</dd></div></dl>
        <p className="profit-explanation">Les ventes à crédit sont incluses : ce résultat n’est pas l’argent disponible en caisse.</p>
      </section>
      <p className="profit-stock-note">Valeur du stock actuel au coût d’achat : <strong>{money(totalInvestment)}</strong></p>
      <details className="profit-details">
        <summary>Voir l’évolution sur 12 mois</summary>
        <div className="profit-chart"><Bar data={monthlyData} options={chartOptions} /></div>
      </details>

      <section style={{ padding: '18px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px' }}>Dépenses récentes</h3>
            <p style={{ margin: '3px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>Loyers, salaires et autres frais de fonctionnement</p>
          </div>
          <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '14px' }}>{money(operatingExpenses)}</span>
        </div>
        {filteredExpenses.length ? [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6).map(expense => (
          <div key={expense.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '11px 0', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expense.description}</div>
              <div style={{ marginTop: '3px', color: 'var(--text-secondary)', fontSize: '11px' }}>{EXPENSE_CATEGORY_LABELS[expense.category] || expense.category} · {new Date(expense.date).toLocaleDateString('fr-FR')}{expense.employeeName ? ` · ${expense.employeeName}` : ''}{expense.recurrence === 'MONTHLY' ? ' · mensuelle' : ''}</div>
            </div>
            <strong style={{ color: '#dc2626', whiteSpace: 'nowrap', fontSize: '13px' }}>− {money(expense.amount)}</strong>
          </div>
        )) : <div style={{ padding: '20px 0 4px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>Aucune dépense sur cette période.</div>}
      </section>

      <details className="profit-details"><summary>Consulter les marges par produit</summary><p className="profit-detail-note">Prix actuels et historique depuis le début. La marge par unité ne déduit pas les dépenses de la boutique.</p>
      <div style={{ position: 'relative' }}>
        <FaSearch size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input type="search" placeholder="Rechercher un produit…" value={search} onChange={event => setSearch(event.target.value)} style={{ width: '100%', minHeight: '44px', padding: '10px 12px 10px 40px', borderRadius: '10px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-surface)', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      <section style={{ display: 'grid', gap: '10px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Marge par produit</h3>
        {productProfitability.map(item => (
          <button key={item.product.id} onClick={() => setSelectedProduct(item)} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Achat {money(item.cost)} · Vente {money(item.price)}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: '7px' }}>
                <span style={{ background: item.marginValue >= 0 ? '#dcfce7' : '#fee2e2', color: item.marginValue >= 0 ? '#166534' : '#991b1b', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>{item.marginValue >= 0 ? '+' : ''}{money(item.marginValue)} / unité</span>
                <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>{item.totalSold} vendu{item.totalSold > 1 ? 's' : ''}</span>
                {item.returned > 0 && <span style={{ background: '#fff7ed', color: '#c2410c', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>{item.returned} retour{item.returned > 1 ? 's' : ''}</span>}
              </div>
            </div>
            <FaChevronRight size={14} color="var(--text-muted)" />
          </button>
        ))}
        {!productProfitability.length && <div style={{ padding: '38px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>Aucun produit avec un prix de vente.</div>}
      </section>

      </details>

      {selectedProduct && (
        <div onMouseDown={event => event.target === event.currentTarget && setSelectedProduct(null)} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,.56)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div role="dialog" aria-modal="true" style={{ width: '100%', maxWidth: '520px', maxHeight: '88vh', overflowY: 'auto', background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', boxShadow: '0 -12px 50px rgba(0,0,0,.25)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <div><h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px' }}>{selectedProduct.product.name}</h3><p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>{selectedProduct.categoryName}</p></div>
              <button onClick={() => setSelectedProduct(null)} aria-label="Fermer" style={{ width: '34px', height: '34px', border: 0, borderRadius: '50%', background: 'var(--bg-main)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><FaTimes color="var(--text-secondary)" /></button>
            </div>
            <div style={{ padding: '15px 20px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
              {[['Marge unitaire', money(selectedProduct.marginValue), '#16a34a'], ['Revenu net', money(selectedProduct.totalRevenue), BRAND], ['Stock actuel', selectedProduct.product.quantity, '#d97706'], ['Retours', selectedProduct.returned, '#c2410c']].map(([label, value, color]) => (
                <div key={label} style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '10px', textAlign: 'center' }}><div style={{ color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div><div style={{ color, fontSize: '16px', fontWeight: 800, marginTop: '3px' }}>{value}</div></div>
              ))}
            </div>
            <div style={{ padding: '4px 20px 20px' }}>
              <h4 style={{ color: 'var(--text-primary)', margin: '8px 0', fontSize: '14px' }}>Historique des ventes</h4>
              {productHistory.length ? productHistory.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '11px 0', borderTop: '1px solid var(--border-color)' }}>
                  <div><div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '12px' }}>{item.date}</div><div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '3px' }}>{item.quantity} unité{item.quantity > 1 ? 's' : ''} · {item.method === 'cash' ? 'Espèces' : item.method === 'mobile_money' ? 'Mobile Money' : 'Crédit'}</div></div>
                  <div style={{ textAlign: 'right' }}><strong style={{ color: BRAND, fontSize: '13px' }}>{money(item.total)}</strong>{item.returned > 0 && <div style={{ color: '#c2410c', fontSize: '10px', marginTop: '3px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}><RotateCcw size={10} /> {item.returned} retourné{item.returned > 1 ? 's' : ''}</div>}</div>
                </div>
              )) : <div style={{ padding: '22px', textAlign: 'center', color: 'var(--text-muted)' }}>Aucune vente.</div>}
            </div>
          </div>
        </div>
      )}

      {showExpenseModal && <ExpenseModal onClose={() => setShowExpenseModal(false)} onSubmit={addExpense} />}

      <style>{`@media (max-width: 520px) { .profit-kpis { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
