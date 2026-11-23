










import { DEPTHS, CLASSIC, GENTLE_FACTOR, HUMAN_FLOOR_MS } from './depths.js';

export const W = 17;
export const H = 17;
export const QUEUE_MAX = 3;
export const JELLY_EVERY = 3; 
export const NEAR_MISS_GAP = 8; 

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

const key = (x, y) => y * W + x;




export function createState({ mode = 'dive', depth = 0, seed = 1, gentle = false, spawn = true } = {}) {
  const cy = Math.floor(H / 2);
  const state = {
    mode, gentle,
    depthIndex: mode === 'classic' ? 0 : Math.max(0, Math.min(DEPTHS.length - 1, depth)),
    depth: null,
    snake: [{ x: 6, y: cy }, { x: 5, y: cy }, { x: 4, y: cy }, { x: 3, y: cy }],
    prevSnake: null,
    dir: 'right', queue: [], grow: 0,
    motes: [], jellies: [], nextId: 1,
    score: 0, eatenInDepth: 0, eatenTotal: 0, bitesSinceShoal: 0, bestChain: 0,
    phase: 'play', tick: 0, events: [], shoalsSeen: 0,
    rand: rng(seed),
    
    
    
    moteRand: rng((seed ^ 0x9e3779b9) >>> 0),
    lastNearMiss: -NEAR_MISS_GAP,
  };
  state.depth = mode === 'classic' ? CLASSIC : DEPTHS[state.depthIndex];
  state.prevSnake = state.snake.map((c) => ({ ...c }));
  if (spawn) {
    spawnJellies(state);
    spawnMote(state);
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
  return Math.max(HUMAN_FLOOR_MS, ms) * (state.gentle ? GENTLE_FACTOR : 1);
}

function wrapOrNull(state, x, y) {
  if (x >= 0 && x < W && y >= 0 && y < H) return { x, y };
  if (state.depth.edges !== 'wrap') return null;
  return { x: (x + W) % W, y: (y + H) % H };
}

function bodySet(snake, skipTail) {
  const s = new Set();
  const n = skipTail ? snake.length - 1 : snake.length;
  for (let i = 0; i < n; i++) s.add(key(snake[i].x, snake[i].y));
  return s;
}


export function step(state) {
  state.events = [];
  if (state.phase !== 'play') return state.events;
  state.tick++;
  state.prevSnake = state.snake.map((c) => ({ ...c }));
  const wasDir = state.dir;
  if (state.queue.length) state.dir = state.queue.shift();
  const d = DIRS[state.dir];
  const head = state.snake[0];
  
  
  
  const straight = state.dir !== wasDir
    ? wrapOrNull(state, head.x + DIRS[wasDir].x, head.y + DIRS[wasDir].y) : null;
  const dodged = straight && (bodySet(state.snake, state.grow <= 0).has(key(straight.x, straight.y)) ? 'body'
    : state.jellies.some((j) => j.x === straight.x && j.y === straight.y) ? 'jelly' : null);
  const next = wrapOrNull(state, head.x + d.x, head.y + d.y);
  if (!next) return die(state, 'wall', { x: head.x + d.x, y: head.y + d.y });
  const growing = state.grow > 0;
  if (bodySet(state.snake, !growing).has(key(next.x, next.y))) return die(state, 'body', next);
  if (state.jellies.some((j) => j.x === next.x && j.y === next.y)) return die(state, 'jelly', next);

  state.snake.unshift(next);
  if (growing) state.grow--;
  else state.snake.pop();
  if (dodged && state.tick - state.lastNearMiss >= NEAR_MISS_GAP) {
    state.lastNearMiss = state.tick;
    state.events.push({ type: 'nearMiss', x: straight.x, y: straight.y, cause: dodged });
  }

  const mi = state.motes.findIndex((m) => m.x === next.x && m.y === next.y);
  if (mi >= 0) {
    const m = state.motes.splice(mi, 1)[0];
    state.grow += 1;
    const pts = 10 * (state.depthIndex + 1);
    state.score += pts;
    countBite(state, 1);
    state.events.push({ type: 'bite', x: m.x, y: m.y, kind: m.kind, points: pts, streak: state.eatenInDepth });
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

function countBite(state, n) {
  state.eatenInDepth += n;
  state.eatenTotal += n;
  state.bitesSinceShoal += n;
}

function die(state, cause, at) {
  state.phase = 'dead';
  state.events.push({ type: 'death', cause, x: at.x, y: at.y });
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
  spawnJellies(state);
  spawnMote(state);
}


export function regions(state) {
  const regionOf = new Int16Array(W * H).fill(-2);
  for (const c of state.snake) regionOf[key(c.x, c.y)] = -1;
  const wrap = state.depth.edges === 'wrap';
  const sizes = [];
  const stack = [];
  for (let start = 0; start < W * H; start++) {
    if (regionOf[start] !== -2) continue;
    const id = sizes.length;
    let size = 0;
    regionOf[start] = id;
    stack.push(start);
    while (stack.length) {
      const k = stack.pop();
      size++;
      const x = k % W, y = (k / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) {
          if (!wrap) continue;
          nx = (nx + W) % W; ny = (ny + H) % H;
        }
        const nk = key(nx, ny);
        if (regionOf[nk] === -2) { regionOf[nk] = id; stack.push(nk); }
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
  const { regionOf, sizes } = regions(state);
  if (sizes.length < 2) return;
  const open = openRegion(sizes);
  const caught = state.motes.filter((m) => regionOf[key(m.x, m.y)] !== open);
  if (!caught.length) return;
  state.motes = state.motes.filter((m) => regionOf[key(m.x, m.y)] === open);
  const n = caught.length;
  const pts = 25 * n * n * (state.depthIndex + 1);
  state.score += pts;
  state.grow += Math.ceil(n / 2);
  state.bestChain = Math.max(state.bestChain, n);
  countBite(state, n);
  const regionIds = new Set(caught.map((m) => regionOf[key(m.x, m.y)]));
  const cells = [];
  for (let k = 0; k < W * H; k++) if (regionIds.has(regionOf[k])) cells.push({ x: k % W, y: (k / W) | 0 });
  state.events.push({ type: 'encircle', count: n, points: pts, motes: caught.map(({ x, y, kind }) => ({ x, y, kind })), cells });
}


function spawnCells(state, minHeadDist) {
  const { regionOf, sizes } = regions(state);
  const open = openRegion(sizes);
  const head = state.snake[0];
  const taken = new Set([...state.motes, ...state.jellies].map((o) => key(o.x, o.y)));
  const out = [];
  for (let k = 0; k < W * H; k++) {
    if (regionOf[k] !== open || taken.has(k)) continue;
    const x = k % W, y = (k / W) | 0;
    if (Math.abs(x - head.x) + Math.abs(y - head.y) < minHeadDist) continue;
    out.push({ x, y });
  }
  return out;
}

function spawnMote(state) {
  const cells = spawnCells(state, 2);
  if (!cells.length) return null;
  const fair = new Set(cells.map((c) => key(c.x, c.y)));
  let c = null;
  for (let tries = 0; tries < 256 && !c; tries++) {
    const k = Math.floor(state.moteRand() * W * H);
    if (fair.has(k)) c = { x: k % W, y: (k / W) | 0 };
  }
  if (!c) c = cells[Math.floor(state.rand() * cells.length)]; 
  const m = { id: state.nextId++, x: c.x, y: c.y, kind: 'mote' };
  state.motes.push(m);
  state.events.push({ type: 'spawn', x: m.x, y: m.y, kind: m.kind });
  return m;
}

function spawnShoal(state) {
  const cells = spawnCells(state, 4).filter((c) => c.x >= 2 && c.x < W - 2 && c.y >= 2 && c.y < H - 2);
  if (!cells.length) return [];
  const centre = cells[Math.floor(state.rand() * cells.length)];
  const near = cells.filter((c) => Math.abs(c.x - centre.x) <= 1 && Math.abs(c.y - centre.y) <= 1);
  const want = 4 + Math.floor(state.rand() * 3); 
  const picked = [];
  while (near.length && picked.length < want) picked.push(near.splice(Math.floor(state.rand() * near.length), 1)[0]);
  const shoal = picked.map((c) => ({ id: state.nextId++, x: c.x, y: c.y, kind: 'shoal' }));
  state.motes.push(...shoal);
  state.shoalsSeen++;
  state.events.push({ type: 'shoal', centre, count: shoal.length, first: state.shoalsSeen === 1 });
  return shoal;
}

function spawnJellies(state) {
  state.jellies = [];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i < state.depth.jellies; i++) {
    const cells = spawnCells(state, 5);
    if (!cells.length) break;
    const c = cells[Math.floor(state.rand() * cells.length)];
    const [dx, dy] = dirs[Math.floor(state.rand() * 4)];
    state.jellies.push({ id: state.nextId++, x: c.x, y: c.y, dx, dy });
  }
}

function moveJellies(state) {
  if (!state.jellies.length) return;
  const head = state.snake[0];
  const d = DIRS[state.queue[0] || state.dir];
  const ahead = { x: head.x + d.x, y: head.y + d.y };
  const body = bodySet(state.snake, false);
  const blocked = (x, y, self) => x < 0 || x >= W || y < 0 || y >= H || body.has(key(x, y))
    || (x === ahead.x && y === ahead.y) || state.motes.some((m) => m.x === x && m.y === y)
    || state.jellies.some((j) => j !== self && j.x === x && j.y === y);
  for (const j of state.jellies) {
    if (blocked(j.x + j.dx, j.y + j.dy, j)) { j.dx = -j.dx; j.dy = -j.dy; }
    if (!blocked(j.x + j.dx, j.y + j.dy, j)) { j.x += j.dx; j.y += j.dy; }
  }
}
