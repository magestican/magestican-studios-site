



import { Block, ROCK, TREASURE, MATERIALS, EMPTY, STILL_SPEED } from './structure.js';
import { buildSpec } from './levels.js';
import { LooseBodies, rotate, GRAVITY } from './physics.js';

export const DT = 1 / 60;
export const MAX_CRACKS = 3;



const TURN_K = 58;
const TURN_C = 2 * Math.sqrt(TURN_K);
const MAX_SPIN = 22;




const CRACK_FORCE = 1300;
const CRACK_MIN_CUBES = 3;
const ROCK_SHOCK_FORCE = 360;
const CRACK_GAP = 0.3;



const TEAR_SPIN = 2.6;


const COLLAPSE_WINDOW = 1.2;
const COLLAPSE_SHARE = 0.26;
const COLLAPSE_MIN = 14;

const MALLET_POWER = 2.6;

export class Game {
  
  constructor(RAPIER, level, opts = {}) {
    this.level = level;
    const spec = buildSpec(level);
    this.spec = spec;
    this.block = new Block(spec);
    this.block.calibrate();
    this.original = this.block.kind.slice();
    this.originalMat = this.block.mat.slice();
    this.rockStart = this.block.rockLeft;
    const [nx, ny, nz] = spec.size;
    this.radius = Math.hypot(nx, ny, nz) / 2;
    
    
    
    
    this.benchY = -(this.radius + 1.0);
    this.floorY = this.benchY - this.radius * 2;
    this.loose = new LooseBodies(RAPIER, { floorY: this.floorY, maxBodies: opts.mobile ? 180 : 420 });
    this.q = [0, 0, 0, 1];
    this.qT = [0, 0, 0, 1];
    this.w = [0, 0, 0];     
    this.alpha = [0, 0, 0];
    this.state = 'play';
    this.reason = '';
    this.cracks = 0;
    this.time = 0;
    this.pokes = 0;
    this.largestFall = 0;
    this.loadFalls = 0; 
    this.fallLog = [];
    this.lastCrackAt = -1;
    this.events = [];
    this.gone = new Uint8Array(this.block.n);
    this.lastPoseFree = true;
    this.accum = 0;
    this.tremor = 0;
    this.block.flood();
    this.loose.syncStructure(this.block);
    this.loose.setPose(this.q);
  }

  
  
  turn(axis, angle) {
    const len = Math.hypot(axis[0], axis[1], axis[2]);
    if (!len || !angle) return;
    const s = Math.sin(angle / 2) / len;
    this.qT = normalize(mul([axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)], this.qT));
  }

  gravityLocal() { return rotate(conj(this.q), [0, -1, 0]); }

  
  
  step() {
    this.time += DT;
    const b = this.block;

    
    const err = toAngular(mul(this.qT, conj(this.q)));
    const prev = this.w.slice();
    for (let c = 0; c < 3; c++) {
      this.w[c] += (TURN_K * err[c] - TURN_C * this.w[c]) * DT;
      this.w[c] = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, this.w[c]));
      this.alpha[c] = (this.w[c] - prev[c]) / DT;
    }
    const wm = Math.hypot(this.w[0], this.w[1], this.w[2]);
    if (wm > 1e-7) {
      const s = Math.sin((wm * DT) / 2) / wm;
      this.q = normalize(mul([this.w[0] * s, this.w[1] * s, this.w[2] * s, Math.cos((wm * DT) / 2)], this.q));
    }
    const qi = conj(this.q);
    const gL = rotate(qi, [0, -1, 0]);
    const wL = rotate(qi, this.w);
    const aL = rotate(qi, this.alpha);

    if (this.state === 'play') {
      b.loads(gL, wL, aL, 1 / GRAVITY);
      const broke = b.fatigue(DT, wm >= STILL_SPEED);
      for (const i of b.creaks) { const p = this.worldOf(i); this.events.push({ type: 'creak', i, x: p[0], y: p[1], z: p[2] }); }
      b.creaks.length = 0;
      if (broke) {
        this.events.push({ type: 'snap', strength: Math.min(1, b.maxUtil) });
        const held = b.rockLeft;
        this.takeLoose(wm);
        this.loadFalls += held - b.rockLeft;
      }
      this.tremor += (Math.min(1.3, b.maxUtil) - this.tremor) * Math.min(1, DT * 9);
    }
    b.shiver(DT, gL, wL, aL, 1 / GRAVITY);

    this.loose.setPose(this.q);
    if (b.changed) { this.loose.syncStructure(b); b.changed = false; }
    const blows = this.loose.step();
    for (const blow of blows) this.onBlow(blow);
    for (const i of this.loose.trim()) { this.gone[i] = 1; }

    if (this.state === 'play') {
      this.checkCollapse();
      if (this.state === 'play' && b.rockLeft === 0) this.win();
    } else if (this.state === 'freed' || this.state === 'fallen') {
      this.endTimer -= DT;
      if (this.endTimer <= 0) { this.result = this.state === 'freed' ? 'won' : 'lost'; this.state = 'done'; }
    }
  }

  onBlow(blow) {
    const strength = Math.min(1, blow.force / 1500);
    this.events.push({ type: blow.onFloor ? 'clack' : 'knock', strength, x: blow.x, y: blow.y, z: blow.z, size: blow.chunk.cells.length });
    if (this.loose.shouldSplit(blow)) { this.loose.split(blow.chunk); this.events.push({ type: 'burst', strength, x: blow.x, y: blow.y, z: blow.z }); }
    if (blow.cube < 0 || this.state !== 'play') return;
    const b = this.block;
    if (!b.kind[blow.cube]) return;
    if (b.kind[blow.cube] === TREASURE) {
      
      
      
      if (blow.force > CRACK_FORCE && blow.chunk.cells.length >= CRACK_MIN_CUBES && !blow.chunk.cracked) {
        blow.chunk.cracked = true;
        this.crack(blow.cube, 'blow');
      }
    } else if (blow.force > ROCK_SHOCK_FORCE) {
      b.shock(blow.cube, Math.min(1.4, blow.force / 1400), 2.2, 0.02);
    }
  }

  crack(i, why) {
    if (this.time - this.lastCrackAt < CRACK_GAP) return;
    this.lastCrackAt = this.time;
    this.block.cracks[i] = Math.min(3, this.block.cracks[i] + 1);
    this.cracks++;
    this.block.shock(i, 1.2, 2.5, 0);
    const p = rotate(this.q, this.block.pos(i));
    this.events.push({ type: 'crack', why, i, x: p[0], y: p[1], z: p[2], count: this.cracks });
    if (this.cracks >= MAX_CRACKS) this.lose('broken');
  }

  
  takeLoose(wm) {
    const b = this.block;
    
    const groups = this.detachedWithTouch();
    if (!groups.length) return;
    let count = 0;
    for (const { cells, touched } of groups) {
      count += cells.length;
      this.spawnChunk(cells);
      if (wm > TEAR_SPIN && touched >= 0) this.crack(touched, 'tear');
    }
    this.largestFall = Math.max(this.largestFall, count);
    this.fallLog.push({ t: this.time, n: count });
    this.events.push({ type: 'fall', n: count });
    b.changed = true;
  }

  detachedWithTouch() {
    const b = this.block;
    b.flood();
    const out = [];
    const seen = new Uint8Array(b.n);
    for (let i = 0; i < b.n; i++) {
      if (!b.kind[i] || b.depth[i] >= 0 || seen[i]) continue;
      const cells = [i];
      seen[i] = 1;
      for (let h = 0; h < cells.length; h++) b.eachBond(cells[h], (j) => { if (!seen[j]) { seen[j] = 1; cells.push(j); } });
      out.push({ cells, touched: this.treasureBeside(cells) });
    }
    for (const g of out) for (const i of g.cells) b.release(i);
    if (out.length) b.flood();
    return out;
  }

  treasureBeside(cells) {
    const b = this.block;
    for (const i of cells) {
      const [x, y, z] = b.xyz(i);
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        if (b.at(x + dx, y + dy, z + dz) === TREASURE) return b.idx(x + dx, y + dy, z + dz);
      }
    }
    return -1;
  }

  
  worldOf(i) {
    const b = this.block;
    const r = b.pos(i);
    const off = [r[0] + b.u[i * 3] + b.p[i * 3], r[1] + b.u[i * 3 + 1] + b.p[i * 3 + 1], r[2] + b.u[i * 3 + 2] + b.p[i * 3 + 2]];
    return rotate(this.q, off);
  }

  spawnChunk(cells, extra = [0, 0, 0]) {
    const world = cells.map((i) => { const p = this.worldOf(i); return { i, x: p[0], y: p[1], z: p[2] }; });
    let mx = 0, my = 0, mz = 0;
    for (const c of world) { mx += c.x; my += c.y; mz += c.z; }
    mx /= world.length; my /= world.length; mz /= world.length;
    
    const v = [
      this.w[1] * mz - this.w[2] * my + extra[0],
      this.w[2] * mx - this.w[0] * mz + extra[1],
      this.w[0] * my - this.w[1] * mx + extra[2],
    ];
    return this.loose.addChunk(world, this.q, v, this.w);
  }

  checkCollapse() {
    const cutoff = this.time - COLLAPSE_WINDOW;
    this.fallLog = this.fallLog.filter((f) => f.t >= cutoff);
    const lately = this.fallLog.reduce((sum, f) => sum + f.n, 0);
    if (lately >= Math.max(COLLAPSE_MIN, Math.ceil(this.rockStart * COLLAPSE_SHARE))) this.lose('collapse');
  }

  
  lose(reason) {
    if (this.state !== 'play') return;
    this.state = 'fallen';
    this.reason = reason;
    this.endTimer = 3.2;
    const b = this.block;
    const pieces = [];
    const seen = new Uint8Array(b.n);
    
    const treasure = [];
    for (let i = 0; i < b.n; i++) if (b.kind[i] === TREASURE) { treasure.push(i); seen[i] = 1; }
    for (let i = 0; i < b.n; i++) {
      if (!b.kind[i] || seen[i]) continue;
      const lump = [i];
      seen[i] = 1;
      for (let h = 0; h < lump.length && lump.length < 5; h++) {
        b.eachBond(lump[h], (j) => { if (!seen[j] && lump.length < 5) { seen[j] = 1; lump.push(j); } });
      }
      pieces.push(lump);
    }
    const worlds = [...pieces, treasure].filter((p) => p.length);
    for (const p of worlds) {
      const spread = [(Math.random() - 0.5) * 2.4, Math.random() * 1.6, (Math.random() - 0.5) * 2.4];
      this.spawnChunk(p, spread);
    }
    for (const p of worlds) for (const i of p) b.release(i);
    b.changed = true;
    this.events.push({ type: 'collapse', reason });
  }

  win() {
    this.state = 'freed';
    this.endTimer = 0.2;
    this.events.push({ type: 'freed' });
  }

  grade() {
    if (this.cracks === 0 && this.largestFall <= 6) return 'mint';
    if (this.cracks <= 1) return 'fine';
    return 'worn';
  }

  
  strike(i, tool, normal) {
    if (this.state !== 'play') return null;
    const b = this.block;
    const kind = b.kind[i];
    if (kind === EMPTY) return null;
    this.pokes++;
    if (kind === TREASURE) {
      this.lastCrackAt = -1;
      this.crack(i, 'poke');
      return 'treasure';
    }
    const m = MATERIALS[b.mat[i]];
    const mallet = tool === 'mallet';
    const shock = m.shock * (mallet ? MALLET_POWER : 1);
    if (!mallet && b.hp[i] > 1) {
      b.hp[i]--;
      b.shock(i, shock * 0.6, 2.2, 0.015);
      const p = rotate(this.q, b.pos(i));
      this.events.push({ type: 'chip', x: p[0], y: p[1], z: p[2], mat: b.mat[i], hp: b.hp[i] });
      return 'chip';
    }
    const take = [i];
    if (mallet) {
      const [x, y, z] = b.xyz(i);
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        const X = x + dx, Y = y + dy, Z = z + dz;
        const at = b.at(X, Y, Z);
        if (at === ROCK) take.push(b.idx(X, Y, Z));
        
        if (at === TREASURE) this.crack(b.idx(X, Y, Z), 'mallet');
      }
    }
    if (this.state !== 'play') return 'treasure';
    b.shock(i, shock, mallet ? 3.6 : 2.6, mallet ? 0.09 : 0.03);
    for (const c of take) {
      const p = this.worldOf(c);
      const out = normal || [p[0], p[1], p[2]];
      const len = Math.hypot(out[0], out[1], out[2]) || 1;
      const speed = 2.6 + Math.random() * 1.6;
      this.spawnChunk([c], [(out[0] / len) * speed + (Math.random() - 0.5) * 1.2, (out[1] / len) * speed + 1.6, (out[2] / len) * speed + (Math.random() - 0.5) * 1.2]);
      b.release(c);
      this.events.push({ type: 'dig', x: p[0], y: p[1], z: p[2], mat: this.originalMat[c], mallet });
    }
    b.changed = true;
    this.takeLoose(0);
    return mallet ? 'mallet' : 'dig';
  }

  
  pick(origin, dir) {
    const qi = conj(this.q);
    const o = rotate(qi, origin), d = rotate(qi, dir);
    const hit = this.block.raycast(o[0], o[1], o[2], d[0], d[1], d[2]);
    if (!hit) return null;
    const n = [0, 0, 0];
    n[hit.axis] = hit.dir;
    hit.normal = rotate(this.q, n);
    return hit;
  }

  drain() { const e = this.events; this.events = []; return e; }

  free() { this.loose.free(); }
}

export function mul(a, b) {
  const [ax, ay, az, aw] = a, [bx, by, bz, bw] = b;
  return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz];
}
export function conj(q) { return [-q[0], -q[1], -q[2], q[3]]; }
export function normalize(q) { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; }
function toAngular(q) {
  
  const s = q[3] < 0 ? -1 : 1;
  const x = q[0] * s, y = q[1] * s, z = q[2] * s, w = q[3] * s;
  const v = Math.hypot(x, y, z);
  if (v < 1e-9) return [0, 0, 0];
  const angle = 2 * Math.atan2(v, w);
  return [(x / v) * angle, (y / v) * angle, (z / v) * angle];
}
