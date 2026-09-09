import { Reveal } from '../../components/Reveal';
import React, { useState } from 'react';
import { Lock, UserRound } from 'lucide-react';
import { useShop } from '../../context/ShopContext.jsx';
import { loginLocalGoogleUser, loginLocalUser } from '../../services/localAuth.js';
import logoImg from '../../assets/logo.png';
import './public-responsive.css';
import { LoadingButton } from '../../components/forms/FormUI';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { FormDivider, FormField, FormInput } from '../../components/ui/FormControls';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export function LoginPage({ onLoginSuccess, onNavigate }) {
  const { switchRole, switchShop } = useShop();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) { setError('Saisissez votre email ou votre numéro de téléphone.'); return; }
    if (!password) { setError('Saisissez votre mot de passe.'); return; }
    setLoading(true);
    setError('');

    try {
      const user = await loginLocalUser(identifier, password);
      const { role, name } = user;
      await switchShop(user.shopId);
      sessionStorage.setItem('encryption_pin', password);
      switchRole(role, name, user.id);
      setLoading(false);
      onLoginSuccess(role);

    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion');
      setLoading(false);
    }
  };

  const completeGoogleLogin = async profile => {
    setLoading(true); setError('');
    try {
      const user = await loginLocalGoogleUser(profile.email);
      await switchShop(user.shopId);
      sessionStorage.setItem('encryption_pin', profile.sub);
      switchRole(user.role, user.name, user.id);
      onLoginSuccess(user.role);
    } catch (loginError) { setError(loginError.message || 'Connexion Google impossible.'); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingScreen label="Connexion à votre boutique…" />;

  return (
    <div className="login-layout" style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-main)'
    }}>
      
      {/* Left Marketing Panel (Hidden on very small screens) */}
      <div className="login-marketing" style={{
        flex: 1,
        backgroundColor: 'var(--accent-primary)',
        color: 'white',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract Background pattern */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 10%, transparent 10%)', backgroundSize: '40px 40px', opacity: 0.5, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <img src={logoImg} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px' }} />
            <h1 style={{ fontSize: '2.6rem', fontWeight: 900, letterSpacing: '-1.5px', color: 'white', fontFamily: '"Inter", system-ui, sans-serif' }}>
              N<span style={{ fontWeight: '400', opacity: 0.95 }}>Stock</span>
            </h1>
          </div>

          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '40px' }}>
            Gérez votre boutique d'électronique de A à Z.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>1</div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '4px' }}>Créez votre boutique</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Inscrivez-vous et configurez votre boutique en moins de 2 minutes.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>2</div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '4px' }}>Ajoutez vos produits</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Saisissez votre stock, vos prix et vos clients — une seule fois.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>3</div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '4px' }}>Vendez & suivez tout</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Encaissez, suivez crédits, dépenses et rapports — même hors-ligne.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="login-form-panel" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <Reveal className="login-reveal"><div className="surface-panel login-card" style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          borderRadius: 'var(--radius-lg)'
        }}>
          
          <div className="login-brand-mobile"><img src={logoImg} alt="NStock" /><span>Votre boutique, à portée de main.</span></div>
          <div className="login-card-heading" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Bienvenue
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Connectez-vous pour accéder à votre tableau de bord.
            </p>
          </div>

          {error && identifier && password && (
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              marginBottom: '24px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            
            <FormField id="login-identifier" label="Email ou numéro de téléphone" error={error && !identifier ? 'Saisissez votre email ou votre numéro.' : null}>
                <FormInput
                  id="login-identifier"
                  leadingIcon={<UserRound size={18} />}
                  type="text"
                  inputMode={identifier.includes('@') ? 'email' : 'text'}
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email@exemple.com ou +221…"
                  aria-invalid={Boolean(error) && !identifier}
                />
            </FormField>

            <FormField id="login-password" label="Mot de passe" error={error && !password ? 'Saisissez votre mot de passe.' : null}>
                <FormInput
                  id="login-password"
                  leadingIcon={<Lock size={18} />}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  aria-invalid={Boolean(error) && !password}
                />
            </FormField>

            <LoadingButton
              type="submit"
              loading={loading}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '46px', marginTop: '20px', fontSize: '0.95rem', fontWeight: 600 }}
            >
              Se connecter
            </LoadingButton>

            <FormDivider />
            <GoogleSignInButton onVerified={completeGoogleLogin} onError={setError} />
            
            {onNavigate && (
              <div className="login-card-links" style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.875rem' }}>
                Pas encore de boutique ?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  style={{ background: 'none', border: 'none', color: '#0e6ba8', fontWeight: '700', padding: 0, cursor: 'pointer' }}
                >
                  Créer un espace
                </button>
                <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>|</span>
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: '600', padding: 0, cursor: 'pointer' }}
                >
                  Accueil
                </button>
              </div>
            )}
            
          </form>

        </div></Reveal>
      </div>
    </div>
  );
}
