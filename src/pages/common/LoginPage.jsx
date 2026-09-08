import { Reveal } from '../../components/Reveal';
import React, { useState } from 'react';
import { Box, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { useShop } from '../../context/ShopContext.jsx';
import { loginLocalUser } from '../../services/localAuth.js';
import logoImg from '../../assets/logo.png';
import './public-responsive.css';

export function LoginPage({ onLoginSuccess, onNavigate }) {
  const { switchRole, switchShop } = useShop();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await loginLocalUser(email, password);
      const { role, name } = user;
      await switchShop(user.shopId);
      sessionStorage.setItem('encryption_pin', password);
      switchRole(role, name);
      setLoading(false);
      onLoginSuccess(role);

    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion');
      setLoading(false);
    }
  };

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
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Bienvenue
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Connectez-vous pour accéder à votre tableau de bord.
            </p>
          </div>

          {error && (
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

          <form onSubmit={handleSubmit}>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Adresse Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  autoComplete="username"
                  className="input-field"
                  style={{ paddingLeft: '40px', height: '44px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nstock.com"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  autoComplete="current-password"
                  className="input-field"
                  style={{ paddingLeft: '40px', height: '44px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', height: '44px', fontSize: '1rem', fontWeight: 600 }}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
            
            {onNavigate && (
              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.875rem' }}>
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
            
            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Identifiants de test :<br/>
              <span style={{ fontFamily: 'var(--font-mono)' }}>admin@nstock.com (admin)</span><br/>
              <span style={{ fontFamily: 'var(--font-mono)' }}>gestionnaire@nstock.com (gest)</span>
            </div>

          </form>

        </div></Reveal>
      </div>
    </div>
  );
}
