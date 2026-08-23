













import * as THREE from 'three';
import {
  SKY, BULL_PARTS, HORSE_PARTS, BONE_PIVOTS, LEG_PHASE, LEG_SWING_RADIANS,
  DUST, STARS, poseAt,
} from './skyBrawlSpec.js';

const BONES = ['body', 'head', 'legFL', 'legFR', 'legBL', 'legBR', 'tail'];

export class SkyBrawl {
  constructor(scene) {
    this.scene = scene;
    
    
    
    this.anchor = new THREE.Group();
    this.anchor.name = 'skyBrawlAnchor';
    scene.add(this.anchor);

    
    const el = THREE.MathUtils.degToRad(SKY.elevationDeg);
    const az = THREE.MathUtils.degToRad(SKY.azimuthDeg);
    this.stage = new THREE.Group();
    this.stage.position.set(
      Math.sin(az) * SKY.radius * Math.cos(el),
      Math.sin(el) * SKY.radius,
      -Math.cos(az) * SKY.radius * Math.cos(el),
    );
    
    
    
    
    
    this.stage.rotation.order = 'YXZ';
    this.stage.rotation.y = az;
    
    
    
    
    
    
    if (SKY.faceTheEye) this.stage.rotation.x = +el;
    this.stage.scale.setScalar(SKY.modelScale);
    this.anchor.add(this.stage);

    this.bull  = buildAnimal(BULL_PARTS,  BONE_PIVOTS.bull);
    this.horse = buildAnimal(HORSE_PARTS, BONE_PIVOTS.horse);
    this.stage.add(this.bull.root, this.horse.root);

    this.dust = buildDust();
    this.stage.add(this.dust.root);

    this.starsBull  = buildStars();
    this.starsHorse = buildStars();
    this.stage.add(this.starsBull.root, this.starsHorse.root);

    this.t = 0;
  }

  
  update(dt, camPos) {
    this.t += dt;
    if (camPos) this.anchor.position.copy(camPos);

    const pose = poseAt(this.t);
    applyPose(this.bull,  pose.bull);
    applyPose(this.horse, pose.horse);

    
    const d = pose.dust;
    this.dust.root.visible = d.alpha > 0.01 && d.scale > 0.01;
    if (this.dust.root.visible) {
      this.dust.root.position.set(d.x, d.y, d.z);
      this.dust.root.scale.set(d.scale, d.scale * DUST.flatten, d.scale);
      this.dust.root.rotation.z = d.spin;
      this.dust.root.rotation.y = d.spin * 0.4;
      for (const m of this.dust.materials) m.opacity = d.alpha * DUST.maxAlpha;
    }

    
    const s = pose.stars;
    const showBull  = s.alpha > 0.01 && s.over === 'both';
    const showHorse = s.alpha > 0.01 && (s.over === 'both' || s.over === 'horse');
    this.starsBull.root.visible = showBull;
    this.starsHorse.root.visible = showHorse;
    if (showBull) {
      this.starsBull.root.position.set(pose.bull.x, pose.bull.y + STARS.heightBull, pose.bull.z);
      this.starsBull.root.rotation.y = s.spin;
      for (const m of this.starsBull.materials) m.opacity = s.alpha;
    }
    if (showHorse) {
      this.starsHorse.root.position.set(pose.horse.x, pose.horse.y + STARS.heightHorse, pose.horse.z);
      this.starsHorse.root.rotation.y = -s.spin;
      for (const m of this.starsHorse.materials) m.opacity = s.alpha;
    }
  }

  dispose() {
    this.scene.remove(this.anchor);
    this.anchor.traverse((o) => {
      o.geometry?.dispose?.();
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material?.dispose?.();
    });
  }
}



function skyMaterial(hex, opts = {}) {
  return new THREE.MeshLambertMaterial({
    color: new THREE.Color(hex),
    flatShading: true,
    fog: SKY.fogged,
    ...opts,
  });
}

function buildAnimal(parts, pivots) {
  const root = new THREE.Group();
  const bones = {};
  for (const name of BONES) {
    const g = new THREE.Group();
    const [px, py, pz] = pivots[name] ?? [0, 0, 0];
    g.position.set(px, py, pz);
    bones[name] = g;
    root.add(g);
  }
  for (const part of parts) {
    const [x, y, z, w, h, d] = part.p;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), skyMaterial(part.hex));
    mesh.position.set(x, y, z);
    bones[part.bone].add(mesh);
  }
  return { root, bones };
}

function applyPose(animal, p) {
  const r = animal.root;
  r.position.set(p.x, p.y, p.z);
  
  
  r.rotation.order = 'YXZ';
  r.rotation.set(p.pitch, p.yaw, p.roll);
  r.scale.set(1, p.squash, 1);
  animal.bones.head.rotation.x = p.headTilt;
  const front = p.frontSwing ?? p.legSwing;
  for (const [bone, sign] of Object.entries(LEG_PHASE)) {
    const swing = bone.startsWith('legF') ? front : p.legSwing;
    animal.bones[bone].rotation.x = swing * sign * LEG_SWING_RADIANS;
  }
  animal.bones.tail.rotation.x = -0.25 + p.legSwing * 0.20;
}

function buildDust() {
  const root = new THREE.Group();
  const materials = [];
  
  
  
  
  let seed = 0x5eed;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
  const jitter = (v) => (rnd() - 0.5) * v;

  const add = (x, y, z, size, hex) => {
    const m = skyMaterial(hex, { transparent: true, opacity: 1 });
    materials.push(m);
    const s = size * (0.55 + rnd() * 0.9);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.7, s * 0.85), m);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
    root.add(mesh);
    return mesh;
  };
  add(0, 0, 0, DUST.coreSize, DUST.coreHex);
  for (const ring of DUST.rings) {
    for (let i = 0; i < ring.count; i++) {
      const a = (i / ring.count) * Math.PI * 2 + jitter(0.55);
      const r = ring.radius * (0.6 + rnd() * 0.75);
      add(Math.cos(a) * r + jitter(0.3),
          Math.abs(Math.sin(a)) * r * 0.30 + rnd() * 0.35,
          Math.sin(a) * r * 0.26 + jitter(0.25), ring.size, ring.hex);
    }
  }
  root.visible = false;
  return { root, materials };
}

function buildStars() {
  const root = new THREE.Group();
  const materials = [];
  for (let i = 0; i < STARS.count; i++) {
    const a = (i / STARS.count) * Math.PI * 2;
    const m = skyMaterial(STARS.hex, { transparent: true, opacity: 1 });
    materials.push(m);
    
    
    
    for (const [rx, ry, rz] of [[0, 0, 0], [0, Math.PI / 2, 0], [0, 0, Math.PI / 2]]) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(STARS.size, STARS.size * 0.26, STARS.size * 0.26), m);
      mesh.position.set(Math.cos(a) * STARS.radius, 0, Math.sin(a) * STARS.radius);
      mesh.rotation.set(rx, ry, rz);
      root.add(mesh);
    }
  }
  root.visible = false;
  return { root, materials };
}
