import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, Globe, Moon, Sun } from 'lucide-react';
import logo from '../assets/logo.png';
import './landing-navbar.css';

type Props = {
  isRtl: boolean; language: string; theme: string;
  onSection: (section: string) => void; onHome: () => void;
  onLogin: () => void; onRegister: () => void;
  onLanguage: () => void; onTheme: () => void;
};

export function LandingNavbar(props: Props) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLElement>(null);
  const ar = props.isRtl;
  const preferences = (className: string) => <div className={`public-preferences ${className}`}><button onClick={props.onLanguage} aria-label="Changer la langue"><Globe size={16} /><span>{props.language.toUpperCase()}</span></button><button onClick={props.onTheme} aria-label={props.theme === 'light' ? 'Activer le mode nuit' : 'Activer le mode clair'}>{props.theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button></div>;
  const links = [['features', ar ? 'المميزات' : 'Fonctionnalités'], ['pricing', ar ? 'الاشتراكات' : 'Tarifs'], ['download', ar ? 'التثبيت' : 'Installer'], ['contact', ar ? 'تواصل معنا' : 'Contact']];
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', outside); };
  }, [open]);
  return <header className="public-nav" ref={root} dir={ar ? 'rtl' : 'ltr'}>
    <div className="public-nav-inner">
      <button className="public-brand" aria-label={ar ? 'الصفحة الرئيسية' : 'Accueil'} onClick={() => { setOpen(false); props.onHome(); }}><img src={logo} alt="NStock" /></button>
      <nav className="public-desktop-links" aria-label={ar ? 'التنقل الرئيسي' : 'Navigation principale'}>{links.map(([id, label]) => <button key={id} onClick={() => props.onSection(id)}>{label}</button>)}</nav>
      <div className="public-nav-actions">
        {preferences('public-desktop-preferences')}
        <button className="public-login" onClick={props.onLogin}>{ar ? 'دخول' : 'Connexion'}</button>
        <button className="public-create" onClick={props.onRegister}>{ar ? 'إنشاء متجر' : 'Créer ma boutique'}</button>
        {preferences('public-mobile-quick')}
        <button className="public-menu-toggle" ref={toggle} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={open} aria-controls="public-mobile-menu" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}<span>{ar ? 'القائمة' : 'Menu'}</span></button>
      </div>
    </div>
    <div className="public-menu" id="public-mobile-menu" hidden={!open}>
      <nav aria-label="Navigation mobile">{links.map(([id, label]) => <button key={id} onClick={() => { setOpen(false); props.onSection(id); }}>{label}</button>)}</nav>
      <button className="public-create" onClick={() => { setOpen(false); props.onRegister(); }}>{ar ? 'إنشاء متجر' : 'Créer ma boutique'}</button>
      <button className="public-login" onClick={() => { setOpen(false); props.onLogin(); }}>{ar ? 'دخول' : 'Se connecter'}</button>
    </div>
  </header>;
}
