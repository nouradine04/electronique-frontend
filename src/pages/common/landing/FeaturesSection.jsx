import { ShieldCheck, Database, Printer, Zap } from 'lucide-react';

import { BRAND } from './constants';

export function FeaturesSection({ isRtl }) {
  return (
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
  );
}
