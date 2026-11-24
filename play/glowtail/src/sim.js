















import { DEPTHS, CLASSIC, GENTLE_FACTOR, HUMAN_FLOOR_MS } from './depths.js';
import * as Cube from './cube.js';

export const W = 17;
export const H = 17;
export const QUEUE_MAX = 3;
export const JELLY_EVERY = 3; 
export const NEAR_MISS_GAP = 8; 


export const FLINCH_GAP = 6; 
export const APPROACH_CELLS = 3; 

export const APPROACH_SLOW = Object.freeze([1.9, 1.5, 1.2, 1]);
export const JELLY_BAND = 2; 

export const DIRS = Object.freeze({
  up: Object.freeze({ x: 0, y: -1 }), down: Object.freeze({ x: 0, y: 1 }),
  left: Object.freeze({ x: -1, y: 0 }), right: Object.freeze({ x: 1, y: 0 }),
});
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


export const sameCell = (a, b) => a.x === b.x && a.y === b.y && (a.z ?? 0) === (b.z ?? 0);

const pos = (c) => (c.z === undefined ? { x: c.x, y: c.y } : { x: c.x, y: c.y, z: c.z });


function adjacency(size, neighborsOf) {
  const adj = new Int32Array(size * 4).fill(-1);
  for (let k = 0; k < size; k++) neighborsOf(k).forEach((n, i) => { adj[k * 4 + i] = n; });
  return adj;
}

function flatBoard(wrap) {
  const key = (c) => c.y * W + c.x;
  const cell = (k) => ({ x: k % W, y: (k / W) | 0 });
  const inside = (x, y) => x >= 0 && x < W && y >= 0 && y < H;
  return {
    cube: false, size: W * H, key, cell,
    next(c, frame, dir) {
      const d = DIRS[dir];
      let x = c.x + d.x, y = c.y + d.y;
      if (!inside(x, y)) {
        if (!wrap) return null;
        x = (x + W) % W; y = (y + H) % H;
      }
      return { cell: { x, y }, frame, crossed: false };
    },
    
    raw: (c, frame, dir) => ({ x: c.x + DIRS[dir].x, y: c.y + DIRS[dir].y }),
    adj: adjacency(W * H, (k) => {
      const { x, y } = cell(k);
      const out = [];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let nx = x + dx, ny = y + dy;
        if (!inside(nx, ny)) {
          if (!wrap) continue;
          nx = (nx + W) % W; ny = (ny + H) % H;
        }
        out.push(key({ x: nx, y: ny }));
      }
      return out;
    }),
    distFrom: (h) => (c) => Math.abs(c.x - h.x) + Math.abs(c.y - h.y),
    inset: (c) => Math.min(c.x, c.y, W - 1 - c.x, H - 1 - c.y),
    jellyDirs: () => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ dx, dy })),
    jellyNext: (j) => (inside(j.x + j.dx, j.y + j.dy) ? { x: j.x + j.dx, y: j.y + j.dy } : null),
    keepOut: () => () => false,
  };
}

const CUBE_BOARD = {
  cube: true, size: Cube.CELLS, key: Cube.cellKey, cell: Cube.cellAt,
  next: (c, frame, dir) => Cube.move(c, frame, dir),
  raw: (c, frame, dir) => Cube.move(c, frame, dir).cell,
  adj: adjacency(Cube.CELLS, Cube.neighbors),
  distFrom(h) { const d = Cube.distances(h); return (c) => d[Cube.cellKey(c)]; },
  inset: Cube.inset,
  jellyDirs: (c) => Cube.faceDirs(c).map((d) => ({ dx: d.x, dy: d.y, dz: d.z })),
  
  jellyNext(j) { const p = Cube.vec(j.x + j.dx, j.y + j.dy, j.z + j.dz); return Cube.isCell(p) ? p : null; },
  keepOut: (head, band) => Cube.keepOut(head, band),
};

const BOARDS = { wall: flatBoard(false), wrap: flatBoard(true), cube: CUBE_BOARD };

export const boardOf = (state) => BOARDS[state.depth.edges];

export const cellKey = (state, c) => boardOf(state).key(c);

export const nextCell = (state, c, dir, frame = state.frame) => boardOf(state).next(c, frame, dir);


function placeEel(state, length) {
  if (boardOf(state).cube) {
    state.snake = Cube.startBody(length);
    state.frame = Cube.START_FRAME;
    state.dir = 'up';
  }
  state.prevSnake = state.snake.map((c) => ({ ...c }));
}




export function createState({ mode = 'dive', depth = 0, seed = 1, gentle = false, hard = false, spawn = true } = {}) {
  const cy = Math.floor(H / 2);
  const state = {
    mode, gentle, hard,
    lastFlinch: -FLINCH_GAP,
    depthIndex: mode === 'classic' ? 0 : Math.max(0, Math.min(DEPTHS.length - 1, depth)),
    depth: null,
    snake: [{ x: 6, y: cy }, { x: 5, y: cy }, { x: 4, y: cy }, { x: 3, y: cy }],
    prevSnake: null,
    frame: null, 
    dir: 'right', queue: [], grow: 0,
    motes: [], jellies: [], nextId: 1,
    score: 0, eatenInDepth: 0, eatenTotal: 0, bitesSinceShoal: 0, bestChain: 0,
    phase: 'play', tick: 0, events: [], shoalsSeen: 0,
    rand: rng(seed),
    
    
    
    moteRand: rng((seed ^ 0x9e3779b9) >>> 0),
    lastNearMiss: -NEAR_MISS_GAP,
  };
  state.depth = mode === 'classic' ? CLASSIC : DEPTHS[state.depthIndex];
  placeEel(state, state.snake.length);
  if (spawn) {
    spawnJellies(state);
    spawnMote(state, boardOf(state).cube ? Cube.FIRST_MOTE : null);
  }
  return state;
}


export function enqueue(state, dir) {
  if (!DIRS[dir]) return false;
  const last = state.queue.length ? state.queue[state.queue.length - 1] : state.dir;
  if (dir === last || dir === OPPOSITE[last]) return false;
  if (state.queue.length >= QUEUE_MAX) return false;
  state.queue.push(dir);
  return true;
}


export function tickMs(state) {
  const d = state.depth;
  const ms = Math.max(d.minTickMs, d.tickMs - d.rampMs * state.eatenInDepth);
  const base = Math.max(HUMAN_FLOOR_MS, ms) * (state.gentle ? GENTLE_FACTOR : 1);
  
  
  return state.hard ? base : base * APPROACH_SLOW[clearAhead(state)];
}

function bodySet(state, skipTail) {
  const B = boardOf(state);
  const s = new Set();
  const n = skipTail ? state.snake.length - 1 : state.snake.length;
  for (let i = 0; i < n; i++) s.add(B.key(state.snake[i]));
  return s;
}


export function step(state) {
  state.events = [];
  if (state.phase !== 'play') return state.events;
  const B = boardOf(state);
  state.tick++;
  state.prevSnake = state.snake.map((c) => ({ ...c }));
  const wasDir = state.dir;
  const head = state.snake[0];
  
  
  
  
  if (!state.hard) {
    const pending = state.queue.length > 0;
    const want = pending ? state.queue[0] : state.dir;
    const hit = hazard(state, head, want);
    if (hit && state.tick - state.lastFlinch >= FLINCH_GAP) {
      if (pending) state.dir = state.queue.shift();
      state.lastFlinch = state.tick;
      state.events.push({ type: 'flinch', ...pos(hit), cause: hit.cause });
      if (state.tick % JELLY_EVERY === 0) moveJellies(state);
      return state.events;
    }
    if (hit && !pending) {
      const safe = safestTurn(state, head);
      if (safe) { state.dir = safe; state.events.push({ type: 'saved', dir: safe }); }
    }
  }
  if (state.queue.length) state.dir = state.queue.shift();
  
  
  
  const straight = state.dir !== wasDir ? B.next(head, state.frame, wasDir)?.cell ?? null : null;
  const dodged = straight && (bodySet(state, state.grow <= 0).has(B.key(straight)) ? 'body'
    : state.jellies.some((j) => sameCell(j, straight)) ? 'jelly' : null);
  const mv = B.next(head, state.frame, state.dir);
  if (!mv) return die(state, 'wall', B.raw(head, state.frame, state.dir));
  const next = mv.cell;
  const growing = state.grow > 0;
  if (bodySet(state, !growing).has(B.key(next))) return die(state, 'body', next);
  if (state.jellies.some((j) => sameCell(j, next))) return die(state, 'jelly', next);

  state.snake.unshift(next);
  if (growing) state.grow--;
  else state.snake.pop();
  if (mv.crossed) {
    
    state.frame = mv.frame;
    state.events.push({ type: 'roll', from: mv.from, to: mv.to });
  }
  if (dodged && state.tick - state.lastNearMiss >= NEAR_MISS_GAP) {
    state.lastNearMiss = state.tick;
    state.events.push({ type: 'nearMiss', ...pos(straight), cause: dodged });
  }

  const mi = state.motes.findIndex((m) => sameCell(m, next));
  if (mi >= 0) {
    const m = state.motes.splice(mi, 1)[0];
    state.grow += 1;
    const pts = 10 * (state.depthIndex + 1);
    state.score += pts;
    countBite(state, 1);
    state.events.push({ type: 'bite', ...pos(m), kind: m.kind, points: pts, streak: state.eatenInDepth });
  }

  encircle(state);
  if (state.tick % JELLY_EVERY === 0) moveJellies(state);
  if (checkQuota(state)) return state.events;

  if (!state.motes.some((m) => m.kind === 'mote')) spawnMote(state);
  if (state.bitesSinceShoal >= state.depth.shoalEvery && !state.motes.some((m) => m.kind === 'shoal')) {
    state.bitesSinceShoal = 0;
    spawnShoal(state);
  }
  return state.events;
}


function hazard(state, from, dir, frame = state.frame) {
  const B = boardOf(state);
  const mv = B.next(from, frame, dir);
  if (!mv) return { cause: 'wall', ...B.raw(from, frame, dir) };
  const next = mv.cell;
  if (bodySet(state, state.grow <= 0).has(B.key(next))) return { cause: 'body', ...next };
  if (state.jellies.some((j) => sameCell(j, next))) return { cause: 'jelly', ...next };
  return null;
}


function safestTurn(state, head) {
  const B = boardOf(state);
  const { regionOf, sizes } = regions(state);
  let best = null, bestSize = -1;
  for (const dir of Object.keys(DIRS)) {
    if (dir === state.dir || dir === OPPOSITE[state.dir] || hazard(state, head, dir)) continue;
    const c = B.next(head, state.frame, dir).cell;
    const r = regionOf[B.key(c)];
    const size = r >= 0 ? sizes[r] : 1; 
    if (size > bestSize) { best = dir; bestSize = size; }
  }
  return best;
}


export function clearAhead(state, max = APPROACH_CELLS) {
  const B = boardOf(state);
  const dir = state.queue.length ? state.queue[0] : state.dir;
  let at = state.snake[0], frame = state.frame;
  for (let n = 0; n < max; n++) {
    if (hazard(state, at, dir, frame)) return n;
    const mv = B.next(at, frame, dir);
    at = mv.cell; frame = mv.frame;
  }
  return max;
}

function countBite(state, n) {
  state.eatenInDepth += n;
  state.eatenTotal += n;
  state.bitesSinceShoal += n;
}

function die(state, cause, at) {
  state.phase = 'dead';
  state.events.push({ type: 'death', cause, ...pos(at) });
  return state.events;
}

function checkQuota(state) {
  if (state.mode === 'classic' || state.eatenInDepth < state.depth.quota) return false;
  if (state.depthIndex >= DEPTHS.length - 1) {
    state.phase = 'won';
    state.score += 1000;
    state.events.push({ type: 'surface', points: 1000 });
  } else {
    state.phase = 'descend';
    state.events.push({ type: 'descend', from: state.depthIndex, to: state.depthIndex + 1 });
  }
  return true;
}


export function enterNextDepth(state) {
  if (state.phase !== 'descend') return;
  state.depthIndex++;
  state.depth = DEPTHS[state.depthIndex];
  state.eatenInDepth = 0;
  state.bitesSinceShoal = 0;
  state.motes = [];
  state.queue = [];
  state.phase = 'play';
  placeEel(state, state.snake.length);
  spawnJellies(state);
  spawnMote(state, boardOf(state).cube ? Cube.FIRST_MOTE : null);
}


export function regions(state) {
  const B = boardOf(state);
  const regionOf = new Int16Array(B.size).fill(-2);
  for (const c of state.snake) regionOf[B.key(c)] = -1;
  const sizes = [];
  const stack = [];
  for (let start = 0; start < B.size; start++) {
    if (regionOf[start] !== -2) continue;
    const id = sizes.length;
    let size = 0;
    regionOf[start] = id;
    stack.push(start);
    while (stack.length) {
      const k = stack.pop();
      size++;
      for (let i = 0; i < 4; i++) {
        const nk = B.adj[k * 4 + i];
        if (nk >= 0 && regionOf[nk] === -2) { regionOf[nk] = id; stack.push(nk); }
      }
    }
    sizes.push(size);
  }
  return { regionOf, sizes };
}

function openRegion(sizes) {
  let best = 0;
  for (let i = 1; i < sizes.length; i++) if (sizes[i] > sizes[best]) best = i;
  return best;
}

function encircle(state) {
  if (!state.motes.length) return;
  const B = boardOf(state);
  const { regionOf, sizes } = regions(state);
  if (sizes.length < 2) return;
  const open = openRegion(sizes);
  const caught = state.motes.filter((m) => regionOf[B.key(m)] !== open);
  if (!caught.length) return;
  state.motes = state.motes.filter((m) => regionOf[B.key(m)] === open);
  const n = caught.length;
  const pts = 25 * n * n * (state.depthIndex + 1);
  state.score += pts;
  state.grow += Math.ceil(n / 2);
  state.bestChain = Math.max(state.bestChain, n);
  countBite(state, n);
  const regionIds = new Set(caught.map((m) => regionOf[B.key(m)]));
  const cells = [];
  for (let k = 0; k < B.size; k++) if (regionIds.has(regionOf[k])) cells.push(B.cell(k));
  state.events.push({ type: 'encircle', count: n, points: pts, motes: caught.map((m) => ({ ...pos(m), kind: m.kind })), cells });
}





function spawnCells(state, minHeadDist, band = 0) {
  const B = boardOf(state);
  const { regionOf, sizes } = regions(state);
  const open = openRegion(sizes);
  const head = state.snake[0];
  const dist = B.distFrom(head);
  const hidden = B.keepOut(head, band);
  const taken = new Set([...state.motes, ...state.jellies].map((o) => B.key(o)));
  const out = [];
  for (let k = 0; k < B.size; k++) {
    if (regionOf[k] !== open || taken.has(k)) continue;
    const c = B.cell(k);
    if (dist(c) < minHeadDist || hidden(c)) continue;
    out.push(c);
  }
  return out;
}

function spawnMote(state, prefer = null) {
  const B = boardOf(state);
  const cells = spawnCells(state, 2);
  if (!cells.length) return null;
  const fair = new Set(cells.map((c) => B.key(c)));
  let c = prefer && fair.has(B.key(prefer)) ? pos(prefer) : null;
  for (let tries = 0; tries < 256 && !c; tries++) {
    const k = Math.floor(state.moteRand() * B.size);
    if (fair.has(k)) c = B.cell(k);
  }
  if (!c) c = cells[Math.floor(state.rand() * cells.length)]; 
  const m = { id: state.nextId++, ...pos(c), kind: 'mote' };
  state.motes.push(m);
  state.events.push({ type: 'spawn', ...pos(m), kind: m.kind });
  return m;
}

function spawnShoal(state) {
  const B = boardOf(state);
  const cells = spawnCells(state, 4).filter((c) => B.inset(c) >= 2);
  if (!cells.length) return [];
  const centre = cells[Math.floor(state.rand() * cells.length)];
  
  const near = cells.filter((c) => Math.abs(c.x - centre.x) <= 1 && Math.abs(c.y - centre.y) <= 1
    && Math.abs((c.z ?? 0) - (centre.z ?? 0)) <= 1);
  const want = 4 + Math.floor(state.rand() * 3); 
  const picked = [];
  while (near.length && picked.length < want) picked.push(near.splice(Math.floor(state.rand() * near.length), 1)[0]);
  const shoal = picked.map((c) => ({ id: state.nextId++, ...pos(c), kind: 'shoal' }));
  state.motes.push(...shoal);
  state.shoalsSeen++;
  state.events.push({ type: 'shoal', centre, count: shoal.length, first: state.shoalsSeen === 1 });
  return shoal;
}

function spawnJellies(state) {
  const B = boardOf(state);
  state.jellies = [];
  for (let i = 0; i < state.depth.jellies; i++) {
    const cells = spawnCells(state, 5, JELLY_BAND);
    if (!cells.length) break;
    const c = cells[Math.floor(state.rand() * cells.length)];
    const dirs = B.jellyDirs(c);
    const d = dirs[Math.floor(state.rand() * 4)];
    state.jellies.push({ id: state.nextId++, ...pos(c), ...d });
  }
}

function moveJellies(state) {
  if (!state.jellies.length) return;
  const B = boardOf(state);
  const head = state.snake[0];
  const ahead = B.raw(head, state.frame, state.queue[0] || state.dir);
  const body = bodySet(state, false);
  const band = B.keepOut(head, JELLY_BAND);
  const blocked = (j) => {
    const c = B.jellyNext(j);
    if (!c) return true;
    
    if (band(c) && !band(j)) return true;
    return body.has(B.key(c)) || sameCell(c, ahead) || state.motes.some((m) => sameCell(m, c))
      || state.jellies.some((o) => o !== j && sameCell(o, c));
  };
  for (const j of state.jellies) {
    if (blocked(j)) { j.dx = -j.dx || 0; j.dy = -j.dy || 0; if (j.dz !== undefined) j.dz = -j.dz || 0; }
    if (!blocked(j)) { const c = B.jellyNext(j); j.x = c.x; j.y = c.y; if (c.z !== undefined) j.z = c.z; }
  }
}
