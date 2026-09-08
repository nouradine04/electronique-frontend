import React, { useState, useEffect } from 'react';
import { registerLocalShop } from '../../services/localAuth.js';
import { useShop } from '../../context/ShopContext.jsx';
import { 
  Laptop, Tablet, Smartphone, ShieldCheck, Database, CheckCircle2, AlertCircle, ShoppingBag, 
  ArrowRight, ShieldAlert, Cpu, Sparkles, Printer, Zap, RefreshCw, X, ChevronRight, Globe, Sun, Moon,
  LayoutDashboard, Package, TrendingUp, User, ShoppingCart
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

export function LandingPage({ onLoginSuccess, onNavigate, initialView = 'landing' }) {
  const { switchShop, switchRole } = useShop();
  const { i18n } = useTranslation();
  
  // Navigation & View Toggles
  const [showRegisterModal, setShowRegisterModal] = useState(initialView === 'register');
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [activeDeviceTab, setActiveDeviceTab] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [mobileMockupScreen, setMobileMockupScreen] = useState('dashboard'); // 'dashboard' | 'pos' | 'alerts'
  const [pricingPeriod, setPricingPeriod] = useState('monthly'); // 'monthly' | 'quarterly' | 'annual'
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'contact'
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const currentLang = i18n.language || 'fr';
  const isRtl = currentLang === 'ar';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  const openRegistration = (plan = 'standard') => {
    setSelectedPlan(plan);
    setError('');
    setShowRegisterModal(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!shopName || !adminName || !email || !password) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    try {
      const shopCode = shopName.toUpperCase().replace(/\s+/g, '').slice(0, 4) + Math.floor(1000 + Math.random() * 9000);

      const newShop = await registerLocalShop({
        name: shopName,
        code: shopCode,
        email,
        password,
        adminName,
        subscriptionPlan: selectedPlan,
      });

      sessionStorage.setItem('encryption_pin', password);
      await switchShop(newShop.id);
      switchRole('owner', adminName);
      
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
    <div style={{
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
            width: 46px !important;
            height: 46px !important;
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

      {/* Header / Navbar */}
      <header className="landing-header" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 40px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        opacity: 0.98,
        direction: isRtl ? 'rtl' : 'ltr'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => { setCurrentView('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <img src={logoImg} alt="Logo" className="landing-logo" style={{ width: '80px', height: '80px', objectFit: 'contain', transition: 'transform 0.2s ease' }} />
          <span className="landing-logo-text" style={{ fontSize: '34px', fontWeight: '900', color: BRAND, letterSpacing: '-1.5px', fontFamily: '"Inter", system-ui, sans-serif' }}>
            N<span style={{ color: 'var(--text-primary)', fontWeight: '400' }}>Stock</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="landing-nav" style={{ display: 'flex', gap: '24px' }}>
          <button onClick={() => { setCurrentView('landing'); setTimeout(() => scrollToSection('features'), 100); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>{lt('features')}</button>
          <button onClick={() => { setCurrentView('landing'); setTimeout(() => scrollToSection('about'), 100); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>{lt('about')}</button>
          <button onClick={() => { setCurrentView('landing'); setTimeout(() => scrollToSection('pricing'), 100); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>{lt('pricing')}</button>
          <button onClick={() => setCurrentView('contact')} style={{ background: 'none', border: 'none', color: currentView === 'contact' ? BRAND : 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>{lt('contact')}</button>
        </nav>

        <div className="landing-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            style={{ padding: '6px', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
            title="Changer la langue"
          >
            <Globe size={18} />
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase' }}>{currentLang}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{ padding: '6px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
            title="Changer le thème"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button 
            onClick={() => onNavigate('login')}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {lt('login')}
          </button>
          <button 
            onClick={() => openRegistration('standard')}
            style={{
              backgroundColor: BRAND,
              color: 'white',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: '0 4px 6px -1px rgba(14, 107, 168, 0.15)'
            }}
          >
            S'inscrire
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, direction: isRtl ? 'rtl' : 'ltr' }}>
        
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
            {/* HERO SECTION */}
            <section className="landing-section" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}>
          <div className="animate-fade-in-up" style={{ maxWidth: '850px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="pulsing-badge" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(14, 107, 168, 0.08)',
              color: BRAND,
              padding: '8px 16px',
              borderRadius: '30px',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '24px',
              boxShadow: '0 0 12px rgba(14, 107, 168, 0.05)'
            }}>
              <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} /> 15 Jours d'Essai Gratuit — Sans engagement
            </div>
            
            <h1 className="hero-title">
              {isRtl ? "صندوق مبيعاتك " : "Votre caisse intelligente "}<br/>
              <span className="hero-underline" style={{ color: BRAND }}>
                {isRtl ? "100% بدون إنترنت." : "100% hors-ligne."}
              </span>
            </h1>
            
            <p className="hero-desc">
              {isRtl 
                ? "جربه مجاناً لمدة 15 يوماً — بدون التزام ولا بطاقة بنكية." 
                : "Essayez gratuitement pendant 15 jours — sans engagement ni carte bancaire."}
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '64px' }}>
              <button
                onClick={() => openRegistration('standard')}
                style={{
                  backgroundColor: BRAND,
                  color: 'white',
                  border: 'none',
                  padding: '16px 36px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 10px 15px -3px rgba(14, 107, 168, 0.25)'
                }}
              >
                Créer ma Boutique <ArrowRight size={18} />
              </button>
              <button
                onClick={() => scrollToSection('features')}
                style={{
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '16px 36px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Découvrir les fonctionnalités
              </button>
            </div>
          </div>

          {/* INTERACTIVE DEVICE SWITCHER & SIMULATOR */}
          <div className="animate-float" style={{ width: '100%', maxWidth: '850px', marginTop: '16px' }}>
            
            {/* Switch Tabs */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              padding: '6px',
              borderRadius: '30px',
              marginBottom: '32px',
              gap: '4px'
            }}>
              <button
                onClick={() => setActiveDeviceTab('desktop')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  backgroundColor: activeDeviceTab === 'desktop' ? 'var(--bg-surface)' : 'transparent',
                  color: activeDeviceTab === 'desktop' ? BRAND : 'var(--text-secondary)',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '13px',
                  boxShadow: activeDeviceTab === 'desktop' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <Laptop size={16} /> Ordinateur (Admin)
              </button>
              <button
                onClick={() => setActiveDeviceTab('tablet')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  backgroundColor: activeDeviceTab === 'tablet' ? 'var(--bg-surface)' : 'transparent',
                  color: activeDeviceTab === 'tablet' ? BRAND : 'var(--text-secondary)',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '13px',
                  boxShadow: activeDeviceTab === 'tablet' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <Tablet size={16} /> Tablette (Vente)
              </button>
              <button
                onClick={() => setActiveDeviceTab('mobile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  backgroundColor: activeDeviceTab === 'mobile' ? 'var(--bg-surface)' : 'transparent',
                  color: activeDeviceTab === 'mobile' ? BRAND : 'var(--text-secondary)',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '13px',
                  boxShadow: activeDeviceTab === 'mobile' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <Smartphone size={16} /> Smartphone (Alertes)
              </button>
            </div>

            {/* Screen Simulator Box */}
            <div className="animate-float mockup-wrapper-container">
              
              {activeDeviceTab === 'desktop' && (
                /* HIGH FIDELITY MACBOOK PRO MOCKUP */
                <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Laptop screen */}
                  <div style={{
                    width: '100%',
                    aspectRatio: '16/10',
                    backgroundColor: '#0f172a',
                    borderRadius: '20px 20px 0 0',
                    border: '14px solid #080a0f',
                    borderBottom: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Camera lens */}
                    <div style={{ position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1e293b', zIndex: 10 }}></div>
                    {/* Screen reflection/glare */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 50%)', pointerEvents: 'none', zIndex: 5 }}></div>
                    
                    {/* Mock Browser URL Bar */}
                    <div style={{
                      height: '32px',
                      backgroundColor: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 16px',
                      gap: '8px',
                      borderBottom: '1px solid #334155'
                    }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
                      </div>
                      <div style={{
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        backgroundColor: '#0f172a',
                        borderRadius: '6px',
                        fontSize: '10px',
                        padding: '3px 24px',
                        color: '#64748b',
                        fontFamily: 'var(--font-sans)',
                        letterSpacing: '0.5px'
                      }}>
                        app.nstock.com/admin
                      </div>
                    </div>

                    {/* Inside content */}
                    <div style={{ flex: 1, backgroundColor: '#0f172a', color: '#f8fafc', padding: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Tableau de bord Propriétaire</span>
                          <span style={{ fontSize: '10px', backgroundColor: '#0e6ba8', padding: '4px 8px', borderRadius: '4px' }}>En Ligne</span>
                        </div>
                        {/* Simulated Mini Charts */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Chiffre d'Affaires</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>1 450 000 F</div>
                          </div>
                          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Bénéfice Net</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6', marginTop: '4px' }}>390 000 F</div>
                          </div>
                          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Clients Actifs</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>128</div>
                          </div>
                        </div>
                        <div style={{ flex: 1, backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Ventes par jour (FCFA)</span>
                          <div style={{ display: 'flex', alignItems: 'flex-end', height: '60px', gap: '8px', paddingBottom: '4px', borderBottom: '1px solid #334155' }}>
                            <div style={{ flex: 1, height: '40%', backgroundColor: BRAND, borderRadius: '4px 4px 0 0' }}></div>
                            <div style={{ flex: 1, height: '60%', backgroundColor: BRAND, borderRadius: '4px 4px 0 0' }}></div>
                            <div style={{ flex: 1, height: '90%', backgroundColor: BRAND, borderRadius: '4px 4px 0 0' }}></div>
                            <div style={{ flex: 1, height: '75%', backgroundColor: BRAND, borderRadius: '4px 4px 0 0' }}></div>
                            <div style={{ flex: 1, height: '55%', backgroundColor: BRAND, borderRadius: '4px 4px 0 0' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Keyboard Base */}
                  <div style={{
                    width: '108%',
                    height: '16px',
                    background: 'linear-gradient(to bottom, #cfd8dc 0%, #b0bec5 40%, #90a4ae 100%)',
                    borderRadius: '0 0 16px 16px',
                    borderTop: '1px solid #eceff1',
                    position: 'relative',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                  }}>
                    {/* Opener Notch */}
                    <div style={{
                      width: '80px',
                      height: '5px',
                      backgroundColor: '#78909c',
                      margin: '0 auto',
                      borderRadius: '0 0 5px 5px'
                    }}></div>
                  </div>
                </div>
              )}

              {activeDeviceTab === 'tablet' && (
                /* HIGH FIDELITY IPAD PRO MOCKUP */
                <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
                  <div style={{
                    width: '100%',
                    aspectRatio: '4/3',
                    backgroundColor: '#0f172a',
                    borderRadius: '30px',
                    border: '20px solid #080a0f', // Bezel
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
                    outline: '3px solid #374151', // iPad aluminum outer rim
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* FaceID Camera lens */}
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1f2937', zIndex: 10 }}></div>
                    
                    {/* Inner content container */}
                    <div style={{ flex: 1, backgroundColor: '#0f172a', color: '#f8fafc', padding: '16px', textAlign: 'left', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '8px' }}>
                      <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
                        {/* Left Product Catalog */}
                        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Interface Caisse (POS)</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', overflowY: 'auto' }}>
                            <div style={{ backgroundColor: '#1e293b', padding: '8px', borderRadius: '6px', fontSize: '10px' }}>
                              <div style={{ height: '40px', backgroundColor: '#334155', borderRadius: '4px', marginBottom: '4px' }}></div>
                              <strong>iPhone 15</strong>
                              <div style={{ color: BRAND, marginTop: '2px' }}>750 000 F</div>
                            </div>
                            <div style={{ backgroundColor: '#1e293b', padding: '8px', borderRadius: '6px', fontSize: '10px' }}>
                              <div style={{ height: '40px', backgroundColor: '#334155', borderRadius: '4px', marginBottom: '4px' }}></div>
                              <strong>Samsung S24</strong>
                              <div style={{ color: BRAND, marginTop: '2px' }}>620 000 F</div>
                            </div>
                          </div>
                        </div>
                        {/* Right Cart */}
                        <div style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '10px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #334155', paddingBottom: '4px', marginBottom: '6px' }}>Panier</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>iPhone 15 x1</span>
                              <span>750 000 F</span>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', borderTop: '1px solid #334155', paddingTop: '6px', marginBottom: '6px' }}>
                              <span>Total :</span>
                              <span>750 000 F</span>
                            </div>
                            <button style={{ width: '100%', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', fontWeight: 'bold' }}>Valider la Vente</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDeviceTab === 'mobile' && (
                /* HIGH FIDELITY IPHONE 15 PRO MOCKUP */
                <div style={{ maxWidth: '290px', margin: '0 auto', position: 'relative' }}>
                  
                  {/* Physical Side Buttons (Absolute positioned relative to mockup wrapper) */}
                  {/* Action Button (Left side top) */}
                  <div style={{ position: 'absolute', left: '-15.5px', top: '70px', width: '3.5px', height: '14px', backgroundColor: '#374151', borderRadius: '2px 0 0 2px', borderLeft: '1px solid #4b5563', zIndex: 5 }}></div>
                  {/* Volume Up (Left side middle) */}
                  <div style={{ position: 'absolute', left: '-15.5px', top: '96px', width: '3.5px', height: '26px', backgroundColor: '#374151', borderRadius: '2px 0 0 2px', borderLeft: '1px solid #4b5563', zIndex: 5 }}></div>
                  {/* Volume Down (Left side bottom) */}
                  <div style={{ position: 'absolute', left: '-15.5px', top: '130px', width: '3.5px', height: '26px', backgroundColor: '#374151', borderRadius: '2px 0 0 2px', borderLeft: '1px solid #4b5563', zIndex: 5 }}></div>
                  {/* Power Button (Right side) */}
                  <div style={{ position: 'absolute', right: '-15.5px', top: '115px', width: '3.5px', height: '48px', backgroundColor: '#374151', borderRadius: '0 2px 2px 0', borderRight: '1px solid #4b5563', zIndex: 5 }}></div>

                  {/* Phone Body Container */}
                  <div style={{
                    width: '100%',
                    aspectRatio: '9/19.5',
                    backgroundColor: '#0f172a',
                    borderRadius: '42px',
                    border: '12px solid #0c0d12', // Bezel
                    outline: '3.5px solid #6b7280', // Matte Titanium frame outer outline
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* iOS Top Status Bar */}
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      height: '32px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0 24px',
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#1e293b',
                      zIndex: 25,
                      pointerEvents: 'none',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                    }}>
                      <span>9:41</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {/* Signal bar icon */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: '8px' }}>
                          <div style={{ width: '2px', height: '30%', backgroundColor: '#1e293b', borderRadius: '0.5px' }}></div>
                          <div style={{ width: '2px', height: '50%', backgroundColor: '#1e293b', borderRadius: '0.5px' }}></div>
                          <div style={{ width: '2px', height: '70%', backgroundColor: '#1e293b', borderRadius: '0.5px' }}></div>
                          <div style={{ width: '2px', height: '95%', backgroundColor: '#1e293b', borderRadius: '0.5px' }}></div>
                        </div>
                        <span style={{ fontSize: '8px', fontWeight: '800' }}>5G</span>
                        {/* Battery indicator */}
                        <div style={{ width: '18px', height: '10px', border: '1px solid #1e293b', borderRadius: '3px', position: 'relative', display: 'flex', alignItems: 'center', padding: '1px' }}>
                          <div style={{ width: '80%', height: '100%', backgroundColor: '#10b981', borderRadius: '1.5px' }}></div>
                          <div style={{ width: '1px', height: '3px', backgroundColor: '#1e293b', position: 'absolute', right: '-2px', top: '2.5px', borderRadius: '0 1px 1px 0' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Island */}
                    <div style={{
                      position: 'absolute',
                      top: '7px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '85px',
                      height: '21px',
                      backgroundColor: '#000000',
                      borderRadius: '20px',
                      zIndex: 30,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}>
                      {/* Front camera lens reflections */}
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#111827', border: '1px solid #1f2937' }}></div>
                      <div style={{ width: '4.5px', height: '4.5px', borderRadius: '50%', backgroundColor: '#0c0d12' }}></div>
                    </div>

                    {/* Inside Screen Content */}
                    <div style={{ flex: 1, backgroundColor: '#f8fafc', color: '#1e293b', padding: '38px 0 0 0', textAlign: 'left', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '32px' }}>
                      
                      {/* Interactive View Selector Content */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px 12px' }}>
                        
                        {/* SCREEN 1: SALES DASHBOARD (Matched to your uploaded reference image) */}
                        {mobileMockupScreen === 'dashboard' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Header Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Sales Overview</h3>
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px 6px', fontSize: '8px', fontWeight: '600', color: '#64748b'
                              }}>
                                📅 Aug 17, 2026 ▾
                              </div>
                            </div>

                            {/* 2x2 KPI Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                              {/* KPI 1 */}
                              <div style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: '600' }}>Total Revenue</div>
                                <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>$142,931</div>
                                <div style={{ fontSize: '7.5px', color: '#10b981', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '1px' }}>
                                  ▲ +13.45%
                                </div>
                              </div>
                              {/* KPI 2 */}
                              <div style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: '600' }}>Average Order</div>
                                <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>$1,125</div>
                                <div style={{ fontSize: '7.5px', color: '#ef4444', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '1px' }}>
                                  ▼ -3.32%
                                </div>
                              </div>
                              {/* KPI 3 */}
                              <div style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: '600' }}>Total Customers</div>
                                <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>424</div>
                                <div style={{ fontSize: '7.5px', color: '#10b981', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '1px' }}>
                                  ▲ +23.42%
                                </div>
                              </div>
                              {/* KPI 4 */}
                              <div style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                                <div style={{ fontSize: '8px', color: '#64748b', fontWeight: '600' }}>Total Order</div>
                                <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>593</div>
                                <div style={{ fontSize: '7.5px', color: '#10b981', fontWeight: '700', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '1px' }}>
                                  ▲ +38.2%
                                </div>
                              </div>
                            </div>

                            {/* Trending Items Section */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a' }}>Trending Items</span>
                                <span style={{ fontSize: '8px', color: BRAND, fontWeight: '700', cursor: 'default' }}>See All</span>
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {/* Row 1 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: '8px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>📱</div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#0f172a' }}>iPhone 16</div>
                                    <div style={{ fontSize: '7.5px', color: '#64748b' }}>Apple</div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#0f172a' }}>284</div>
                                    <div style={{ fontSize: '7px', color: '#10b981', fontWeight: '700' }}>▲ +4.2% Sales</div>
                                  </div>
                                </div>
                                {/* Row 2 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: '8px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>💻</div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#0f172a' }}>MacBook Air M3</div>
                                    <div style={{ fontSize: '7.5px', color: '#64748b' }}>Apple</div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#0f172a' }}>184</div>
                                    <div style={{ fontSize: '7px', color: '#10b981', fontWeight: '700' }}>▲ +5.2% Sales</div>
                                  </div>
                                </div>
                                {/* Row 3 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: '8px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚙️</div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#0f172a' }}>Arduino Uno R3</div>
                                    <div style={{ fontSize: '7.5px', color: '#64748b' }}>Arduino</div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#0f172a' }}>136</div>
                                    <div style={{ fontSize: '7px', color: '#10b981', fontWeight: '700' }}>▲ +3.3% Sales</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SCREEN 2: MOBILE CAISSE / POS */}
                        {mobileMockupScreen === 'pos' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Search bar */}
                            <div style={{ marginTop: '4px' }}>
                              <input
                                type="text"
                                placeholder="Rechercher un produit..."
                                readOnly
                                style={{
                                  width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0',
                                  backgroundColor: '#ffffff', fontSize: '9px', color: '#64748b', outline: 'none'
                                }}
                              />
                            </div>

                            {/* POS Items List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div>
                                  <strong style={{ fontSize: '10px', color: '#0f172a' }}>iPhone 15 Pro</strong>
                                  <div style={{ fontSize: '8px', color: '#10b981', fontWeight: '700', marginTop: '1px' }}>En stock: 12</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '10px', fontWeight: '800', color: BRAND }}>750 000 F</span>
                                  <button style={{ backgroundColor: BRAND, color: 'white', border: 'none', width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>+</button>
                                </div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div>
                                  <strong style={{ fontSize: '10px', color: '#0f172a' }}>Samsung S24</strong>
                                  <div style={{ fontSize: '8px', color: '#10b981', fontWeight: '700', marginTop: '1px' }}>En stock: 8</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '10px', fontWeight: '800', color: BRAND }}>620 000 F</span>
                                  <button style={{ backgroundColor: BRAND, color: 'white', border: 'none', width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>+</button>
                                </div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div>
                                  <strong style={{ fontSize: '10px', color: '#0f172a' }}>Arduino Uno R3</strong>
                                  <div style={{ fontSize: '8px', color: '#10b981', fontWeight: '700', marginTop: '1px' }}>En stock: 45</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '10px', fontWeight: '800', color: BRAND }}>15 000 F</span>
                                  <button style={{ backgroundColor: BRAND, color: 'white', border: 'none', width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>+</button>
                                </div>
                              </div>
                            </div>

                            {/* Floating cart panel indicator */}
                            <div style={{ backgroundColor: BRAND, color: 'white', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8.5px', fontWeight: '800', marginTop: '8px', boxShadow: '0 4px 6px -1px rgba(14, 107, 168, 0.2)' }}>
                              <span>🛒 Panier (2 produits)</span>
                              <span>1 370 000 F CFA</span>
                            </div>
                          </div>
                        )}

                        {/* SCREEN 3: STOCK ALERTS */}
                        {mobileMockupScreen === 'alerts' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>Alertes & Sécurité</div>
                            
                            <div style={{ backgroundColor: '#fff', border: '1px solid #fee2e2', borderLeft: '3px solid #ef4444', padding: '8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px' }}>
                              <div>
                                <strong style={{ color: '#0f172a' }}>Arduino Nano V3.0</strong>
                                <div style={{ color: '#64748b', fontSize: '7.5px', marginTop: '1px' }}>Seuil minimum: 10</div>
                              </div>
                              <span style={{ color: '#ef4444', fontWeight: '800', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '8px', fontSize: '7.5px' }}>Stock: 2</span>
                            </div>

                            <div style={{ backgroundColor: '#fff', border: '1px solid #fffbeb', borderLeft: '3px solid #f59e0b', padding: '8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px' }}>
                              <div>
                                <strong style={{ color: '#0f172a' }}>Capteur DHT22</strong>
                                <div style={{ color: '#64748b', fontSize: '7.5px', marginTop: '1px' }}>Seuil minimum: 8</div>
                              </div>
                              <span style={{ color: '#f59e0b', fontWeight: '800', backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '8px', fontSize: '7.5px' }}>Stock: 5</span>
                            </div>

                            {/* AES-256 local database info card */}
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8.5px', fontWeight: '800', color: '#10b981' }}>
                                <ShieldCheck size={11} /> Base locale sécurisée
                              </div>
                              <p style={{ fontSize: '7.5px', color: '#64748b', lineHeight: '1.3', margin: 0 }}>
                                Tous les prix d'achat, marges et données de crédit clients sont cryptés localement à l'aide d'un algorithme de flux. Personne d'autre ne peut y accéder via le navigateur.
                              </p>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Interactive Mockup Bottom Bar Navigation */}
                      <div style={{
                        height: '42px',
                        backgroundColor: '#ffffff',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        paddingBottom: '2px',
                        zIndex: 25
                      }}>
                        <button
                          onClick={() => setMobileMockupScreen('dashboard')}
                          style={{
                            background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
                            color: mobileMockupScreen === 'dashboard' ? BRAND : '#94a3b8', cursor: 'pointer', gap: '2px', padding: 0
                          }}
                        >
                          <LayoutDashboard size={14} />
                          <span style={{ fontSize: '7px', fontWeight: '800' }}>Dashboard</span>
                        </button>
                        <button
                          onClick={() => setMobileMockupScreen('pos')}
                          style={{
                            background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
                            color: mobileMockupScreen === 'pos' ? BRAND : '#94a3b8', cursor: 'pointer', gap: '2px', padding: 0
                          }}
                        >
                          <ShoppingCart size={14} />
                          <span style={{ fontSize: '7px', fontWeight: '800' }}>Caisse</span>
                        </button>
                        <button
                          onClick={() => setMobileMockupScreen('alerts')}
                          style={{
                            background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
                            color: mobileMockupScreen === 'alerts' ? BRAND : '#94a3b8', cursor: 'pointer', gap: '2px', padding: 0
                          }}
                        >
                          <ShieldAlert size={14} />
                          <span style={{ fontSize: '7px', fontWeight: '800' }}>Alertes</span>
                        </button>
                      </div>

                    </div>

                    {/* iOS Home Sweep Indicator Bar */}
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '100px',
                      height: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.45)',
                      borderRadius: '2px',
                      zIndex: 30
                    }}></div>
                  </div>
                </div>
              )}
              
            </div>

          </div>
        </section>

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

        {/* ABOUT / MISSION SECTION */}
        <section id="about" className="landing-section" style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '20px' }}>
              Pourquoi NStock ?
            </h2>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>
              Pour de nombreux commerçants à travers le monde, la continuité de l'énergie et la stabilité d'Internet sont de vrais défis quotidiens. Une panne de réseau ne devrait pas arrêter les ventes ni masquer vos comptes de crédit. 
            </p>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '40px' }}>
              NStock est conçu spécifiquement pour relever ce défi : une application légère qui s'exécute comme un logiciel traditionnel de caisse, protégeant vos comptes par cryptage et simplifiant la gestion des stocks, des crédits clients et du bénéfice net de votre boutique.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: BRAND }}>
              La transition numérique simple, abordable et sécurisée.
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', textAlign: isRtl ? 'right' : 'left', direction: isRtl ? 'rtl' : 'ltr' }}>
              
              {/* Desktop Card */}
              <div className="hover-scale" style={{ backgroundColor: 'var(--bg-surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(14, 107, 168, 0.1)', color: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Laptop size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '12px' }}>
                  {isRtl ? "جهاز الكمبيوتر (ويندوز / ماك)" : "Ordinateur (PC / Mac)"}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>
                  {isRtl 
                    ? "حمّل النسخة المكتبية فائقة السرعة، والمصممة لتوفير استقرار لا مثيل له. تعمل بكفاءة تامة حتى بدون إنترنت." 
                    : "Téléchargez la version bureau ultra-rapide (Tauri). Indépendante de votre navigateur pour une stabilité sans faille, même hors-ligne."}
                </p>
                <button style={{
                  marginTop: '24px', width: '100%', padding: '12px', borderRadius: '8px', 
                  backgroundColor: BRAND, color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}>
                  <ArrowRight size={16} /> {isRtl ? "تحميل للكمبيوتر" : "Télécharger pour PC"}
                </button>
              </div>

              {/* Mobile Card */}
              <div className="hover-scale" style={{ backgroundColor: 'var(--bg-surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Smartphone size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '12px' }}>
                  {isRtl ? "الهاتف (أندرويد / iOS)" : "Smartphone (Android / iOS)"}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>
                  {isRtl 
                    ? "افتح الموقع من هاتفك، واضغط على 'إضافة إلى الشاشة الرئيسية'. ستظهر أيقونة NStock بين تطبيقاتك الأخرى فوراً." 
                    : "Ouvrez ce site sur votre téléphone et cliquez sur « Ajouter à l'écran d'accueil ». L'icône apparaîtra directement parmi vos autres applications !"}
                </p>
                <div style={{ marginTop: '24px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px dashed var(--border-color)', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {isRtl ? "متوفر عبر المتصفح (PWA)" : "Installation Express (PWA)"}
                </div>
              </div>

              {/* Tablet Card */}
              <div className="hover-scale" style={{ backgroundColor: 'var(--bg-surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Tablet size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '12px' }}>
                  {isRtl ? "الجهاز اللوحي (آيباد / أندرويد)" : "Tablette (iPad / Android)"}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>
                  {isRtl 
                    ? "مثالي لنقاط البيع. ثبّت التطبيق مباشرة من متصفحك ليصبح تطبيقًا كاملاً بملء الشاشة، بدون أشرطة بحث مزعجة." 
                    : "Idéal pour tenir votre caisse. Installez-le depuis votre navigateur pour en faire une vraie application plein écran, sans barre de recherche."}
                </p>
                <div style={{ marginTop: '24px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px dashed var(--border-color)', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {isRtl ? "متوفر عبر المتصفح (PWA)" : "Installation Express (PWA)"}
                </div>
              </div>

            </div>
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
        <section className="landing-section" style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)' }}>
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
                answer="Oui. NStock est une PWA (Progressive Web App). Vous pouvez l'installer directement sur n'importe quel smartphone Android ou iPhone en choisissant 'Ajouter à l'écran d'accueil' depuis votre navigateur. L'interface s'adaptera parfaitement à la taille de votre écran."
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

            <div style={{ textAlign: 'center', marginTop: '48px' }}>
              <a 
                href="https://wa.me/905527863655" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  backgroundColor: '#25d366', 
                  color: 'white', 
                  padding: '14px 28px', 
                  borderRadius: '30px', 
                  fontWeight: '700', 
                  fontSize: '15px', 
                  textDecoration: 'none',
                  boxShadow: '0 8px 16px rgba(37, 211, 102, 0.2)' 
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}><path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.458 3.473 1.332 4.985l-1.354 4.954 5.074-1.33c1.46.797 3.097 1.217 4.762 1.217h.004c5.504 0 9.986-4.482 9.986-9.988 0-2.667-1.037-5.176-2.923-7.062-1.884-1.884-4.394-2.921-7.061-2.921zM6.924 8.24h.536c.162 0 .362.062.518.397.162.348.55 1.34.6 1.442.05.102.083.22.015.348-.067.129-.101.206-.2.32-.1.115-.21.258-.3.37-.1.109-.205.228-.088.428.118.2.523.86 1.12 1.393.77.689 1.42 1.05 1.623 1.155.203.105.321.088.44-.05.12-.137.513-.598.65-.8.136-.2.272-.17.458-.1.187.07 1.187.56 1.39.663.203.104.339.155.39.243.05.088.05.513-.153.722-.203.209-1.187 1.162-1.628 1.202-.44.04-1.018-.153-2.274-.658-1.583-.637-2.6-2.253-2.684-2.368-.084-.115-.678-.905-.678-1.724 0-.82.424-1.22.576-1.383.153-.162.339-.24.509-.24z"/></svg>
                Une autre question ? — Écrivez-nous sur WhatsApp
              </a>
            </div>
          </div>
        </section>
      </>
    )}
  </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 40px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '12px',
        color: 'var(--text-muted)',
        backgroundColor: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '16px' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => scrollToSection('features')}>Fonctionnalités</span>
          <span style={{ cursor: 'pointer' }} onClick={() => scrollToSection('about')}>À Propos</span>
          <span style={{ cursor: 'pointer' }} onClick={() => scrollToSection('pricing')}>Abonnement</span>
        </div>
        &copy; {new Date().getFullYear()} NStock. Tous droits réservés. Caisse intelligente sécurisée hors-ligne.
      </footer>

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
              onClick={() => setShowRegisterModal(false)}
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

            {error && (
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

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Nom de la Boutique
                </label>
                <input
                  type="text"
                  placeholder="Ex: Électronique Fatima"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Nom de l'Administrateur
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fatima"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Adresse Email
                </label>
                <input
                  type="email"
                  placeholder="admin@maboutique.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                  required
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Sert également de clé de chiffrement pour verrouiller vos données locales.
                </span>
              </div>


              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: BRAND,
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px',
                  boxShadow: '0 4px 6px -1px rgba(14, 107, 168, 0.15)'
                }}
              >
                {loading ? 'Création...' : 'Créer ma boutique'}
              </button>

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
