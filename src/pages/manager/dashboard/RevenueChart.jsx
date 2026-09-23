import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


import { TrendingUp } from 'lucide-react';

import { Bar } from 'react-chartjs-2';
import { BRAND } from './constants';

export function RevenueChart({ weekTotalRevenue, chartData, chartOptions }) {
  return (
<div style={{ 
        backgroundColor: 'var(--bg-surface)', 
        border: '1px solid var(--border-color)', 
        padding: '24px', 
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} />
              Statistiques de ventes
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Chiffre d'affaires sur les 7 derniers jours</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Moyenne/Jour</span>
              <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                {Math.round(weekTotalRevenue / 7).toLocaleString('fr-FR')} F
              </span>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total 7j</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: BRAND }}>
                {weekTotalRevenue.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>
        </div>

        <div style={{ height: '240px', width: '100%' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
  );
}
