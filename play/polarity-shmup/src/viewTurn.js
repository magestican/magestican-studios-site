

















export const HOLD_MS = 800;

export const SNAP_DEG = 30;

export const FLAT = 0.5;

const COS = { 0: 1, 90: 0, 180: -1, 270: 0 };
const SIN = { 0: 0, 90: 1, 180: 0, 270: -1 };
const norm = (a) => ((Math.round(a) % 360) + 360) % 360;

function rot(x, y, a) {
  const k = norm(a);
  const c = COS[k] ?? Math.cos(k * Math.PI / 180), s = SIN[k] ?? Math.sin(k * Math.PI / 180);
  return { x: x * c - y * s, y: x * s + y * c };
}


export function gravityFromTilt(beta, gamma) {
  const b = (beta || 0) * Math.PI / 180, g = (gamma || 0) * Math.PI / 180;
  return { x: Math.cos(b) * Math.sin(g), y: Math.sin(b) };
}





export function rawTurn(g, pageAngleDeg) {
  if (Math.hypot(g.x, g.y) < FLAT) return null;
  const v = rot(g.x, g.y, -pageAngleDeg); 
  const deg = norm(Math.atan2(-v.x, v.y) * 180 / Math.PI);
  const q = norm(Math.round(deg / 90) * 90);
  const off = Math.min(Math.abs(deg - q), 360 - Math.abs(deg - q));
  return off <= SNAP_DEG ? q : null;
}


export function createTurnTracker() {
  let current = 0, pending = null, since = 0, last = null;
  return {
    feed(beta, gamma, pageAngleDeg, now) {
      last = gravityFromTilt(beta, gamma);
      const q = rawTurn(last, pageAngleDeg);
      if (q === null || q === current) { pending = null; return current; }
      if (q !== pending) { pending = q; since = now; return current; }
      if (now - since >= HOLD_MS) { current = q; pending = null; }
      return current;
    },
    
    page(pageAngleDeg) {
      pending = null;
      if (!last) return current;
      const q = rawTurn(last, pageAngleDeg);
      if (q !== null) current = q;
      return current;
    },
    get turn() { return current; },
    reset() { current = 0; pending = null; last = null; },
  };
}


export function fieldToBox(px, py, w, h, sideways) {
  if (!sideways) return { x: px, y: py };
  return { x: h / 2 - (py - h / 2), y: w / 2 + (px - w / 2) };
}


export function viewAngle(turn, sideways) { return norm(turn + (sideways ? 90 : 0)); }


export function fitScale(vw, vh, fw, fh, angle) {
  return norm(angle) % 180 === 0 ? Math.min(vw / fw, vh / fh) : Math.min(vw / fh, vh / fw);
}


export function toField(dx, dy, angle) {
  const r = rot(dx, dy, -angle);
  return { x: r.x + 0, y: r.y + 0 }; 
}


export function sidewaysOn(pref, coarse, wide) {
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return !!(coarse && wide);
}


export function pageAngle(win) {
  const a = win?.screen?.orientation?.angle;
  if (typeof a === 'number') return norm(a);
  if (typeof win?.orientation === 'number') return norm(win.orientation);
  return 0;
}
