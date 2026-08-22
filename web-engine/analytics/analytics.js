// Studio-wide traffic measurement (Google Analytics 4).
//
// ─── WHERE THE MEASUREMENT ID GOES ──────────────────────────────────────────
// MEASUREMENT_ID below. That constant is the ONLY place the id appears in the
// whole repo — every page and every game imports this module rather than
// pasting a gtag snippet into its own <head>. Pasting the snippet per page is
// how a site ends up with three pages on the old property and nobody noticing
// for a month.
//
// While MEASUREMENT_ID is still the placeholder this module is a hard NO-OP:
// nothing is injected, no request is made, no dataLayer is created. Firing at
// a fake id would put junk hits into whatever real property happens to own
// that string, and would make "is analytics live?" unanswerable from the
// network tab.
//
// ─── WHY IT IS CONFIGURED THE WAY IT IS ─────────────────────────────────────
// Every landing page in this site sells "no accounts, no tracking of
// individuals". Measurement that quietly contradicts the marketing copy is a
// lie, not a metric, so the config below is deliberately the weakest form of
// GA4 that still answers "how many people played, on what, and did they
// finish a match":
//
//   client_storage: 'none'   → no _ga cookie, no device identifier stored.
//   anonymize_ip: true       → Google truncates the IP before it is logged.
//   allow_google_signals     → off: no cross-site ads/demographics join.
//   allow_ad_personalization → off: the data can never feed an ad audience.
//
// The cost is real and is documented in docs/features/analytics.md: with no
// stored client id, GA4 mints a fresh one per page load, so "users" reads the
// same as "sessions". We would rather under-count people than identify them.
//
// Usage in an HTML page:
//   <script type="module">
//     import { initAnalytics, trackPlayClicks } from '/web-engine/analytics/analytics.js';
//     initAnalytics({ page: 'home' });
//     trackPlayClicks();
//   </script>

/** The stand-in that ships in git. Never a real property. */
export const PLACEHOLDER_ID = 'G-XXXXXXXXXX';

/** ▼▼▼ Bryan: paste the real GA4 Measurement ID here (Admin → Data streams). ▼▼▼ */
export const MEASUREMENT_ID = 'G-XXXXXXXXXX';

/** GA4 stream ids are 'G-' + at least six upper-case alphanumerics. */
const ID_SHAPE = /^G-[A-Z0-9]{6,}$/;

// Param keys that could carry a person rather than a fact. The game knows
// player names, peer ids and room codes, and every one of them is one careless
// `trackEvent` argument away from being a pseudonymous identifier in a
// third-party log. Dropping them here means an event author cannot leak one by
// accident, only by editing this list on purpose.
const FORBIDDEN_PARAMS = new Set([
  'name', 'player_name', 'username', 'nick', 'email', 'user_id', 'client_id',
  'peer_id', 'host_id', 'room', 'room_code', 'join', 'ip', 'lat', 'lng',
]);

const MAX_PARAM_CHARS = 100;   // GA4's own limit for an event-param value

let started = false;

/** True only when MEASUREMENT_ID has been replaced with a real GA4 stream id. */
export function isConfigured(id = MEASUREMENT_ID) {
  return typeof id === 'string' && id !== PLACEHOLDER_ID && ID_SHAPE.test(id);
}

/**
 * 'mobile' | 'desktop'. Coarse on purpose — a model string is a fingerprinting
 * surface, and "did phone players finish matches?" only needs the two buckets.
 * Takes its inputs as arguments so it is testable off a browser.
 */
export function deviceClass(nav = globalThis.navigator, win = globalThis) {
  const touchPoints = Number(nav?.maxTouchPoints) || 0;
  const coarse = typeof win?.matchMedia === 'function'
    && win.matchMedia('(pointer: coarse)').matches;
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(nav?.userAgent || '');
  return (touchPoints > 0 && (coarse || uaMobile)) || uaMobile ? 'mobile' : 'desktop';
}

/**
 * Strip an event's params down to things that are safe and that GA4 will
 * actually accept. Returns a new object; never mutates the input.
 */
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
    // objects/arrays/functions are dropped: GA4 flattens them into useless
    // strings, and a nested object is the usual shape of an accidental dump.
  }
  return out;
}

/** The gtag config we send. Exported so a test can assert privacy stays on. */
export function baseConfig() {
  return {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    client_storage: 'none',
    transport_type: 'beacon',   // survives the tab closing at match end
  };
}

function gtag(...args) {
  const w = globalThis;
  if (!w.dataLayer) return;
  // gtag.js reads `arguments`, so the array itself must be pushed.
  w.dataLayer.push(args);
}

/**
 * Load gtag.js once and register the page view.
 * @returns {boolean} true if analytics actually started.
 */
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

/**
 * Record one custom event. Safe to call from anywhere at any time: before
 * init, with analytics unconfigured, or on a page with no network.
 */
export function trackEvent(name, params = {}) {
  if (!isConfigured() || !started) return false;
  if (!/^[a-z][a-z0-9_]{0,39}$/.test(String(name))) return false;
  gtag('event', name, { ...sanitiseParams(params), device_class: deviceClass() });
  return true;
}

/**
 * Landing pages exist to send people to a game; this is the one number that
 * says whether they do. Delegated on the document so it keeps working for
 * links added after load.
 */
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

/** '/play/team-bondage/?x=1' -> 'team-bondage'. Exported for the test. */
export function gameIdFromPath(href = '') {
  const m = /\/play\/([a-z0-9-]+)/i.exec(String(href));
  return m ? m[1].toLowerCase() : 'unknown';
}

/** Test seam: forget that init ran. Not used by the site. */
export function __resetForTests() {
  started = false;
}
