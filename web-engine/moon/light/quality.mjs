




























import { POOL_SIZE } from './lightPool.mjs';

export const TIERS = Object.freeze(['high', 'medium', 'low']);
export const TIER_ABOVE_MS = Object.freeze({ high: 21, medium: 40 });
export const MEASURE_MS = 2000;
export const MEASURE_MIN_FRAMES = 20;

export const SETTINGS = Object.freeze({
  high: Object.freeze({ pixelRatio: 2, effects: 1, shadowMapSize: 2048, shadowRadius: 5, bloom: true, bloomScale: 0.5, lights: POOL_SIZE.high, tiltShift: true, leaves: 64, insects: 3, birds: 5, water: 1, smoke: 48 }),
  medium: Object.freeze({ pixelRatio: 1.5, effects: 0.6, shadowMapSize: 1536, shadowRadius: 4, bloom: true, bloomScale: 0.35, lights: POOL_SIZE.medium, tiltShift: false, leaves: 32, insects: 2, birds: 3, water: 1, smoke: 24 }),
  low: Object.freeze({ pixelRatio: 1, effects: 0.35, shadowMapSize: 1024, shadowRadius: 3, bloom: false, bloomScale: 0, lights: POOL_SIZE.low, tiltShift: false, leaves: 0, insects: 0, birds: 0, water: 0, smoke: 0 }),
});

export function medianInterval(samples, n = samples.length) {
  const xs = [];
  const count = Math.min(n, samples.length);
  for (let i = 0; i < count; i += 1) if (samples[i] > 0) xs.push(samples[i]);
  if (xs.length === 0) return 0;
  xs.sort((a, b) => a - b);
  return xs[Math.floor(xs.length / 2)];
}

export function tierForInterval(medianMs) {
  if (!(medianMs > 0)) return 'high';
  if (medianMs <= TIER_ABOVE_MS.high) return 'high';
  if (medianMs <= TIER_ABOVE_MS.medium) return 'medium';
  return 'low';
}

export function decideTier(samples, n, elapsedMs) {
  if (n < MEASURE_MIN_FRAMES || elapsedMs < MEASURE_MS) return null;
  const median = medianInterval(samples, n);
  return { tier: tierForInterval(median), median };
}


export function tierFromParam(value) {
  return TIERS.includes(value) ? value : null;
}































export const WATCH = Object.freeze({
  settleMs: 2000,        
  windowMs: 30000,       
  minFrames: 20,         
  downWindows: 2,        
  upAfterMs: 60000,      
  upHeadroom: 0.3,       
  upEveryMs: 300000,     
});


export function tierAbove(tier) {
  const i = TIERS.indexOf(tier);
  return i > 0 ? TIERS[i - 1] : null;
}


export function tierBelow(tier) {
  const i = TIERS.indexOf(tier);
  return i >= 0 && i < TIERS.length - 1 ? TIERS[i + 1] : null;
}


export function isWorse(a, b) {
  return TIERS.indexOf(a) > TIERS.indexOf(b);
}









export function createTierWatch({ tier = 'high', startedAt = 0, config = WATCH } = {}) {
  const c = { ...WATCH, ...config };
  if (!TIERS.includes(tier)) throw new Error(`unknown quality tier '${tier}'`);
  let current = tier;
  let windowStart = null;
  let frames = [];
  let bad = 0;
  let changedAt = startedAt;
  
  
  let lastUpAt = -Infinity;
  let windows = 0;
  let lastMedian = 0;

  const step = (next, reason, median, now) => {
    const from = current;
    current = next;
    changedAt = now;
    bad = 0;
    return { tier: next, from, median, reason };
  };

  return {
    get tier() { return current; },
    
    get windows() { return windows; },
    get median() { return lastMedian; },
    
    get pending() { return frames.length; },
    get badWindows() { return bad; },
    config: Object.freeze(c),

    sample(intervalMs, nowMs) {
      if (!Number.isFinite(intervalMs) || intervalMs <= 0) return null;
      if (nowMs - startedAt < c.settleMs) return null;
      if (windowStart === null) windowStart = nowMs;
      frames.push(intervalMs);
      if (nowMs - windowStart < c.windowMs) return null;

      const median = medianInterval(frames);
      const n = frames.length;
      frames = [];
      windowStart = nowMs;
      
      
      
      if (n < c.minFrames) return null;
      windows += 1;
      lastMedian = median;

      const want = tierForInterval(median);
      if (isWorse(want, current)) {
        bad += 1;
        if (bad < c.downWindows) return null;
        
        
        
        return step(want, 'down', median, nowMs);
      }
      bad = 0;

      const up = tierAbove(current);
      if (!up) return null;
      if (nowMs - changedAt < c.upAfterMs) return null;
      if (nowMs - lastUpAt < c.upEveryMs) return null;
      if (!(median <= TIER_ABOVE_MS[up] * (1 - c.upHeadroom))) return null;
      lastUpAt = nowMs;
      return step(up, 'up', median, nowMs);
    },
  };
}













export const TIER_KEY = 'fml.tier';


export function readTier(storage) {
  try {
    const raw = storage && storage.getItem(TIER_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return null;
    return tierFromParam(saved.tier);
  } catch {
    return null;   
  }
}

export function writeTier(storage, tier, at = Date.now()) {
  try {
    if (!storage || !TIERS.includes(tier)) return false;
    storage.setItem(TIER_KEY, JSON.stringify({ tier, at }));
    return true;
  } catch {
    return false;
  }
}














































export function rendererFlags({
  settings,
  devicePixelRatio = 1,
  coarsePointer = false,
  capturing = false,
} = {}) {
  const cap = settings && settings.pixelRatio > 0 ? settings.pixelRatio : 1;
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  const effectivePixelRatio = Math.min(dpr, cap);
  return {
    antialias: !(coarsePointer && effectivePixelRatio >= 2),
    preserveDrawingBuffer: Boolean(capturing),
  };
}






export function isCapturing(search, nav) {
  const shot = search && typeof search.get === 'function' && search.get('shot') === '1';
  const driven = Boolean(nav && nav.webdriver);
  return shot || driven;
}
