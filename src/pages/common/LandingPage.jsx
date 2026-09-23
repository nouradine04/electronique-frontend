import { useLandingPage } from './landing/useLandingPage';
import { LandingStyles } from './landing/LandingStyles';
import { ContactSection } from './landing/ContactSection';
import { BenefitsSection } from './landing/BenefitsSection';
import { FeaturesSection } from './landing/FeaturesSection';
import { PricingSection } from './landing/PricingSection';
import { FaqSection } from './landing/FaqSection';
import { RegistrationModal } from './landing/RegistrationModal';

import { LandingHero } from '../../components/LandingHero';

import { LandingNavbar } from '../../components/LandingNavbar';

import { InstallApp } from '../../components/InstallApp';
import './public-responsive.css';
import './landing-flow.css';

import { ArrowRight, ArrowUp, Store } from 'lucide-react';
import logoImg from '../../assets/logo.png';

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

  return (
    <div className={appOnly ? "installed-auth" : undefined} style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      color: 'var(--text-primary)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      scrollBehavior: 'smooth',
      overflowX: 'hidden',
      maxWidth: '100%'
    }}>
      
      {/* Dynamic styling for keyframes & hover states */}
      {/* Dynamic styling for keyframes & hover states */}
      <LandingStyles />

      <LandingNavbar isRtl={isRtl} language={currentLang} theme={theme}
        onHome={() => { setCurrentView('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSection={(section) => { if (section === 'contact') setCurrentView('contact'); else { setCurrentView('landing'); setTimeout(() => scrollToSection(section), 100); } }}
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

        {/* PAIN POINTS SECTION */}
        <BenefitsSection isRtl={isRtl} lt={lt} scrollToSection={scrollToSection} />

        {/* FEATURES SECTION */}
        <FeaturesSection isRtl={isRtl} />

        {/* DOWNLOAD SECTION */}
        <section id="download" className="landing-section" style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '16px' }}>
              {isRtl ? "تحميل التطبيق" : "Télécharger NStock"}
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '700px', margin: '0 auto' }}>
              {isRtl 
                ? "NStock متوفر على جميع أجهزتك. احصل عليه الآن واحتفظ بأيقونة التطبيق بين تطبيقاتك المفضلة." 
                : "NStock est disponible sur tous vos appareils. Installez-le dès maintenant et retrouvez son icône parmi toutes vos autres applications."}
            </p>

            <InstallApp isRtl={isRtl} />
          </div>
        </section>

        {/* PRICING SECTION */}
        <PricingSection setPricingPeriod={setPricingPeriod} pricingPeriod={pricingPeriod} openRegistration={openRegistration} />

        {/* FAQ SECTION */}
        <FaqSection />

        <section className="landing-final-cta" aria-labelledby="landing-final-title">
          <div className="landing-final-card">
            <div className="landing-final-copy">
              <span className="landing-final-icon" aria-hidden="true"><Store size={25} /></span>
              <h2 id="landing-final-title">Prêt à gérer votre boutique ?</h2>
            </div>
            <div className="landing-final-actions">
              <button type="button" className="landing-final-primary" onClick={() => openRegistration('standard')}>Créer ma boutique <ArrowRight size={18} /></button>
            </div>
          </div>
        </section>
      </>
    )}
  </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-main">
          <button type="button" className="landing-footer-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><img src={logoImg} alt="NStock" /><span>Caisse et gestion de stock pour boutiques d’électronique.</span></button>
          <nav aria-label="Navigation du pied de page">
            <button type="button" onClick={() => scrollToSection('features')}>Fonctionnalités</button>
            <button type="button" onClick={() => scrollToSection('pricing')}>Abonnement</button>
            <button type="button" onClick={() => scrollToSection('download')}>Installer</button>
            <button type="button" onClick={() => setCurrentView('contact')}>Contact</button>
          </nav>
          <button type="button" className="landing-footer-login" onClick={() => onNavigate('login')}>Se connecter <ArrowRight size={16} /></button>
        </div>
        <div className="landing-footer-bottom"><span>&copy; {new Date().getFullYear()} NStock. Tous droits réservés.</span><span>Simple · sécurisé · disponible hors connexion</span></div>
      </footer>

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
