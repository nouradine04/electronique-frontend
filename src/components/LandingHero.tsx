import { ArrowUpRight, CircleCheck } from 'lucide-react';
import { Reveal } from './Reveal';
import './landing-hero.css';

export function LandingHero({ onStart, isRtl }: { onStart: () => void; isRtl: boolean }) {
  const t = (fr: string, ar: string) => isRtl ? ar : fr;

  return <section className="shop-hero" dir={isRtl ? 'rtl' : 'ltr'}>
    <p className="shop-eyebrow">{t('NSTOCK — CAISSE ET GESTION DE STOCK', 'NSTOCK — المبيعات وإدارة المخزون')}</p>
    <Reveal><h1><small className="shop-hero-name">NStock</small>{t('Tout voir.', 'رؤية واضحة.')}<br /><span>{t('Mieux gérer.', 'إدارة أفضل.')}</span></h1></Reveal>
    <Reveal className="shop-intro" delay={0.1}>
      <h2>{t('NStock, la caisse et le stock\nde votre boutique.', 'NStock، المبيعات والمخزون في متجرك.')}</h2>
      <div>
        <p>{t('Gérez vos ventes, votre stock, vos appareils par IMEI, les crédits et les dépenses de votre boutique d’électronique, même hors ligne.', 'المبيعات والمخزون والديون والمصاريف. مساحة بسيطة لإدارة متجر الإلكترونيات أينما كنت.')}</p>
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
