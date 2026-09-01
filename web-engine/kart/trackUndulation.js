





























































export const RIPPLE_AMPLITUDE = 1.0;










export const RIPPLE_WAVELENGTH = 62;







export const STEEP_GRADIENT = 0.06;


export const FEATURE_CLEARANCE = 45;

const TAU = Math.PI * 2;














export function undulate(control, opts = {}) {
  if (!Array.isArray(control) || control.length < 4) return control;
  const amplitude = opts.amplitude ?? RIPPLE_AMPLITUDE;
  const wavelength = opts.wavelength ?? RIPPLE_WAVELENGTH;
  const seed = opts.seed ?? 0;
  const protect = opts.protect ?? [];
  const clearance = opts.clearance ?? FEATURE_CLEARANCE;

  
  
  
  
  const s = [0];
  for (let i = 1; i < control.length; i += 1) {
    const a = control[i - 1]; const b = control[i];
    s.push(s[i - 1] + Math.hypot(b.x - a.x, b.z - a.z));
  }
  const last = control[control.length - 1];
  const first = control[0];
  const closing = Math.hypot(first.x - last.x, first.z - last.z);
  const total = s[s.length - 1] + closing;

  
  
  
  
  const cycles = Math.max(1, Math.round(total / wavelength));
  const k = (TAU * cycles) / total;

  return control.map((p, i) => {
    const gradient = localGradient(control, s, i);
    
    const flatness = Math.max(0, 1 - gradient / STEEP_GRADIENT);
    const guard = featureGuard(s[i], total, protect, clearance);
    const lift = Math.sin(k * s[i] + seed) * amplitude * flatness * guard;
    return { ...p, y: (p.y ?? 0) + lift };
  });
}















export function undulateTrack(track, opts = {}) {
  if (!track || !Array.isArray(track.control)) return track ? track.control : track;
  const control = track.control;
  let total = 0;
  for (let i = 1; i < control.length; i += 1) {
    total += Math.hypot(control[i].x - control[i - 1].x, control[i].z - control[i - 1].z);
  }
  const last = control[control.length - 1];
  total += Math.hypot(control[0].x - last.x, control[0].z - last.z);

  const fractions = [];
  for (const j of track.jumps ?? []) if (typeof j.at === 'number') fractions.push(j.at);
  for (const g of track.glides ?? []) {
    if (typeof g.from === 'number') fractions.push(g.from);
    if (typeof g.to === 'number') fractions.push(g.to);
  }
  
  
  
  
  for (const r of track.ramps ?? []) if (typeof r.at === 'number') fractions.push(r.at);

  
  
  
  fractions.push(0);

  return undulate(control, {
    ...opts,
    protect: fractions.map((f) => f * total),
  });
}








export function localGradient(control, s, i) {
  const n = control.length;
  const prev = (i - 1 + n) % n;
  const next = (i + 1) % n;
  const a = control[prev]; const b = control[next];
  const run = Math.hypot(b.x - a.x, b.z - a.z);
  if (run < 0.001) return 0;
  return Math.abs((b.y ?? 0) - (a.y ?? 0)) / run;
}















export function featureGuard(at, total, protect, clearance = FEATURE_CLEARANCE) {
  let g = 1;
  for (const p of protect) {
    let d = Math.abs(at - p);
    if (total > 0) d = Math.min(d, total - d);
    if (d >= clearance) continue;
    
    
    const t = d / clearance;
    g = Math.min(g, t * t * (3 - 2 * t));
  }
  return g;
}








export function longestFlatRun(control, tolerance = 1.2) {
  if (!Array.isArray(control) || control.length < 2) return 0;
  let best = 0; let run = 0; let drop = 0;
  for (let i = 1; i < control.length; i += 1) {
    const a = control[i - 1]; const b = control[i];
    const d = Math.hypot(b.x - a.x, b.z - a.z);
    const dy = Math.abs((b.y ?? 0) - (a.y ?? 0));
    if (drop + dy < tolerance) { run += d; drop += dy; } else { best = Math.max(best, run); run = d; drop = dy; }
  }
  return Math.max(best, run);
}
