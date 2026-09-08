












































import { prelight, flickerSchedule } from './tools/prelight.mjs';
import { insideLevel, runRect } from './level.js';

export const LIGHT = Object.freeze({
  mount: 0.22,
  
  
  
  
  
  
  
  
  
  radius: 1.5,
  cutoff: 4,
  ambient: 0.08,
  gain: 2,
  intensity: Object.freeze({ sodium: 8.0, fluorescent: 7.0, emergency: 6.0 }),
  room: Object.freeze({ radius: 2.2, intensity: 6.0, mount: 0.25 }),
  bay: Object.freeze({ radius: 1.8, intensity: 5.0 }),
  
  
  
  dimmedAt: 0.85,
  flicker: Object.freeze({ rate: 30, seconds: 30 }),
});


export const LIGHT_MODES = Object.freeze({
  normal: Object.freeze({ scale: 1, tint: Object.freeze([1, 1, 1]), ambient: 1 }),
  out: Object.freeze({ scale: 0.04, tint: Object.freeze([1, 1, 1]), ambient: 0.5 }),
  emergency: Object.freeze({ scale: 0.55, tint: Object.freeze([1, 0.22, 0.2]), ambient: 0.7 }),
});

export function hexRgb(h) {
  const n = typeof h === 'number' ? h : parseInt(String(h).replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}







export function fixturesFor(dressing, plan, { height = 2.95, seed = 1 } = {}) {
  const out = [];
  const kind = dressing.lights.kind;
  const colour = hexRgb(dressing.lights.colour);
  const base = LIGHT.intensity[kind] === undefined ? LIGHT.intensity.sodium : LIGHT.intensity[kind];
  dressing.lights.fixtures.forEach((f, i) => {
    out.push({
      x: f.x, y: height - LIGHT.mount, z: f.z, colour,
      radius: LIGHT.radius, intensity: f.dead ? 0 : base, cutoff: LIGHT.cutoff,
      flicker: !!f.flicker && !f.dead, dead: !!f.dead, kind, run: f.run, progress: f.progress,
      seed: (seed * 7919 + i * 131 + 17) >>> 0, phase: f.phase || 0,
    });
  });
  dressing.rooms.forEach((r, i) => {
    out.push({
      x: r.light.x, y: height - LIGHT.room.mount, z: r.light.z, colour: hexRgb(r.light.colour),
      radius: LIGHT.room.radius, intensity: LIGHT.room.intensity, cutoff: LIGHT.cutoff,
      flicker: false, dead: false, kind: r.room.kind === 'safe' ? 'safe' : 'room', run: -1, progress: -1,
      seed: (seed * 7919 + 5000 + i * 131) >>> 0, phase: 0,
    });
  });
  (plan.bays || []).forEach((b, i) => {
    out.push({
      x: b.car.x + b.car.face.x * 0.4, y: height - LIGHT.mount, z: b.car.z + b.car.face.z * 0.4, colour,
      radius: LIGHT.bay.radius, intensity: LIGHT.bay.intensity, cutoff: LIGHT.cutoff,
      flicker: false, dead: false, kind: 'bay', run: -1, progress: -1,
      seed: (seed * 7919 + 9000 + i * 131) >>> 0, phase: 0,
    });
  });
  return out;
}

const inRectPad = (r, x, z, pad) => x >= r.x0 + pad && x <= r.x1 - pad && z >= r.z0 + pad && z <= r.z1 - pad;


















export function visibilityFor(plan, { step = 0.25, pad = 0.2, skirt = 0.45 } = {}) {
  const rects = plan.runs.map(runRect);
  const roomRects = plan.rooms.map((m) => ({ x0: m.x0, x1: m.x1, z0: m.z0, z1: m.z1 }));
  const loose = -0.03;
  const sameBox = (ax, az, bx, bz) => {
    for (const r of rects) if (inRectPad(r, ax, az, loose) && inRectPad(r, bx, bz, loose)) return true;
    for (const r of roomRects) if (inRectPad(r, ax, az, loose) && inRectPad(r, bx, bz, loose)) return true;
    return false;
  };
  return (from, to) => {
    const ax = from[0]; const az = from[2]; const bx = to[0]; const bz = to[2];
    if (sameBox(ax, az, bx, bz)) return true;
    const d = Math.hypot(bx - ax, bz - az);
    if (d <= skirt * 2) return true;
    const n = Math.max(1, Math.ceil(d / step));
    for (let i = 1; i < n; i += 1) {
      const t = i / n;
      const along = t * d;
      if (along < skirt || d - along < skirt) continue;
      if (!insideLevel(plan, ax + (bx - ax) * t, az + (bz - az) * t, pad)) return false;
    }
    return true;
  };
}


export function fixturesNear(fixtures, box) {
  const out = [];
  fixtures.forEach((f, i) => {
    if (!(f.intensity > 0)) return;
    const range = f.radius * f.cutoff;
    const dx = Math.max(box.x0 - f.x, 0, f.x - box.x1);
    const dy = Math.max(box.y0 - f.y, 0, f.y - box.y1);
    const dz = Math.max(box.z0 - f.z, 0, f.z - box.z1);
    if (Math.hypot(dx, dy, dz) < range) out.push(i);
  });
  return out;
}

function boundsOf(P) {
  const b = { x0: Infinity, y0: Infinity, z0: Infinity, x1: -Infinity, y1: -Infinity, z1: -Infinity };
  for (let i = 0; i < P.length; i += 3) {
    b.x0 = Math.min(b.x0, P[i]); b.x1 = Math.max(b.x1, P[i]);
    b.y0 = Math.min(b.y0, P[i + 1]); b.y1 = Math.max(b.y1, P[i + 1]);
    b.z0 = Math.min(b.z0, P[i + 2]); b.z1 = Math.max(b.z1, P[i + 2]);
  }
  return b;
}







export function bakeSurface(positions, normals, fixtures, { visible = null, ambient = LIGHT.ambient, gain = LIGHT.gain } = {}) {
  const n = positions.length / 3;
  const parts = [];
  const near = fixturesNear(fixtures, boundsOf(positions));
  for (const fi of near) {
    const f = fixtures[fi];
    const scaled = [{ x: f.x, y: f.y, z: f.z, colour: f.colour, radius: f.radius, intensity: f.intensity / gain, cutoff: f.cutoff }];
    const c = prelight(positions, normals, scaled, { ambient: 0, visible, quantise: false });
    let any = false;
    for (let i = 0; i < c.length; i += 1) { c[i] *= gain; if (c[i] > 0.004) any = true; }
    if (any) parts.push({ f: fi, contrib: c });
  }
  return { n, ambient, gain, parts };
}






export function combineLight(bake, levels, out, albedo = null, mode = LIGHT_MODES.normal) {
  const n = bake.n; const g = bake.gain;
  const amb = bake.ambient * mode.ambient;
  for (let i = 0; i < n * 3; i += 1) out[i] = amb;
  for (const p of bake.parts) {
    const k = (levels ? levels[p.f] : 1) * mode.scale;
    if (k <= 0) continue;
    const c = p.contrib;
    const tr = mode.tint[0] * k; const tg = mode.tint[1] * k; const tb = mode.tint[2] * k;
    for (let i = 0; i < n; i += 1) {
      out[i * 3] += c[i * 3] * tr; out[i * 3 + 1] += c[i * 3 + 1] * tg; out[i * 3 + 2] += c[i * 3 + 2] * tb;
    }
  }
  for (let i = 0; i < n * 3; i += 1) {
    let v = out[i] > g ? g : out[i];
    if (albedo) v *= albedo[i];
    out[i] = v;
  }
  return out;
}





export function sampleLight(x, y, z, fixtures, levels, { ambient = LIGHT.ambient, gain = LIGHT.gain, visible = null, mode = LIGHT_MODES.normal } = {}) {
  let r = ambient * mode.ambient; let g = r; let b = r;
  const from = [x, y, z]; const to = [0, 0, 0];
  for (let i = 0; i < fixtures.length; i += 1) {
    const f = fixtures[i];
    const k = (levels ? levels[i] : 1) * mode.scale;
    if (!(f.intensity > 0) || k <= 0) continue;
    const dx = f.x - x; const dy = f.y - y; const dz = f.z - z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const range = f.radius * f.cutoff;
    if (d >= range) continue;
    if (visible) { to[0] = f.x; to[1] = f.y; to[2] = f.z; if (!visible(from, to)) continue; }
    const q = d / f.radius;
    const att = 1 / (1 + q * q);
    const w = 1 - (d / range) * (d / range);
    const s = f.intensity * att * w * k;
    r += f.colour[0] * s * mode.tint[0]; g += f.colour[1] * s * mode.tint[1]; b += f.colour[2] * s * mode.tint[2];
  }
  return [Math.min(gain, r), Math.min(gain, g), Math.min(gain, b)];
}





































































export const MOVER = Object.freeze({ chroma: 0.25, knee: 0.62, ceiling: 0.86 });

export function moverTint(rgb, out = [0, 0, 0], o = {}) {
  const chroma = o.chroma === undefined ? MOVER.chroma : o.chroma;
  const knee = o.knee === undefined ? MOVER.knee : o.knee;
  const ceiling = o.ceiling === undefined ? MOVER.ceiling : o.ceiling;
  
  
  const y = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  let r = y + (rgb[0] - y) * chroma;
  let g = y + (rgb[1] - y) * chroma;
  let b = y + (rgb[2] - y) * chroma;
  
  
  if (r < 0) r = 0; if (g < 0) g = 0; if (b < 0) b = 0;
  const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
  if (mx > knee) {
    const span = ceiling - knee > 1e-4 ? ceiling - knee : 1e-4;
    const over = mx - knee;
    
    
    const k = (knee + over / (1 + over / span)) / mx;
    r *= k; g *= k; b *= k;
  }
  out[0] = r; out[1] = g; out[2] = b;
  return out;
}


export function flickerFor(fixture) {
  if (!fixture.flicker || !(fixture.intensity > 0)) return null;
  return flickerSchedule(fixture.seed, LIGHT.flicker.rate * LIGHT.flicker.seconds, { rate: LIGHT.flicker.rate });
}





export function levelsAt(fixtures, schedules, t, out, overrides = null) {
  for (let i = 0; i < fixtures.length; i += 1) {
    const s = schedules[i];
    let v = s ? s.at(t + fixtures[i].phase) : 1;
    if (overrides && overrides[i] !== undefined && overrides[i] !== null) v *= overrides[i];
    out[i] = v;
  }
  return out;
}


export function transformPoints(positions, m) {
  
  const out = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]; const y = positions[i + 1]; const z = positions[i + 2];
    out[i] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[i + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
  }
  return out;
}
export function transformNormals(normals, m) {
  
  const out = new Float32Array(normals.length);
  for (let i = 0; i < normals.length; i += 3) {
    const x = normals[i]; const y = normals[i + 1]; const z = normals[i + 2];
    const nx = m[0] * x + m[4] * y + m[8] * z;
    const ny = m[1] * x + m[5] * y + m[9] * z;
    const nz = m[2] * x + m[6] * y + m[10] * z;
    const l = Math.hypot(nx, ny, nz) || 1;
    out[i] = nx / l; out[i + 1] = ny / l; out[i + 2] = nz / l;
  }
  return out;
}
