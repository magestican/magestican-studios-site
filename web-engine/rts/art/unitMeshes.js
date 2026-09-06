


























































import { emptyMesh, pushQuad, mergeMeshes, tubeAlong } from '../../ps1/ps1Mesh.mjs';

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


const TAPER = [[0.00, 1.00, 1.00], [1.00, 0.68, 0.68]];

const BARREL = [[0.00, 0.62, 0.62], [0.22, 1.00, 1.00], [0.78, 1.00, 1.00], [1.00, 0.66, 0.66]];










const tube = (a, b, w, d, profile = TAPER) => tubeAlong(a, b, {
  w, d, sides: 6, profile,
});


const limb = (a, b, r) => tube(a, b, r * 2, r * 2);

const part = (mesh, colour) => ({ mesh, colour });

























export function quadruped(o) {
  const legTop = o.height * 0.54;
  const bodyZ = o.height * 0.70;
  const depth = o.girth * (o.squat || 0.92);
  const parts = [
    
    
    
    
    part(tube([-o.len * 0.30, 0, bodyZ], [o.len * 0.32, 0, bodyZ],
      o.girth, depth, BARREL), o.body),
  ];
  
  
  const lx = o.len * 0.24;
  const ly = o.girth * 0.32;
  const r = o.girth * 0.16;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      
      
      
      
      
      
      parts.push(part(limb([sx * lx, sy * ly, legTop],
        [sx * lx * 0.92, sy * ly * 1.45, r * 0.45], r), o.body));
    }
  }
  
  const headX = o.len * 0.40 + (o.snout || 0);
  const headZ = bodyZ + (o.neck || o.height * 0.10);
  parts.push(part(tube([o.len * 0.24, 0, bodyZ + o.height * 0.05],
    [headX * 0.88, 0, headZ], o.girth * 0.52, o.girth * 0.52), o.body));
  parts.push(part(box([headX, 0, headZ],
    [o.len * 0.22, o.girth * 0.62, o.height * 0.24]), o.body));
  if (o.ears) {
    
    
    
    const out = o.earOut || 0.3;
    for (const sy of [-1, 1]) {
      parts.push(part(box([headX - o.len * 0.05, sy * o.girth * out, headZ + o.ears * 0.22],
        [o.len * 0.13, o.girth * out * 0.9, o.ears]), o.accent));
    }
  }
  if (o.trunk) {
    parts.push(part(limb([headX + o.len * 0.07, 0, headZ - o.height * 0.03],
      [headX + o.len * 0.13, 0, Math.max(0.05, headZ - o.trunk)], o.girth * 0.15), o.body));
  }
  if (o.tusk) {
    for (const sy of [-1, 1]) {
      parts.push(part(limb([headX + o.len * 0.04, sy * o.girth * 0.16, headZ - o.height * 0.05],
        [headX + o.len * 0.04 + o.tusk, sy * o.girth * 0.26, headZ - o.height * 0.02],
        o.girth * 0.06), '#e8e2cf'));
    }
  }
  if (o.mane) {
    
    
    parts.push(part(tube([o.len * 0.10, 0, bodyZ + o.height * 0.10],
      [o.len * 0.30, 0, bodyZ + o.height * 0.16],
      o.girth * (1.0 + o.mane * 0.9), o.height * (0.5 + o.mane * 0.4), BARREL), o.accent));
  }
  if (o.tail) {
    const t = o.girth * (o.brush || 0.16);
    parts.push(part(limb([-o.len * 0.30, 0, bodyZ + o.height * 0.06],
      [-o.len * 0.30 - o.tail, 0, bodyZ - o.height * 0.10], t), o.accent));
  }
  return parts;
}


export function bird(o) {
  const bodyZ = o.height * 0.46;
  const parts = [
    part(tube([-o.len * 0.34, 0, bodyZ], [o.len * 0.28, 0, bodyZ],
      o.girth, o.height * 0.56, BARREL), o.body),
  ];
  for (const sy of [-1, 1]) {
    
    
    parts.push(part(limb([o.len * 0.04, sy * o.girth * 0.24, o.height * 0.28],
      [o.len * 0.04, sy * o.girth * 0.30, o.girth * 0.06], o.girth * 0.10), o.accent));
  }
  const headZ = bodyZ + o.height * 0.38;
  const headX = o.len * 0.30;
  parts.push(part(tube([o.len * 0.14, 0, bodyZ + o.height * 0.14], [headX, 0, headZ],
    o.girth * 0.42, o.girth * 0.42), o.body));
  parts.push(part(box([headX, 0, headZ], [o.len * 0.18, o.girth * 0.48, o.height * 0.21]), o.body));
  parts.push(part(box([headX + o.len * 0.13, 0, headZ - o.height * 0.02],
    [o.len * 0.13, o.girth * (o.bill || 0.18), o.height * 0.06]), o.accent));
  if (o.comb) {
    parts.push(part(box([headX - o.len * 0.01, 0, headZ + o.height * 0.14],
      [o.len * 0.10, o.girth * 0.07, o.height * 0.14]), o.accent));
  }
  
  
  
  
  
  
  for (const sy of [-1, 1]) {
    if (o.spread) {
      
      
      
      
      
      
      
      
      
      const span = o.len * o.spread;
      
      
      
      
      const rise = o.height * 0.42;
      parts.push(part(box([o.len * 0.02, sy * span * 0.34, bodyZ + o.height * 0.16 + rise * 0.3],
        [o.len * 0.46, span * 0.68, o.height * 0.09]), o.body));
      parts.push(part(box([-o.len * 0.22, sy * span * 0.76, bodyZ + o.height * 0.16 + rise * 0.8],
        [o.len * 0.26, span * 0.50, o.height * 0.08]), o.body));
      for (let f = 0; f < 3; f += 1) {
        parts.push(part(box([-o.len * (0.34 + f * 0.10), sy * span * (1.02 + f * 0.03),
          bodyZ + o.height * 0.16 + rise * (1.05 + f * 0.10)],
        [o.len * 0.20, span * 0.10, o.height * 0.07]), o.accent));
      }
    } else {
      parts.push(part(box([-o.len * 0.02, sy * o.girth * 0.54, bodyZ],
        [o.len * 0.44, o.girth * 0.16, o.height * 0.34]), o.body));
    }
  }
  
  
  parts.push(part(box([-o.len * 0.42, 0, bodyZ + o.height * 0.12],
    [o.len * 0.24, o.girth * (o.fan || 0.9), o.height * 0.10]), o.accent));
  if (o.raft) {
    
    
    
    
    
    const rl = o.len * 1.55;
    const logs = 4;
    for (let i = 0; i < logs; i += 1) {
      const y = (i / (logs - 1) - 0.5) * o.girth * 2.5;
      parts.push(part(tube([-rl * 0.5, y, o.girth * 0.16], [rl * 0.5, y, o.girth * 0.16],
        o.girth * 0.30, o.girth * 0.26, BARREL), o.raftColour || '#7a5f3c'));
    }
    
    for (const sx of [-1, 1]) {
      parts.push(part(box([sx * rl * 0.34, 0, o.girth * 0.30],
        [o.len * 0.10, o.girth * 2.7, o.girth * 0.10]), o.raftLash || '#54402a'));
    }
  }
  return parts;
}


export function humanoid(o) {
  const h = o.height;
  const parts = [
    part(box([0, 0, h * 0.62], [h * 0.19, h * 0.32, h * 0.34]), o.body),          
    part(box([0, 0, h * 0.88], [h * 0.16, h * 0.16, h * 0.16]), o.skin),          
    
    
    
    part(box([h * 0.02, 0, h * 0.965], [h * 0.30, h * 0.30, h * 0.045]), o.accent),
    part(box([h * 0.01, 0, h * 1.0], [h * 0.15, h * 0.15, h * 0.06]), o.accent),
  ];
  for (const sy of [-1, 1]) {
    parts.push(part(limb([0, sy * h * 0.16, h * 0.74], [h * 0.06, sy * h * 0.19, h * 0.46], h * 0.05), o.body));
    parts.push(part(limb([0, sy * h * 0.08, h * 0.45], [0, sy * h * 0.10, 0], h * 0.06), o.legs));
  }
  if (o.tool) {
    parts.push(part(box([h * 0.15, -h * 0.18, h * 0.60], [h * 0.06, h * 0.06, h * 0.62]), o.accent));
  }
  return parts;
}







export function vehicle(o) {
  const parts = [];
  const bodyZ = o.wheel * 1.15;
  
  
  
  const cw = o.chassisW === undefined ? 1 : o.chassisW;
  parts.push(part(box([0, 0, bodyZ + o.height * 0.3],
    [o.len * 0.86, o.width * cw, o.height * 0.5]), o.body));
  
  
  
  
  
  
  if (o.cab) {
    parts.push(part(box([-o.len * 0.16, 0, bodyZ + o.height * 0.95],
      [o.len * 0.32, o.width * 0.76, o.height * 0.82]), o.cabColour || o.accent));
    
    parts.push(part(box([-o.len * 0.16, 0, bodyZ + o.height * 1.24],
      [o.len * 0.26, o.width * 0.80, o.height * 0.26]), '#a8cbe6'));
    
    
    
    parts.push(part(box([-o.len * 0.16, 0, bodyZ + o.height * 1.40],
      [o.len * 0.40, o.width * 0.92, o.height * 0.10]), o.accent));
  }
  
  
  
  
  
  
  
  
  
  
  
  const wheels = o.wheels === undefined ? 2 : o.wheels;
  for (let i = 0; i < wheels; i += 1) {
    const t = wheels === 1 ? 0 : (i / (wheels - 1)) - 0.5;
    const x = t * o.len * 0.62;
    for (const sy of [-1, 1]) {
      
      
      
      
      const r = o.bigRear && x < 0 ? o.wheel * (o.rearScale || 1.35) : o.wheel;
      parts.push(part(box([x, sy * o.width * 0.48, r], [r * 2, o.width * 0.16, r * 2]), '#22262b'));
    }
  }
  
  
  
  if (o.boom) {
    
    
    parts.push(part(box([o.len * 0.50, 0, bodyZ + o.height * 0.26],
      [o.len * 0.18, o.width * 1.45, o.height * 0.52]), o.accent));
    for (let i = -3; i <= 3; i += 1) {
      parts.push(part(box([o.len * 0.62, i * o.width * 0.20, bodyZ + o.height * 0.26],
        [o.len * 0.10, o.width * 0.05, o.height * 0.18]), '#e6e0cb'));
    }
  }
  if (o.chute) {
    
    
    
    
    
    const z0 = bodyZ + o.height * 1.15;
    parts.push(part(tube([-o.len * 0.06, o.width * 0.24, z0],
      [o.len * 0.16, o.width * 1.05, z0 + o.height * 0.42],
      o.width * 0.20, o.width * 0.20, BARREL), o.accent));
    parts.push(part(box([o.len * 0.17, o.width * 1.08, z0 + o.height * 0.30],
      [o.len * 0.13, o.width * 0.26, o.height * 0.34]), '#3a3f45'));
  }
  if (o.tower) {
    
    
    
    parts.push(part(box([o.len * 0.30, 0, bodyZ + o.height * 1.30],
      [o.len * 0.20, o.width * 0.40, o.height * 1.75]), o.accent));
    parts.push(part(box([o.len * 0.30, 0, bodyZ + o.height * 2.12],
      [o.len * 0.36, o.width * 0.54, o.height * 0.16]), '#3a3f45'));
    
    parts.push(part(box([o.len * 0.44, 0, bodyZ + o.height * 0.30],
      [o.len * 0.14, o.width * 0.80, o.height * 0.44]), '#3a3f45'));
  }
  if (o.tank) {
    
    
    
    
    
    
    
    if (o.upright) {
      
      
      
      
      
      parts.push(part(tube([-o.len * 0.06, 0, bodyZ + o.height * 0.45],
        [-o.len * 0.06, 0, bodyZ + o.height * 2.35],
        o.width * 1.12, o.width * 1.12, BARREL), o.accent));
      parts.push(part(tube([-o.len * 0.06, 0, bodyZ + o.height * 2.30],
        [-o.len * 0.06, 0, bodyZ + o.height * 2.62],
        o.width * 0.92, o.width * 0.92, BARREL), '#3a3f45'));
    } else {
      parts.push(part(tube([-o.len * 0.34, 0, bodyZ + o.height * 1.15],
        [o.len * 0.30, 0, bodyZ + o.height * 1.15],
        o.height * 1.5, o.height * 1.5, BARREL), o.accent));
    }
    
    
    parts.push(part(tube([-o.len * 0.46, 0, bodyZ + o.height * 0.95],
      [-o.len * 0.38, 0, bodyZ + o.height * 0.95],
      o.height * 0.78, o.height * 0.78), '#3a3f45'));
  }
  if (o.awning) {
    
    
    
    
    parts.push(part(box([-o.len * 0.06, 0, bodyZ + o.height * 1.15],
      [o.len * 0.62, o.width * 0.94, o.height * 1.10]), o.body));
    parts.push(part(box([-o.len * 0.06, -o.width * 0.78, bodyZ + o.height * 1.62],
      [o.len * 0.60, o.width * 0.62, o.height * 0.09]), o.accent));
    parts.push(part(box([-o.len * 0.06, -o.width * 0.50, bodyZ + o.height * 1.15],
      [o.len * 0.52, o.width * 0.05, o.height * 0.52]), '#3a3f45'));
    
    parts.push(part(box([o.len * 0.10, o.width * 0.18, bodyZ + o.height * 1.78],
      [o.len * 0.16, o.width * 0.30, o.height * 0.22]), '#3a3f45'));
  }
  if (o.cage) {
    
    
    
    
    
    
    
    const cz = bodyZ + o.height * 0.62;
    const ch = o.height * 1.15;
    parts.push(part(box([-o.len * 0.06, 0, cz],
      [o.len * 0.58, o.width * 0.94, o.height * 0.12]), o.accent));
    for (const sy of [-1, 1]) {
      for (let i = -3; i <= 3; i += 1) {
        parts.push(part(box([-o.len * 0.06 + i * o.len * 0.082, sy * o.width * 0.46,
          cz + ch * 0.5], [o.len * 0.026, o.width * 0.05, ch]), '#2b2f34'));
      }
      parts.push(part(box([-o.len * 0.06, sy * o.width * 0.46, cz + ch],
        [o.len * 0.58, o.width * 0.07, o.height * 0.10]), '#2b2f34'));
    }
    
    parts.push(part(box([-o.len * 0.34, 0, cz + ch * 0.5],
      [o.len * 0.04, o.width * 0.90, ch]), o.accent));
    
    
    
    
    for (let i = -1; i <= 1; i += 1) {
      parts.push(part(box([-o.len * 0.62, i * o.width * 0.30, cz * 0.42],
        [o.len * 0.34, o.width * 0.22, o.height * 0.09]), o.accent));
    }
    parts.push(part(box([-o.len * 0.80, 0, o.height * 0.05],
      [o.len * 0.10, o.width * 1.02, o.height * 0.10]), '#2b2f34'));
  }
  if (o.bike) {
    
    
    
    
    
    
    parts.push(part(box([o.len * 0.20, 0, bodyZ + o.height * 0.92],
      [o.len * 0.07, o.width * 0.10, o.height * 0.62]), '#2b2f34'));
    parts.push(part(box([o.len * 0.20, 0, bodyZ + o.height * 1.22],
      [o.len * 0.06, o.width * 1.02, o.height * 0.09]), '#2b2f34'));
    parts.push(part(box([-o.len * 0.04, 0, bodyZ + o.height * 1.05],
      [o.len * 0.26, o.width * 0.42, o.height * 0.90]), o.riderBody || '#4a83bd'));
    parts.push(part(box([-o.len * 0.06, 0, bodyZ + o.height * 1.78],
      [o.len * 0.19, o.width * 0.30, o.height * 0.44]), o.skin || '#d8ad86'));
    parts.push(part(box([-o.len * 0.36, 0, bodyZ + o.height * 0.78],
      [o.len * 0.22, o.width * 0.78, o.height * 0.10]), o.accent));
  }
  if (o.crate) {
    parts.push(part(box([-o.len * 0.04, 0, bodyZ + o.height * 1.05],
      [o.len * 0.56, o.width * 0.94, o.height * 0.96]), o.accent));
    
    if (o.barred) {
      for (let i = -1; i <= 1; i += 1) {
        for (const sy of [-1, 1]) {
          parts.push(part(box([-o.len * 0.04 + i * o.len * 0.17, sy * o.width * 0.48,
            bodyZ + o.height * 1.05], [o.len * 0.05, o.width * 0.05, o.height * 0.96]), '#2b2f34'));
        }
      }
    }
  }
  if (o.linkage) {
    
    
    for (const sy of [-1, 1]) {
      parts.push(part(box([-o.len * 0.58, sy * o.width * 0.22, bodyZ + o.height * 0.18],
        [o.len * 0.22, o.width * 0.09, o.height * 0.12]), '#3a3f45'));
    }
    parts.push(part(box([-o.len * 0.55, 0, bodyZ + o.height * 0.52],
      [o.len * 0.16, o.width * 0.07, o.height * 0.10]), '#3a3f45'));
  }
  if (o.exhaust) {
    
    
    parts.push(part(limb([o.len * 0.26, o.width * 0.32, bodyZ + o.height * 0.55],
      [o.len * 0.26, o.width * 0.32, bodyZ + o.height * 1.9], o.width * 0.075), '#3a3f45'));
  }
  return parts;
}


export function aircraft(o) {
  const z = o.height;
  return [
    part(tube([-o.len * 0.44, 0, z], [o.len * 0.48, 0, z],
      o.width * 0.42, o.width * 0.42, BARREL), o.body),
    part(box([0, 0, z + o.width * 0.14], [o.len * 0.16, o.width * 1.9, o.width * 0.07]), o.body),
    part(box([-o.len * 0.38, 0, z + o.width * 0.18], [o.len * 0.12, o.width * 0.7, o.width * 0.06]), o.accent),
    part(box([-o.len * 0.40, 0, z + o.width * 0.30], [o.len * 0.09, o.width * 0.06, o.width * 0.30]), o.accent),
    part(box([o.len * 0.06, 0, z + o.width * 0.26], [o.len * 0.18, o.width * 0.22, o.width * 0.22]), o.cabColour || o.accent),
    
    
    part(box([o.len * 0.50, 0, z], [o.width * 0.04, o.width * 1.0, o.width * 1.0]), '#3a3f45'),
    
    
    part(limb([o.len * 0.06, o.width * 0.24, z - o.width * 0.16],
      [o.len * 0.06, o.width * 0.34, o.width * 0.035], o.width * 0.05), '#3a3f45'),
    part(limb([o.len * 0.06, -o.width * 0.24, z - o.width * 0.16],
      [o.len * 0.06, -o.width * 0.34, o.width * 0.035], o.width * 0.05), '#3a3f45'),
  ];
}














const YIELD_BODY = '#b0b6c0';
const YIELD_ACCENT = '#f4842c';
const STEEL = '#8b949f';

export const UNIT_MESHES = {
  
  flock: () => bird({
    len: 0.66, height: 0.74, girth: 0.34, body: '#efe6cf', accent: '#d0402f',
    comb: 1, fan: 1.0,
  }),
  duckRaft: () => bird({
    
    
    len: 0.72, height: 0.54, girth: 0.40, body: '#f0ecd9', accent: '#e8a832',
    bill: 0.55, fan: 1.1, raft: 1,
  }),
  wing: () => bird({
    
    
    len: 1.15, height: 0.95, girth: 0.30, body: '#7a6448', accent: '#f0d067',
    spread: 1.3, fan: 1.2,
  }),
  skulk: () => quadruped({
    
    
    len: 1.15, height: 0.52, girth: 0.26, body: '#d0742f', accent: '#f2e6d4',
    ears: 0.18, earOut: 0.34, tail: 0.52, brush: 0.9, snout: 0.08, squat: 0.82,
  }),
  sounder: () => quadruped({
    
    
    len: 1.5, height: 0.62, girth: 0.70, body: '#e0a49a', accent: '#8a5049',
    ears: 0.13, earOut: 0.26, tail: 0.14, snout: 0.02, neck: 0.02, squat: 1.0,
  }),
  horseHerd: () => quadruped({
    len: 2.4, height: 1.66, girth: 0.58, body: '#8a6440', accent: '#33220f',
    ears: 0.20, earOut: 0.24, tail: 0.62, brush: 0.5, mane: 0.55, neck: 0.62,
    squat: 0.86,
  }),
  pride: () => quadruped({
    
    
    len: 2.0, height: 1.05, girth: 0.48, body: '#dcae5e', accent: '#8a5a20',
    ears: 0.10, tail: 0.55, brush: 0.35, mane: 1.0, snout: 0.04,
  }),
  elephant: () => quadruped({
    
    
    
    len: 4.4, height: 3.3, girth: 1.95, body: '#9c9a94', accent: '#7d7b76',
    ears: 1.25, earOut: 0.62, tail: 0.6, brush: 0.3, trunk: 2.4, tusk: 0.9,
    neck: 0.16, squat: 0.98,
  }),

  
  farmhand: () => humanoid({
    height: 1.78, body: '#4a83bd', skin: '#d8ad86', accent: YIELD_ACCENT, legs: '#39465a', tool: 1,
  }),
  harvester: () => vehicle({
    
    
    
    len: 4.2, width: 2.0, height: 1.5, wheel: 0.5, wheels: 2, bigRear: 1,
    body: YIELD_BODY, accent: '#dcc46a', cab: 1, cabColour: '#3a72a8', tower: 1,
  }),
  bowser: () => vehicle({
    
    
    
    len: 3.1, width: 1.8, height: 1.4, wheel: 0.45, wheels: 2,
    body: STEEL, accent: '#3fbcbc', cab: 1, cabColour: '#5c6772', tank: 1, upright: 1,
  }),
  quadBike: () => vehicle({
    
    
    
    
    
    
    len: 1.6, width: 1.5, height: 0.8, wheel: 0.36, wheels: 2, chassisW: 0.46,
    body: '#d4482f', accent: '#33383f', bike: 1, riderBody: '#3f6f9c',
  }),
  poundWagon: () => vehicle({
    
    
    len: 4.4, width: 2.0, height: 1.6, wheel: 0.42, wheels: 3,
    body: '#8a919c', accent: '#5f6771', cab: 1, cabColour: YIELD_BODY,
    cage: 1,
  }),
  foodTruck: () => vehicle({
    
    
    
    len: 4.6, width: 2.1, height: 1.7, wheel: 0.44, wheels: 3,
    body: '#ece5cf', accent: '#cf4433', cab: 1, cabColour: '#ece5cf', awning: 1,
  }),
  tractor: () => vehicle({
    
    
    len: 2.9, width: 1.9, height: 1.6, wheel: 0.62, wheels: 2, bigRear: 1,
    rearScale: 1.95, linkage: 1,
    body: '#3f9c4f', accent: YIELD_ACCENT, cab: 1, cabColour: '#2f7a3f', exhaust: 1,
  }),
  combine: () => vehicle({
    
    
    len: 6.0, width: 3.0, height: 2.4, wheel: 0.7, wheels: 2, bigRear: 1,
    body: '#e0603a', accent: '#e6d79b', cab: 1, cabColour: '#3a4655',
    boom: 1, chute: 1,
  }),
  cropDuster: () => aircraft({
    len: 5.0, width: 2.0, height: 1.1, body: '#e8c65a', accent: '#cf4433', cabColour: '#3a4655',
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
