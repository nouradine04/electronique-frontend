import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LandingPageView } from './pages/common/LandingPageView';
import { landingTranslations } from './pages/common/landing/translations';
import './index.css';

// Render the same public view as the application, without opening a local database
// or creating a user session at build time.
export function renderLanding() {
  const noop = () => {};
  return renderToStaticMarkup(<LandingPageView onNavigate={noop} state={{
    isRtl: false, currentLang: 'fr', theme: 'light', currentView: 'landing',
    pricingPeriod: 'monthly', showBackToTop: false, showRegisterModal: false,
    lt: key => landingTranslations.fr[key] || key,
    setCurrentView: noop, scrollToSection: noop, openRegistration: noop,
    toggleLanguage: noop, toggleTheme: noop, setPricingPeriod: noop,
  }} />);
}
