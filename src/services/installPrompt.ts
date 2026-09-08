export interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let pending: InstallPrompt | null = null;
export const getInstallPrompt = () => pending;
export const clearInstallPrompt = () => { pending = null; };
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  pending = event as InstallPrompt;
});
window.addEventListener('appinstalled', clearInstallPrompt);
