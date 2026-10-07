













import { T } from './mapgen.js';
import { rowsOf } from './manifests.js';

export const BEDS = 4, ROAM_MIN = 6, LANE = 3, GAP = 3, BED_SIZE = 12;

const OPEN = new Set([T.GRASS, T.SAND, T.ROCK, T.JUNGLE, T.REEF, T.GLADE, T.RUIN]);
const LANE_OF = { [T.TALL]: T.GRASS, [T.KELP]: T.REEF, [T.THICKET]: T.GLADE, [T.MOSS]: T.ROCK };

const key = (i, j) => i + ',' + j;
function floodPatches(set) {
  const seen = new Set(), out = [];
  for (const k of set) {
    if (seen.has(k)) continue;
    const st = [k], all = [k]; seen.add(k);
    while (st.length) {
      const [i, j] = st.pop().split(',').map(Number);
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = key(i + a, j + b); if (set.has(q) && !seen.has(q)) { seen.add(q); st.push(q); all.push(q); } }
    }
    out.push(all);
  }
  return out;
}
const roamable = (patches) => patches.filter((p) => p.length >= ROAM_MIN).length;


function keepClear(W, id) {
  const pts = [];
  for (const d of rowsOf('doors')) { if (d.region === id && d.at) pts.push(d.at); if (d.to === id && d.toAt) pts.push(d.toAt); }
  for (const p of rowsOf('perches')) if (p.region === id && p.at) pts.push(p.at);
  for (const s of W.spots || []) pts.push(s);
  return pts;
}


export function shapeGrassBeds(W, id, towns = []) {
  const N = W.N, report = [], clear = keepClear(W, id);
  const wildKeys = new Map(); 
  for (const [x, y] of W.wildTiles) {
    const s = W.sectionAt(x, y);
    if (!s || towns.includes(s)) continue;
    if (!wildKeys.has(s)) wildKeys.set(s, new Set());
    wildKeys.get(s).add(key(Math.floor(x), Math.floor(y)));
  }
  const removed = new Set(), added = [];
  for (const [sec, set] of wildKeys) {
    const before = roamable(floodPatches(set));
    let cut = 0, seeded = 0;
    
    const count = new Map();
    for (const k of set) { const [i, j] = k.split(',').map(Number), t = W.type[W.idx(i, j)]; count.set(t, (count.get(t) || 0) + 1); }
    const wildT = [...count].sort((a, b) => b[1] - a[1])[0][0];
    
    for (let guard = 0; guard < 12 && roamable(floodPatches(set)) < BEDS; guard++) {
      let best = null;
      
      for (const big of floodPatches(set).sort((a, b) => b.length - a.length)) {
        if (best || big.length < 2 * ROAM_MIN + LANE * 2) break;
        const tiles = big.map((k) => k.split(',').map(Number));
        for (const ax of [0, 1]) {
          const lo = Math.min(...tiles.map((t) => t[ax])), hi = Math.max(...tiles.map((t) => t[ax]));
          for (let c = lo + 1; c + LANE - 1 < hi; c++) {
            const lane = tiles.filter((t) => t[ax] >= c && t[ax] < c + LANE);
            const rest = new Set(big.filter((k, n) => !(tiles[n][ax] >= c && tiles[n][ax] < c + LANE)));
            const good = floodPatches(rest).filter((p) => p.length >= ROAM_MIN);
            if (good.length < 2) continue;
            const score = Math.min(...good.map((p) => p.length)) * 100 - lane.length;
            if (!best || score > best.score) best = { score, lane };
          }
        }
      }
      if (!best) break;
      for (const [i, j] of best.lane) {
        const k = key(i, j), around = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => W.type[W.idx(i + a, j + b)]).filter((t) => OPEN.has(t));
        W.type[W.idx(i, j)] = around.length ? around[0] : LANE_OF[wildT] ?? T.GRASS;
        set.delete(k); removed.add(k);
      }
      cut++;
    }
    
    const ground = new Set();
    for (const k of set) { const [i, j] = k.split(',').map(Number); for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const t = W.type[W.idx(i + a, j + b)]; if (OPEN.has(t)) ground.add(t); } }
    if (!ground.size) ground.add(LANE_OF[wildT] ?? T.GRASS);
    const ok = (i, j) => i > 0 && j > 0 && i < N - 1 && j < N - 1 && W.sectionAt(i + 0.5, j + 0.5) === sec && W.reach[W.idx(i, j)] &&
      ground.has(W.type[W.idx(i, j)]) && W.walkable(i + 0.5, j + 0.5, 0.3) && clear.every((p) => Math.hypot(p.x - i - 0.5, p.y - j - 0.5) > 2.6);
    const distToGrass = (i, j) => { let m = Infinity; for (const k of set) { const [a, b] = k.split(',').map(Number); m = Math.min(m, Math.max(Math.abs(a - i), Math.abs(b - j))); } return m; };
    for (let guard = 0; guard < 8 && roamable(floodPatches(set)) < BEDS; guard++) {
      
      let seed = null, far = GAP;
      for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) {
        if (!ok(i, j)) continue;
        const d = distToGrass(i, j);
        if (d > far) { far = d; seed = [i, j]; }
      }
      if (!seed) break;
      
      const bed = [], q = [seed], seen = new Set([key(...seed)]);
      while (q.length && bed.length < BED_SIZE) {
        q.sort((a, b) => Math.hypot(a[0] - seed[0], a[1] - seed[1]) - Math.hypot(b[0] - seed[0], b[1] - seed[1]));
        const [i, j] = q.shift();
        if (!ok(i, j) || distToGrass(i, j) <= GAP) continue;
        bed.push([i, j]);
        for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = key(i + a, j + b); if (!seen.has(k)) { seen.add(k); q.push([i + a, j + b]); } }
      }
      if (bed.length < ROAM_MIN + 2) { 
        for (const [i, j] of bed.length ? bed : [seed]) clear.push({ x: i + 0.5, y: j + 0.5 });
        continue;
      }
      for (const [i, j] of bed) { W.type[W.idx(i, j)] = wildT; set.add(key(i, j)); added.push([i + 0.5, j + 0.5]); }
      seeded++;
    }
    report.push({ sec, before, after: roamable(floodPatches(set)), cut, seeded });
  }
  W.wildTiles = W.wildTiles.filter(([x, y]) => !removed.has(key(Math.floor(x), Math.floor(y)))).concat(added);
  return report;
}
