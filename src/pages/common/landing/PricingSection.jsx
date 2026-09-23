import { CheckCircle2 } from 'lucide-react';

import { BRAND } from './constants';

export function PricingSection({ setPricingPeriod, pricingPeriod, openRegistration }) {
  return (
<section id="pricing" className="landing-section" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '16px' }}>
              Tarifs simples et sans surprise
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 32px auto' }}>
              15 jours d’essai gratuit — aucune carte bancaire requise.
            </p>

            {/* Billing Switcher */}
            <div className="billing-switcher">
              <button
                onClick={() => setPricingPeriod('monthly')}
                style={{
                  border: 'none',
                  backgroundColor: pricingPeriod === 'monthly' ? BRAND : 'transparent',
                  color: pricingPeriod === 'monthly' ? 'white' : 'var(--text-secondary)',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                Mensuel
              </button>
              <button
                onClick={() => setPricingPeriod('quarterly')}
                style={{
                  border: 'none',
                  backgroundColor: pricingPeriod === 'quarterly' ? BRAND : 'transparent',
                  color: pricingPeriod === 'quarterly' ? 'white' : 'var(--text-secondary)',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                Trimestriel <span style={{ backgroundColor: '#10b981', color: 'white', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: '800' }}>-10%</span>
              </button>
              <button
                onClick={() => setPricingPeriod('annual')}
                style={{
                  border: 'none',
                  backgroundColor: pricingPeriod === 'annual' ? BRAND : 'transparent',
                  color: pricingPeriod === 'annual' ? 'white' : 'var(--text-secondary)',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                Annuel <span style={{ backgroundColor: '#10b981', color: 'white', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: '800' }}>-17%</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
              
              {/* Plan 1 */}
              <div className="hover-scale" style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '40px 32px',
                width: '100%',
                maxWidth: '350px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 10px 0' }}>Plan Standard</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>Idéal pour les boutiques uniques.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '36px', fontWeight: '900', color: 'var(--text-primary)' }}>
                        {pricingPeriod === 'monthly' ? '10 000 F' : pricingPeriod === 'quarterly' ? '9 000 F' : '8 300 F'}
                      </span>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px' }}>/ mois</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {pricingPeriod === 'monthly' ? 'Facturé mensuellement' : pricingPeriod === 'quarterly' ? '27 000 F facturé par trimestre' : '99 600 F facturé par an'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <CheckCircle2 size={14} color="var(--success)" /> 1 Boutique unique
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <CheckCircle2 size={14} color="var(--success)" /> 1 Compte Administrateur
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <CheckCircle2 size={14} color="var(--success)" /> Jusqu'à 2 Gestionnaires (Caissiers)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <CheckCircle2 size={14} color="var(--success)" /> Mode Hors-ligne complet chiffré
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openRegistration('standard')}
                  style={{
                    width: '100%',
                    backgroundColor: BRAND,
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    marginTop: '40px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  Commencer l'essai gratuit
                </button>
              </div>

              {/* Plan 2 */}
              <div className="hover-scale" style={{
                backgroundColor: 'var(--bg-surface)',
                border: '2px solid ' + BRAND,
                borderRadius: '16px',
                padding: '40px 32px',
                width: '100%',
                maxWidth: '350px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: BRAND,
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  textTransform: 'uppercase'
                }}>
                  Populaire
                </div>

                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 10px 0' }}>Plan Multi-Boutiques</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>Pour gérer plusieurs franchises.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '36px', fontWeight: '900', color: 'var(--text-primary)' }}>
                        {pricingPeriod === 'monthly' ? '25 000 F' : pricingPeriod === 'quarterly' ? '22 500 F' : '20 750 F'}
                      </span>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px' }}>/ mois</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {pricingPeriod === 'monthly' ? 'Facturé mensuellement' : pricingPeriod === 'quarterly' ? '67 500 F facturé par trimestre' : '249 000 F facturé par an'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <CheckCircle2 size={14} color="var(--success)" /> Jusqu'à 5 Boutiques reliées
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <CheckCircle2 size={14} color="var(--success)" /> 1 Compte Administrateur centralisé
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <CheckCircle2 size={14} color="var(--success)" /> Comptes Caissiers illimités
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <CheckCircle2 size={14} color="var(--success)" /> Support technique prioritaire
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => openRegistration('multishop')}
                  style={{
                    width: '100%',
                    backgroundColor: BRAND,
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    marginTop: '40px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: '0 4px 6px -1px rgba(14, 107, 168, 0.15)'
                  }}
                >
                  Essayer gratuitement
                </button>
              </div>

            </div>
          </div>
        </section>
  );
}
