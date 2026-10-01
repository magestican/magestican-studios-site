









































import { POOL_SIZE } from './lightPool.mjs';

export const TIERS = Object.freeze(['high', 'medium', 'low']);
export const TIER_ABOVE_MS = Object.freeze({ high: 21, medium: 40 });
export const MEASURE_MS = 2000;
export const MEASURE_MIN_FRAMES = 20;

export const SETTINGS = Object.freeze({
  high: Object.freeze({ pixelRatio: 2, effects: 1, shadowMapSize: 2048, shadowRadius: 5, bloom: true, bloomScale: 0.5, bloomKind: 'mip', lights: POOL_SIZE.high, tiltShift: true, leaves: 64, insects: 3, birds: 5, water: 1, smoke: 48, embers: 32, splash: 48, silhouette: 1, parts: 1 }),
  medium: Object.freeze({ pixelRatio: 1.5, effects: 0.6, shadowMapSize: 1536, shadowRadius: 4, bloom: true, bloomScale: 0.35, lights: POOL_SIZE.medium, tiltShift: false, leaves: 32, insects: 2, birds: 3, water: 1, smoke: 24, embers: 16, splash: 24, silhouette: 1, parts: 1 }),
  low: Object.freeze({ pixelRatio: 1, effects: 0.35, shadowMapSize: 1024, shadowRadius: 3, bloom: false, bloomScale: 0, lights: POOL_SIZE.low, tiltShift: false, leaves: 0, insects: 0, birds: 0, water: 0, smoke: 0, embers: 0, splash: 0, silhouette: 1, parts: 0 }),
});












export const BLOOM_LEVELS = 5;
export function bloomDraws(s) {
  if (!s || !s.bloom) return 0;
  return s.bloomKind === 'mip' ? 3 : 3 + 2 * BLOOM_LEVELS;
}

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
  
  cadenceSpread: 1.1,    
  cadenceDrops: 0.05,    
  cadenceRoom: 0.9,      
  probationWindows: 2,   
  failWithinMs: 300000,  
  retryBaseMs: 1800000,  
  retryMaxMs: 604800000, 
  keptMs: 600000,        
});





























export function heldCadence(frames, config = WATCH) {
  const c = { ...WATCH, ...config };
  const xs = frames.filter((x) => x > 0).sort((a, b) => a - b);
  if (xs.length < c.minFrames) return null;
  const cadence = xs[Math.floor(xs.length * 0.1)];
  const median = xs[Math.floor(xs.length / 2)];
  if (!(median <= cadence * c.cadenceSpread)) return null;
  const drops = xs.filter((x) => x >= cadence * 1.5).length / xs.length;
  if (drops > c.cadenceDrops) return null;
  return cadence;
}











export function cleanHistory(h, now = Date.now(), maxMs = WATCH.retryMaxMs) {
  const out = { fails: {}, retryAfter: {} };
  if (!h || typeof h !== 'object') return out;
  for (const t of TIERS) {
    const f = h.fails && Number(h.fails[t]);
    const r = h.retryAfter && Number(h.retryAfter[t]);
    if (Number.isFinite(f) && f > 0) out.fails[t] = Math.min(64, Math.floor(f));
    if (Number.isFinite(r) && r > 0) out.retryAfter[t] = Math.min(r, now + maxMs);
  }
  return out;
}


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




























export function createTierWatch({ tier = 'high', startedAt = 0, config = WATCH, history = null, wall = () => Date.now(), trial = null } = {}) {
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
  
  const hist = cleanHistory(history, wall());
  let climbed = null;   

  const step = (next, reason, median, now) => {
    const from = current;
    current = next;
    changedAt = now;
    bad = 0;
    return { tier: next, from, median, reason };
  };
  const failClimb = (to) => {
    const n = (hist.fails[to] || 0) + 1;
    hist.fails[to] = n;
    hist.retryAfter[to] = wall() + Math.min(c.retryMaxMs, c.retryBaseMs * 2 ** (n - 1));
  };
  
  
  const failsClimb = (want, decidedMs) => Boolean(climbed && decidedMs - climbed.at <= c.failWithinMs && isWorse(want, climbed.to) === true);
  const down = (want, median, nowMs, decidedMs = nowMs) => {
    let reason = 'down';
    if (failsClimb(want, decidedMs)) {
      failClimb(climbed.to);
      reason = 'failed-climb';
    }
    climbed = null;
    return step(want, reason, median, nowMs);
  };
  const climb = (up, reason, median, nowMs) => {
    lastUpAt = nowMs;
    climbed = { to: up, at: nowMs, windows: 0 };
    return step(up, reason, median, nowMs);
  };
  
  
  
  if (trial && TIERS.includes(trial) && trial !== tier) {
    if (isWorse(tier, trial)) failClimb(trial);
  } else if (trial && trial === tier) {
    lastUpAt = startedAt;
    climbed = { to: trial, at: startedAt, windows: 0 };
  }
  let waiting = null;   

  return {
    get tier() { return current; },
    
    get windows() { return windows; },
    get median() { return lastMedian; },
    
    get pending() { return frames.length; },
    get badWindows() { return bad; },
    
    get history() { return cleanHistory(hist, wall()); },
    
    get waiting() { return waiting ? { kind: waiting.kind, tier: waiting.tier, reason: waiting.reason } : null; },
    





    get remember() {
      const h = cleanHistory(hist, wall());
      if (waiting && waiting.kind === 'up') return { tier: waiting.tier, trial: true, history: h };
      if (waiting && waiting.kind === 'down') {
        if (failsClimb(waiting.tier, waiting.at)) {
          const to = climbed.to;
          const n = (h.fails[to] || 0) + 1;
          h.fails[to] = n;
          h.retryAfter[to] = wall() + Math.min(c.retryMaxMs, c.retryBaseMs * 2 ** (n - 1));
        }
        return { tier: waiting.tier, trial: false, history: h };
      }
      return { tier: current, trial: Boolean(climbed && climbed.windows <= c.probationWindows), history: h };
    },
    config: Object.freeze(c),

    sample(intervalMs, nowMs, { hidden = true } = {}) {
      if (!Number.isFinite(intervalMs) || intervalMs <= 0) return null;
      if (nowMs - startedAt < c.settleMs) return null;
      
      
      if (waiting && hidden) {
        const w = waiting;
        waiting = null;
        if (w.kind === 'up' && wall() >= (hist.retryAfter[w.tier] || 0) && tierAbove(current) === w.tier) {
          frames = [];
          windowStart = null;
          return climb(w.tier, w.reason, w.median, nowMs);
        }
        if (w.kind === 'down' && isWorse(w.tier, current)) {
          frames = [];
          windowStart = null;
          return down(w.tier, w.median, nowMs, w.at);
        }
      }
      if (windowStart === null) windowStart = nowMs;
      frames.push(intervalMs);
      if (nowMs - windowStart < c.windowMs) return null;

      const median = medianInterval(frames);
      const n = frames.length;
      const closed = frames;
      frames = [];
      windowStart = nowMs;
      
      
      
      if (n < c.minFrames) return null;
      windows += 1;
      lastMedian = median;
      if (climbed) climbed.windows += 1;

      const want = tierForInterval(median);
      if (isWorse(want, current)) {
        bad += 1;
        if (waiting && waiting.kind === 'up') waiting = null; 
        
        const onTrial = climbed && climbed.windows <= c.probationWindows;
        if (bad < c.downWindows && !onTrial) return null;
        
        
        if (bad < c.downWindows && !hidden) {
          waiting = { kind: 'down', tier: want, reason: 'failed-climb', median, at: nowMs };
          return null;
        }
        waiting = null;
        
        
        
        return down(want, median, nowMs);
      }
      bad = 0;
      
      
      waiting = null;
      
      if (climbed && nowMs - climbed.at >= c.keptMs) {
        delete hist.fails[climbed.to];
        delete hist.retryAfter[climbed.to];
        climbed = null;
      }

      const up = tierAbove(current);
      if (!up) return null;
      if (nowMs - changedAt < c.upAfterMs) return null;
      if (nowMs - lastUpAt < c.upEveryMs) return null;
      const roomy = median <= TIER_ABOVE_MS[up] * (1 - c.upHeadroom);
      
      
      const cadence = roomy ? null : heldCadence(closed, c);
      const held = cadence !== null && cadence <= TIER_ABOVE_MS[up] * c.cadenceRoom;
      if (!roomy && !held) return null;
      if (wall() < (hist.retryAfter[up] || 0)) return null;
      const reason = roomy ? 'up' : 'up-held';
      
      if (!hidden) {
        waiting = { kind: 'up', tier: up, reason, median, at: nowMs };
        return null;
      }
      return climb(up, reason, median, nowMs);
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


export function readTierHistory(storage) {
  try {
    const raw = storage && storage.getItem(TIER_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    return cleanHistory(saved && typeof saved === 'object' ? saved.history : null);
  } catch {
    return cleanHistory(null);
  }
}




export function writeTier(storage, tier, at = Date.now(), history = null, trial = false) {
  try {
    if (!storage || !TIERS.includes(tier)) return false;
    const h = cleanHistory(history, at);
    const any = Object.keys(h.fails).length || Object.keys(h.retryAfter).length;
    const saved = any ? { tier, at, history: h } : { tier, at };
    if (trial) saved.trial = true;
    storage.setItem(TIER_KEY, JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}


export function readTierTrial(storage) {
  try {
    const raw = storage && storage.getItem(TIER_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    return saved && typeof saved === 'object' && saved.trial === true ? tierFromParam(saved.tier) : null;
  } catch {
    return null;
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
