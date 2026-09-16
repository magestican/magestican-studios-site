










import { SeededRng } from '../../rng/seededRng.js';
import { fbm3 } from '../noise.mjs';
import { COVER_SETS } from '../art/groundCover.mjs';
import { lawnColour } from '../art/moonGround.mjs';
import * as MOON from './moonLayout.mjs';







const smoothstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function blockers(layout = MOON) {
  const out = [];
  for (const p of layout.placements()) {
    if (p.role === 'fence') continue;
    if (p.module === 'cottage') out.push({ x: p.x, z: p.z, hx: 3.0, hz: 2.6 });
    else out.push({ x: p.x, z: p.z, r: p.role === 'tree' ? 0.5 : p.role === 'rock' ? 0.55 * Math.min(1.5, p.scale || 1) : p.role === 'fire' ? 1.1 : p.module === 'cat' ? 0.45 : 0.3 });
  }
  return out;
}

export function isBlocked(x, z, list) {
  for (const b of list) {
    if (b.r !== undefined ? Math.hypot(x - b.x, z - b.z) < b.r : Math.abs(x - b.x) < b.hx && Math.abs(z - b.z) < b.hz) return true;
  }
  return false;
}

export function scatterCover({ season = 'summer', count = 1000, seed = 1, variants = 2, layout = MOON } = {}) {
  const { FOCUS, PATH_HALF_WIDTH, heightAt, pathDistance, parcelDistance } = layout;
  const rng = new SeededRng(seed * 131 + 7);
  const set = COVER_SETS[season];
  const block = blockers(layout);
  const maxR = layout.ISLAND_RADIUS - layout.RIM_WIDTH;
  
  
  const nearR = Math.min(21, maxR);
  const out = [];
  for (let guard = 0; out.length < count && guard < count * 60; guard++) {
    const near = rng.chance(0.62);
    const rMax = near ? nearR : maxR;
    const a = rng.next() * Math.PI * 2, r = rMax * Math.sqrt(rng.next());
    const x = (near ? FOCUS.x : 0) + Math.cos(a) * r;
    const z = (near ? FOCUS.z : 0) + Math.sin(a) * r;
    if (Math.hypot(x, z) > maxR) continue;
    const pd = pathDistance(x, z);
    if (pd < PATH_HALF_WIDTH + 0.12) continue;
    if (isBlocked(x, z, block)) continue;
    if (parcelDistance(x, z) < -0.4 && rng.chance(0.75)) continue;
    const drift = fbm3(x / 7, 0.5, z / 7, { octaves: 2, seed: 900 + seed });
    if (!rng.chance(0.05 + 0.95 * smoothstep(0.4, 0.62, drift))) continue;
    const bed = fbm3(x / 5, 2.5, z / 5, { octaves: 2, seed: 950 + seed });
    const weights = set.map(([k, w]) => w * (k === 'tuft' ? 1 : 0.15 + 2.2 * smoothstep(0.4, 0.62, bed)));
    const total = weights.reduce((s, v) => s + v, 0);
    let u = rng.next() * total;
    let kind = set[set.length - 1][0];
    for (let i = 0; i < set.length; i++) {
      if (u < weights[i]) { kind = set[i][0]; break; }
      u -= weights[i];
    }
    out.push({
      kind,
      variant: rng.rangeI(0, variants - 1),
      x, y: heightAt(x, z), z,
      rotY: rng.next() * Math.PI * 2,
      scale: rng.rangeF(1.0, 1.5),
      tint: lawnColour(x, z, { season, seed: 1 }),
    });
  }
  return out;
}


export function scatterPathEdge({ season = 'summer', seed = 1, variants = 2, step = 0.45, layout = MOON } = {}) {
  const { PATHS, PATH_HALF_WIDTH, heightAt, pathDistance } = layout;
  const rng = new SeededRng(seed * 977 + 3);
  const block = blockers(layout);
  const maxR = layout.ISLAND_RADIUS - layout.RIM_WIDTH;
  const out = [];
  const push = (kind, x, z, scale) => out.push({
    kind, variant: rng.rangeI(0, variants - 1), x, y: heightAt(x, z), z,
    rotY: rng.next() * Math.PI * 2, scale, tint: lawnColour(x, z, { season, seed: 1 }),
  });
  for (const line of PATHS) {
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, az] = line[i], [bx, bz] = line[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const tx = (bx - ax) / len, tz = (bz - az) / len;
      for (let s = 0; s < len; s += step) {
        const cx = ax + tx * s, cz = az + tz * s;
        for (const side of [-1, 1]) {
          if (!rng.chance(0.62)) continue;
          const off = PATH_HALF_WIDTH + rng.rangeF(-0.12, 0.22);
          const x = cx - tz * off * side + tx * rng.rangeF(-0.2, 0.2);
          const z = cz + tx * off * side + tz * rng.rangeF(-0.2, 0.2);
          if (Math.hypot(x, z) > maxR || isBlocked(x, z, block)) continue;
          
          if (pathDistance(x, z) < PATH_HALF_WIDTH - 0.15) continue;
          push('tuft', x, z, rng.rangeF(0.9, 1.3));
        }
        if (rng.chance(0.3)) {
          const off = rng.rangeF(-1, 1) * (PATH_HALF_WIDTH - 0.25);
          const x = cx - tz * off, z = cz + tx * off;
          if (Math.hypot(x, z) < maxR && !isBlocked(x, z, block)) push('pebbles', x, z, rng.rangeF(0.9, 1.4));
        }
      }
    }
  }
  return out;
}
