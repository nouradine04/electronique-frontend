import { ArrowRight } from 'lucide-react';
import logo from '../../../assets/logo.png';
import './landing-footer.css';

export function LandingFooter({ onHome, onSection, onLogin }) {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-main">
        <div className="landing-footer-brand">
          <button type="button" className="landing-footer-logo" onClick={onHome} aria-label="Retour à l’accueil"><img src={logo} alt="NStock" /></button>
          <p>La caisse et le stock de votre boutique, dans un espace simple à utiliser.</p>
        </div>
        <nav aria-label="Navigation du pied de page">
          <h3>Explorer</h3>
          <button type="button" onClick={() => onSection('features')}>Fonctionnalités</button>
          <button type="button" onClick={() => onSection('pricing')}>Tarifs</button>
          <button type="button" onClick={() => onSection('download')}>Télécharger</button>
          <button type="button" onClick={() => onSection('contact')}>Contact</button>
        </nav>
        <div className="landing-footer-access">
          <h3>Votre espace</h3>
          <p>Déjà inscrit ? Retrouvez votre boutique.</p>
          <button type="button" onClick={onLogin}>Se connecter <ArrowRight size={16} aria-hidden="true" /></button>
        </div>
      </div>
      <div className="landing-footer-bottom"><span>© {new Date().getFullYear()} NStock. Tous droits réservés.</span><span>Conçu pour les boutiques d’électronique</span></div>
    </footer>
  );
}
