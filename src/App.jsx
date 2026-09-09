import React, { useState } from 'react';
import { isInstalledApp } from './services/appMode';
import { useQueryState } from './db/useQuery.js';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { queryProducts, querySales, queryCategories, queryStockMovements } from './db/queries.js';
import { ShopProvider, useShop } from './context/ShopContext.jsx';
import { SyncProvider } from './context/SyncContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import './i18n.js';
import { LoginPage } from './pages/common/LoginPage.jsx';
import { LandingPage } from './pages/common/LandingPage.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Header } from './components/layout/Header.jsx';
import { BottomNav } from './components/layout/BottomNav.jsx';
import { ManagerStockPage } from './pages/manager/StockPage.jsx';
import { AdminStockPage } from './pages/admin/StockPage.jsx';
import { OwnerDashboardView } from './pages/admin/DashboardPage.jsx';
import { InvoicesPage } from './pages/common/InvoicesPage.jsx';
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage.jsx';
import { ManagerClientsPage } from './pages/manager/ManagerClientsPage.jsx';
import { PosPage } from './pages/manager/PosPage.jsx';
import { CreditsPage } from './pages/common/CreditsPage.jsx';
import { CatalogManagementPage } from './pages/manager/CatalogPage.jsx';
import { SettingsPage } from './pages/common/SettingsPage.jsx';
import { ProfitPage } from './pages/admin/ProfitPage.jsx';
import { TransactionsPage } from './pages/admin/TransactionsPage.jsx';
import { CrmPage } from './pages/admin/CrmPage.jsx';
import { TeamPage } from './pages/admin/TeamPage.jsx';
import { ensurePersistentStorage } from './services/persistentStorage.js';

function MainAppContent() {
  const { currentShop, userRole, isInitialized, logout } = useShop();
  const { records: products, loading: productsLoading } = useQueryState(queryProducts(currentShop?.id || ''));
  const { records: sales, loading: salesLoading } = useQueryState(querySales(currentShop?.id || ''));
  const { records: categories, loading: categoriesLoading } = useQueryState(queryCategories(currentShop?.id || ''));
  const { records: movements, loading: movementsLoading } = useQueryState(queryStockMovements(currentShop?.id || ''));
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('userRole'));
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'dashboard'
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => isInstalledApp() ? 'login' : 'landing');

  // Initialize active tab based on role on mount
  React.useEffect(() => {
    if (isAuthenticated) {
      setActiveTab(userRole === 'manager' ? 'dashboard' : 'dashboard');
    }
  }, [isAuthenticated, userRole]);

  // Protège autant que possible la base WatermelonDB contre l'éviction
  // automatique du navigateur. L'opération reste silencieuse pour l'utilisateur.
  React.useEffect(() => {
    if (!isAuthenticated) return;
    ensurePersistentStorage().then(result => {
      if (!result.persisted) {
        console.warn('[Stockage local] Persistance non garantie par ce navigateur.');
      }
    });
  }, [isAuthenticated]);

  const handleLoginSuccess = (role) => {
    setIsAuthenticated(true);
    setActiveTab(role === 'manager' ? 'dashboard' : 'dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('login');
    setIsAuthenticated(false);
  };

  if (!isInitialized || (isAuthenticated && (productsLoading || salesLoading || categoriesLoading || movementsLoading))) {
    return (
      <LoadingScreen />
    );
  }

  // Render Landing or Login Page if not signed in
  if (!isAuthenticated) {
    if (currentPage === 'login') {
      return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={(page) => setCurrentPage(isInstalledApp() && page === 'landing' ? 'login' : page)} />;
    }
    return (
      <LandingPage 
        onLoginSuccess={handleLoginSuccess} 
        onNavigate={setCurrentPage} 
        initialView={currentPage === 'register' ? 'register' : 'landing'} 
        appOnly={isInstalledApp()}
      />
    );
  }

  // Check Subscription Status
  if (currentShop && currentShop.subscription_status === 'expired') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fef2f2', color: '#991b1b', padding: '24px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>Abonnement Expiré</h1>
        <p style={{ fontSize: '1.1rem', maxWidth: '500px', marginBottom: '32px' }}>
          L'accès à votre espace boutique <strong>{currentShop.name}</strong> a été suspendu car votre abonnement est arrivé à expiration.
        </p>
        <p style={{ fontSize: '0.9rem', color: '#7f1d1d' }}>
          Veuillez contacter le support ou renouveler votre abonnement pour restaurer l'accès immédiat à vos données et à vos outils de gestion.
        </p>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ marginTop: '32px', backgroundColor: '#fff', border: '1px solid #fca5a5' }}>
          Se déconnecter
        </button>
      </div>
    );
  }

  // Render App with Left Sidebar & Top Header layout matching ERP reference image
  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100dvh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', position: 'relative' }}>
      
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false); // Auto-close on mobile
        }}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Header */}
        <Header
          onLogout={handleLogout}
          activeTab={activeTab}
          onOpenAddModal={() => setShowAddModal(true)}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          
          {activeTab === 'add' && (
            <CatalogManagementPage />
          )}

          {activeTab === 'inventory' && (
            userRole === 'owner' ? (
              <AdminStockPage />
            ) : (
              <ManagerStockPage onOpenAddProduct={showAddModal} />
            )
          )}

          {activeTab === 'dashboard' && (
            userRole === 'owner' ? (
              <OwnerDashboardView shop={currentShop} products={products} sales={sales} onNavigate={setActiveTab} />
            ) : (
              <ManagerDashboardPage setActiveTab={setActiveTab} />
            )
          )}

          {activeTab === 'invoices' && (
            <InvoicesPage />
          )}

          {(activeTab === 'sales' || activeTab === 'transactions') && (
            <TransactionsPage />
          )}

          {activeTab === 'pos' && (
            <PosPage setActiveTab={setActiveTab} />
          )}

          {activeTab === 'credits' && (
            <CreditsPage />
          )}

          {activeTab === 'manager-clients' && (
            <ManagerClientsPage />
          )}

          {activeTab === 'crm' && (
            <CrmPage />
          )}

          {activeTab === 'profit' && (
            <ProfitPage />
          )}

          {activeTab === 'team' && userRole === 'owner' && (
            <TeamPage />
          )}

          {activeTab === 'settings' && (
            <SettingsPage key={currentShop.id} />
          )}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default function App() {
  React.useEffect(() => {
    const installed = isInstalledApp();
    document.documentElement.classList.toggle('installed-app', installed);
    return () => document.documentElement.classList.remove('installed-app');
  }, []);

  return (
      <ToastProvider>
        <ShopProvider>
          <SyncProvider>
            <MainAppContent />
          </SyncProvider>
        </ShopProvider>
      </ToastProvider>
  );
}
