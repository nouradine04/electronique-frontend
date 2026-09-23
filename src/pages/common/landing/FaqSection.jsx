import { FaqItem } from './FaqItem';

export function FaqSection({  }) {
  return (
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
  );
}
