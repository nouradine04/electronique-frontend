import { landingTranslations } from './translations';

import { useState, useEffect } from 'react';

import { restoreLocalOwnerFromCloud } from '../../../services/localAuth.js';
import { closeDesktopVault, isTauriDesktop, openDesktopVault } from '../../../services/desktopVault';
import { startDesktopBackupForShop } from '../../../services/desktopBackup';
import { registerCloudAccount } from '../../../services/cloudAuth';
import { setBackupPassword } from '../../../services/backupCredential';
import { useShop } from '../../../context/ShopContext.jsx';

import { useTranslation } from 'react-i18next';
export function useLandingPage({ onLoginSuccess, onNavigate, initialView = 'landing', appOnly = false }) {
  const { switchShop, switchRole } = useShop();
  const { i18n } = useTranslation();
  
  // Navigation & View Toggles
  const [showRegisterModal, setShowRegisterModal] = useState(initialView === 'register');
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [pricingPeriod, setPricingPeriod] = useState('monthly'); // 'monthly' | 'quarterly' | 'annual'
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'contact'
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const currentLang = i18n.language || 'fr';
  const isRtl = currentLang === 'ar';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const update = () => setShowBackToTop(window.scrollY > 650);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    const newLang = currentLang === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const lt = (key) => {
    const lang = currentLang === 'ar' ? 'ar' : 'fr';
    return landingTranslations[lang][key] || landingTranslations['fr'][key] || key;
  };

  // Registration Form State
  const [shopName, setShopName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerStep, setRegisterStep] = useState(1);

  const openRegistration = (plan = 'standard') => {
    setSelectedPlan(plan);
    setError('');
    setRegisterStep(1);
    setShowRegisterModal(true);
  };

  const formValue = (form, field, fallback) => {
    const input = form?.elements?.namedItem?.(field) || form?.elements?.[field];
    return typeof input?.value === 'string' ? input.value : fallback;
  };

  const goToCredentials = (event) => {
    const form = event?.currentTarget?.form || event?.currentTarget;
    const nameVal = formValue(form, 'register-name', adminName).trim();
    const emailVal = formValue(form, 'register-email', email).trim();

    if (!nameVal) {
      setError('Indiquez votre nom.');
      return;
    }
    if (nameVal.length > 100) {
      setError('Votre nom ne doit pas dépasser 100 caractères.');
      return;
    }
    if (emailVal.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setError('Indiquez une adresse email valide.');
      return;
    }
    setAdminName(nameVal);
    setEmail(emailVal);
    setError('');
    setRegisterStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerStep === 1) {
      goToCredentials(e);
      return;
    }

    // Les champs de la première étape peuvent être démontés par l'animation.
    const finalAdminName = adminName.trim();
    const finalEmail = email.trim();
    const finalShopName = formValue(e.currentTarget, 'register-shop', shopName).trim();
    const finalPassword = formValue(e.currentTarget, 'register-password', password);

    if (!finalAdminName) {
      setError('Indiquez votre nom.');
      return;
    }
    if (finalAdminName.length > 100) {
      setError('Votre nom ne doit pas dépasser 100 caractères.');
      return;
    }
    if (finalEmail.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
      setError('Indiquez une adresse email valide.');
      return;
    }
    if (!finalShopName) {
      setError('Indiquez le nom de votre boutique.');
      return;
    }
    if (finalShopName.length > 100) {
      setError('Le nom de la boutique ne doit pas dépasser 100 caractères.');
      return;
    }
    if (finalPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (new TextEncoder().encode(finalPassword).length > 72) {
      setError('Le mot de passe ne doit pas dépasser 72 octets.');
      return;
    }

    setLoading(true);
    setError('');
    let accountCreated = false;

    try {
      if (isTauriDesktop()) {
        await openDesktopVault(finalEmail, finalPassword);
      }

      const session = await registerCloudAccount({ shop_name: finalShopName, name: finalAdminName, email: finalEmail, password: finalPassword });
      accountCreated = true;
      const newUser = await restoreLocalOwnerFromCloud(session, finalPassword);
      const newShop = { id: session.shop.id };

      setBackupPassword(finalPassword);
      await switchShop(newShop.id);
      await startDesktopBackupForShop(newShop.id);
      switchRole('owner', finalAdminName, newUser.id);

      setLoading(false);
      setShowRegisterModal(false);
      onLoginSuccess('owner');
    } catch (err) {
      if (isTauriDesktop()) void closeDesktopVault();
      if (accountCreated) {
        setError('Votre compte et votre boutique sont créés. La préparation sur cet appareil a échoué. Connectez-vous pour réessayer.');
      } else if (/^name must be shorter than or equal to 100 characters$/i.test(err.message || '')) {
        setRegisterStep(1);
        setError('Votre nom ne doit pas dépasser 100 caractères.');
      } else if (/^shop_name must be shorter than or equal to 100 characters$/i.test(err.message || '')) {
        setError('Le nom de la boutique ne doit pas dépasser 100 caractères.');
      } else {
        setError(err.message || 'Une erreur est survenue lors de la création de la boutique.');
      }
      setLoading(false);
    }
  };

  // Scroll handler for smooth navigation
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  
  return {
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
  };
}
