import { FormStep, LoadingButton, StepProgress } from '../../../components/forms/FormUI';
import { FormField, FormInput } from '../../../components/ui/FormControls';


import { AlertCircle, ArrowRight, X, User, Store, Mail, LockKeyhole } from 'lucide-react';

import { BRAND } from './constants';

export function RegistrationModal({
  appOnly,
  onNavigate,
  setShowRegisterModal,
  error,
  registerStep,
  adminName,
  email,
  shopName,
  password,
  handleRegister,
  setAdminName,
  setError,
  setEmail,
  goToCredentials,
  setShopName,
  setPassword,
  setRegisterStep,
  loading,
}) {
  return (
<div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content">
            <button
              onClick={() => appOnly ? onNavigate('login') : setShowRegisterModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
                Créer votre boutique
              </h2>
            </div>

            {error && !(
              (registerStep === 1 && (!adminName.trim() || !/^\S+@\S+\.\S+$/.test(email)))
              || (registerStep === 2 && (!shopName.trim() || password.length < 8))
            ) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <StepProgress step={registerStep} total={2} items={[{ label: 'Vous', icon: User }, { label: 'Boutique', icon: Store }]} />
            <form onSubmit={handleRegister} noValidate>
              <FormStep stepKey={registerStep}>
                {registerStep === 1 ? <>
                  <FormField id="register-name" label="Votre nom" error={error && !adminName.trim() ? 'Indiquez votre nom.' : null}>
                    <FormInput id="register-name" leadingIcon={<User size={18} />} type="text" autoComplete="name" placeholder="Votre nom" value={adminName} onChange={(e) => { setAdminName(e.target.value); setError(''); }} aria-invalid={Boolean(error && !adminName.trim())} autoFocus />
                  </FormField>
                  <FormField id="register-email" label="Email" error={error && !/^\S+@\S+\.\S+$/.test(email) ? 'Adresse email invalide.' : null}>
                    <FormInput id="register-email" leadingIcon={<Mail size={18} />} type="email" inputMode="email" autoComplete="email" placeholder="Votre email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} aria-invalid={Boolean(error && !/^\S+@\S+\.\S+$/.test(email))} />
                  </FormField>
                  <div className="form-actions"><button type="button" className="btn btn-primary" onClick={goToCredentials}>Continuer <ArrowRight size={17} /></button></div>
                </> : <>
                  <FormField id="register-shop" label="Nom de la boutique" error={error && !shopName.trim() ? 'Indiquez le nom de votre boutique.' : null}>
                    <FormInput id="register-shop" leadingIcon={<Store size={18} />} type="text" autoComplete="organization" placeholder="Nom de la boutique" value={shopName} onChange={(e) => { setShopName(e.target.value); setError(''); }} aria-invalid={Boolean(error && !shopName.trim())} autoFocus />
                  </FormField>
                  <FormField id="register-password" label="Mot de passe" error={error && password.length < 8 ? '8 caractères minimum.' : null}>
                    <FormInput id="register-password" leadingIcon={<LockKeyhole size={18} />} type="password" autoComplete="new-password" placeholder="8 caractères minimum" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} aria-invalid={Boolean(error && password.length < 8)} />
                  </FormField>
                  <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => { setError(''); setRegisterStep(1); }}>Retour</button><LoadingButton type="submit" loading={loading} className="btn btn-primary">Créer ma boutique</LoadingButton></div>
                </>}
              </FormStep>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Déjà inscrit ?{' '}
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  onNavigate('login');
                }}
                style={{ background: 'none', border: 'none', color: BRAND, fontWeight: '700', padding: 0, cursor: 'pointer' }}
              >
                Se connecter
              </button>
            </div>

          </div>
        </div>
  );
}
