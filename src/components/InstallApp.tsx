import { useState } from 'react';
import { Reveal } from './Reveal';
import './install-app.css';

type Device = 'desktop' | 'android' | 'ios';

function desktopDownloadUrl() {
  const ua = navigator.userAgent;
  if (/Windows/.test(ua)) return import.meta.env.VITE_WINDOWS_DOWNLOAD_URL;
  if (/Mac/.test(ua)) return import.meta.env.VITE_MACOS_DOWNLOAD_URL || '/downloads/NStock-macOS-Apple-Silicon.dmg';
  return import.meta.env.VITE_LINUX_DOWNLOAD_URL;
}

export function InstallApp({ isRtl = false }: { isRtl?: boolean }) {
  const [selected, setSelected] = useState<Device>(() => {
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    return 'desktop';
  });
  const [messageFor, setMessageFor] = useState<Device | null>(null);

  function install() {
    setMessageFor(null);
    if (selected === 'ios') {
      setMessageFor('ios');
      return;
    }

    const url = selected === 'android' ? import.meta.env.VITE_ANDROID_APK_URL : desktopDownloadUrl();
    if (url) window.location.assign(url);
    else setMessageFor(selected);
  }

  const devices = [
    { id: 'desktop' as const, label: isRtl ? 'الكمبيوتر' : 'Ordinateur' },
    { id: 'android' as const, label: 'Android' },
    { id: 'ios' as const, label: 'iPhone / iPad' },
  ];

  const statusMessage = messageFor === 'ios'
    ? 'Sur iPhone, ouvrez le menu Partager, puis choisissez « Sur l’écran d’accueil ».'
    : 'Le téléchargement pour cet appareil sera bientôt disponible.';

  return <Reveal><div className="install-options" dir={isRtl ? 'rtl' : 'ltr'}>
    <div className="install-device-list" role="group" aria-label={isRtl ? 'اختر جهازك' : 'Choisissez votre appareil'}>
      {devices.map(({ id, label }) => <button
        key={id}
        type="button"
        className="install-device"
        aria-pressed={selected === id}
        onClick={() => { setSelected(id); setMessageFor(null); }}
      >
        <span>{label}</span>
        <span className="install-device-indicator" aria-hidden="true" />
      </button>)}
    </div>
    <button type="button" className="install-primary" onClick={install}>
      <span>{isRtl ? 'تحميل NStock' : selected === 'ios' ? 'Installer NStock' : 'Télécharger NStock'}</span>
    </button>
    {messageFor && <p className="install-option-message" role="status">{isRtl ? 'سيكون التنزيل متاحًا قريبًا.' : statusMessage}</p>}
  </div></Reveal>;
}
