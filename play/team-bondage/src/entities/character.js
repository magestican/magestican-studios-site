








import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const GLB_BASE = '/play/team-bondage/assets/hand-drawn/characters/';
const _loader = new GLTFLoader();
const _cache = new Map();   

async function loadGlbIfExists(kind) {
  if (_cache.has(kind)) return _cache.get(kind);
  const url = GLB_BASE + kind + '.glb';
  const p = new Promise((resolve) => {
    _loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      () => resolve(null),   
    );
  });
  _cache.set(kind, p);
  return p;
}

const cube = (w, h, d, hex) => {
  const mat = new THREE.MeshLambertMaterial({
    color: new THREE.Color(hex), flatShading: true,
  });
  const g = new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(g, mat);
};

function pos(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }





export function buildCharacter(kind, teamTintHex) {
  const proc =
    kind === 'chicken' ? buildChicken(teamTintHex) :
    kind === 'pig'     ? buildPig(teamTintHex) :
    kind === 'sheep'   ? buildSheep(teamTintHex) :
                         buildCow(teamTintHex);
  
  
  
  
  
  
  
  for (const c of proc.group.children) c.userData.placeholder = true;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const pivot = new THREE.Group();
  pivot.userData.idlePivot = true;
  for (const c of [...proc.group.children]) pivot.add(c);
  proc.group.add(pivot);
  proc.idlePivot = pivot;

  
  loadGlbIfExists(kind).then((scene) => {
    if (!scene) return;
    
    
    
    
    
    
    
    
    const body = scene.clone(true);
    body.rotation.y = Math.PI;   
    for (const c of [...pivot.children]) {
      if (c.userData.placeholder && c !== proc.headBone) pivot.remove(c);
    }
    
    if (proc.headBone) proc.headBone.visible = false;
    body.userData.characterBody = true;
    pivot.add(body);
  });
  return proc;
}




























function buildCow(teamHex) {
  const g = new THREE.Group();
  
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512),  0.20, 0.25,  0.35));
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512), -0.20, 0.25,  0.35));
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512),  0.20, 0.25, -0.35));
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512), -0.20, 0.25, -0.35));
  
  g.add(pos(cube(0.70, 0.55, 1.05, 0xf2ede2), 0, 0.80, 0));
  
  g.add(pos(cube(0.25, 0.20, 0.30, 0x1a1512), 0.36, 0.85, 0.10));
  g.add(pos(cube(0.30, 0.15, 0.25, 0x1a1512), -0.36, 0.70, -0.20));
  
  const head = pos(cube(0.55, 0.55, 0.55, 0xf2ede2), 0, 1.00, 0.75);
  g.add(head);
  g.add(pos(cube(0.10, 0.20, 0.10, 0xffffff),  0.20, 1.30, 0.70));
  g.add(pos(cube(0.10, 0.20, 0.10, 0xffffff), -0.20, 1.30, 0.70));
  g.add(pos(cube(0.20, 0.10, 0.15, 0xff8fbc), 0, 0.87, 1.02));  
  return { group: g, headBone: head, eyeHeight: 1.3 };
}



function buildChicken(teamHex) {
  const g = new THREE.Group();
  g.add(pos(cube(0.10, 0.35, 0.10, 0xffcc55),  0.12, 0.18,  0));
  g.add(pos(cube(0.10, 0.35, 0.10, 0xffcc55), -0.12, 0.18,  0));
  g.add(pos(cube(0.55, 0.55, 0.75, 0xffffff), 0, 0.60, 0));
  
  g.add(pos(cube(0.10, 0.30, 0.60, 0xefe9d8), 0.32, 0.60, 0));
  g.add(pos(cube(0.10, 0.30, 0.60, 0xefe9d8), -0.32, 0.60, 0));
  
  const head = pos(cube(0.40, 0.40, 0.40, 0xffffff), 0, 1.05, 0.30);
  g.add(head);
  g.add(pos(cube(0.10, 0.20, 0.35, 0xb73a2a), 0, 1.35, 0.28));  
  g.add(pos(cube(0.10, 0.10, 0.25, 0xf4c95d), 0, 1.02, 0.60));  
  return { group: g, headBone: head, eyeHeight: 1.3 };
}



function buildPig(teamHex) {
  const g = new THREE.Group();
  g.add(pos(cube(0.15, 0.4, 0.15, 0xd67c7c),  0.22, 0.20,  0.30));
  g.add(pos(cube(0.15, 0.4, 0.15, 0xd67c7c), -0.22, 0.20,  0.30));
  g.add(pos(cube(0.15, 0.4, 0.15, 0xd67c7c),  0.22, 0.20, -0.30));
  g.add(pos(cube(0.15, 0.4, 0.15, 0xd67c7c), -0.22, 0.20, -0.30));
  g.add(pos(cube(0.75, 0.60, 1.05, 0xf29a9a), 0, 0.70, 0));
  const head = pos(cube(0.55, 0.50, 0.50, 0xf29a9a), 0, 0.85, 0.75);
  g.add(head);
  g.add(pos(cube(0.30, 0.20, 0.15, 0xffc4c4), 0, 0.80, 1.02));   
  g.add(pos(cube(0.08, 0.15, 0.08, 0xffc4c4),  0.15, 1.15, 0.70));
  g.add(pos(cube(0.08, 0.15, 0.08, 0xffc4c4), -0.15, 1.15, 0.70));
  return { group: g, headBone: head, eyeHeight: 1.2 };
}



function buildSheep(teamHex) {
  const g = new THREE.Group();
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512),  0.22, 0.25,  0.32));
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512), -0.22, 0.25,  0.32));
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512),  0.22, 0.25, -0.32));
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512), -0.22, 0.25, -0.32));
  
  const wool = 0xf6f1e6;
  g.add(pos(cube(0.80, 0.65, 1.10, wool), 0, 0.80, 0));
  g.add(pos(cube(0.20, 0.20, 0.20, wool),  0.35, 1.05,  0.30));
  g.add(pos(cube(0.20, 0.20, 0.20, wool), -0.35, 1.05,  0.30));
  g.add(pos(cube(0.20, 0.20, 0.20, wool),  0.30, 1.10, -0.30));
  const head = pos(cube(0.40, 0.45, 0.45, 0x2a231b), 0, 0.90, 0.72);
  g.add(head);
  g.add(pos(cube(0.10, 0.20, 0.10, 0xf6f1e6),  0.15, 1.25, 0.70));
  g.add(pos(cube(0.10, 0.20, 0.10, 0xf6f1e6), -0.15, 1.25, 0.70));
  return { group: g, headBone: head, eyeHeight: 1.3 };
}
