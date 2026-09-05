























import { emptyMesh, pushQuad, mergeMeshes, tubeAlong, jointBall } from '../../ps1/ps1Mesh.mjs';

const UV = [0, 0];








export function box(centre, size) {
  const m = emptyMesh();
  const [cx, cy, cz] = centre;
  const [sx, sy, sz] = size;
  const x0 = cx - sx / 2; const x1 = cx + sx / 2;
  const y0 = cy - sy / 2; const y1 = cy + sy / 2;
  const z0 = cz - sz / 2; const z1 = cz + sz / 2;
  const p = (x, y, z) => [x, y, z];
  
  pushQuad(m, p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1), UV, UV, UV, UV); 
  pushQuad(m, p(x0, y1, z0), p(x1, y1, z0), p(x1, y0, z0), p(x0, y0, z0), UV, UV, UV, UV); 
  pushQuad(m, p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1), UV, UV, UV, UV); 
  pushQuad(m, p(x0, y1, z0), p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), UV, UV, UV, UV); 
  pushQuad(m, p(x0, y1, z0), p(x0, y1, z1), p(x1, y1, z1), p(x1, y1, z0), UV, UV, UV, UV); 
  pushQuad(m, p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1), UV, UV, UV, UV); 
  return m;
}


const limb = (a, b, r) => tubeAlong(a, b, { r0: r, r1: r * 0.72, sides: 5 });

const part = (mesh, colour) => ({ mesh, colour });





















export function quadruped(o) {
  const legTop = o.height * 0.52;
  const bodyZ = o.height * 0.72;
  const parts = [
    part(box([0, 0, bodyZ], [o.len * 0.62, o.girth, o.height * 0.42]), o.body),
  ];
  
  const lx = o.len * 0.24;
  const ly = o.girth * 0.36;
  const r = o.girth * 0.15;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      parts.push(part(limb([sx * lx, sy * ly, legTop], [sx * lx * 0.94, sy * ly, 0], r), o.body));
    }
  }
  
  const headX = o.len * 0.38 + (o.snout || 0);
  const headZ = bodyZ + (o.neck || o.height * 0.12);
  parts.push(part(limb([o.len * 0.26, 0, bodyZ + o.height * 0.06], [headX * 0.86, 0, headZ], o.girth * 0.22), o.body));
  parts.push(part(box([headX, 0, headZ], [o.len * 0.2, o.girth * 0.56, o.height * 0.2]), o.body));
  if (o.ears) {
    for (const sy of [-1, 1]) {
      parts.push(part(box([headX - o.len * 0.05, sy * o.girth * 0.24, headZ + o.height * 0.13],
        [o.len * 0.05, o.girth * 0.1, o.ears]), o.accent));
    }
  }
  if (o.trunk) {
    parts.push(part(limb([headX + o.len * 0.08, 0, headZ - o.height * 0.02],
      [headX + o.len * 0.08, 0, headZ - o.trunk], o.girth * 0.11), o.body));
  }
  if (o.mane) {
    parts.push(part(box([o.len * 0.2, 0, bodyZ + o.height * 0.22],
      [o.len * 0.22, o.girth * 0.9, o.height * 0.18 * o.mane]), o.accent));
  }
  if (o.tail) {
    parts.push(part(limb([-o.len * 0.32, 0, bodyZ + o.height * 0.06],
      [-o.len * 0.32 - o.tail, 0, bodyZ - o.height * 0.08], o.girth * 0.07), o.accent));
  }
  return parts;
}


export function bird(o) {
  const bodyZ = o.height * 0.5;
  const parts = [
    part(box([0, 0, bodyZ], [o.len * 0.62, o.girth, o.height * 0.46]), o.body),
  ];
  for (const sy of [-1, 1]) {
    parts.push(part(limb([o.len * 0.05, sy * o.girth * 0.2, o.height * 0.3],
      [o.len * 0.05, sy * o.girth * 0.2, 0], o.girth * 0.09), o.accent));
  }
  const headZ = bodyZ + o.height * 0.34;
  const headX = o.len * 0.3;
  parts.push(part(limb([o.len * 0.16, 0, bodyZ + o.height * 0.16], [headX, 0, headZ], o.girth * 0.16), o.body));
  parts.push(part(box([headX, 0, headZ], [o.len * 0.17, o.girth * 0.44, o.height * 0.19]), o.body));
  parts.push(part(box([headX + o.len * 0.12, 0, headZ - o.height * 0.02],
    [o.len * 0.11, o.girth * 0.16, o.height * 0.06]), o.accent));
  if (o.comb) {
    parts.push(part(box([headX - o.len * 0.01, 0, headZ + o.height * 0.12],
      [o.len * 0.08, o.girth * 0.06, o.height * 0.1]), o.accent));
  }
  
  for (const sy of [-1, 1]) {
    if (o.spread) {
      parts.push(part(box([0, sy * o.girth * (0.4 + o.spread * 0.5), bodyZ + o.height * 0.1],
        [o.len * 0.44, o.girth * o.spread, o.height * 0.07]), o.body));
    } else {
      parts.push(part(box([-o.len * 0.02, sy * o.girth * 0.52, bodyZ],
        [o.len * 0.42, o.girth * 0.12, o.height * 0.3]), o.body));
    }
  }
  parts.push(part(box([-o.len * 0.34, 0, bodyZ + o.height * 0.16],
    [o.len * 0.16, o.girth * 0.5, o.height * 0.22]), o.accent));
  return parts;
}


export function humanoid(o) {
  const h = o.height;
  const parts = [
    part(box([0, 0, h * 0.62], [h * 0.17, h * 0.3, h * 0.34]), o.body),          
    part(box([0, 0, h * 0.88], [h * 0.16, h * 0.16, h * 0.16]), o.skin),         
    part(box([h * 0.02, 0, h * 0.96], [h * 0.2, h * 0.21, h * 0.05]), o.accent), 
  ];
  for (const sy of [-1, 1]) {
    parts.push(part(limb([0, sy * h * 0.15, h * 0.74], [h * 0.05, sy * h * 0.17, h * 0.48], h * 0.045), o.body));
    parts.push(part(limb([0, sy * h * 0.08, h * 0.45], [0, sy * h * 0.09, 0], h * 0.055), o.legs));
  }
  if (o.tool) {
    parts.push(part(box([h * 0.14, -h * 0.16, h * 0.55], [h * 0.05, h * 0.05, h * 0.4]), o.accent));
  }
  return parts;
}







export function vehicle(o) {
  const parts = [];
  const bodyZ = o.wheel * 1.15;
  parts.push(part(box([0, 0, bodyZ + o.height * 0.3], [o.len * 0.86, o.width, o.height * 0.5]), o.body));
  
  
  
  
  
  
  if (o.cab) {
    parts.push(part(box([-o.len * 0.16, 0, bodyZ + o.height * 0.9],
      [o.len * 0.3, o.width * 0.72, o.height * 0.72]), o.cabColour || o.accent));
    
    parts.push(part(box([-o.len * 0.16, 0, bodyZ + o.height * 1.16],
      [o.len * 0.24, o.width * 0.76, o.height * 0.24]), '#8fb6d8'));
  }
  
  
  
  
  
  
  
  
  
  
  
  const wheels = o.wheels === undefined ? 2 : o.wheels;
  for (let i = 0; i < wheels; i += 1) {
    const t = wheels === 1 ? 0 : (i / (wheels - 1)) - 0.5;
    const x = t * o.len * 0.62;
    for (const sy of [-1, 1]) {
      const r = o.bigRear && x < 0 ? o.wheel * 1.35 : o.wheel;
      parts.push(part(box([x, sy * o.width * 0.46, r], [r * 2, o.width * 0.14, r * 2]), '#22262b'));
    }
  }
  
  
  
  if (o.boom) {
    
    parts.push(part(box([o.len * 0.5, 0, bodyZ + o.height * 0.3],
      [o.len * 0.16, o.width * 1.25, o.height * 0.5]), o.accent));
    for (let i = -2; i <= 2; i += 1) {
      parts.push(part(box([o.len * 0.6, i * o.width * 0.24, bodyZ + o.height * 0.3],
        [o.len * 0.08, o.width * 0.05, o.height * 0.16]), '#d8d2bd'));
    }
  }
  if (o.tank) {
    
    parts.push(part(limb([-o.len * 0.24, 0, bodyZ + o.height * 1.0],
      [o.len * 0.3, 0, bodyZ + o.height * 1.0], o.height * 0.42), o.accent));
  }
  if (o.crate) {
    parts.push(part(box([-o.len * 0.06, 0, bodyZ + o.height * 1.0],
      [o.len * 0.52, o.width * 0.92, o.height * 0.86]), o.accent));
    
    if (o.barred) {
      for (let i = -1; i <= 1; i += 1) {
        parts.push(part(box([-o.len * 0.06 + i * o.len * 0.16, o.width * 0.47,
          bodyZ + o.height * 1.0], [o.len * 0.04, o.width * 0.04, o.height * 0.86]), '#2b2f34'));
      }
    }
  }
  if (o.exhaust) {
    parts.push(part(limb([o.len * 0.22, o.width * 0.3, bodyZ + o.height * 0.55],
      [o.len * 0.22, o.width * 0.3, bodyZ + o.height * 1.5], o.width * 0.06), '#3a3f45'));
  }
  return parts;
}


export function aircraft(o) {
  const z = o.height;
  return [
    part(limb([-o.len * 0.42, 0, z], [o.len * 0.5, 0, z], o.width * 0.15), o.body),
    part(box([0, 0, z + o.width * 0.12], [o.len * 0.14, o.width * 1.5, o.width * 0.06]), o.body),
    part(box([-o.len * 0.36, 0, z + o.width * 0.16], [o.len * 0.1, o.width * 0.5, o.width * 0.05]), o.accent),
    part(box([-o.len * 0.38, 0, z + o.width * 0.24], [o.len * 0.08, o.width * 0.05, o.width * 0.22]), o.accent),
    part(box([o.len * 0.06, 0, z + o.width * 0.2], [o.len * 0.16, o.width * 0.18, o.width * 0.18]), o.cabColour || o.accent),
    
    
    part(box([o.len * 0.5, 0, z], [o.width * 0.03, o.width * 0.9, o.width * 0.9]), '#3a3f45'),
  ];
}








const HERD_BODY = '#7d9b4e';
const HERD_DARK = '#4e6b33';
const YIELD_BODY = '#8b9099';
const YIELD_ACCENT = '#e8701a';
const STEEL = '#5b636d';

export const UNIT_MESHES = {
  
  flock: () => bird({
    len: 0.62, height: 0.72, girth: 0.3, body: '#d8cdb4', accent: '#b6392c', comb: 1,
  }),
  duckRaft: () => bird({
    len: 0.6, height: 0.56, girth: 0.32, body: '#e0dcc8', accent: '#d8b54a',
  }),
  wing: () => bird({
    len: 1.1, height: 0.8, girth: 0.34, body: '#6b5843', accent: '#e8c65a', spread: 1.6,
  }),
  skulk: () => quadruped({
    len: 1.05, height: 0.55, girth: 0.26, body: '#b4622c', accent: '#e8dccb',
    ears: 0.14, tail: 0.4, snout: 0.06,
  }),
  sounder: () => quadruped({
    len: 1.35, height: 0.86, girth: 0.52, body: '#c88f86', accent: '#7d4a44',
    ears: 0.1, tail: 0.12, snout: 0.05,
  }),
  horseHerd: () => quadruped({
    len: 2.3, height: 1.62, girth: 0.6, body: '#6b4a30', accent: '#2b1d12',
    ears: 0.16, tail: 0.55, mane: 1, neck: 0.5,
  }),
  pride: () => quadruped({
    len: 1.9, height: 1.0, girth: 0.46, body: '#c39a52', accent: '#7a5a2a',
    ears: 0.1, tail: 0.5, mane: 0.8,
  }),
  elephant: () => quadruped({
    len: 3.6, height: 2.9, girth: 1.5, body: '#8d8b86', accent: '#6d6b66',
    ears: 0.75, tail: 0.5, trunk: 1.5, neck: 0.15,
  }),

  
  farmhand: () => humanoid({
    height: 1.75, body: '#3f6fa3', skin: '#c99b74', accent: YIELD_ACCENT, legs: '#2f3a46', tool: 1,
  }),
  harvester: () => vehicle({
    len: 4.2, width: 2.0, height: 1.5, wheel: 0.5, wheels: 2, bigRear: 1,
    body: YIELD_BODY, accent: '#c9b25a', cab: 1, cabColour: '#2f5d8c', boom: 1,
  }),
  bowser: () => vehicle({
    len: 4.0, width: 1.9, height: 1.4, wheel: 0.45, wheels: 3,
    body: STEEL, accent: '#2f9e9e', cab: 1, tank: 1,
  }),
  quadBike: () => vehicle({
    len: 1.9, width: 1.1, height: 0.8, wheel: 0.32, wheels: 2,
    body: '#b03a2a', accent: '#2b2f34',
  }),
  poundWagon: () => vehicle({
    len: 4.4, width: 2.0, height: 1.6, wheel: 0.42, wheels: 3,
    body: '#6f7681', accent: '#4a5158', cab: 1, cabColour: YIELD_BODY,
    crate: 1, barred: 1,
  }),
  foodTruck: () => vehicle({
    len: 4.6, width: 2.1, height: 1.7, wheel: 0.44, wheels: 3,
    body: '#d8d2bd', accent: '#b6392c', cab: 1, crate: 1,
  }),
  tractor: () => vehicle({
    len: 3.6, width: 2.0, height: 1.6, wheel: 0.55, wheels: 2, bigRear: 1,
    body: '#2f7a3f', accent: YIELD_ACCENT, cab: 1, cabColour: '#2f7a3f', exhaust: 1,
  }),
  combine: () => vehicle({
    len: 6.0, width: 3.0, height: 2.4, wheel: 0.7, wheels: 2, bigRear: 1,
    body: '#c94f2a', accent: '#d8c98a', cab: 1, cabColour: '#2f3a46', boom: 1,
  }),
  cropDuster: () => aircraft({
    len: 5.0, width: 2.0, height: 1.0, body: '#d8b54a', accent: '#b6392c', cabColour: '#2f3a46',
  }),
};


export const MESH_IDS = Object.freeze(Object.keys(UNIT_MESHES).sort());








export function buildUnitMesh(id) {
  const make = UNIT_MESHES[id];
  if (!make) throw new Error(`no mesh for unit: ${id}`);
  return make();
}


export function meshByColour(parts) {
  const byColour = new Map();
  for (const p of parts) {
    if (!byColour.has(p.colour)) byColour.set(p.colour, []);
    byColour.get(p.colour).push(p.mesh);
  }
  
  
  return [...byColour.keys()].sort().map((c) => ({ colour: c, mesh: mergeMeshes(byColour.get(c)) }));
}


export function partsBounds(parts) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) {
    const pos = p.mesh.positions;
    for (let i = 0; i < pos.length; i += 3) {
      for (let a = 0; a < 3; a += 1) {
        if (pos[i + a] < min[a]) min[a] = pos[i + a];
        if (pos[i + a] > max[a]) max[a] = pos[i + a];
      }
    }
  }
  return { min, max };
}
