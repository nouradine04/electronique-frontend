import { ArrowRight, Check } from 'lucide-react';
import './pricing-section.css';

const periods = [
  { id: 'monthly', label: 'Mensuel' },
  { id: 'quarterly', label: 'Trimestriel', discount: '−10 %' },
  { id: 'annual', label: 'Annuel', discount: '−17 %' },
];

const plans = [
  {
    id: 'standard', name: 'Standard', audience: 'Pour une seule boutique',
    prices: { monthly: ['25 000', 'Facturé mensuellement'], quarterly: ['22 500', '67 500 FCFA par trimestre'], annual: ['20 750', '249 000 FCFA par an'] },
    features: ['1 boutique', '1 compte administrateur', "Jusqu’à 2 gestionnaires", 'Mode hors ligne'],
    action: "Commencer l'essai gratuit",
  },
  {
    id: 'multishop', name: 'Multi-boutiques', audience: 'Pour plusieurs boutiques', featured: true,
    prices: { monthly: ['45 000', 'Facturé mensuellement'], quarterly: ['40 500', '121 500 FCFA par trimestre'], annual: ['37 350', '448 200 FCFA par an'] },
    features: ['Jusqu’à 5 boutiques', '1 compte administrateur centralisé', 'Gestionnaires illimités', 'Support technique prioritaire'],
    action: 'Essayer gratuitement',
  },
];

export function PricingSection({ setPricingPeriod, pricingPeriod, openRegistration }) {
  return (
    <section id="pricing" className="landing-section landing-pricing" aria-labelledby="pricing-title">
      <div className="landing-pricing-inner">
        <div className="landing-pricing-intro">
          <h2 id="pricing-title">Tarifs simples et sans surprise</h2>
          <p>15 jours d’essai gratuit — aucune carte bancaire requise.</p>
        </div>

        <div className="billing-switcher" role="group" aria-label="Période de facturation">
          {periods.map(period => <button key={period.id} type="button" aria-pressed={pricingPeriod === period.id} onClick={() => setPricingPeriod(period.id)}>
            <span>{period.label}</span>{period.discount && <small>{period.discount}</small>}
          </button>)}
        </div>

        <div className="pricing-grid">
          {plans.map(plan => <article className={`pricing-card${plan.featured ? ' pricing-card-featured' : ''}`} key={plan.id}>
            <div className="pricing-card-heading">
              <div><h3>{plan.name}</h3><p>{plan.audience}</p></div>
              {plan.featured && <span className="pricing-featured-label">Le plus choisi</span>}
            </div>
            <div className="pricing-amount"><strong>{plan.prices[pricingPeriod][0]}</strong><span>FCFA <small>/ mois</small></span></div>
            <p className="pricing-billing-note">{plan.prices[pricingPeriod][1]}</p>
            <div className="pricing-separator" />
            <ul>{plan.features.map(item => <li key={item}><Check size={17} aria-hidden="true" /><span>{item}</span></li>)}</ul>
            <button type="button" className="pricing-action" onClick={() => openRegistration(plan.id)}>{plan.action}<ArrowRight size={17} aria-hidden="true" /></button>
          </article>)}
        </div>
      </div>
    </section>
  );
}
