


























































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


const POINT = [[0.00, 1.00, 1.00], [0.55, 0.70, 0.70], [1.00, 0.07, 0.07]];
const cone = (a, b, w, d) => tube(a, b, w, d, POINT);

const part = (mesh, colour) => ({ mesh, colour, group: 'body' });





























function group(parts, name, fn) {
  const at = parts.length;
  fn();
  for (let i = at; i < parts.length; i += 1) parts[i].group = name;
}











function withPivots(parts, pivots) {
  Object.defineProperty(parts, 'pivots', { value: Object.freeze(pivots), enumerable: false });
  return parts;
}

















































export const SCLERA = '#efe9dc';
export const IRIS = '#16120e';
export const GLINT = '#ffffff';

export const SKIN = '#d8ad86';





















function eyePair(parts, at, hy, r) {
  const [x, cy, z] = at;
  for (const sy of [-1, 1]) {
    parts.push(part(box([x, cy + sy * hy, z], [r * 2.3, r * 2.0, r * 2.3]), SCLERA));
    parts.push(part(box([x + r * 0.45, cy + sy * (hy + r * 0.30), z],
      [r * 1.4, r * 1.9, r * 1.4]), IRIS));
    parts.push(part(box([x + r * 0.85, cy + sy * (hy + r * 0.45), z + r * 0.75],
      [r * 0.7, r * 1.2, r * 0.7]), GLINT));
  }
}












function spectacles(parts, at, hy, r, frame = '#2b2822') {
  const [x, , z] = at;
  
  
  
  
  
  
  
  
  const bar = r * 0.26;
  for (const sy of [-1, 1]) {
    const y = sy * (hy + r * 0.80);
    parts.push(part(box([x + r * 0.1, y, z], [r * 3.1, r * 0.30, r * 3.1]), '#dceef6'));
    parts.push(part(box([x + r * 0.1, y, z + r * 1.72], [r * 3.5, bar, bar]), frame));
    parts.push(part(box([x + r * 0.1, y, z - r * 1.72], [r * 3.5, bar, bar]), frame));
    parts.push(part(box([x + r * 1.80, y, z], [bar, bar, r * 3.5]), frame));
    parts.push(part(box([x - r * 1.60, y, z], [bar, bar, r * 3.5]), frame));
    
    parts.push(part(box([x - r * 3.1, y * 0.94, z + r * 0.7],
      [r * 3.2, bar * 0.8, bar * 0.8]), frame));
  }
  
  
  parts.push(part(box([x + r * 1.2, 0, z + r * 0.5], [bar, hy * 2, bar]), frame));
}












































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
  group(parts, 'legs', () => {
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      
      
      
      
      
      
      parts.push(part(limb([sx * lx, sy * ly, legTop],
        [sx * lx * 0.92, sy * ly * 1.45, r * 0.45], r), o.body));
      if (o.socks) {
        
        
        
        
        parts.push(part(limb([sx * lx * 0.95, sy * ly * 1.25, legTop * 0.34],
          [sx * lx * 0.92, sy * ly * 1.45, r * 0.45], r * 1.04), o.socks));
      }
    }
  }
  });
  
  const headX = o.len * 0.40 + (o.snout || 0);
  const headZ = bodyZ + (o.neck || o.height * 0.10);
  const headL = o.len * 0.22;
  const headW = o.girth * 0.62;
  const headH = o.height * 0.24;
  
  
  
  const neckAt = [o.len * 0.24, 0, bodyZ + o.height * 0.05];
  const headAt = [headX * 0.88, 0, headZ];
  group(parts, 'neck', () => {
    parts.push(part(tube(neckAt, headAt, o.girth * 0.52, o.girth * 0.52), o.body));
  });
  const headParts = [];
  group(parts, 'head', () => {
  parts.push(part(box([headX, 0, headZ], [headL, headW, headH]), o.body));

  
  
  
  
  if (o.muzzle) {
    parts.push(part(cone([headX + headL * 0.2, 0, headZ - headH * 0.12],
      [headX + headL * 0.2 + o.len * o.muzzle, 0, headZ - headH * 0.30],
      headW * 0.62, headH * 0.70), o.muzzleColour || o.body));
  }
  if (o.snoutDisc) {
    
    
    const sx0 = headX + headL * 0.5 + o.len * (o.muzzle || 0);
    const sr = o.girth * o.snoutDisc;
    parts.push(part(tube([sx0, 0, headZ - headH * 0.24], [sx0 + o.len * 0.035, 0, headZ - headH * 0.26],
      sr * 2, sr * 2), o.accent));
    for (const sy of [-1, 1]) {
      parts.push(part(box([sx0 + o.len * 0.045, sy * sr * 0.42, headZ - headH * 0.26],
        [o.len * 0.014, sr * 0.42, sr * 0.62]), '#6a3b36'));
    }
  }
  });
  if (o.bib) {
    
    
    parts.push(part(tube([o.len * 0.18, 0, bodyZ - o.height * 0.06],
      [headX * 0.86, 0, headZ - headH * 0.30],
      o.girth * 0.46, o.girth * 0.40, BARREL), o.bib));
  }
  group(parts, 'head', () => {
  if (o.eye !== 0) {
    
    eyePair(parts, [headX + headL * 0.24, 0, headZ + headH * 0.20], headW * 0.5,
      o.girth * (o.eye || 0.085));
  }
  if (o.ears) {
    
    
    
    const out = o.earOut || 0.3;
    for (const sy of [-1, 1]) {
      parts.push(part(box([headX - o.len * 0.05, sy * o.girth * out, headZ + o.ears * 0.22],
        [o.len * 0.13, o.girth * out * 0.9, o.ears]), o.accent));
    }
  }
  if (o.earPoint) {
    
    
    
    
    
    
    for (const sy of [-1, 1]) {
      parts.push(part(cone([headX - headL * 0.28, sy * headW * 0.30, headZ + headH * 0.34],
        [headX - headL * 0.42, sy * headW * 0.52, headZ + headH * 0.34 + o.earPoint],
        headW * 0.42, headL * 0.42), o.accent));
      if (o.earInner) {
        parts.push(part(cone([headX - headL * 0.26, sy * headW * 0.30, headZ + headH * 0.36],
          [headX - headL * 0.38, sy * headW * 0.50, headZ + headH * 0.34 + o.earPoint * 0.82],
          headW * 0.22, headL * 0.22), o.earInner));
      }
    }
  }
  });
  void headParts;
  group(parts, 'trunk', () => {
  if (o.trunk) {
    
    
    
    
    const tr = o.girth * (o.trunkR || 0.22);
    const knee = Math.max(0.05, headZ - o.trunk * 0.66);
    parts.push(part(tube([headX + o.len * 0.06, 0, headZ - o.height * 0.02],
      [headX + o.len * 0.12, 0, knee], tr * 2, tr * 2), o.body));
    parts.push(part(tube([headX + o.len * 0.12, 0, knee],
      [headX + o.len * 0.24, 0, Math.max(0.04, headZ - o.trunk)],
      tr * 1.5, tr * 1.5), o.body));
  }
  });
  group(parts, 'head', () => {
  if (o.tusk) {
    for (const sy of [-1, 1]) {
      parts.push(part(limb([headX + o.len * 0.04, sy * o.girth * 0.16, headZ - o.height * 0.05],
        [headX + o.len * 0.04 + o.tusk, sy * o.girth * 0.26, headZ - o.height * 0.02],
        o.girth * 0.06), '#e8e2cf'));
    }
  }
  });
  group(parts, 'mane', () => {
  if (o.mane) {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    parts.push(part(tube([o.len * 0.24, 0, bodyZ + o.height * 0.12],
      [o.len * 0.38, 0, bodyZ + o.height * 0.26],
      o.girth * (1.0 + o.mane * 0.80), o.height * (0.5 + o.mane * 0.44), BARREL), o.accent));
  }
  });
  group(parts, 'neck', () => {
  if (o.crest) {
    
    
    
    
    const n = 5;
    for (let i = 0; i < n; i += 1) {
      const t = i / (n - 1);
      const cx = o.len * 0.24 + (headX * 0.80 - o.len * 0.24) * t;
      const cz = bodyZ + o.height * 0.05 + (headZ - bodyZ - o.height * 0.05) * t;
      parts.push(part(box([cx, 0, cz + o.crest * 0.5 + o.girth * 0.16],
        [o.len * 0.075, o.girth * 0.16, o.crest * (1 - t * 0.25)]), o.accent));
    }
  }
  });
  
  
  
  
  
  if (o.crest) {
    group(parts, 'head', () => {
      parts.push(part(box([headX - headL * 0.30, 0, headZ + headH * 0.52],
        [headL * 0.44, headW * 0.42, headH * 0.42]), o.accent));
    });
  }
  group(parts, 'tail', () => {
  if (o.tail) {
    const t = o.girth * (o.brush || 0.16);
    const tcol = o.tailColour || o.accent;
    const tipAt = o.tailTip ? 0.62 : 1;
    
    
    
    
    
    
    
    
    
    
    
    const drop = o.tailDrop === undefined ? 0.28 : o.tailDrop;
    const startZ = bodyZ + o.height * 0.06;
    const run = Math.sqrt(Math.max(0, 1 - drop * drop));
    const endZ = Math.max(t * 1.15, startZ - o.tail * drop);
    const end = [-o.len * 0.30 - o.tail * run, 0, endZ];
    const mid = [-o.len * 0.30 - o.tail * run * tipAt, 0, startZ + (endZ - startZ) * tipAt];
    parts.push(part(limb([-o.len * 0.30, 0, startZ], mid, t), tcol));
    if (o.tailTip) {
      
      
      
      
      
      parts.push(part(limb(mid, end, t * 1.06), o.tailTip));
    }
  }
  if (o.curlTail) {
    
    
    const t = o.girth * 0.075;
    const x0 = -o.len * 0.32;
    const z0 = bodyZ + o.height * 0.20;
    const rr = o.girth * 0.17;
    let prev = [x0, 0, z0];
    for (let i = 1; i <= o.curlTail; i += 1) {
      const a = (i / o.curlTail) * Math.PI * 2.2;
      const nxt = [x0 - rr * 0.5 * (1 - Math.cos(a)), Math.sin(a) * rr, z0 + rr * (1 - Math.cos(a)) * 0.5];
      parts.push(part(limb(prev, nxt, t), o.accent));
      prev = nxt;
    }
  }
  });
  
  group(parts, 'head', () => {
  if (o.mask) {
    
    
    parts.push(part(box([headX + headL * 0.22, 0, headZ + headH * 0.20],
      [headL * 0.42, headW * 1.14, headH * 0.36]), o.mask));
  }
  if (o.noseRing) {
    
    
    const sx0 = headX + headL * 0.5 + o.len * (o.muzzle || 0) + o.len * 0.03;
    const rr = o.girth * o.noseRing;
    const bz = headZ - headH * 0.40;
    const bar = rr * 0.30;
    parts.push(part(box([sx0, 0, bz + rr], [bar, rr * 1.8, bar]), '#c9a227'));
    parts.push(part(box([sx0, 0, bz - rr], [bar, rr * 1.8, bar]), '#c9a227'));
    for (const sy of [-1, 1]) {
      parts.push(part(box([sx0, sy * rr * 0.85, bz], [bar, bar, rr * 2]), '#c9a227'));
    }
  }
  if (o.scar) {
    
    
    
    parts.push(part(box([headX + headL * 0.24, -headW * 0.54, headZ + headH * 0.22],
      [headL * 0.16, headW * 0.10, headH * 0.72]), o.scar));
  }
  });
  group(parts, 'neck', () => {
  if (o.bell) {
    
    
    
    
    const nx = (o.len * 0.24 + headX * 0.88) * 0.5;
    const nz = (bodyZ + o.height * 0.05 + headZ) * 0.5;
    
    
    
    parts.push(part(tube([nx - o.len * 0.008, 0, nz + o.height * 0.008],
      [nx + o.len * 0.008, 0, nz - o.height * 0.008],
      o.girth * 0.58, o.girth * 0.58), '#4a3018'));
    parts.push(part(tube([nx, 0, nz - o.girth * 0.26],
      [nx, 0, nz - o.girth * 0.26 - o.bell],
      o.bell * 0.9, o.bell * 0.9, BARREL), '#c9a227'));
  }
  if (o.bandana) {
    
    
    
    const nx = (o.len * 0.24 + headX * 0.88) * 0.5;
    const nz = (bodyZ + o.height * 0.05 + headZ) * 0.5;
    parts.push(part(tube([nx - o.len * 0.03, 0, nz + o.height * 0.03],
      [nx + o.len * 0.03, 0, nz - o.height * 0.03],
      o.girth * 0.60, o.girth * 0.60), o.bandana));
    parts.push(part(cone([nx + o.len * 0.02, 0, nz - o.girth * 0.24],
      [nx - o.len * 0.02, 0, nz - o.girth * 0.24 - o.height * 0.14],
      o.girth * 0.22, o.girth * 0.22), o.bandana));
  }
  });
  
  
  
  return withPivots(parts, {
    neck: neckAt,
    head: headAt,
    tail: [-o.len * 0.30, 0, bodyZ + o.height * 0.06],
    trunk: [headX + o.len * 0.06, 0, headZ - o.height * 0.02],
  });
}


export function bird(o) {
  const bodyZ = o.height * 0.46;
  const parts = [
    part(tube([-o.len * 0.34, 0, bodyZ], [o.len * 0.28, 0, bodyZ],
      o.girth, o.height * 0.56, BARREL), o.body),
  ];
  group(parts, 'legs', () => {
  for (const sy of [-1, 1]) {
    
    
    
    
    
    
    const legCol = o.legColour || o.accent;
    parts.push(part(limb([o.len * 0.04, sy * o.girth * 0.24, o.height * 0.28],
      [o.len * 0.04, sy * o.girth * 0.30, o.girth * 0.06], o.girth * 0.10), legCol));
    
    
    
    if (o.toes) {
      for (const t of [-1, 0, 1]) {
        parts.push(part(cone([o.len * 0.04, sy * o.girth * 0.30, o.girth * 0.07],
          [o.len * 0.04 + o.len * 0.09 * (t === 0 ? 1.15 : 0.85),
            sy * o.girth * 0.30 + t * o.girth * 0.16, o.girth * 0.035],
          o.girth * 0.09, o.girth * 0.07), legCol));
      }
    }
  }
  });
  const headZ = bodyZ + o.height * 0.38;
  const headX = o.len * 0.30;
  const headW = o.girth * 0.48;
  const headH = o.height * 0.21;
  
  
  
  const headCol = o.headColour || o.body;
  const neckAt = [o.len * 0.14, 0, bodyZ + o.height * 0.14];
  const headAt = [headX, 0, headZ];
  group(parts, 'neck', () => {
    parts.push(part(tube(neckAt, headAt, o.girth * 0.42, o.girth * 0.42), headCol));
    if (o.neckRing) {
      parts.push(part(tube([o.len * 0.20, 0, bodyZ + o.height * 0.21],
        [o.len * 0.24, 0, bodyZ + o.height * 0.27],
        o.girth * 0.50, o.girth * 0.50), o.neckRing));
    }
  });
  group(parts, 'head', () => {
  parts.push(part(box([headX, 0, headZ], [o.len * 0.18, headW, headH]), headCol));
  
  
  
  
  
  
  
  const bill = o.billColour || o.accent;
  const billX = headX + o.len * 0.09;
  const billShape = o.billShape || 'wedge';
  if (billShape === 'spatula') {
    parts.push(part(box([billX + o.len * 0.06, 0, headZ - o.height * 0.03],
      [o.len * 0.20, o.girth * (o.bill || 0.9), o.height * 0.055]), bill));
    
    parts.push(part(box([billX + o.len * 0.16, 0, headZ - o.height * 0.035],
      [o.len * 0.04, o.girth * (o.bill || 0.9) * 0.34, o.height * 0.05]), '#b9761c'));
  } else if (billShape === 'hook') {
    parts.push(part(cone([billX, 0, headZ + o.height * 0.02],
      [billX + o.len * 0.13, 0, headZ - o.height * 0.02],
      o.girth * 0.44, o.height * 0.20), bill));
    
    
    parts.push(part(cone([billX + o.len * 0.09, 0, headZ - o.height * 0.01],
      [billX + o.len * 0.15, 0, headZ - o.height * 0.16],
      o.girth * 0.26, o.girth * 0.26), bill));
    parts.push(part(box([billX - o.len * 0.03, 0, headZ + o.height * 0.16],
      [o.len * 0.12, headW * 1.05, o.height * 0.08]), o.brow || o.body));
  } else {
    parts.push(part(cone([billX, 0, headZ - o.height * 0.02],
      [billX + o.len * 0.11, 0, headZ - o.height * 0.05],
      o.girth * 0.40, o.height * 0.14), bill));
  }
  });
  if (o.bib) {
    
    
    
    parts.push(part(tube([o.len * 0.06, 0, bodyZ - o.height * 0.04],
      [o.len * 0.26, 0, bodyZ + o.height * 0.24],
      o.girth * 0.82, o.height * 0.40, BARREL), o.bib));
  }
  group(parts, 'head', () => {
  if (o.eye !== 0) {
    eyePair(parts, [headX + o.len * 0.05, 0, headZ + headH * 0.18], headW * 0.5,
      o.girth * (o.eye || 0.11));
  }
  if (o.comb) {
    
    
    
    
    
    
    
    const n = 5;
    for (let i = 0; i < n; i += 1) {
      const t = i / (n - 1);
      const hgt = o.height * 0.16 * (0.55 + Math.sin(t * Math.PI) * 0.75);
      parts.push(part(box([headX + (t - 0.45) * o.len * 0.20, 0, headZ + headH * 0.5 + hgt * 0.45],
        [o.len * 0.045, o.girth * 0.14, hgt]), o.comb === true ? o.accent : o.comb));
    }
  }
  if (o.wattle) {
    
    
    
    
    for (const sy of [-1, 1]) {
      parts.push(part(cone([headX + o.len * 0.07, sy * o.girth * 0.09, headZ - headH * 0.40],
        [headX + o.len * 0.055, sy * o.girth * 0.11, headZ - headH * 0.40 - o.height * 0.15],
        o.girth * 0.20, o.girth * 0.20), o.wattle));
    }
  }
  if (o.glasses) {
    
    spectacles(parts, [headX + o.len * 0.05, 0, headZ + headH * 0.18], headW * 0.5,
      o.girth * (o.eye || 0.11), o.glasses === true ? '#2b2822' : o.glasses);
  }
  if (o.cap) {
    
    
    parts.push(part(box([headX - o.len * 0.01, 0, headZ + headH * 0.62],
      [o.len * 0.17, headW * 1.10, o.height * 0.08]), o.cap));
    parts.push(part(box([headX + o.len * 0.10, 0, headZ + headH * 0.56],
      [o.len * 0.10, headW * 0.90, o.height * 0.035]), '#20242a'));
    parts.push(part(box([headX - o.len * 0.01, 0, headZ + headH * 0.90],
      [o.len * 0.15, headW * 0.95, o.height * 0.05]), '#e8e6de'));
  }
  if (o.goggles) {
    
    
    
    for (const sy of [-1, 1]) {
      parts.push(part(tube([headX - o.len * 0.02, sy * headW * 0.30, headZ + headH * 0.62],
        [headX + o.len * 0.02, sy * headW * 0.30, headZ + headH * 0.62],
        o.girth * 0.34, o.girth * 0.34), '#3a2b1c'));
      parts.push(part(tube([headX + o.len * 0.015, sy * headW * 0.30, headZ + headH * 0.62],
        [headX + o.len * 0.03, sy * headW * 0.30, headZ + headH * 0.62],
        o.girth * 0.22, o.girth * 0.22), '#7fc8d8'));
    }
    parts.push(part(box([headX - o.len * 0.06, 0, headZ + headH * 0.58],
      [o.len * 0.06, headW * 1.16, o.height * 0.05]), '#3a2b1c'));
  }
  });
  
  
  
  
  
  
  for (const sy of [-1, 1]) {
    
    
    
    const wingSide = sy < 0 ? 'wingL' : 'wingR';
    group(parts, wingSide, () => {
    if (o.spread) {
      
      
      
      
      
      
      
      
      
      const span = o.len * o.spread;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const rise = o.height * 0.42;
      const th = o.height * 0.26;
      parts.push(part(tube(
        [o.len * 0.14, sy * span * 0.10, bodyZ + o.height * 0.20],
        [o.len * 0.08, sy * span * 0.66, bodyZ + o.height * 0.16 + rise * 0.55],
        span * 0.72, th, BARREL,
      ), o.body));
      parts.push(part(tube(
        [o.len * 0.06, sy * span * 0.62, bodyZ + o.height * 0.16 + rise * 0.55],
        [-o.len * 0.10, sy * span * 1.02, bodyZ + o.height * 0.16 + rise * 0.95],
        span * 0.52, th * 0.82, BARREL,
      ), o.coverts || o.body));
      for (let f = 0; f < 4; f += 1) {
        
        
        parts.push(part(cone([-o.len * (0.02 + f * 0.05), sy * span * (0.96 + f * 0.02),
          bodyZ + o.height * 0.16 + rise * (0.95 + f * 0.04)],
        [-o.len * (0.20 + f * 0.17), sy * span * (1.34 - f * 0.10),
          bodyZ + o.height * 0.16 + rise * (1.10 + f * 0.09)],
        span * 0.14, th * 0.62), o.accent));
      }
    } else {
      parts.push(part(box([-o.len * 0.02, sy * o.girth * 0.54, bodyZ],
        [o.len * 0.44, o.girth * 0.16, o.height * 0.34]), o.wingColour || o.body));
    }
    });
  }
  
  
  
  
  
  
  
  group(parts, 'tail', () => {
  if (o.wedgeTail) {
    
    
    
    parts.push(part(cone([-o.len * 0.28, 0, bodyZ + o.height * 0.14],
      [-o.len * 0.86, 0, bodyZ + o.height * 0.24],
      o.girth * (o.fan || 1.6), o.height * 0.14), o.tailColour || o.body));
  } else if (o.tailUp) {
    
    
    
    
    const n = 3;
    for (let i = 0; i < n; i += 1) {
      const t = i / (n - 1);
      parts.push(part(cone([-o.len * 0.30, 0, bodyZ + o.height * 0.06],
        [-o.len * (0.44 + t * 0.30), (t - 0.5) * o.girth * 0.55,
          bodyZ + o.height * (0.44 + o.tailUp * (1 - t * 0.35))],
        o.girth * (0.52 - t * 0.16), o.girth * 0.30), o.tailColour || o.body));
    }
  } else {
    parts.push(part(box([-o.len * 0.42, 0, bodyZ + o.height * 0.12],
      [o.len * 0.24, o.girth * (o.fan || 0.9), o.height * 0.10]), o.tailColour || o.accent));
  }
  });
  
  
  
  group(parts, 'mount', () => {
  if (o.raft) {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const rl = o.len * 1.02;
    const logs = 5;
    const spread = o.girth * 1.55;
    const plank = (spread / (logs - 1)) * 1.02;
    for (let i = 0; i < logs; i += 1) {
      const y = (i / (logs - 1) - 0.5) * spread;
      parts.push(part(box([0, y, o.girth * 0.055], [rl, plank, o.girth * 0.11]),
        o.raftColour || '#54402a'));
    }
    
    
    for (const sx of [-1, 1]) {
      parts.push(part(box([sx * rl * 0.34, 0, o.girth * 0.115],
        [rl * 0.10, spread * 1.04, o.girth * 0.03]), o.raftLash || '#33261a'));
    }
    if (o.lifeRing) {
      
      
      
      
      
      const px = -rl * 0.46;
      const rr = o.girth * 0.30;
      const pz = o.girth * 0.12;
      parts.push(part(limb([px, 0, pz], [px, 0, pz + o.height * 0.62], o.girth * 0.05),
        o.raftLash || '#33261a'));
      const cz = pz + o.height * 0.60;
      const bar = rr * 0.36;
      for (const sz of [-1, 1]) {
        parts.push(part(box([px, 0, cz + sz * rr], [bar * 0.7, rr * 1.9, bar]),
          sz > 0 ? '#e8e2d4' : o.lifeRing));
      }
      for (const sy of [-1, 1]) {
        parts.push(part(box([px, sy * rr * 0.88, cz], [bar * 0.7, bar, rr * 2]),
          sy > 0 ? o.lifeRing : '#e8e2d4'));
      }
    }
  }
  });
  return withPivots(parts, {
    neck: neckAt,
    head: headAt,
    tail: [-o.len * 0.30, 0, bodyZ + o.height * 0.06],
    
    
    
    wing: [o.len * 0.10, 0, bodyZ + o.height * 0.18],
  });
}

















function personHead(parts, at, s, o) {
  const [cx, cy, cz] = at;
  parts.push(part(box([cx, cy, cz], [s, s, s]), o.skin));
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  parts.push(part(cone([cx + s * 0.44, cy, cz - s * 0.02],
    [cx + s * (0.44 + (o.nose === undefined ? 0.42 : o.nose)), cy, cz - s * 0.16],
    s * 0.38, s * 0.36), o.skin));
  eyePair(parts, [cx + s * 0.30, cy, cz + s * 0.16], s * 0.5, s * 0.11);
  if (o.hat) {
    
    
    
    parts.push(part(box([cx + s * 0.10, cy, cz + s * 0.54],
      [s * 1.7, s * 1.7, s * 0.26]), o.hat));
    parts.push(part(box([cx + s * 0.05, cy, cz + s * 0.86],
      [s * 0.95, s * 0.95, s * 0.42]), o.hat));
  }
  if (o.cap) {
    parts.push(part(box([cx, cy, cz + s * 0.56], [s * 1.02, s * 1.02, s * 0.30]), o.cap));
    parts.push(part(box([cx + s * 0.66, cy, cz + s * 0.48], [s * 0.62, s * 0.9, s * 0.14]), o.cap));
  }
  if (o.shades) {
    
    
    
    parts.push(part(box([cx + s * 0.42, cy, cz + s * 0.16],
      [s * 0.20, s * 1.06, s * 0.22]), '#1d2026'));
  }
  if (o.beard) {
    parts.push(part(box([cx + s * 0.30, cy, cz - s * 0.36],
      [s * 0.62, s * 0.86, s * 0.34]), o.beard));
  }
}


export function humanoid(o) {
  const h = o.height;
  const parts = [
    part(box([0, 0, h * 0.62], [h * 0.19, h * 0.32, h * 0.34]), o.body),          
  ];
  
  
  
  parts.push(part(box([0, 0, h * 0.775], [h * 0.21, h * 0.34, h * 0.04]), o.accent));
  group(parts, 'head', () => {
    personHead(parts, [0, 0, h * 0.88], h * 0.16, {
      skin: o.skin, hat: o.accent, nose: o.nose, beard: o.beard,
    });
  });
  for (const sy of [-1, 1]) {
    
    
    
    group(parts, sy < 0 ? 'armR' : 'armL', () => {
    parts.push(part(limb([0, sy * h * 0.16, h * 0.74], [h * 0.06, sy * h * 0.19, h * 0.46], h * 0.05), o.body));
    
    
    parts.push(part(box([h * 0.065, sy * h * 0.195, h * 0.44],
      [h * 0.065, h * 0.055, h * 0.075]), o.skin));
    });
    group(parts, 'legs', () => {
    parts.push(part(limb([0, sy * h * 0.08, h * 0.45], [0, sy * h * 0.10, 0], h * 0.06), o.legs));
    
    
    parts.push(part(box([h * 0.02, sy * h * 0.10, h * 0.028],
      [h * 0.13, h * 0.075, h * 0.055]), o.boots || '#2a2118'));
    });
  }
  group(parts, 'tool', () => {
  if (o.tool) {
    
    
    parts.push(part(box([h * 0.15, -h * 0.20, h * 0.60], [h * 0.045, h * 0.045, h * 0.62]), '#8a6a42'));
    parts.push(part(box([h * 0.15, -h * 0.20, h * 0.905], [h * 0.06, h * 0.13, h * 0.05]), '#8a6a42'));
    parts.push(part(box([h * 0.15, -h * 0.20, h * 0.245], [h * 0.10, h * 0.14, h * 0.20]), o.accent));
  }
  });
  return withPivots(parts, {
    neck: [0, 0, h * 0.80],
    head: [0, 0, h * 0.80],
    
    
    
    shoulderR: [0, -h * 0.16, h * 0.74],
    shoulderL: [0, h * 0.16, h * 0.74],
    toolFoot: [h * 0.15, -h * 0.20, 0],
  });
}







export function vehicle(o) {
  const parts = [];
  const bodyZ = o.wheel * 1.15;
  
  
  
  const cw = o.chassisW === undefined ? 1 : o.chassisW;
  parts.push(part(box([0, 0, bodyZ + o.height * 0.3],
    [o.len * 0.86, o.width * cw, o.height * 0.5]), o.body));
  
  
  
  
  
  
  if (o.cab) {
    
    
    
    
    const cx = o.len * (o.cabX === undefined ? -0.16 : o.cabX);
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const doorTop = bodyZ + o.height * 0.98;
    const roofZ = bodyZ + o.height * 1.46;
    parts.push(part(box([cx, 0, (bodyZ + o.height * 0.55 + doorTop) * 0.5],
      [o.len * 0.32, o.width * 0.76, doorTop - bodyZ - o.height * 0.55]),
    o.cabColour || o.accent));
    
    
    
    parts.push(part(box([cx - o.len * 0.14, 0, (doorTop + roofZ) * 0.5],
      [o.len * 0.04, o.width * 0.70, roofZ - doorTop]), '#7fa9c8'));
    for (const sy of [-1, 1]) {
      parts.push(part(box([cx - o.len * 0.04, sy * o.width * 0.36, (doorTop + roofZ) * 0.5],
        [o.len * 0.16, o.width * 0.04, roofZ - doorTop]), '#9dc6e4'));
    }
    
    
    for (const sy of [-1, 1]) {
      for (const sx of [-1, 1]) {
        parts.push(part(box([cx + sx * o.len * 0.15, sy * o.width * 0.37,
          (doorTop + roofZ) * 0.5],
        [o.len * 0.045, o.width * 0.055, roofZ - doorTop]), o.cabColour || o.accent));
      }
    }
    
    
    if (o.driver !== 0) {
      personHead(parts, [cx + o.len * 0.02, 0, doorTop + o.height * 0.20],
        o.height * 0.20, {
          skin: o.skin || SKIN,
          cap: o.driverCap || '#2f3a47',
          shades: o.shades,
          beard: o.beard,
        });
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    for (const sy of [-1, 1]) {
      parts.push(part(box([cx - o.len * 0.12, sy * o.width * 0.40, roofZ - o.height * 0.10],
        [o.len * 0.055, o.width * 0.07, o.height * 0.30]), o.accent));
    }
    parts.push(part(box([cx - o.len * 0.12, 0, roofZ + o.height * 0.04],
      [o.len * 0.07, o.width * 0.90, o.height * 0.09]), o.accent));
    
    
    
    
    for (const sy of [-1, 1]) {
      parts.push(part(box([cx + o.len * 0.12, sy * o.width * 0.60, bodyZ + o.height * 1.36],
        [o.len * 0.03, o.width * 0.30, o.height * 0.04]), '#2b2f34'));
      parts.push(part(box([cx + o.len * 0.12, sy * o.width * 0.74, bodyZ + o.height * 1.28],
        [o.len * 0.05, o.width * 0.05, o.height * 0.22]), '#2b2f34'));
    }
    if (o.beacon) {
      
      
      
      parts.push(part(box([cx - o.len * 0.10, 0, bodyZ + o.height * 1.56],
        [o.len * 0.05, o.width * 0.08, o.height * 0.10]), '#2b2f34'));
      parts.push(part(tube([cx - o.len * 0.10, 0, bodyZ + o.height * 1.60],
        [cx - o.len * 0.10, 0, bodyZ + o.height * 1.78],
        o.width * 0.14, o.width * 0.14, BARREL), '#f0902a'));
    }
  }
  if (o.lights) {
    
    
    
    
    for (const sy of [-1, 1]) {
      parts.push(part(box([o.len * 0.43, sy * o.width * 0.28, bodyZ + o.height * 0.42],
        [o.len * 0.04, o.width * 0.16, o.height * 0.16]), '#f6efc8'));
    }
    parts.push(part(box([o.len * 0.44, 0, bodyZ + o.height * 0.20],
      [o.len * 0.03, o.width * 0.52, o.height * 0.22]), '#2b2f34'));
  }
  
  
  
  
  
  
  
  
  
  
  
  const wheels = o.wheels === undefined ? 2 : o.wheels;
  for (let i = 0; i < wheels; i += 1) {
    const t = wheels === 1 ? 0 : (i / (wheels - 1)) - 0.5;
    const x = t * o.len * 0.62;
    for (const sy of [-1, 1]) {
      
      
      
      
      const r = o.bigRear && x < 0 ? o.wheel * (o.rearScale || 1.35) : o.wheel;
      parts.push(part(box([x, sy * o.width * 0.48, r], [r * 2, o.width * 0.16, r * 2]), '#22262b'));
      
      
      
      
      
      
      
      parts.push(part(box([x, sy * o.width * 0.56, r],
        [r * 0.44, o.width * 0.05, r * 0.44]), o.hub || '#6d747d'));
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
      [o.len * 0.16, o.width * 0.36, o.height * 1.75]), '#7d848d'));
    for (const sy of [-1, 1]) {
      parts.push(part(box([o.len * 0.30, sy * o.width * 0.17, bodyZ + o.height * 1.30],
        [o.len * 0.05, o.width * 0.05, o.height * 1.75]), o.accent));
    }
    parts.push(part(box([o.len * 0.30, 0, bodyZ + o.height * 2.14],
      [o.len * 0.44, o.width * 0.66, o.height * 0.20]), '#3a3f45'));
    
    parts.push(part(box([o.len * 0.44, 0, bodyZ + o.height * 0.30],
      [o.len * 0.14, o.width * 0.80, o.height * 0.44]), '#3a3f45'));
  }
  if (o.tank) {
    
    
    
    
    
    
    
    if (o.upright) {
      
      
      
      
      
      parts.push(part(tube([-o.len * 0.16, 0, bodyZ + o.height * 0.45],
        [-o.len * 0.16, 0, bodyZ + o.height * 2.20],
        o.width * 1.12, o.width * 1.12, BARREL), o.accent));
      parts.push(part(tube([-o.len * 0.16, 0, bodyZ + o.height * 2.15],
        [-o.len * 0.16, 0, bodyZ + o.height * 2.46],
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
    
    
    for (const sy of [-1, 1]) {
      parts.push(part(limb([-o.len * 0.02, sy * o.width * 0.20, bodyZ + o.height * 1.38],
        [o.len * 0.17, sy * o.width * 0.30, bodyZ + o.height * 1.18], o.width * 0.055),
      o.riderBody || '#4a83bd'));
    }
    
    
    personHead(parts, [-o.len * 0.06, 0, bodyZ + o.height * 1.78], o.height * 0.34, {
      skin: o.skin || SKIN, cap: o.driverCap || '#2f3a47', shades: 1,
    });
    parts.push(part(box([-o.len * 0.36, 0, bodyZ + o.height * 0.78],
      [o.len * 0.22, o.width * 0.78, o.height * 0.10]), o.accent));
    if (o.bullBar) {
      
      
      parts.push(part(box([o.len * 0.44, 0, bodyZ + o.height * 0.30],
        [o.len * 0.05, o.width * 1.05, o.height * 0.10]), '#2b2f34'));
      for (const sy of [-1, 1]) {
        parts.push(part(box([o.len * 0.40, sy * o.width * 0.42, bodyZ + o.height * 0.14],
          [o.len * 0.12, o.width * 0.06, o.height * 0.36]), '#2b2f34'));
      }
    }
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
    
    
    parts.push(part(box([o.len * 0.28, o.width * 0.32, bodyZ + o.height * 1.94],
      [o.len * 0.10, o.width * 0.13, o.height * 0.05]), '#2b2f34'));
  }
  
  
  
  
  
  
  if (o.dog) {
    
    
    const dx = -o.len * 0.30;
    const dy = o.width * 0.40;
    const dz = bodyZ + o.height * 0.95;
    parts.push(part(tube([dx - o.len * 0.05, dy, dz], [dx + o.len * 0.05, dy, dz + o.height * 0.06],
      o.width * 0.13, o.width * 0.13, BARREL), o.dog));
    parts.push(part(box([dx + o.len * 0.08, dy, dz + o.height * 0.14],
      [o.len * 0.055, o.width * 0.10, o.height * 0.13]), o.dog));
    parts.push(part(cone([dx + o.len * 0.10, dy, dz + o.height * 0.16],
      [dx + o.len * 0.15, dy, dz + o.height * 0.13], o.width * 0.07, o.height * 0.08), o.dog));
    for (const ey of [-1, 1]) {
      parts.push(part(cone([dx + o.len * 0.06, dy + ey * o.width * 0.035, dz + o.height * 0.20],
        [dx + o.len * 0.05, dy + ey * o.width * 0.05, dz + o.height * 0.30],
        o.width * 0.05, o.width * 0.04), o.dog));
    }
    parts.push(part(limb([dx - o.len * 0.06, dy, dz + o.height * 0.04],
      [dx - o.len * 0.13, dy, dz + o.height * 0.18], o.width * 0.035), o.dog));
  }
  if (o.bigThing) {
    
    
    
    const bz = bodyZ + o.height * 1.72;
    parts.push(part(tube([-o.len * 0.06, 0, bz], [-o.len * 0.06, 0, bz + o.height * 0.34],
      o.width * 0.86, o.width * 0.86, BARREL), o.bigThing));
    parts.push(part(tube([-o.len * 0.06, 0, bz + o.height * 0.30],
      [-o.len * 0.06, 0, bz + o.height * 0.46],
      o.width * 0.60, o.width * 0.60, BARREL), '#e8c06a'));
  }
  if (o.captive) {
    
    
    
    
    const cz = bodyZ + o.height * 0.62;
    parts.push(part(tube([-o.len * 0.20, 0, cz + o.height * 0.42],
      [o.len * 0.10, 0, cz + o.height * 0.42],
      o.width * 0.34, o.width * 0.30, BARREL), o.captive));
    parts.push(part(box([o.len * 0.16, 0, cz + o.height * 0.56],
      [o.len * 0.05, o.width * 0.18, o.height * 0.20]), o.captive));
    for (const sy of [-1, 1]) {
      parts.push(part(cone([o.len * 0.14, sy * o.width * 0.06, cz + o.height * 0.66],
        [o.len * 0.12, sy * o.width * 0.10, cz + o.height * 0.84],
        o.width * 0.07, o.width * 0.05), o.captive));
    }
  }
  if (o.windsock) {
    
    
    const mz = bodyZ + o.height * 2.20;
    parts.push(part(box([o.len * 0.30, o.width * 0.16, mz],
      [o.len * 0.03, o.width * 0.34, o.height * 0.03]), '#2b2f34'));
    
    
    
    
    parts.push(part(cone([o.len * 0.30, o.width * 0.30, mz - o.height * 0.06],
      [o.len * 0.30, o.width * 0.50, mz - o.height * 0.26],
      o.width * 0.13, o.width * 0.13), o.windsock));
  }
  if (o.tapAndBucket) {
    
    
    const tz = bodyZ + o.height * 0.70;
    parts.push(part(box([-o.len * 0.34, o.width * 0.42, tz],
      [o.len * 0.05, o.width * 0.22, o.height * 0.06]), '#8a939c'));
    parts.push(part(box([-o.len * 0.34, o.width * 0.54, tz - o.height * 0.10],
      [o.len * 0.04, o.width * 0.05, o.height * 0.16]), '#8a939c'));
    parts.push(part(tube([-o.len * 0.34, o.width * 0.54, o.height * 0.02],
      [-o.len * 0.34, o.width * 0.54, o.height * 0.30],
      o.width * 0.26, o.width * 0.26), o.tapAndBucket));
  }
  return parts;
}


export function aircraft(o) {
  const z = o.height;
  const parts = [
    part(tube([-o.len * 0.44, 0, z], [o.len * 0.48, 0, z],
      o.width * 0.42, o.width * 0.42, BARREL), o.body),
    part(box([0, 0, z + o.width * 0.14], [o.len * 0.16, o.width * 1.9, o.width * 0.07]), o.body),
    part(box([-o.len * 0.38, 0, z + o.width * 0.18], [o.len * 0.12, o.width * 0.7, o.width * 0.06]), o.accent),
    part(box([-o.len * 0.40, 0, z + o.width * 0.30], [o.len * 0.09, o.width * 0.06, o.width * 0.30]), o.accent),
    part(box([o.len * 0.06, 0, z + o.width * 0.26], [o.len * 0.18, o.width * 0.22, o.width * 0.22]), o.cabColour || o.accent),
    
    
    part(box([o.len * 0.06, 0, z + o.width * 0.40], [o.len * 0.15, o.width * 0.19, o.width * 0.11]), '#9dc6e4'),
    
    
    part(box([o.len * 0.50, 0, z], [o.width * 0.04, o.width * 1.0, o.width * 1.0]), '#3a3f45'),
    
    
    part(limb([o.len * 0.06, o.width * 0.24, z - o.width * 0.16],
      [o.len * 0.06, o.width * 0.34, o.width * 0.035], o.width * 0.05), '#3a3f45'),
    part(limb([o.len * 0.06, -o.width * 0.24, z - o.width * 0.16],
      [o.len * 0.06, -o.width * 0.34, o.width * 0.035], o.width * 0.05), '#3a3f45'),
  ];
  
  
  
  
  
  
  
  personHead(parts, [o.len * 0.06, 0, z + o.width * 0.46], o.width * 0.20, {
    skin: o.skin || SKIN, cap: '#4a3a28', shades: 1,
  });
  if (o.scarf) {
    for (let i = 0; i < 3; i += 1) {
      parts.push(part(box([o.len * (0.00 - i * 0.075), -o.width * (0.10 + i * 0.06),
        z + o.width * (0.44 - i * 0.05)],
      [o.len * 0.09, o.width * 0.10, o.width * 0.05]), o.scarf));
    }
  }
  
  
  parts.push(part(tube([o.len * 0.49, 0, z], [o.len * 0.54, 0, z],
    o.width * 0.18, o.width * 0.18), o.accent));
  return parts;
}














const YIELD_BODY = '#b0b6c0';
const YIELD_ACCENT = '#f4842c';
const STEEL = '#8b949f';

export const UNIT_MESHES = {
  
  
  
  
  
  
  
  flock: () => bird({
    
    
    
    len: 0.66, height: 0.76, girth: 0.36,
    body: '#f4eee2', accent: '#c8342a',
    comb: '#d43a2c', wattle: '#b02a20',
    billShape: 'wedge', billColour: '#eaa523',
    legColour: '#e8a021', toes: 1,
    
    
    
    
    tailUp: 0.30, tailColour: '#ded1b8',
    eye: 0.13,
    
    glasses: '#2f2a24',
  }),
  duckRaft: () => bird({
    
    
    
    
    
    len: 0.92, height: 0.74, girth: 0.46,
    body: '#f0ead6', headColour: '#1f6a46', neckRing: '#f6f3ea',
    accent: '#e8a832',
    billShape: 'spatula', billColour: '#f0a52c', bill: 0.85,
    legColour: '#e07c1e', toes: 1,
    tailColour: '#8d7c58', fan: 1.0,
    eye: 0.10,
    raft: 1,
    
    
    lifeRing: '#d8543a',
  }),
  wing: () => bird({
    
    
    
    
    
    len: 1.20, height: 1.00, girth: 0.32,
    body: '#5a4634', accent: '#241c15', headColour: '#e0b667', coverts: '#8a6d48',
    bib: '#b89058',
    billShape: 'hook', billColour: '#eac24a', brow: '#7a5f34',
    legColour: '#eac24a',
    wedgeTail: 1, fan: 1.7, spread: 1.35,
    eye: 0.13,
    
    goggles: 1,
  }),
  skulk: () => quadruped({
    
    
    
    
    len: 1.18, height: 0.54, girth: 0.26,
    body: '#d4762c', accent: '#33251a',
    earPoint: 0.17, earInner: '#e8c4a0',
    muzzle: 0.13, muzzleColour: '#ece0cc', bib: '#f0e8d6',
    socks: '#33251a',
    tail: 0.58, tailColour: '#c96c24', tailTip: '#f2ece0', brush: 0.85, tailDrop: 0.10,
    snout: 0.06, squat: 0.82, eye: 0.11,
    
    mask: '#33251a',
  }),
  sounder: () => quadruped({
    
    
    
    len: 1.5, height: 0.62, girth: 0.70,
    body: '#e8b0a4', accent: '#a4584e',
    ears: 0.15, earOut: 0.30,
    muzzle: 0.06, snoutDisc: 0.30, curlTail: 5,
    snout: 0.02, neck: 0.02, squat: 1.0, eye: 0.085,
    
    noseRing: 0.10,
  }),
  horseHerd: () => quadruped({
    
    
    
    
    
    len: 2.4, height: 1.70, girth: 0.56,
    body: '#a9784a', accent: '#2a1d12',
    crest: 0.20, earPoint: 0.15, earInner: '#c9a887',
    muzzle: 0.10, muzzleColour: '#6d4e31',
    socks: '#e6dece',
    tail: 0.78, tailColour: '#2a1d12', brush: 0.26, tailDrop: 0.94,
    neck: 0.80, squat: 0.86, eye: 0.085,
    
    bandana: '#c8452f',
  }),
  pride: () => quadruped({
    
    
    
    
    len: 2.0, height: 1.08, girth: 0.48,
    body: '#e0b566', accent: '#6b3a12',
    ears: 0.11, earOut: 0.30, mane: 1.0,
    muzzle: 0.07, muzzleColour: '#f2e2ba',
    tail: 0.62, tailColour: '#cf9f4f', tailTip: '#6b3a12', brush: 0.22, tailDrop: 0.30,
    
    
    
    snout: 0.22, neck: 0.30, eye: 0.085,
    
    scar: '#8f4a3a',
  }),
  elephant: () => quadruped({
    
    
    
    
    len: 4.4, height: 3.3, girth: 1.95, body: '#a3a19a', accent: '#7d7b76',
    ears: 1.25, earOut: 0.62, tail: 0.7, brush: 0.16, tailTip: '#5f5d59', tailDrop: 0.86,
    
    
    
    
    
    trunk: 2.25, trunkR: 0.24, tusk: 0.9,
    neck: 0.16, squat: 0.98, eye: 0.055,
    
    bell: 0.34,
  }),

  
  
  
  
  
  
  
  
  
  farmhand: () => humanoid({
    height: 1.78, body: '#4a83bd', skin: SKIN, accent: YIELD_ACCENT,
    legs: '#39465a', tool: 1,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    nose: 1.1, beard: '#6b5238',
  }),
  harvester: () => vehicle({
    
    
    
    len: 4.2, width: 2.0, height: 1.5, wheel: 0.5, wheels: 2, bigRear: 1,
    body: YIELD_BODY, accent: '#dcc46a', cab: 1, cabColour: '#3a72a8', tower: 1,
    lights: 1, driverCap: '#2f3a47',
    windsock: '#f0902a',
  }),
  bowser: () => vehicle({
    
    
    
    len: 3.1, width: 1.8, height: 1.4, wheel: 0.45, wheels: 2,
    body: STEEL, accent: '#3fbcbc', cab: 1, cabColour: '#5c6772', cabX: 0.28,
    tank: 1, upright: 1,
    lights: 1, driverCap: '#3f4a56', beard: '#5a4736',
    tapAndBucket: '#4a83bd',
  }),
  quadBike: () => vehicle({
    
    
    
    
    len: 1.6, width: 1.5, height: 0.8, wheel: 0.36, wheels: 2, chassisW: 0.46,
    body: '#d4482f', accent: '#33383f', bike: 1, riderBody: '#3f6f9c',
    driverCap: '#1f2933', bullBar: 1,
  }),
  poundWagon: () => vehicle({
    
    
    len: 4.4, width: 2.0, height: 1.6, wheel: 0.42, wheels: 3,
    body: '#8a919c', accent: '#5f6771', cab: 1, cabColour: YIELD_BODY,
    cage: 1, lights: 1, driverCap: '#2b3038', cabX: 0.32,
    
    
    captive: '#c98a4a',
  }),
  foodTruck: () => vehicle({
    
    
    
    len: 4.6, width: 2.1, height: 1.7, wheel: 0.44, wheels: 3,
    body: '#ece5cf', accent: '#cf4433', cab: 1, cabColour: '#ece5cf', awning: 1,
    lights: 1, driverCap: '#cf4433', cabX: 0.34,
    
    
    bigThing: '#b8752c',
  }),
  tractor: () => vehicle({
    
    
    len: 2.9, width: 1.9, height: 1.6, wheel: 0.62, wheels: 2, bigRear: 1,
    
    
    
    
    rearScale: 1.5, linkage: 1,
    body: '#3f9c4f', accent: YIELD_ACCENT, cab: 1, cabColour: '#2f7a3f', exhaust: 1,
    lights: 1, driverCap: '#8a6a42', hub: '#d8d2c0',
    
    dog: '#6b4a2c',
  }),
  combine: () => vehicle({
    
    
    len: 6.0, width: 3.0, height: 2.4, wheel: 0.7, wheels: 2, bigRear: 1,
    body: '#e0603a', accent: '#e6d79b', cab: 1, cabColour: '#3a4655',
    boom: 1, chute: 1, lights: 1, driverCap: '#2b3038', shades: 1,
    
    beacon: 1,
  }),
  cropDuster: () => aircraft({
    len: 5.0, width: 2.0, height: 1.1, body: '#e8c65a', accent: '#cf4433',
    cabColour: '#3a4655',
    
    scarf: '#e8e2d4',
  }),
};








































const ROT = {
  pitch: (q, c, a) => {
    const x = q[0] - c[0]; const z = q[2] - c[2];
    const sn = Math.sin(a); const cs = Math.cos(a);
    return [c[0] + x * cs + z * sn, q[1], c[2] - x * sn + z * cs];
  },
  yaw: (q, c, a) => {
    const x = q[0] - c[0]; const y = q[1] - c[1];
    const sn = Math.sin(a); const cs = Math.cos(a);
    return [c[0] + x * cs - y * sn, c[1] + x * sn + y * cs, q[2]];
  },
  roll: (q, c, a) => {
    const y = q[1] - c[1]; const z = q[2] - c[2];
    const sn = Math.sin(a); const cs = Math.cos(a);
    return [q[0], c[1] + y * cs - z * sn, c[2] + y * sn + z * cs];
  },
};









export const IDLE_RIG = Object.freeze({
  
  flock: [
    { pivot: 'neck', groups: ['neck', 'head'], axis: 'pitch', amp: 0.30 },
    { pivot: 'head', groups: ['head'], axis: 'pitch', amp: 0.30 },
  ],
  
  
  duckRaft: [
    { pivot: 'neck', groups: ['neck', 'head'], axis: 'yaw', amp: 0.40 },
    { pivot: 'head', groups: ['head'], axis: 'pitch', amp: 0.30 },
  ],
  
  
  skulk: [
    { pivot: 'neck', groups: ['neck', 'head'], axis: 'yaw', amp: 0.34 },
    { pivot: 'tail', groups: ['tail'], axis: 'pitch', amp: -0.26 },
  ],
  
  sounder: [
    { pivot: 'neck', groups: ['neck', 'head'], axis: 'pitch', amp: 0.26 },
    { pivot: 'head', groups: ['head'], axis: 'pitch', amp: 0.26 },
  ],
  
  
  horseHerd: [
    { pivot: 'neck', groups: ['neck', 'head'], axis: 'pitch', amp: 0.30 },
    { pivot: 'head', groups: ['head'], axis: 'pitch', amp: 0.24 },
  ],
  
  
  
  pride: [
    { pivot: 'neck', groups: ['neck', 'head'], axis: 'pitch', amp: -0.20 },
    { pivot: 'head', groups: ['head'], axis: 'pitch', amp: -0.30 },
  ],
  
  
  wing: [
    { pivot: 'wing', groups: ['wingL'], axis: 'roll', amp: -0.30 },
    { pivot: 'wing', groups: ['wingR'], axis: 'roll', amp: 0.30 },
    { pivot: 'head', groups: ['head'], axis: 'pitch', amp: 0.16 },
  ],
  
  elephant: [
    { pivot: 'trunk', groups: ['trunk'], axis: 'yaw', amp: 0.40 },
    { pivot: 'neck', groups: ['neck', 'head', 'trunk'], axis: 'yaw', amp: 0.10 },
  ],
  
  
  
  farmhand: [
    { pivot: 'shoulderL', groups: ['armL'], axis: 'pitch', amp: -0.95 },
    { pivot: 'neck', groups: ['head'], axis: 'pitch', amp: 0.22 },
  ],
});


export const IDLE_IDS = Object.freeze(Object.keys(IDLE_RIG).sort());


export const IDLE_STORED = 3;








export const IDLE_ORDER = Object.freeze([0, 1, 2, 3, 2, 1]);








export function idlePose(id, t) {
  const parts = buildUnitMesh(id);
  const chain = IDLE_RIG[id];
  if (!chain || t === 0) return parts;
  const piv = {};
  for (const [k, v] of Object.entries(parts.pivots)) piv[k] = [...v];
  let out = parts;
  chain.forEach((joint, i) => {
    const ang = joint.amp * t;
    const rot = ROT[joint.axis];
    const c = piv[joint.pivot];
    if (!c) throw new Error(`${id}: no pivot '${joint.pivot}'`);
    const moving = new Set(joint.groups);
    out = out.map((prt) => {
      if (!moving.has(prt.group)) return prt;
      const pos = Float32Array.from(prt.mesh.positions);
      const nor = Float32Array.from(prt.mesh.normals);
      for (let k = 0; k < pos.length; k += 3) {
        const q = rot([pos[k], pos[k + 1], pos[k + 2]], c, ang);
        pos[k] = q[0]; pos[k + 1] = q[1]; pos[k + 2] = q[2];
        
        
        
        const n = rot([nor[k], nor[k + 1], nor[k + 2]], [0, 0, 0], ang);
        nor[k] = n[0]; nor[k + 1] = n[1]; nor[k + 2] = n[2];
      }
      return { colour: prt.colour, group: prt.group, mesh: { ...prt.mesh, positions: pos, normals: nor } };
    });
    
    for (let j = i + 1; j < chain.length; j += 1) {
      const nm = chain[j].pivot;
      if (piv[nm]) piv[nm] = rot(piv[nm], c, ang);
    }
  });
  return withPivots(out, parts.pivots);
}









export function idleFrames(id, stored = IDLE_STORED) {
  const out = [];
  for (let k = 1; k <= stored; k += 1) out.push(idlePose(id, k / stored));
  return out;
}


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
