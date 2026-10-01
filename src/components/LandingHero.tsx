import { ArrowUpRight, CircleCheck } from 'lucide-react';
import { Reveal } from './Reveal';
import './landing-hero.css';

export function LandingHero({ onStart, isRtl }: { onStart: () => void; isRtl: boolean }) {
  const t = (fr: string, ar: string) => isRtl ? ar : fr;

  return <section className="shop-hero" dir={isRtl ? 'rtl' : 'ltr'}>
    <p className="shop-eyebrow">{t('LA GESTION DE VOTRE BOUTIQUE', 'إدارة متجرك')}</p>
    <Reveal><h1>{t('Tout voir.', 'رؤية واضحة.')}<br /><span>{t('Mieux gérer.', 'إدارة أفضل.')}</span></h1></Reveal>
    <Reveal className="shop-intro" delay={0.1}>
      <h2>{t('Votre commerce avance.\nGardez le contrôle.', 'تجارتك تتقدم. ابقَ على اطلاع.')}</h2>
      <div>
        <p>{t('Ventes, stock, crédits et dépenses. Un espace simple pour piloter votre boutique d’électronique, où que vous soyez.', 'المبيعات والمخزون والديون والمصاريف. مساحة بسيطة لإدارة متجر الإلكترونيات أينما كنت.')}</p>
        <button type="button" onClick={onStart}>{t('Créer ma boutique', 'إنشاء متجر')} <ArrowUpRight size={20} /></button>
      </div>
    </Reveal>
    <div className="shop-promises">
      {[
        t('Ventes suivies', 'مبيعات متابَعة'),
        t('Stock traçable', 'مخزون قابل للتتبع'),
        t('Crédits visibles', 'ديون واضحة'),
      ].map((label) => <div className="shop-promise-card" key={label}><CircleCheck size={18} aria-hidden="true" /><span>{label}</span></div>)}
    </div>
  </section>;
}
