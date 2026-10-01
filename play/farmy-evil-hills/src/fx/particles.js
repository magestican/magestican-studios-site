





import * as THREE from 'three';
import { hash2 } from '../constants.js';













export let shadowTex = null;

export let shadowGeo = null;

export function shadowAssets() {
  if (!shadowTex) {
    const cv = document.createElement('canvas');
    cv.width = 32; cv.height = 32;
    const g2 = cv.getContext('2d');
    
    
    
    const grad = g2.createRadialGradient(16, 16, 1, 16, 16, 16);
    grad.addColorStop(0.00, 'rgba(0,0,0,1)');
    grad.addColorStop(0.45, 'rgba(0,0,0,0.72)');
    grad.addColorStop(1.00, 'rgba(0,0,0,0)');
    g2.fillStyle = grad;
    g2.fillRect(0, 0, 32, 32);
    shadowTex = new THREE.CanvasTexture(cv);
    shadowGeo = new THREE.PlaneGeometry(2, 2);
    
    shadowGeo.rotateX(-Math.PI / 2);
  }
  return { tex: shadowTex, geo: shadowGeo };
}


export function makeBlob(r, opacity = 0.4) {
  const { tex, geo } = shadowAssets();
  const m = new THREE.MeshBasicMaterial({
    
    
    
    color: 0x0d1410, map: tex, transparent: true, opacity, depthWrite: false,
  });
  const q = new THREE.Mesh(geo, m);
  q.scale.set(r, 1, r);
  
  
  q.position.y = 0.02;
  q.renderOrder = 2;
  q.frustumCulled = false;
  return q;
}















export const DECALS = 40;

export let decalTex = null;


export function decalTexture() {
  if (decalTex) return decalTex;
  const n = 64;
  const cv = document.createElement('canvas');
  cv.width = n; cv.height = n;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, n, n);
  
  
  
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 + hash2(i, 1.3) * 1.2;
    const r = n * (0.16 + hash2(i, 2.7) * 0.14);
    const d = n * hash2(i, 3.9) * 0.16;
    const x = n / 2 + Math.cos(a) * d;
    const y = n / 2 + Math.sin(a) * d;
    const grad = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    grad.addColorStop(0, 'rgba(90,14,10,0.95)');
    grad.addColorStop(0.7, 'rgba(70,10,8,0.55)');
    grad.addColorStop(1, 'rgba(60,8,6,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  decalTex = new THREE.CanvasTexture(cv);
  return decalTex;
}

export function makeDecals() {
  const tex = decalTexture();
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.rotateX(-Math.PI / 2);
  const pool = [];
  const group = new THREE.Group();
  for (let i = 0; i < DECALS; i += 1) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0, depthWrite: false,
    }));
    m.position.y = -50;
    m.renderOrder = 3;
    m.frustumCulled = false;
    group.add(m);
    pool.push(m);
  }
  let next = 0;
  return {
    group,
    
    put(x, z, size, dark) {
      const m = pool[next];
      next = (next + 1) % DECALS;
      m.position.set(x, 0.015 + (next % 4) * 0.002, z);
      
      
      
      m.rotation.y = Math.random() * Math.PI * 2;
      const w = size * (0.8 + Math.random() * 0.5);
      m.scale.set(w, 1, w * (0.75 + Math.random() * 0.5));
      m.material.opacity = 0.55 + dark * 0.4;
    },
  };
}
























export const IMPACT_PARTS = 96;

export const TRACERS = 6;





export const BOLT_LIFE = 0.09;

export const RICOCHET_PARTS = 72;






















export function makeTracers() {
  const pos = new Float32Array(TRACERS * 6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0xffe9c0, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  const shots = [];
  
  let holdFrames = 0;
  for (let i = 0; i < TRACERS; i += 1) shots.push({ life: 0 });
  let next = 0;
  for (let i = 0; i < TRACERS * 6; i += 3) pos[i + 1] = -50;

  return {
    lines,
    freeze(frames) { holdFrames = frames; },
    fire(from, to) {
      const i = next; next = (next + 1) % TRACERS;
      shots[i] = { life: BOLT_LIFE, from: [...from], to: [...to] };
    },
    step(dt) {
      let lit = 0;
      for (let i = 0; i < TRACERS; i += 1) {
        const sh = shots[i];
        if (!sh || sh.life <= 0) { pos[i * 6 + 1] = -50; pos[i * 6 + 4] = -50; continue; }
        
        if (holdFrames <= 0) sh.life -= dt;
        lit += 1;
        
        
        const u = Math.max(0, Math.min(1, 1 - sh.life / BOLT_LIFE));
        const head = u;
        const tail = Math.max(0, u - 0.34);
        for (let k = 0; k < 3; k += 1) {
          pos[i * 6 + k] = sh.from[k] + (sh.to[k] - sh.from[k]) * tail;
          pos[i * 6 + 3 + k] = sh.from[k] + (sh.to[k] - sh.from[k]) * head;
        }
      }
      if (holdFrames > 0) holdFrames -= 1;
      geo.attributes.position.needsUpdate = true;
      mat.opacity = lit ? 0.85 : 0;
      return lit;
    },
  };
}

















export const SHELLS = 8;
export const SHELL_LIFE = 1.6;
export function makeCasings() {
  const pos = new Float32Array(SHELLS * 3);
  const vel = new Float32Array(SHELLS * 3);
  const life = new Float32Array(SHELLS);
  const down = new Uint8Array(SHELLS);      
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xd2a94c, size: 0.03, sizeAttenuation: true, depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.visible = false;
  for (let i = 0; i < SHELLS; i += 1) pos[i * 3 + 1] = -50;
  let next = 0;
  let thrown = 0;
  return {
    points,
    get thrown() { return thrown; },
    
    eject(at, yaw) {
      const i = next; next = (next + 1) % SHELLS;
      pos[i * 3] = at[0]; pos[i * 3 + 1] = at[1]; pos[i * 3 + 2] = at[2];
      
      const rx = Math.cos(yaw); const rz = Math.sin(yaw);
      const bx = Math.sin(yaw); const bz = -Math.cos(yaw);
      const out = 1.3 + Math.random() * 0.7;
      vel[i * 3] = rx * out + bx * 0.45;
      vel[i * 3 + 1] = 1.5 + Math.random() * 0.6;
      vel[i * 3 + 2] = rz * out + bz * 0.45;
      life[i] = SHELL_LIFE;
      down[i] = 0;
      thrown += 1;
    },
    step(dt) {
      let live = 0;
      let landedAt = null;
      for (let i = 0; i < SHELLS; i += 1) {
        if (life[i] <= 0) { pos[i * 3 + 1] = -50; continue; }
        life[i] -= dt;
        live += 1;
        vel[i * 3 + 1] -= 9.8 * dt;
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (pos[i * 3 + 1] < 0.012) {
          pos[i * 3 + 1] = 0.012;
          if (!down[i] && vel[i * 3 + 1] < -0.4) {
            
            
            vel[i * 3 + 1] = -vel[i * 3 + 1] * 0.3;
            vel[i * 3] *= 0.5; vel[i * 3 + 2] *= 0.5;
            down[i] = 1;
            landedAt = [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
          } else {
            vel[i * 3] = 0; vel[i * 3 + 1] = 0; vel[i * 3 + 2] = 0;
          }
        }
      }
      geo.attributes.position.needsUpdate = true;
      points.visible = live > 0;
      return { live, landedAt };
    },
  };
}


















export function makeRicochets() {
  const pos = new Float32Array(RICOCHET_PARTS * 3);
  const vel = new Float32Array(RICOCHET_PARTS * 3);
  const life = new Float32Array(RICOCHET_PARTS);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffd9a0, size: 0.055, sizeAttenuation: true,
    transparent: true, opacity: 0.95, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  pts.frustumCulled = false;
  let next = 0;
  for (let i = 0; i < RICOCHET_PARTS; i += 1) pos[i * 3 + 1] = -50;

  return {
    points: pts,
    
    burst(x, y, z, dir, n) {
      
      const dot = dir.x * n.x + dir.z * n.z;
      const rx = dir.x - 2 * dot * n.x;
      const rz = dir.z - 2 * dot * n.z;
      for (let k = 0; k < 12; k += 1) {
        const i = next; next = (next + 1) % RICOCHET_PARTS;
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        const spread = 1.5;
        vel[i * 3] = rx * (3.2 + Math.random() * 3.4) + (Math.random() - 0.5) * spread;
        vel[i * 3 + 1] = 0.6 + Math.random() * 2.6;
        vel[i * 3 + 2] = rz * (3.2 + Math.random() * 3.4) + (Math.random() - 0.5) * spread;
        life[i] = 0.22 + Math.random() * 0.34;
      }
      geo.attributes.position.needsUpdate = true;
    },
    step(dt) {
      let any = false;
      for (let i = 0; i < RICOCHET_PARTS; i += 1) {
        if (life[i] <= 0) continue;
        any = true;
        life[i] -= dt;
        vel[i * 3 + 1] -= 15 * dt;
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        
        if (pos[i * 3 + 1] < 0.02) { pos[i * 3 + 1] = 0.02; vel[i * 3 + 1] *= -0.25; }
        if (life[i] <= 0) pos[i * 3 + 1] = -50;
      }
      if (any) geo.attributes.position.needsUpdate = true;
      return any;
    },
  };
}

export function makeImpacts() {
  const pos = new Float32Array(IMPACT_PARTS * 3);
  const vel = new Float32Array(IMPACT_PARTS * 3);
  const life = new Float32Array(IMPACT_PARTS);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    
    
    color: 0x8e2b24, size: 0.09, sizeAttenuation: true,
    transparent: true, opacity: 0.9, depthWrite: false,
  }));
  pts.frustumCulled = false;
  let next = 0;
  
  
  for (let i = 0; i < IMPACT_PARTS; i += 1) pos[i * 3 + 1] = -50;

  return {
    points: pts,
    
    burst(x, y, z, dir) {
      for (let k = 0; k < 14; k += 1) {
        const i = next; next = (next + 1) % IMPACT_PARTS;
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        
        
        const back = k < 3 ? -0.45 : 1;
        vel[i * 3] = dir.x * 2.6 * back + (Math.random() - 0.5) * 2.2;
        vel[i * 3 + 1] = 1.1 + Math.random() * 2.0;
        vel[i * 3 + 2] = dir.z * 2.6 * back + (Math.random() - 0.5) * 2.2;
        life[i] = 0.55 + Math.random() * 0.35;
      }
      geo.attributes.position.needsUpdate = true;
    },
    step(dt) {
      let any = false;
      for (let i = 0; i < IMPACT_PARTS; i += 1) {
        if (life[i] <= 0) continue;
        any = true;
        life[i] -= dt;
        vel[i * 3 + 1] -= 11 * dt;                  
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (pos[i * 3 + 1] < 0.02) {
          
          
          pos[i * 3 + 1] = 0.02;
          vel[i * 3] = 0; vel[i * 3 + 1] = 0; vel[i * 3 + 2] = 0;
        }
        if (life[i] <= 0) pos[i * 3 + 1] = -50;
      }
      if (any) geo.attributes.position.needsUpdate = true;
    },
  };
}
