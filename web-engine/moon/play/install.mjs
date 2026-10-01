




















































export const CACHE_PREFIX = 'farmy-moon-';
export const CACHE_VERSION = 'l19-1';
export const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

















export const CDN_HOSTS = Object.freeze([]);







export function keepForOffline(url, { origin } = {}) {
  
  
  if (!url) return false;
  let u;
  try {
    u = new URL(String(url), origin);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  
  
  
  
  
  if (u.pathname.endsWith('version.json')) return false;
  if (u.origin === origin) return true;
  return CDN_HOSTS.includes(u.hostname);
}









export function offlineList(urls, { origin } = {}) {
  const out = [];
  const seen = new Set();
  for (const raw of urls || []) {
    if (!keepForOffline(raw, { origin })) continue;
    const clean = String(new URL(String(raw), origin));
    const noHash = clean.split('#')[0];
    if (seen.has(noHash)) continue;
    seen.add(noHash);
    out.push(noHash);
  }
  return out;
}















export function installPlatform({ userAgent = '', standalone = false, touchPoints = 0 } = {}) {
  if (standalone) return 'installed';
  const ua = String(userAgent);
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Macintosh/i.test(ua) && Number(touchPoints) > 1) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}







const STEPS = Object.freeze({
  android: Object.freeze({
    title: 'Install Farmy Moon',
    lead: 'Put it on your home screen and it opens like an app - full screen, no address bar, and it plays with the signal off.',
    steps: Object.freeze([
      'Tap the three dots at the top right of the browser.',
      'Tap "Install app", or "Add to Home screen" if that is what yours says.',
      'Tap Install. Farmy Moon appears with your other apps.',
    ]),
  }),
  ios: Object.freeze({
    title: 'Install Farmy Moon',
    lead: 'Put it on your home screen and it opens like an app - full screen, no address bar, and it plays with the signal off.',
    steps: Object.freeze([
      'Open this page in Safari. On an iPhone only Safari can add to the home screen.',
      'Tap the Share button - the square with an arrow coming out of the top, at the bottom of the screen.',
      'Scroll down the list and tap "Add to Home Screen".',
      'Tap Add. Farmy Moon appears with your other apps.',
    ]),
    
    note: 'An iPhone never offers to install a game by itself, so these steps are the only way to find it.',
  }),
  desktop: Object.freeze({
    title: 'Install Farmy Moon',
    lead: 'It installs on a computer too, and then it opens in its own window and plays with no connection.',
    steps: Object.freeze([
      'Look for the install icon at the right-hand end of the address bar and click it.',
      'Or open the browser menu and choose "Install Farmy Moon Life".',
    ]),
  }),
  installed: Object.freeze({
    title: 'Farmy Moon is installed',
    lead: 'You are playing the installed app. It is on your home screen and it opens from there with no connection at all.',
    steps: Object.freeze([]),
  }),
});





export function installSteps(platform) {
  return STEPS[platform] || STEPS.desktop;
}










export function offlineLine({ supported = false, controlling = false, files = 0 } = {}) {
  if (!supported) return 'This browser cannot keep the game for offline play.';
  if (files > 0) return `Ready to play offline - ${files} ${files === 1 ? 'file is' : 'files are'} kept on this device.`;
  if (controlling) return 'Keeping the game on this device...';
  return 'Stay on this page a moment with signal, and the game is kept for offline play.';
}
