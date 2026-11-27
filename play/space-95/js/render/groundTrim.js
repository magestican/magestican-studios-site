






import * as THREE from 'three';
import { batchStatic } from './batch.js';
import { skinMaterial, worldUV } from './biomeArt.js';

const BACK_Z = 0.3 - 2.4 - 0.02; 
const INK = 0x3a2412; 





function ribbon(line, width, z) {
  const pos = [];
  const idx = [];
  for (let i = 0; i < line.length; i++) {
    const [ax, ay] = line[Math.max(0, i - 1)];
    const [bx, by] = line[Math.min(line.length - 1, i + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = (-(by - ay) / len) * (width / 2);
    const ny = ((bx - ax) / len) * (width / 2);
    const [x, y] = line[i];
    pos.push(x + nx, y + ny, z, x - nx, y - ny, z);
    if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}


export const TRIM = {
  tuft: [0.04, 0.14], 
  hem: [0.36, 1.0], 
  overhang: 0.3, 
  
  
  flank: [0.06, 0.45],
  drop: [0.06, 0.45],
  ink: 0.07, 
  step: 0.2, 
};
const Z = { flank: 0.31, under: 0.315, turf: 0.335 }; 


function hash01(...n) {
  let h = 2166136261;
  for (const k of n) {
    h ^= k + 0x9e3779b9;
    h = Math.imul(h, 16777619) >>> 0;
    h ^= h >>> 13;
  }
  return (Math.imul(h, 2246822519) >>> 0) / 4294967296;
}


function noise(u, seed) {
  const at = (s, f) => {
    const i = Math.floor(u * f);
    const t = u * f - i;
    const k = t * t * (3 - 2 * t);
    return hash01(i, seed, s) * (1 - k) + hash01(i + 1, seed, s) * k;
  };
  
  
  return 0.7 * at(1, 0.55) + 0.3 * at(2, 2.3);
}
const lerp = ([a, b], t) => a + (b - a) * t;








export function trimLayout(world) {
  const T = world.tile;
  const W = world.width;
  const H = world.height;
  const ground = (c, r) => c >= 0 && c < W && r >= 0 && r < H && world.solid(c, r) && !world.soil?.(c, r);
  
  
  const air = (c, r) => !ground(c, r);
  
  const out = [];
  const samples = (a, b) => {
    const n = Math.max(2, Math.ceil((b - a) / (TRIM.step * T)) + 1);
    return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
  };

  for (let r = 0; r < H; r++) {
    
    for (let c = 0; c < W; ) {
      if (!(ground(c, r) && !ground(c, r + 1))) {
        c++;
        continue;
      }
      let e = c + 1;
      while (e < W && ground(e, r) && !ground(e, r + 1)) e++;
      const y = (r + 1) * T;
      const openL = air(c - 1, r);
      const openR = air(e, r);
      const x0 = c * T - (openL ? TRIM.overhang * T : 0);
      const x1 = e * T + (openR ? TRIM.overhang * T : 0);
      const seed = r * 977 + 1;
      
      const roll = (x) => {
        const dl = openL ? (x - x0) / (TRIM.overhang * 2 * T) : 1;
        const dr = openR ? (x1 - x) / (TRIM.overhang * 2 * T) : 1;
        return Math.max(0, Math.min(1, dl, dr));
      };
      const xs = samples(x0, x1);
      const top = xs.map((x) => {
        const k = roll(x);
        const up = lerp(TRIM.tuft, noise(x / T, seed)) * T;
        return [x, y + up * k - (1 - k) * (1 - k) * TRIM.hem[0] * T * 0.9];
      });
      const hem = xs.map((x) => [x, y - lerp(TRIM.hem, noise(x / T + 50, seed + 7)) * T]);
      out.push({ kind: 'turf', z: Z.turf, pts: [...top, ...hem.slice().reverse()], ink: [top, hem] });
      c = e;
    }
    
    for (let c = 0; c < W; ) {
      if (!(ground(c, r) && air(c, r - 1))) {
        c++;
        continue;
      }
      let e = c + 1;
      while (e < W && ground(e, r) && air(e, r - 1)) e++;
      const y = r * T;
      const xs = samples(c * T, e * T);
      const seed = r * 613 + 3;
      
      const bottom = xs.map((x, i) => {
        const k = Math.min(1, i / 2, (xs.length - 1 - i) / 2);
        return [x, y - lerp(TRIM.drop, noise(x / T, seed)) * T * k];
      });
      out.push({
        kind: 'under',
        z: Z.under,
        pts: [[c * T, y + 0.08 * T], [e * T, y + 0.08 * T], ...bottom.slice().reverse()],
        ink: [bottom],
      });
      c = e;
    }
  }
  
  for (const side of [-1, 1])
    for (let c = 0; c < W; c++)
      for (let r = 0; r < H; ) {
        if (!(ground(c, r) && air(c + side, r))) {
          r++;
          continue;
        }
        let e = r + 1;
        while (e < H && ground(c, e) && air(c + side, e)) e++;
        const y0 = r * T;
        const y1 = e * T - (ground(c, e) ? 0 : TRIM.hem[0] * T);
        const edgeX = side < 0 ? c * T : (c + 1) * T;
        const seed = c * 389 + (side < 0 ? 5 : 11);
        const ys = samples(y0, y1);
        const outer = ys.map((y, i) => {
          
          const k = air(c, r - 1) ? Math.min(1, i / 2) : 1;
          return [edgeX + side * lerp(TRIM.flank, noise(y / T, seed)) * T * k, y];
        });
        const inner = [
          [edgeX - side * 0.1 * T, y1],
          [edgeX - side * 0.1 * T, y0],
        ];
        out.push({ kind: 'flank', z: Z.flank, pts: [...outer, ...inner], ink: [outer] });
        r = e;
      }
  return out;
}








export function trimMeshes(world, skins) {
  const group = new THREE.Group();
  if (!skins.top || !skins.solid) return group;
  const T = world.tile;
  const tinted = (spec) => ({ ...spec, tint: new THREE.Color(spec.tint).multiply(new THREE.Color(skins.tint ?? 0xffffff)).getHex() });
  const mat = (spec) => {
    const m = new THREE.MeshLambertMaterial({ color: spec.tint });
    skinMaterial(m, spec);
    return m;
  };
  const turf = { spec: tinted(skins.top), mat: null };
  const earth = { spec: tinted(skins.solid), mat: null };
  turf.mat = mat(turf.spec);
  earth.mat = mat(earth.spec);
  const ink = new THREE.MeshBasicMaterial({ color: new THREE.Color(INK).multiply(new THREE.Color(skins.tint ?? 0xffffff)) });
  for (const p of trimLayout(world)) {
    const skin = p.kind === 'turf' ? turf : earth;
    
    
    const depth = p.z - BACK_Z;
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape(p.pts.map(([x, y]) => new THREE.Vector2(x, y))), {
      depth,
      bevelEnabled: false,
    });
    worldUV(geo, new THREE.Vector3(0, 0, BACK_Z), skin.spec.unit * T);
    const m = new THREE.Mesh(geo, skin.mat);
    m.position.z = BACK_Z;
    group.add(m);
    
    for (const line of p.ink) group.add(new THREE.Mesh(ribbon(line, TRIM.ink * T, p.z + 0.004), ink));
  }
  return batchStatic(group, 16 * T);
}
