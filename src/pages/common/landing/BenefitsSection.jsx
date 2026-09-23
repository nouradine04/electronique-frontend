import painCahierImg from '../../../assets/pain_cahier.jpg';
import painRuptureImg from '../../../assets/pain_rupture.jpg';
import painCreditImg from '../../../assets/pain_credit.jpg';

import { BRAND } from './constants';

export function BenefitsSection({ isRtl, lt, scrollToSection }) {
  return (
<section id="pain-points" className="landing-section" style={{ backgroundColor: 'var(--bg-surface)', direction: isRtl ? 'rtl' : 'ltr' }}>
          <div style={{ maxWidth: '1050px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '18px', lineHeight: '1.2' }}>
              {lt('painTitle')}
            </h2>
            <p style={{ fontSize: '1.25rem', color: BRAND, fontWeight: '700', maxWidth: '700px', margin: '0 auto' }}>
              {lt('painSub')}
            </p>
          </div>

          <div className="pain-container">
            
            {/* Row 1: Cahier Perdu */}
            <div className="pain-row">
              <div className="pain-image-box">
                <img src={painCahierImg} alt="Cahier de ventes perdu" />
              </div>
              <div className="pain-text-box">
                <h3 className="pain-title-highlight">
                  {lt('pain1QNormal')}
                  <span className="pain-highlight-word">{lt('pain1QHighlight')}</span>
                </h3>
                <p className="pain-desc">
                  {lt('pain1A')}
                </p>
                <a className="pain-link" onClick={() => scrollToSection('features')}>
                  <span>Apprendre encore plus</span>
                  <span>➔</span>
                </a>
              </div>
            </div>

            {/* Row 2: Rupture de Stock */}
            <div className="pain-row">
              <div className="pain-image-box">
                <img src={painRuptureImg} alt="Rupture de stock" />
              </div>
              <div className="pain-text-box">
                <h3 className="pain-title-highlight">
                  {lt('pain2QNormal')}
                  <span className="pain-highlight-word">{lt('pain2QHighlight')}</span>
                </h3>
                <p className="pain-desc">
                  {lt('pain2A')}
                </p>
                <a className="pain-link" onClick={() => scrollToSection('features')}>
                  <span>Apprendre encore plus</span>
                  <span>➔</span>
                </a>
              </div>
            </div>

            {/* Row 3: Crédits Clients */}
            <div className="pain-row">
              <div className="pain-image-box">
                <img src={painCreditImg} alt="Suivi des crédits clients" />
              </div>
              <div className="pain-text-box">
                <h3 className="pain-title-highlight">
                  {lt('pain3QNormal')}
                  <span className="pain-highlight-word">{lt('pain3QHighlight')}</span>
                </h3>
                <p className="pain-desc">
                  {lt('pain3A')}
                </p>
                <a className="pain-link" onClick={() => scrollToSection('pricing')}>
                  <span>Apprendre encore plus</span>
                  <span>➔</span>
                </a>
              </div>
            </div>
          </div>
        </section>
  );
}
