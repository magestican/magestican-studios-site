
















import * as THREE from 'three';
import { PALETTE, DRIFT_TIER_COLOURS } from '../palette.js';

const POOL = 420;

export function createFx(scene) {
  
  
  
  const sprite = softSprite();
  const geo = new THREE.PlaneGeometry(1, 1);

  const additive = new THREE.MeshBasicMaterial({
    map: sprite, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const normal = new THREE.MeshBasicMaterial({
    map: sprite, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });

  const glow = new THREE.InstancedMesh(geo, additive, POOL);
  const smoke = new THREE.InstancedMesh(geo, normal, POOL);
  glow.frustumCulled = false;
  smoke.frustumCulled = false;
  glow.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 3), 3);
  smoke.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(POOL * 3), 3);
  scene.add(glow, smoke);

  const parts = [];
  for (let i = 0; i < POOL; i += 1) {
    parts.push({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, size: 1, colour: 0xffffff, additive: true, drag: 2 });
  }

  return {
    scene, glow, smoke, parts, cursor: 0,
    _m: new THREE.Matrix4(),
    _v: new THREE.Vector3(),
    _q: new THREE.Quaternion(),
    _c: new THREE.Color(),
  };
}

function softSprite() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.42, 'rgba(255,255,255,0.62)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}







export function emit(fx, opts) {
  let p = null;
  for (let n = 0; n < POOL; n += 1) {
    const i = (fx.cursor + n) % POOL;
    if (!fx.parts[i].alive) { p = fx.parts[i]; fx.cursor = (i + 1) % POOL; break; }
  }
  if (!p) { p = fx.parts[fx.cursor]; fx.cursor = (fx.cursor + 1) % POOL; }
  p.alive = true;
  p.x = opts.x; p.y = opts.y; p.z = opts.z;
  p.vx = opts.vx ?? 0; p.vy = opts.vy ?? 0; p.vz = opts.vz ?? 0;
  p.maxLife = opts.life ?? 0.5;
  p.life = p.maxLife;
  p.size = opts.size ?? 0.4;
  p.grow = opts.grow ?? 0;
  p.colour = opts.colour ?? 0xffffff;
  p.additive = opts.additive !== false;
  p.drag = opts.drag ?? 2;
  p.gravity = opts.gravity ?? 0;
  return p;
}


export function updateFx(fx, dt, camera) {
  const glowM = fx.glow;
  const smokeM = fx.smoke;
  let gi = 0; let si = 0;
  
  
  const q = camera.quaternion;

  for (const p of fx.parts) {
    if (!p.alive) continue;
    p.life -= dt;
    if (p.life <= 0) { p.alive = false; continue; }
    const decay = Math.exp(-p.drag * dt);
    p.vx *= decay; p.vz *= decay;
    p.vy = p.vy * decay - p.gravity * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;

    const t = p.life / p.maxLife;
    const size = p.size + p.grow * (1 - t);
    fx._v.set(p.x, p.y, p.z);
    fx._m.compose(fx._v, q, new THREE.Vector3(size, size, size));
    
    
    
    
    
    fx._c.setHex(p.colour).multiplyScalar(p.additive ? t : 1);
    if (p.additive) {
      if (gi < POOL) { glowM.setMatrixAt(gi, fx._m); glowM.setColorAt(gi, fx._c); gi += 1; }
    } else if (si < POOL) {
      fx._c.setHex(p.colour).lerp(new THREE.Color(0x000000), 0);
      smokeM.setMatrixAt(si, fx._m); smokeM.setColorAt(si, fx._c); si += 1;
    }
  }

  
  
  
  
  const hidden = new THREE.Matrix4().makeTranslation(0, -9999, 0);
  for (let i = gi; i < POOL; i += 1) glowM.setMatrixAt(i, hidden);
  for (let i = si; i < POOL; i += 1) smokeM.setMatrixAt(i, hidden);
  glowM.instanceMatrix.needsUpdate = true;
  smokeM.instanceMatrix.needsUpdate = true;
  if (glowM.instanceColor) glowM.instanceColor.needsUpdate = true;
  if (smokeM.instanceColor) smokeM.instanceColor.needsUpdate = true;
  smokeM.material.opacity = 0.55;
}






export function driftSparks(fx, kart, tier, dt) {
  if (!kart.drifting) return;
  const rate = tier === 0 ? 26 : 40 + tier * 26;
  const n = Math.max(1, Math.round(rate * dt));
  const colour = DRIFT_TIER_COLOURS[Math.min(3, tier)];
  const back = 1.0;
  for (let i = 0; i < n; i += 1) {
    
    
    
    const side = -kart.drifting * 0.9;
    const fx0 = Math.sin(kart.heading);
    const fz0 = Math.cos(kart.heading);
    const rx = -fz0; const rz = fx0;
    emit(fx, {
      x: kart.x - fx0 * back + rx * side,
      y: kart.y + 0.22,
      z: kart.z - fz0 * back + rz * side,
      vx: (Math.random() - 0.5) * 4 - fx0 * 3,
      vy: 1.6 + Math.random() * 2.6,
      vz: (Math.random() - 0.5) * 4 - fz0 * 3,
      life: 0.24 + Math.random() * 0.2,
      size: 0.16 + tier * 0.05,
      grow: 0.1,
      colour,
      gravity: 6,
      drag: 1.4,
    });
  }
}


export function boostFlame(fx, kart, dt) {
  if (!kart.boost) return;
  const n = Math.max(1, Math.floor(52 * dt));
  const fx0 = Math.sin(kart.heading);
  const fz0 = Math.cos(kart.heading);
  for (let i = 0; i < n; i += 1) {
    const side = (Math.random() - 0.5) * 0.6;
    emit(fx, {
      x: kart.x - fx0 * 1.35 + (-fz0) * side,
      y: kart.y + 0.85,
      z: kart.z - fz0 * 1.35 + fx0 * side,
      vx: -fx0 * (7 + Math.random() * 5),
      vy: 1.1 + Math.random(),
      vz: -fz0 * (7 + Math.random() * 5),
      life: 0.30 + Math.random() * 0.16,
      size: 0.36,
      grow: 0.5,
      colour: Math.random() > 0.45 ? PALETTE.boostFlame : PALETTE.spark2,
      drag: 3.2,
    });
  }
}


export function groundDust(fx, kart, onRoad, dt) {
  const speed = Math.abs(kart.speed ?? 0);
  if (speed < 6) return;
  const heavy = !onRoad;
  const rate = heavy ? 34 : 9;
  if (Math.random() > rate * dt) return;
  const fx0 = Math.sin(kart.heading);
  const fz0 = Math.cos(kart.heading);
  emit(fx, {
    x: kart.x - fx0 * 1.1 + (Math.random() - 0.5) * 1.4,
    y: kart.y + 0.14,
    z: kart.z - fz0 * 1.1 + (Math.random() - 0.5) * 1.4,
    vx: -fx0 * 1.6 + (Math.random() - 0.5) * 2,
    vy: 0.8 + Math.random() * 1.1,
    vz: -fz0 * 1.6 + (Math.random() - 0.5) * 2,
    life: heavy ? 0.75 : 0.45,
    size: heavy ? 0.6 : 0.32,
    grow: 1.3,
    colour: PALETTE.dust,
    additive: false,
    drag: 1.6,
  });
}


export function hitBurst(fx, x, y, z) {
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * Math.PI * 2;
    emit(fx, {
      x, y: y + 0.7, z,
      vx: Math.cos(a) * (3 + Math.random() * 4),
      vy: 2.5 + Math.random() * 3,
      vz: Math.sin(a) * (3 + Math.random() * 4),
      life: 0.6 + Math.random() * 0.3,
      size: 0.3,
      grow: 0.1,
      colour: PALETTE.hitStar,
      gravity: 7,
      drag: 1.1,
    });
  }
}


export function pickupBurst(fx, x, y, z, colour = PALETTE.sunflower) {
  for (let i = 0; i < 12; i += 1) {
    emit(fx, {
      x, y: y + 0.8, z,
      vx: (Math.random() - 0.5) * 6,
      vy: 1.5 + Math.random() * 3,
      vz: (Math.random() - 0.5) * 6,
      life: 0.45,
      size: 0.26,
      grow: 0.3,
      colour,
      drag: 2.4,
    });
  }
}


export function createShieldBubble() {
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 1),
    new THREE.MeshBasicMaterial({
      color: PALETTE.shieldGlow, transparent: true, opacity: 0.24,
      wireframe: true, depthWrite: false,
    }),
  );
  mesh.visible = false;
  return mesh;
}
