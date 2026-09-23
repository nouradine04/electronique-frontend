import { landingTranslations } from './translations';

import { useState, useEffect } from 'react';

import { restoreLocalOwnerFromCloud } from '../../../services/localAuth.js';
import { closeDesktopVault, isTauriDesktop, openDesktopVault } from '../../../services/desktopVault';
import { startDesktopBackupForShop } from '../../../services/desktopBackup';
import { NetworkError } from '../../../services/session';
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

  const goToCredentials = () => {
    if (!adminName.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Indiquez votre nom et une adresse email valide.');
      return;
    }
    setError('');
    setRegisterStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!shopName.trim()) {
      setError('Indiquez le nom de votre boutique.');
      setLoading(false);
      return;
    }
    if (!adminName.trim()) {
      setError('Indiquez votre nom complet.');
      setLoading(false);
      return;
    }
    if (password.trim().length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères (sans espaces).');
      setLoading(false);
      return;
    }

    try {
      if (!navigator.onLine) throw new NetworkError('Connexion Internet requise pour créer votre compte.');

      if (isTauriDesktop()) {
        await openDesktopVault(email, password);
      }

      const session = await registerCloudAccount({ shop_name: shopName, name: adminName, email, password });
      const newUser = await restoreLocalOwnerFromCloud(session, password);
      const newShop = { id: session.shop.id };

      setBackupPassword(password);
      await switchShop(newShop.id);
      await startDesktopBackupForShop(newShop.id);
      switchRole('owner', adminName, newUser.id);
      
      setLoading(false);
      setShowRegisterModal(false);
      onLoginSuccess('owner');
    } catch (err) {
      if (isTauriDesktop()) void closeDesktopVault();
      setError(err.message || 'Une erreur est survenue lors de la création de la boutique.');
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
