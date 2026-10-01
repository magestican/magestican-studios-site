


































export const SAVE_VERSION = 1;


export const SAVE_KEY = 'feh.save.v1';


export const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;   

const num = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));








export function makeSave(run, atMs) {
  return {
    v: SAVE_VERSION,
    at: num(atMs, 0),
    deck: Math.max(1, Math.round(num(run?.deck, 1))),
    health: clamp(num(run?.health, 100), 0, 999),
    stamina: clamp(num(run?.stamina, 100), 0, 999),
    ammo: Math.max(0, Math.round(num(run?.ammo, 0))),
    weapon: typeof run?.weapon === 'string' ? run.weapon : '',
    x: num(run?.x, 0),
    z: num(run?.z, 0),
    yaw: num(run?.yaw, 0),
    seenIntro: true,   
  };
}









export function normaliseSave(raw) {
  let o = raw;
  if (typeof o === 'string') {
    try { o = JSON.parse(o); } catch { return null; }
  }
  if (!o || typeof o !== 'object') return null;
  if (o.v !== SAVE_VERSION) return null;          
  if (!Number.isFinite(o.deck) || o.deck < 1) return null;
  
  
  if (!Number.isFinite(o.health) || o.health <= 0) return null;
  return makeSave(o, o.at);
}













export function newerOf(a, b) {
  const A = normaliseSave(a);
  const B = normaliseSave(b);
  if (!A) return B;
  if (!B) return A;
  return B.at > A.at ? B : A;
}









export function isConflict(a, b, gapMs = 120000) {
  const A = normaliseSave(a);
  const B = normaliseSave(b);
  if (!A || !B) return false;
  return A.deck !== B.deck && Math.abs(A.at - B.at) > gapMs;
}


export function agoText(save, nowMs) {
  const s = normaliseSave(save);
  if (!s) return '';
  const d = Math.max(0, num(nowMs, 0) - s.at);
  const mins = Math.floor(d / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}


export function describeSave(save, nowMs) {
  const s = normaliseSave(save);
  if (!s) return '';
  return `DECK ${s.deck} · ${Math.round(s.health)}% · ${agoText(s, nowMs)}`;
}
