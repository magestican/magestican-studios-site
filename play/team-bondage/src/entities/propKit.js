










import * as THREE from 'three';
import { PROPS, SCATTER_JITTER, FIXED_YAW } from './propKitSpec.js';
import { addMapBackdrop } from './mapBackdrop.js';
import { SeededRng } from '../../../../web-engine/rng/seededRng.js';
import { WORLD_SIZE, perArea, insideZone } from '../../../../web-engine/procgen/voxelWorldGen.js';





const WORLD = WORLD_SIZE;




const _mats = new Map();
function matFor(hex, glow) {
  const key = `${hex}:${glow || 0}`;
  if (!_mats.has(key)) {
    _mats.set(key, new THREE.MeshLambertMaterial({
      color: new THREE.Color(hex),
      flatShading: true,
      
      
      
      
      ...(glow ? { emissive: new THREE.Color(hex), emissiveIntensity: glow } : {}),
    }));
  }
  return _mats.get(key);
}


export function buildProp(id) {
  const parts = PROPS[id];
  if (!parts) return null;
  const g = new THREE.Group();
  g.name = `prop:${id}`;
  for (const part of parts) {
    const [x, y, z, w, h, d] = part.p;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matFor(part.hex, part.glow));
    mesh.position.set(x, y, z);
    if (part.tiltX) mesh.rotation.x = part.tiltX;
    if (part.tiltY) mesh.rotation.y = part.tiltY;
    if (part.tiltZ) mesh.rotation.z = part.tiltZ;
    g.add(mesh);
  }
  return g;
}



export function propHeight(id) {
  const parts = PROPS[id] || [];
  let top = 0;
  for (const p of parts) top = Math.max(top, p.p[1] + p.p[4] / 2);
  return top;
}


export function scatterPropKit(scene, world) {
  
  
  
  
  
  addMapBackdrop(scene, world);

  const kit = world.map?.kit;
  const group = new THREE.Group();
  group.name = 'propKit';
  scene.add(group);
  if (!kit) return group;

  
  
  const rng = new SeededRng((world.seed ^ 0x7A9C31B5) >>> 0);
  const grid = world.grid;

  const insideBase = (x, z, b) =>
    x >= b.x - 2 && x <= b.x + 12 && z >= b.z - 2 && z <= b.z + 12;
  const nearCentre = (x, z) =>
    Math.abs(x - WORLD.x / 2) < 5 && Math.abs(z - WORLD.z / 2) < 5;

  
  
  
  const taken = new Set();

  let placed = 0, skipped = 0;
  for (const [id, count] of Object.entries(kit)) {
    const base = buildProp(id);
    if (!base) { skipped += count; continue; }
    const tall = propHeight(id);
    
    
    const want = perArea(count);
    for (let i = 0; i < want; i++) {
      let done = false;
      for (let attempt = 0; attempt < 24 && !done; attempt++) {
        const x = rng.rangeI(3, WORLD.x - 4);
        const z = rng.rangeI(3, WORLD.z - 4);
        if (taken.has(`${x},${z}`)) continue;
        if (insideBase(x, z, world.redBase) || insideBase(x, z, world.blueBase)) continue;
        if (nearCentre(x, z)) continue;
        
        
        if (insideZone(x, z, world.powerUpZones)) continue;
        
        
        
        const y = surfaceY(grid, x, z);
        if (y == null) continue;
        
        
        if (y + tall > 11) continue;

        const inst = base.clone(true);
        const jx = (rng.rangeF(0, 1) - 0.5) * 2 * SCATTER_JITTER.offset;
        const jz = (rng.rangeF(0, 1) - 0.5) * 2 * SCATTER_JITTER.offset;
        inst.position.set(x + 0.5 + jx, y, z + 0.5 + jz);
        if (!FIXED_YAW.has(id)) inst.rotation.y = rng.rangeF(0, Math.PI * 2);
        const s = rng.rangeF(SCATTER_JITTER.scale[0], SCATTER_JITTER.scale[1]);
        inst.scale.setScalar(s);
        group.add(inst);
        taken.add(`${x},${z}`);
        placed++;
        done = true;
      }
      if (!done) skipped++;
    }
  }
  console.log(`[propKit] ${world.mapId}: placed ${placed} props (${skipped} could not find a tile)`);
  return group;
}




function surfaceY(grid, x, z) {
  for (let y = 1; y < 11; y++) {
    if (!grid.isSolid(x + 0.5, y + 0.5, z + 0.5)) {
      
      
      if (grid.isSolid(x + 0.5, y + 1.5, z + 0.5)) return null;
      return y;
    }
  }
  return null;
}
