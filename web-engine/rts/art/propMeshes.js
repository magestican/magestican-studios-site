































































import { emptyMesh, pushQuad, pushTri, mergeMeshes, tubeAlong } from '../../ps1/ps1Mesh.mjs';
import { box, meshByColour, partsBounds } from './unitMeshes.js';

export { box, meshByColour, partsBounds };






const STRAIGHT = [[0.00, 1.00, 1.00], [1.00, 1.00, 1.00]];

const TAPER = [[0.00, 1.00, 1.00], [1.00, 0.55, 0.55]];

const CONE = [[0.00, 1.00, 1.00], [1.00, 0.06, 0.06]];








const LUMP = [[0.00, 0.16, 0.16], [0.22, 0.82, 0.82], [0.50, 1.00, 1.00],
  [0.78, 0.86, 0.86], [1.00, 0.22, 0.22]];

const DOME = [[0.00, 1.00, 1.00], [0.34, 0.96, 0.96], [0.70, 0.74, 0.74],
  [1.00, 0.10, 0.10]];






const ROCK_FACE = [[0.00, 1.00, 1.00], [0.55, 0.86, 0.86], [0.86, 0.72, 0.72],
  [1.00, 0.62, 0.62]];

const tube = (a, b, w, d, profile = STRAIGHT, sides = 6) => tubeAlong(a, b, {
  w, d, sides, profile,
});


const post = (a, b, r, profile = STRAIGHT, sides = 6) => tube(a, b, r * 2, r * 2, profile, sides);









const lump = (x, y, z, w, d, h, sides = 6) => tube(
  [x, y, z - h / 2], [x, y, z + h / 2], w, d, LUMP, sides,
);








function gable(x0, x1, y, ridgeZ, span, rise) {
  const m = emptyMesh();
  const y0 = y - span / 2;
  const y1 = y + span / 2;
  const eaveZ = ridgeZ - rise;
  const UV = [0, 0];
  
  pushQuad(m, [x0, y0, eaveZ], [x1, y0, eaveZ], [x1, y, ridgeZ], [x0, y, ridgeZ], UV, UV, UV, UV);
  pushQuad(m, [x0, y, ridgeZ], [x1, y, ridgeZ], [x1, y1, eaveZ], [x0, y1, eaveZ], UV, UV, UV, UV);
  
  
  
  
  pushTri(m, [x1, y0, eaveZ], [x1, y1, eaveZ], [x1, y, ridgeZ], UV, UV, UV);
  pushTri(m, [x0, y1, eaveZ], [x0, y0, eaveZ], [x0, y, ridgeZ], UV, UV, UV);
  return m;
}

const part = (mesh, colour) => ({ mesh, colour });









function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}





const BARK_PALE = '#c6bca6';      
const BARK_SHADE = '#938973';
const BARK_DARK = '#6a5b46';      
const LEAF = '#6d8a4a';           
const LEAF_DARK = '#4a6634';
const LEAF_BLUE = '#7d9576';      
const PINE_DARK = '#33502c';
const PINE_LIGHT = '#456b39';
const HEDGE = '#456d31';
const HEDGE_DARK = '#2d4a22';
const SALT_BUSH = '#8b9670';      
const SALT_DARK = '#67714f';
const WATTLE = '#93a24d';
const REED = '#8fa54c';
const REED_DARK = '#64753a';
const ROCK = '#9d998a';
const ROCK_DARK = '#6e6a5d';
const GALV = '#9aa0a0';           
const GALV_DARK = '#6f7676';





const RUST = '#8a6a55';
const TIMBER = '#7a6446';
const TIMBER_DARK = '#54452f';
const WIRE = '#a9a596';
const HAY = '#c2a75f';
const HAY_DARK = '#8f7a3f';
const CONCRETE = '#b3b0a4';

export const PROP_PALETTE = Object.freeze({
  BARK_PALE, BARK_SHADE, BARK_DARK, LEAF, LEAF_DARK, LEAF_BLUE, PINE_DARK,
  PINE_LIGHT, HEDGE, HEDGE_DARK, SALT_BUSH, SALT_DARK, WATTLE, REED, REED_DARK,
  ROCK, ROCK_DARK, GALV, GALV_DARK, RUST, TIMBER, TIMBER_DARK, WIRE, HAY,
  HAY_DARK, CONCRETE,
});



























export function eucalypt(o) {
  const parts = [];
  const rand = seeded(o.seed);
  const forkZ = o.h * 0.44;
  const lean = (o.lean === undefined ? 0.12 : o.lean) * o.spread;
  const leanY = (rand() - 0.5) * lean * 2;

  
  parts.push(part(
    post([0, 0, 0], [lean * 0.5, leanY * 0.5, forkZ], o.trunk / 2, TAPER, 6),
    o.bark,
  ));
  
  
  
  parts.push(part(
    post([0, 0, 0], [0, 0, o.h * 0.07], o.trunk * 0.78, TAPER, 6),
    o.bark === BARK_PALE ? BARK_SHADE : BARK_DARK,
  ));

  const n = o.clumps;
  for (let i = 0; i < n; i += 1) {
    
    const t = (i + 0.5) / n;
    const ang = t * Math.PI * 2 + rand() * 0.8;
    const reach = o.spread * (0.20 + rand() * 0.24);
    const cx = lean + Math.cos(ang) * reach;
    const cy = leanY + Math.sin(ang) * reach;
    const cz = forkZ + o.h * (0.20 + rand() * 0.30);
    parts.push(part(
      post([lean * 0.5, leanY * 0.5, forkZ * 0.92], [cx, cy, cz - o.h * 0.06],
        o.trunk * 0.28, TAPER, 5),
      o.bark,
    ));
    if (o.bare && rand() < o.bare) continue;
    const w = o.spread * (0.34 + rand() * 0.26);
    const hgt = w * (0.62 + rand() * 0.26);
    
    
    parts.push(part(
      lump(cx, cy, cz, w, w * (0.82 + rand() * 0.3), hgt, 6),
      i % 2 === 0 ? o.leaf : o.leafDark,
    ));
  }
  return parts;
}


export function conifer(o) {
  const parts = [];
  const rand = seeded(o.seed);
  parts.push(part(post([0, 0, 0], [0, 0, o.h * 0.22], o.trunk / 2, TAPER, 6), BARK_DARK));
  
  
  
  const tiers = 3;
  for (let i = 0; i < tiers; i += 1) {
    const t = i / tiers;
    const z0 = o.h * (0.12 + t * 0.30);
    const z1 = z0 + o.h * (0.46 - t * 0.10);
    const w = o.spread * (1 - t * 0.34) * (0.92 + rand() * 0.16);
    parts.push(part(
      tube([0, 0, z0], [0, 0, z1], w, w, CONE, 7),
      i % 2 === 0 ? PINE_DARK : PINE_LIGHT,
    ));
  }
  return parts;
}
















export function hedgeRow(o) {
  const parts = [];
  const rand = seeded(o.seed);
  const n = o.lumps || 6;
  for (let i = 0; i < n; i += 1) {
    
    
    const x = (-0.56 + (1.12 * (i + 0.5)) / n) * o.len;
    const y = (rand() - 0.5) * o.thick * 0.5;
    
    
    
    
    
    const h = o.h * (0.50 + rand() * 1.00);
    const w = (o.len / n) * (1.5 + rand() * 0.6);
    parts.push(part(
      lump(x, y, h * 0.5, w, o.thick * (0.8 + rand() * 0.5), h, 6),
      i % 2 === 0 ? o.colour : o.dark,
    ));
  }
  
  
  
  
  parts.push(part(
    tube([-o.len * 0.55, 0, o.h * 0.07], [o.len * 0.55, 0, o.h * 0.07],
      o.h * 0.18, o.thick * 1.05, STRAIGHT, 6),
    o.dark,
  ));
  return parts;
}









export function fenceRun(o) {
  const parts = [];
  const n = o.posts || 5;
  for (let i = 0; i < n; i += 1) {
    const x = (-0.5 + i / (n - 1)) * o.len;
    parts.push(part(post([x, 0, 0], [x, 0, o.h], o.postR, TAPER, 5), o.timber));
  }
  
  
  for (let k = 0; k < 3; k += 1) {
    const z = o.h * (0.32 + k * 0.28);
    parts.push(part(
      tube([-o.len * 0.5, 0, z], [o.len * 0.5, 0, z], 0.06, 0.06, STRAIGHT, 4),
      WIRE,
    ));
  }
  return parts;
}


export function farmGate(o) {
  const parts = [];
  const half = o.len / 2;
  for (const x of [-half, half]) {
    parts.push(part(post([x, 0, 0], [x, 0, o.h * 1.24], o.postR, STRAIGHT, 6), TIMBER_DARK));
  }
  for (let k = 0; k < 4; k += 1) {
    const z = o.h * (0.22 + k * 0.24);
    parts.push(part(tube([-half, 0, z], [half, 0, z], 0.10, 0.10, STRAIGHT, 4), GALV));
  }
  
  parts.push(part(tube([-half, 0, o.h * 0.22], [half, 0, o.h * 0.94], 0.10, 0.10, STRAIGHT, 4), GALV));
  return parts;
}


export function boulders(o) {
  const parts = [];
  const rand = seeded(o.seed);
  const n = o.count || 1;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const r = n === 1 ? 0 : o.size * (0.34 + rand() * 0.30);
    const w = o.size * (n === 1 ? 1 : 0.42 + rand() * 0.42);
    
    
    
    
    
    
    
    
    
    
    
    
    
    const h = w * (0.34 + rand() * 0.18);
    parts.push(part(
      tube([Math.cos(a) * r, Math.sin(a) * r, 0],
        [Math.cos(a) * r, Math.sin(a) * r, h], w, w * (0.62 + rand() * 0.3), ROCK_FACE, 5),
      i % 2 === 0 ? o.colour : o.dark,
    ));
    
    
    
    if (n === 1) {
      parts.push(part(
        tube([w * 0.52, -w * 0.34, 0], [w * 0.52, -w * 0.34, h * 0.52],
          w * 0.42, w * 0.34, ROCK_FACE, 5),
        o.dark,
      ));
    }
  }
  return parts;
}


export function shrub(o) {
  const parts = [];
  const rand = seeded(o.seed);
  const n = o.lumps || 3;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2 + rand();
    
    
    
    
    
    
    const r = o.size * (n === 1 ? 0 : 0.30 + rand() * 0.22);
    const w = o.size * (0.44 + rand() * 0.30);
    const h = o.h * (0.55 + rand() * 0.60);
    parts.push(part(
      lump(Math.cos(a) * r, Math.sin(a) * r, h * 0.5, w, w * 0.9, h, 6),
      i % 2 === 0 ? o.colour : o.dark,
    ));
  }
  return parts;
}


export function reedClump(o) {
  const parts = [];
  const rand = seeded(o.seed);
  const n = o.stems || 9;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.7;
    const r = o.size * (0.10 + rand() * 0.42);
    const h = o.h * (0.55 + rand() * 0.55);
    parts.push(part(
      post([Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3, 0],
        [Math.cos(a) * r, Math.sin(a) * r, h], 0.09, TAPER, 4),
      i % 3 === 0 ? REED_DARK : REED,
    ));
  }
  return parts;
}


export function stump(o) {
  const parts = [];
  const rand = seeded(o.seed);
  parts.push(part(post([0, 0, 0], [0, 0, o.h], o.size / 2, TAPER, 6), BARK_DARK));
  for (let i = 0; i < 3; i += 1) {
    const a = (i / 3) * Math.PI * 2 + rand();
    parts.push(part(
      post([0, 0, o.h * 0.24], [Math.cos(a) * o.size * 0.8, Math.sin(a) * o.size * 0.8, 0],
        o.size * 0.16, TAPER, 4),
      TIMBER_DARK,
    ));
  }
  return parts;
}









export function machineryShed(o) {
  const parts = [];
  const wallZ = o.h * 0.66;
  parts.push(part(box([0, 0, wallZ / 2], [o.len, o.wid, wallZ]), o.wall));
  parts.push(part(gable(-o.len / 2 - 0.25, o.len / 2 + 0.25, 0, o.h, o.wid + 0.5, o.h - wallZ), o.roof));
  
  
  parts.push(part(
    box([o.len * 0.28, -o.wid * 0.5 - 0.06, wallZ * 0.42], [o.len * 0.36, 0.16, wallZ * 0.72]),
    '#2c3230',
  ));
  
  
  
  
  
  
  
  
  parts.push(part(
    box([0, o.wid * 0.5 + o.wid * 0.15, wallZ * 0.34], [o.len * 0.78, o.wid * 0.30, wallZ * 0.68]),
    o.wall,
  ));
  parts.push(part(
    gable(-o.len * 0.40, o.len * 0.40, o.wid * 0.5 + o.wid * 0.15,
      wallZ * 0.78, o.wid * 0.36, wallZ * 0.16),
    o.roof,
  ));
  return parts;
}













export function hayShed(o) {
  const parts = [];
  const legZ = o.h * 0.60;
  
  
  
  
  
  
  
  
  
  
  
  for (const sx of [-0.42, 0.42]) {
    for (const sy of [-0.40, 0.40]) {
      parts.push(part(
        post([o.len * sx, o.wid * sy, 0], [o.len * sx, o.wid * sy, legZ], 0.16, STRAIGHT, 5),
        TIMBER_DARK,
      ));
    }
  }
  
  
  parts.push(part(
    box([0, 0, legZ * 0.34], [o.len * 0.66, o.wid * 0.62, legZ * 0.68]),
    HAY,
  ));
  parts.push(part(gable(-o.len / 2, o.len / 2, 0, o.h, o.wid, o.h - legZ), o.roof));
  return parts;
}


export function waterTank(o) {
  const parts = [];
  parts.push(part(tube([0, 0, 0], [0, 0, o.h * 0.14], o.dia * 1.06, o.dia * 1.06, STRAIGHT, 8), CONCRETE));
  parts.push(part(tube([0, 0, o.h * 0.12], [0, 0, o.h * 0.92], o.dia, o.dia, STRAIGHT, 8), o.colour));
  
  parts.push(part(tube([0, 0, o.h * 0.90], [0, 0, o.h], o.dia * 1.04, o.dia * 1.04, CONE, 8), GALV_DARK));
  return parts;
}










export function windmill(o) {
  const parts = [];
  
  
  
  
  const legR = 0.26;
  const base = o.base;
  const top = o.h * 0.66;
  
  
  
  const feet = [[-base, -base], [base, -base], [base, base], [-base, base]];
  for (let i = 0; i < 4; i += 1) {
    const [fx, fy] = feet[i];
    const tx = fx * 0.22;
    const ty = fy * 0.22;
    parts.push(part(post([fx, fy, 0], [tx, ty, top], legR, STRAIGHT, 4), o.steel));
    const [nx, ny] = feet[(i + 1) % 4];
    for (const t of [0.36, 0.68]) {
      const z = top * t;
      const s = 1 - t * 0.78;
      parts.push(part(
        tube([fx * s, fy * s, z], [nx * s, ny * s, z], 0.20, 0.20, STRAIGHT, 4),
        o.steel,
      ));
    }
  }
  
  
  
  
  
  
  
  const HEAD_YAW = Math.PI / 4;
  const hc = Math.cos(HEAD_YAW);
  const hs = Math.sin(HEAD_YAW);
  
  const hp = (x, y, z) => [x * hc - y * hs, x * hs + y * hc, z];

  
  parts.push(part(box(hp(0, 0, top + 0.35), [1.3, 0.8, 1.0]), o.steel));

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const fanX = 0.22;
  const R = o.fan / 2;
  const fanZ = top + 0.3;
  const BLADES = 12;
  const rim = [];
  for (let i = 0; i < BLADES; i += 1) {
    const a = (i / BLADES) * Math.PI * 2;
    const cy = Math.cos(a);
    const cz = Math.sin(a);
    rim.push([cy * R * 0.97, cz * R * 0.97]);
    parts.push(part(tube(
      hp(fanX, cy * R * 0.26, fanZ + cz * R * 0.26),
      hp(fanX, cy * R * 0.97, fanZ + cz * R * 0.97),
      0.13, R * 0.30, STRAIGHT, 4,
    ), o.steel));
  }
  
  
  for (let i = 0; i < BLADES; i += 1) {
    const [y0, z0] = rim[i];
    const [y1, z1] = rim[(i + 1) % BLADES];
    parts.push(part(tube(
      hp(fanX, y0, fanZ + z0), hp(fanX, y1, fanZ + z1), 0.11, 0.20, STRAIGHT, 4,
    ), o.steel));
  }
  
  parts.push(part(tube(hp(fanX - 0.18, 0, fanZ), hp(fanX + 0.16, 0, fanZ),
    R * 0.34, R * 0.34, STRAIGHT, 8), o.vane));

  
  
  
  
  
  
  
  
  
  
  
  parts.push(part(tube(hp(-0.9, 0, top + 1.05), hp(-3.0, 0, top + 1.05),
    1.9, 0.14, STRAIGHT, 4), o.vane));
  parts.push(part(tube(hp(-0.2, 0, top + 0.45), hp(-1.5, 0, top + 0.45),
    0.17, 0.17, STRAIGHT, 4), o.steel));

  
  
  
  
  parts.push(part(
    tube([base * 2.3, 0, 0], [base * 2.3, 0, o.h * 0.15], o.h * 0.18, o.h * 0.18, STRAIGHT, 8),
    GALV,
  ));
  return parts;
}


export function silo(o) {
  const parts = [];
  parts.push(part(tube([0, 0, 0], [0, 0, o.h * 0.08], o.dia * 1.14, o.dia * 1.14, STRAIGHT, 9), CONCRETE));
  parts.push(part(tube([0, 0, o.h * 0.06], [0, 0, o.h * 0.78], o.dia, o.dia, STRAIGHT, 9), o.colour));
  parts.push(part(tube([0, 0, o.h * 0.76], [0, 0, o.h], o.dia * 1.02, o.dia * 1.02, CONE, 9), GALV_DARK));
  
  
  
  
  
  parts.push(part(
    tube([0, 0, o.h * 0.06], [0, 0, o.h * 0.20], o.dia * 1.34, o.dia * 1.34,
      [[0.00, 1.00, 1.00], [1.00, 0.74, 0.74]], 9),
    o.colour,
  ));
  parts.push(part(
    tube([o.dia * 0.4, 0, o.h * 0.86], [o.dia * 1.5, 0, 0], 0.5, 0.5, STRAIGHT, 4),
    GALV_DARK,
  ));
  
  parts.push(part(
    tube([-o.dia * 0.52, 0, o.h * 0.08], [-o.dia * 0.52, 0, o.h * 0.80], 0.16, 0.16, STRAIGHT, 4),
    GALV_DARK,
  ));
  return parts;
}


export function haystack(o) {
  const parts = [];
  const rand = seeded(o.seed);
  const r = o.size * 0.5;
  const lay = [[-r * 0.92, 0, 0], [r * 0.92, 0, 0], [0, 0, 1]];
  for (let i = 0; i < lay.length; i += 1) {
    const [x, y, tier] = lay[i];
    const z = tier * r * 1.72;
    
    parts.push(part(
      tube([x, y - r * 0.62, z + r], [x, y + r * 0.62, z + r], r * 2, r * 2, STRAIGHT, 8),
      rand() > 0.5 ? o.colour : o.dark,
    ));
  }
  return parts;
}


export function trough(o) {
  const parts = [];
  
  
  
  
  
  const pierZ = o.h * 0.42;
  for (const sx of [-0.34, 0.34]) {
    parts.push(part(box([o.len * sx, 0, pierZ / 2], [o.len * 0.16, o.wid * 0.8, pierZ]), CONCRETE));
  }
  parts.push(part(box([0, 0, pierZ + o.h * 0.29], [o.len, o.wid, o.h * 0.58]), CONCRETE));
  parts.push(part(
    box([0, 0, pierZ + o.h * 0.54], [o.len * 0.86, o.wid * 0.7, o.h * 0.14]),
    '#3f5a5e',
  ));
  return parts;
}


export function logPile(o) {
  const parts = [];
  const rand = seeded(o.seed);
  
  
  
  
  
  
  for (let row = 0; row < 2; row += 1) {
    const n = 4 - row;
    for (let i = 0; i < n; i += 1) {
      const y = (-0.5 + (i + 0.5) / n) * o.wid;
      const z = o.r + row * o.r * 1.7;
      parts.push(part(
        tube([-o.len / 2, y, z], [o.len / 2, y, z], o.r * 2, o.r * 2, STRAIGHT, 6),
        rand() > 0.5 ? TIMBER : TIMBER_DARK,
      ));
    }
  }
  for (const [dx, dy, ang] of [[0.34, 0.92, 0.4], [-0.42, -0.95, -0.25]]) {
    const cx = o.len * dx;
    const cy = o.wid * dy;
    parts.push(part(
      tube([cx - o.len * 0.42, cy - o.wid * ang, o.r],
        [cx + o.len * 0.42, cy + o.wid * ang, o.r], o.r * 2, o.r * 2, STRAIGHT, 6),
      TIMBER_DARK,
    ));
  }
  return parts;
}















export const PROPS = {
  
  gum: {
    role: 'point',
    footprint: 3.0,
    build: () => eucalypt({
      h: 11.5, spread: 8.4, trunk: 0.85, clumps: 4, seed: 1301,
      bark: BARK_PALE, leaf: LEAF, leafDark: LEAF_DARK,
    }),
  },
  gumOld: {
    role: 'point',
    footprint: 4.4,
    build: () => eucalypt({
      h: 15.0, spread: 13.0, trunk: 1.35, clumps: 5, seed: 7717, lean: 0.2,
      bark: BARK_PALE, leaf: LEAF_BLUE, leafDark: LEAF_DARK,
    }),
  },
  gumYoung: {
    role: 'point',
    footprint: 1.7,
    build: () => eucalypt({
      h: 6.2, spread: 4.2, trunk: 0.36, clumps: 3, seed: 2939,
      bark: BARK_SHADE, leaf: LEAF, leafDark: LEAF_DARK,
    }),
  },
  ironbark: {
    role: 'point',
    footprint: 3.4,
    build: () => eucalypt({
      h: 12.4, spread: 9.0, trunk: 1.05, clumps: 4, seed: 5501,
      bark: BARK_DARK, leaf: LEAF_DARK, leafDark: PINE_DARK,
    }),
  },
  deadGum: {
    role: 'point',
    footprint: 2.6,
    build: () => eucalypt({
      h: 9.6, spread: 7.4, trunk: 0.8, clumps: 5, seed: 8837, bare: 1,
      bark: '#cfc8b6', leaf: LEAF, leafDark: LEAF_DARK,
    }),
  },
  cypress: {
    role: 'point',
    footprint: 1.9,
    
    build: () => conifer({ h: 11.4, spread: 2.9, trunk: 0.42, seed: 4409 }),
  },

  
  hedge: {
    role: 'line',
    footprint: 4.2,
    build: () => hedgeRow({ len: 8.0, h: 2.3, thick: 1.9, lumps: 6, seed: 6247, colour: HEDGE, dark: HEDGE_DARK }),
  },
  hedgeLow: {
    role: 'line',
    footprint: 4.0,
    build: () => hedgeRow({ len: 8.0, h: 1.5, thick: 1.5, lumps: 6, seed: 3313, colour: SALT_BUSH, dark: SALT_DARK }),
  },
  fence: {
    role: 'line',
    footprint: 4.6,
    build: () => fenceRun({ len: 9.0, h: 1.25, posts: 5, postR: 0.11, timber: TIMBER }),
  },
  gate: {
    role: 'line',
    footprint: 2.4,
    build: () => farmGate({ len: 4.2, h: 1.35, postR: 0.19 }),
  },

  
  boulder: {
    role: 'point',
    footprint: 1.9,
    build: () => boulders({ size: 3.4, count: 1, seed: 9091, colour: ROCK, dark: ROCK_DARK }),
  },
  rockPile: {
    role: 'point',
    footprint: 3.0,
    build: () => boulders({ size: 5.4, count: 4, seed: 1223, colour: ROCK, dark: ROCK_DARK }),
  },
  saltbush: {
    role: 'point',
    footprint: 1.5,
    build: () => shrub({ size: 2.6, h: 1.5, lumps: 3, seed: 3767, colour: SALT_BUSH, dark: SALT_DARK }),
  },
  wattle: {
    role: 'point',
    footprint: 1.9,
    build: () => shrub({ size: 3.4, h: 2.8, lumps: 4, seed: 7013, colour: WATTLE, dark: LEAF_DARK }),
  },
  reeds: {
    role: 'point',
    footprint: 1.6,
    build: () => reedClump({ size: 2.6, h: 2.4, stems: 11, seed: 4127 }),
  },
  stump: {
    role: 'point',
    footprint: 1.3,
    build: () => stump({ size: 1.3, h: 1.15, seed: 5779 }),
  },

  
  shed: {
    role: 'line',
    footprint: 4.6,
    build: () => machineryShed({ len: 10.4, wid: 5.0, h: 4.3, wall: GALV, roof: GALV_DARK }),
  },
  shedRust: {
    role: 'line',
    footprint: 3.6,
    build: () => hayShed({ len: 7.4, wid: 4.4, h: 4.0, roof: RUST }),
  },
  tank: {
    role: 'point',
    footprint: 2.3,
    
    
    
    
    build: () => waterTank({ dia: 3.4, h: 5.2, colour: GALV }),
  },
  windmill: {
    role: 'mark',
    footprint: 2.6,
    build: () => windmill({ h: 17.0, base: 1.75, fan: 4.4, steel: GALV_DARK, vane: RUST }),
  },
  silo: {
    role: 'mark',
    footprint: 2.4,
    build: () => silo({ dia: 4.0, h: 10.5, colour: GALV }),
  },
  haystack: {
    
    
    
    
    
    role: 'line',
    footprint: 2.8,
    build: () => haystack({ size: 2.4, seed: 8081, colour: HAY, dark: HAY_DARK }),
  },
  trough: {
    role: 'line',
    footprint: 2.6,
    build: () => trough({ len: 5.0, wid: 1.0, h: 0.7 }),
  },
  logPile: {
    role: 'line',
    footprint: 2.4,
    build: () => logPile({ len: 4.6, wid: 2.0, r: 0.28, seed: 2617 }),
  },
};









export const PROP_MESH_IDS = Object.freeze(Object.keys(PROPS).sort());


export const PROP_IDS = PROP_MESH_IDS;


export const LINE_PROPS = Object.freeze(PROP_IDS.filter((id) => PROPS[id].role === 'line'));

export const POINT_PROPS = Object.freeze(PROP_IDS.filter((id) => PROPS[id].role === 'point'));

export const MARK_PROPS = Object.freeze(PROP_IDS.filter((id) => PROPS[id].role === 'mark'));








export function buildPropMesh(id) {
  const spec = PROPS[id];
  if (!spec) throw new Error(`no prop mesh: ${id}`);
  return spec.build();
}


export function propTris(parts) {
  return parts.reduce((n, p) => n + p.mesh.tris, 0);
}













































































export const PROP_TILT_RAD = (48 * Math.PI) / 180;


const PROP_AIR = 1.20;


export const PROP_DRAW_SCALE = 2.8;


const PROP_DRAW = {
  hedge: 2.0,
  hedgeLow: 2.0,
  fence: 2.0,
  gate: 2.2,
  trough: 2.2,
  logPile: 2.2,
  shed: 2.4,
  shedRust: 2.4,
  tank: 2.4,
  haystack: 2.4,
  windmill: 3.0,
  silo: 3.0,
};


export const propDraw = (id) => (PROP_DRAW[id] === undefined ? PROP_DRAW_SCALE : PROP_DRAW[id]);
















export function propFrame(id) {
  const parts = buildPropMesh(id);
  const b = partsBounds(parts);
  const sizeX = b.max[0] - b.min[0];
  const sizeY = b.max[1] - b.min[1];
  const sizeZ = b.max[2] - b.min[2];
  const ct = Math.cos(PROP_TILT_RAD);
  const st = Math.sin(PROP_TILT_RAD);
  
  
  
  const vMin = (-sizeY / 2) * ct;
  const vMax = (sizeY / 2) * ct + sizeZ * st;
  const vHalf = (vMax - vMin) / 2;
  const vMid = (vMax + vMin) / 2;
  const hHalf = Math.max(sizeX, sizeY) * 0.5;
  const half = Math.max(hHalf, vHalf) * PROP_AIR;
  return {
    half,
    lookZ: vMid / st,
    worldSize: half * 2,
    drawSize: half * 2 * propDraw(id),
    
    footY: (half - vMid) / (2 * half),
  };
}

