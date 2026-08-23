













import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SeededRng } from '../../../../web-engine/rng/seededRng.js';
import { WORLD_SIZE, perArea, insideZone } from '../../../../web-engine/procgen/voxelWorldGen.js';

const GLB_BASE = '/play/team-bondage/assets/hand-drawn/props/';
const _loader = new GLTFLoader();




const SCATTER = {
  snowman:    8,
  'fence-post': 40,
  'hay-bale':  6,
  barrel:      7,
  crate:       9,
  
  
};





const PARKED = { tractor: (world) => world.tractorParking ?? [] };



function makeFallback(id) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.4, 0.8),
    new THREE.MeshLambertMaterial({ color: 0xff44dd, flatShading: true }),
  );
  box.position.y = 0.7;
  g.add(box);
  g.userData.propId = id;
  g.userData.fallback = true;
  return g;
}


const _cache = new Map();
async function loadProp(id) {
  if (_cache.has(id)) return _cache.get(id);
  const url = GLB_BASE + id + '.glb';
  const p = new Promise((resolve) => {
    _loader.load(url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (err) => {
        console.warn(`[mapProps] failed to load ${url}, using fallback`, err?.message || err);
        resolve(makeFallback(id));
      },
    );
  });
  _cache.set(id, p);
  return p;
}

function isInsideBaseOrHill(x, z, world) {
  const inBase = (b) => x >= b.x - 1 && x <= b.x + 10 && z >= b.z - 1 && z <= b.z + 10;
  if (inBase(world.redBase) || inBase(world.blueBase)) return true;
  const hx = world.hillSpawn.x, hz = world.hillSpawn.z;
  return Math.abs(x - hx) < 4 && Math.abs(z - hz) < 4;
}


export async function scatterMapProps(scene, world) {
  const group = new THREE.Group();
  group.name = 'mapProps';
  scene.add(group);
  console.log('[mapProps] scattering props for seed', world.seed);

  
  const rng = new SeededRng((world.seed ^ 0x51EED91E) >>> 0);
  const { x: W, z: D } = WORLD_SIZE;

  
  const loaded = {};
  for (const id of [...Object.keys(SCATTER), ...Object.keys(PARKED)]) {
    loaded[id] = await loadProp(id);
  }

  let parked = 0;
  for (const [id, spotsOf] of Object.entries(PARKED)) {
    const base = loaded[id];
    if (!base) continue;
    for (const spot of spotsOf(world)) {
      const inst = base.clone(true);
      inst.position.set(spot.x + 0.5, 1.0, spot.z + 0.5);
      
      
      
      inst.rotation.y = spot.yaw;
      inst.scale.setScalar(1.0);
      group.add(inst);
      parked++;
    }
  }

  let placed = 0;
  for (const [id, count] of Object.entries(SCATTER)) {
    const base = loaded[id];
    if (!base) continue;
    for (let i = 0; i < perArea(count); i++) {
      
      for (let attempt = 0; attempt < 20; attempt++) {
        const x = rng.rangeI(3, W - 4);
        const z = rng.rangeI(3, D - 4);
        if (isInsideBaseOrHill(x, z, world)) continue;
        if (insideZone(x, z, world.powerUpZones)) continue;
        
        if (world.grid.isSolid(x + 0.5, 1.5, z + 0.5)) continue;
        const inst = base.clone(true);
        inst.position.set(x + 0.5, 1.0, z + 0.5);
        
        inst.rotation.y = rng.rangeF(0, Math.PI * 2);
        
        const s = 0.85 + rng.rangeF(0, 0.35);
        inst.scale.setScalar(s);
        group.add(inst);
        placed++;
        break;
      }
    }
  }
  console.log(`[mapProps] placed ${placed} scattered + ${parked} parked instances`);
  return group;
}
