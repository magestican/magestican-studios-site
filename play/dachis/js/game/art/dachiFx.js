















import * as THREE from 'three';
import { createParticles } from './scenery/kit.js';

const N = 320; 
const SYS = new WeakMap();
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; }; 
const EMBER_HOT = lin('#ff7a10'), EMBER_COOL = lin('#a00c06');
const WHITE = [1, 1, 1];

function system(scene) {
  let s = SYS.get(scene);
  if (s) return s;
  const p = createParticles(scene, N, { mode: 'soft', name: 'dachi-fx' }); 
  s = {
    p, next: 0, frame: -1, t: 0,
    age: new Float32Array(N).fill(1), life: new Float32Array(N).fill(1),
    vel: new Float32Array(N * 3), size0: new Float32Array(N), kind: new Uint8Array(N),
    c0: new Float32Array(N * 3), c1: new Float32Array(N * 3), a0: new Float32Array(N), swirl: new Float32Array(N * 2),
  };
  for (let i = 0; i < N; i++) p.alpha[i] = 0;
  SYS.set(scene, s);
  return s;
}

function step(s, dt) {
  const { p } = s;
  s.t += dt;
  for (let i = 0; i < N; i++) {
    if (s.age[i] >= s.life[i]) { p.alpha[i] = 0; continue; }
    s.age[i] += dt;
    const k = Math.min(1, s.age[i] / s.life[i]), j = i * 3;
    if (s.kind[i] === 1) { 
      const cx = s.swirl[i * 2], cz = s.swirl[i * 2 + 1], dx = p.pos[j] - cx, dz = p.pos[j + 2] - cz, w = 1.1 * dt;
      p.pos[j] = cx + dx * Math.cos(w) - dz * Math.sin(w); p.pos[j + 2] = cz + dx * Math.sin(w) + dz * Math.cos(w);
      p.pos[j + 1] += s.vel[j + 1] * dt;
      p.alpha[i] = s.a0[i] * Math.sin(Math.PI * k); 
      p.size[i] = s.size0[i] * (1 - 0.4 * k);
    } else { 
      for (let a = 0; a < 3; a++) p.pos[j + a] += s.vel[j + a] * dt;
      s.vel[j + 1] *= 1 - 0.8 * dt;
      p.alpha[i] = s.a0[i] * (1 - k * k);
      p.size[i] = s.size0[i] * (1 - 0.7 * k);
    }
    for (let a = 0; a < 3; a++) p.color[j + a] = s.c0[j + a] + (s.c1[j + a] - s.c0[j + a]) * k;
  }
  p.commit();
}

function spawn(s, kind, x, y, z, vx, vy, vz, life, size, alpha, c0, c1, cx = 0, cz = 0) {
  const i = s.next; s.next = (s.next + 1) % N;
  const j = i * 3;
  s.kind[i] = kind; s.age[i] = 0; s.life[i] = life; s.size0[i] = size; s.a0[i] = alpha;
  s.p.pos[j] = x; s.p.pos[j + 1] = y; s.p.pos[j + 2] = z;
  s.vel[j] = vx; s.vel[j + 1] = vy; s.vel[j + 2] = vz;
  for (let a = 0; a < 3; a++) { s.c0[j + a] = c0[a]; s.c1[j + a] = c1[a]; }
  s.swirl[i * 2] = cx; s.swirl[i * 2 + 1] = cz;
  s.p.size[i] = size; s.p.alpha[i] = 0;
}



const FLAME = new WeakMap();
export function flameAnchor(parts) {
  if (FLAME.has(parts)) return FLAME.get(parts);
  let n = 0, sx = 0, sy = 0, sz = 0, top = -1e9;
  for (const { geo, id } of parts) {
    if (id !== 'lamp-glow') continue;
    const a = geo.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const z = a.getZ(i);
      if (z > -0.2) continue;
      const y = a.getY(i);
      n++; sx += a.getX(i); sy += y; sz += z; if (y > top) top = y;
    }
  }
  const out = n ? new THREE.Vector3(sx / n, (sy / n + top) / 2, sz / n) : null;
  FLAME.set(parts, out);
  return out;
}

const tmp = new THREE.Vector3();

export function dachiFx(actor, o) {
  if (!actor.parts || !actor.root.visible || !actor.root.parent) return;
  const s = system(actor.scene);
  const frame = document.timeline ? document.timeline.currentTime : performance.now();
  if (frame !== s.frame) { const dt = s.frame < 0 ? 0 : Math.min(0.05, (frame - s.frame) / 1000); s.frame = frame; step(s, dt); s.dt = dt; }
  const dt = s.dt || 0;
  if (!dt) return;
  actor.root.updateMatrixWorld(true);
  const sc = actor.scale; 
  if (o.flame) {
    const a = flameAnchor(actor.parts);
    if (a) {
      actor.fxFlame = (actor.fxFlame || 0) + dt * 30; 
      while (actor.fxFlame >= 1) {
        actor.fxFlame -= 1;
        tmp.copy(a); tmp.x += (Math.random() - 0.5) * 1.2; tmp.z += (Math.random() - 0.5) * 1.2; tmp.y += Math.random() * 0.6;
        actor.body.localToWorld(tmp);
        spawn(s, 0, tmp.x, tmp.y, tmp.z, (Math.random() - 0.5) * 0.7, 0.5 + Math.random() * 0.7, (Math.random() - 0.5) * 0.7,
          0.4 + Math.random() * 0.4, sc * (0.22 + Math.random() * 0.16), 1, EMBER_HOT, EMBER_COOL);
      }
    }
  }
  if (o.aura) {
    const col = actor.fxAuraCol && actor.fxAuraHex === o.aura ? actor.fxAuraCol : (actor.fxAuraHex = o.aura, actor.fxAuraCol = lin(o.aura));
    const pos = actor.root.position, r = sc * 1.7, h = sc * 2.6;
    actor.fxAura = (actor.fxAura || 0) + dt * 22;
    while (actor.fxAura >= 1) {
      actor.fxAura -= 1;
      const ang = Math.random() * Math.PI * 2, rr = r * (0.8 + Math.random() * 0.4);
      const white = Math.random() < 0.3;
      spawn(s, 1, pos.x + Math.cos(ang) * rr, pos.y + Math.random() * h * 0.7, pos.z + Math.sin(ang) * rr, 0, sc * (0.9 + Math.random() * 0.6), 0,
        1.1 + Math.random() * 0.7, sc * (white ? 0.2 : 0.28), 0.95, white ? WHITE : col, col, pos.x, pos.z);
    }
  }
}
