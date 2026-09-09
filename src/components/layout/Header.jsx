import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../../context/ShopContext.jsx';
import { useSync } from '../../context/SyncContext.jsx';
import { getPlanLimits } from '../../services/localAuth.js';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  Plus,
  Globe,
  LayoutGrid,
  Store,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Crown
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export function Header({ activeTab, onOpenAddModal, onMenuClick, onLogout }) {
  const { t, i18n } = useTranslation();
  const { isOnline, isLocalOnly, isSyncing, pendingCount, triggerManualSync } = useSync();
  const { currentShop, availableShops, switchShop, addShop, userRole, userName } = useShop();

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showShopMenu, setShowShopMenu] = useState(false);
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [newShop, setNewShop] = useState({ name: '', address: '', phone: '', email: '', code: '' });
  const [shopError, setShopError] = useState('');
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [offlineBanner, setOfflineBanner] = useState(false);
  const shopMenuRef = useRef(null);
  const plan = getPlanLimits(currentShop?.subscriptionPlan);
  const canCreateShop = availableShops.length < plan.maxShops;

  const closeShopModal = () => {
    setShowAddShopModal(false);
    setNewShop({ name: '', address: '', phone: '', email: '', code: '' });
    setShopError('');
  };

  const createConfiguredShop = async event => {
    event.preventDefault();
    if (!newShop.name.trim()) return;
    setIsCreatingShop(true);
    setShopError('');
    try {
      const code = newShop.code.trim() || `${newShop.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'SHOP'}-${String(availableShops.length + 1).padStart(2, '0')}`;
      await addShop(newShop.name.trim(), {
        address: newShop.address.trim(),
        phone: newShop.phone.trim(),
        email: newShop.email.trim(),
        code,
      });
      closeShopModal();
    } catch (error) {
      setShopError(error.message || 'Impossible de créer cette boutique.');
    } finally {
      setIsCreatingShop(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Show offline reassurance banner for 5 seconds when going offline
  useEffect(() => {
    if (!isLocalOnly && !isOnline) {
      setOfflineBanner(true);
      const t = setTimeout(() => setOfflineBanner(false), 6000);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  // Close shop menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (shopMenuRef.current && !shopMenuRef.current.contains(e.target)) {
        setShowShopMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  };

  // Sync indicator color
  const syncColor = isOnline
    ? (pendingCount > 0 ? '#f59e0b' : '#10b981')
    : '#ef4444';

  const syncTitle = isLocalOnly ? 'Mode local — données enregistrées sur cet appareil' : isOnline
    ? (pendingCount > 0 ? `${pendingCount} opération(s) en attente de sync` : 'Connecté & synchronisé')
    : 'Hors-ligne — vos données sont sauvegardées localement';

  return (
    <>
      {/* Offline reassurance banner */}
      {offlineBanner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000,
          backgroundColor: '#1e293b', color: '#f8fafc',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '14px', fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <WifiOff size={18} color="#f87171" />
          <span>Connexion perdue — <strong>vos données sont en sécurité</strong> et seront synchronisées dès le retour du réseau.</span>
        </div>
      )}

      <header className="surface-panel" style={{
        height: '64px',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'none'
      }}>

        {/* Left side: Search (Desktop/Tablet) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="mobile-app-brand"><img src={logoImg} alt="NStock" /><span>{currentShop?.name}</span></div>
          <div className="desktop-only" style={{ position: 'relative', width: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '36px', paddingRight: '48px', height: '36px', backgroundColor: 'var(--bg-main)' }}
              placeholder="Rechercher produits, SKU... (Cmd + K)"
            />
            <span style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              fontSize: '0.7rem', backgroundColor: 'var(--bg-surface)', padding: '2px 6px',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
              border: '1px solid var(--border-color)'
            }}>
              ⌘K
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="app-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="app-language-toggle"
            style={{ padding: '8px', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
            title="Changer la langue"
          >
            <Globe size={18} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>{i18n.language}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{ padding: '8px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
            title="Changer le thème"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Sync Icon only — green=ok, orange=pending, red=offline */}
          <button
            onClick={triggerManualSync}
            disabled={isLocalOnly || isSyncing || !isOnline}
            title={syncTitle}
            aria-label={syncTitle}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: isOnline ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              position: 'relative'
            }}
          >
            {isOnline ? (
              <Wifi size={20} color={syncColor} />
            ) : (
              <WifiOff size={20} color={syncColor} />
            )}
            {isSyncing && (
              <RefreshCw size={13} color="#f59e0b" style={{ animation: 'spin 1s linear infinite', position: 'absolute', bottom: '4px', right: '2px' }} />
            )}
            {/* Dot indicator */}
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '4px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: syncColor,
              border: '1px solid var(--bg-surface)'
            }} />
          </button>

          {/* 3-bar shop menu (owner only) */}
          {userRole === 'owner' && (
            <div ref={shopMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowShopMenu(!showShopMenu)}
                title="Gérer les boutiques"
                style={{
                  padding: '8px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: showShopMenu ? 'var(--bg-main)' : 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ width: '18px', height: '2px', backgroundColor: 'currentColor', borderRadius: '1px' }} />
                <span style={{ width: '18px', height: '2px', backgroundColor: 'currentColor', borderRadius: '1px' }} />
                <span style={{ width: '18px', height: '2px', backgroundColor: 'currentColor', borderRadius: '1px' }} />
              </button>

              {showShopMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: '52px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  minWidth: '240px',
                  zIndex: 200,
                  overflow: 'hidden'
                }}>
                  {/* Current shop header */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Boutique active</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{currentShop?.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: plan.id === 'multishop' ? '#7c3aed' : 'var(--text-secondary)', fontSize: '11px', fontWeight: 800 }}>
                        {plan.id === 'multishop' && <Crown size={12} />}
                        Plan {plan.label}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        {availableShops.length}/{plan.maxShops} boutique{plan.maxShops > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Switch shops */}
                  {availableShops.filter(s => s.id !== currentShop?.id).length > 0 && (
                    <div style={{ padding: '8px 0' }}>
                      <div style={{ padding: '4px 16px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Changer de boutique</div>
                      {availableShops.filter(s => s.id !== currentShop?.id).map(shop => (
                        <button
                          key={shop.id}
                          onClick={() => { switchShop(shop.id); setShowShopMenu(false); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            width: '100%', padding: '10px 16px',
                            border: 'none', backgroundColor: 'transparent',
                            color: 'var(--text-primary)', cursor: 'pointer',
                            fontSize: '14px', textAlign: 'left',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Store size={16} color="var(--text-secondary)" />
                          {shop.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Add new shop */}
                  <button type="button" onClick={onLogout} className="btn btn-secondary" style={{ margin: '10px 16px', minHeight: 44 }}>Se déconnecter</button>
                  <div style={{ borderTop: '1px solid var(--border-color)', padding: '8px 0' }}>
                    <button
                      onClick={() => { setShopError(''); setShowAddShopModal(true); setShowShopMenu(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        width: '100%', padding: '10px 16px',
                        border: 'none', backgroundColor: 'transparent',
                        color: '#0e6ba8', cursor: 'pointer',
                        fontSize: '14px', fontWeight: 600, textAlign: 'left'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Plus size={16} />
                      {canCreateShop ? 'Configurer une nouvelle boutique' : 'Ajouter une boutique'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </header>

      {/* Add Shop Modal */}
      {showAddShopModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="surface-panel" style={{ width: '100%', maxWidth: '560px', padding: '28px', maxHeight: '90dvh', overflowY: 'auto' }}>
            {canCreateShop ? (
              <form onSubmit={createConfiguredShop}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: '#e8f3fb', color: '#0e6ba8', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Store size={21} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 750, margin: '0 0 5px', color: 'var(--text-primary)' }}>Configurer une nouvelle boutique</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Elle sera reliée au même administrateur avec sa propre équipe, son stock et ses ventes.
                    </p>
                  </div>
                </div>

                {shopError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '9px', background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '12px', fontWeight: 650, marginBottom: '16px' }}>
                    <AlertCircle size={15} /> {shopError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
                  <label style={{ gridColumn: '1 / -1', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Nom de la boutique *
                    <input type="text" className="input-field" value={newShop.name} onChange={event => setNewShop({ ...newShop, name: event.target.value })} placeholder="Ex: Boutique Centre-Ville" autoFocus required style={{ marginTop: '6px' }} />
                  </label>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Adresse
                    <input type="text" className="input-field" value={newShop.address} onChange={event => setNewShop({ ...newShop, address: event.target.value })} placeholder="Quartier, ville" style={{ marginTop: '6px' }} />
                  </label>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Téléphone
                    <input type="tel" className="input-field" value={newShop.phone} onChange={event => setNewShop({ ...newShop, phone: event.target.value })} placeholder="+221 77 000 00 00" style={{ marginTop: '6px' }} />
                  </label>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Email de la boutique
                    <input type="email" className="input-field" value={newShop.email} onChange={event => setNewShop({ ...newShop, email: event.target.value })} placeholder="boutique@exemple.com" style={{ marginTop: '6px' }} />
                  </label>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Code boutique
                    <input type="text" className="input-field" value={newShop.code} onChange={event => setNewShop({ ...newShop, code: event.target.value })} placeholder="Généré automatiquement" style={{ marginTop: '6px', textTransform: 'uppercase' }} />
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '22px' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeShopModal}>Annuler</button>
                  <button type="submit" className="btn btn-primary" disabled={!newShop.name.trim() || isCreatingShop}>
                    {isCreatingShop ? 'Création…' : 'Créer et ouvrir'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: plan.id === 'standard' ? '#f3e8ff' : '#fff7ed', color: plan.id === 'standard' ? '#7c3aed' : '#c2410c', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
                  {plan.id === 'standard' ? <Crown size={25} /> : <Store size={25} />}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 750, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                  {plan.id === 'standard' ? 'Option Multi-boutiques requise' : 'Limite de boutiques atteinte'}
                </h3>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
                  {plan.id === 'standard'
                    ? 'Votre boutique principale a déjà été créée lors de votre inscription. Le plan Standard comprend une boutique, un administrateur et jusqu’à deux gestionnaires.'
                    : `Votre plan comprend jusqu’à ${plan.maxShops} boutiques reliées.`}
                </p>
                {plan.id === 'standard' && (
                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '13px', marginBottom: '20px' }}>
                    Activez le plan Multi-boutiques pour configurer jusqu’à 5 boutiques avec leurs propres gestionnaires.
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={closeShopModal}>Compris</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
