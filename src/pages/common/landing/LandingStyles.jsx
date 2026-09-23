export function LandingStyles({  }) {
  return (
<style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(14, 107, 168, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(14, 107, 168, 0); }
          100% { box-shadow: 0 0 0 0 rgba(14, 107, 168, 0); }
        }
        @keyframes drawLine {
          to { width: 100%; }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .pulsing-badge {
          animation: pulseGlow 2.5s infinite;
        }
        .hero-underline {
          position: relative;
          display: inline-block;
          white-space: nowrap;
        }
        .hero-underline::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 6px;
          background-color: #f59e0b; /* Golden marker highlight */
          border-radius: 4px;
          animation: drawLine 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
        }
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-scale:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.15);
        }
        
        /* Hero responsive scaling */
        .hero-title {
          font-size: 3.5rem;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin: 0 0 20px 0;
          color: var(--text-primary);
        }
        .hero-desc {
          font-size: 1.25rem;
          color: var(--text-secondary);
          max-width: 680px;
          line-height: 1.5;
          margin: 0 0 40px 0;
        }
        
        @media (max-width: 992px) {
          .landing-nav {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.1rem !important;
            line-height: 1.25 !important;
            letter-spacing: -0.8px !important;
          }
          .hero-desc {
            font-size: 1.05rem !important;
            margin-bottom: 28px !important;
            line-height: 1.45 !important;
          }
        }
        @media (max-width: 576px) {
          .landing-header {
            padding: 10px 16px !important;
            flex-direction: row !important; /* Single line alignment */
            justify-content: space-between !important;
            align-items: center !important;
            gap: 8px !important;
          }
          .landing-logo {
            width: clamp(76px, 21vw, 106px) !important;
            height: clamp(76px, 21vw, 106px) !important;
          }
          .landing-logo-text {
            font-size: 20px !important;
            letter-spacing: -0.8px !important;
          }
          .landing-actions {
            width: auto !important;
            gap: 6px !important;
          }
          .landing-actions button {
            font-size: 11px !important;
            padding: 6px 10px !important;
          }
        }
      `}</style>
  );
}
