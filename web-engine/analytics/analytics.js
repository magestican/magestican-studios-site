






































export const PLACEHOLDER_ID = 'G-XXXXXXXXXX';


export const MEASUREMENT_ID = 'G-XXXXXXXXXX';


const ID_SHAPE = /^G-[A-Z0-9]{6,}$/;






const FORBIDDEN_PARAMS = new Set([
  'name', 'player_name', 'username', 'nick', 'email', 'user_id', 'client_id',
  'peer_id', 'host_id', 'room', 'room_code', 'join', 'ip', 'lat', 'lng',
]);

const MAX_PARAM_CHARS = 100;   

let started = false;


export function isConfigured(id = MEASUREMENT_ID) {
  return typeof id === 'string' && id !== PLACEHOLDER_ID && ID_SHAPE.test(id);
}






export function deviceClass(nav = globalThis.navigator, win = globalThis) {
  const touchPoints = Number(nav?.maxTouchPoints) || 0;
  const coarse = typeof win?.matchMedia === 'function'
    && win.matchMedia('(pointer: coarse)').matches;
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(nav?.userAgent || '');
  return (touchPoints > 0 && (coarse || uaMobile)) || uaMobile ? 'mobile' : 'desktop';
}





export function sanitiseParams(params = {}) {
  const out = {};
  if (!params || typeof params !== 'object') return out;
  for (const [key, value] of Object.entries(params)) {
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(key)) continue;
    if (FORBIDDEN_PARAMS.has(key)) continue;
    if (value == null) continue;
    if (typeof value === 'number') {
      if (Number.isFinite(value)) out[key] = value;
    } else if (typeof value === 'boolean') {
      out[key] = value ? 1 : 0;
    } else if (typeof value === 'string') {
      const s = value.trim().slice(0, MAX_PARAM_CHARS);
      if (s) out[key] = s;
    }
    
    
  }
  return out;
}


export function baseConfig() {
  return {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    client_storage: 'none',
    transport_type: 'beacon',   
  };
}

function gtag(...args) {
  const w = globalThis;
  if (!w.dataLayer) return;
  
  w.dataLayer.push(args);
}





export function initAnalytics({ page } = {}) {
  if (started) return true;
  if (!isConfigured()) return false;
  const w = globalThis;
  const doc = w.document;
  if (!doc) return false;

  w.dataLayer = w.dataLayer || [];
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, {
    ...baseConfig(),
    ...(page ? { page_id: page } : {}),
    device_class: deviceClass(),
  });

  const s = doc.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  doc.head.appendChild(s);

  started = true;
  return true;
}





export function trackEvent(name, params = {}) {
  if (!isConfigured() || !started) return false;
  if (!/^[a-z][a-z0-9_]{0,39}$/.test(String(name))) return false;
  gtag('event', name, { ...sanitiseParams(params), device_class: deviceClass() });
  return true;
}






export function trackPlayClicks(root = globalThis.document) {
  if (!root || typeof root.addEventListener !== 'function') return () => {};
  const onClick = (e) => {
    const a = e.target?.closest?.('a[href*="/play/"]');
    if (!a) return;
    trackEvent('play_click', { game: gameIdFromPath(a.getAttribute('href')) });
  };
  root.addEventListener('click', onClick, { capture: true });
  return () => root.removeEventListener('click', onClick, { capture: true });
}


























const SLUG_TO_GAME_ID = Object.freeze({
  farmyshoot: 'team-bonding',
});

export function gameIdFromPath(href = '') {
  const m = /\/play\/([a-z0-9-]+)/i.exec(String(href));
  if (!m) return 'unknown';
  const slug = m[1].toLowerCase();
  return SLUG_TO_GAME_ID[slug] || slug;
}


export function __resetForTests() {
  started = false;
}
