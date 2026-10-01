import { ArrowDownToLine } from 'lucide-react';
import { InstallApp } from '../../../components/InstallApp';
import './download-section.css';

export function DownloadSection({ isRtl }) {
  return (
    <section id="download" className="landing-section landing-download" dir={isRtl ? 'rtl' : 'ltr'} aria-labelledby="download-title">
      <div className="landing-download-inner">
        <div className="landing-download-copy">
          <span className="landing-download-eyebrow"><ArrowDownToLine size={16} aria-hidden="true" />{isRtl ? 'على أجهزتك' : 'Sur vos appareils'}</span>
          <h2 id="download-title">{isRtl ? 'تحميل التطبيق' : 'Télécharger NStock'}</h2>
          <p>{isRtl ? 'اختر جهازك للوصول إلى التطبيق.' : 'Choisissez votre appareil pour retrouver votre boutique.'}</p>
        </div>
        <InstallApp isRtl={isRtl} />
      </div>
    </section>
  );
}
