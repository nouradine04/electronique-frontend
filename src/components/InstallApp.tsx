import { Reveal } from './Reveal';
import './install-app.css';
import React, { useState } from 'react';
import { Download, Smartphone, Monitor, ArrowDownToLine } from 'lucide-react';

export function InstallApp({ isRtl = false }: { isRtl?: boolean }) {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const detectedDesktopPlatform = /Windows/.test(ua) ? 'windows' : /Mac/.test(ua) ? 'macos' : 'linux';
  const [selected, setSelected] = useState<'android' | 'ios' | 'desktop'>(() => android ? 'android' : ios ? 'ios' : 'desktop');
  const [desktopPlatform, setDesktopPlatform] = useState<'windows' | 'macos' | 'linux'>(detectedDesktopPlatform);
  const [help, setHelp] = useState(false);
  const androidUrl = import.meta.env.VITE_ANDROID_APK_URL;
  const iosUrl = import.meta.env.VITE_IOS_TESTFLIGHT_URL;
  const desktopUrl = desktopPlatform === 'windows'
    ? import.meta.env.VITE_WINDOWS_DOWNLOAD_URL
    : desktopPlatform === 'macos'
      ? (import.meta.env.VITE_MACOS_DOWNLOAD_URL || '/downloads/NStock-macOS-Apple-Silicon.dmg')
      : import.meta.env.VITE_LINUX_DOWNLOAD_URL;
  const downloadLabel = selected === 'desktop'
    ? `Télécharger pour ${desktopPlatform === 'macos' ? 'Mac' : desktopPlatform === 'windows' ? 'Windows' : 'Linux'}`
    : selected === 'android' ? 'Télécharger l’APK Android'
    : 'Installer sur iPhone';

  async function install() {
    const target = selected === 'desktop' ? desktopUrl : selected === 'android' ? androidUrl : iosUrl;
    if (target) window.location.assign(target);
    else setHelp(true);
  }

  return <Reveal><div className="install-panel install-designed" dir={isRtl ? 'rtl' : 'ltr'}>
    <div className="install-choices" aria-label="Type d’appareil">
      <button aria-pressed={selected === 'android'} onClick={() => { setSelected('android'); setHelp(false); }}><Smartphone size={22} /><span>Android</span></button>
      <button aria-pressed={selected === 'ios'} onClick={() => { setSelected('ios'); setHelp(false); }}><Smartphone size={22} /><span>iPhone / iPad</span></button>
      <button aria-pressed={selected === 'desktop'} onClick={() => { setSelected('desktop'); setHelp(false); }}><Monitor size={22} /><span>{isRtl ? 'الكمبيوتر' : 'Ordinateur'}</span></button>
    </div>
    <div className="install-detail"><span className="install-symbol"><ArrowDownToLine size={26} /></span>
    <h3>{isRtl ? 'متجرك معك أينما كنت' : selected === 'desktop' ? 'Votre espace de travail, prêt à ouvrir.' : 'Votre boutique vous accompagne.'}</h3>
    <small>{selected === 'android' ? 'Téléphones et tablettes Android' : selected === 'ios' ? 'iPhone et iPad' : `Détecté : ${desktopPlatform === 'macos' ? 'Mac' : desktopPlatform === 'windows' ? 'Windows' : 'Linux'}`}</small>
    <p>{isRtl ? 'نزّل التطبيق المصمم لجهازك.' : selected === 'android' ? 'Téléchargez l’APK, puis autorisez son installation sur votre appareil.' : selected === 'ios' ? 'Ajoutez NStock à votre écran d’accueil pour l’ouvrir comme une application.' : 'Téléchargez la version conçue pour votre ordinateur.'}</p>
    {selected === 'desktop' && <div className="desktop-platform-choice" aria-label="Choisir le système de l’ordinateur">
      <span>Ce n’est pas votre système ?</span>
      <button type="button" aria-pressed={desktopPlatform === 'macos'} onClick={() => { setDesktopPlatform('macos'); setHelp(false); }}>Mac</button>
      <button type="button" aria-pressed={desktopPlatform === 'windows'} onClick={() => { setDesktopPlatform('windows'); setHelp(false); }}>Windows</button>
      <button type="button" aria-pressed={desktopPlatform === 'linux'} onClick={() => { setDesktopPlatform('linux'); setHelp(false); }}>Linux</button>
    </div>}
    <button className="btn btn-primary" onClick={install}>
      <Download size={18} /> {isRtl ? 'تحميل NStock' : downloadLabel}
    </button>
    {help && <p role="status">{isRtl ? 'هذا الإصدار قيد الإعداد.' : selected === 'ios'
      ? 'Sur iPhone : ouvrez Partager, choisissez « Sur l’écran d’accueil », puis « Ajouter ».'
      : selected === 'android'
        ? 'Le lien APK sera disponible après la compilation Android.'
        : `L’installateur ${desktopPlatform === 'windows' ? 'Windows' : desktopPlatform === 'macos' ? 'macOS' : 'Linux'} est en préparation.`}</p>}
    {selected === 'desktop' && desktopPlatform === 'macos' && <p><small>{isRtl ? 'إصدار Mac بمعالج Apple.' : 'Version Mac avec processeur Apple (M1 ou plus récent).'}</small></p>}
    </div>
  </div></Reveal>;
}
