import { Reveal } from './Reveal';
import './install-app.css';
import React, { useState } from 'react';
import { Download, Smartphone, Monitor, ArrowDownToLine } from 'lucide-react';

export function InstallApp({ isRtl = false }: { isRtl?: boolean }) {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const [selected, setSelected] = useState<'android' | 'ios' | 'desktop'>(() => android ? 'android' : ios ? 'ios' : 'desktop');
  const [help, setHelp] = useState(false);
  const device = ios ? 'iPhone / iPad' : android ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : 'ordinateur';
  const androidUrl = import.meta.env.VITE_ANDROID_APK_URL;
  const iosUrl = import.meta.env.VITE_IOS_TESTFLIGHT_URL;
  const desktopUrl = import.meta.env.VITE_DESKTOP_DOWNLOAD_URL;
  const downloadLabel = selected === 'desktop'
    ? `Télécharger pour ${device}`
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
    <small>{selected === 'android' ? 'Téléphones et tablettes Android' : selected === 'ios' ? 'iPhone et iPad' : 'Windows · macOS · Linux'}</small>
    <p>{isRtl ? 'نزّل التطبيق المصمم لجهازك.' : selected === 'android' ? 'Téléchargez l’APK, puis autorisez son installation sur votre appareil.' : selected === 'ios' ? 'Ajoutez NStock à votre écran d’accueil pour l’ouvrir comme une application.' : 'Téléchargez la version conçue pour votre ordinateur.'}</p>
    <button className="btn btn-primary" onClick={install}>
      <Download size={18} /> {isRtl ? 'تحميل NStock' : downloadLabel}
    </button>
    {help && <p role="status">{(selected === 'mobile') !== (ios || android)
      ? (isRtl ? 'افتح هذه الصفحة على الجهاز المطلوب.' : `Ouvrez cette page sur ${selected === 'desktop' ? 'l’ordinateur concerné' : 'le téléphone concerné'}.`)
      : isRtl ? 'هذا الإصدار قيد الإعداد.' : selected === 'ios' ? 'Sur iPhone : ouvrez Partager, choisissez « Sur l’écran d’accueil », puis « Ajouter ». Un guide visuel accompagnera cette étape.' : selected === 'android' ? 'L’APK est prêt à être configuré. Son lien apparaîtra ici après la première compilation EAS.' : 'L’installateur pour cet ordinateur sera ajouté après sa compilation.'}</p>}
    {selected === 'desktop' && <p><small>{isRtl ? 'النسخة المكتبية المستقلة غير متاحة للتنزيل بعد.' : 'La version bureau indépendante sera proposée ici lorsque son installateur sera disponible.'}</small></p>}
    </div>
  </div></Reveal>;
}
