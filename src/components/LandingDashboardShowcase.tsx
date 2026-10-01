import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import dashboardLight from '../assets/landing-dashboard-real.png';
import dashboardDark from '../assets/landing-dashboard-dark.png';
import { Maximize2 } from 'lucide-react';
import './landing-dashboard-showcase.css';

const dashboards = [
  { image: dashboardLight, name: 'clair' },
  { image: dashboardDark, name: 'sombre' },
] as const;

export function LandingDashboardShowcase({ isRtl }: { isRtl: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'start 25%'] });
  const rise = useTransform(scrollYProgress, [0, 1], [84, 0]);
  const fade = useTransform(scrollYProgress, [0, 1], [0.2, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);

  useEffect(() => {
    if (paused || reducedMotion) return undefined;
    const timer = window.setInterval(() => setActive(current => (current + 1) % dashboards.length), 5500);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="landing-dashboard-showcase"
      aria-label={isRtl ? 'معاينة لوحة تحكم NStock' : 'Aperçu du tableau de bord NStock'}
    >
      <div className="landing-dashboard-glow" aria-hidden="true" />
      <motion.div
        className="landing-dashboard-stage"
        style={reducedMotion ? undefined : { y: rise, opacity: fade, scale }}
      >
        <div
          className="landing-dashboard-window"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {dashboards.map((dashboard, index) => (
            <img
              key={dashboard.name}
              className={`landing-dashboard-image${active === index ? ' is-active' : ''}`}
              src={dashboard.image}
              alt={isRtl ? `لوحة تحكم NStock بالوضع ${index === 0 ? 'الفاتح' : 'الداكن'}` : `Vrai tableau de bord NStock en mode ${dashboard.name}`}
              aria-hidden={active !== index}
              width="2294"
              height="1194"
              loading="lazy"
              decoding="async"
            />
          ))}
          <div className="landing-dashboard-switcher" role="group" aria-label={isRtl ? 'مظهر لوحة التحكم' : 'Apparence du tableau de bord'}>
            {dashboards.map((dashboard, index) => (
              <button
                key={dashboard.name}
                type="button"
                className={active === index ? 'is-active' : ''}
                aria-label={isRtl ? `عرض الوضع ${index === 0 ? 'الفاتح' : 'الداكن'}` : `Afficher le mode ${dashboard.name}`}
                aria-pressed={active === index}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
          <a
            className="landing-dashboard-expand"
            href={dashboards[active].image}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={isRtl ? 'تكبير صورة لوحة التحكم' : 'Agrandir la capture du tableau de bord'}
          >
            <Maximize2 size={17} aria-hidden="true" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}
