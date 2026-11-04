






import { ROCK, TREASURE, CHALK, LIMESTONE, FLINT, SLATE } from './structure.js';

class Shape {
  constructor(nx, ny, nz) { this.size = [nx, ny, nz]; this.cells = new Set(); }
  key(x, y, z) { return x + this.size[0] * (y + this.size[1] * z); }
  put(x, y, z) {
    const [nx, ny, nz] = this.size;
    x = Math.round(x); y = Math.round(y); z = Math.round(z);
    if (x < 0 || y < 0 || z < 0 || x >= nx || y >= ny || z >= nz) return this;
    this.cells.add(this.key(x, y, z));
    return this;
  }
  has(x, y, z) { return this.cells.has(this.key(x, y, z)); }
  
  line(a, b) {
    let [x, y, z] = a.map(Math.round);
    const [X, Y, Z] = b.map(Math.round);
    this.put(x, y, z);
    while (x !== X || y !== Y || z !== Z) {
      const dx = X - x, dy = Y - y, dz = Z - z;
      const m = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
      if (Math.abs(dx) === m) x += Math.sign(dx);
      else if (Math.abs(dy) === m) y += Math.sign(dy);
      else z += Math.sign(dz);
      this.put(x, y, z);
    }
    return this;
  }
  path(points) { for (let i = 1; i < points.length; i++) this.line(points[i - 1], points[i]); return this; }
  
  curve(fn, steps = 64) {
    const pts = [];
    for (let i = 0; i <= steps; i++) pts.push(fn(i / steps));
    return this.path(pts);
  }
  ball(cx, cy, cz, rx, ry = rx, rz = rx) {
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++)
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const a = (x - cx) / (rx || 1), b = (y - cy) / (ry || 1), c = (z - cz) / (rz || 1);
          if (a * a + b * b + c * c <= 1.02) this.put(x, y, z);
        }
    return this;
  }
}


function hash(x, y, z, s) {
  let h = Math.imul(x * 374761393 + y * 668265263 + z * 2147483647 + s * 1274126177, 1) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const allChalk = () => CHALK;

const beds = (seed) => (x, y, z) => {
  const b = Math.floor((y + (x + z) * 0.25) / 2);
  return hash(b, 0, 0, seed) > 0.45 ? LIMESTONE : CHALK;
};

const knots = (seed) => (x, y, z) => {
  if (hash(x >> 1, y >> 1, z >> 1, seed) > 0.82) return FLINT;
  return LIMESTONE;
};
const slate = () => SLATE;



function cockle() {
  const s = new Shape(5, 5, 5);
  
  for (let a = -3; a <= 3; a++) {
    const t = a / 3;
    s.curve((u) => [2 + t * 2 * u, 0.6 + 3.4 * u * (1 - 0.18 * t * t), 2 - (u * u - u) * 1.8]);
  }
  return s;
}

function ammonite() {
  const s = new Shape(7, 7, 5);
  s.curve((t) => {
    const a = t * Math.PI * 4.6;
    const r = 0.4 + t * 2.7;
    return [3 + Math.cos(a) * r, 3 + Math.sin(a) * r, 2 + Math.sin(t * Math.PI) * 0.9 * (t > 0.5 ? 1 : -1)];
  }, 120);
  return s;
}

function tooth() {
  const s = new Shape(7, 7, 5);
  
  for (let y = 0; y <= 5; y++) {
    const half = Math.round(2.6 * (1 - y / 6));
    const lean = 2 + (y / 6) * (y / 6) * 1.6;
    for (let x = -half; x <= half; x++) s.put(3 + x, y + 0.6, lean);
    if (half >= 1 && y < 3) for (let x = -half + 1; x <= half - 1; x++) s.put(3 + x, y + 0.6, lean + 1);
  }
  s.line([3, 0, 2], [3, 6, 4]);
  return s;
}

function trilobite() {
  const s = new Shape(7, 9, 5);
  s.ball(3, 6.6, 2, 2.8, 1.5, 0.6); 
  for (let y = 1; y <= 5; y++) {
    const half = 2.6 - (5 - y) * 0.28;
    
    if (y % 2 === 0) { s.line([3 - half, y, 2], [3 + half, y, 2]); } else { s.line([3 - half + 1, y, 2], [3 + half - 1, y, 2]); }
    s.put(3, y, 3);
  }
  s.line([3, 0, 2], [3, 7, 2]);
  s.line([3, 1, 3], [3, 7, 3]);
  return s;
}

function seahorse() {
  const s = new Shape(7, 11, 7);
  
  s.curve((t) => [3 + Math.sin(t * Math.PI * 1.8) * 1.7, 9 - t * 8.6, 3 + Math.sin(t * Math.PI * 2.6) * 2.0], 90);
  s.ball(3 + Math.sin(0.1) * 1.7, 8.6, 3.6, 1, 1.2, 1);
  s.line([3, 9, 4], [3, 9, 6]); 
  s.line([3, 10, 3], [3, 8, 3]); 
  
  s.curve((t) => [3 + Math.sin(1.8 * Math.PI) * 1.7 + Math.cos(t * 5) * 1.0 - 1, 0.6 + t * 1.8, 3 + Math.sin(2.6 * Math.PI) * 2 + Math.sin(t * 5) * 1.2], 30);
  return s;
}

function wishbone() {
  const s = new Shape(9, 9, 7);
  s.curve((t) => [4 - t * 3.6, 1 + t * t * 7, 3 + Math.sin(t * 3) * 2.5], 40);
  s.curve((t) => [4 + t * 3.6, 1 + t * t * 7, 3 + Math.sin(t * 3) * 2.5], 40);
  s.line([4, 0, 3], [4, 1, 3]);
  s.ball(4, 0.8, 3, 1, 0.6, 0.6);
  return s;
}

function fern() {
  const s = new Shape(9, 11, 5);
  const stem = (t) => [4 + Math.sin(t * 2.4) * 1.2, 0.2 + t * 10.2, 2 + Math.sin(t * 3.2) * 1.2];
  s.curve(stem, 50);
  
  for (let i = 1; i <= 8; i++) {
    const t = i / 9;
    const [x, y, z] = stem(t);
    const reach = 4 * (1 - t * 0.72);
    const side = i % 2 === 0 ? 1 : -1;
    s.line([x, y, z], [x + side * reach, y + 1.1, z]);
  }
  return s;
}

function dragonfly() {
  const s = new Shape(11, 9, 7);
  s.line([5, 0, 3], [5, 7, 3]);          
  s.ball(5, 7.3, 3, 1.1, 1.1, 1.1);      
  s.ball(5, 5.3, 3, 1, 0.9, 1);          
  for (const side of [-1, 1]) {
    
    s.line([5, 5, 3], [5 + side * 5, 6.6, 4.4]);
    s.line([5 + side * 2, 5.6, 4], [5 + side * 4, 6.4, 3.6]);
    s.line([5, 4, 3], [5 + side * 5, 2.8, 1.6]);
    s.line([5 + side * 2, 3.5, 2], [5 + side * 4, 3.2, 2.4]);
  }
  return s;
}

function crab() {
  const s = new Shape(11, 7, 9);
  s.ball(5, 3, 4, 2.6, 1.4, 1.9);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const z = 2.4 + i * 1.3;
      s.path([[5 + side * 2, 2.6, z], [5 + side * 4, 1.8, z - 0.6], [5 + side * 5, 0, z - 1]]);
    }
    
    s.path([[5 + side * 2, 3.2, 5], [5 + side * 3.8, 4.4, 7], [5 + side * 2.4, 5, 8]]);
    s.ball(5 + side * 2.4, 5.2, 8, 0.8, 0.7, 0.7);
    s.line([5 + side * 1, 4, 5.6], [5 + side * 1, 6, 5.6]); 
  }
  return s;
}

function starfish() {
  const s = new Shape(9, 9, 5);
  s.ball(4, 4, 2, 1.1, 1.1, 0.6);
  for (let i = 0; i < 5; i++) {
    const a = Math.PI / 2 + (i * 2 * Math.PI) / 5;
    s.curve((t) => [4 + Math.cos(a) * t * 4, 4 + Math.sin(a) * t * 4, 2 + Math.sin(t * Math.PI + i) * 1.4], 16);
  }
  return s;
}

function whelk() {
  const s = new Shape(9, 11, 9);
  
  s.curve((t) => {
    const a = t * Math.PI * 7;
    const r = 3.8 * (1 - t) + 0.2;
    return [4 + Math.cos(a) * r, 0.5 + t * 9.8, 4 + Math.sin(a) * r];
  }, 180);
  s.line([4, 0, 4], [4, 10, 4]);
  return s;
}

function serpent() {
  const s = new Shape(11, 11, 11);
  
  const spine = (t) => {
    const a = t * Math.PI * 3.1;
    const r = 3.5 + Math.sin(t * 6) * 0.6;
    return [5 + Math.cos(a) * r, 1 + t * 8.6, 5 + Math.sin(a) * r];
  };
  s.curve(spine, 120);
  for (let i = 2; i <= 18; i++) {
    const t = i / 20;
    const [x, y, z] = spine(t);
    const dx = x - 5, dz = z - 5;
    const len = Math.hypot(dx, dz) || 1;
    const reach = i % 2 ? 1.6 : 1.1;
    s.line([x, y, z], [x + (dx / len) * reach, y - 0.4, z + (dz / len) * reach]);
    s.line([x, y, z], [x - (dx / len) * reach, y - 0.4, z - (dz / len) * reach]);
  }
  const [hx, hy, hz] = spine(1);
  s.ball(hx, hy, hz, 1.3, 1.1, 1.3);
  return s;
}


const VERMILION = '#d8381f';
const COBALT = '#1f55c2';
const VERDIGRIS = '#118a76';
const MADDER = '#b81f58';
const OCHRE = '#d98a0b';
const VIOLET = '#6a35b5';


export const DRAWERS = Object.freeze([
  Object.freeze({
    id: 'chalk',
    levels: Object.freeze([
      { id: 'cockle', shape: cockle, mat: allChalk, pigment: VERMILION, mallet: false, pad: 0 },
      { id: 'ammonite', shape: ammonite, mat: allChalk, pigment: COBALT, mallet: false, pad: 0 },
      { id: 'tooth', shape: tooth, mat: allChalk, pigment: OCHRE, mallet: false, pad: 0 },
    ]),
  }),
  Object.freeze({
    id: 'limestone',
    levels: Object.freeze([
      { id: 'trilobite', shape: trilobite, mat: beds(11), pigment: VERDIGRIS, mallet: true, pad: 0 },
      { id: 'seahorse', shape: seahorse, mat: beds(23), pigment: MADDER, mallet: true, pad: 0 },
      { id: 'wishbone', shape: wishbone, mat: knots(5), pigment: VERMILION, mallet: true, pad: 0 },
    ]),
  }),
  Object.freeze({
    id: 'slate',
    levels: Object.freeze([
      { id: 'fern', shape: fern, mat: slate, pigment: VERDIGRIS, mallet: true, seams: { axis: 1, every: 3 }, pad: 0 },
      { id: 'dragonfly', shape: dragonfly, mat: slate, pigment: COBALT, mallet: true, seams: { axis: 2, every: 2 }, pad: 0 },
      { id: 'crab', shape: crab, mat: slate, pigment: VERMILION, mallet: true, seams: { axis: 0, every: 3 }, pad: 0 },
    ]),
  }),
  Object.freeze({
    id: 'survey',
    levels: Object.freeze([
      { id: 'starfish', shape: starfish, mat: allChalk, pigment: OCHRE, mallet: true, survey: true, pad: 0 },
      { id: 'whelk', shape: whelk, mat: beds(41), pigment: MADDER, mallet: true, survey: true, pad: 0 },
      { id: 'serpent', shape: serpent, mat: knots(77), pigment: VIOLET, mallet: true, survey: true, pad: 0 },
    ]),
  }),
]);

export const LEVELS = Object.freeze(DRAWERS.flatMap((d) => d.levels.map((l) => Object.freeze({ ...l, drawer: d.id }))));


export function buildSpec(level) {
  const shape = level.shape();
  const [nx, ny, nz] = shape.size;
  const cells = (x, y, z) => (shape.has(x, y, z) ? { kind: TREASURE } : { kind: ROCK, mat: level.mat(x, y, z) });

  
  let sx = 0, sy = 0, sz = 0, count = 0;
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    if (shape.has(x, y, z)) { sx += x; sy += y; sz += z; count++; }
  }
  const my = sy / count, mz = sz / count;
  let best = null;
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) {
    let lo = -1, hi = -1;
    for (let x = 0; x < nx; x++) if (shape.has(x, y, z)) { if (lo < 0) lo = x; hi = x; }
    if (lo < 0) continue;
    const d = (y - my) ** 2 + (z - mz) ** 2 - (hi - lo) * 0.1;
    if (!best || d < best.d) best = { d, y, z, lo, hi };
  }
  const pins = [[best.lo, best.y, best.z], [best.hi, best.y, best.z]];

  const seams = [];
  if (level.seams) {
    const lim = shape.size[level.seams.axis];
    for (let at = level.seams.every - 1; at < lim - 1; at += level.seams.every) seams.push({ axis: level.seams.axis, at });
  }
  return { size: shape.size, cells, pins, seams, count };
}

export { hash, Shape };
export const LEVEL_KINDS = { ROCK, TREASURE };
