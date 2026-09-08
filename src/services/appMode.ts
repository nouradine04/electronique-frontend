export function isInstalledApp(): boolean {
  return new URLSearchParams(window.location.search).get('app') === '1'
    || window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    || '__TAURI_INTERNALS__' in window;
}
