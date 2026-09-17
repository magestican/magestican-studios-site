

































import { MeshData, compose, translate, rotateY, rotateZ } from '../mesh/meshData.mjs';
import { loft, spline, branchPoints, vec } from '../mesh/loft.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { fbm3, valueNoise3 } from '../noise.mjs';
import { seasonPalette, linear } from '../palette/seasons.mjs';
import { budgetFor } from '../budgets.mjs';
import { ATLAS } from '../paint/leaf.mjs';

export const TIER = 'tree';
export const STAGES = Object.freeze(['fruiting', 'young', 'sapling', 'seed', 'stump']);
export const KINDS = Object.freeze(['apple', 'peach']);

const { add, sub, mul, dot, cross, norm } = vec;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const scl = (c, s) => [c[0] * s, c[1] * s, c[2] * s];
const TAU = Math.PI * 2;



const LODS = [
  { trunkSides: 12, trunkRings: 12, limbSides: 7, limbRings: 7, shellSegs: 28, rows: 15, fruitSegs: 8, fruitRows: 6, stems: true, cardCap: 520, cardGrow: 1, snowRows: 6, capRings: 1 },
  { trunkSides: 9, trunkRings: 8, limbSides: 5, limbRings: 5, shellSegs: 20, rows: 10, fruitSegs: 6, fruitRows: 5, stems: true, cardCap: 240, cardGrow: 1.35, snowRows: 4, capRings: 0.6 },
  
  { trunkSides: 6, trunkRings: 4, limbSides: 3, limbRings: 3, shellSegs: 16, rows: 8, fruitSegs: 3, fruitRows: 2, stems: false, cardCap: 60, cardGrow: 2.2, snowRows: 2, capRings: 0.3 },
];

const HABIT = {
  apple: { radii: [1.45, 1.2, 1.4], lobes: [7, 9], flat: 0.72, height: 1, rise: [0.45, 0.62], fruitR: 0.15 },
  peach: { radii: [1.62, 1.04, 1.55], lobes: [9, 11], flat: 0.62, height: 0.93, rise: [0.3, 0.45], fruitR: 0.14 },
};

const FRUIT = {
  apple: (season, pal) => ({ base: linear(pal.fruit), other: linear(season === 'autumn' ? '#e39a3b' : '#f3cf5e'), otherAmt: 0.3 }),
  peach: (season) => ({ base: linear(season === 'autumn' ? '#f39a52' : '#ffb266'), other: linear(season === 'autumn' ? '#d24a3a' : '#ef5f4e'), otherAmt: 0.92 }),
};





export function generate({ seed = 1, season = 'summer', stage, lod = 0, kind = 'apple', fruit = true } = {}) {
  stage = stage || STAGES[0];
  if (!STAGES.includes(stage)) throw new Error(`unknown tree stage '${stage}'`);
  if (!KINDS.includes(kind)) throw new Error(`unknown tree kind '${kind}'`);
  const L = LODS[clamp(lod | 0, 0, 2)];
  const pal = seasonPalette(season);
  const rng = new SeededRng((seed * 7919 + (kind === 'peach' ? 1013 : 17)) >>> 0 || 1);
  const ctx = {
    m: new MeshData(`${kind}Tree-${stage}-${seed}`), L, pal, season, kind, seed, rng, budget: budgetFor(TIER, lod), canopies: [],
    fruit: fruit !== false, reservedTris: 0,
  };
  BUILD[stage](ctx);
  fillCards(ctx);
  
  
  
  
  if (stage !== 'stump') ctx.m.sway({ perMetre: 0.02, power: 1.5 });
  return ctx.m;
}



function trunkParams(rng, scaleR = 1, rootsOn = true) {
  const roots = [];
  if (rootsOn) {
    const n = rng.rangeI(3, 5);
    const start = rng.rangeF(0, TAU);
    for (let k = 0; k < n; k++) roots.push({ a: start + (k / n) * TAU + rng.rangeF(-0.45, 0.45), amp: rng.rangeF(0.55, 1) });
  } else {
    rng.rangeI(3, 5);
  }
  const leanAz = rng.rangeF(0, TAU);
  return {
    r0: rng.rangeF(0.23, 0.28) * scaleR,
    flare: rng.rangeF(0.34, 0.5),
    roots,
    ph: rng.rangeF(0, TAU),
    lean: [Math.cos(leanAz), Math.sin(leanAz)],
    leanAmt: rng.rangeF(0.14, 0.4),
    wobble: rng.rangeF(-0.09, 0.09),
    noiseSeed: rng.rangeI(1, 9999),
  };
}

function trunkRadius(tp, H, y, a) {
  const ya = Math.max(0, y);
  const core = tp.r0 * (1 - 0.32 * clamp(y / H, 0, 1)) * (1 + 0.06 * Math.sin(y * 4.3 + tp.ph));
  const n = 1 + 0.16 * (valueNoise3(Math.cos(a) * 1.4, y * 2.8, Math.sin(a) * 1.4, tp.noiseSeed) - 0.5);
  let lobes = 0;
  for (const r of tp.roots) lobes += r.amp * Math.max(0, Math.cos(a - r.a)) ** 3;
  const flare = tp.r0 * tp.flare * Math.exp(-ya / 0.22);
  const root = tp.r0 * 0.85 * lobes * Math.exp(-ya / 0.16) + (y < 0 ? tp.r0 * lobes * -y * 2.5 : 0);
  return core * n + flare + root;
}

function barkColor(ctx, yGround = 0) {
  const b0 = linear(ctx.pal.bark[0]), b1 = linear(ctx.pal.bark[1]), b2 = linear(ctx.pal.bark[2]);
  return (y) => {
    const h = y - yGround;
    
    
    
    const c = mix(mix(b1, b0, 0.4 + 0.45 * smooth(0.4, 1.6, h)), b2, 0.45 * smooth(0.25, -0.15, h));
    return scl(mix(c, b0, 0.35 * smooth(0.9, 1.8, h)), (0.8 + 0.2 * smooth(-0.1, 0.45, h)) * (1 + 0.25 * smooth(0.9, 1.8, h)));
  };
}

function trunkPath(tp, H, y0 = -0.22, n = 5) {
  const pts = [];
  const px = -tp.lean[1], pz = tp.lean[0];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const y = y0 + t * (H - y0);
    const lean = tp.leanAmt * clamp(y / H, 0, 1) ** 1.5;
    const s = Math.sin(Math.PI * clamp(y / H, 0, 1)) * tp.wobble * H;
    pts.push([tp.lean[0] * lean + px * s, y, tp.lean[1] * lean + pz * s]);
  }
  return pts;
}

function buildTrunk(ctx, tp, H, { sides, rings, end = 'point', yTop = H }) {
  const y0 = -0.22;
  const pts = trunkPath(tp, H, y0).filter((p) => p[1] <= yTop + 1e-6);
  if (pts[pts.length - 1][1] < yTop - 1e-6) {
    const full = spline(trunkPath(tp, H, y0));
    pts.push(full.at((yTop - y0) / (H - y0)));
  }
  const col = barkColor(ctx);
  return loft(ctx.m, 'bark', {
    points: pts, sides, rings, distribution: 1.7, twist: 0.5,
    radius: (t, a) => trunkRadius(tp, H, y0 + t * (yTop - y0), a),
    color: (t, a, p) => col(p[1]), vPerMetre: 0.75, uRepeat: 1, end,
  });
}

function buildLimbs(ctx, trunk, tp, H, { count, length, rise, from, to, sides, rings, rng, bend = 0.35 }) {
  const col = barkColor(ctx);
  const az0 = rng.rangeF(0, TAU);
  const ends = [];
  for (let k = 0; k < count; k++) {
    const az = az0 + (k / count) * TAU + rng.rangeF(-0.5, 0.5);
    const t = rng.rangeF(from, to);
    const len = length * rng.rangeF(0.85, 1.15);
    const pts = branchPoints(trunk.spline, t, [Math.cos(az), 0, Math.sin(az)], { length: len, rise: rng.rangeF(rise[0], rise[1]), bend });
    const r0 = trunkRadius(tp, H, trunk.spline.at(t)[1], az) * 0.62;
    const res = loft(ctx.m, 'bark', {
      points: pts, sides, rings, distribution: 1.25, twist: 0.3,
      radius: (u) => r0 * (1 - u) ** 1.1 + r0 * 0.14,
      color: (u, a, p) => scl(col(p[1]), 0.92 + 0.08 * smooth(0.05, 0.3, u)),
      vPerMetre: 1.6, end: 'point',
    });
    ends.push(res.spline.at(1));
  }
  return ends;
}



function smax(a, b, k) {
  const h = clamp(0.5 + 0.5 * (a - b) / k, 0, 1);
  return b + (a - b) * h + k * h * (1 - h);
}

function canopyShape(rng, C, radii, lobeCount, flat, noiseSeed) {
  const [rx, ry, rz] = radii;
  const mean = (rx + ry + rz) / 3;
  const lobes = [{ o: [0, 0, 0], a: [rx * 0.62, ry * 0.66, rz * 0.62] }];
  const az0 = rng.rangeF(0, TAU);
  for (let k = 0; k < lobeCount; k++) {
    const yk = clamp(0.9 - (1.45 * (k + 0.5)) / lobeCount + rng.rangeF(-0.1, 0.1), -0.55, 0.95);
    const az = az0 + k * 2.39996 + rng.rangeF(-0.4, 0.4);
    const rr = Math.sqrt(1 - yk * yk);
    const off = rng.rangeF(0.56, 0.72);
    const s = rng.rangeF(0.36, 0.48) * mean;
    lobes.push({
      o: [rr * Math.cos(az) * rx * off, yk * ry * off * 0.9, rr * Math.sin(az) * rz * off],
      a: [s * rng.rangeF(0.95, 1.15), s * rng.rangeF(0.82, 0.98), s * rng.rangeF(0.95, 1.15)],
    });
  }
  const k = 0.05 * mean;
  const radiusAt = (d) => {
    let m1 = -Infinity, m2 = -Infinity, sum = 0, lobe = 0;
    const hits = [];
    lobes.forEach((l, li) => {
      const q = [d[0] / l.a[0], d[1] / l.a[1], d[2] / l.a[2]];
      const o = [l.o[0] / l.a[0], l.o[1] / l.a[1], l.o[2] / l.a[2]];
      const A = dot(q, q), B = -2 * dot(q, o), Cq = dot(o, o) - 1;
      const disc = B * B - 4 * A * Cq;
      if (disc < 0) return;
      const t = (-B + Math.sqrt(disc)) / (2 * A);
      if (t <= 0) return;
      hits.push(t);
      if (t > m1) { m2 = m1; m1 = t; lobe = li; } else if (t > m2) m2 = t;
    });
    for (const t of hits) sum += Math.exp((t - m1) / k);
    let r = m1 + k * Math.log(sum);
    const crease = m2 > -Infinity ? Math.exp(-(m1 - m2) / (1.2 * k)) : 0;
    r *= 1 + 0.08 * (fbm3(d[0] * 1.8, d[1] * 1.8, d[2] * 1.8, { octaves: 2, seed: noiseSeed }) - 0.5)
      + 0.05 * (valueNoise3(d[0] * 6, d[1] * 6, d[2] * 6, noiseSeed + 7) - 0.5);
    return { r, crease, lobe };
  };
  const point = (d, r) => {
    const p = mul(d, r);
    p[1] = smax(p[1], -ry * flat, 0.45 * ry);
    return add(C, p);
  };
  const ellN = (p) => norm([(p[0] - C[0]) / (rx * rx), (p[1] - C[1]) / (ry * ry), (p[2] - C[2]) / (rz * rz)]);
  
  
  const lobeN = (p, li) => {
    const l = lobes[li];
    return norm([(p[0] - C[0] - l.o[0]) / (l.a[0] * l.a[0]), (p[1] - C[1] - l.o[1]) / (l.a[1] * l.a[1]), (p[2] - C[2] - l.o[2]) / (l.a[2] * l.a[2])]);
  };
  return { C, radii, mean, lobes, radiusAt, point, ellN, lobeN };
}

const dirOf = (phi, theta) => [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];

function canopyTints(ctx, material) {
  const src = material === 'blossom' ? ctx.pal.blossom : ctx.pal.leaf;
  return src.map(linear);
}




const AUTUMN_HUES = [['#f8c056', 0.34], ['#e5812f', 0.3], ['#b24e2e', 0.22], ['#f2c14e', 0.09], ['#8f4a62', 0.05]];



function lobeTints(ctx, material, count, rng) {
  const base = canopyTints(ctx, material);
  const out = [];
  for (let i = 0; i < count; i++) {
    if (ctx.season === 'autumn' && material === 'leaf') {
      let x = rng.next(), hex = AUTUMN_HUES[0][0];
      for (const [h, w] of AUTUMN_HUES) { if (x < w) { hex = h; break; } x -= w; }
      const hue = mix(linear(hex), linear('#e5812f'), 0.3);
      out.push([mix(hue, linear('#fff0c4'), 0.28), hue, mix(hue, linear('#5a2c2e'), 0.42)]);
    } else {
      const t = rng.rangeF(-1, 1) * 0.35;
      out.push(base.map((c, k) => mix(c, t > 0 ? base[Math.max(0, k - 1)] : base[Math.min(2, k + 1)], Math.abs(t))));
    }
  }
  return out;
}





function canopyColor(shape, tints, p, crease, soft = false, lobe = 0, base = null) {
  
  if (base) tints = tints.map((t, k) => mix(t, base[k], Math.min(1, crease * 0.75)));
  const h = (p[1] - shape.C[1]) / shape.radii[1];
  const up = shape.lobeN(p, lobe)[1];
  const lit = smooth(-0.6, 0.8, up);
  let c = mix(tints[2], tints[1], smooth(0, 0.5, lit));
  c = mix(c, tints[0], smooth(0.55, 1, lit) * 0.8);
  const ao = (1 - (soft ? 0.14 : 0.24) * crease) * ((soft ? 0.86 : 0.76) + (soft ? 0.14 : 0.24) * smooth(-0.8, 0.3, h));
  return scl(c, ao);
}

function gridTris(m, material, idx, rows, segs, { skipTop = true, skipBottom = true } = {}) {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < segs; j++) {
      const a = idx[i][j], b = idx[i][j + 1], c = idx[i + 1][j], d = idx[i + 1][j + 1];
      if (!(skipTop && i === 0)) m.tri(material, a, b, c);
      if (!(skipBottom && i === rows - 1)) m.tri(material, b, d, c);
    }
  }
}

function buildCanopy(ctx, { C, radii, lobes, flat, material, segs, fold, rows, rngTag, cardSize, weight = 1 }) {
  const { m, rng } = ctx;
  const shapeRng = rng.child(`${rngTag}-shape`);
  const shape = canopyShape(shapeRng, C, radii, lobes, flat, shapeRng.rangeI(1, 9999));
  const tints = lobeTints(ctx, material, shape.lobes.length, rng.child(`${rngTag}-hues`));
  const base = canopyTints(ctx, material);
  rows = rows || fold * 5;
  const grid = [];
  for (let i = 0; i <= rows; i++) {
    const row = [];
    for (let j = 0; j <= segs; j++) {
      const d = dirOf((i / rows) * Math.PI, (j / segs) * TAU);
      const { r, crease, lobe } = shape.radiusAt(d);
      row.push({ p: shape.point(d, r), crease, d, lobe });
    }
    grid.push(row);
  }
  const P = (i, j) => grid[clamp(i, 0, rows)][((j % segs) + segs) % segs].p;
  const uRep = Math.max(1, Math.round((TAU * shape.mean) / 1.35));
  const band = ATLAS.band;
  const idx = [];
  for (let i = 0; i <= rows; i++) {
    const row = [];
    for (let j = 0; j <= segs; j++) {
      const g = grid[i][j];
      const e = shape.ellN(g.p);
      let n;
      if (i === 0 || i === rows) n = e;
      else {
        n = cross(sub(P(i, j + 1), P(i, j - 1)), sub(P(i + 1, j), P(i - 1, j)));
        n = Math.hypot(...n) > 1e-9 ? norm(n) : e;
        if (dot(n, e) < 0) n = e;
      }
      n = norm(add(mul(n, 0.4), mul(e, 0.6)));
      const x = (i / fold) % 2;
      const v = band.v0 + (band.v1 - band.v0) * (x <= 1 ? x : 2 - x);
      row.push(m.vertex(material, g.p, n, scl(canopyColor(shape, tints[g.lobe], g.p, g.crease, material === 'blossom', g.lobe, base), 0.9), [(j / segs) * uRep, v]));
    }
    idx.push(row);
  }
  gridTris(m, material, idx, rows, segs);
  const canopy = { shape, material, tints, base, cardSize, weight, rngTag };
  ctx.canopies.push(canopy);
  return canopy;
}

function buildSnowCap(ctx, canopy, { segs, rows }) {
  const { m } = ctx;
  const { shape } = canopy;
  const snow = (ctx.pal.snow || ['#fbfdff', '#e2eaf6', '#bccbe0']).map(linear);
  const capRng = ctx.rng.child(`${canopy.rngTag}-snow`);
  const nSeed = capRng.rangeI(1, 999);
  
  
  
  const COLS = 48;
  const raw = [];
  for (let c = 0; c < COLS; c++) {
    const theta = (c / COLS) * TAU;
    
    
    let phiEdge = Math.PI * 0.12;
    for (let s = 1; s <= 24; s++) {
      const phi = (s / 24) * Math.PI * 0.42;
      const d = dirOf(phi, theta);
      const { r, lobe } = shape.radiusAt(d);
      if (shape.lobeN(shape.point(d, r), lobe)[1] >= 0.45) phiEdge = phi;
    }
    const dripN = valueNoise3(Math.cos(theta) * 3.2, Math.sin(theta) * 3.2, 0.5, nSeed);
    const drip = Math.max(0, (dripN - 0.45) / 0.55) ** 2 * 0.14 + 0.025 * (fbm3(Math.cos(theta) * 7, Math.sin(theta) * 7, 1.5, { octaves: 2, seed: nSeed + 3 }) - 0.5);
    raw.push(Math.max(Math.PI * 0.12, phiEdge) + Math.PI * drip);
  }
  let edges = raw;
  for (let pass = 0; pass < 2; pass++) edges = edges.map((e, c) => (edges[(c + COLS - 1) % COLS] + 2 * e + edges[(c + 1) % COLS]) / 4);
  const edge = (theta) => {
    const x = ((((theta / TAU) % 1) + 1) % 1) * COLS;
    const c0 = Math.floor(x) % COLS, t = x - Math.floor(x);
    return edges[c0] * (1 - t) + edges[(c0 + 1) % COLS] * t;
  };
  const total = rows + 1;
  const thick = shape.mean * 0.036;
  const grid = [];
  const depth = [];
  for (let i = 0; i <= total; i++) {
    const row = [], drow = [];
    for (let j = 0; j <= segs; j++) {
      const theta = (j / segs) * TAU;
      const f = Math.min(1, i / rows);
      const lip = i > rows;
      const phi = edge(theta) * (lip ? 1.02 : f ** 0.8);
      const d = dirOf(phi, theta);
      const { r, lobe } = shape.radiusAt(d);
      
      const flatness = smooth(0.25, 0.85, shape.lobeN(shape.point(d, r), lobe)[1]);
      const extra = lip ? 0.006 : thick * (0.25 + 1.2 * flatness) * (1 - f ** 3) + 0.012;
      row.push(shape.point(d, r + extra));
      drow.push(lip ? 0 : flatness * (1 - f));
    }
    grid.push(row);
    depth.push(drow);
  }
  const P = (i, j) => grid[clamp(i, 0, total)][((j % segs) + segs) % segs];
  const idx = [];
  for (let i = 0; i <= total; i++) {
    const row = [];
    for (let j = 0; j <= segs; j++) {
      const p = grid[i][j];
      let n = i === 0 ? [0, 1, 0] : cross(sub(P(i, j + 1), P(i, j - 1)), sub(P(i + 1, j), P(i - 1, j)));
      n = Math.hypot(...n) > 1e-9 ? norm(n) : [0, 1, 0];
      if (dot(n, shape.ellN(p)) < 0) n = shape.ellN(p);
      
      
      n = norm(add(mul(n, 0.75), mul(shape.ellN(p), 0.25)));
      const c = i > rows ? mix(snow[1], snow[2], 0.6) : mix(snow[1], snow[0], smooth(0.1, 0.7, depth[i][j]));
      row.push(m.vertex('snow', p, n, c, [p[0] * 0.35, p[2] * 0.35]));
    }
    idx.push(row);
  }
  gridTris(m, 'snow', idx, total, segs, { skipBottom: false });
  canopy.snowEdge = edge;
}



function fillCards(ctx) {
  if (!ctx.canopies.length) return;
  const remaining = Math.floor((ctx.budget - ctx.m.triangleCount - ctx.reservedTris - 2) / 2);
  const totalW = ctx.canopies.reduce((s, c) => s + c.weight, 0);
  const cap = Math.round(ctx.L.cardCap * Math.min(1, totalW));
  const total = Math.max(0, Math.min(cap, remaining));
  for (const c of ctx.canopies) buildCards(ctx, c, Math.floor((total * c.weight) / totalW));
}

function buildCards(ctx, canopy, count) {
  const { m, L, season } = ctx;
  const { shape, material, tints } = canopy;
  const rng = ctx.rng.child(`${canopy.rngTag}-cards`);
  const snowTint = ctx.pal.snow ? linear(ctx.pal.snow[0]) : null;
  const leafTints = ctx.pal.leaf.map(linear);
  
  
  
  const V = [0, Math.sin((35 * Math.PI) / 180), Math.cos((35 * Math.PI) / 180)];
  for (let c = 0; c < count; c++) {
    let d;
    for (let tries = 0; tries < 10; tries++) {
      const y = rng.rangeF(-1, 1), az = rng.rangeF(0, TAU), rr = Math.sqrt(1 - y * y);
      d = [rr * Math.cos(az), y, rr * Math.sin(az)];
      const w = (y < -0.5 ? 0.08 : 1) * (0.18 + 0.82 * (1 - Math.abs(dot(d, V))) ** 1.4);
      if (rng.next() < w) break;
    }
    const { r, crease, lobe } = shape.radiusAt(d);
    const p = shape.point(d, r * rng.rangeF(0.9, 1.0));
    
    const snowPhi = canopy.snowEdge ? canopy.snowEdge(Math.atan2(d[2], d[0])) : 0;
    if (canopy.snowEdge && Math.acos(clamp(d[1], -1, 1)) < snowPhi * 0.6) continue;
    const n = shape.ellN(p);
    const s = canopy.cardSize * L.cardGrow * rng.rangeF(0.78, 1.2);
    const rand = norm([rng.rangeF(-1, 1), rng.rangeF(-1, 1), rng.rangeF(-1, 1)]);
    let t1 = cross(n, rand);
    t1 = Math.hypot(...t1) < 1e-3 ? norm(cross(n, [0, 0, 1])) : norm(t1);
    const alpha = rng.rangeF(0.5, 1.15);
    const A = norm(add(mul(n, Math.cos(alpha)), mul(t1, Math.sin(alpha))));
    const N0 = norm(add(n, [0, 0.9, 0]));
    let N = sub(N0, mul(A, dot(N0, A)));
    N = Math.hypot(...N) < 0.15 ? norm(cross(A, t1)) : norm(N);
    const B = cross(A, N);
    const cell = ATLAS.cells[rng.rangeI(0, ATLAS.cells.length - 1)];
    
    const reach = canopy.cardSize * (1 - cell.anchor);
    const base = sub(p, mul(A, s - reach));
    const corners = [
      sub(base, mul(B, s / 2)), add(base, mul(B, s / 2)),
      add(add(base, mul(A, s)), mul(B, s / 2)), sub(add(base, mul(A, s)), mul(B, s / 2)),
    ];
    let mat = material;
    let tint = tints[lobe];
    if (material === 'blossom' && rng.chance(0.2)) { mat = 'leaf'; tint = leafTints; } else rng.next();
    const flip = rng.chance(0.5);
    const u0 = flip ? cell.u1 : cell.u0, u1 = flip ? cell.u0 : cell.u1;
    const uvs = [[u0, cell.v0], [u1, cell.v0], [u1, cell.v1], [u0, cell.v1]];
    const jitter = rng.rangeF(0.94, 1.06);
    rng.next();
    
    
    const anchorCol = scl(canopyColor(shape, tint, p, crease * 0.6, mat === 'blossom', lobe, mat === material ? canopy.base : null), jitter);
    const idx = corners.map((q, k) => {
      let col = scl(anchorCol, k >= 2 ? 1.07 : 0.97);
      if (snowTint && canopy.snowEdge && k >= 2) {
        const phi = Math.acos(clamp(norm(sub(q, shape.C))[1], -1, 1));
        const e = canopy.snowEdge(Math.atan2(q[2] - shape.C[2], q[0] - shape.C[0]));
        col = mix(col, snowTint, smooth(e * 1.05, e * 0.7, phi) * 0.6);
      }
      
      
      const nn = norm(add(norm(add(shape.ellN(q), [0, 0.25, 0])), mul(N, 0.45)));
      return m.vertex(mat, q, nn, col, uvs[k]);
    });
    m.tri(mat, idx[0], idx[1], idx[2]);
    m.tri(mat, idx[0], idx[2], idx[3]);
  }
}






function leafBlade(m, base, dir, side, len, wid, color, material = 'leaf') {
  dir = norm(dir);
  side = norm(sub(side, mul(dir, dot(side, dir))));
  let up = cross(side, dir);
  if (up[1] < 0) { side = mul(side, -1); up = mul(up, -1); }
  const hw = wid / 2, cup = wid * 0.25;
  const at = (t, s, lift) => add(add(add(base, mul(dir, len * t)), mul(side, hw * s)), mul(up, lift));
  const centre = at(0.48, 0, -cup * 0.25);
  const ring = [at(0, 0, 0), at(0.28, 0.82, cup), at(0.64, 0.86, cup * 0.9), at(1, 0, cup * 0.6), at(0.64, -0.86, cup * 0.9), at(0.28, -0.82, cup)];
  const uvRing = [[0.15, 0.2], [0.19, 0.26], [0.19, 0.34], [0.15, 0.4], [0.11, 0.34], [0.11, 0.26]];
  for (const face of [1, -1]) {
    const n = mul(norm(add(up, [0, 0.35 * face, 0])), face);
    const c = m.vertex(material, centre, n, scl(color, face > 0 ? 1 : 0.8), [0.15, 0.3]);
    const r = ring.map((p, k) => m.vertex(material, p, n, scl(color, (k === 3 ? 1.12 : k === 0 ? 0.78 : 1) * (face > 0 ? 1 : 0.8)), uvRing[k]));
    for (let k = 0; k < 6; k++) {
      if (face > 0) m.tri(material, c, r[k], r[(k + 1) % 6]);
      else m.tri(material, c, r[(k + 1) % 6], r[k]);
    }
  }
}

function fruitMesh(ctx, r, rng) {
  const { L, kind, season, pal } = ctx;
  const f = new MeshData('fruit');
  const S = L.fruitSegs, R = L.fruitRows;
  const col = FRUIT[kind](season, pal);
  const crease = rng.rangeF(0, TAU);
  const blush = rng.rangeF(0, TAU);
  const pos = (i, j) => {
    const phi = (i / R) * Math.PI, th = (j / S) * TAU;
    if (kind === 'apple') {
      if (i === 0) return [0, r * 0.64, 0];
      if (i === R) return [0, -r * 0.74, 0];
      const rad = r * (1 + 0.1 * Math.cos(phi)) * (1 + 0.025 * Math.cos(th * 5) * Math.sin(phi));
      return [Math.sin(phi) * Math.cos(th) * rad, Math.cos(phi) * r * 0.9, Math.sin(phi) * Math.sin(th) * rad];
    }
    if (i === 0) return [0, r * 0.82, 0];
    if (i === R) return [0, -r * 1.12, 0];
    const dth = Math.atan2(Math.sin(th - crease), Math.cos(th - crease));
    const rad = r * (1 - 0.09 * Math.exp(-((dth / 0.45) ** 2)) * Math.sin(phi));
    return [Math.sin(phi) * Math.cos(th) * rad, Math.cos(phi) * r * 1.02, Math.sin(phi) * Math.sin(th) * rad];
  };
  const idx = [];
  for (let i = 0; i <= R; i++) {
    const row = [];
    for (let j = 0; j <= S; j++) {
      const p = pos(i, j);
      const phi = (i / R) * Math.PI, th = (j / S) * TAU;
      const radial = dirOf(phi, th);
      let n = radial;
      if (i > 0 && i < R) {
        const g = cross(sub(pos(i, j + 1), pos(i, j - 1)), sub(pos(i + 1, j), pos(i - 1, j)));
        if (Math.hypot(...g) > 1e-9) n = norm(add(norm(g), mul(radial, 0.5)));
      }
      let c;
      if (kind === 'apple') {
        c = mix(col.base, col.other, col.otherAmt * smooth(0.1, -0.9, Math.cos(phi)) + 0.18 * smooth(0.6, -0.4, Math.cos(th - blush)));
        c = scl(c, 0.86 + 0.14 * smooth(-1, 0.6, Math.cos(phi)));
      } else {
        const bl = smooth(-0.3, 0.9, Math.cos(th - blush) * Math.sin(phi) + 0.3 * Math.cos(phi));
        c = mix(col.base, col.other, col.otherAmt * bl);
        const dth = Math.atan2(Math.sin(th - crease), Math.cos(th - crease));
        c = scl(c, 1 - 0.14 * Math.exp(-((dth / 0.35) ** 2)) * Math.sin(phi));
      }
      row.push(f.vertex('fruit', p, n, c, [(j / S), i / R]));
    }
    idx.push(row);
  }
  gridTris(f, 'fruit', idx, R, S);
  if (L.stems) {
    const top = kind === 'apple' ? r * 0.6 : r * 0.78;
    loft(f, 'bark', {
      points: [[0, top, 0], [r * 0.05, top + r * 0.45, 0], [r * 0.2, top + r * 0.95, r * 0.05]],
      sides: 3, rings: 2, radius: (t) => r * (0.11 - 0.04 * t), color: () => linear(pal.bark[1]), end: 'point',
    });
    const lc = linear(season === 'autumn' ? pal.leaf[0] : pal.leaf[1]);
    const la = rng.rangeF(0, TAU);
    leafBlade(f, [r * 0.08, top + r * 0.5, 0], [Math.cos(la), 0.45, Math.sin(la)], [-Math.sin(la), 0, Math.cos(la)], r * 1.5, r * 0.8, lc);
  }
  return f;
}

function hangFruit(ctx, canopy, count) {
  const rng = ctx.rng.child('fruit');
  const { shape } = canopy;
  const fr = HABIT[ctx.kind].fruitR;
  const az0 = Math.PI / 2 + rng.rangeF(-0.35, 0.35);
  for (let k = 0; k < count; k++) {
    const off = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2);
    const az = az0 + off * (TAU / Math.max(count, 5)) * 1.05 + rng.rangeF(-0.2, 0.2);
    const y = rng.rangeF(-0.42, -0.08);
    const rr = Math.sqrt(1 - y * y);
    const d = [rr * Math.cos(az), y, rr * Math.sin(az)];
    const { r } = shape.radiusAt(d);
    const surf = shape.point(d, r * 0.97);
    const e = shape.ellN(surf);
    const c = add(add(surf, mul(e, fr * 0.55)), [0, -fr * 0.35, 0]);
    const size = fr * rng.rangeF(0.88, 1.12);
    const mesh = fruitMesh(ctx, size, rng);
    ctx.m.append(mesh, compose(translate(...c), compose(rotateY(rng.rangeF(0, TAU)), rotateZ(rng.rangeF(-0.25, 0.25)))));
  }
}



function fruitingOrYoung(ctx, young) {
  const { L, rng, kind, season } = ctx;
  const habit = HABIT[kind];
  const hr = rng.child('habit');
  const hs = hr.rangeF(0.9, 1.1) * habit.height * (young ? 0.6 : 1);
  const tp = trunkParams(rng.child('trunk'), young ? 0.58 : 1);
  if (young) tp.leanAmt *= 0.6;
  const H = 2.3 * hs;
  const trunk = buildTrunk(ctx, tp, H, { sides: L.trunkSides, rings: L.trunkRings });
  const limbCount = young ? 2 : hr.rangeI(2, 4);
  buildLimbs(ctx, trunk, tp, H, {
    count: limbCount, length: (young ? 0.7 : 1.25) * hs, rise: habit.rise, from: young ? 0.5 : 0.42, to: young ? 0.66 : 0.6,
    sides: L.limbSides, rings: L.limbRings, rng: rng.child('limbs'),
  });
  const top = trunk.spline.at(1);
  const cs = young ? 0.58 : 1;
  const radii = habit.radii.map((v) => v * cs * hr.rangeF(0.9, 1.1));
  const C = [top[0] + hr.rangeF(-0.12, 0.12) * cs, 2.55 * hs + (young ? 0.12 : 0), top[2] + hr.rangeF(-0.12, 0.12) * cs];
  const material = season === 'spring' ? 'blossom' : 'leaf';
  const lobes = hr.rangeI(habit.lobes[0], habit.lobes[1]) - (young ? 2 : 0);
  const canopy = buildCanopy(ctx, {
    C, radii, lobes, flat: habit.flat, material, segs: young ? Math.max(10, Math.round(L.shellSegs * 0.75)) : L.shellSegs,
    rows: L.rows, fold: L.rows / 5, rngTag: 'crown', cardSize: 0.42 * (young ? 0.72 : 1),
  });
  if (season === 'winter') buildSnowCap(ctx, canopy, { segs: canopy.segs || L.shellSegs, rows: L.snowRows });
  if (!young && (season === 'summer' || season === 'autumn')) {
    const fr = rng.child('fruitCount');
    const count = season === 'summer' ? fr.rangeI(4, 6) : fr.rangeI(2, 3);
    if (ctx.fruit) hangFruit(ctx, canopy, count);
    else {
      const shown = ctx.m;
      ctx.m = new MeshData('picked-fruit');
      hangFruit(ctx, canopy, count);
      ctx.reservedTris = ctx.m.triangleCount;
      ctx.m = shown;
    }
  }
}

function sapling(ctx) {
  const { L, rng, season, pal } = ctx;
  const hr = rng.child('habit');
  const tp = trunkParams(rng.child('trunk'), 0.17, false);
  tp.flare = 0.9;
  tp.leanAmt *= 0.35;
  const H = hr.rangeF(0.72, 0.86);
  const sides = Math.max(5, Math.round(L.trunkSides * 0.5));
  const stem = buildTrunk(ctx, tp, H, { sides, rings: Math.max(3, Math.round(L.trunkRings * 0.6)) });
  const material = season === 'spring' ? 'blossom' : 'leaf';
  const segs = Math.max(8, Math.round(L.shellSegs * 0.4));
  const rows = Math.max(4, Math.round(L.rows * 0.6));
  const top = stem.spline.at(1);
  const tufts = [{ C: add(top, [0, 0.1, 0]), r: 0.2 }];
  const tr = rng.child('twigs');
  const twigCount = tr.rangeI(2, 3);
  const az0 = tr.rangeF(0, TAU);
  const col = barkColor(ctx);
  for (let k = 0; k < twigCount; k++) {
    const az = az0 + (k / twigCount) * TAU + tr.rangeF(-0.4, 0.4);
    const t = tr.rangeF(0.45, 0.72);
    const pts = branchPoints(stem.spline, t, [Math.cos(az), 0, Math.sin(az)], { length: tr.rangeF(0.26, 0.34), rise: 0.45, bend: 0.25, back: 0.05 });
    const res = loft(ctx.m, 'bark', {
      points: pts, sides: Math.max(3, sides - 2), rings: 3, radius: (u) => 0.02 * (1 - u) + 0.006,
      color: (u, a, p) => col(p[1]), vPerMetre: 2, end: 'point',
    });
    tufts.push({ C: res.spline.at(1), r: tr.rangeF(0.12, 0.15) });
  }
  tufts.forEach((tuft, k) => {
    const canopy = buildCanopy(ctx, {
      C: tuft.C, radii: [tuft.r * 1.1, tuft.r * 0.85, tuft.r], lobes: 3, flat: 0.7, material, segs, rows, fold: Math.max(1, Math.round(rows / 4)),
      rngTag: `tuft${k}`, cardSize: 0.16, weight: (tuft.r / 0.2) ** 2 * 0.3,
    });
    
    if (season === 'winter' && (k === 0 || L.stems)) buildSnowCap(ctx, canopy, { segs, rows: Math.max(2, L.snowRows - 2) });
  });
  void pal;
}

function seedStage(ctx) {
  const { m, L, rng, pal, season } = ctx;
  const sr = rng.child('mound');
  const rings = Math.max(4, Math.round(L.trunkRings * 0.6)), segs = Math.max(10, Math.round(L.trunkSides * 1.7));
  const R = sr.rangeF(0.3, 0.36), Hm = sr.rangeF(0.08, 0.11), nSeed = sr.rangeI(1, 999);
  const soil = linear(pal.soil);
  const snow = pal.snow ? linear(pal.snow[0]) : null;
  const height = (rho, th) => {
    const n = fbm3(Math.cos(th) * rho * 3, rho * 2, Math.sin(th) * rho * 3, { octaves: 2, seed: nSeed });
    return Hm * Math.max(0, 1 - rho * rho) ** 1.3 * (0.8 + 0.45 * n) - 0.025 * smooth(0.7, 1, rho);
  };
  const lean = sr.rangeF(-0.1, 0.1);
  const idx = [];
  for (let i = 0; i <= rings; i++) {
    const rho = i / rings;
    const row = [];
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * TAU;
      const rr = R * rho * (1 + 0.12 * Math.sin(th * 3 + nSeed));
      const p = [Math.cos(th) * rr + lean * (1 - rho), height(rho, th), Math.sin(th) * rr];
      const e = 0.01;
      const dx = (height(Math.min(1, rho + e), th) - height(Math.max(0, rho - e), th)) / (2 * e * R);
      const n = norm([-Math.cos(th) * dx, 1, -Math.sin(th) * dx]);
      let c = scl(soil, 0.78 + 0.3 * (1 - rho));
      if (snow && season === 'winter') c = mix(c, snow, 0.55 * smooth(0.9, 0.2, rho));
      row.push(m.vertex('soil', p, n, c, [p[0] * 1.5, p[2] * 1.5]));
    }
    idx.push(row);
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = idx[i][j], b = idx[i][j + 1], c = idx[i + 1][j], d = idx[i + 1][j + 1];
      if (i > 0) m.tri('soil', a, b, c);
      m.tri('soil', b, d, c);
    }
  }
  const top = [lean, height(0, 0), 0];
  const g0 = linear(pal.leaf[1]), g1 = linear(pal.leaf[0]);
  const bendAz = sr.rangeF(0, TAU);
  const tip = add(top, [Math.cos(bendAz) * 0.04, sr.rangeF(0.15, 0.2), Math.sin(bendAz) * 0.04]);
  loft(m, 'leaf', {
    points: [add(top, [0, -0.03, 0]), add(top, [0, 0.07, 0]), add(top, [Math.cos(bendAz) * 0.025, 0.13, Math.sin(bendAz) * 0.025]), tip],
    sides: 6, rings: 5, radius: (t) => 0.013 * (1 - 0.3 * t), color: (t) => mix(g0, g1, t), vPerMetre: 0.5, uRepeat: 0.15, end: 'cap',
  });
  const la = sr.rangeF(0, TAU);
  for (const s of [1, -1]) {
    const dir = [Math.cos(la) * s, 0.55, Math.sin(la) * s];
    leafBlade(m, tip, dir, [-Math.sin(la), 0, Math.cos(la)], 0.13, 0.08, season === 'autumn' ? linear(pal.leaf[0]) : g1);
  }
}

function stump(ctx) {
  const { m, L, rng, pal, season } = ctx;
  const tp = trunkParams(rng.child('trunk'), 1);
  
  
  tp.flare *= 0.6;
  tp.leanAmt *= 0.5;
  const H = 2.3;
  const sr = rng.child('stump');
  const yTop = sr.rangeF(0.52, 0.64);
  const sides = Math.round(L.trunkSides * 1.6);
  const trunk = buildTrunk(ctx, tp, H, { sides, rings: Math.max(5, L.trunkRings), end: 'open', yTop });
  const last = trunk.ts.length - 1;
  const ring = trunk.ring(last);
  const centre = trunk.centres[last];
  const tilt = [sr.rangeF(-0.12, 0.12), 1, sr.rangeF(-0.12, 0.12)];
  const up = norm(tilt);
  const plane = (p) => {
    const rel = sub(p, centre);
    return sub(p, mul(up, dot(rel, up) - 0.0));
  };
  const cream = linear(pal.cream);
  const bark0 = linear(pal.bark[0]), bark2 = linear(pal.bark[2]);
  const wood = mix(bark0, cream, 0.55);
  const line = mix(bark0, cream, 0.12);
  const full = [
    [1.0, 0.02, bark2, 'lip'], [0.93, 0.03, mix(bark0, bark2, 0.3), 'lip'], [0.86, 0, mix(wood, bark0, 0.25)],
    [0.74, 0, wood], [0.71, 0, line], [0.68, 0, wood],
    [0.5, 0, wood], [0.47, 0, line], [0.44, 0, wood],
    [0.27, 0, wood], [0.24, 0, line], [0.21, 0, wood],
    [0.06, 0, mix(wood, line, 0.4)],
  ];
  const keep = L.capRings >= 1 ? full : L.capRings >= 0.5 ? full.filter((_, k) => [0, 2, 4, 7, 10, 12].includes(k)) : full.filter((_, k) => [0, 2, 7, 12].includes(k));
  const crackA = sr.rangeF(0, TAU);
  const rows = [];
  for (const [f, lift, col, kind] of keep) {
    const row = [];
    for (let j = 0; j <= sides; j++) {
      const q = ring[j % sides];
      const a = (j / sides) * TAU;
      let p = add(centre, mul(sub(plane(q), centre), f));
      p = add(p, mul(up, lift + 0.012 * (1 - f * f)));
      const n = kind === 'lip' ? norm(add(up, mul(norm(sub(q, centre)), 0.8))) : up;
      const crack = Math.exp(-((Math.atan2(Math.sin(a - crackA), Math.cos(a - crackA)) / 0.18) ** 2)) * smooth(0.2, 0.8, f);
      const c = kind === 'lip' ? col : scl(col, 1 - 0.35 * crack);
      row.push(m.vertex('bark', p, n, c, kind === 'lip' ? [a / TAU, yTop * 0.75 + 0.02] : [0.31 + p[0] * 0.03, 0.62 + p[2] * 0.03]));
    }
    rows.push(row);
  }
  
  const seal = [];
  const b1 = linear(pal.bark[1]);
  for (let j = 0; j <= sides; j++) {
    const q = ring[j % sides];
    seal.push(m.vertex('bark', q, norm(sub(q, centre)), scl(b1, 0.9), [(j / sides), yTop * 0.75]));
  }
  
  const ccw = dot(cross(sub(ring[0], centre), sub(ring[1], centre)), up) < 0;
  const face = (a, b, c) => (ccw ? m.tri('bark', a, b, c) : m.tri('bark', a, c, b));
  const all = [seal, ...rows];
  for (let i = 0; i < all.length - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = all[i][j], b = all[i][j + 1], c = all[i + 1][j], d = all[i + 1][j + 1];
      face(a, c, b);
      face(b, c, d);
    }
  }
  const pith = m.vertex('bark', add(centre, mul(up, 0.014)), up, line, [0.31, 0.62]);
  const inner = rows[rows.length - 1];
  for (let j = 0; j < sides; j++) face(inner[j], pith, inner[j + 1]);
  if (season === 'winter') snowCushion(ctx, centre, up, ring, keep.length);
}

function snowCushion(ctx, centre, up, ring, _n) {
  const { m, pal } = ctx;
  const snow = pal.snow.map(linear);
  const sides = ring.length;
  const fr = [0.8, 0.6, 0.3, 0];
  const lift = [0.03, 0.06, 0.08, 0.085];
  const idx = fr.map((f, k) => {
    const row = [];
    for (let j = 0; j <= sides; j++) {
      const q = ring[j % sides];
      const p = add(add(centre, mul(sub(q, centre), f)), mul(up, lift[k] + 0.02));
      const n = norm(add(up, mul(norm(sub(q, centre)), 0.9 * (1 - k / 3))));
      row.push(m.vertex('snow', p, n, mix(snow[1], snow[0], k / 3), [p[0] * 0.35, p[2] * 0.35]));
    }
    return row;
  });
  const ccw = dot(cross(sub(ring[0], centre), sub(ring[1], centre)), up) < 0;
  for (let i = 0; i < idx.length - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = idx[i][j], b = idx[i][j + 1], c = idx[i + 1][j], d = idx[i + 1][j + 1];
      if (i === idx.length - 2) { if (ccw) m.tri('snow', a, c, b); else m.tri('snow', a, b, c); continue; }
      if (ccw) { m.tri('snow', a, c, b); m.tri('snow', b, c, d); } else { m.tri('snow', a, b, c); m.tri('snow', b, d, c); }
    }
  }
}

const BUILD = {
  fruiting: (ctx) => fruitingOrYoung(ctx, false),
  young: (ctx) => fruitingOrYoung(ctx, true),
  sapling,
  seed: seedStage,
  stump,
};
