import { useLandingPage } from './landing/useLandingPage';
import { LandingStyles } from './landing/LandingStyles';
import { ContactSection } from './landing/ContactSection';
import { BenefitsSection } from './landing/BenefitsSection';
import { FeaturesSection } from './landing/FeaturesSection';
import { DownloadSection } from './landing/DownloadSection';
import { PricingSection } from './landing/PricingSection';
import { LandingFooter } from './landing/LandingFooter';
import { FaqSection } from './landing/FaqSection';
import { RegistrationModal } from './landing/RegistrationModal';

import { LandingHero } from '../../components/LandingHero';
import { LandingDashboardShowcase } from '../../components/LandingDashboardShowcase';

import { LandingNavbar } from '../../components/LandingNavbar';

import './public-responsive.css';
import './landing-flow.css';

import { ArrowRight, ArrowUp } from 'lucide-react';

export function LandingPage({ onLoginSuccess, onNavigate, initialView = 'landing', appOnly = false }) {
  const {
    isRtl,
    currentLang,
    theme,
    setCurrentView,
    scrollToSection,
    openRegistration,
    toggleLanguage,
    toggleTheme,
    currentView,
    lt,
    setPricingPeriod,
    pricingPeriod,
    showBackToTop,
    showRegisterModal,
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
  } = useLandingPage({ onLoginSuccess, onNavigate, initialView, appOnly });

  const goToSection = (section) => {
    if (section === 'contact') {
      setCurrentView('contact');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentView('landing');
    window.setTimeout(() => scrollToSection(section), 100);
  };

  return (
    <div className={appOnly ? "installed-auth" : undefined} style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      color: 'var(--text-primary)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      scrollBehavior: 'smooth',
      overflowX: 'clip',
      maxWidth: '100%'
    }}>
      
      {/* Dynamic styling for keyframes & hover states */}
      {/* Dynamic styling for keyframes & hover states */}
      <LandingStyles />

      <LandingNavbar isRtl={isRtl} language={currentLang} theme={theme}
        onHome={() => { setCurrentView('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSection={goToSection}
        onLogin={() => onNavigate('login')} onRegister={() => openRegistration('standard')}
        onLanguage={toggleLanguage} onTheme={toggleTheme} />

      {/* Main Content */}
      <main className="landing-main" style={{ flex: 1, direction: isRtl ? 'rtl' : 'ltr' }}>
        
        {currentView === 'contact' ? (
          /* DEDICATED CONTACT PAGE */
          <ContactSection lt={lt} isRtl={isRtl} setCurrentView={setCurrentView} />
        ) : (
          <>
            <LandingHero isRtl={isRtl} onStart={() => openRegistration('standard')} />
            <LandingDashboardShowcase isRtl={isRtl} />

        {/* PAIN POINTS SECTION */}
        <BenefitsSection isRtl={isRtl} lt={lt} scrollToSection={scrollToSection} />

        {/* FEATURES SECTION */}
        <FeaturesSection isRtl={isRtl} />

        {/* DOWNLOAD SECTION */}
        <DownloadSection isRtl={isRtl} />

        {/* PRICING SECTION */}
        <PricingSection setPricingPeriod={setPricingPeriod} pricingPeriod={pricingPeriod} openRegistration={openRegistration} />

        {/* FAQ SECTION */}
        <FaqSection />

        <section className="landing-final-cta" aria-labelledby="landing-final-title">
          <div className="landing-final-card">
            <span className="landing-final-eyebrow">{isRtl ? 'ابدأ الآن' : 'Commencer'}</span>
            <h2 id="landing-final-title">{isRtl ? 'جاهز لإدارة متجرك؟' : 'Prêt à gérer votre boutique ?'}</h2>
            <p>{isRtl ? 'مبيعاتك ومخزونك في مكان واحد.' : 'Vos ventes et votre stock, au même endroit.'}</p>
            <button type="button" className="landing-final-primary" onClick={() => openRegistration('standard')}>
              {isRtl ? 'إنشاء متجري' : 'Créer ma boutique'} <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </section>
      </>
    )}
  </main>

      {/* Footer */}
      <LandingFooter
        onHome={() => { setCurrentView('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSection={goToSection}
        onLogin={() => onNavigate('login')}
      />

      {showBackToTop && <button type="button" className="landing-back-top" aria-label="Revenir en haut de la page" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp size={20} /></button>}

      {/* REGISTRATION MODAL */}
      {showRegisterModal && (
        <RegistrationModal
          appOnly={appOnly}
          onNavigate={onNavigate}
          setShowRegisterModal={setShowRegisterModal}
          error={error}
          registerStep={registerStep}
          adminName={adminName}
          email={email}
          shopName={shopName}
          password={password}
          handleRegister={handleRegister}
          setAdminName={setAdminName}
          setError={setError}
          setEmail={setEmail}
          goToCredentials={goToCredentials}
          setShopName={setShopName}
          setPassword={setPassword}
          setRegisterStep={setRegisterStep}
          loading={loading}
        />
      )}

    </div>
  );
}
