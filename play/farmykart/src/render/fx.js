
















import * as THREE from 'three';
import { PALETTE, DRIFT_TIER_COLOURS } from '../palette.js';
import { getQuality } from './materials.js';
import { themeOf, THEMES } from './themes.js';
import { groundMeshHeightAt } from './trackMesh.js';
import { vehicleFor } from '../../../../web-engine/kart/vehicles.js';








import { DRAFT } from '../../../../web-engine/kart/water.js';
import { wakeGeometry } from '../../../../web-engine/render/boatRig.js';
import { boatBeam } from '../../../../web-engine/render/boatSpec.js';

const POOL = 420;











































const MARK_CAP = 640;
const MARK_CAP_LOW = 288;      
const MARK_STEP = 2.4;         
const MARK_LIFE = 3.6;         

export function createFx(scene, { theme = 'summer', path = null } = {}) {
  
  
  
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const markCap = getQuality() === 'low' ? MARK_CAP_LOW : MARK_CAP;
  
  
  
  const markGeo = new THREE.PlaneGeometry(1, 1);
  markGeo.rotateX(-Math.PI / 2);
  const markMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    blending: THREE.MultiplyBlending,
    transparent: true,
    depthWrite: false,
    
    
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    
    
    
    
    toneMapped: false,
  });
  const marks = new THREE.InstancedMesh(markGeo, markMat, markCap);
  marks.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(markCap * 3).fill(1), 3);
  marks.frustumCulled = false;
  marks.renderOrder = -1;         
  marks.count = 0;
  marks.name = 'tyreMarks';
  scene.add(marks);
  const markPool = [];
  for (let i = 0; i < markCap; i += 1) {
    markPool.push({ alive: false, life: 0, m: new THREE.Matrix4(), colour: PALETTE.tyre });
  }

  
  
  
  
  
  
  const wakeCap = getQuality() === 'low' ? WAKE_CAP_LOW : WAKE_CAP;
  const wakeGeo = new THREE.PlaneGeometry(1, 1);
  wakeGeo.rotateX(-Math.PI / 2);
  const wakeMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    
    
    
    
    
    
    
    
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    
    
    
    
    depthTest: true,
    opacity: 0.30,
  });
  const wake = new THREE.InstancedMesh(wakeGeo, wakeMat, wakeCap);
  wake.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(wakeCap * 3).fill(1), 3);
  wake.frustumCulled = false;
  wake.renderOrder = 2;
  wake.count = 0;
  wake.name = 'boatWake';
  scene.add(wake);
  const wakePool = [];
  for (let i = 0; i < wakeCap; i += 1) {
    wakePool.push({ alive: false, life: 0, maxLife: 1, m: new THREE.Matrix4(), colour: 0xffffff });
  }

  return {
    scene, glow, smoke, parts, cursor: 0,
    theme, path,
    dust: themeOf(theme).dust,
    marks, markPool, markCap, markCursor: 0,
    wake, wakePool, wakeCap, wakeCursor: 0,
    
    
    lastWake: new Map(),
    
    
    lastMark: new Map(),
    vehicleCache: new Map(),
    _m: new THREE.Matrix4(),
    _v: new THREE.Vector3(),
    _q: new THREE.Quaternion(),
    _c: new THREE.Color(),
    _white: new THREE.Color(0xffffff),
    _p0: new THREE.Vector3(),
    _p1: new THREE.Vector3(),
    _r: new THREE.Vector3(),
    _u: new THREE.Vector3(),
    _f: new THREE.Vector3(),
    _up: new THREE.Vector3(0, 1, 0),
  };
}










export function setFxTrack(fx, { theme, path } = {}) {
  if (theme) {
    fx.theme = theme;
    fx.dust = themeOf(theme).dust;
  }
  if (path) fx.path = path;
  return fx;
}


















function drawnGroundY(fx, x, z, fallbackY) {
  if (!fx.path) return fallbackY;
  return Math.max(groundMeshHeightAt(fx.path, x, z), fallbackY);
}


function specFor(fx, kart) {
  const id = (kart && kart.tuning && kart.tuning.id) || (kart && kart.id) || 'sheep';
  let spec = fx.vehicleCache.get(id);
  if (!spec) { spec = vehicleFor(id); fx.vehicleCache.set(id, spec); }
  return spec;
}










function localToWorld(out, kart, lx, ly, lz) {
  const ch = Math.cos(kart.heading);
  const sh = Math.sin(kart.heading);
  out.x = kart.x + lx * ch + lz * sh;
  out.y = (kart.y ?? 0) + ly;
  out.z = kart.z - lx * sh + lz * ch;
  return out;
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

  updateTyreMarks(fx, dt);
  updateWake(fx, dt);
}












function updateTyreMarks(fx, dt) {
  const marks = fx.marks;
  if (!marks) return;
  let n = 0;
  for (const m of fx.markPool) {
    if (!m.alive) continue;
    m.life -= dt;
    if (m.life <= 0) { m.alive = false; continue; }
    
    
    
    
    
    const t = m.life / MARK_LIFE;
    fx._c.setHex(m.colour).lerp(fx._white, 1 - t * t);
    marks.setMatrixAt(n, m.m);
    marks.setColorAt(n, fx._c);
    n += 1;
  }
  marks.count = n;
  marks.visible = n > 0;
  marks.instanceMatrix.needsUpdate = true;
  if (marks.instanceColor) marks.instanceColor.needsUpdate = true;
}



















function layTyreMarks(fx, kart, strength) {
  if (!fx.marks) return;
  const spec = specFor(fx, kart);
  const halfTrack = spec.wheels.trackRear / 2;
  const axleZ = -spec.wheelbase / 2;
  const width = spec.wheels.rearWidth * 0.86;
  const id = kart.id ?? 'k';
  let last = fx.lastMark.get(id);
  if (!last) {
    last = [{ x: 0, y: 0, z: 0, set: false }, { x: 0, y: 0, z: 0, set: false }];
    fx.lastMark.set(id, last);
  }

  for (let i = 0; i < 2; i += 1) {
    const side = i === 0 ? halfTrack : -halfTrack;
    const p = localToWorld(fx._p1, kart, side, 0, axleZ);
    const prev = last[i];
    
    
    
    
    
    
    
    if (!prev.set) {
      prev.x = p.x; prev.z = p.z;
      prev.y = drawnGroundY(fx, p.x, p.z, kart.y ?? 0) + 0.03;
      prev.set = true;
      continue;
    }
    const dx = p.x - prev.x;
    const dz = p.z - prev.z;
    const flat = Math.hypot(dx, dz);
    if (flat < MARK_STEP) continue;
    const y = drawnGroundY(fx, p.x, p.z, kart.y ?? 0) + 0.03;
    
    
    
    if (flat > MARK_STEP * 6) {
      prev.x = p.x; prev.y = y; prev.z = p.z;
      continue;
    }
    const dy = y - prev.y;
    const len = Math.hypot(flat, dy);

    const slot = takeMark(fx);
    fx._f.set(dx / len, dy / len, dz / len);
    
    
    
    
    fx._r.crossVectors(fx._up, fx._f).normalize();
    fx._u.crossVectors(fx._f, fx._r).normalize();
    slot.m.makeBasis(fx._r, fx._u, fx._f);
    slot.m.scale(fx._v.set(width, 1, len));
    slot.m.setPosition((prev.x + p.x) / 2, (prev.y + y) / 2, (prev.z + p.z) / 2);
    slot.alive = true;
    
    
    
    const k = Math.min(1, Math.max(0.25, strength));
    fx._c.setHex(PALETTE.tyre).lerp(fx._white, 1 - k * 0.75);
    slot.colour = fx._c.getHex();
    slot.life = MARK_LIFE;
    prev.x = p.x; prev.y = y; prev.z = p.z;
  }
}


function takeMark(fx) {
  for (let n = 0; n < fx.markCap; n += 1) {
    const i = (fx.markCursor + n) % fx.markCap;
    if (!fx.markPool[i].alive) { fx.markCursor = (i + 1) % fx.markCap; return fx.markPool[i]; }
  }
  const slot = fx.markPool[fx.markCursor];
  fx.markCursor = (fx.markCursor + 1) % fx.markCap;
  return slot;
}



















export function driftSparks(fx, kart, tier, dt) {
  const slip = Math.abs(kart.slip ?? 0);
  const speed = Math.abs(kart.speed ?? 0);
  if (speed > 5 && (kart.drifting || slip > 0.08) && (kart.grounded ?? true)) {
    
    
    layTyreMarks(fx, kart, kart.drifting ? 0.55 + tier * 0.15 : slip / 0.26);
  }
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
  const spec = specFor(fx, kart);
  const ex = spec.exhaust;
  const pipes = ex.pipes;
  const dir = ex.dir;
  
  
  const tipY = (b) => b[1] + dir[1] * ex.length;
  const tipX = (b) => b[0] + dir[0] * ex.length;
  const tipZ = (b) => b[2] + dir[2] * ex.length;
  
  
  const ch = Math.cos(kart.heading);
  const sh = Math.sin(kart.heading);
  const outX = dir[0] * ch + dir[2] * sh;
  const outZ = -dir[0] * sh + dir[2] * ch;
  const outY = dir[1];

  const boosting = !!kart.boost;
  const banged = kart.justBoosted;

  
  if (banged) {
    const tier = Math.min(3, banged.tier ?? 1);
    const colour = DRIFT_TIER_COLOURS[tier];
    for (const b of pipes) {
      const p = localToWorld(fx._p0, kart, tipX(b), tipY(b), tipZ(b));
      const px = p.x; const py = p.y; const pz = p.z;
      for (let i = 0; i < 5 + tier * 3; i += 1) {
        emit(fx, {
          x: px, y: py, z: pz,
          vx: outX * (6 + Math.random() * 7) + (Math.random() - 0.5) * 5,
          vy: outY * (6 + Math.random() * 7) + (Math.random() - 0.5) * 2.5,
          vz: outZ * (6 + Math.random() * 7) + (Math.random() - 0.5) * 5,
          life: 0.26 + Math.random() * 0.2,
          size: 0.20 + tier * 0.06,
          grow: 0.5,
          colour,
          drag: 3.4,
        });
      }
      
      
      for (let i = 0; i < 2; i += 1) {
        emit(fx, {
          x: px, y: py, z: pz,
          vx: outX * 3 + (Math.random() - 0.5) * 3,
          vy: outY * 3 + 0.6,
          vz: outZ * 3 + (Math.random() - 0.5) * 3,
          life: 0.5, size: 0.19, grow: 0.7,
          colour: 0x6f665c, additive: false, drag: 2.6,
        });
      }
    }
  }

  
  if (boosting) {
    const tier = Math.min(3, kart.driftTier || (banged && banged.tier) || 1);
    const hot = DRIFT_TIER_COLOURS[tier];
    const n = Math.max(1, Math.floor((44 / Math.max(1, pipes.length)) * dt));
    for (const b of pipes) {
      const p = localToWorld(fx._p0, kart, tipX(b), tipY(b), tipZ(b));
      for (let i = 0; i < n; i += 1) {
        emit(fx, {
          x: p.x + (Math.random() - 0.5) * 0.18,
          y: p.y + (Math.random() - 0.5) * 0.1,
          z: p.z + (Math.random() - 0.5) * 0.18,
          vx: outX * (7 + Math.random() * 5),
          vy: outY * (7 + Math.random() * 5) + 0.8,
          vz: outZ * (7 + Math.random() * 5),
          life: 0.26 + Math.random() * 0.16,
          size: 0.19 + ex.tipRadius * 1.0,
          grow: 0.34,
          
          colour: Math.random() > 0.55 ? hot : PALETTE.spark2,
          drag: 3.2,
        });
      }
    }
    return;
  }

  
  
  
  const speed = Math.abs(kart.speed ?? 0);
  const rate = 2.2 + Math.min(1, speed / 40) * 4.5;
  if (Math.random() > rate * dt) return;
  const b = pipes[(Math.random() * pipes.length) | 0];
  const p = localToWorld(fx._p0, kart, tipX(b), tipY(b), tipZ(b));
  emit(fx, {
    x: p.x, y: p.y, z: p.z,
    vx: outX * 1.6 + (Math.random() - 0.5) * 0.7,
    vy: outY * 1.6 + 0.7,
    vz: outZ * 1.6 + (Math.random() - 0.5) * 0.7,
    life: 0.45 + Math.random() * 0.3,
    size: 0.10,
    grow: 0.26,
    colour: 0x7a7168,
    additive: false,
    drag: 2.2,
  });
}




























export function groundDust(fx, kart, onRoad, dt) {
  
  
  
  
  
  
  
  
  
  
  
  
  if (kart.boating || kart.splashed || kart.beached) {
    boatWash(fx, kart, dt);
    return;
  }
  const speed = Math.abs(kart.speed ?? 0);
  if (speed < 6) return;
  const spec = specFor(fx, kart);
  const set = (fx.dust ?? THEMES.summer.dust)[onRoad ? 'road' : 'off'];
  const slip = Math.abs(kart.slip ?? 0);
  
  const busy = (0.45 + Math.min(1, speed / 45) * 0.55) * (1 + Math.min(1, slip / 0.24) * 1.1);
  if (Math.random() > set.rate * busy * dt) return;

  const side = Math.random() < 0.5 ? 1 : -1;
  const p = localToWorld(
    fx._p0, kart,
    side * spec.wheels.trackRear / 2,
    0.10,
    -spec.wheelbase / 2 - 0.2,
  );
  const fx0 = Math.sin(kart.heading);
  const fz0 = Math.cos(kart.heading);
  const size = set.size * (0.75 + Math.random() * 0.6);
  emit(fx, {
    x: p.x + (Math.random() - 0.5) * 0.5,
    y: p.y,
    z: p.z + (Math.random() - 0.5) * 0.5,
    
    
    
    vx: -fx0 * (1.4 + speed * 0.06) + (Math.random() - 0.5) * 2.4,
    vy: 0.8 + Math.random() * 1.2,
    vz: -fz0 * (1.4 + speed * 0.06) + (Math.random() - 0.5) * 2.4,
    life: set.life * (0.8 + Math.random() * 0.5),
    size,
    grow: onRoad ? 0.9 : 1.5,
    colour: set.colour,
    additive: set.additive,
    drag: 1.6,
  });
}





























const WAKE_CAP = 240;
const WAKE_CAP_LOW = 96;



















function sprayFor(fx) {
  return themeOf(fx.theme).spray;
}



























function boatSurfaceY(kart) {
  const plane = kart.boatPlaneY;
  
  
  if (kart.boating && typeof plane === 'number' && Number.isFinite(plane)) return plane;
  return (kart.y ?? 0) + DRAFT;
}


function updateWake(fx, dt) {
  const wake = fx.wake;
  if (!wake) return;
  let n = 0;
  for (const w of fx.wakePool) {
    if (!w.alive) continue;
    w.life -= dt;
    if (w.life <= 0) { w.alive = false; continue; }
    
    
    
    
    
    const t = w.life / w.maxLife;
    fx._c.setHex(w.colour).multiplyScalar(t * t);
    wake.setMatrixAt(n, w.m);
    wake.setColorAt(n, fx._c);
    n += 1;
  }
  wake.count = n;
  wake.visible = n > 0;
  wake.instanceMatrix.needsUpdate = true;
  if (wake.instanceColor) wake.instanceColor.needsUpdate = true;
}


function takeWake(fx) {
  for (let n = 0; n < fx.wakeCap; n += 1) {
    const i = (fx.wakeCursor + n) % fx.wakeCap;
    if (!fx.wakePool[i].alive) { fx.wakeCursor = (i + 1) % fx.wakeCap; return fx.wakePool[i]; }
  }
  const slot = fx.wakePool[fx.wakeCursor];
  fx.wakeCursor = (fx.wakeCursor + 1) % fx.wakeCap;
  return slot;
}









function layWake(fx, kart, dt) {
  if (!fx.wake) return;
  const spec = specFor(fx, kart);
  const geo = wakeGeometry(Math.abs(kart.speed ?? 0));
  const half = boatBeam(spec) * 0.30;
  const sternZ = -spec.wheelbase / 2 - 0.6;
  const y = boatSurfaceY(kart) + 0.05;
  const id = kart.id ?? 'k';
  let last = fx.lastWake.get(id);
  if (!last) {
    last = [{ x: 0, y: 0, z: 0, set: false }, { x: 0, y: 0, z: 0, set: false }];
    fx.lastWake.set(id, last);
  }
  for (let i = 0; i < 2; i += 1) {
    const side = i === 0 ? half : -half;
    const p = localToWorld(fx._p1, kart, side, 0, sternZ);
    const prev = last[i];
    if (!prev.set) {
      prev.x = p.x; prev.y = y; prev.z = p.z; prev.set = true;
      continue;
    }
    const dx = p.x - prev.x;
    const dz = p.z - prev.z;
    const flat = Math.hypot(dx, dz);
    if (flat < geo.step) continue;
    
    
    
    
    if (flat > geo.step * 6) {
      prev.x = p.x; prev.y = y; prev.z = p.z;
      continue;
    }
    const dy = y - prev.y;
    const len = Math.hypot(flat, dy);
    const slot = takeWake(fx);
    fx._f.set(dx / len, dy / len, dz / len);
    fx._r.crossVectors(fx._up, fx._f).normalize();
    fx._u.crossVectors(fx._f, fx._r).normalize();
    slot.m.makeBasis(fx._r, fx._u, fx._f);
    slot.m.scale(fx._v.set(geo.width, 1, len));
    slot.m.setPosition((prev.x + p.x) / 2, (prev.y + y) / 2, (prev.z + p.z) / 2);
    slot.alive = true;
    slot.colour = sprayFor(fx).colour;
    slot.life = geo.life;
    slot.maxLife = geo.life;
    prev.x = p.x; prev.y = y; prev.z = p.z;
  }
}














function boatSpray(fx, kart, dt) {
  const speed = Math.abs(kart.speed ?? 0);
  if (speed < 3) return;
  const set = sprayFor(fx);
  const spec = specFor(fx, kart);
  const geo = wakeGeometry(speed);
  const y = boatSurfaceY(kart);
  const sternZ = -spec.wheelbase / 2 - 0.5;
  const busy = 0.35 + Math.min(1, speed / 26) * 0.65;
  if (Math.random() > set.rate * busy * dt) return;

  
  
  const side = Math.random() < 0.5 ? 1 : -1;
  const along = Math.random() * Math.random() * 9 + 0.4;
  const across = along * Math.tan(geo.halfAngle) * side;
  const p = localToWorld(fx._p0, kart, across, 0, sternZ - along);
  const fx0 = Math.sin(kart.heading);
  const fz0 = Math.cos(kart.heading);
  emit(fx, {
    x: p.x, y, z: p.z,
    
    
    
    vx: -fx0 * 0.6 + (Math.random() - 0.5) * 1.4,
    vy: 0.25 + Math.random() * 0.5,
    vz: -fz0 * 0.6 + (Math.random() - 0.5) * 1.4,
    life: set.life * (0.8 + Math.random() * 0.5),
    size: set.size * (0.7 + Math.random() * 0.6) * (1 - along / 14),
    grow: 1.1,
    colour: set.colour,
    additive: set.additive,
    drag: 2.2,
  });

  
  
  
  if (speed > 9 && Math.random() < 0.5) {
    const q = localToWorld(fx._p0, kart, (Math.random() - 0.5) * 0.5, 0.1, sternZ - 0.5);
    emit(fx, {
      x: q.x, y, z: q.z,
      vx: -fx0 * (2.0 + speed * 0.10) + (Math.random() - 0.5) * 1.6,
      vy: 2.2 + Math.random() * 2.4,
      vz: -fz0 * (2.0 + speed * 0.10) + (Math.random() - 0.5) * 1.6,
      life: set.life * 1.2,
      size: set.size * 0.8,
      grow: 1.4,
      colour: set.colour,
      additive: set.additive,
      gravity: 8,
      drag: 1.4,
    });
  }
}














export function hullSplash(fx, kart, kind = 'in') {
  const set = sprayFor(fx);
  const y = boatSurfaceY(kart);
  const hard = kind === 'in'
    ? Math.min(1, Math.abs(kart.splashVy ?? 0) / 14)
    : 0.45;
  const n = kind === 'in' ? 22 : 14;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
    const out = (kind === 'in' ? 3.0 : 2.0) + hard * 5 + Math.random() * 2;
    emit(fx, {
      x: kart.x, y: y + 0.1, z: kart.z,
      vx: Math.cos(a) * out,
      vy: (kind === 'in' ? 2.2 : 1.2) + hard * 4 + Math.random() * 2,
      vz: Math.sin(a) * out,
      life: 0.55 + hard * 0.5,
      size: set.size * (1.1 + hard * 0.7),
      grow: 1.6,
      colour: set.colour,
      additive: set.additive,
      gravity: 9,
      drag: 1.5,
    });
  }
  if (kind === 'in') {
    
    for (let i = 0; i < 8; i += 1) {
      emit(fx, {
        x: kart.x + (Math.random() - 0.5) * 0.8,
        y: y + 0.2,
        z: kart.z + (Math.random() - 0.5) * 0.8,
        vx: (Math.random() - 0.5) * 1.6,
        vy: 4.0 + hard * 7 + Math.random() * 2,
        vz: (Math.random() - 0.5) * 1.6,
        life: 0.7 + hard * 0.5,
        size: set.size * 1.3,
        grow: 1.2,
        colour: set.colour,
        additive: set.additive,
        gravity: 11,
        drag: 1.1,
      });
    }
  }
}















export function boatWash(fx, kart, dt) {
  if (kart.splashed) hullSplash(fx, kart, 'in');
  if (kart.beached) hullSplash(fx, kart, 'out');
  if (!kart.boating) return;
  layWake(fx, kart, dt);
  boatSpray(fx, kart, dt);
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
