




































export const RAMP_ANGLE_DEG = 10;










export const RAMP_LENGTH = 6;


export const RAMP_WIDTH_FRAC = 0.42;










export const RAMP_BOOST = Object.freeze({ tier: 1, time: 0.70, power: 1.22, name: 'milk' });









export const RAMP_LAUNCH = 3.6;


export const RAMP_MIN_SPEED = 14;


export const RAMPS_PER_LAP = 5;


export const MIN_SPACING = 0.09;









export const MAX_CURVATURE = 0.012;


export const FEATURE_CLEARANCE_FRAC = 0.045;

const TAU = Math.PI * 2;


export function rampHeight(length = RAMP_LENGTH, angleDeg = RAMP_ANGLE_DEG) {
  return length * Math.tan((angleDeg * Math.PI) / 180);
}


function wrapFrac(d) {
  let x = d % 1;
  if (x > 0.5) x -= 1;
  if (x < -0.5) x += 1;
  return x;
}


export function fracGap(a, b) {
  return Math.abs(wrapFrac(a - b));
}









export function curvatureProfile(control) {
  const n = control.length;
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i += 1) {
    const a = control[(i - 1 + n) % n];
    const b = control[i];
    const c = control[(i + 1) % n];
    const h1 = Math.atan2(b.x - a.x, b.z - a.z);
    const h2 = Math.atan2(c.x - b.x, c.z - b.z);
    let turn = h2 - h1;
    while (turn > Math.PI) turn -= TAU;
    while (turn < -Math.PI) turn += TAU;
    const run = Math.hypot(c.x - a.x, c.z - a.z);
    out[i] = run > 0.001 ? Math.abs(turn) / run : 0;
  }
  return out;
}










export function rampsFor(track, opts = {}) {
  if (!track || !Array.isArray(track.control) || track.control.length < 4) return [];
  const control = track.control;
  const want = opts.count ?? RAMPS_PER_LAP;
  const spacing = opts.spacing ?? MIN_SPACING;
  const maxCurve = opts.maxCurvature ?? MAX_CURVATURE;
  const clearance = opts.clearance ?? FEATURE_CLEARANCE_FRAC;

  
  
  
  const s = [0];
  for (let i = 1; i < control.length; i += 1) {
    const a = control[i - 1]; const b = control[i];
    s.push(s[i - 1] + Math.hypot(b.x - a.x, b.z - a.z));
  }
  const closing = Math.hypot(control[0].x - control[control.length - 1].x,
    control[0].z - control[control.length - 1].z);
  const total = s[s.length - 1] + closing;
  if (total <= 0) return [];

  
  
  
  
  
  
  const avoid = [0];
  for (const j of track.jumps ?? []) if (typeof j.at === 'number') avoid.push(j.at);
  for (const g of track.glides ?? []) {
    if (typeof g.from === 'number') avoid.push(g.from);
    if (typeof g.to === 'number') avoid.push(g.to);
  }
  const spans = [];
  for (const h of track.hazards ?? []) {
    if (typeof h.from === 'number' && typeof h.to === 'number') spans.push([h.from, h.to]);
  }

  const curve = curvatureProfile(control);
  
  
  const candidates = [];
  for (let i = 0; i < control.length; i += 1) {
    const at = s[i] / total;
    if (curve[i] > maxCurve) continue;
    if (avoid.some((a) => fracGap(at, a) < clearance)) continue;
    if (spans.some(([f, t]) => inSpan(at, f, t, clearance))) continue;
    candidates.push({ at, curvature: curve[i], width: control[i].width ?? track.defaultWidth ?? 40 });
  }
  if (!candidates.length) return [];

  
  
  
  candidates.sort((a, b) => a.curvature - b.curvature);
  const chosen = [];
  for (const c of candidates) {
    if (chosen.length >= want) break;
    if (chosen.some((k) => fracGap(k.at, c.at) < spacing)) continue;
    chosen.push(c);
  }
  chosen.sort((a, b) => a.at - b.at);
  return chosen;
}


function inSpan(at, from, to, pad = 0) {
  const f = from - pad; const t = to + pad;
  if (f <= t) return at >= f && at <= t;
  return at >= f || at <= t;   
}











export function crossedRamp(ramps, prev, now, speed, opts = {}) {
  if (!ramps || !ramps.length || prev == null) return null;
  const moved = wrapFrac(now - prev);
  
  
  
  
  if (moved <= 0) return null;
  const min = opts.minSpeed ?? RAMP_MIN_SPEED;

  for (const ramp of ramps) {
    const toRamp = wrapFrac(ramp.at - prev);
    if (toRamp < 0 || toRamp > moved) continue;
    
    
    if (speed < min) return null;
    const ref = opts.refSpeed ?? 45;
    const scale = Math.min(1.25, speed / ref);
    return {
      ramp,
      vy: (opts.launch ?? RAMP_LAUNCH) * scale,
      boost: { ...(opts.boost ?? RAMP_BOOST) },
    };
  }
  return null;
}
