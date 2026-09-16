




















import { MeshData } from '../mesh/meshData.mjs';
import { loft, vec } from '../mesh/loft.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { fbm3, valueNoise3 } from '../noise.mjs';
import { seasonPalette, linear } from '../palette/seasons.mjs';
import { budgetFor } from '../budgets.mjs';
import { ATLAS } from '../paint/leaf.mjs';

export const TIER = 'tree';
export const STAGES = Object.freeze(['mature', 'young']);

const { add, sub, mul, dot, cross, norm } = vec;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const scl = (c, s) => [c[0] * s, c[1] * s, c[2] * s];
const TAU = Math.PI * 2;

const LODS = [
  { segs: 22, top: 4, under: 3, trunkSides: 8, trunkRings: 6, snowRows: 4, cardCap: 300, cardGrow: 1 },
  { segs: 14, top: 3, under: 2, trunkSides: 6, trunkRings: 4, snowRows: 2, cardCap: 130, cardGrow: 1.35 },
  { segs: 8, top: 1, under: 1, trunkSides: 5, trunkRings: 3, snowRows: 0, cardCap: 30, cardGrow: 2 },
];

export function generate({ seed = 1, season = 'winter', stage, lod = 0 } = {}) {
  stage = stage || STAGES[0];
  if (!STAGES.includes(stage)) throw new Error(`unknown pine stage '${stage}'`);
  const L = LODS[clamp(lod | 0, 0, 2)];
  const pal = seasonPalette(season);
  const winter = seasonPalette('winter');
  const rng = new SeededRng((seed * 6151 + 29) >>> 0 || 1);
  const m = new MeshData(`pine-${stage}-${seed}`);
  const young = stage === 'young';
  const hr = rng.child('habit');
  const scale = (young ? 0.56 : 1) * hr.rangeF(0.9, 1.1);
  const H = 3.7 * scale;
  const leanAz = hr.rangeF(0, TAU), leanAmt = hr.rangeF(0.04, 0.16) * scale;
  const lean = (y) => { const f = (y / H) ** 1.4 * leanAmt; return [Math.cos(leanAz) * f, Math.sin(leanAz) * f]; };

  
  const tr = rng.child('trunk');
  const r0 = tr.rangeF(0.13, 0.17) * (young ? 0.65 : 1), ph = tr.rangeF(0, TAU);
  const bark = pal.bark.map(linear);
  const trunkPts = [0, 0.3, 0.65, 1].map((t) => { const y = -0.15 + t * (H + 0.15); const l = lean(Math.max(0, y)); return [l[0], y, l[1]]; });
  loft(m, 'bark', {
    points: trunkPts, sides: L.trunkSides, rings: L.trunkRings, distribution: 1.5, twist: 0.4, end: 'point',
    radius: (t, a) => {
      const y = Math.max(0, -0.15 + t * (H + 0.15));
      return r0 * (1 - 0.85 * t) + r0 * 0.8 * Math.exp(-y / 0.22) + r0 * 0.6 * Math.max(0, Math.cos(3 * a + ph)) ** 4 * Math.exp(-y / 0.16);
    },
    color: (t, a, p) => scl(mix(bark[1], bark[0], 0.4 + 0.3 * smooth(0, 1.5, p[1])), 0.8 + 0.2 * smooth(-0.1, 0.4, p[1])),
    vPerMetre: 0.9,
  });

  
  const ever = winter.leaf.map(linear);
  const tints = season === 'winter' ? ever : ever.map((c, k) => mix(c, linear(pal.leaf[k]), 0.25));
  const snow = winter.snow.map(linear);

  const tierRng = rng.child('tiers');
  const count = young ? 3 : tierRng.rangeI(4, 5);
  const tiers = [];
  for (let i = 0; i < count; i++) {
    const f = count === 1 ? 0 : i / (count - 1);
    const y = H * (0.3 + 0.62 * f) + tierRng.rangeF(-0.05, 0.05) * scale;
    const l = lean(y);
    tiers.push({
      i, f, c: [l[0], y, l[1]],
      R: (1.2 - 0.85 * f) * scale * tierRng.rangeF(0.92, 1.05),
      droop: tierRng.rangeF(0.42, 0.58),
      thick: (0.2 - 0.06 * f) * scale,
      lobes: tierRng.rangeI(6, 9) - (f > 0.7 ? 2 : 0),
      ph: tierRng.rangeF(0, TAU),
      tilt: [tierRng.rangeF(-0.06, 0.06), tierRng.rangeF(-0.06, 0.06)],
      nSeed: tierRng.rangeI(1, 999),
    });
  }

  const band = ATLAS.band;
  const lobeAt = (t, theta) => Math.abs(Math.sin(theta * t.lobes * 0.5 + t.ph)) ** 0.7;
  
  const surf = (t, u, theta, under = false, lift = 0) => {
    const lobe = lobeAt(t, theta);
    const n = valueNoise3(Math.cos(theta) * 2, Math.sin(theta) * 2, t.i * 3.1, t.nSeed);
    const rim = t.R * (0.84 + 0.2 * lobe + 0.08 * (n - 0.5));
    const rho = rim * u;
    const drop = t.R * (t.droop + 0.12 * lobe) * u ** 1.7;
    let y = t.c[1] + t.thick * 0.35 * (1 - u * u) - drop + lift;
    if (under) y -= t.thick * (1 - 0.75 * u ** 3);
    y += t.tilt[0] * rho * Math.cos(theta) + t.tilt[1] * rho * Math.sin(theta);
    return [t.c[0] + rho * Math.cos(theta), y, t.c[2] + rho * Math.sin(theta)];
  };

  for (const t of tiers) {
    
    const prof = [];
    for (let k = 0; k <= L.top; k++) prof.push({ u: 0.08 + 0.92 * (k / L.top) ** 0.8, under: false });
    prof.push({ u: 1.03, under: false, rim: true });
    for (let k = 0; k <= L.under; k++) prof.push({ u: 0.98 - 0.72 * (k / Math.max(1, L.under)), under: true });
    const K = prof.length, S = L.segs;
    const P = (k, j) => {
      const q = prof[clamp(k, 0, K - 1)], theta = (((j % S) + S) % S) / S * TAU;
      if (q.rim) { const a = surf(t, 1, theta), b = surf(t, 1, theta, true); return [a[0] * 1.0 + (a[0] - t.c[0]) * 0.03, (a[1] + b[1]) / 2, a[2] + (a[2] - t.c[2]) * 0.03]; }
      return surf(t, q.u, theta, q.under);
    };
    const uRep = Math.max(1, Math.round((TAU * t.R) / 1.35));
    const idx = [];
    for (let k = 0; k < K; k++) {
      const row = [];
      for (let j = 0; j <= S; j++) {
        const p = P(k, j);
        let n = cross(sub(P(k, j + 1), P(k, j - 1)), sub(P(k + 1, j), P(k - 1, j)));
        n = Math.hypot(...n) > 1e-9 ? norm(n) : [0, 1, 0];
        const q = prof[k];
        const theta = (j / S) * TAU;
        const topness = q.under ? 0 : 1;
        const lit = q.under ? 0.1 : smooth(0.1, 0.9, q.u) * (0.6 + 0.4 * lobeAt(t, theta));
        let c = mix(tints[2], tints[1], q.under ? 0.2 : 0.35 + 0.65 * lit);
        c = mix(c, tints[0], smooth(0.55, 1, lit) * 0.6 * topness);
        c = scl(c, (0.78 + 0.22 * t.f) * (q.under ? 0.75 : 1));
        const v = band.v0 + (band.v1 - band.v0) * (k / (K - 1));
        row.push(m.vertex('leaf', p, n, c, [(j / S) * uRep, v]));
      }
      idx.push(row);
    }
    for (let k = 0; k < K - 1; k++) {
      for (let j = 0; j < S; j++) {
        const a = idx[k][j], b = idx[k][j + 1], c = idx[k + 1][j], d = idx[k + 1][j + 1];
        m.tri('leaf', a, b, c);
        m.tri('leaf', b, d, c);
      }
    }

    if (season === 'winter') {
      const S2 = S;
      const edge = (theta) => clamp(0.66 + 0.1 * (fbm3(Math.cos(theta) * 2.5, Math.sin(theta) * 2.5, t.i, { octaves: 2, seed: t.nSeed + 5 }) - 0.5) * 2
        + 0.22 * Math.max(0, (valueNoise3(Math.cos(theta) * 5, Math.sin(theta) * 5, t.i + 9, t.nSeed) - 0.5) / 0.5) ** 2
        - 0.18 * lobeAt(t, theta), 0.3, 0.97);
      const rows = L.snowRows + 1;
      const sIdx = [];
      for (let k = 0; k <= rows; k++) {
        const row = [];
        for (let j = 0; j <= S2; j++) {
          const theta = (j / S2) * TAU;
          const e = edge(theta);
          const u = 0.08 + (e - 0.08) * (k / rows);
          const w = k / rows;
          const lift = k === rows ? 0.008 : t.thick * 0.28 * (1 - w ** 2) + 0.018;
          const p = surf(t, u, theta, false, lift);
          const p2 = surf(t, Math.min(1, u + 0.02), theta, false, lift), p3 = surf(t, u, theta + 0.02, false, lift);
          let n = cross(sub(p3, p), sub(p2, p));
          n = norm(n[1] < 0 ? mul(n, -1) : n);
          row.push(m.vertex('snow', p, n, mix(snow[0], snow[1], smooth(0.4, 1, w)), [p[0] * 0.35, p[2] * 0.35]));
        }
        sIdx.push(row);
      }
      for (let k = 0; k < rows; k++) {
        for (let j = 0; j < S2; j++) {
          const a = sIdx[k][j], b = sIdx[k][j + 1], c = sIdx[k + 1][j], d = sIdx[k + 1][j + 1];
          m.tri('snow', a, b, c);
          m.tri('snow', b, d, c);
        }
      }
      t.snowEdge = edge;
    }
  }

  
  const remaining = Math.floor((budgetFor(TIER, lod) - m.triangleCount - 2) / 2);
  const cards = Math.max(0, Math.min(L.cardCap, remaining));
  const cr = rng.child('cards');
  const cell = ATLAS.cells[1];
  const totalR = tiers.reduce((s, t) => s + t.R, 0);
  for (let c = 0; c < cards; c++) {
    let x = cr.next() * totalR, t = tiers[0];
    for (const tt of tiers) { if (x < tt.R) { t = tt; break; } x -= tt.R; }
    const theta = cr.rangeF(0, TAU);
    const u = cr.rangeF(0.72, 0.98);
    if (t.snowEdge && u < t.snowEdge(theta) * 0.95) { cr.next(); cr.next(); continue; }
    const p = surf(t, u, theta);
    const out = norm(sub(surf(t, Math.min(1.05, u + 0.1), theta), p));
    const up = [0, 1, 0];
    const A = norm(add(out, [0, cr.rangeF(-0.05, 0.25), 0]));
    let N = sub(up, mul(A, dot(up, A)));
    N = norm(Math.hypot(...N) < 0.1 ? [Math.cos(theta), 0, Math.sin(theta)] : N);
    const B = cross(A, N);
    const s = t.R * 0.42 * L.cardGrow * cr.rangeF(0.8, 1.15) * (young ? 0.8 : 1);
    const reach = t.R * 0.42 * (1 - cell.anchor);
    const base = sub(p, mul(A, s - reach));
    const corners = [sub(base, mul(B, s / 2)), add(base, mul(B, s / 2)), add(add(base, mul(A, s)), mul(B, s / 2)), sub(add(base, mul(A, s)), mul(B, s / 2))];
    const flip = cr.chance(0.5);
    const u0 = flip ? cell.u1 : cell.u0, u1 = flip ? cell.u0 : cell.u1;
    const uvs = [[u0, cell.v0], [u1, cell.v0], [u1, cell.v1], [u0, cell.v1]];
    const col = scl(mix(tints[1], tints[0], 0.35), (0.8 + 0.22 * t.f) * cr.rangeF(0.93, 1.05));
    const nn = norm(add(mul(N, 0.7), mul(out, 0.3)));
    const ids = corners.map((q, k) => m.vertex('leaf', q, nn, scl(col, k >= 2 ? 1.06 : 0.94), uvs[k]));
    m.tri('leaf', ids[0], ids[1], ids[2]);
    m.tri('leaf', ids[0], ids[2], ids[3]);
  }
  return m;
}
