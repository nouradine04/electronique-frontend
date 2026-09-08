import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShop } from '../../context/ShopContext.jsx';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  History, 
  Layers, 
  LogOut, 
  PackagePlus, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Settings, 
  TrendingUp,
  FileText,
  ShieldCheck
} from 'lucide-react';

import logoImg from '../../assets/logo.png';

export function Sidebar({ activeTab, setActiveTab, onLogout, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { t } = useTranslation();
  const { currentShop, availableShops, switchShop, userRole, userName } = useShop();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const NavItem = ({ id, icon: Icon, label }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '12px 24px',
          border: 'none',
          backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
          color: isActive ? 'var(--accent-sidebar-text)' : 'var(--text-primary)',
          fontWeight: isActive ? 600 : 500,
          fontSize: '0.875rem',
          cursor: 'pointer',
          textAlign: 'left',
          borderLeft: isActive ? '4px solid var(--accent-primary)' : '4px solid transparent',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
        title={isCollapsed ? label : ''}
      >
        <div style={{ color: isActive ? 'var(--accent-sidebar-text)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', flexShrink: 0 }}>
          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className="sidebar-text">{label}</span>
      </button>
    );
  };

  return (
    <aside className={`mobile-sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileMenuOpen ? 'open' : ''}`} style={{
      width: isCollapsed ? '80px' : '260px',
      minWidth: isCollapsed ? '80px' : '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100dvh',
      position: 'sticky',
      top: 0,
      transition: 'width 0.3s ease, min-width 0.3s ease'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Brand Header */}
        <div style={{ padding: '24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logoImg} alt="Logo" style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }} />
            <div className="sidebar-text" style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              NStock
            </div>
          </div>
        </div>

        {/* Store Selector */}
        <div className="sidebar-select-wrapper" style={{ padding: '0 16px 24px 16px' }}>
          {userRole === 'owner' ? (
            <div style={{ position: 'relative' }}>
              <select
                value={currentShop.id}
                onChange={(e) => switchShop(e.target.value)}
                className="input-field"
                style={{
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-main)',
                  border: 'none',
                  cursor: availableShops.length > 1 ? 'pointer' : 'default',
                  height: '40px'
                }}
              >
                {availableShops.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ minHeight: '40px', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentShop.name}
            </div>
          )}
        </div>

        {/* Flat Navigation List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {userRole === 'owner' && (
            <NavItem id="dashboard" icon={LayoutDashboard} label={t('sidebar.dashboard')} />
          )}

          {userRole === 'manager' && (
            <NavItem id="dashboard" icon={LayoutDashboard} label={t('sidebar.dashboard')} />
          )}

          {userRole === 'manager' && (
            <NavItem id="pos" icon={ShoppingCart} label={t('sidebar.sell')} />
          )}

          {/* Owner can also access POS to sell */}
          {userRole === 'owner' && (
            <NavItem id="pos" icon={ShoppingCart} label="Caisse / Vendre" />
          )}

          {/* Stock: accessible to both */}
          <NavItem id="inventory" icon={Layers} label={t('sidebar.stock')} />
          
          {userRole === 'owner' ? (
            <NavItem id="transactions" icon={History} label={t('sidebar.transactions')} />
          ) : (
            <NavItem id="transactions" icon={History} label={t('sidebar.sales')} />
          )}

          {/* Factures (Invoices): accessible to both */}
          <NavItem id="invoices" icon={FileText} label={t('sidebar.invoices')} />

          {/* Rentabilité pour owner */}
          {userRole === 'owner' && (
            <NavItem id="profit" icon={TrendingUp} label={t('sidebar.profit')} />
          )}

          {/* Only manager accesses Catalog Add */}
          {userRole === 'manager' && (
            <NavItem id="add" icon={PackagePlus} label={t('sidebar.catalog')} />
          )}

          {/* New CRM page link for owner */}
          {userRole === 'owner' && (
            <NavItem id="crm" icon={Users} label={t('sidebar.customers')} />
          )}

          {userRole === 'owner' && (
            <NavItem id="team" icon={ShieldCheck} label={t('sidebar.team')} />
          )}

          {/* Clients for manager */}
          {userRole === 'manager' && (
            <NavItem id="manager-clients" icon={Users} label={t('sidebar.customers')} />
          )}

          {/* Paramètres: accessible à tous (pour langue & sauvegarde) */}
          <NavItem id="settings" icon={Settings} label={t('sidebar.settings')} />
        </div>

      </div>

      <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border-color)' }}>
        
        {/* Logout Button (styled as NavItem for perfect alignment) */}
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            fontWeight: 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease'
          }}
          title={t('sidebar.logout')}
        >
          <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', flexShrink: 0 }}>
            <LogOut size={20} strokeWidth={2} />
          </div>
          <span className="sidebar-text" style={{ color: 'var(--danger)' }}>{t('sidebar.logout')}</span>
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', flexShrink: 0 }}>
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </div>
          <span className="sidebar-text">
            {isCollapsed ? 'Déplier' : 'Replier'}
          </span>
        </button>

        {/* User Profile */}
        <div style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.875rem', flexShrink: 0
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-text" style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {userName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {userRole === 'owner' ? 'Propriétaire' : 'Gestionnaire'}
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
}
