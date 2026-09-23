import { BRAND } from './constants';

import React, { useState, useMemo } from 'react';
import { useQuery } from '../../../db/useQuery.js';
import { queryProducts, querySales, queryClients } from '../../../db/queries.js';
import { useShop } from '../../../context/ShopContext.jsx';
import { CreditCard, Smartphone, Banknote } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function useManagerDashboard({ setActiveTab }) {
  const { currentShop, userName } = useShop();
  const { t } = useTranslation();
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [dismissedProductIds, setDismissedProductIds] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_stock_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const products = useQuery(queryProducts(currentShop?.id || '')) || [];
  const sales = useQuery(querySales(currentShop?.id || '')) || [];
  const clients = useQuery(queryClients(currentShop?.id || '')) || [];

  const todayStr = new Date().toISOString().split('T')[0];

  const todaySales = useMemo(() => {
    return sales
      .filter(s => s.date && s.date.startsWith(todayStr))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sales, todayStr]);

  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const todayCount = todaySales.length;

  const activeProducts = products.filter(p => p.status !== 'PENDING_PRICE' && p.quantity > 0);
  const pendingProducts = products.filter(p => p.status === 'PENDING_PRICE');

  // Filter alerts: only validated by admin (status !== 'PENDING_PRICE') AND under min_stock threshold
  const lowStockProducts = useMemo(() => {
    const activeAlerts = products.filter(p => p.status !== 'PENDING_PRICE' && p.quantity < (p.min_stock || 5));
    return activeAlerts.filter(p => !dismissedProductIds.includes(p.id));
  }, [products, dismissedProductIds]);

  // Automatically clean up dismissedProductIds when products are restocked
  React.useEffect(() => {
    const activeAlerts = products.filter(p => p.status !== 'PENDING_PRICE' && p.quantity < (p.min_stock || 5));
    const activeAlertsIds = activeAlerts.map(p => p.id);
    const cleaned = dismissedProductIds.filter(id => activeAlertsIds.includes(id));
    if (cleaned.length !== dismissedProductIds.length) {
      setDismissedProductIds(cleaned);
      localStorage.setItem('dismissed_stock_alerts', JSON.stringify(cleaned));
    }
  }, [products, dismissedProductIds]);

  const handleDismissAlert = (productId, e) => {
    e.stopPropagation();
    const updated = [...dismissedProductIds, productId];
    setDismissedProductIds(updated);
    localStorage.setItem('dismissed_stock_alerts', JSON.stringify(updated));
  };

  // En mode local, conserver tout l’historique sur cet appareil.

  // 7-day sales chart data
  const { chartData, weekTotalRevenue } = useMemo(() => {
    const labels = [];
    const revenueData = [];

    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = i === 0 ? "Aujourd'hui" : `${d.getDate()} ${months[d.getMonth()]}`;
      labels.push(dayLabel);

      const daySales = sales.filter(s => s.date && s.date.startsWith(dateStr));
      const dayRevenue = daySales.reduce((sum, s) => sum + (s.total_price || 0), 0);
      revenueData.push(dayRevenue);
    }

    const total = revenueData.reduce((a, b) => a + b, 0);

    return {
      weekTotalRevenue: total,
      chartData: {
        labels,
        datasets: [
          {
            label: 'Chiffre d\'affaires (FCFA)',
            data: revenueData,
            backgroundColor: BRAND,
            hoverBackgroundColor: '#095382',
            borderRadius: 0,
            barThickness: 24
          }
        ]
      }
    };
  }, [sales]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleFont: { size: 12, weight: 'normal' },
        bodyFont: { size: 13, weight: 'bold' },
        padding: 10,
        cornerRadius: 0,
        displayColors: false,
        callbacks: {
          label: (context) => `Ventes : ${context.parsed.y.toLocaleString('fr-FR')} FCFA`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-secondary)', font: { size: 12 } }
      },
      y: {
        grid: { color: 'var(--border-color)' },
        border: { display: false },
        ticks: {
          color: 'var(--text-secondary)',
          font: { size: 12 },
          maxTicksLimit: 5,
          callback: (value) => value >= 1000 ? `${(value / 1000).toLocaleString('fr-FR')}k F` : `${value} F`
        }
      }
    }
  };

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('fr-FR') + ' FCFA';
  };

  const getProductName = (productId) => {
    const p = products.find(x => x.id === productId);
    return p ? p.name : 'Produit inconnu';
  };

  const getClientName = (clientId) => {
    if (!clientId) return 'Client de passage';
    const c = clients.find(x => x.id === clientId);
    return c ? `${c.name} ${c.phone ? `(${c.phone})` : ''}` : 'Client inconnu';
  };

  const formatDateFrench = () => {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d);
  };

  const getPaymentBadge = (method) => {
    switch (method) {
      case 'cash':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
            <Banknote size={14} strokeWidth={2} /> Espèces
          </span>
        );
      case 'mobile_money':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--info)' }}>
            <Smartphone size={14} strokeWidth={2} /> Mobile Money
          </span>
        );
      case 'credit':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#ea580c' }}>
            <CreditCard size={14} strokeWidth={2} /> À Crédit
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Autre
          </span>
        );
    }
  };

  
  return {
    t,
    userName,
    formatDateFrench,
    setShowAlertsModal,
    lowStockProducts,
    formatCurrency,
    todayRevenue,
    todayCount,
    activeProducts,
    pendingProducts,
    weekTotalRevenue,
    chartData,
    chartOptions,
    todaySales,
    formatTime,
    getProductName,
    getClientName,
    getPaymentBadge,
    showAlertsModal,
    handleDismissAlert,
  };
}
