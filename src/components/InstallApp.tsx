import { Reveal } from './Reveal';
import './install-app.css';
import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Monitor, ArrowDownToLine } from 'lucide-react';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallApp({ isRtl = false }: { isRtl?: boolean }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [selected, setSelected] = useState<'mobile' | 'desktop'>(() => /Android|iPhone|iPad|iPod/.test(navigator.userAgent) || navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent) ? 'mobile' : 'desktop');
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const device = ios ? 'iPhone / iPad' : android ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : 'ordinateur';

  useEffect(() => {
    const ready = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const done = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', ready); window.removeEventListener('appinstalled', done); };
  }, []);

  async function install() {
    if ((selected === 'mobile') !== (ios || android)) { setHelp(true); return; }
    if (!prompt) { setHelp(true); return; }
    setBusy(true);
    try { await prompt.prompt(); await prompt.userChoice; }
    catch { setHelp(true); }
    finally { setPrompt(null); setBusy(false); }
  }

  return <Reveal><div className="install-panel install-designed" dir={isRtl ? 'rtl' : 'ltr'}>
    <div className="install-choices" aria-label="Type d’appareil">
      <button aria-pressed={selected === 'mobile'} onClick={() => { setSelected('mobile'); setHelp(false); }}><Smartphone size={22} /><span>{isRtl ? 'الهاتف والتابلت' : 'Téléphone & tablette'}</span></button>
      <button aria-pressed={selected === 'desktop'} onClick={() => { setSelected('desktop'); setHelp(false); }}><Monitor size={22} /><span>{isRtl ? 'الكمبيوتر' : 'Ordinateur'}</span></button>
    </div>
    <div className="install-detail"><span className="install-symbol"><ArrowDownToLine size={26} /></span>
    <h3>{isRtl ? 'متجرك معك أينما كنت' : selected === 'mobile' ? 'Votre boutique vous accompagne.' : 'Votre espace de travail, prêt à ouvrir.'}</h3>
    <small>{selected === 'mobile' ? 'Android · iPhone · iPad' : 'Windows · macOS · Linux'}</small>
    <p>{isRtl ? 'أضف NStock إلى الشاشة الرئيسية من متصفحك.' : 'Retrouvez NStock sur votre écran d’accueil, avec une interface adaptée à votre appareil.'}</p>
    <button className="btn btn-primary" disabled={installed || busy} onClick={install}>
      <Download size={18} /> {installed ? (isRtl ? 'التطبيق مفتوح بالفعل' : 'Application déjà ouverte') : busy ? '…' : isRtl ? 'تثبيت NStock' : 'Installer NStock'}
    </button>
    {help && <p role="status">{(selected === 'mobile') !== (ios || android)
      ? (isRtl ? 'افتح هذا الموقع على الجهاز المطلوب واختر تثبيت.' : `Ouvrez ce site sur ${selected === 'mobile' ? 'votre téléphone ou votre tablette' : 'votre ordinateur'}, puis choisissez « Installer NStock ».`)
      : isRtl
      ? ios ? 'افتح الموقع في Safari، ثم مشاركة ← إضافة إلى الشاشة الرئيسية.' : 'افتح قائمة المتصفح واختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية. إن لم يظهر الخيار، جرّب Chrome أو Edge.'
      : ios ? 'Dans Safari, ouvrez Partager, puis « Sur l’écran d’accueil » et confirmez avec « Ajouter ».'
      : android ? 'Dans le menu de Chrome, choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ». Si l’option est absente, continuez dans le navigateur et réessayez ultérieurement.'
      : 'Dans Chrome ou Edge, utilisez l’icône d’installation dans la barre d’adresse ou le menu « Installer cette page en tant qu’application ». Sur Safari Mac, choisissez Fichier → Ajouter au Dock. Si l’option est absente, vous pouvez continuer sur le site.'}</p>}
    {selected === 'desktop' && <p><small>{isRtl ? 'النسخة المكتبية المستقلة غير متاحة للتنزيل بعد.' : 'La version bureau indépendante sera proposée ici lorsque son installateur sera disponible.'}</small></p>}
    </div>
  </div></Reveal>;
}
