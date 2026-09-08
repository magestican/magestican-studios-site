



















































import { QUANT_LEVELS } from '../../ps1/ps1Shader.mjs';
import { mulberry32, hex } from './texturePaint.mjs';

export { QUANT_LEVELS };


export function quantise15(v) {
  const c = v < 0 ? 0 : v > 1 ? 1 : v;
  return Math.floor(c * QUANT_LEVELS + 0.5) / QUANT_LEVELS;
}


function flat3(input, what) {
  if (!input) throw new TypeError(`prelight: ${what} is required`);
  if (Array.isArray(input) && input.length && Array.isArray(input[0])) {
    const out = new Float64Array(input.length * 3);
    for (let i = 0; i < input.length; i += 1) { out[i * 3] = input[i][0]; out[i * 3 + 1] = input[i][1]; out[i * 3 + 2] = input[i][2]; }
    return out;
  }
  if (input.length % 3 !== 0) throw new TypeError(`prelight: ${what} must hold 3 numbers per vertex (length ${input.length})`);
  return Float64Array.from(input);
}


export function lightColour(c) {
  const a = typeof c === 'string' ? hex(c) : c;
  if (!a || a.length < 3) throw new TypeError(`prelight: bad colour ${c}`);
  const over = a[0] > 1 || a[1] > 1 || a[2] > 1;
  return over ? [a[0] / 255, a[1] / 255, a[2] / 255] : [a[0], a[1], a[2]];
}


export function fixture(x, y, z, { colour = '#ffffff', radius = 2.5, intensity = 1, cutoff = 4 } = {}) {
  return { x, y, z, colour, radius, intensity, cutoff };
}








export function prelight(vertices, normals, fixtures, { ambient = 0.12, visible = null, quantise = true } = {}) {
  const P = flat3(vertices, 'vertices');
  const N = normals ? flat3(normals, 'normals') : null;
  if (N && N.length !== P.length) throw new TypeError('prelight: normals must match vertices one for one');
  const n = P.length / 3;
  const amb = typeof ambient === 'number' ? [ambient, ambient, ambient] : lightColour(ambient);
  const fx = (fixtures || []).map((f) => {
    const c = lightColour(f.colour === undefined ? '#ffffff' : f.colour);
    const radius = f.radius === undefined ? 2.5 : f.radius;
    const intensity = f.intensity === undefined ? 1 : f.intensity;
    const cutoff = f.cutoff === undefined ? 4 : f.cutoff;
    if (!(radius > 0)) throw new RangeError('prelight: fixture radius must be > 0');
    return { x: f.x, y: f.y, z: f.z, c, radius, intensity, range: radius * cutoff };
  });
  const out = new Float32Array(n * 3);
  
  
  const from = [0, 0, 0]; const to = [0, 0, 0];
  for (let i = 0; i < n; i += 1) {
    const px = P[i * 3]; const py = P[i * 3 + 1]; const pz = P[i * 3 + 2];
    let r = amb[0]; let g = amb[1]; let b = amb[2];
    for (const f of fx) {
      const dx = f.x - px; const dy = f.y - py; const dz = f.z - pz;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d >= f.range) continue;
      if (visible) {
        from[0] = px; from[1] = py; from[2] = pz; to[0] = f.x; to[1] = f.y; to[2] = f.z;
        if (!visible(from, to)) continue;
      }
      let lam = 1;
      if (N) {
        const nx = N[i * 3]; const ny = N[i * 3 + 1]; const nz = N[i * 3 + 2];
        const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        lam = d > 1e-9 ? Math.max(0, (nx * dx + ny * dy + nz * dz) / (nl * d)) : 1;
        if (lam <= 0) continue;
      }
      const q = d / f.radius;
      const att = 1 / (1 + q * q);
      const w = 1 - (d / f.range) * (d / f.range);
      const k = f.intensity * lam * att * w;
      r += f.c[0] * k; g += f.c[1] * k; b += f.c[2] * k;
    }
    out[i * 3] = quantise ? quantise15(r) : Math.min(1, Math.max(0, r));
    out[i * 3 + 1] = quantise ? quantise15(g) : Math.min(1, Math.max(0, g));
    out[i * 3 + 2] = quantise ? quantise15(b) : Math.min(1, Math.max(0, b));
  }
  return out;
}





export function applyPrelight(base, light) {
  const n = light.length / 3;
  const one = Array.isArray(base) && base.length === 3 && typeof base[0] === 'number';
  const B = one ? null : flat3(base, 'base');
  if (B && B.length !== light.length) throw new TypeError('applyPrelight: base must be one colour or one per vertex');
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i += 1) out[i] = (one ? base[i % 3] : B[i]) * light[i];
  return out;
}

const PHI = (1 + Math.sqrt(5)) / 2;










export function flickerSchedule(seed, count = 900, {
  rate = 30, floor = 0.15, base = 1.0, wobble = 0.05, meanGap = 1.2, minGap = 0.12,
  depth = [0.35, 0.9], doubleChance = 0.3,
} = {}) {
  if (!Number.isInteger(count) || count < 2) throw new RangeError('flickerSchedule: count must be an integer >= 2');
  const rnd = mulberry32(seed);
  const f0 = 0.6 + rnd() * 0.8;
  const freqs = [f0, f0 * PHI, f0 * Math.E];
  const phases = [rnd() * Math.PI * 2, rnd() * Math.PI * 2, rnd() * Math.PI * 2];
  const amps = [0.5, 0.3, 0.2].map((a) => a * wobble);
  const duration = count / rate;
  
  
  const dip = new Float32Array(count);
  const place = (t, dp, len) => {
    const i0 = Math.round(t * rate);
    for (let i = i0; i < i0 + len && i < count; i += 1) if (i >= 0) dip[i] = Math.max(dip[i], dp);
  };
  let t = 0;
  for (;;) {
    t += Math.max(minGap, -Math.log(1 - rnd()) * meanGap);
    if (t >= duration) break;
    const dp = depth[0] + rnd() * (depth[1] - depth[0]);
    const len = 1 + Math.floor(rnd() * 4);
    place(t, dp, len);
    if (rnd() < doubleChance) place(t + (len + 2 + Math.floor(rnd() * 2)) / rate, dp * (0.6 + rnd() * 0.4), 1 + Math.floor(rnd() * 2));
  }
  const levels = new Float32Array(count);
  const qFloor = quantise15(floor);
  for (let i = 0; i < count; i += 1) {
    const tt = i / rate;
    let v = base;
    for (let k = 0; k < 3; k += 1) v += amps[k] * Math.sin(Math.PI * 2 * freqs[k] * tt + phases[k]);
    v -= dip[i];
    levels[i] = Math.max(qFloor, quantise15(v));
  }
  return {
    rate, count, duration, levels,
    at(time) { const i = Math.floor(time * rate); return levels[((i % count) + count) % count]; },
  };
}






export function autocorrelation(series, lag) {
  const n = series.length; let mean = 0;
  for (let i = 0; i < n; i += 1) mean += series[i];
  mean /= n;
  let num = 0; let den = 0;
  for (let i = 0; i < n; i += 1) { const a = series[i] - mean; den += a * a; if (i + lag < n) num += a * (series[i + lag] - mean); }
  return den > 0 ? num / den : 0;
}
