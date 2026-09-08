import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationFR from './locales/fr/translation.json';
import translationAR from './locales/ar/translation.json';

const resources = {
  fr: {
    translation: translationFR
  },
  ar: {
    translation: translationAR
  }
};

const savedLanguage = localStorage.getItem('appLanguage') || 'fr';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false 
    }
  });

// Handle RTL direction
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('appLanguage', lng);
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

// Set initial direction
document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLanguage;

export default i18n;
