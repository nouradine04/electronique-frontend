import { useLandingPage } from './landing/useLandingPage';
import { LandingPageView } from './LandingPageView';

export function LandingPage({ onLoginSuccess, onNavigate, initialView = 'landing', appOnly = false }) {
  const state = useLandingPage({ onLoginSuccess, onNavigate, initialView, appOnly });
  return <LandingPageView state={state} onNavigate={onNavigate} appOnly={appOnly} />;
}
