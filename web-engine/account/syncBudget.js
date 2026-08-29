






















































export const PULL_COOLDOWN_MS = 12 * 60 * 60 * 1000;


export const MAX_PULLS_PER_DAY = 2;


export const MAX_PUSHES_PER_DAY = 4;


export const PUSH_MIN_GAP_MS = 5 * 60 * 1000;

export function emptyBudget() {
  return {
    
    
    
    
    
    lastPullMs: 0,
    lastPushMs: 0,
    
    day: null,
    pulls: 0,
    pushes: 0,
    
    
    
    lastDigest: null,
  };
}

export function normaliseBudget(raw) {
  const base = emptyBudget();
  if (!raw || typeof raw !== 'object') return base;
  const num = (v) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.floor(Number(v)) : 0);
  return {
    lastPullMs: num(raw.lastPullMs),
    lastPushMs: num(raw.lastPushMs),
    day: Number.isInteger(raw.day) && raw.day >= 0 ? raw.day : null,
    pulls: num(raw.pulls),
    pushes: num(raw.pushes),
    lastDigest: typeof raw.lastDigest === 'string' ? raw.lastDigest.slice(0, 32) : null,
  };
}





function forDay(budget, today) {
  const b = normaliseBudget(budget);
  if (today === null || b.day === today) return b;
  return { ...b, day: today, pulls: 0, pushes: 0 };
}









export function shouldPull(budget, { nowMs = 0, today = null, hasLocal = true } = {}) {
  const b = forDay(budget, today);
  if (b.pulls >= MAX_PULLS_PER_DAY) return false;
  if (!hasLocal) return true;
  if (b.lastPullMs <= 0) return true;
  
  
  const elapsed = nowMs - b.lastPullMs;
  return elapsed < 0 || elapsed >= PULL_COOLDOWN_MS;
}








export function shouldPush(budget, { nowMs = 0, today = null, digest = null, force = false } = {}) {
  const b = forDay(budget, today);
  if (!digest) return false;
  if (digest === b.lastDigest) return false;
  if (b.pushes >= MAX_PUSHES_PER_DAY) return false;
  if (force || b.lastPushMs <= 0) return true;
  const elapsed = nowMs - b.lastPushMs;
  return elapsed < 0 || elapsed >= PUSH_MIN_GAP_MS;
}

export function notePull(budget, { nowMs = 0, today = null } = {}) {
  const b = forDay(budget, today);
  return { ...b, lastPullMs: nowMs, pulls: b.pulls + 1 };
}

export function notePush(budget, { nowMs = 0, today = null, digest = null } = {}) {
  const b = forDay(budget, today);
  return { ...b, lastPushMs: nowMs, pushes: b.pushes + 1, lastDigest: digest ?? b.lastDigest };
}














export function digestOf(dto) {
  if (!dto || typeof dto !== 'object') return null;
  const flat = [];
  for (const key of Object.keys(dto).sort()) {
    const v = dto[key];
    if (v && typeof v === 'object') {
      for (const k2 of Object.keys(v).sort()) flat.push(`${key}.${k2}=${v[k2]}`);
    } else {
      flat.push(`${key}=${v}`);
    }
  }
  const s = flat.join('|');
  let h = 5381 >>> 0;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}
