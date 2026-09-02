


























import { insideLevel } from './level.js';

export const GATES = Object.freeze({
  ductsPerLongRun: [2, 3],   
  breachesPerDeck: [1, 2],
  minFromStart: 8,           
  minSpacing: 6,             
  wallInset: 0.06,           
});


function h(seed, a, b) {
  const s = Math.sin(seed * 374761.393 + a * 668265.263 + b * 951274.213) * 43758.5453;
  return s - Math.floor(s);
}







export function gatesFor(deck, seed, { act = 1 } = {}) {
  const out = [];
  const longRuns = deck.runs.filter((r) => (r.axis === 'z'
    ? r.z1 - r.z0 : Math.abs(r.x1 - r.x0)) > 10);

  const tooClose = (x, z) => out.some((g) => Math.hypot(g.x - x, g.z - z) < GATES.minSpacing)
    || Math.hypot(x - deck.start.x, z - deck.start.z) < GATES.minFromStart;

  
  const wallPoint = (run, t, side) => {
    if (run.axis === 'z') {
      const z = run.z0 + (run.z1 - run.z0) * t;
      const x = run.x0 + side * 1.6;
      return { x, z, nx: -side, nz: 0 };
    }
    const x = run.x0 + (run.x1 - run.x0) * t;
    const z = run.z0 + side * 1.6;
    return { x, z, nx: 0, nz: -side };
  };

  
  const legal = (p) => !insideLevel(deck, p.x - p.nx * 0.2, p.z - p.nz * 0.2, 0.05)
    && insideLevel(deck, p.x + p.nx * 0.8, p.z + p.nz * 0.8, 0.3);

  
  
  
  
  
  

  
  if (act >= 3 && deck.runs.length > 2) {
    const ri = 1 + Math.floor(h(seed, 5, 5) * (deck.runs.length - 2));
    const run = deck.runs[ri];
    const p = run.axis === 'z'
      ? { x: run.x0, z: run.z0 + 1.5, nx: 0, nz: 1 }
      : { x: run.x0 + 1.5, z: run.z0, nx: 1, nz: 0 };
    if (!tooClose(p.x, p.z) && insideLevel(deck, p.x, p.z, 0.3)) {
      out.push({ ...p, kind: 'drop', run: ri });
    }
  }

  
  
  
  
  
  {
    const [lo, hi] = GATES.breachesPerDeck;
    const want = lo + Math.floor(h(seed, 99, 2) * (hi - lo + 1));
    let placed = 0;
    
    
    
    
    for (let attempt = 0; attempt < 60 && placed < want; attempt += 1) {
      const ri = Math.floor(h(seed, 7, attempt) * longRuns.length);
      const run = longRuns[ri];
      if (!run) continue;
      const t = 0.2 + h(seed, 60 + attempt, 3) * 0.6;
      const side = h(seed, 80 + attempt, 5) < 0.5 ? -1 : 1;
      const p = wallPoint(run, t, side);
      if (tooClose(p.x, p.z) || !legal(p)) continue;
      out.push({ ...p, kind: 'breach', run: deck.runs.indexOf(run) });
      placed += 1;
    }

  longRuns.forEach((run, ri) => {
    const [lo, hi] = GATES.ductsPerLongRun;
    const want = lo + Math.floor(h(seed, ri, 1) * (hi - lo + 1));
    let placed = 0;
    for (let attempt = 0; attempt < 12 && placed < want; attempt += 1) {
      const t = 0.15 + h(seed, ri, 10 + attempt) * 0.7;
      const side = h(seed, ri, 40 + attempt) < 0.5 ? -1 : 1;
      const p = wallPoint(run, t, side);
      if (tooClose(p.x, p.z) || !legal(p)) continue;
      out.push({ ...p, kind: 'duct', run: ri });
      placed += 1;
    }
  });

  }

  return out;
}
