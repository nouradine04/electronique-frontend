import { Reveal } from './Reveal';
import React from 'react';
import { ArrowUpRight, Package, ReceiptText, Wallet, Store } from 'lucide-react';
import './landing-hero.css';

export function LandingHero({ onStart, isRtl }: { onStart: () => void; isRtl: boolean }) {
  const t = (fr: string, ar: string) => isRtl ? ar : fr;
  return <section className="shop-hero" dir={isRtl ? 'rtl' : 'ltr'}>
    <p className="shop-eyebrow">{t('LA GESTION DE VOTRE BOUTIQUE', 'إدارة متجرك')}</p>
    <Reveal><h1>{t('Tout voir.', 'رؤية واضحة.')}<br /><span>{t('Mieux gérer.', 'إدارة أفضل.')}</span></h1></Reveal>
    <Reveal className="shop-intro" delay={0.1}><h2>{t('Votre commerce avance.\nGardez le contrôle.', 'تجارتك تتقدم. ابقَ على اطلاع.')}</h2><div><p>{t('Ventes, stock, crédits et dépenses. Un espace simple pour piloter votre boutique d’électronique, où que vous soyez.', 'المبيعات والمخزون والديون والمصاريف. مساحة بسيطة لإدارة متجر الإلكترونيات أينما كنت.')}</p><button onClick={onStart}>{t('Créer ma boutique', 'إنشاء متجر')} <ArrowUpRight size={20} /></button></div></Reveal>
    <Reveal><div className="shop-preview" aria-label={t('Aperçu illustratif de la gestion de boutique', 'مثال توضيحي لإدارة المتجر')}>
      <div className="shop-preview-caption"><span><Store size={18} /> {t('Votre boutique, en un regard', 'متجرك في لمحة')}</span><small>{t('Exemple illustratif', 'مثال توضيحي')}</small></div>
      <div className="shop-preview-grid">
        <div className="shop-cash"><span>{t('Encaissé aujourd’hui', 'المداخيل اليوم')}</span><strong>245 000 <small>FCFA</small></strong><div className="shop-bars" aria-hidden="true">{[30,45,38,62,48,78,95,68,86,100].map((height,i)=><i key={i} style={{height: `${height}%`, animationDelay: `${i*50}ms`}} />)}</div><small>{t('Chaque vente compte.', 'كل عملية بيع مهمة.')}</small></div>
        <div className="shop-stock"><span><Package size={18} /> {t('Stock disponible', 'المخزون المتوفر')}</span><strong>128 <small>{t('articles', 'منتج')}</small></strong><div><span>{t('Ordinateurs', 'حواسيب')}</span><b>24</b></div><div><span>{t('Accessoires', 'إكسسوارات')}</span><b>86</b></div><div><span>{t('Audio & autres', 'صوتيات وغيرها')}</span><b>18</b></div></div>
        <div className="shop-credit"><Wallet size={20} /><span>{t('Crédits à récupérer', 'ديون العملاء')}</span><strong>35 000 <small>FCFA</small></strong><p>{t('Les montants dus, toujours à portée de main.', 'المبالغ المستحقة في متناول يدك.')}</p></div>
      </div>
    </div>
    </Reveal><div className="shop-promises">{[[ReceiptText,t('Des ventes bien suivies','متابعة المبيعات')],[Package,t('Un stock organisé','مخزون منظم')],[Wallet,t('Des comptes plus clairs','حسابات أوضح')]].map(([Icon,label],i)=>{const Symbol = Icon as typeof Package; return <div key={i}><Symbol size={20}/><span>{label as string}</span></div>;})}</div>
  </section>;
}
