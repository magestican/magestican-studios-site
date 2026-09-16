














import { MeshData } from '../mesh/meshData.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { linear, seasonPalette, mixLinear } from '../palette/seasons.mjs';

export const TIER = 'groundClump';
export const KINDS = Object.freeze(['tuft', 'clover', 'flowers', 'leaves', 'drift', 'pebbles']);



export const COVER_SETS = Object.freeze({
  spring: Object.freeze([['clover', 0.4], ['tuft', 0.4], ['flowers', 0.2]]),
  summer: Object.freeze([['tuft', 0.62], ['flowers', 0.38]]),
  autumn: Object.freeze([['leaves', 0.55], ['tuft', 0.45]]),
  winter: Object.freeze([['drift', 0.45], ['tuft', 0.55]]),
});

const FLOWER_COLOURS = {
  spring: ['#fff6ea', '#ffc9dc', '#f7a6c4', '#fff0a6'],
  summer: ['#fff6ea', '#ffe36e', '#ff9fb4', '#c9b4ff'],
  autumn: ['#ffd98a', '#f2a65a', '#e3867a'],
  winter: ['#fff6ea', '#dfe8ff'],
};
const LEAF_COLOURS = ['#f8c056', '#e5812f', '#c95a33', '#d99a3c', '#b8483a'];

const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

function bladeColours(season) {
  const p = seasonPalette(season);
  if (season === 'winter') return { root: mixLinear('#6f8f7a', '#4f7564', 0.5), tip: linear('#b9d4b0') };
  if (season === 'autumn') return { root: linear(p.grass[1]), tip: mixLinear(p.grass[0], '#f2dc8a', 0.5) };
  return { root: linear(p.grass[1]), tip: mixLinear(p.grass[0], '#fff8ec', 0.18) };
}

function blade(m, rng, x, z, h, w, cols, leanRange = [0.15, 0.45]) {
  const ang = rng.rangeF(0, Math.PI * 2);
  const lean = rng.rangeF(leanRange[0], leanRange[1]) * h;
  const lx = Math.cos(ang) * lean, lz = Math.sin(ang) * lean;
  const px = -Math.sin(ang) * w * 0.5, pz = Math.cos(ang) * w * 0.5;
  const face = norm([Math.cos(ang), 1.6, Math.sin(ang)]);
  const tint = rng.rangeF(0.9, 1.08);
  const mid = [0, 1, 2].map((k) => (cols.root[k] * 0.55 + cols.tip[k] * 0.45) * tint);
  const b0 = m.vertex('grass', [x - px, 0, z - pz], face, mul(cols.root, 0.82), [0.45, 0.3]);
  const b1 = m.vertex('grass', [x + px, 0, z + pz], face, mul(cols.root, 0.82), [0.55, 0.3]);
  const m0 = m.vertex('grass', [x - px * 0.78 + lx * 0.35, h * 0.55, z - pz * 0.78 + lz * 0.35], face, mid, [0.46, 0.5]);
  const m1 = m.vertex('grass', [x + px * 0.78 + lx * 0.35, h * 0.55, z + pz * 0.78 + lz * 0.35], face, mid, [0.54, 0.5]);
  const tip = m.vertex('grass', [x + lx, h, z + lz], face, mul(cols.tip, tint), [0.5, 0.7]);
  m.tri('grass', b0, b1, m1);
  m.tri('grass', b0, m1, m0);
  m.tri('grass', m0, m1, tip);
}

function tuft(m, rng, season, lod) {
  const cols = bladeColours(season);
  const n = [11, 6, 3][lod];
  const hScale = season === 'winter' ? 0.7 : 1;
  for (let i = 0; i < n; i++) {
    const r = rng.rangeF(0, 0.06);
    const a = rng.rangeF(0, Math.PI * 2);
    blade(m, rng, Math.cos(a) * r, Math.sin(a) * r, rng.rangeF(0.15, 0.3) * hScale, rng.rangeF(0.08, 0.13), cols, [0.2, 0.55]);
  }
}


function leaflet(m, mat, cx, y, cz, ang, len, wid, col, tilt) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const P = (s, t, lift) => [cx + ca * t - sa * s, y + t * tilt + lift, cz + sa * t + ca * s];
  const up = norm([ca * -0.25, 1, sa * -0.25]);
  const pts = [[-0.5 * wid, 0.55 * len, 0.012], [-0.32 * wid, 1.0 * len, 0.02], [0, 0.8 * len, 0.008], [0.32 * wid, 1.0 * len, 0.02], [0.5 * wid, 0.55 * len, 0.012]];
  const base = m.vertex(mat, P(0, 0, 0), up, mul(col, 0.75), [0.5, 0]);
  const ring = pts.map(([s, t, l], i) => m.vertex(mat, P(s, t, l), up, col, [i / 4, t / len]));
  for (let i = 0; i < 4; i++) m.tri(mat, base, ring[i + 1], ring[i]);
}

function clover(m, rng, season, lod) {
  const col = linear(seasonPalette(season).grass[1]);
  const sprigs = [3, 2, 0][lod];
  for (let s = 0; s < sprigs; s++) {
    const a = rng.rangeF(0, Math.PI * 2), r = rng.rangeF(0.02, 0.12);
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    const y = rng.rangeF(0.05, 0.11);
    const spin = rng.rangeF(0, Math.PI * 2);
    const len = rng.rangeF(0.055, 0.075);
    const tint = mul(col, rng.rangeF(0.92, 1.12));
    for (let k = 0; k < 3; k++) {
      leaflet(m, 'grass', cx, y, cz, spin + (k * Math.PI * 2) / 3 + rng.rangeF(-0.2, 0.2), len, len * 1.1, tint, 0.35);
    }
  }
  const cols = bladeColours(season);
  const blades = [6, 2, 3][lod];
  for (let i = 0; i < blades; i++) {
    const a = rng.rangeF(0, Math.PI * 2), r = rng.rangeF(0, 0.12);
    blade(m, rng, Math.cos(a) * r, Math.sin(a) * r, rng.rangeF(0.1, 0.2), 0.06, cols);
  }
}

function rosette(m, rng, cx, cz, h, petalCol, lod) {
  const petals = lod === 2 ? 4 : 5;
  const r = rng.rangeF(0.05, 0.07);
  const spin = rng.rangeF(0, Math.PI * 2);
  const up = [0, 1, 0];
  const faceTilt = rng.rangeF(-0.2, 0.2);
  const centreCol = linear('#ffcf4a');
  for (let i = 0; i < petals; i++) {
    const a = spin + (i / petals) * Math.PI * 2 + rng.rangeF(-0.15, 0.15);
    const ca = Math.cos(a), sa = Math.sin(a);
    const pa = -sa, pb = ca;
    const w = r * 0.45;
    const P = (along, side, lift) => [cx + ca * along + pa * side, h + lift + along * faceTilt * ca, cz + sa * along + pb * side];
    const n = norm([ca * 0.3, 1, sa * 0.3]);
    const base = m.vertex('petal', P(r * 0.15, 0, 0.01), n, mul(petalCol, 0.82), [0.5, 0]);
    const left = m.vertex('petal', P(r * 0.6, -w, 0.018), n, petalCol, [0, 0.5]);
    const tip = m.vertex('petal', P(r * 1.05, 0, 0.012), n, petalCol, [0.5, 1]);
    const right = m.vertex('petal', P(r * 0.6, w, 0.018), n, petalCol, [1, 0.5]);
    m.tri('petal', base, right, tip);
    m.tri('petal', base, tip, left);
  }
  if (lod < 2) {
    const c = m.vertex('petal', [cx, h + 0.03, cz], up, centreCol, [0.5, 0.5]);
    const ring = [];
    for (let i = 0; i < 4; i++) {
      const a = spin + (i / 4) * Math.PI * 2;
      ring.push(m.vertex('petal', [cx + Math.cos(a) * r * 0.3, h + 0.016, cz + Math.sin(a) * r * 0.3], norm([Math.cos(a), 1.2, Math.sin(a)]), mul(centreCol, 0.85), [0.5, 0.5]));
    }
    for (let i = 0; i < 4; i++) m.tri('petal', c, ring[(i + 1) % 4], ring[i]);
  }
}

function flowers(m, rng, season, lod) {
  const cols = bladeColours(season);
  
  const col = linear(rng.pick(FLOWER_COLOURS[season]));
  const heads = [3, 1, 1][lod];
  for (let f = 0; f < heads; f++) {
    const a = rng.rangeF(0, Math.PI * 2), r = rng.rangeF(0.04, 0.12);
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    const h = rng.rangeF(0.14, 0.24);
    if (lod < 2) {
      const nn = norm([0, 0.3, 1]);
      const s0 = m.vertex('grass', [cx - 0.009, 0, cz], nn, mul(cols.root, 0.6), [0.5, 0.3]);
      const s1 = m.vertex('grass', [cx + 0.009, 0, cz], nn, mul(cols.root, 0.6), [0.5, 0.3]);
      const s2 = m.vertex('grass', [cx + 0.007, h, cz + 0.01], nn, cols.root, [0.5, 0.6]);
      const s3 = m.vertex('grass', [cx - 0.007, h, cz + 0.01], nn, cols.root, [0.5, 0.6]);
      m.tri('grass', s0, s1, s2);
      m.tri('grass', s0, s2, s3);
    }
    rosette(m, rng, cx, cz, h, mul(col, rng.rangeF(0.94, 1.04)), lod);
  }
  const blades = [3, 2, 0][lod];
  for (let i = 0; i < blades; i++) {
    const a = rng.rangeF(0, Math.PI * 2), r = rng.rangeF(0, 0.08);
    blade(m, rng, Math.cos(a) * r, Math.sin(a) * r, rng.rangeF(0.12, 0.22), 0.09, cols);
  }
}

function fallenLeaf(m, rng, cx, cz, len, col) {
  const a = rng.rangeF(0, Math.PI * 2);
  const ca = Math.cos(a), sa = Math.sin(a);
  const wid = len * rng.rangeF(0.42, 0.55);
  const curl = rng.rangeF(0.008, 0.025);
  const P = (t, s, lift) => [cx + ca * t - sa * s, 0.012 + lift, cz + sa * t + ca * s];
  const n = [0, 1, 0];
  const mid = m.vertex('petal', P(0, 0, 0.012), n, col, [0.5, 0.5]);
  const rim = [
    P(-0.5 * len, 0, 0), P(-0.2 * len, -0.5 * wid, curl), P(0.25 * len, -0.42 * wid, curl),
    P(0.55 * len, 0, 0.004), P(0.25 * len, 0.42 * wid, curl), P(-0.2 * len, 0.5 * wid, curl),
  ].map((p, i) => m.vertex('petal', p, norm([(p[0] - cx) * 0.4, 1, (p[2] - cz) * 0.4]), mul(col, i === 0 ? 0.8 : 0.95), [i % 2, i / 5]));
  for (let i = 0; i < 6; i++) m.tri('petal', mid, rim[(i + 1) % 6], rim[i]);
}

function leaves(m, rng, season, lod) {
  const n = [6, 3, 1][lod];
  for (let i = 0; i < n; i++) {
    const a = rng.rangeF(0, Math.PI * 2), r = rng.rangeF(0, 0.22);
    const col = mul(linear(rng.pick(LEAF_COLOURS)), rng.rangeF(0.85, 1.05));
    fallenLeaf(m, rng, Math.cos(a) * r, Math.sin(a) * r, rng.rangeF(0.08, 0.13), col);
  }
  if (lod < 2) tuft(m, rng, season, 2);
}

function drift(m, rng, season, lod) {
  const snow = seasonPalette('winter').snow;
  
  
  const top = mixLinear(snow[0], snow[1], 0.35), mid = mixLinear(snow[1], snow[2], 0.3), low = linear(snow[2]);
  const sx = rng.rangeF(0.26, 0.42), sz = rng.rangeF(0.2, 0.32), h = rng.rangeF(0.05, 0.09);
  const skew = rng.rangeF(-0.35, 0.35);
  const rings = lod === 0 ? [[0.42, 12], [0.8, 12], [1.08, 12]] : lod === 1 ? [[0.55, 8], [1.08, 10]] : [[1.05, 8]];
  const height = (t) => h * Math.max(0, 1 - t * t) ** 1.2 - (t > 1 ? 0.03 : 0);
  const pos = (t, a) => {
    const wob = 1 + 0.12 * Math.sin(a * 3 + skew * 5) + 0.06 * Math.sin(a * 5 + 1.3);
    const x = Math.cos(a) * sx * t * wob, z = Math.sin(a) * sz * t * wob;
    return [x + skew * x * 0.3, height(t) + skew * 0.04 * x, z];
  };
  const normal = (t, a) => {
    const dhdt = t < 1 ? -2.4 * h * t * Math.max(0, 1 - t * t) ** 0.2 : 0;
    return norm([-Math.cos(a) * dhdt / sx * 0.6, 1, -Math.sin(a) * dhdt / sz * 0.6]);
  };
  const c = m.vertex('snow', [skew * 0.05, h, 0], [0, 1, 0], top, [0.5, 0.5]);
  let prev = null;
  for (const [t, n] of rings) {
    const ring = [];
    const off = rng.rangeF(0, 0.5);
    for (let i = 0; i < n; i++) {
      const a = ((i + off) / n) * Math.PI * 2;
      const col = t < 0.6 ? top : t < 1 ? mid : low;
      const p = pos(t, a);
      ring.push(m.vertex('snow', p, normal(t, a), col, [0.5 + p[0], 0.5 + p[2]]));
    }
    if (!prev) {
      for (let i = 0; i < n; i++) m.tri('snow', c, ring[(i + 1) % n], ring[i]);
    } else {
      zip(m, 'snow', prev, ring);
    }
    prev = ring;
  }
}



function pebbles(m, rng, season, lod) {
  const stone = seasonPalette(season).stone.map(linear);
  const n = [3, 1, 1][lod];
  for (let p = 0; p < n; p++) {
    const a = rng.rangeF(0, Math.PI * 2), d = rng.rangeF(0, 0.16);
    const cx = Math.cos(a) * d, cz = Math.sin(a) * d;
    const r = rng.rangeF(0.04, 0.085), h = r * rng.rangeF(0.35, 0.6);
    const sx = rng.rangeF(0.8, 1.2), spin = rng.rangeF(0, Math.PI);
    const col = mul(stone[rng.rangeI(0, 2)], rng.rangeF(0.95, 1.1));
    const ringAt = (t, y, k) => {
      const out = [];
      for (let i = 0; i < 6; i++) {
        const q = spin + (i / 6) * Math.PI * 2;
        const lx = Math.cos(q) * r * t * sx, lz = Math.sin(q) * r * t;
        out.push(m.vertex('soil', [cx + lx, y, cz + lz], norm([Math.cos(q) * k, 1, Math.sin(q) * k]), mul(col, 0.8 + 0.2 * (1 - t)), [0.5 + lx, 0.5 + lz]));
      }
      return out;
    };
    const top = m.vertex('soil', [cx, h, cz], [0, 1, 0], mul(col, 1.05), [0.5, 0.5]);
    if (lod === 2) {
      const skirt = ringAt(1, -0.005, 0.9);
      for (let i = 0; i < 6; i++) m.tri('soil', top, skirt[(i + 1) % 6], skirt[i]);
      continue;
    }
    const shoulder = ringAt(0.65, h * 0.75, 0.6);
    const skirt = ringAt(1, -0.005, 1.4);
    for (let i = 0; i < 6; i++) m.tri('soil', top, shoulder[(i + 1) % 6], shoulder[i]);
    zip(m, 'soil', shoulder, skirt);
  }
}



export function zip(m, mat, inner, outer, flip = false) {
  const na = inner.length, nb = outer.length;
  const tri = flip ? (a, b, c) => m.tri(mat, a, c, b) : (a, b, c) => m.tri(mat, a, b, c);
  let i = 0, j = 0;
  while (i < na || j < nb) {
    if (j >= nb || (i < na && (i + 1) / na < (j + 1) / nb)) {
      tri(inner[i % na], inner[(i + 1) % na], outer[j % nb]);
      i++;
    } else {
      tri(inner[i % na], outer[(j + 1) % nb], outer[j % nb]);
      j++;
    }
  }
}

const BUILDERS = { tuft, clover, flowers, leaves, drift, pebbles };

export function generate({ seed = 1, season = 'summer', kind, lod = 0 } = {}) {
  const k = kind || COVER_SETS[season][0][0];
  if (!BUILDERS[k]) throw new Error(`unknown ground cover kind '${k}'`);
  const m = new MeshData(`groundCover-${k}-${seed}`);
  BUILDERS[k](m, new SeededRng(seed * 7919 + KINDS.indexOf(k) * 31 + 1), season, lod);
  return m;
}
