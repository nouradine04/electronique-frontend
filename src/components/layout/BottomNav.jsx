import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShop } from '../../context/ShopContext.jsx';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  History, 
  Layers, 
  CreditCard, 
  FileText,
  PackagePlus,
  Users,
  TrendingUp,
  Settings,
  ShieldCheck,
  MoreHorizontal,
  X,
  LogOut,
  UserRound
} from 'lucide-react';

const BRAND = '#0e6ba8';

export function BottomNav({ activeTab, setActiveTab, onLogout }) {
  const { t } = useTranslation();
  const { userRole, userName } = useShop();
  const [showMore, setShowMore] = useState(false);

  const NavItem = ({ id, icon: Icon, label, isBig }) => {
    const isActive = activeTab === id;
    return (
      <button
        className={`bottom-nav-item ${isActive ? 'active' : ''}`}
        onClick={() => { setActiveTab(id); setShowMore(false); }}
        style={isBig ? {
          display: 'flex', alignItems: 'center', gap: '12px',
          width: '100%', padding: '14px 20px', border: 'none',
          backgroundColor: isActive ? '#eef6fc' : 'transparent',
          borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem',
          fontWeight: isActive ? 700 : 500, color: isActive ? BRAND : 'var(--text-primary)',
          transition: 'all 0.15s'
        } : undefined}
      >
        <Icon size={isBig ? 22 : 24} />
        <span>{label}</span>
      </button>
    );
  };

  // Owner tabs: 3 principales + Plus
  const ownerMainTabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('bottom_nav.home') },
    { id: 'pos', icon: ShoppingCart, label: t('bottom_nav.sell') },
    { id: 'inventory', icon: Layers, label: t('bottom_nav.stock') },
  ];
  const ownerMoreTabs = [
    { id: 'transactions', icon: History, label: t('bottom_nav.transactions') },
    { id: 'invoices', icon: FileText, label: t('bottom_nav.invoices') },
    { id: 'profit', icon: TrendingUp, label: t('bottom_nav.profit') },
    { id: 'crm', icon: Users, label: t('bottom_nav.clients') },
    { id: 'team', icon: ShieldCheck, label: t('bottom_nav.team') },
    { id: 'settings', icon: Settings, label: 'Profil et réglages' },
  ];

  // Manager tabs: 3 principales + Plus
  const managerMainTabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('bottom_nav.home') },
    { id: 'pos', icon: ShoppingCart, label: t('bottom_nav.sell') },
    { id: 'inventory', icon: Layers, label: t('bottom_nav.stock') },
  ];
  const managerMoreTabs = [
    { id: 'transactions', icon: History, label: t('bottom_nav.sales') },
    { id: 'add', icon: PackagePlus, label: 'Catalogue' },
    { id: 'manager-clients', icon: Users, label: t('bottom_nav.clients') },
    { id: 'invoices', icon: FileText, label: t('bottom_nav.invoices') },
    { id: 'settings', icon: Settings, label: 'Profil et réglages' },
  ];

  const mainTabs = userRole === 'owner' ? ownerMainTabs : managerMainTabs;
  const moreTabs = userRole === 'owner' ? ownerMoreTabs : managerMoreTabs;
  const isMoreActive = moreTabs.some(t => t.id === activeTab);

  return (
    <>
      {/* Overlay menu "Plus" */}
      {showMore && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1060 }} onClick={() => setShowMore(false)}>
          <div className="bottom-more-sheet" style={{ position: 'absolute', left: '12px', right: '12px', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', boxShadow: '0 -4px 30px rgba(0,0,0,0.15)', padding: '8px', zIndex: 1061 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 12px 8px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{t('bottom_nav.more')}</span>
              <button onClick={() => setShowMore(false)} style={{ background: 'var(--bg-main)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={14} color="var(--text-secondary)" />
              </button>
            </div>
            <button type="button" className="bottom-profile" onClick={() => { setActiveTab('settings'); setShowMore(false); }}>
              <span className="bottom-profile-avatar"><UserRound size={19} /></span>
              <span><strong>{userName}</strong><small>{userRole === 'owner' ? 'Administrateur' : 'Gestionnaire'} · Voir le profil</small></span>
            </button>
            {moreTabs.map(tab => (
              <NavItem key={tab.id} id={tab.id} icon={tab.icon} label={tab.label} isBig />
            ))}
            <button type="button" className="bottom-logout" onClick={() => { setShowMore(false); onLogout?.(); }}><LogOut size={20} /><span>Se déconnecter</span></button>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="bottom-nav">
        {mainTabs.map(tab => (
          <NavItem key={tab.id} id={tab.id} icon={tab.icon} label={tab.label} />
        ))}
        <button
          className={`bottom-nav-item ${isMoreActive ? 'active' : ''}`}
          onClick={() => setShowMore(!showMore)}
        >
          <MoreHorizontal size={24} />
          <span>{t('bottom_nav.more')}</span>
        </button>
      </div>
    </>
  );
}
