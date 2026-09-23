import { AppErrorPage } from '../../components/errors/AppErrorPage';
import { Reveal } from '../../components/Reveal';
import React, { useState } from 'react';
import { Lock, UserRound, Eye, EyeOff, LogIn } from 'lucide-react';
import { useShop } from '../../context/ShopContext.jsx';
import { restoreLocalOwnerFromCloud } from '../../services/localAuth.js';
import { loginCloudAccount } from '../../services/cloudAuth';
import { BrandLogo } from '../../components/BrandLogo';
import './login.css';
import './public-responsive.css';
import { LoadingButton } from '../../components/forms/FormUI';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { FormDivider, FormField, FormInput } from '../../components/ui/FormControls';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { closeDesktopVault, isTauriDesktop, openDesktopVault } from '../../services/desktopVault';
import { restoreWatermelonFromDesktop, startDesktopBackupForShop } from '../../services/desktopBackup';
import { NetworkError } from '../../services/session';
import { acceptSession, sessionRequest } from '../../services/session';
import { setBackupPassword } from '../../services/backupCredential';

export function LoginPage({ onLoginSuccess, onNavigate }) {
  const { switchRole, switchShop } = useShop();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) { setError('Saisissez votre email.'); return; }
    if (!password) { setError('Saisissez votre mot de passe.'); return; }
    setLoading(true);
    setConnectionError(false);
    setError('');

    try {
      if (!navigator.onLine) throw new NetworkError('Connexion Internet requise pour vous connecter.');
      if (isTauriDesktop()) {
        await openDesktopVault(identifier, password);
      }
      const cloudSession = await loginCloudAccount(identifier, password);
      if (isTauriDesktop()) await restoreWatermelonFromDesktop();
      const user = await restoreLocalOwnerFromCloud(cloudSession, password);
      const { role, name } = user;
      await switchShop(user.shopId);
      await startDesktopBackupForShop(user.shopId);
      setBackupPassword(password);
      switchRole(role, name, user.id);
      setLoading(false);
      onLoginSuccess(role);

    } catch (err) {
      if (err instanceof NetworkError) setConnectionError(true);
      if (isTauriDesktop()) void closeDesktopVault();
      setError(`${err.message || 'Erreur lors de la connexion'} (Serveur: ${import.meta.env.VITE_BACKEND_URL || 'local'})`);
      setLoading(false);
    }
  };

  const completeGoogleLogin = async profile => {
    setLoading(true); setError('');
    try {
      if (isTauriDesktop()) {
        throw new Error('Sur ordinateur, utilisez votre mot de passe pour ouvrir le coffre local.');
      }
      const cloudSession = await sessionRequest('/auth/google/login', { credential: profile.credential });
      await acceptSession(cloudSession);
      const user = await restoreLocalOwnerFromCloud(cloudSession, null);
      await switchShop(user.shopId);
      await startDesktopBackupForShop(user.shopId);
      switchRole(user.role, user.name, user.id);
      onLoginSuccess(user.role);
    } catch (loginError) {
      if (isTauriDesktop()) void closeDesktopVault();
      setError(loginError.message || 'Connexion Google impossible.');
    }
    finally { setLoading(false); }
  };

  if (connectionError) return <AppErrorPage kind="connection" onBack={() => setConnectionError(false)} onRetry={() => { void handleSubmit({ preventDefault() {} }); }} />;

  if (loading) return <LoadingScreen label="Connexion à votre boutique…" />;

  return (
    <main className="auth-screen">
      <div className="auth-backdrop" aria-hidden="true" />
      <Reveal className="auth-content">
        <div className="auth-brand"><BrandLogo /></div>
        <section className="auth-form" aria-labelledby="login-title">
          <header className="auth-heading"><h1 id="login-title">Content de vous revoir</h1></header>
          {error && identifier && password && <div className="auth-error" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <FormField id="login-identifier" label="Email" error={error && !identifier ? 'Indiquez votre email.' : null}>
              <FormInput id="login-identifier" leadingIcon={<UserRound size={18} />} type="email" inputMode="email"
                autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="vous@exemple.com" required
                aria-invalid={Boolean(error) && !identifier} />
            </FormField>
            <FormField id="login-password" label="Mot de passe" error={error && !password ? 'Indiquez votre mot de passe.' : null}>
              <div className="auth-password">
                <FormInput id="login-password" leadingIcon={<Lock size={18} />} type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Votre mot de passe" required aria-invalid={Boolean(error) && !password} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </FormField>
            <LoadingButton type="submit" loading={loading} className="btn btn-primary auth-submit"><LogIn size={19} aria-hidden="true" /><span>Se connecter</span></LoadingButton>
            <FormDivider />
            <GoogleSignInButton onVerified={completeGoogleLogin} onError={setError} />
          </form>
          {onNavigate && <div className="auth-links"><button type="button" onClick={() => onNavigate('register')}>Créer ma boutique</button></div>}
        </section>
        {onNavigate && <button type="button" className="auth-back" onClick={() => onNavigate('landing')}>Retour à l’accueil</button>}
      </Reveal>
    </main>
  );
}
