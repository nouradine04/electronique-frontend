import { LandingHero } from '../../components/LandingHero';
import { FormStep, LoadingButton, StepProgress } from '../../components/forms/FormUI';
import { FormField, FormInput } from '../../components/ui/FormControls';
import { LandingNavbar } from '../../components/LandingNavbar';
import React, { useState, useEffect } from 'react';
import { InstallApp } from '../../components/InstallApp';
import './public-responsive.css';
import './landing-flow.css';
import { registerLocalShop } from '../../services/localAuth.js';
import { useShop } from '../../context/ShopContext.jsx';
import {
  Smartphone, ShieldCheck, Database, CheckCircle2, AlertCircle,
  ArrowRight, ArrowUp, Printer, Zap, X, Globe,
  User, Store, Mail, LockKeyhole
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import painCahierImg from '../../assets/pain_cahier.jpg';
import painRuptureImg from '../../assets/pain_rupture.jpg';
import painCreditImg from '../../assets/pain_credit.jpg';
import { useTranslation } from 'react-i18next';

const landingTranslations = {
  fr: {
    features: "Fonctionnalités",
    about: "À Propos",
    pricing: "Abonnement",
    contact: "Contact",
    login: "Connexion",
    freeTrial: "Essai gratuit",
    title: "La caisse intelligente sécurisée qui tourne à 100% hors-ligne.",
    subtitle: "Ne perdez plus jamais une vente à cause d'une coupure de courant ou d'internet. NStock chiffre vos données localement et synchronise dès que le réseau revient.",
    ctaTrial: "Essayer gratuitement",
    ctaDemo: "Démonstration en direct",
    painTitle: "Le commerce, c’est déjà assez compliqué.",
    painSub: "Sans outil adapté, vous perdez le fil. NStock est conçu pour vous simplifier la vie.",
    pain1QNormal: "Vous notez les ventes sur un cahier ",
    pain1QHighlight: "que vous perdez ou oubliez ?",
    pain1A: "NStock numérise et sécurise vos enregistrements de ventes instantanément, même hors-ligne. Fini les pages déchirées et les calculs d'apothicaire.",
    pain2QNormal: "Découvrir une rupture de stock ",
    pain2QHighlight: "au moment de vendre ?",
    pain2A: "Soyez notifié dès qu'un produit atteint son seuil d'alerte. Gérez vos réapprovisionnements en toute sérénité sans jamais rater une vente.",
    pain3QNormal: "Oublier combien de clients ",
    pain3QHighlight: "vous doivent de l'argent ?",
    pain3A: "NStock garde un historique précis et crypté des arriérés de chaque client. Encaissez les remboursements partiels en un clic et suivez les soldes en temps réel.",
    contactTitle: "Contactez-nous",
    contactSub: "Une question, un besoin d'assistance ou une démo personnalisée ? Remplissez ce formulaire pour nous envoyer un message directement sur WhatsApp.",
    contactName: "Nom Complet",
    contactShop: "Nom de votre Boutique",
    contactPhone: "Numéro de Téléphone",
    contactMsg: "Message",
    contactSend: "Envoyer sur WhatsApp",
    contactBack: "Retour à l'accueil"
  },
  ar: {
    features: "المميزات",
    about: "حول التطبيق",
    pricing: "الاشتراكات",
    contact: "اتصل بنا",
    login: "تسجيل الدخول",
    freeTrial: "نسخة تجريبية",
    title: "صندوق ذكي وآمن يعمل 100% بدون إنترنت.",
    subtitle: "لا تفقد أي بيع مرة أخرى بسبب انقطاع التيار الكهربائي أو الإنترنت. يقوم NStock بتشفير بياناتك محليًا ومزامنتها بمجرد عودة الشبكة.",
    ctaTrial: "ابدأ التجربة المجانية",
    ctaDemo: "عرض تجريبي حي",
    painTitle: "التجارة معقدة بما فيه الكفاية.",
    painSub: "بدون أداة مناسبة، ستفقد السيطرة. تم تصميم NStock لتبسيط حياتك.",
    pain1QNormal: "هل تسجل المبيعات في دفتر ",
    pain1QHighlight: "قد تفقده أو تنسى ملئه؟",
    pain1A: "يقوم NStock برقمنة وحفظ سجلات مبيعاتك فورًا، حتى بدون اتصال بالإنترنت. لا مزيد من الصفحات الممزقة أو الحسابات المعقدة.",
    pain2QNormal: "هل تكتشف نفاد المخزون ",
    pain2QHighlight: "عندما يكون العميل أمامك؟",
    pain2A: "احصل على تنبيه بمجرد وصول أي منتج إلى حد إعادة الطلب. أدر مخزونك بكل راحة بال ودون خسارة أي عميل.",
    pain3QNormal: "هل نسيت المبالغ المستحقة لك ",
    pain3QHighlight: "عند الزبائن؟",
    pain3A: "يحتفظ NStock بسجل دقيق ومشفر لديون كل عميل. استلم المدفوعات الجزئية بضغطة زر وتابع الأرصدة في وقتها الحقيقي.",
    contactTitle: "اتصل بنا",
    contactSub: "هل لديك سؤال، أو بحاجة إلى مساعدة أو عرض مخصص؟ املأ هذا النموذج لإرسال رسالة مباشرة إلينا عبر الواتساب.",
    contactName: "الاسم الكامل",
    contactShop: "اسم متجرك",
    contactPhone: "رقم الهاتف",
    contactMsg: "الرسالة",
    contactSend: "إرسال عبر واتساب",
    contactBack: "الرجوع للرئيسية"
  }
};

const BRAND = '#0e6ba8';

function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid var(--border-color)',
      padding: '16px 0',
      cursor: 'pointer'
    }} onClick={() => setIsOpen(!isOpen)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)', textAlign: 'left' }}>
          {question}
        </h3>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: BRAND, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease', display: 'inline-block', lineHeight: 1 }}>
          +
        </span>
      </div>
      {isOpen && (
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, textAlign: 'left', marginTop: '10px' }}>
          {answer}
        </p>
      )}
    </div>
  );
}

export function LandingPage({ onLoginSuccess, onNavigate, initialView = 'landing', appOnly = false }) {
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
  const [phone, setPhone] = useState('');
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
    if (!shopName.trim() || !adminName.trim()) {
      setError('Indiquez le nom de la boutique et votre nom.');
      return;
    }
    setError('');
    setRegisterStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Saisissez une adresse email valide.');
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      setLoading(false);
      return;
    }

    try {
      const shopCode = shopName.toUpperCase().replace(/\s+/g, '').slice(0, 4) + Math.floor(1000 + Math.random() * 9000);

      const { shop: newShop, user: newUser } = await registerLocalShop({
        name: shopName,
        code: shopCode,
        email,
        phone,
        password,
        adminName,
        subscriptionPlan: selectedPlan,
      });

      sessionStorage.setItem('encryption_pin', password);
      await switchShop(newShop.id);
      switchRole('owner', adminName, newUser.id);
      
      setLoading(false);
      setShowRegisterModal(false);
      onLoginSuccess('owner');
    } catch (err) {
      console.error(err);
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
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(14, 107, 168, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(14, 107, 168, 0); }
          100% { box-shadow: 0 0 0 0 rgba(14, 107, 168, 0); }
        }
        @keyframes drawLine {
          to { width: 100%; }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .pulsing-badge {
          animation: pulseGlow 2.5s infinite;
        }
        .hero-underline {
          position: relative;
          display: inline-block;
          white-space: nowrap;
        }
        .hero-underline::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 6px;
          background-color: #f59e0b; /* Golden marker highlight */
          border-radius: 4px;
          animation: drawLine 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
        }
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-scale:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.15);
        }
        
        /* Hero responsive scaling */
        .hero-title {
          font-size: 3.5rem;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin: 0 0 20px 0;
          color: var(--text-primary);
        }
        .hero-desc {
          font-size: 1.25rem;
          color: var(--text-secondary);
          max-width: 680px;
          line-height: 1.5;
          margin: 0 0 40px 0;
        }
        
        @media (max-width: 992px) {
          .landing-nav {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.1rem !important;
            line-height: 1.25 !important;
            letter-spacing: -0.8px !important;
          }
          .hero-desc {
            font-size: 1.05rem !important;
            margin-bottom: 28px !important;
            line-height: 1.45 !important;
          }
        }
        @media (max-width: 576px) {
          .landing-header {
            padding: 10px 16px !important;
            flex-direction: row !important; /* Single line alignment */
            justify-content: space-between !important;
            align-items: center !important;
            gap: 8px !important;
          }
          .landing-logo {
            width: clamp(76px, 21vw, 106px) !important;
            height: clamp(76px, 21vw, 106px) !important;
          }
          .landing-logo-text {
            font-size: 20px !important;
            letter-spacing: -0.8px !important;
          }
          .landing-actions {
            width: auto !important;
            gap: 6px !important;
          }
          .landing-actions button {
            font-size: 11px !important;
            padding: 6px 10px !important;
          }
        }
      `}</style>

      <LandingNavbar isRtl={isRtl} language={currentLang} theme={theme}
        onHome={() => { setCurrentView('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSection={(section) => { if (section === 'contact') setCurrentView('contact'); else { setCurrentView('landing'); setTimeout(() => scrollToSection(section), 100); } }}
        onLogin={() => onNavigate('login')} onRegister={() => openRegistration('standard')}
        onLanguage={toggleLanguage} onTheme={toggleTheme} />

      {/* Main Content */}
      <main className="landing-main" style={{ flex: 1, direction: isRtl ? 'rtl' : 'ltr' }}>
        
        {currentView === 'contact' ? (
          /* DEDICATED CONTACT PAGE */
          <section style={{ padding: '60px 20px', maxWidth: '600px', margin: '45px auto', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '40px 32px',
              boxShadow: 'var(--shadow-md)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                backgroundColor: 'rgba(14, 107, 168, 0.1)', color: BRAND,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
              }}>
                <Globe size={28} />
              </div>
              
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '12px' }}>
                {lt('contactTitle')}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                {lt('contactSub')}
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const name = fd.get('name');
                const shop = fd.get('shop');
                const phone = fd.get('phone');
                const msg = fd.get('message');
                const text = `Bonjour NStock! Je m'appelle ${name} (Boutique: ${shop}, Tél: ${phone}). Message: ${msg}`;
                window.open(`https://wa.me/905527863655?text=${encodeURIComponent(text)}`, '_blank');
              }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: isRtl ? 'right' : 'left' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {lt('contactName')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Ex: Fatima"
                    required
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)', fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {lt('contactShop')}
                  </label>
                  <input
                    type="text"
                    name="shop"
                    placeholder="Ex: Électronique Fatima"
                    required
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)', fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {lt('contactPhone')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Ex: +235 66 00 00 00"
                    required
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)', fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {lt('contactMsg')}
                  </label>
                  <textarea
                    name="message"
                    placeholder="Écrivez votre question ici..."
                    required
                    rows="4"
                    style={{
                      width: '100%', padding: '12px', borderRadius: '8px',
                      border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)', fontSize: '14px', resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%', backgroundColor: '#25d366', color: 'white',
                    border: 'none', padding: '14px', borderRadius: '8px',
                    fontWeight: '700', fontSize: '15px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    marginTop: '10px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}><path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.458 3.473 1.332 4.985l-1.354 4.954 5.074-1.33c1.46.797 3.097 1.217 4.762 1.217h.004c5.504 0 9.986-4.482 9.986-9.988 0-2.667-1.037-5.176-2.923-7.062-1.884-1.884-4.394-2.921-7.061-2.921zM6.924 8.24h.536c.162 0 .362.062.518.397.162.348.55 1.34.6 1.442.05.102.083.22.015.348-.067.129-.101.206-.2.32-.1.115-.21.258-.3.37-.1.109-.205.228-.088.428.118.2.523.86 1.12 1.393.77.689 1.42 1.05 1.623 1.155.203.105.321.088.44-.05.12-.137.513-.598.65-.8.136-.2.272-.17.458-.1.187.07 1.187.56 1.39.663.203.104.339.155.39.243.05.088.05.513-.153.722-.203.209-1.187 1.162-1.628 1.202-.44.04-1.018-.153-2.274-.658-1.583-.637-2.6-2.253-2.684-2.368-.084-.115-.678-.905-.678-1.724 0-.82.424-1.22.576-1.383.153-.162.339-.24.509-.24z"/></svg>
                  {lt('contactSend')}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentView('landing')}
                  style={{
                    width: '100%', backgroundColor: 'transparent', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px',
                    fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                  }}
                >
                  {lt('contactBack')}
                </button>
              </form>
            </div>
          </section>
        ) : (
          <>
            <LandingHero isRtl={isRtl} onStart={() => openRegistration('standard')} />

        {/* PAIN POINTS SECTION */}
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

        {/* FEATURES SECTION */}
        <section id="features" className="landing-section" style={{ backgroundColor: 'var(--bg-main)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '16px' }}>
              Pensé pour la réalité de votre commerce
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 60px auto' }}>
              Une application de gestion rapide, connectée au serveur mais 100% autonome sur le terrain.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
              
              {/* Card 1: Mode Hors-Ligne (Stand-out base blue background) */}
              <div className="hover-scale" style={{
                backgroundColor: BRAND,
                color: 'white',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 15px -3px rgba(14, 107, 168, 0.2)'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.18)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Zap size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', color: 'white' }}>
                  {isRtl ? "وضع عدم الاتصال المطلق" : "Mode Hors-Ligne Absolu"}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.45', margin: 0 }}>
                  {isRtl 
                    ? "لا يمكن لأي انقطاع في الكهرباء أو الإنترنت أن يعطل مبيعاتك. يتم حفظ كل شيء محلياً ومزامنته فور عودة الاتصال." 
                    : "Aucune coupure d'électricité ou d'internet ne perturbe vos ventes. Tout est enregistré localement et se synchronise automatiquement au retour de la connexion."}
                </p>
              </div>

              {/* Card 2: Données Sécurisées */}
              <div className="hover-scale" style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <ShieldCheck size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px' }}>
                  {isRtl ? "بيانات آمنة ومحمية" : "Données Sécurisées"}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.45', margin: 0 }}>
                  {isRtl 
                    ? "تبقى أرباحك، أسعار الشراء، وديون العملاء خاصة تماماً ومشفرة على جهازك. نحن لا نطلع ولا نجمع أيًا من بياناتك السرية." 
                    : "Vos bénéfices, prix d'achat et dettes clients restent strictement privés et chiffrés sur votre appareil. Nous ne relevons ni ne stockons aucune de vos données confidentielles."}
                </p>
              </div>

              {/* Card 3: Impression Thermique */}
              <div className="hover-scale" style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Printer size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px' }}>
                  {isRtl ? "الطباعة الحرارية وفواتير PDF" : "Impression Thermique & PDF"}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.45', margin: 0 }}>
                  {isRtl 
                    ? "أصدر فواتير احترافية بصيغة PDF أو اطبع الإيصالات مباشرة عبر ربط طابعات الكاشير الحرارية (بصيغة الرول أو التذكرة العادية)." 
                    : "Générez des factures professionnelles en PDF ou connectez directement une imprimante de caisse thermique (format rouleau ou ticket standard) pour vos reçus."}
                </p>
              </div>

              {/* Card 4: Multi-Boutiques */}
              <div className="hover-scale" style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(14, 107, 168, 0.1)', color: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Database size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px' }}>
                  {isRtl ? "إدارة الفروع والموظفين" : "Gestion Multi-Boutiques"}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.45', margin: 0 }}>
                  {isRtl 
                    ? "تابع أداء عدة فروع ومستودعات من حساب مالك واحد. أنشئ حسابات خاصة للبائعين أو المدراء مع صلاحيات وصول آمنة." 
                    : "Suivez plusieurs boutiques depuis un seul compte propriétaire. Créez des comptes dédiés pour vos caissiers ou gérants avec des droits d'accès sécurisés."}
                </p>
              </div>

            </div>
          </div>
        </section>

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

        {/* FAQ SECTION */}
        <section className="landing-section landing-faq" style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', textAlign: 'center', marginBottom: '16px' }}>
              Vous vous demandez peut-être…
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '48px' }}>
              Voici les réponses aux questions les plus fréquentes sur notre système.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <FaqItem 
                question="Est-ce que ça marche vraiment sans internet ?"
                answer="Oui, absolument ! NStock fonctionne en local-first. Toutes vos opérations (ventes, encaissements, mouvements de stock) sont enregistrées instantanément sur votre appareil. Dès que vous retrouvez une connexion (Wi-Fi ou données mobiles), l'application synchronise automatiquement vos données en arrière-plan avec le serveur sécurisé."
              />
              
              <FaqItem 
                question="Puis-je l’utiliser sur mon téléphone ?"
                answer="Oui. Choisissez votre appareil dans la rubrique Installer et suivez le guide affiché. Une fois installée, l’application s’ouvre depuis son icône et s’adapte à votre écran."
              />
              
              <FaqItem 
                question="Mes données sont-elles en sécurité ?"
                answer="Vos données sont chiffrées localement sur votre appareil avec un algorithme de cryptage robuste basé sur votre mot de passe de session. Même si l'appareil est inspecté ou volé, vos prix, clients et ventes restent illisibles. De plus, les sauvegardes exportées manuellement sont également cryptées."
              />
              
              <FaqItem 
                question="Comment je paie l’abonnement ?"
                answer="Nous acceptons les moyens de paiement les plus flexibles, notamment les solutions de Mobile Money (Airtel Money, Moov Money, etc.), virements bancaires ou paiements en espèces. Contactez notre équipe commerciale pour activer votre compte après votre période d'essai."
              />
              
              <FaqItem 
                question="C’est compliqué si je n’ai jamais utilisé d’application ?"
                answer="Pas du tout ! NStock a été conçu avec une interface ultra-simplifiée et mobile-first. Les boutons sont grands et les libellés sont clairs. La plupart des commerçants maîtrisent l'application en moins de 10 minutes d'utilisation."
              />
              
            </div>

          </div>
        </section>

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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content">
            <button
              onClick={() => appOnly ? onNavigate('login') : setShowRegisterModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
                Créer votre Caisse
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Initialisez votre caisse chiffrée. 15 jours d’essai gratuit.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '5px', borderRadius: '11px', background: 'var(--bg-main)', marginBottom: '18px' }}>
              {[
                { id: 'standard', label: 'Standard', detail: '1 boutique' },
                { id: 'multishop', label: 'Multi-boutiques', detail: 'jusqu’à 5' },
              ].map(plan => {
                const selected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      border: selected ? `1px solid ${BRAND}` : '1px solid transparent',
                      background: selected ? 'var(--bg-surface)' : 'transparent',
                      color: selected ? BRAND : 'var(--text-secondary)',
                      borderRadius: '8px',
                      padding: '9px 8px',
                      cursor: 'pointer',
                      boxShadow: selected ? '0 2px 8px rgba(14, 107, 168, 0.1)' : 'none',
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 800 }}>{plan.label}</span>
                    <span style={{ display: 'block', fontSize: '10px', marginTop: '2px', opacity: 0.78 }}>{plan.detail}</span>
                  </button>
                );
              })}
            </div>

            {error && !(
              (registerStep === 1 && (!shopName.trim() || !adminName.trim()))
              || (registerStep === 2 && (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8))
            ) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <StepProgress step={registerStep} total={2} />
            <form onSubmit={handleRegister} noValidate>
              <FormStep stepKey={registerStep}>
                {registerStep === 1 ? <>
                  <FormField id="register-shop" label="Nom de la boutique" error={error && !shopName.trim() ? 'Indiquez le nom de votre boutique.' : null}>
                    <FormInput id="register-shop" leadingIcon={<Store size={18} />} type="text" autoComplete="organization" placeholder="Ex. Électronique Fatima" value={shopName} onChange={(e) => { setShopName(e.target.value); setError(''); }} aria-invalid={Boolean(error && !shopName.trim())} autoFocus />
                  </FormField>
                  <FormField id="register-name" label="Votre nom" error={error && !adminName.trim() ? 'Indiquez votre nom.' : null}>
                    <FormInput id="register-name" leadingIcon={<User size={18} />} type="text" autoComplete="name" placeholder="Ex. Fatima" value={adminName} onChange={(e) => { setAdminName(e.target.value); setError(''); }} aria-invalid={Boolean(error && !adminName.trim())} />
                  </FormField>
                  <div className="form-actions"><button type="button" className="btn btn-primary" onClick={goToCredentials}>Continuer <ArrowRight size={17} /></button></div>
                </> : <>
                  <FormField id="register-email" label="Adresse email" error={error && !/^\S+@\S+\.\S+$/.test(email) ? 'Saisissez une adresse email valide.' : null}>
                    <FormInput id="register-email" leadingIcon={<Mail size={18} />} type="email" inputMode="email" autoComplete="email" placeholder="admin@maboutique.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} aria-invalid={Boolean(error && !/^\S+@\S+\.\S+$/.test(email))} autoFocus />
                  </FormField>
                  <FormField id="register-phone" label={<>Numéro de téléphone <span className="ui-optional">facultatif</span></>} help="Vous pourrez aussi utiliser ce numéro pour vous connecter.">
                    <FormInput id="register-phone" leadingIcon={<Smartphone size={18} />} type="tel" inputMode="tel" autoComplete="tel" placeholder="Ex. +221 77 000 00 00" value={phone} onChange={(e) => { setPhone(e.target.value); setError(''); }} />
                  </FormField>
                  <FormField id="register-password" label="Mot de passe" error={error && password.length < 8 ? 'Utilisez au moins 8 caractères.' : null} help="Il protège aussi les données enregistrées sur cet appareil.">
                    <FormInput id="register-password" leadingIcon={<LockKeyhole size={18} />} type="password" autoComplete="new-password" placeholder="8 caractères minimum" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} aria-invalid={Boolean(error && password.length < 8)} />
                  </FormField>
                  <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => { setError(''); setRegisterStep(1); }}>Retour</button><LoadingButton type="submit" loading={loading} className="btn btn-primary">Créer ma boutique</LoadingButton></div>
                </>}
              </FormStep>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Vous avez déjà un compte ?{' '}
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  onNavigate('login');
                }}
                style={{ background: 'none', border: 'none', color: BRAND, fontWeight: '700', padding: 0, cursor: 'pointer' }}
              >
                Se connecter
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
