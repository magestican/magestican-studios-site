



















export const EMPTY = 0;
export const ROCK = 1;
export const TREASURE = 2;

export const CHALK = 0;
export const LIMESTONE = 1;
export const FLINT = 2;
export const SLATE = 3;


export const MATERIALS = Object.freeze([
  Object.freeze({ tension: 30, shear: 22, mu: 0.8, hp: 1, shock: 0.7 }),  
  Object.freeze({ tension: 38, shear: 28, mu: 0.8, hp: 2, shock: 1.0 }),  
  Object.freeze({ tension: 50, shear: 38, mu: 0.8, hp: 3, shock: 1.5 }),  
  Object.freeze({ tension: 34, shear: 15, mu: 0.5, hp: 1, shock: 1.1 }),  
]);

const TREASURE_TENSION = 400;
const TREASURE_SHEAR = 300;

const INTERFACE_FACTOR = 0.8;

const SEAM_FACTOR = 0.45;


export const FATIGUE_FROM = 0.55;
const FATIGUE_RATE = 0.9; 




const RING_TIME = 0.4;
const CREAK_AT = 0.5;

const OVERLOAD_GRACE = 0.05;





export const CREEP_TAU = 0.7;
export const STICTION = 0.028;
export const STILL_SPEED = STICTION / CREEP_TAU;

const SPRING_K = 340;
const SPRING_C = 15;
const COUPLING = 34;
const DRIVE_GAIN = 16;
const MAX_OFFSET = 0.16;
const MAX_PLASTIC = 0.11;
const FREEZE_SPEED = 0.004;










const SOLID_CUT = 9;
const LONE_BOND = 0.22;

const bendPassed = (bonds) => (bonds <= 2 ? 1 : (2 / bonds) * (2 / bonds));

export class Block {
  
  constructor(spec) {
    const [nx, ny, nz] = spec.size;
    this.nx = nx; this.ny = ny; this.nz = nz;
    const n = nx * ny * nz;
    this.n = n;
    this.cx = (nx - 1) / 2; this.cy = (ny - 1) / 2; this.cz = (nz - 1) / 2;
    this.cement = spec.cement ?? 1;
    this.kind = new Uint8Array(n);
    this.mat = new Uint8Array(n);
    this.hp = new Uint8Array(n);
    this.cracks = new Uint8Array(n);
    this.isPin = new Uint8Array(n);
    this.bond = new Float32Array(n * 3).fill(-1); 
    this.width = new Float32Array(n * 3);
    this.widthEpoch = 0;
    this.bondEpoch = 0;                           
    this.over = new Float32Array(n * 3);          
    this.ring = 0;                                
    this.creaked = new Uint8Array(n * 3);         
    this.creaks = [];                             
    this.util = new Float32Array(n * 3);          
    this.tension = new Float32Array(n * 3);
    this.shear = new Float32Array(n * 3);
    this.mu = new Float32Array(n * 3);
    this.depth = new Int32Array(n);
    this.queue = new Int32Array(n);
    this.queued = 0;
    this.bondCount = new Uint8Array(n);
    this.f = new Float32Array(n * 3);
    this.m = new Float32Array(n * 3);
    this.u = new Float32Array(n * 3);  
    this.v = new Float32Array(n * 3);  
    this.p = new Float32Array(n * 3);  
    this.damage = new Float32Array(n); 
    this.frozen = new Uint8Array(n);
    this.gRest = [0, -1, 0];
    this.hasRest = false;
    this.maxUtil = 0;
    this.rockLeft = 0;
    this.treasureCount = 0;
    this.changed = true;

    for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      const c = spec.cells(x, y, z);
      if (!c) continue;
      const i = this.idx(x, y, z);
      this.kind[i] = c.kind;
      this.mat[i] = c.mat ?? CHALK;
      if (c.kind === ROCK) { this.hp[i] = MATERIALS[this.mat[i]].hp; this.rockLeft++; } else this.treasureCount++;
    }
    const seamed = (axis, lo) => (spec.seams || []).some((s) => s.axis === axis && s.at === lo);
    for (let i = 0; i < n; i++) {
      if (!this.kind[i]) continue;
      const [x, y, z] = this.xyz(i);
      for (let a = 0; a < 3; a++) {
        const j = this.neighbour(x, y, z, a, 1);
        if (j < 0 || !this.kind[j]) continue;
        const k = i * 3 + a;
        this.bond[k] = 0;
        const low = [x, y, z][a];
        const both = this.kind[i] === TREASURE && this.kind[j] === TREASURE;
        if (both) {
          this.tension[k] = TREASURE_TENSION; this.shear[k] = TREASURE_SHEAR; this.mu[k] = 1;
        } else {
          const A = MATERIALS[this.kind[i] === ROCK ? this.mat[i] : this.mat[j]];
          const B = MATERIALS[this.kind[j] === ROCK ? this.mat[j] : this.mat[i]];
          let t = Math.min(A.tension, B.tension) * this.cement;
          let s = Math.min(A.shear, B.shear) * this.cement;
          if (this.kind[i] !== this.kind[j]) { t *= INTERFACE_FACTOR; s *= INTERFACE_FACTOR; }
          if (seamed(a, low)) { t *= SEAM_FACTOR; s *= SEAM_FACTOR; }
          this.tension[k] = t; this.shear[k] = s; this.mu[k] = Math.min(A.mu, B.mu);
        }
      }
    }
    for (const [x, y, z] of spec.pins || []) this.isPin[this.idx(x, y, z)] = 1;
  }

  
  
  
  
  
  calibrate(target = 0.45) {
    const worst = new Float32Array(this.util.length);
    for (const gx of [-1, 0, 1]) for (const gy of [-1, 0, 1]) for (const gz of [-1, 0, 1]) {
      const len = Math.hypot(gx, gy, gz);
      if (!len) continue;
      this.loads([gx / len, gy / len, gz / len], [0, 0, 0], [0, 0, 0]);
      for (let k = 0; k < worst.length; k++) if (this.util[k] > worst[k]) worst[k] = this.util[k];
    }
    for (let k = 0; k < worst.length; k++) {
      if (worst[k] > target) { const f = worst[k] / target; this.tension[k] *= f; this.shear[k] *= f; }
    }
    this.util.fill(0);
    return Math.max(...worst);
  }

  idx(x, y, z) { return x + this.nx * (y + this.ny * z); }
  xyz(i) { const z = Math.floor(i / (this.nx * this.ny)); const r = i - z * this.nx * this.ny; const y = Math.floor(r / this.nx); return [r - y * this.nx, y, z]; }
  inside(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.nx && y < this.ny && z < this.nz; }
  neighbour(x, y, z, axis, dir) {
    const X = x + (axis === 0 ? dir : 0), Y = y + (axis === 1 ? dir : 0), Z = z + (axis === 2 ? dir : 0);
    return this.inside(X, Y, Z) ? this.idx(X, Y, Z) : -1;
  }
  pos(i) { const [x, y, z] = this.xyz(i); return [x - this.cx, y - this.cy, z - this.cz]; }
  at(x, y, z) { return this.inside(x, y, z) ? this.kind[this.idx(x, y, z)] : EMPTY; }

  
  eachBond(i, fn) {
    const nx = this.nx, nxy = nx * this.ny;
    const z = Math.floor(i / nxy), r = i - z * nxy, y = Math.floor(r / nx), x = r - y * nx;
    if (x + 1 < nx && this.bond[i * 3] >= 0) fn(i + 1, i * 3, 0, 1);
    if (y + 1 < this.ny && this.bond[i * 3 + 1] >= 0) fn(i + nx, i * 3 + 1, 1, 1);
    if (z + 1 < this.nz && this.bond[i * 3 + 2] >= 0) fn(i + nxy, i * 3 + 2, 2, 1);
    if (x > 0 && this.bond[(i - 1) * 3] >= 0) fn(i - 1, (i - 1) * 3, 0, -1);
    if (y > 0 && this.bond[(i - nx) * 3 + 1] >= 0) fn(i - nx, (i - nx) * 3 + 1, 1, -1);
    if (z > 0 && this.bond[(i - nxy) * 3 + 2] >= 0) fn(i - nxy, (i - nxy) * 3 + 2, 2, -1);
  }

  exposed(i) {
    const [x, y, z] = this.xyz(i);
    return !this.at(x + 1, y, z) || !this.at(x - 1, y, z) || !this.at(x, y + 1, z)
      || !this.at(x, y - 1, z) || !this.at(x, y, z + 1) || !this.at(x, y, z - 1);
  }

  
  
  widthOf(i, axis, k) {
    if (this.widthEpoch !== this.bondEpoch) { this.width.fill(0); this.widthEpoch = this.bondEpoch; }
    return this.width[k] || (this.width[k] = this.cutWidth(i, axis));
  }

  
  cutWidth(i, axis) {
    const { nx, ny, nz, bond } = this;
    const nxy = nx * ny;
    const z = Math.floor(i / nxy), r = i - z * nxy, y = Math.floor(r / nx), x = r - y * nx;
    let across = 0;
    for (let s = -1; s <= 1; s++) for (let t = -1; t <= 1; t++) {
      const X = axis === 0 ? x : x + s;
      const Y = axis === 1 ? y : axis === 0 ? y + s : y + t;
      const Z = axis === 2 ? z : z + t;
      if (X < 0 || Y < 0 || Z < 0 || X >= nx || Y >= ny || Z >= nz) continue;
      if (bond[(X + nx * (Y + ny * Z)) * 3 + axis] >= 0) across++;
    }
    return LONE_BOND + ((1 - LONE_BOND) * Math.max(0, across - 1)) / (SOLID_CUT - 1);
  }

  
  flood() {
    const { depth, queue, n } = this;
    depth.fill(-1);
    let head = 0, tail = 0;
    
    
    
    for (let i = 0; i < n; i++) if (this.kind[i] === TREASURE) { depth[i] = 0; queue[tail++] = i; }
    while (head < tail) {
      const i = queue[head++];
      const d = depth[i] + 1;
      let bonds = 0;
      this.eachBond(i, (j) => { bonds++; if (depth[j] < 0) { depth[j] = d; queue[tail++] = j; } });
      this.bondCount[i] = bonds;
    }
    this.queued = tail;
  }

  
  
  
  loads(gL, wL, aL, toGravities = 1 / 30) {
    this.flood();
    const { f, m, depth, queue, kind } = this;
    f.fill(0); m.fill(0);
    this.util.fill(0);
    let maxU = 0;
    const wx = wL[0], wy = wL[1], wz = wL[2];
    const ax = aL[0], ay = aL[1], az = aL[2];
    const nx = this.nx, nxy = nx * this.ny;
    for (let q = this.queued - 1; q >= 0; q--) {
      const i = queue[q];
      const z = Math.floor(i / nxy), r0 = i - z * nxy, y = Math.floor(r0 / nx), x = r0 - y * nx;
      const rx = x - this.cx, ry = y - this.cy, rz = z - this.cz;
      
      const cx1 = wy * rz - wz * ry, cy1 = wz * rx - wx * rz, cz1 = wx * ry - wy * rx;
      const fx = gL[0] - (wy * cz1 - wz * cy1 + ay * rz - az * ry) * toGravities;
      const fy = gL[1] - (wz * cx1 - wx * cz1 + az * rx - ax * rz) * toGravities;
      const fz = gL[2] - (wx * cy1 - wy * cx1 + ax * ry - ay * rx) * toGravities;
      const Fx = f[i * 3] + fx, Fy = f[i * 3 + 1] + fy, Fz = f[i * 3 + 2] + fz;
      const Mx = m[i * 3], My = m[i * 3 + 1], Mz = m[i * 3 + 2];
      const d = depth[i];
      if (d === 0) continue; 

      let parents = 0;
      this.eachBond(i, (j) => { if (depth[j] === d - 1) parents++; });
      const share = 1 / parents;
      const sFx = Fx * share, sFy = Fy * share, sFz = Fz * share;
      const passed = bendPassed(this.bondCount[i]);
      const sMx = Mx * share * passed, sMy = My * share * passed, sMz = Mz * share * passed;
      this.eachBond(i, (j, k, axis, dir) => {
        if (depth[j] !== d - 1) return;
        const dx = axis === 0 ? dir : 0, dy = axis === 1 ? dir : 0, dz = axis === 2 ? dir : 0;
        
        const Fn = sFx * dx + sFy * dy + sFz * dz;
        const shx = sFx - Fn * dx, shy = sFy - Fn * dy, shz = sFz - Fn * dz;
        const shear = Math.sqrt(shx * shx + shy * shy + shz * shz);
        
        const bx = sMx + (-dy * sFz + dz * sFy) * 0.5;
        const by = sMy + (-dz * sFx + dx * sFz) * 0.5;
        const bz = sMz + (-dx * sFy + dy * sFx) * 0.5;
        const bend = Math.sqrt(bx * bx + by * by + bz * bz);
        const pull = Math.max(0, bend - Fn);
        const compress = Math.max(0, Fn);
        const width = this.widthOf(dir > 0 ? i : j, axis, k);
        const u = Math.max(pull / (this.tension[k] * width), shear / (this.shear[k] * width + this.mu[k] * compress));
        this.util[k] = u;
        if (u > maxU && kind[i] + kind[j] > 0) maxU = u;
        f[j * 3] += sFx; f[j * 3 + 1] += sFy; f[j * 3 + 2] += sFz;
        m[j * 3] += sMx + (-dy * sFz + dz * sFy);
        m[j * 3 + 1] += sMy + (-dz * sFx + dx * sFz);
        m[j * 3 + 2] += sMz + (-dx * sFy + dy * sFx);
      });
    }
    this.maxUtil = maxU;
    return maxU;
  }

  
  
  
  
  
  
  fatigue(dt, turning = true) {
    let broke = 0;
    const { bond, util, over, depth } = this;
    this.ring = Math.max(0, this.ring - dt);
    
    
    
    let worstU = 0, worstK = -1, worstI = -1, worstJ = -1;
    for (let q = 0; q < this.queued; q++) {
      const i = this.queue[q];
      const d = depth[i];
      if (d === 0) continue;
      this.eachBond(i, (j, k) => {
        if (depth[j] !== d - 1) return;
        const u = util[k];
        if (u > FATIGUE_FROM && (turning || this.ring > 0 || u > 1)) {
          const inc = (u - FATIGUE_FROM) * FATIGUE_RATE * dt;
          bond[k] = Math.min(1, bond[k] + inc);
          
          if (bond[k] >= CREAK_AT && !this.creaked[k]) { this.creaked[k] = 1; this.creaks.push(i); }
          
          const Fl = Math.hypot(this.f[i * 3], this.f[i * 3 + 1], this.f[i * 3 + 2]) || 1;
          for (let c = 0; c < 3; c++) {
            const pc = this.p[i * 3 + c] + (this.f[i * 3 + c] / Fl) * inc * 0.09;
            this.p[i * 3 + c] = Math.max(-MAX_PLASTIC, Math.min(MAX_PLASTIC, pc));
          }
          this.frozen[i] = 0;
        }
        over[k] = u > 1 ? over[k] + dt : 0;
        const due = over[k] >= OVERLOAD_GRACE || bond[k] >= 1;
        const rank = bond[k] >= 1 ? Math.max(u, 1) : u;
        if (due && rank > worstU) { worstU = rank; worstK = k; worstI = i; worstJ = j; }
      });
    }
    if (worstK >= 0) {
      bond[worstK] = -1; over[worstK] = 0; util[worstK] = 0;
      this.bondEpoch++;
      broke = 1;
      this.frozen[worstI] = 0; this.frozen[worstJ] = 0;
      this.changed = true;
    }
    return broke;
  }

  
  
  detached() {
    this.flood();
    const groups = [];
    const seen = new Uint8Array(this.n);
    for (let i = 0; i < this.n; i++) {
      if (!this.kind[i] || this.depth[i] >= 0 || seen[i]) continue;
      const group = [i];
      seen[i] = 1;
      for (let h = 0; h < group.length; h++) {
        this.eachBond(group[h], (j) => { if (!seen[j]) { seen[j] = 1; group.push(j); } });
      }
      groups.push(group);
    }
    for (const g of groups) for (const i of g) this.release(i);
    if (groups.length) this.flood();
    return groups;
  }

  
  release(i) {
    this.eachBond(i, (_j, k) => { this.bond[k] = -1; });
    this.bondEpoch++;
    if (this.kind[i] === ROCK) this.rockLeft--;
    this.kind[i] = EMPTY;
    this.isPin[i] = 0;
    this.changed = true;
  }

  
  shock(i, power, reach = 2.6, tire = 0.04) {
    this.ring = RING_TIME;
    const [x0, y0, z0] = this.xyz(i);
    const rr = Math.ceil(reach);
    for (let z = z0 - rr; z <= z0 + rr; z++) for (let y = y0 - rr; y <= y0 + rr; y++) for (let x = x0 - rr; x <= x0 + rr; x++) {
      if (!this.inside(x, y, z)) continue;
      const j = this.idx(x, y, z);
      if (!this.kind[j] || j === i) continue;
      const dx = x - x0, dy = y - y0, dz = z - z0;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > reach) continue;
      const fall = 1 - dist / (reach + 0.001);
      const jump = power * fall * 2.4;
      this.v[j * 3] += (dx / dist) * jump + (Math.random() - 0.5) * jump * 0.5;
      this.v[j * 3 + 1] += (dy / dist) * jump + (Math.random() - 0.5) * jump * 0.5;
      this.v[j * 3 + 2] += (dz / dist) * jump + (Math.random() - 0.5) * jump * 0.5;
      this.frozen[j] = 0;
      if (tire > 0) this.eachBond(j, (_o, k) => { if (this.kind[j] === ROCK) this.bond[k] = Math.min(0.99, this.bond[k] + tire * fall); });
    }
  }

  
  shiver(dt, gL, wL, aL, toGravities = 1 / 30) {
    if (!this.hasRest) { this.gRest = gL.slice(); this.hasRest = true; }
    
    const blend = Math.min(1, dt / CREEP_TAU);
    for (let c = 0; c < 3; c++) this.gRest[c] += (gL[c] - this.gRest[c]) * blend;
    const dgx = gL[0] - this.gRest[0], dgy = gL[1] - this.gRest[1], dgz = gL[2] - this.gRest[2];
    const wx = wL[0], wy = wL[1], wz = wL[2], ax = aL[0], ay = aL[1], az = aL[2];
    const { u, v, kind, frozen, n } = this;
    const nx = this.nx, nxy = nx * this.ny;
    let moved = 0;
    for (let i = 0; i < n; i++) {
      if (!kind[i]) continue;
      const z = Math.floor(i / nxy), r0 = i - z * nxy, y = Math.floor(r0 / nx), x = r0 - y * nx;
      const rx = x - this.cx, ry = y - this.cy, rz = z - this.cz;
      const cx1 = wy * rz - wz * ry, cy1 = wz * rx - wx * rz, cz1 = wx * ry - wy * rx;
      let dx = dgx - (wy * cz1 - wz * cy1 + ay * rz - az * ry) * toGravities;
      let dy = dgy - (wz * cx1 - wx * cz1 + az * rx - ax * rz) * toGravities;
      let dz = dgz - (wx * cy1 - wy * cx1 + ax * ry - ay * rx) * toGravities;
      const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      let drive = 0;
      if (mag > STICTION) drive = (mag - STICTION) / mag;
      dx *= drive; dy *= drive; dz *= drive;

      const i3 = i * 3;
      const atRest = drive === 0 && frozen[i];
      if (atRest) continue;

      let bonds = 0, sx = 0, sy = 0, sz = 0;
      this.eachBond(i, (j) => { bonds++; sx += u[j * 3] - u[i3]; sy += u[j * 3 + 1] - u[i3 + 1]; sz += u[j * 3 + 2] - u[i3 + 2]; });
      
      const loose = 0.08 + (6 - bonds) / 6;
      const kick = drive > 0 ? mag * drive : 0;
      const rattle = kick * 1.5 * loose;
      const fx = -SPRING_K * u[i3] - SPRING_C * v[i3] + COUPLING * sx + DRIVE_GAIN * loose * dx * SPRING_K * 0.02 + (Math.random() - 0.5) * rattle * SPRING_K * 0.02;
      const fy = -SPRING_K * u[i3 + 1] - SPRING_C * v[i3 + 1] + COUPLING * sy + DRIVE_GAIN * loose * dy * SPRING_K * 0.02 + (Math.random() - 0.5) * rattle * SPRING_K * 0.02;
      const fz = -SPRING_K * u[i3 + 2] - SPRING_C * v[i3 + 2] + COUPLING * sz + DRIVE_GAIN * loose * dz * SPRING_K * 0.02 + (Math.random() - 0.5) * rattle * SPRING_K * 0.02;
      v[i3] += fx * dt; v[i3 + 1] += fy * dt; v[i3 + 2] += fz * dt;
      u[i3] = clamp(u[i3] + v[i3] * dt, MAX_OFFSET);
      u[i3 + 1] = clamp(u[i3 + 1] + v[i3 + 1] * dt, MAX_OFFSET);
      u[i3 + 2] = clamp(u[i3 + 2] + v[i3 + 2] * dt, MAX_OFFSET);
      const speed = Math.abs(v[i3]) + Math.abs(v[i3 + 1]) + Math.abs(v[i3 + 2]);
      moved = Math.max(moved, speed);
      
      frozen[i] = drive === 0 && speed < FREEZE_SPEED ? 1 : 0;
    }
    return moved;
  }

  
  refreshDamage() {
    const { damage, n, kind } = this;
    for (let i = 0; i < n; i++) {
      if (!kind[i]) { damage[i] = 0; continue; }
      let worst = 0;
      this.eachBond(i, (_j, k) => { if (this.bond[k] > worst) worst = this.bond[k]; });
      damage[i] = worst;
    }
  }

  
  countAlong(x, y, z, axis) {
    const c = [x, y, z];
    const lim = [this.nx, this.ny, this.nz][axis];
    let count = 0;
    for (let t = 0; t < lim; t++) {
      c[axis] = t;
      if (this.kind[this.idx(c[0], c[1], c[2])] === TREASURE) count++;
    }
    return count;
  }

  
  raycast(ox, oy, oz, dx, dy, dz) {
    
    ox += this.cx; oy += this.cy; oz += this.cz;
    const dims = [this.nx, this.ny, this.nz];
    const o = [ox, oy, oz], d = [dx, dy, dz];
    let tMin = 0, tMax = Infinity, enter = -1, enterDir = 0;
    for (let a = 0; a < 3; a++) {
      const lo = -0.5, hi = dims[a] - 0.5;
      if (Math.abs(d[a]) < 1e-9) { if (o[a] < lo || o[a] > hi) return null; continue; }
      let t1 = (lo - o[a]) / d[a], t2 = (hi - o[a]) / d[a];
      let s = -1;
      if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; s = 1; }
      if (t1 > tMin) { tMin = t1; enter = a; enterDir = s; }
      if (t2 < tMax) tMax = t2;
      if (tMin > tMax) return null;
    }
    const p = [o[0] + d[0] * tMin, o[1] + d[1] * tMin, o[2] + d[2] * tMin];
    const c = p.map((v, a) => Math.max(0, Math.min(dims[a] - 1, Math.round(v))));
    const step = d.map((v) => (v > 0 ? 1 : -1));
    const tDelta = d.map((v) => (Math.abs(v) < 1e-9 ? Infinity : 1 / Math.abs(v)));
    const tNext = d.map((v, a) => (Math.abs(v) < 1e-9 ? Infinity : tMin + ((c[a] + step[a] * 0.5) - p[a]) / v));
    let face = enter, faceDir = enterDir;
    for (let guard = 0; guard < dims[0] + dims[1] + dims[2] + 3; guard++) {
      const i = this.idx(c[0], c[1], c[2]);
      if (this.kind[i]) return { i, x: c[0], y: c[1], z: c[2], axis: face, dir: faceDir };
      let a = 0;
      if (tNext[1] < tNext[a]) a = 1;
      if (tNext[2] < tNext[a]) a = 2;
      c[a] += step[a];
      if (c[a] < 0 || c[a] >= dims[a]) return null;
      tNext[a] += tDelta[a];
      face = a; faceDir = -step[a];
    }
    return null;
  }
}

function clamp(v, m) { return v > m ? m : v < -m ? -m : v; }

