import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import painCahierImg from '../../../assets/pain_cahier.jpg';
import painRuptureImg from '../../../assets/pain_rupture.jpg';
import painCreditImg from '../../../assets/pain_credit.jpg';
import './benefits-section.css';

const benefits = [
  { image: painCahierImg, alt: 'Cahier de ventes', title: 'pain1QNormal', highlight: 'pain1QHighlight', description: 'pain1A', target: 'features' },
  { image: painRuptureImg, alt: 'Rayons de boutique presque vides', title: 'pain2QNormal', highlight: 'pain2QHighlight', description: 'pain2A', target: 'features' },
  { image: painCreditImg, alt: 'Suivi des crédits clients', title: 'pain3QNormal', highlight: 'pain3QHighlight', description: 'pain3A', target: 'pricing' },
];

export function BenefitsSection({ isRtl, lt, scrollToSection }) {
  const reducedMotion = useReducedMotion();

  return (
    <section id="pain-points" className="landing-section benefits-section" dir={isRtl ? 'rtl' : 'ltr'} aria-labelledby="benefits-title">
      <div className="benefits-inner">
        <div className="benefits-intro">
          <span className="benefits-eyebrow">{isRtl ? 'ما يهم في متجرك' : 'Au quotidien dans votre boutique'}</span>
          <h2 id="benefits-title">{lt('painTitle')}</h2>
          <p>{lt('painSub')}</p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <motion.article
              className="benefit-card"
              key={benefit.title}
              initial={reducedMotion ? false : { opacity: 0, y: 36 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: index * 0.09, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <div className="benefit-image">
                <img src={benefit.image} alt={benefit.alt} loading="lazy" decoding="async" />
                <span className="benefit-number" aria-hidden="true">0{index + 1}</span>
              </div>
              <div className="benefit-content">
                <h3>{lt(benefit.title)}<span>{lt(benefit.highlight)}</span></h3>
                <p>{lt(benefit.description)}</p>
                <button type="button" className="benefit-link" onClick={() => scrollToSection(benefit.target)}>
                  {isRtl ? 'اكتشف المزيد' : 'En savoir plus'} <ArrowUpRight size={17} aria-hidden="true" />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
