


import { T, VOLC, PATH_POINTS, COAST_PATH, CORAL_PATH, VERDANT_PATH, npcSpotOk } from '../../features/world/mapgen.js';
import { classByte, regionByte } from './celRules.js';
import { PATH as TESTBED_PATH } from '../../features/world/regionMaps/testbed.js';
import { LANE as VILLAGE_LANE } from '../../features/world/regionMaps/kazanVillage.js';
import { PATH as EMBER_PATH } from '../../features/world/regionMaps/emberTube.js';



export const TILE_CLASS = {
  [T.DEEP]: 'deep', [T.SHALLOW]: 'shallow', [T.SAND]: 'sand', [T.GRASS]: 'grass', [T.TALL]: 'tall', [T.PATH]: 'grass',
  [T.ROCK]: 'rock', [T.LAVA]: 'lava', [T.PLAZA]: 'plaza', [T.WOOD]: 'wood', [T.CLIFF]: 'cliff', [T.JUNGLE]: 'jungle',
  [T.REEF]: 'reef', [T.KELP]: 'kelp', [T.RUIN]: 'ruin', [T.GLADE]: 'glade', [T.THICKET]: 'thicket', [T.MOSS]: 'moss',
};
export const MOUNTAIN = new Set(['kazan', 'slope']);
export function tileClass(t, section) {
  if (t === T.PATH && MOUNTAIN.has(section)) return 'rock';
  return TILE_CLASS[t] || 'grass';
}

export function classPage(W) {
  const N = W.N, out = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const sec = W.sectionAt(i + 0.5, j + 0.5), o = (j * N + i) * 4;
    out[o] = classByte(tileClass(W.type[W.idx(i, j)], sec)); out[o + 1] = regionByte(sec); out[o + 3] = 255;
  }
  return out;
}



export const CAM = [Math.SQRT1_2, Math.SQRT1_2]; 
export const RIGHT = [Math.SQRT1_2, -Math.SQRT1_2];


export const HUT_BAYS = [1.26, 2.52, -1.26, -2.52];
export const HUT_WALL = { r: 0.73, y0: 0.12, y1: 0.75, arc: 1.0 }; 
export const HUT_THATCH = 1.02; 
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));


export function bestBay(hut) {
  let best = null;
  for (const a of HUT_BAYS) {
    const w = wrap(a + (hut.rot || 0)), err = Math.abs(wrap(w - Math.PI / 4));
    if (!best || err < best.err) best = { angle: w, err };
  }
  return best;
}


export const MAX_TILT = 0.7;
export function roadText(dest, dx, dy, arrow = true) {
  const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  const right = ux * RIGHT[0] + uy * RIGHT[1], down = ux * CAM[0] + uy * CAM[1];
  const sign = right >= 0 ? 1 : -1;
  const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, Math.atan2(down * sign, Math.abs(right))));
  return { text: !arrow ? dest : sign > 0 ? dest + ' >' : '< ' + dest, dir: baseline(tilt) };
}

export function baseline(tilt) {
  const c = Math.cos(tilt), s = Math.sin(tilt);
  return [RIGHT[0] * c + CAM[0] * s, RIGHT[1] * c + CAM[1] * s];
}

export function along(pts, f) {
  const seg = [];
  let total = 0;
  for (let k = 0; k < pts.length - 1; k++) { const d = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]); seg.push(d); total += d; }
  let at = f * total;
  for (let k = 0; k < seg.length; k++) {
    if (at <= seg[k] || k === seg.length - 1) {
      const t = seg[k] ? Math.min(1, at / seg[k]) : 0, a = pts[k], b = pts[k + 1];
      return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, dx: b[0] - a[0], dy: b[1] - a[1] };
    }
    at -= seg[k];
  }
  return null;
}

function inSection(W, pts, sec) {
  const out = [];
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (W.sectionAt(m[0], m[1]) === sec) { if (!out.length) out.push(a); out.push(b); }
    else if (out.length) break;
  }
  return out;
}
const TRIES = [0.5, 0.35, 0.65, 0.2, 0.8];




function roadTag(W, pts, sec, dest, style, arrow = true, opt = {}) {
  const run = inSection(W, pts, sec);
  if (run.length < 2) return null;
  for (const f of TRIES) {
    const p = along(run, f);
    if (!p) continue;
    const l = Math.hypot(p.dx, p.dy) || 1, sides = opt.beside ? [1, -1] : [0];
    for (const side of sides) {
      const x = p.x - p.dy / l * side * (opt.beside || 0), y = p.y + p.dx / l * side * (opt.beside || 0);
      if (W.sectionAt(x, y) !== sec || !npcSpotOk(W, x, y, 0.3)) continue;
      if (opt.beside && !npcSpotOk(W, x + p.dx / l * (opt.w || 2) / 2, y + p.dy / l * (opt.w || 2) / 2, 0.2)) continue;
      if (opt.beside && !npcSpotOk(W, x - p.dx / l * (opt.w || 2) / 2, y - p.dy / l * (opt.w || 2) / 2, 0.2)) continue;
      const { text, dir } = roadText(dest, p.dx, p.dy, arrow);
      return { kind: 'ground', section: sec, text, style, x, y, dir, w: opt.w || 2.0, h: opt.h || 0.72 };
    }
  }
  return null;
}

function wallTag(W, sec, text, style) {
  let best = null;
  for (const o of W.objects) {
    if (o.kind !== 'hut' || W.sectionAt(o.x, o.y) !== sec) continue;
    const b = bestBay(o);
    if (!best || b.err < best.err) best = { ...b, o };
  }
  if (!best || best.err > 0.6) return null;
  const s = best.o.s || 1;
  return { kind: 'wall', section: sec, text, style, x: best.o.x, y: best.o.y, angle: best.angle, err: best.err,
    r: HUT_WALL.r * s, y0: HUT_WALL.y0 * s, y1: HUT_WALL.y1 * s, arc: HUT_WALL.arc };
}


function plazaTag(W, sec, text, style) {
  for (const r of [1.6, 2.0, 1.2]) for (const deg of [45, 60, 30, 75, 15, 90, 0]) {
    const a = deg * Math.PI / 180, x = VOLC.x + Math.sin(a) * r, y = VOLC.y + Math.cos(a) * r;
    if (W.sectionAt(x, y) !== sec || !npcSpotOk(W, x, y, 0.7) || W.objects.some((o) => o.kind === 'hut' && Math.hypot(o.x - x, o.y - y) < 1.8)) continue;
    return { kind: 'ground', section: sec, text, style, x, y, dir: baseline(-0.25), w: 2.2, h: 0.82 };
  }
  return null;
}



export function tagSpots(W) {
  const list = TAG_LISTS[W.region || HOME_REGION];
  return list ? list(W).filter(Boolean) : [];
}
const HOME_REGION = 'kazan-isle';
function kazanTags(W) {
  return [
    
    plazaTag(W, 'kazan', 'KAZAN 92', 'teal'),
    roadTag(W, PATH_POINTS, 'slope', 'SHRINE', 'arrow'),
    roadTag(W, PATH_POINTS, 'jungle', 'SHRINE', 'arrow'),
    roadTag(W, PATH_POINTS, 'road', 'SHRINE', 'arrow'),
    roadTag(W, COAST_PATH, 'coast', 'TOMO 92', 'teal', false),
    
    roadTag(W, CORAL_PATH, 'coral', 'DEEP', 'arrow'),
    roadTag(W, VERDANT_PATH, 'verdant', 'GROVE', 'arrow'),
  ];
}

const testbedTags = (W) => [
  roadTag(W, TESTBED_PATH, 'testbed-a', 'FAR FIELD', 'arrow'),
  roadTag(W, TESTBED_PATH, 'testbed-b', 'TESTBED 92', 'teal', false),
];


const villageTags = (W) => [
  wallTag(W, 'village', 'DACHI', 'pink'),
  roadTag(W, VILLAGE_LANE.slice().reverse(), 'village', 'SHRINE', 'arrow'),
];
const BESIDE = { beside: 1.35, w: 2.8, h: 1.05 }; 
const emberTags = (W) => [
  roadTag(W, EMBER_PATH, 'ember-a', 'MAGMA HALL', 'arrow', true, BESIDE),
  roadTag(W, EMBER_PATH, 'ember-b', 'EMBER 92', 'teal', false, BESIDE),
];

const shrineTags = (W) => [wallTag(W, 'shrine-village', 'DACHI', 'pink')];
const TAG_LISTS = { [HOME_REGION]: kazanTags, testbed: testbedTags, 'kazan-village': villageTags, 'ember-tube': emberTags, 'shrine-village': shrineTags };

export function tagCells(spots) {
  const keys = [];
  for (const s of spots) { const k = s.style + '|' + s.text; if (!keys.includes(k)) keys.push(k); }
  return keys;
}
