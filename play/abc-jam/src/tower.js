



















import { LETTERS, DINOS } from './content.js';
import { hintFor } from './rules.js';

export const POINTS = Object.freeze({ block: 10, row: 50, tower: 200 });
export const TOWER_SAVE_KEY = 'abcjam-tower-v1';
export const BOMB_CHANCE = 0.2; 
export const CORE_SPAN = 3; 
const CORE_TURN = 0.4; 
export const FLOOR_H = 4; 
export const MAX_FLOORS = 8;
const SAFE_FLOORS = 2; 
const STEP = 0.5; 

const norm = (ch) => String(ch ?? '').toUpperCase();
const isLetter = (ch) => /^[A-Z]$/.test(norm(ch));


export const levelKind = (level) => (level % 2 === 0 ? 'dinos' : 'letters');

const shuffle = (list, rand) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const letterBlock = (ch) => ({ kind: 'letter', ch, id: ch });
const dinoBlock = (d) => ({ kind: 'dino', ch: d.ch, id: d.id });
const BOMB = Object.freeze({ kind: 'bomb', ch: null, id: 'bomb' });





export function growCore(height, rand = Math.random) {
  const rows = [];
  let w = rand() < 0.5 ? 2 : 3;
  let x0 = Math.floor(rand() * (CORE_SPAN - w + 1));
  for (let y = 0; y < height; y++) {
    if (y > 0 && rand() < CORE_TURN) {
      const px0 = x0;
      const px1 = x0 + w;
      const options = [];
      for (let nw = 1; nw <= CORE_SPAN; nw++) {
        for (let nx = 0; nx + nw <= CORE_SPAN; nx++) {
          if (Math.max(nx, px0) < Math.min(nx + nw, px1) && !(nx === px0 && nw === w)) options.push([nx, nw]);
        }
      }
      [x0, w] = options[Math.floor(rand() * options.length)];
    }
    rows.push({ x0, x1: x0 + w });
  }
  return rows;
}


const rowsAt = (core, y) => core.slice(Math.floor(y), Math.ceil(y + 1));


function slots(f, core) {
  const out = [];
  const y0 = f * FLOOR_H;
  for (let y = y0; y + 1 <= y0 + FLOOR_H + 1e-9; y += STEP) {
    const rows = rowsAt(core, y);
    const lo = Math.max(...rows.map((r) => r.x0));
    const hi = Math.min(...rows.map((r) => r.x1));
    out.push([Math.min(...rows.map((r) => r.x0)) - 1, y], [Math.max(...rows.map((r) => r.x1)), y]);
    for (let x = lo; x + 1 <= hi + 1e-9; x += STEP) out.push([x, y]); 
  }
  return out;
}


function sideOf(x, y, core) {
  const rows = rowsAt(core, y);
  if (x + 1 <= Math.min(...rows.map((r) => r.x0)) + 1e-9) return 'left';
  if (x >= Math.max(...rows.map((r) => r.x1)) - 1e-9) return 'right';
  return 'front';
}

const overlaps = (a, b) => Math.abs(a.x - b.x) < 1 - 1e-9 && Math.abs(a.y - b.y) < 1 - 1e-9;


function stick(blocks, f, core, rand) {
  const placed = [];
  const free = shuffle(slots(f, core), rand);
  for (const b of blocks) {
    const at = free.find(([x, y]) => !placed.some((p) => overlaps(p, { x, y })));
    if (!at) break; 
    placed.push({ ...b, x: at[0], y: at[1], side: sideOf(at[0], at[1], core) });
  }
  return placed;
}


function takeFloor(pool, count) {
  const out = [];
  for (let i = 0; i < pool.length && out.length < count;) {
    if (out.some((b) => b.ch === pool[i].ch)) { i++; continue; }
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}


function floorSizes(level) {
  if (level === 1) return [5, 5, 4, 4, 4, 4]; 
  const floors = Math.min(MAX_FLOORS, 2 + Math.ceil(level / 2));
  const per = level <= 4 ? 4 : 5;
  return Array.from({ length: floors }, () => per);
}


export function buildTower(level, { rand = Math.random } = {}) {
  level = Math.max(1, Math.floor(level) || 1);
  const kind = levelKind(level);
  const sizes = floorSizes(level);
  let pool;
  if (level === 1) pool = LETTERS.map((l) => letterBlock(l.ch)); 
  else {
    const want = sizes.reduce((a, b) => a + b, 0);
    const source = kind === 'dinos' ? DINOS.map(dinoBlock) : LETTERS.map((l) => letterBlock(l.ch));
    pool = [];
    while (pool.length < want) pool.push(...shuffle(source, rand));
    pool = pool.slice(0, want);
  }
  const core = growCore(sizes.length * FLOOR_H, rand);
  const floors = [];
  for (let f = 0; f < sizes.length && pool.length; f++) {
    const blocks = level === 1 ? pool.splice(0, sizes[f]) : takeFloor(pool, sizes[f]);
    if (!blocks.length) break;
    const bombOk = !(level === 1 && f < SAFE_FLOORS);
    if (bombOk && rand() < Math.min(0.9, BOMB_CHANCE * blocks.length)) blocks.push({ ...BOMB });
    floors.push(stick(blocks, f, core, rand));
  }
  return { floors, core: core.slice(0, floors.length * FLOOR_H) };
}


export function createTower(level, opts = {}) {
  const built = buildTower(level, opts);
  const core = built.core;
  const floors = built.floors.map((fl) => fl.map((c) => ({ ...c, gone: false })));
  let floorIndex = 0;
  let misses = 0;
  const live = () => (floors[floorIndex] || []).filter((c) => c.kind !== 'bomb' && !c.gone);

  function pop(i) {
    const floor = floors[floorIndex];
    const c = floor[i];
    c.gone = true;
    misses = 0;
    const r = { kind: 'right', index: i, floor: floorIndex, ch: c.ch, id: c.id, block: c.kind, points: POINTS.block };
    if (!live().length) {
      r.floorDone = true;
      r.points += POINTS.row;
      r.fizzled = floor.map((b, j) => (b.kind === 'bomb' && !b.gone ? j : -1)).filter((j) => j >= 0);
      r.fizzled.forEach((j) => { floor[j].gone = true; });
      floorIndex += 1;
      if (floorIndex >= floors.length) {
        r.towerDone = true;
        r.points += POINTS.tower;
      }
    }
    return r;
  }

  return {
    get floors() { return floors; },
    get floorIndex() { return floorIndex; },
    get level() { return level; },
    get kind() { return levelKind(level); },
    get finished() { return floorIndex >= floors.length; },
    
    get height() { return core.length; },
    
    get core() { return core; },
    current() { return floors[floorIndex] || []; },
    
    press(ch) {
      if (floorIndex >= floors.length || !isLetter(ch)) return { kind: 'ignored' };
      const floor = floors[floorIndex];
      const i = floor.findIndex((c) => c.kind !== 'bomb' && !c.gone && c.ch === norm(ch));
      if (i >= 0) return pop(i);
      misses += 1;
      return { kind: 'wrong', want: live()[0]?.ch ?? null, hint: hintFor(misses), points: 0 };
    },
    
    tap(i, floor = floorIndex) {
      if (floorIndex >= floors.length || floor !== floorIndex) return { kind: 'ignored' };
      const c = floors[floorIndex][i];
      if (!c || c.gone) return { kind: 'ignored' };
      if (c.kind === 'bomb') {
        c.gone = true;
        return { kind: 'bomb', index: i, floor: floorIndex, points: 0 };
      }
      return pop(i);
    },
  };
}


export function createRun(storage) {
  let s = { level: 1, points: 0, best: 0 };
  try {
    const raw = storage?.getItem(TOWER_SAVE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      s = {
        level: Math.max(1, Math.floor(p.level) || 1),
        points: Math.max(0, Math.floor(p.points) || 0),
        best: Math.max(0, Math.floor(p.best) || 0),
      };
    }
  } catch {  }
  const save = () => { try { storage?.setItem(TOWER_SAVE_KEY, JSON.stringify(s)); } catch {  } };
  return {
    get level() { return s.level; },
    get points() { return s.points; },
    get best() { return s.best; },
    add(n) {
      s.points += Math.max(0, Math.floor(n) || 0);
      s.best = Math.max(s.best, s.points);
      save();
    },
    nextLevel() { s.level += 1; save(); },
    restart() { s = { level: 1, points: 0, best: s.best }; save(); },
  };
}
