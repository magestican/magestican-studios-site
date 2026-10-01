





































import { buildUnitMesh, MESH_IDS } from './unitMeshes.js';
import { UNITS } from '../roster.js';




import { ANIM, ANIM_KINDS, ANIM_SLOTS } from './animTable.js';

export { ANIM, ANIM_KINDS, ANIM_SLOTS };

export const ANIM_IDS = MESH_IDS;





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

function copyParts(parts) {
  const out = parts.map((p) => ({
    colour: p.colour, group: p.group, limb: p.limb,
    mesh: { ...p.mesh, positions: Float32Array.from(p.mesh.positions), normals: Float32Array.from(p.mesh.normals) },
  }));
  Object.defineProperty(out, 'pivots', { value: parts.pivots, enumerable: false });
  return out;
}


function rotatePart(part, axis, c, a) {
  const rot = ROT[axis];
  const pos = part.mesh.positions;
  const nor = part.mesh.normals;
  for (let k = 0; k < pos.length; k += 3) {
    const q = rot([pos[k], pos[k + 1], pos[k + 2]], c, a);
    pos[k] = q[0]; pos[k + 1] = q[1]; pos[k + 2] = q[2];
    const n = rot([nor[k], nor[k + 1], nor[k + 2]], [0, 0, 0], a);
    nor[k] = n[0]; nor[k + 1] = n[1]; nor[k + 2] = n[2];
  }
}

function translatePart(part, d) {
  const pos = part.mesh.positions;
  for (let k = 0; k < pos.length; k += 3) { pos[k] += d[0]; pos[k + 1] += d[1]; pos[k + 2] += d[2]; }
}


export function boundsOf(parts, pred = () => true) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) {
    if (!pred(p)) continue;
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







function hipOf(parts, limb) {
  const b = boundsOf(parts, (p) => p.limb === limb);
  if (!Number.isFinite(b.max[2])) return null;
  const top = b.max[2];
  let sx = 0; let sy = 0; let n = 0;
  for (const p of parts) {
    if (p.limb !== limb) continue;
    const pos = p.mesh.positions;
    for (let i = 0; i < pos.length; i += 3) {
      if (pos[i + 2] > top - (b.max[2] - b.min[2]) * 0.12) { sx += pos[i]; sy += pos[i + 1]; n += 1; }
    }
  }
  return n ? [sx / n, sy / n, top] : null;
}







export function bodyPlan(parts, id = null) {
  const limbs = new Set(parts.map((p) => p.limb).filter(Boolean));
  const groups = new Set(parts.map((p) => p.group));
  if (limbs.has('FL') && limbs.has('HR')) return 'quadruped';
  if (groups.has('armL') || groups.has('armR')) return 'biped';
  if (limbs.has('L') && limbs.has('R')) return 'bird';
  if (id && UNITS[id] && UNITS[id].air) return 'aircraft';
  return 'vehicle';
}

const forEachIn = (parts, pred, fn) => { for (const p of parts) if (pred(p)) fn(p); };
const inLimb = (l) => (p) => p.limb === l;
const inGroup = (...gs) => (p) => gs.includes(p.group);








export function animPose(id, kind, k, scale = 1) {
  const base = buildUnitMesh(id);
  const parts = copyParts(base);
  const plan = bodyPlan(parts, id);
  const b = boundsOf(parts);
  const height = b.max[2] - b.min[2];
  const len = b.max[0] - b.min[0];
  const piv = base.pivots || {};
  const n = ANIM[kind];
  if (!(k >= 0 && k < n)) throw new Error(`${id}: ${kind} has ${n} frames, not a frame ${k}`);

  
  
  
  
  
  
  const tileHalf = Math.max(len, b.max[1] - b.min[1], height) * 0.5 * 1.26;
  const fits = (ps) => {
    const fb = boundsOf(ps);
    const cx = (b.min[0] + b.max[0]) / 2; const cy = (b.min[1] + b.max[1]) / 2;
    
    
    return Math.max(cx - fb.min[0], fb.max[0] - cx) <= tileHalf
      && Math.max(cy - fb.min[1], fb.max[1] - cy) <= tileHalf
      && fb.min[2] > b.min[2] - height * 0.05;
  };
  const refit = (ps) => ((kind === 'attack' && !fits(ps) && scale > 0.3) ? animPose(id, kind, k, scale * 0.7) : ps);

  if (kind === 'walk') {
    const t = k / n;
    const s = Math.sin(t * Math.PI * 2);
    const bob = Math.abs(Math.sin(t * Math.PI * 2)) * height * 0.03;
    if (plan === 'quadruped') {
      const A = 0.42;
      for (const [limb, sign] of [['FL', 1], ['HR', 1], ['FR', -1], ['HL', -1]]) {
        const hip = hipOf(parts, limb);
        if (hip) forEachIn(parts, inLimb(limb), (p) => rotatePart(p, 'pitch', hip, sign * A * s));
      }
      if (piv.neck) forEachIn(parts, inGroup('neck', 'head', 'trunk'), (p) => rotatePart(p, 'pitch', piv.neck, 0.08 * Math.abs(s)));
      forEachIn(parts, () => true, (p) => translatePart(p, [0, 0, bob]));
    } else if (plan === 'bird') {
      const A = 0.55;
      for (const [limb, sign] of [['L', 1], ['R', -1]]) {
        const hip = hipOf(parts, limb);
        if (hip) forEachIn(parts, inLimb(limb), (p) => rotatePart(p, 'pitch', hip, sign * A * s));
      }
      
      
      if (piv.neck) forEachIn(parts, inGroup('neck', 'head'), (p) => rotatePart(p, 'pitch', piv.neck, 0.18 * s));
      forEachIn(parts, () => true, (p) => translatePart(p, [0, 0, bob]));
    } else if (plan === 'biped') {
      const A = 0.5;
      for (const [limb, sign] of [['L', 1], ['R', -1]]) {
        const hip = hipOf(parts, limb);
        if (hip) forEachIn(parts, inLimb(limb), (p) => rotatePart(p, 'pitch', hip, sign * A * s));
      }
      
      if (piv.shoulderL) forEachIn(parts, inGroup('armL'), (p) => rotatePart(p, 'pitch', piv.shoulderL, -0.35 * s));
      if (piv.shoulderR) forEachIn(parts, inGroup('armR', 'tool'), (p) => rotatePart(p, 'pitch', piv.shoulderR, 0.35 * s));
      forEachIn(parts, () => true, (p) => translatePart(p, [0, 0, bob]));
    } else if (plan === 'aircraft') {
      const c = [(b.min[0] + b.max[0]) / 2, 0, (b.min[2] + b.max[2]) / 2];
      forEachIn(parts, () => true, (p) => rotatePart(p, 'roll', c, 0.07 * s));
      forEachIn(parts, () => true, (p) => translatePart(p, [0, 0, height * 0.04 * Math.sin(t * Math.PI * 2 + 1)]));
    } else {
      
      const c = [(b.min[0] + b.max[0]) / 2, 0, b.min[2]];
      forEachIn(parts, () => true, (p) => rotatePart(p, 'pitch', c, 0.035 * s));
      forEachIn(parts, () => true, (p) => translatePart(p, [0, 0, height * 0.025 * Math.abs(s)]));
    }
    return parts;
  }

  if (kind === 'attack') {
    
    const strike = k === 1;
    if (plan === 'quadruped' || plan === 'bird') {
      const hind = [b.min[0] + len * 0.25, 0, b.min[2]];
      if (strike) {
        
        
        
        const neckA = (plan === 'bird' ? 0.34 : 0.45) * scale;
        const lunge = (plan === 'bird' ? 0.02 : 0.045) * scale;
        if (piv.neck) forEachIn(parts, inGroup('neck', 'head', 'mane'), (p) => rotatePart(p, 'pitch', piv.neck, neckA));
        
        
        
        
        if (piv.trunk) forEachIn(parts, inGroup('trunk'), (p) => rotatePart(p, 'pitch', piv.trunk, -0.18));
        
        
        
        
        
        
        
        forEachIn(parts, () => true, (p) => translatePart(p, [len * lunge, 0, height * 0.03]));
        forEachIn(parts, () => true, (p) => rotatePart(p, 'pitch', hind, 0.06));
      } else {
        if (piv.neck) forEachIn(parts, inGroup('neck', 'head', 'mane'), (p) => rotatePart(p, 'pitch', piv.neck, -0.22));
        forEachIn(parts, () => true, (p) => rotatePart(p, 'pitch', hind, -0.08));
      }
    } else if (plan === 'biped') {
      
      if (piv.shoulderR) forEachIn(parts, inGroup('armR', 'tool'), (p) => rotatePart(p, 'pitch', piv.shoulderR, strike ? 0.9 : -1.1));
      const foot = [0, 0, b.min[2]];
      forEachIn(parts, () => true, (p) => rotatePart(p, 'pitch', foot, strike ? 0.12 : -0.06));
    } else if (plan === 'aircraft') {
      
      
      
      const c = [(b.min[0] + b.max[0]) / 2, 0, (b.min[2] + b.max[2]) / 2];
      forEachIn(parts, () => true, (p) => rotatePart(p, 'pitch', c, strike ? 0.16 : -0.06));
      forEachIn(parts, () => true, (p) => translatePart(p, [0, 0, strike ? len * 0.5 * Math.sin(0.16) : 0]));
    } else {
      
      forEachIn(parts, () => true, (p) => translatePart(p, [strike ? -len * 0.05 : len * 0.02, 0, 0]));
      const c = [(b.min[0] + b.max[0]) / 2, 0, b.min[2]];
      forEachIn(parts, () => true, (p) => rotatePart(p, 'pitch', c, strike ? -0.06 : 0.03));
    }
    return refit(parts);
  }

  
  
  
  
  
  
  const t = (k + 1) / ANIM.die;
  const c = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, b.min[2] + height * 0.45];
  
  
  
  
  const wide = (b.max[1] - b.min[1]) > height * 1.05;
  if (plan === 'aircraft') {
    forEachIn(parts, () => true, (p) => rotatePart(p, 'yaw', c, 1.3 * t));
    forEachIn(parts, () => true, (p) => translatePart(p, [0, 0, -height * 0.42 * t]));
    return parts;
  }
  if (wide) {
    
    
    
    
    forEachIn(parts, () => true, (p) => rotatePart(p, 'pitch', c, 0.30 * t));
    forEachIn(parts, () => true, (p) => translatePart(p, [0, 0, -height * 0.42 * t]));
    return parts;
  }
  forEachIn(parts, () => true, (p) => rotatePart(p, 'roll', c, 1.45 * t));
  forEachIn(parts, () => true, (p) => translatePart(p, [0, 0, -height * 0.30 * t * t]));
  return parts;
}


export function animFrames(id) {
  const out = {};
  for (const kind of ANIM_KINDS) {
    out[kind] = [];
    for (let k = 0; k < ANIM[kind]; k += 1) out[kind].push(animPose(id, kind, k));
  }
  return out;
}
