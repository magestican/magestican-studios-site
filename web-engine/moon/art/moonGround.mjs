
















import { MeshData } from '../mesh/meshData.mjs';
import { fbm3, valueNoise2 } from '../noise.mjs';
import { seasonPalette, linear } from '../palette/seasons.mjs';
import * as MOON from '../world/moonLayout.mjs';
import { zip } from './groundCover.mjs';







export const GROUND_TRIANGLES = Object.freeze([26000, 9000, 3200]);




export const BELLY_DEPTH = 16;
export const bellyDepthOf = (radius) => radius / 3;

const SPACING = [1.0, 1.8, 3.4];

const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function occluders(layout) {
  const occ = [];
  for (const p of layout.placements()) {
    if (p.role === 'tree') occ.push({ x: p.x, z: p.z, r: p.stage === 'fruiting' ? 2.2 : p.stage === 'young' ? 1.5 : 0.7, k: p.stage === 'fruiting' ? 0.3 : 0.2 });
    else if (p.module === 'cottage') occ.push({ x: p.x, z: p.z, r: 3.9, k: 0.32 });
    else if (p.role === 'rock') occ.push({ x: p.x, z: p.z, r: 0.9 * (p.scale || 1), k: 0.25 });
    else if (p.role === 'lamp') occ.push({ x: p.x, z: p.z, r: 0.5, k: 0.2 });
  }
  return occ;
}

function aoAt(x, z, occ) {
  let ao = 1;
  for (const o of occ) {
    const d = Math.hypot(x - o.x, z - o.z);
    if (d < o.r) ao *= 1 - o.k * (1 - smoothstep(0, o.r, d));
  }
  return ao;
}



export function lawnColour(x, z, { season = 'summer', seed = 1, tint = null, tintK = 0 } = {}) {
  
  
  
  
  const t = tint ? linear(tint) : null;
  const lean = season === 'winter' ? tintK * 0.5 : tintK;
  const g = seasonPalette(season).grass.map(linear).map((c) => (t ? mix3(c, t, lean) : c));
  const n1 = fbm3(x / 9, seed * 1.7, z / 9, { octaves: 3, seed: 100 + seed });
  const n2 = valueNoise2(x / 2.2, z / 2.2, 200 + seed);
  const c = n1 < 0.5 ? mix3(g[2], g[1], smoothstep(0.36, 0.5, n1)) : mix3(g[1], g[0], smoothstep(0.52, 0.64, n1));
  const k = 0.93 + n2 * 0.12;
  return [c[0] * k, c[1] * k, c[2] * k];
}


export function groundTintOf(layout) {
  const p = layout && layout.planet;
  if (!p || !p.tint || !(p.tintK > 0)) return {};
  return { tint: p.tint, tintK: p.tintK };
}

export function generate({ seed = 1, season = 'summer', lod = 0, layout = MOON } = {}) {
  const m = new MeshData(`moonGround-${season}-${seed}`);
  const tinted = groundTintOf(layout);
  const pal = seasonPalette(season);
  const { heightAt, normalAt, rimDrop, RIM_WIDTH } = layout;
  const occ = occluders(layout);
  const R = layout.ISLAND_RADIUS;
  
  
  const s = SPACING[lod] * Math.min(1, R / MOON.ISLAND_RADIUS + 0.35);

  const lawn = (x, z) => {
    const c = lawnColour(x, z, { season, seed, ...tinted });
    const k = aoAt(x, z, occ);
    return [c[0] * k, c[1] * k, c[2] * k];
  };

  
  const radii = [];
  const shoulder = R - RIM_WIDTH * 1.4;
  for (let r = s; r < shoulder; r += s) radii.push(r);
  const rimSteps = Math.max(3, Math.round((R - shoulder) / (s * 0.5)));
  for (let i = 0; i <= rimSteps; i++) radii.push(shoulder + ((R - shoulder) * i) / rimSteps);

  const ringCount = (r) => Math.max(6, Math.round((2 * Math.PI * r) / s));
  const outerCount = ringCount(R);

  const centre = m.vertex('grass', [0, heightAt(0, 0), 0], normalAt(0, 0), lawn(0, 0), [0, 0]);
  let prev = null;
  let edge = null;
  for (const r of radii) {
    const n = r >= shoulder ? outerCount : ringCount(r);
    const ring = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      let nrm = normalAt(x, z);
      if (r >= R - 1e-6) nrm = [Math.cos(a) * 0.96, 0.28, Math.sin(a) * 0.96].map((v, _, arr) => v / Math.hypot(...arr));
      
      const lip = smoothstep(R - RIM_WIDTH * 0.7, R, r);
      const col = mix3(lawn(x, z), mix3(linear(pal.soil), [1, 1, 1], 0.12), lip * 0.8);
      ring.push(m.vertex('grass', [x, heightAt(x, z), z], nrm, col, [0, 0]));
    }
    if (!prev) {
      for (let i = 0; i < n; i++) m.tri('grass', centre, ring[(i + 1) % n], ring[i]);
    } else {
      zip(m, 'grass', prev, ring);
    }
    prev = ring;
    if (r >= R - 1e-6) edge = { n };
  }

  
  const soil = linear(pal.soil);
  const stone = linear('#8e86a8');
  const deep = linear('#5d5780');
  const depth = bellyDepthOf(R);
  const bs = Math.max(s * 2, 2.5 * R / MOON.ISLAND_RADIUS);
  const bellyR = [];
  for (let r = R; r > bs * 0.75; r -= bs) bellyR.push(r);
  const topY = -rimDrop(R);
  const bellyY = (r, a) => {
    const t = r / R;
    const lump = (fbm3(Math.cos(a) * 2.5, r / 7, Math.sin(a) * 2.5, { octaves: 3, seed: 300 + seed }) - 0.5) * 3.5 * (depth / BELLY_DEPTH) * (1 - t * t);
    return topY - depth * Math.pow(Math.max(0, 1 - t * t), 0.75) + lump;
  };
  let bprev = null;
  for (let ri = 0; ri < bellyR.length; ri++) {
    const r = bellyR[ri];
    const n = ri === 0 ? edge.n : Math.max(6, Math.round((2 * Math.PI * r) / bs));
    const ring = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const y = bellyY(r, a);
      const e = 0.5;
      
      const dr = (bellyY(r + e, a) - bellyY(Math.max(0.01, r - e), a)) / (2 * e);
      const below = (topY - y) / depth;
      const band = 0.9 + 0.1 * Math.sin(y * 1.7 + Math.sin(a * 3) * 0.6);
      const col = (below < 0.35 ? mix3(soil, stone, smoothstep(0, 0.35, below)) : mix3(stone, deep, smoothstep(0.35, 1, below))).map((c) => c * band);
      const raw = ri === 0 ? [Math.cos(a) * 0.9, -0.44, Math.sin(a) * 0.9] : [Math.max(0, dr) * Math.cos(a), -1, Math.max(0, dr) * Math.sin(a)];
      const l = Math.hypot(raw[0], raw[1], raw[2]);
      ring.push(m.vertex('soil', [Math.cos(a) * r, ri === 0 ? topY : y, Math.sin(a) * r], [raw[0] / l, raw[1] / l, raw[2] / l], col, [0, 0]));
    }
    if (bprev) zip(m, 'soil', ring, bprev, true);
    bprev = ring;
  }
  const tip = m.vertex('soil', [0, topY - depth - 2.5 * depth / BELLY_DEPTH, 0], [0, -1, 0], deep, [0, 0]);
  const nb = bprev.length;
  for (let i = 0; i < nb; i++) m.tri('soil', tip, bprev[i], bprev[(i + 1) % nb]);
  return m;
}
