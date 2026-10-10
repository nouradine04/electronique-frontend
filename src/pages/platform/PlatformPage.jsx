import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../../context/backendConfig';
import './platform.css';

const base = BACKEND_URL.replace(/\/+$/, '');

async function platformRequest(path, token, options = {}) {
  const response = await fetch(`${base}/platform${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 ? 'Session expirée ou identifiants incorrects.' : body.message || 'Service indisponible.');
  return body;
}

export function PlatformPage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [overview, setOverview] = useState(null);
  const [shops, setShops] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([platformRequest('/overview', token), platformRequest('/shops?limit=25', token)])
      .then(([summary, page]) => { if (active) { setOverview(summary); setShops(page.data); setCursor(page.next_cursor); } })
      .catch(reason => { if (active) { setError(reason.message); if (reason.message.includes('Session expirée')) setToken(''); } });
    return () => { active = false; };
  }, [token]);

  async function login(event) {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      const session = await platformRequest('/login', '', { method: 'POST', body: JSON.stringify({ email, password }) });
      setPassword('');
      setToken(session.access_token);
    } catch (reason) { setError(reason.message); }
    finally { setLoading(false); }
  }

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true); setError('');
    try {
      const page = await platformRequest(`/shops?limit=25&cursor=${encodeURIComponent(cursor)}`, token);
      setShops(previous => [...previous, ...page.data]);
      setCursor(page.next_cursor);
    } catch (reason) { setError(reason.message); }
    finally { setLoading(false); }
  }

  return <div className="platform-shell">
    <header className="platform-header"><strong>NStock <span>Plateforme</span></strong>{token && <button type="button" onClick={() => { setToken(''); setOverview(null); setShops([]); }}>Déconnexion</button>}</header>
    {!token ? <main className="platform-login"><form onSubmit={login}>
      <p className="platform-kicker">Accès réservé</p><h1>Administration de la plateforme</h1>
      <p>Connectez-vous avec votre compte d’administration NStock.</p>
      <label>Adresse e-mail<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label>Mot de passe<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
      {error && <p role="alert" className="platform-error">{error}</p>}
      <button disabled={loading} type="submit">{loading ? 'Connexion…' : 'Se connecter'}</button>
    </form></main> : <main className="platform-main">
      <div className="platform-title"><div><p className="platform-kicker">Vue d’ensemble</p><h1>Activité NStock</h1><p>Statistiques agrégées, sans données clients ni copies locales.</p></div></div>
      {error && <p role="alert" className="platform-error">{error}</p>}
      {!overview ? <p role="status">Chargement des indicateurs…</p> : <>
        <section className="platform-metrics" aria-label="Indicateurs">
          {[['Comptes commerçants', overview.tenants], ['Boutiques', overview.shops], ['Utilisateurs actifs', overview.users], ['Produits', overview.products], ['Ventes enregistrées', overview.sales]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{Number(value).toLocaleString('fr-FR')}</strong></article>)}
        </section>
        <section className="platform-list"><div className="platform-list-title"><h2>Boutiques</h2><span>50 lignes au maximum par requête</span></div>
          <div className="platform-table-wrap"><table><thead><tr><th>Nom</th><th>Identifiant boutique</th><th>Création</th></tr></thead><tbody>
            {shops.map(shop => <tr key={shop.id}><td>{shop.name}</td><td><code>{shop.id}</code></td><td>{shop.created_at ? new Date(shop.created_at).toLocaleDateString('fr-FR') : '—'}</td></tr>)}
          </tbody></table></div>
          {cursor && <button type="button" disabled={loading} onClick={loadMore}>{loading ? 'Chargement…' : 'Afficher la suite'}</button>}
        </section>
      </>}
    </main>}
  </div>;
}
