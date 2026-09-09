import React, { useMemo, useState } from 'react';
import { BadgeCheck, Building2, Mail, Phone, Store, UserPlus, UsersRound, X } from 'lucide-react';
import { LoadingButton } from '../../components/forms/FormUI';
import { useQuery } from '../../db/useQuery.js';
import { useShop } from '../../context/ShopContext.jsx';
import {
  createLocalManager,
  getPlanLimits,
  queryLocalUsers,
  setLocalUserActive,
} from '../../services/localAuth.js';

const EMPTY_FORM = { name: '', email: '', phone: '', password: '' };

export function TeamPage() {
  const { currentShop, userName } = useShop();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const users = useQuery(currentShop ? queryLocalUsers(currentShop.id) : null);
  const managers = useMemo(() => users.filter(user => user.role === 'manager'), [users]);
  const activeManagers = managers.filter(user => user.isActive).length;
  const plan = getPlanLimits(currentShop?.subscriptionPlan);
  const canAddManager = activeManagers < plan.maxManagers;
  const remaining = Number.isFinite(plan.maxManagers) ? Math.max(0, plan.maxManagers - activeManagers) : null;

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setError('');
  };

  const submitManager = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createLocalManager({ shop: currentShop, ...form });
      closeForm();
    } catch (submitError) {
      setError(submitError.message || 'Impossible de créer ce compte.');
    } finally {
      setSaving(false);
    }
  };

  const toggleManager = async manager => {
    setError('');
    try {
      await setLocalUserActive(manager, !manager.isActive, currentShop);
    } catch (toggleError) {
      setError(toggleError.message || 'Impossible de modifier ce compte.');
    }
  };

  if (!currentShop) return null;

  const accounts = [
    {
      id: 'current-owner',
      name: userName || 'Administrateur',
      email: users.find(user => user.role === 'owner')?.email || currentShop.email || 'Compte administrateur',
      phone: users.find(user => user.role === 'owner')?.phone || '',
      role: 'Administrateur',
      isActive: true,
      isOwner: true,
    },
    ...managers.map(manager => ({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      phone: manager.phone,
      role: 'Gestionnaire',
      isActive: manager.isActive,
      model: manager,
    })),
  ];

  return (
    <div className="team-page" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .team-page { padding: 24px; }
        .team-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
        .team-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 14px; }
        .team-account { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 16px; padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
        .team-account:last-child { border-bottom: none; }
        .team-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 760px) {
          .team-page { padding: 4px 0 84px; }
          .team-stats { grid-template-columns: 1fr; gap: 10px; }
          .team-account { grid-template-columns: minmax(0, 1fr); gap: 10px; padding: 16px; }
          .team-account-actions { justify-content: space-between; width: 100%; }
          .team-modal-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: '24px', color: 'var(--text-primary)' }}>Équipe et accès</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Gérez les gestionnaires et employés autorisés à travailler dans {currentShop.name}.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setError(''); setShowForm(true); }}
          disabled={!canAddManager}
          title={!canAddManager ? 'Limite de gestionnaires actifs atteinte' : 'Créer un compte gestionnaire'}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={18} /> Ajouter un gestionnaire
        </button>
      </div>

      {error && !showForm && (
        <div style={{ padding: '12px 14px', marginBottom: '16px', borderRadius: '10px', color: 'var(--danger)', background: 'var(--danger-bg)', fontSize: '13px', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div className="team-stats">
        {[
          { icon: UsersRound, label: 'Gestionnaires / employés', value: managers.length, color: '#0e6ba8' },
          { icon: BadgeCheck, label: 'Comptes actifs', value: activeManagers, color: '#15803d' },
          { icon: Building2, label: `Plan ${plan.label}`, value: remaining === null ? 'Illimité' : `${remaining} place${remaining > 1 ? 's' : ''}`, color: '#7c3aed' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="team-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '34px', height: '46px', color: item.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon size={25} strokeWidth={2} />
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>{item.label}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 800 }}>{item.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="team-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '9px' }}>
          <Store size={18} color="#0e6ba8" />
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{currentShop.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{accounts.length} compte{accounts.length > 1 ? 's' : ''} rattaché{accounts.length > 1 ? 's' : ''}</div>
          </div>
        </div>

        {accounts.map(account => (
          <div className="team-account" key={account.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: account.isOwner ? '#e8f3fb' : 'var(--bg-main)', color: account.isOwner ? '#0e6ba8' : 'var(--text-primary)', display: 'grid', placeItems: 'center', fontWeight: 800, flexShrink: 0 }}>
                {(account.name || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                  <Mail size={12} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.email}</span>
                </div>
                {account.phone && <div style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}><Phone size={12} />{account.phone}</div>}
              </div>
            </div>

            <span style={{ justifySelf: 'start', padding: '5px 10px', borderRadius: '999px', background: account.isOwner ? '#e8f3fb' : '#f1f5f9', color: account.isOwner ? '#0e6ba8' : '#475569', fontSize: '11px', fontWeight: 800 }}>
              {account.role}
            </span>

            <div className="team-account-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: account.isActive ? '#15803d' : 'var(--text-muted)', fontSize: '12px', fontWeight: 700 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: account.isActive ? '#22c55e' : '#94a3b8' }} />
                {account.isActive ? 'Compte actif' : 'Compte désactivé'}
              </span>
              {!account.isOwner && (
                <button
                  className="btn btn-secondary"
                  onClick={() => toggleManager(account.model)}
                  style={{ padding: '7px 11px', fontSize: '12px' }}
                >
                  {account.isActive ? 'Désactiver' : 'Activer'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.58)', zIndex: 1200, display: 'grid', placeItems: 'center', padding: '18px' }}>
          <div className="surface-panel" style={{ width: '100%', maxWidth: '520px', padding: '24px', position: 'relative', maxHeight: '90dvh', overflowY: 'auto' }}>
            <button onClick={closeForm} aria-label="Fermer" style={{ position: 'absolute', top: '14px', right: '14px', width: '32px', height: '32px', border: 'none', borderRadius: '50%', background: 'var(--bg-main)', color: 'var(--text-secondary)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <X size={17} />
            </button>
            <h2 style={{ margin: '0 36px 6px 0', fontSize: '20px', color: 'var(--text-primary)' }}>Nouveau gestionnaire</h2>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Ce compte pourra accéder uniquement à {currentShop.name}.
            </p>

            {error && (
              <div style={{ padding: '10px 12px', marginBottom: '14px', borderRadius: '9px', color: 'var(--danger)', background: 'var(--danger-bg)', fontSize: '12px', fontWeight: 650 }}>{error}</div>
            )}

            <form onSubmit={submitManager}>
              <div className="team-modal-grid">
                <label style={{ gridColumn: '1 / -1', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Nom complet
                  <input className="input-field" autoFocus value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Ex: Aminata Ndiaye" required style={{ marginTop: '6px' }} />
                </label>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Adresse email
                  <input className="input-field" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="gestionnaire@boutique.com" required style={{ marginTop: '6px' }} />
                </label>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Numéro de téléphone
                  <input className="input-field" type="tel" inputMode="tel" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="+221 77 000 00 00" style={{ marginTop: '6px' }} />
                </label>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Mot de passe temporaire
                  <input className="input-field" type="password" minLength={4} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="4 caractères minimum" required style={{ marginTop: '6px' }} />
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '9px', marginTop: '22px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeForm}>Annuler</button>
                <LoadingButton type="submit" className="btn btn-primary" loading={saving}>Créer le compte</LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
