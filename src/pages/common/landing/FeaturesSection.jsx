import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, CloudUpload, FileText, LockKeyhole, Printer, ShieldCheck, Store, UsersRound, WifiOff, Zap } from 'lucide-react';
import './features-section.css';

const features = [
  {
    icon: Zap,
    title: { fr: 'Mode Hors-Ligne Absolu', ar: 'وضع عدم الاتصال المطلق' },
    description: {
      fr: "Aucune coupure d'électricité ou d'internet ne perturbe vos ventes. Tout est enregistré localement et se synchronise automatiquement au retour de la connexion.",
      ar: 'لا يمكن لأي انقطاع في الكهرباء أو الإنترنت أن يعطل مبيعاتك. يتم حفظ كل شيء محلياً ومزامنته فور عودة الاتصال.',
    },
    visual: 'offline',
  },
  {
    icon: ShieldCheck,
    title: { fr: 'Données Sécurisées', ar: 'بيانات آمنة ومحمية' },
    description: {
      fr: "Vos bénéfices, prix d'achat et dettes clients restent strictement privés et chiffrés sur votre appareil. Nous ne relevons ni ne stockons aucune de vos données confidentielles.",
      ar: 'تبقى أرباحك، أسعار الشراء، وديون العملاء خاصة تماماً ومشفرة على جهازك. نحن لا نطلع ولا نجمع أيًا من بياناتك السرية.',
    },
    visual: 'security',
  },
  {
    icon: Printer,
    title: { fr: 'Impression Thermique & PDF', ar: 'الطباعة الحرارية وفواتير PDF' },
    description: {
      fr: 'Générez des factures professionnelles en PDF ou connectez directement une imprimante de caisse thermique (format rouleau ou ticket standard) pour vos reçus.',
      ar: 'أصدر فواتير احترافية بصيغة PDF أو اطبع الإيصالات مباشرة عبر ربط طابعات الكاشير الحرارية (بصيغة الرول أو التذكرة العادية).',
    },
    visual: 'invoice',
  },
  {
    icon: Store,
    title: { fr: 'Gestion Multi-Boutiques', ar: 'إدارة الفروع والموظفين' },
    description: {
      fr: "Suivez plusieurs boutiques depuis un seul compte propriétaire. Créez des comptes dédiés pour vos caissiers ou gérants avec des droits d'accès sécurisés.",
      ar: 'تابع أداء عدة فروع ومستودعات من حساب مالك واحد. أنشئ حسابات خاصة للبائعين أو المدراء مع صلاحيات وصول آمنة.',
    },
    visual: 'shops',
  },
];

function FeatureVisual({ type, isRtl }) {
  if (type === 'offline') return (
    <div className="feature-visual-panel">
      <div className="feature-visual-status"><WifiOff size={18} /><span>{isRtl ? 'بدون اتصال' : 'Hors connexion'}</span></div>
      <div className="feature-visual-main"><span className="feature-visual-check"><Check size={22} /></span><strong>{isRtl ? 'تم حفظ البيع' : 'Vente enregistrée'}</strong><small>{isRtl ? 'البيانات محفوظة على الجهاز' : 'Vos données restent sur cet appareil'}</small></div>
      <div className="feature-visual-foot"><CloudUpload size={18} /><span>{isRtl ? 'مزامنة تلقائية عند عودة الشبكة' : 'Synchro automatique au retour du réseau'}</span></div>
    </div>
  );
  if (type === 'security') return (
    <div className="feature-visual-panel">
      <div className="feature-visual-status"><LockKeyhole size={18} /><span>{isRtl ? 'مساحتك الخاصة' : 'Votre espace privé'}</span></div>
      <div className="feature-visual-list">
        {[isRtl ? 'سعر الشراء' : "Prix d'achat", isRtl ? 'الأرباح' : 'Bénéfices', isRtl ? 'ديون العملاء' : 'Crédits clients'].map(label => <div key={label}><span>{label}</span><ShieldCheck size={18} /></div>)}
      </div>
      <div className="feature-visual-foot"><Check size={18} /><span>{isRtl ? 'وصول مخصص لكل دور' : 'Accès adapté à chaque rôle'}</span></div>
    </div>
  );
  if (type === 'invoice') return (
    <div className="feature-visual-panel feature-invoice-panel">
      <div className="feature-invoice-head"><span>NStock</span><strong>{isRtl ? 'فاتورة' : 'FACTURE'}</strong></div>
      <div className="feature-invoice-lines"><i /><i /><i /></div>
      <div className="feature-invoice-total"><span>{isRtl ? 'الإجمالي' : 'TOTAL'}</span><span>— FCFA</span></div>
      <div className="feature-visual-foot"><FileText size={18} /><span>PDF</span><span className="feature-visual-foot-separator" /><Printer size={18} /><span>{isRtl ? 'طباعة' : 'Impression'}</span></div>
    </div>
  );
  return (
    <div className="feature-visual-panel">
      <div className="feature-visual-status"><Store size={18} /><span>{isRtl ? 'متاجرك' : 'Vos boutiques'}</span></div>
      <div className="feature-visual-list feature-shop-list">
        {[isRtl ? 'المتجر الرئيسي' : 'Boutique principale', isRtl ? 'المتجر الثاني' : 'Boutique 02', isRtl ? 'المتجر الثالث' : 'Boutique 03'].map((label, index) => <div key={label}><span><Store size={17} />{label}</span>{index === 0 ? <Check size={18} /> : <ArrowRight size={16} />}</div>)}
      </div>
      <div className="feature-visual-foot"><UsersRound size={18} /><span>{isRtl ? 'فريق مخصص لكل متجر' : 'Une équipe par boutique'}</span></div>
    </div>
  );
}

export function FeaturesSection({ isRtl }) {
  const [active, setActive] = useState(0);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const carouselRef = useRef(null);
  const touchStart = useRef(null);
  const isInView = useInView(carouselRef, { amount: 0.3 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView || interactionPaused || reducedMotion) return undefined;
    const timer = window.setInterval(() => { setDirection(1); setActive(current => (current + 1) % features.length); }, 6500);
    return () => window.clearInterval(timer);
  }, [active, isInView, interactionPaused, reducedMotion]);

  const change = next => {
    setDirection(next < active ? -1 : 1);
    setActive((next + features.length) % features.length);
  };
  const feature = features[active];
  const Icon = feature.icon;

  return (
    <section id="features" className="landing-section landing-features" dir={isRtl ? 'rtl' : 'ltr'} aria-labelledby="features-title">
      <div className="landing-features-inner">
        <div className="landing-features-intro">
          <h2 id="features-title">{isRtl ? 'صُمم لواقع تجارتك' : 'Pensé pour la réalité de votre commerce'}</h2>
          <p>{isRtl ? 'تطبيق سريع متصل بالخادم ويعمل باستقلالية في متجرك.' : 'Une application de gestion rapide, connectée au serveur mais 100% autonome sur le terrain.'}</p>
        </div>

        <div
          ref={carouselRef}
          className="feature-carousel"
          onMouseEnter={() => setInteractionPaused(true)}
          onMouseLeave={() => setInteractionPaused(false)}
          onFocusCapture={() => setInteractionPaused(true)}
          onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false); }}
          onTouchStart={event => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
          onTouchEnd={event => {
            if (!touchStart.current) return;
            const dx = event.changedTouches[0].clientX - touchStart.current.x;
            const dy = event.changedTouches[0].clientY - touchStart.current.y;
            touchStart.current = null;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) change((active + (dx < 0 ? 1 : -1) * (isRtl ? -1 : 1) + features.length) % features.length);
          }}
        >
          <div className="feature-glow" aria-hidden="true" />
          <div className="feature-stack feature-stack-back" aria-hidden="true" />
          <div className="feature-stack feature-stack-middle" aria-hidden="true" />
          <div className="feature-carousel-stage" aria-live="off">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.article
                key={active}
                className={`feature-slide${feature.visual === 'offline' ? ' feature-slide-offline' : ''}`}
                custom={direction}
                initial={reducedMotion ? false : ({ x: 40 * direction, y: 20, opacity: 0, scale: 0.985 })}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                exit={reducedMotion ? undefined : ({ x: -40 * direction, opacity: 0, scale: 0.985 })}
                transition={{ duration: reducedMotion ? 0 : 0.38, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <div className="feature-copy">
                  <span className="feature-kicker"><Icon size={17} aria-hidden="true" />{String(active + 1).padStart(2, '0')} / {String(features.length).padStart(2, '0')}</span>
                  <h3>{feature.title[isRtl ? 'ar' : 'fr']}</h3>
                  <p>{feature.description[isRtl ? 'ar' : 'fr']}</p>
                </div>
                <div className="feature-art" aria-hidden="true"><FeatureVisual type={feature.visual} isRtl={isRtl} /></div>
              </motion.article>
            </AnimatePresence>
          </div>
          <div className="feature-carousel-controls">
            <div className="feature-carousel-dots" role="group" aria-label={isRtl ? 'اختر ميزة' : 'Choisir une fonctionnalité'}>
              {features.map((item, index) => <button type="button" key={item.visual} className={index === active ? 'is-active' : ''} aria-label={item.title[isRtl ? 'ar' : 'fr']} aria-current={index === active ? 'true' : undefined} onClick={() => change(index)} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
