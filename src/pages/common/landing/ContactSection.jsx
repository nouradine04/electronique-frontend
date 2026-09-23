import { Globe } from 'lucide-react';

import { BRAND } from './constants';

export function ContactSection({ lt, isRtl, setCurrentView }) {
  return (
<section style={{ padding: '60px 20px', maxWidth: '600px', margin: '45px auto', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '40px 32px',
              boxShadow: 'var(--shadow-md)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                backgroundColor: 'rgba(14, 107, 168, 0.1)', color: BRAND,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
              }}>
                <Globe size={28} />
              </div>
              
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '12px' }}>
                {lt('contactTitle')}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                {lt('contactSub')}
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const name = fd.get('name');
                const shop = fd.get('shop');
                const phone = fd.get('phone');
                const msg = fd.get('message');
                const text = `Bonjour NStock! Je m'appelle ${name} (Boutique: ${shop}, Tél: ${phone}). Message: ${msg}`;
                window.open(`https://wa.me/905527863655?text=${encodeURIComponent(text)}`, '_blank');
              }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: isRtl ? 'right' : 'left' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {lt('contactName')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Ex: Fatima"
                    required
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)', fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {lt('contactShop')}
                  </label>
                  <input
                    type="text"
                    name="shop"
                    placeholder="Ex: Électronique Fatima"
                    required
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)', fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {lt('contactPhone')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Ex: +235 66 00 00 00"
                    required
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)', fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {lt('contactMsg')}
                  </label>
                  <textarea
                    name="message"
                    placeholder="Écrivez votre question ici..."
                    required
                    rows="4"
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)', fontSize: '14px', resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%', backgroundColor: '#25d366', color: 'white',
                    border: 'none', padding: '14px', borderRadius: '8px',
                    fontWeight: '700', fontSize: '15px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    marginTop: '10px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}><path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.458 3.473 1.332 4.985l-1.354 4.954 5.074-1.33c1.46.797 3.097 1.217 4.762 1.217h.004c5.504 0 9.986-4.482 9.986-9.988 0-2.667-1.037-5.176-2.923-7.062-1.884-1.884-4.394-2.921-7.061-2.921zM6.924 8.24h.536c.162 0 .362.062.518.397.162.348.55 1.34.6 1.442.05.102.083.22.015.348-.067.129-.101.206-.2.32-.1.115-.21.258-.3.37-.1.109-.205.228-.088.428.118.2.523.86 1.12 1.393.77.689 1.42 1.05 1.623 1.155.203.105.321.088.44-.05.12-.137.513-.598.65-.8.136-.2.272-.17.458-.1.187.07 1.187.56 1.39.663.203.104.339.155.39.243.05.088.05.513-.153.722-.203.209-1.187 1.162-1.628 1.202-.44.04-1.018-.153-2.274-.658-1.583-.637-2.6-2.253-2.684-2.368-.084-.115-.678-.905-.678-1.724 0-.82.424-1.22.576-1.383.153-.162.339-.24.509-.24z"/></svg>
                  {lt('contactSend')}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentView('landing')}
                  style={{
                    width: '100%', backgroundColor: 'transparent', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px',
                    fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                  }}
                >
                  {lt('contactBack')}
                </button>
              </form>
            </div>
          </section>
  );
}
