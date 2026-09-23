import { useManagerDashboard } from './dashboard/useManagerDashboard';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardSummary } from './dashboard/DashboardSummary';
import { RevenueChart } from './dashboard/RevenueChart';
import { RecentSales } from './dashboard/RecentSales';
import { LocalBackupPanel } from './dashboard/LocalBackupPanel';
import { StockAlertsModal } from './dashboard/StockAlertsModal';

import './recent-sales.css';

export function ManagerDashboardPage({ setActiveTab }) {
  const {
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
  } = useManagerDashboard({ setActiveTab });

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'inherit' }}>
      
      {/* Section 1 - Header & Notification button */}
      <DashboardHeader
        t={t}
        userName={userName}
        formatDateFrench={formatDateFrench}
        setShowAlertsModal={setShowAlertsModal}
        lowStockProducts={lowStockProducts}
        setActiveTab={setActiveTab}
      />

      {/* Section 2 - KPI Cards */}
      <DashboardSummary
        formatCurrency={formatCurrency}
        todayRevenue={todayRevenue}
        t={t}
        todayCount={todayCount}
        activeProducts={activeProducts}
        pendingProducts={pendingProducts}
      />

      {/* Section 3 - Stats Chart */}
      <RevenueChart weekTotalRevenue={weekTotalRevenue} chartData={chartData} chartOptions={chartOptions} />

      {/* Section 4 - Recent Sales Table */}
      <RecentSales
        t={t}
        todaySales={todaySales}
        setActiveTab={setActiveTab}
        formatTime={formatTime}
        getProductName={getProductName}
        getClientName={getClientName}
        formatCurrency={formatCurrency}
        getPaymentBadge={getPaymentBadge}
      />

      {/* Section 5 - Local Encrypted Backup & Restore */}
      <LocalBackupPanel />

      {/* Stock Alerts Modal */}
      {showAlertsModal && (
        <StockAlertsModal setShowAlertsModal={setShowAlertsModal} lowStockProducts={lowStockProducts} handleDismissAlert={handleDismissAlert} />
      )}

    </div>
  );
}
