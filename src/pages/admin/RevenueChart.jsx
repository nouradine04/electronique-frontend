import React, { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export function RevenueChart({ sales, payments, returns }) {
  const [days, setDays] = useState(7);
  const now = new Date();
  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + index + 1);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const inDay = item => new Date(item.date) >= date && new Date(item.date) < end;
    const amount = sales.filter(inDay).filter(s => String(s.paymentMethod ?? s.payment_method).toLowerCase() !== 'credit').reduce((sum, s) => sum + Number(s.totalPrice ?? s.total_price ?? 0), 0)
      + payments.filter(inDay).reduce((sum, p) => sum + Number(p.amount || 0), 0)
      - returns.filter(inDay).reduce((sum, r) => sum + Number(r.refundAmount ?? r.refund_amount ?? 0), 0);
    return { label: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), amount };
  });
  return <section className="owner-panel">
    <div className="owner-section-heading owner-chart-heading"><h3>Argent reçu</h3><label className="owner-period">Période<select value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>7 derniers jours</option><option value={30}>30 derniers jours</option></select></label></div>
    <p className="owner-chart-caption">Paiements reçus, remboursements déduits · FCFA</p>
    <div className="owner-chart"><Bar data={{ labels: points.map(p => p.label), datasets: [{ label: 'Argent reçu (FCFA)', data: points.map(p => p.amount), backgroundColor: '#0e6ba8', borderRadius: 4, maxBarThickness: 38 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { tooltip: { callbacks: { label: context => `${Number(context.raw).toLocaleString('fr-FR')} FCFA` } } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0, color: '#64748b' } }, y: { beginAtZero: true, ticks: { maxTicksLimit: 5, color: '#64748b', callback: number => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(number) } } } }} role="img" aria-label={`Argent reçu au cours des ${days} derniers jours`} /></div>
    <details className="owner-chart-values"><summary>Voir les montants par jour</summary>{points.map(point => <div key={point.label}><span>{point.label}</span><strong>{point.amount.toLocaleString('fr-FR')} FCFA</strong></div>)}</details>
  </section>;
}
