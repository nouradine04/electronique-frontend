import { Reveal } from './Reveal';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Package, ReceiptText, Wallet, Store, ChevronLeft, ChevronRight, Moon, TrendingUp, UsersRound } from 'lucide-react';
import './landing-hero.css';

export function LandingHero({ onStart, isRtl }: { onStart: () => void; isRtl: boolean }) {
  const t = (fr: string, ar: string) => isRtl ? ar : fr;
  const reduceMotion = useReducedMotion();
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (reduceMotion || paused) return undefined;
    const timer = window.setInterval(() => setActiveSlide(value => (value + 1) % 2), 4800);
    return () => window.clearInterval(timer);
  }, [reduceMotion, paused]);
  const showSlide = (slide: number) => setActiveSlide((slide + 2) % 2);
  return <section className="shop-hero" dir={isRtl ? 'rtl' : 'ltr'}>
    <p className="shop-eyebrow">{t('LA GESTION DE VOTRE BOUTIQUE', 'إدارة متجرك')}</p>
    <Reveal><h1>{t('Tout voir.', 'رؤية واضحة.')}<br /><span>{t('Mieux gérer.', 'إدارة أفضل.')}</span></h1></Reveal>
    <Reveal className="shop-intro" delay={0.1}><h2>{t('Votre commerce avance.\nGardez le contrôle.', 'تجارتك تتقدم. ابقَ على اطلاع.')}</h2><div><p>{t('Ventes, stock, crédits et dépenses. Un espace simple pour piloter votre boutique d’électronique, où que vous soyez.', 'المبيعات والمخزون والديون والمصاريف. مساحة بسيطة لإدارة متجر الإلكترونيات أينما كنت.')}</p><button onClick={onStart}>{t('Créer ma boutique', 'إنشاء متجر')} <ArrowUpRight size={20} /></button></div></Reveal>
    <Reveal><div className="shop-preview" aria-label={t('Aperçu illustratif de la gestion de boutique', 'مثال توضيحي لإدارة المتجر')} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className="shop-preview-caption"><span><Store size={18} /> {activeSlide === 0 ? t('Votre boutique, en un regard', 'متجرك في لمحة') : t('Votre activité, toujours claire', 'نشاطك واضح دائماً')}</span><small>{t('Exemple illustratif', 'مثال توضيحي')}</small></div>
      <div className="shop-preview-window">
        <AnimatePresence mode="wait" initial={false}>
          {activeSlide === 0 ? <motion.div key="overview" className="shop-preview-slide" initial={reduceMotion ? false : { opacity: 0, x: isRtl ? -70 : 70 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: isRtl ? 70 : -70 }} transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}>
            <div className="shop-preview-grid">
              <div className="shop-cash"><span>{t('Encaissé aujourd’hui', 'المداخيل اليوم')}</span><strong>245 000 <small>FCFA</small></strong><div className="shop-bars" aria-hidden="true">{[30,45,38,62,48,78,95,68,86,100].map((height,i)=><i key={i} style={{height: `${height}%`, animationDelay: `${i*50}ms`}} />)}</div><small>{t('Chaque vente compte.', 'كل عملية بيع مهمة.')}</small></div>
              <div className="shop-stock"><span><Package size={18} /> {t('Stock disponible', 'المخزون المتوفر')}</span><strong>128 <small>{t('articles', 'منتج')}</small></strong><div><span>{t('Ordinateurs', 'حواسيب')}</span><b>24</b></div><div><span>{t('Accessoires', 'إكسسوارات')}</span><b>86</b></div><div><span>{t('Audio & autres', 'صوتيات وغيرها')}</span><b>18</b></div></div>
              <div className="shop-credit"><Wallet size={20} /><span>{t('Crédits à récupérer', 'ديون العملاء')}</span><strong>35 000 <small>FCFA</small></strong><p>{t('Les montants dus, toujours à portée de main.', 'المبالغ المستحقة في متناول يدك.')}</p></div>
            </div>
          </motion.div> : <motion.div key="analytics" className="shop-preview-slide shop-night" initial={reduceMotion ? false : { opacity: 0, x: isRtl ? -70 : 70 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: isRtl ? 70 : -70 }} transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}>
            <div className="shop-night-head"><span><Moon size={17} /> {t('Bilan de la journée', 'ملخص اليوم')}</span><small>{t('Mise à jour à 20:45', 'آخر تحديث 20:45')}</small></div>
            <div className="shop-analytics-grid">
              <div className="shop-chart-card"><div><span>{t('Ventes de la semaine', 'مبيعات الأسبوع')}</span><strong>1 284 500 <small>FCFA</small></strong></div><div className="shop-line-chart" aria-hidden="true"><svg viewBox="0 0 520 150" preserveAspectRatio="none"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38bdf8" stopOpacity=".35"/><stop offset="1" stopColor="#38bdf8" stopOpacity="0"/></linearGradient></defs><path className="chart-area" d="M0 126 C45 112 62 117 100 91 S170 110 211 72 S282 86 321 49 S396 78 431 38 S486 42 520 17 L520 150 L0 150 Z"/><path className="chart-line" d="M0 126 C45 112 62 117 100 91 S170 110 211 72 S282 86 321 49 S396 78 431 38 S486 42 520 17"/></svg><div>{['L','M','M','J','V','S','D'].map((day, index)=><span key={index}>{day}</span>)}</div></div></div>
              <div className="shop-night-metrics"><div><TrendingUp size={19}/><span>{t('Progression', 'التقدم')}</span><strong>+18%</strong><small>{t('cette semaine', 'هذا الأسبوع')}</small></div><div><UsersRound size={19}/><span>{t('Clients servis', 'العملاء')}</span><strong>47</strong><small>{t('aujourd’hui', 'اليوم')}</small></div></div>
            </div>
          </motion.div>}
        </AnimatePresence>
      </div>
      <div className="shop-preview-controls" aria-label={t('Changer l’aperçu', 'تغيير العرض')}>
        <button type="button" onClick={() => showSlide(activeSlide - 1)} aria-label={t('Aperçu précédent', 'العرض السابق')}><ChevronLeft size={17}/></button>
        <div>{[0,1].map(slide => <button type="button" key={slide} className={activeSlide === slide ? 'is-active' : ''} aria-label={t(`Afficher l’aperçu ${slide + 1}`, `عرض المثال ${slide + 1}`)} aria-current={activeSlide === slide ? 'true' : undefined} onClick={() => showSlide(slide)} />)}</div>
        <button type="button" onClick={() => showSlide(activeSlide + 1)} aria-label={t('Aperçu suivant', 'العرض التالي')}><ChevronRight size={17}/></button>
      </div>
    </div>
    </Reveal><div className="shop-promises">{[[ReceiptText,t('Des ventes bien suivies','متابعة المبيعات')],[Package,t('Un stock organisé','مخزون منظم')],[Wallet,t('Des comptes plus clairs','حسابات أوضح')]].map(([Icon,label],i)=>{const Symbol = Icon as typeof Package; return <div key={i}><Symbol size={20}/><span>{label as string}</span></div>;})}</div>
  </section>;
}
