





















import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PALETTE } from '../palette.js';










const GLB_BASE = new URL('../../assets/hand-drawn/characters/', import.meta.url).href;
const loader = new GLTFLoader();
const cache = new Map();

function loadDriver(species) {
  if (cache.has(species)) return cache.get(species);
  const p = new Promise((resolve) => {
    loader.load(
      `${GLB_BASE}${species}.glb`,
      (gltf) => resolve(gltf.scene),
      undefined,
      
      
      
      
      (err) => {
        lastError = `${species}: ${err && (err.message || err.type) ? (err.message || err.type) : err}`;
        resolve(null);
      },
    );
  });
  cache.set(species, p);
  return p;
}
















let lastError = null;
export function driversReady() {
  return Promise.all([...cache.values()]).then((scenes) => ({
    total: scenes.length,
    loaded: scenes.filter(Boolean).length,
    lastError,
  }));
}

const box = (w, h, d, colour) => new THREE.Mesh(
  new THREE.BoxGeometry(w, h, d),
  new THREE.MeshLambertMaterial({ color: colour, flatShading: true }),
);








export function buildKart(character, variant = 0) {
  const group = new THREE.Group();
  group.name = `kart-${character.id}`;

  
  
  
  let s = (variant * 2246822519 + 374761393) >>> 0 || 1;
  const rng = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  const jitter = (amount) => 1 + (rng() - 0.5) * amount;

  const tint = character.tint;

  
  
  
  const floor = box(1.5, 0.16, 2.5, tint);
  floor.position.y = 0.30;
  group.add(floor);

  const nose = box(1.05, 0.30, 0.9, tint);
  nose.position.set(0, 0.44, 1.25);
  group.add(nose);

  
  
  
  
  
  
  
  
  const sidepodL = box(0.30, 0.34, 1.5, tint);
  sidepodL.position.set(0.72, 0.44, -0.05);
  group.add(sidepodL);
  const sidepodR = sidepodL.clone();
  sidepodR.position.x = -0.72;
  group.add(sidepodR);

  
  
  
  
  const engine = box(0.9, 0.5, 0.66, PALETTE.engine);
  engine.position.set(0, 0.56, -1.15);
  group.add(engine);
  for (const x of [-0.26, 0.26]) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.09, 0.62, 6),
      new THREE.MeshLambertMaterial({ color: PALETTE.chrome, flatShading: true }),
    );
    pipe.position.set(x, 0.92, -1.28);
    pipe.rotation.x = -0.32;
    group.add(pipe);
  }

  
  
  const bar = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.055, 5, 10, Math.PI),
    new THREE.MeshLambertMaterial({ color: PALETTE.chrome, flatShading: true }),
  );
  bar.position.set(0, 0.86, -0.72);
  group.add(bar);

  const steering = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.045, 5, 10),
    new THREE.MeshLambertMaterial({ color: PALETTE.night, flatShading: true }),
  );
  steering.position.set(0, 0.86, 0.62);
  steering.rotation.x = 1.05;
  group.add(steering);

  
  
  
  const wheels = { fl: null, fr: null, rl: null, rr: null };
  const mkWheel = (r, w) => {
    const g = new THREE.CylinderGeometry(r, r, w, 10);
    g.rotateZ(Math.PI / 2);
    const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: PALETTE.tyre, flatShading: true }));
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(r * 0.45, r * 0.45, w + 0.03, 6),
      new THREE.MeshLambertMaterial({ color: PALETTE.chrome, flatShading: true }),
    );
    hub.rotation.z = Math.PI / 2;
    mesh.add(hub);
    return mesh;
  };
  
  
  const frontR = 0.34 * jitter(0.05);
  const rearR = 0.42 * jitter(0.05);
  const layout = [
    ['fl', 0.82, frontR, 0.28, 0.95],
    ['fr', -0.82, frontR, 0.28, 0.95],
    ['rl', 0.88, rearR, 0.40, -1.0],
    ['rr', -0.88, rearR, 0.40, -1.0],
  ];
  
  
  const steerPivotL = new THREE.Group();
  const steerPivotR = new THREE.Group();
  for (const [key, x, r, w, z] of layout) {
    const wheel = mkWheel(r, w);
    const holder = key === 'fl' ? steerPivotL : key === 'fr' ? steerPivotR : null;
    if (holder) {
      holder.position.set(x, r, z);
      holder.add(wheel);
      group.add(holder);
    } else {
      wheel.position.set(x, r, z);
      group.add(wheel);
    }
    wheels[key] = wheel;
  }
  wheels.steerL = steerPivotL;
  wheels.steerR = steerPivotR;

  
  
  const driverPivot = new THREE.Group();
  driverPivot.position.set(0, 0.34, -0.10);
  group.add(driverPivot);

  const placeholder = box(0.55, 0.7, 0.5, tint);
  placeholder.position.y = 0.35;
  placeholder.userData.placeholder = true;
  driverPivot.add(placeholder);

  loadDriver(character.species).then((scene) => {
    if (!scene) return;
    
    
    
    
    const body = scene.clone(true);
    const bbox = new THREE.Box3().setFromObject(body);
    const height = bbox.max.y - bbox.min.y || 1;
    
    
    
    
    const scale = 1.0 / height;

    
    
    
    
    
    
    
    
    
    const pivot = new THREE.Group();
    pivot.rotation.y = Math.PI;
    pivot.add(body);

    body.scale.setScalar(scale);
    body.position.y = -bbox.min.y * scale;
    
    
    
    
    pivot.rotation.x = 0.20;
    pivot.position.z = 0.12;
    for (const child of [...driverPivot.children]) {
      if (child.userData.placeholder) driverPivot.remove(child);
    }
    driverPivot.add(pivot);
  });

  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  return { group, wheels, driverPivot, tint };
}













export function poseKart(built, kart, dt) {
  const g = built.group;
  g.position.set(kart.x, kart.y, kart.z);
  
  
  
  
  
  
  
  
  
  
  
  
  g.rotation.y = kart.heading;

  const slip = kart.slip ?? 0;
  const speed = Math.abs(kart.speed ?? 0);

  
  const wantRoll = Math.max(-0.34, Math.min(0.34, -slip * 0.5));
  g.rotation.z += (wantRoll - g.rotation.z) * Math.min(1, dt * 9);

  
  
  const accelCue = Math.max(-1, Math.min(1, (kart.boost ? 1 : 0) - (kart.spinTime > 0 ? 1 : 0)));
  const wantPitch = -accelCue * 0.05;
  g.rotation.x += (wantPitch - g.rotation.x) * Math.min(1, dt * 7);

  
  
  const spin = (speed / 0.42) * dt;
  for (const key of ['fl', 'fr', 'rl', 'rr']) {
    const w = built.wheels[key];
    if (w) w.rotation.x -= spin;
  }
  
  
  const steerAngle = Math.max(-0.52, Math.min(0.52, -(kart.steerVisual ?? 0) * 0.52));
  if (built.wheels.steerL) built.wheels.steerL.rotation.y = steerAngle;
  if (built.wheels.steerR) built.wheels.steerR.rotation.y = steerAngle;

  
  
  const d = built.driverPivot;
  const wantLean = Math.max(-0.30, Math.min(0.30, slip * 0.42));
  d.rotation.z += (wantLean - d.rotation.z) * Math.min(1, dt * 8);
  
  
  if (kart.spinTime > 0) {
    d.rotation.x = Math.sin(kart.spinTime * 34) * 0.3;
  } else {
    d.rotation.x += (0 - d.rotation.x) * Math.min(1, dt * 6);
  }
  
  
  
  
  const wantY = kart.squashTime > 0 ? 0.5 : 1;
  g.scale.y += (wantY - g.scale.y) * Math.min(1, dt * 8);
  const spread = 1 + (1 - g.scale.y) * 0.45;
  g.scale.x = spread;
  g.scale.z = spread;
}
