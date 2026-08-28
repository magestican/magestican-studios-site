


















import * as THREE from 'three';
import { PALETTE, HOUSE } from '../palette.js';





const SHIRTS = [
  PALETTE.barnRed, HOUSE.skyBlue, PALETTE.gold,
  0x6a9a55, 0xc46a3a, 0x8f7bb5, PALETTE.ceiling, 0x4f7fa8,
];
const SKINS = [0xe8bd93, 0xc98d5f, 0x8d5a34, 0xf0d0ae];


export const CHEER_RADIUS = 46;

function rngFrom(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}









export function buildSpectators(path, count = 64, { shoulder = 7, seed = 0xc0ffee } = {}) {
  const group = new THREE.Group();
  group.name = 'spectators';
  const rng = rngFrom(seed);

  const bodyGeo = new THREE.CylinderGeometry(0.17, 0.23, 0.78, 6);
  bodyGeo.translate(0, 0.39, 0);
  const headGeo = new THREE.IcosahedronGeometry(0.17, 0);
  headGeo.translate(0, 0.95, 0);
  
  
  
  const armGeo = new THREE.BoxGeometry(0.09, 0.5, 0.09);
  armGeo.translate(0, -0.25, 0);

  const mat = (c) => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
  const bodies = new THREE.InstancedMesh(bodyGeo, mat(0xffffff), count);
  const heads = new THREE.InstancedMesh(headGeo, mat(0xffffff), count);
  const armL = new THREE.InstancedMesh(armGeo, mat(0xffffff), count);
  const armR = new THREE.InstancedMesh(armGeo, mat(0xffffff), count);
  for (const m of [bodies, heads, armL, armR]) {
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    m.castShadow = true;
  }
  armL.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  armR.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const people = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const colour = new THREE.Color();

  let placed = 0;
  while (placed < count) {
    
    
    
    const i = Math.floor(rng() * path.count) % path.count;
    const p = path.pts[i];
    const t = path.tangents[i];
    const side = rng() > 0.5 ? 1 : -1;
    const clump = 2 + Math.floor(rng() * 5);
    for (let c = 0; c < clump && placed < count; c += 1, placed += 1) {
      
      
      
      const out = ((p.width / 2) + shoulder + 2.6 + rng() * 3.4) * side;
      const along = (rng() - 0.5) * 5.5;
      const x = p.x + t.z * out + t.x * along;
      const z = p.z - t.x * out + t.z * along;
      const scale = 0.86 + rng() * 0.3;
      
      
      const yaw = Math.atan2(-t.z * side, t.x * side) + (rng() - 0.5) * 0.7;

      e.set(0, yaw, 0);
      q.setFromEuler(e);
      v.set(x, 0, z);
      m4.compose(v, q, one.clone().multiplyScalar(scale));
      bodies.setMatrixAt(placed, m4);
      heads.setMatrixAt(placed, m4);

      colour.setHex(SHIRTS[Math.floor(rng() * SHIRTS.length)]);
      bodies.setColorAt(placed, colour);
      colour.setHex(SKINS[Math.floor(rng() * SKINS.length)]);
      heads.setColorAt(placed, colour);
      armL.setColorAt(placed, colour);
      armR.setColorAt(placed, colour);

      people.push({
        x, z, yaw, scale,
        
        
        
        
        phase: rng() * Math.PI * 2,
        rate: 6.5 + rng() * 4.5,
        
        both: rng() > 0.35,
      });
    }
  }

  for (const m of [bodies, heads]) m.instanceMatrix.needsUpdate = true;
  group.add(bodies, heads, armL, armR);
  group.userData = { people, armL, armR, m4, q, e, v, one };
  return group;
}








export function updateSpectators(group, time, focusX, focusZ) {
  const d = group.userData;
  if (!d || !d.people) return;
  const { people, armL, armR, m4, q, e, v, one } = d;

  for (let i = 0; i < people.length; i += 1) {
    const p = people[i];
    const dx = p.x - focusX;
    const dz = p.z - focusZ;
    
    
    const d2 = dx * dx + dz * dz;
    const near = Math.max(0, 1 - d2 / (CHEER_RADIUS * CHEER_RADIUS));
    
    
    
    const excite = near * near;
    const swing = Math.sin(time * p.rate + p.phase);
    const lift = 0.35 + excite * 2.25;

    for (const [mesh, sign, active] of [[armL, 1, true], [armR, -1, p.both]]) {
      const raise = active ? lift + swing * excite * 0.55 : 0.3;
      e.set(0, p.yaw, sign * raise);
      q.setFromEuler(e);
      
      v.set(
        p.x + Math.cos(p.yaw) * sign * 0.2 * p.scale,
        0.82 * p.scale,
        p.z - Math.sin(p.yaw) * sign * 0.2 * p.scale,
      );
      m4.compose(v, q, one.clone().multiplyScalar(p.scale));
      mesh.setMatrixAt(i, m4);
    }
  }
  armL.instanceMatrix.needsUpdate = true;
  armR.instanceMatrix.needsUpdate = true;
}
