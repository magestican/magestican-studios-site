































































import { smooth1024, noiseMm } from './shapes.js';


export const MM_PER_DM = 100;














export const TIER_DM = Object.freeze([40, 120]);









export const CLIFF_STEP_DM = 55;



































export const HIGH_GROUND = Object.freeze({
  rangePct: Object.freeze([
    Object.freeze([100, 92, 85]),     
    Object.freeze([112, 100, 92]),    
    Object.freeze([124, 112, 100]),   
  ]),
  damagePct: Object.freeze([
    Object.freeze([100, 90, 82]),
    Object.freeze([115, 100, 90]),
    Object.freeze([130, 115, 100]),
  ]),
});


export function heightEdgePct(aTier, bTier) {
  const a = aTier < 0 ? 0 : (aTier > 2 ? 2 : aTier);
  const b = bTier < 0 ? 0 : (bTier > 2 ? 2 : bTier);
  return { rangePct: HIGH_GROUND.rangePct[a][b], damagePct: HIGH_GROUND.damagePct[a][b] };
}


















export const RISE_KINDS = Object.freeze(['ramp', 'dome', 'mesa']);
























export function buildElevation({
  n, cellMm, seed, features = [], baseDm = 0, baseWaveMm = 300_000,
}) {
  const out = new Int16Array(n * n);
  const half = Math.trunc(cellMm / 2);
  for (let cy = 0; cy < n; cy += 1) {
    const y = cy * cellMm + half;
    for (let cx = 0; cx < n; cx += 1) {
      const x = cx * cellMm + half;
      let h = 0;
      for (let i = 0; i < features.length; i += 1) {
        const v = featureHeightDm(features[i], x, y);
        if (v > h) h = v;
      }
      if (baseDm > 0) h += noiseMm(seed ^ 0x9e3779b9, x, y, baseWaveMm, baseDm);
      out[cy * n + cx] = h < 0 ? 0 : h;
    }
  }
  return out;
}


export function featureHeightDm(feature, x, y) {
  const d = feature.region.f(x, y);
  if (d <= 0) return 0;
  const peak = feature.peakDm;
  const ramp = feature.rampMm || 1;
  const rise = feature.rise || 'dome';
  if (rise === 'mesa') return peak;
  
  
  
  
  
  
  
  
  
  if (d >= ramp) return peak;
  const t = Math.trunc((d * 1024) / ramp);
  if (rise === 'ramp') return Math.trunc((peak * t) / 1024);
  return Math.trunc((peak * smooth1024(t)) / 1024);
}

















export function heightDmAtMm(map, xMm, yMm) {
  const e = map.heightOfCell;
  if (!e) return 0;
  const n = map.cellsPerSide;
  const cx = Math.min(n - 1, Math.max(0, Math.floor(xMm / map.cellMm)));
  const cy = Math.min(n - 1, Math.max(0, Math.floor(yMm / map.cellMm)));
  return e[cy * n + cx];
}


export function tierAtMm(map, xMm, yMm) {
  const h = heightDmAtMm(map, xMm, yMm);
  if (h >= TIER_DM[1]) return 2;
  if (h >= TIER_DM[0]) return 1;
  return 0;
}


export function tierOfDm(h) {
  if (h >= TIER_DM[1]) return 2;
  if (h >= TIER_DM[0]) return 1;
  return 0;
}














export function cornerHeightDm(map, cx, cy) {
  const e = map.heightOfCell;
  if (!e) return 0;
  const n = map.cellsPerSide;
  let sum = 0;
  let count = 0;
  for (let dy = -1; dy <= 0; dy += 1) {
    for (let dx = -1; dx <= 0; dx += 1) {
      const ix = cx + dx;
      const iy = cy + dy;
      if (ix < 0 || iy < 0 || ix >= n || iy >= n) continue;
      sum += e[iy * n + ix];
      count += 1;
    }
  }
  return count === 0 ? 0 : Math.trunc(sum / count);
}









export function isCliffStep(map, ax, ay, bx, by) {
  if (!map.heightOfCell) return false;
  return cliffStepBetween(map.heightOfCell, map.cellsPerSide, ax, ay, bx, by);
}







export function cliffStepBetween(heightOfCell, n, ax, ay, bx, by) {
  if (!heightOfCell) return false;
  const d = heightOfCell[ay * n + ax] - heightOfCell[by * n + bx];
  return (d < 0 ? -d : d) >= CLIFF_STEP_DM;
}






export function slopeDm(map, cx, cy) {
  const e = map.heightOfCell;
  if (!e) return 0;
  const n = map.cellsPerSide;
  const h = e[cy * n + cx];
  let worst = 0;
  const look = (ix, iy) => {
    if (ix < 0 || iy < 0 || ix >= n || iy >= n) return;
    const d = h - e[iy * n + ix];
    const a = d < 0 ? -d : d;
    if (a > worst) worst = a;
  };
  look(cx - 1, cy);
  look(cx + 1, cy);
  look(cx, cy - 1);
  look(cx, cy + 1);
  return worst;
}



































export function blockedStep(map, fromXMm, fromYMm, toXMm, toYMm) {
  const e = map.heightOfCell;
  if (!e) return false;
  const n = map.cellsPerSide;
  const cm = map.cellMm;
  const ax = Math.min(n - 1, Math.max(0, Math.floor(fromXMm / cm)));
  const ay = Math.min(n - 1, Math.max(0, Math.floor(fromYMm / cm)));
  const bx = Math.min(n - 1, Math.max(0, Math.floor(toXMm / cm)));
  const by = Math.min(n - 1, Math.max(0, Math.floor(toYMm / cm)));
  if (ax === bx && ay === by) return false;
  const d = e[ay * n + ax] - e[by * n + bx];
  return (d < 0 ? -d : d) >= CLIFF_STEP_DM;
}




















export function findPasses(map) {
  const n = map.cellsPerSide;
  const cells = map.sectorOfCell;
  const acc = new Map();
  const key = (a, b) => (a < b ? `${a},${b}` : `${b},${a}`);
  for (let cy = 0; cy < n; cy += 1) {
    for (let cx = 0; cx < n; cx += 1) {
      const here = cells[cy * n + cx];
      for (let e = 0; e < 2; e += 1) {
        const nx = cx + (e === 0 ? 1 : 0);
        const ny = cy + (e === 0 ? 0 : 1);
        if (nx >= n || ny >= n) continue;
        const there = cells[ny * n + nx];
        if (there === here) continue;
        if (isCliffStep(map, cx, cy, nx, ny)) continue;
        const k = key(here, there);
        let r = acc.get(k);
        if (!r) { r = { a: Math.min(here, there), b: Math.max(here, there), cells: 0, sx: 0, sy: 0 }; acc.set(k, r); }
        r.cells += 1;
        r.sx += (cx + nx + 1) * map.cellMm;
        r.sy += (cy + ny + 1) * map.cellMm;
      }
    }
  }
  
  return [...acc.keys()].sort().map((k) => {
    const r = acc.get(k);
    return {
      a: r.a,
      b: r.b,
      cells: r.cells,
      xMm: Math.trunc(r.sx / (2 * r.cells)),
      yMm: Math.trunc(r.sy / (2 * r.cells)),
    };
  });
}




















export function defensiveScores(map) {
  const n = map.cellsPerSide;
  const cells = map.sectorOfCell;
  const count = map.sectors.length;
  const tierSum = new Array(count).fill(0);
  const area = new Array(count).fill(0);
  const openEdges = new Array(count).fill(0);
  for (let cy = 0; cy < n; cy += 1) {
    for (let cx = 0; cx < n; cx += 1) {
      const s = cells[cy * n + cx];
      area[s] += 1;
      tierSum[s] += tierOfDm(map.heightOfCell ? map.heightOfCell[cy * n + cx] : 0);
      const look = (ix, iy) => {
        if (ix < 0 || iy < 0 || ix >= n || iy >= n) return;      
        if (cells[iy * n + ix] === s) return;                    
        if (isCliffStep(map, cx, cy, ix, iy)) return;            
        openEdges[s] += 1;
      };
      look(cx - 1, cy);
      look(cx + 1, cy);
      look(cx, cy - 1);
      look(cx, cy + 1);
    }
  }
  return map.sectors.map((sec, s) => {
    
    const height = Math.trunc((tierSum[s] * 100) / (area[s] * 2));
    
    
    
    
    const exposure = Math.trunc((openEdges[s] * openEdges[s] * 100) / (16 * Math.max(1, area[s])));
    const narrow = exposure >= 100 ? 0 : 100 - exposure;
    return { sector: s, height, narrow, score: Math.trunc((height * 40 + narrow * 60) / 100) };
  });
}
