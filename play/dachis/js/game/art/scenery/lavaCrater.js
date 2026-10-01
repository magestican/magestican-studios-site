




import * as THREE from 'three';
import { makeCozy } from '../../../vendor/fml/render/material.js';
import { pixelTexture } from '../../../engine/iso/cozyStage.js';
import { lin, jit, page, tn, createParticles } from './kit.js';
import { stoneForm } from './rocks.js';

const LAVA_STOPS = ['#0c0302', '#1e0703', '#3a0c04', '#c02808', '#e84a10', '#ff8a20'];

function lavaPage() {
  return page(91, (x, y) => {
    const a = tn(x, y, 4, 91), b = tn(x, y, 8, 92);
    const crack = Math.abs(a - 0.5) < 0.07 || Math.abs(b - 0.5) < 0.035;
    return crack ? 0.78 + (1 - Math.abs(a - 0.5) / 0.07) * 0.2 : 0.05 + b * 0.35;
  }, LAVA_STOPS);
}

export function placeCraterRim(batch, W, crater, radius) {
  const n = 18;
  for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI * 2 + jit(k, 1) * 0.2, r = radius + 0.05 + jit(k, 2) * 0.12;
    const x = crater.x + Math.cos(a) * r, y = crater.y + Math.sin(a) * r;
    batch.add(stoneForm(k, 'basalt'), { x, h: W.groundAt(x, y) - 0.08, y, rot: k * 1.9, s: 0.7 + jit(k, 3) * 0.45 });
  }
}

export function createLava(scene, crater, radius, h) {
  const map = pixelTexture(lavaPage());
  const mat = new THREE.MeshStandardMaterial({ color: '#000000', roughness: 0.9, metalness: 0, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 1.1 });
  makeCozy(mat, { rim: 0, key: 'dachi-lava' });
  const geo = new THREE.CircleGeometry(radius, 32).rotateX(-Math.PI / 2);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - 0.5) * radius * 2, (uv.getY(i) - 0.5) * radius * 2);
  const lava = new THREE.Mesh(geo, mat);
  lava.position.set(crater.x, h, crater.y);
  scene.add(lava);

  const BUB = 10, EMB = 16, SMOKE = 12;
  const glow = createParticles(scene, 3, { soft: true, name: 'lava-glow' });
  const bubbles = createParticles(scene, BUB, { name: 'lava-bubbles' });
  const embers = createParticles(scene, EMB, { name: 'lava-embers' });
  const smoke = createParticles(scene, SMOKE, { mode: 'soft', soft: true, name: 'lava-smoke' });
  const HOT = lin('#ffb040'), GOLD = lin('#fff0a0'), RED = lin('#ff5a1a'), SMK = lin('#8a8088');
  return {
    mesh: lava,
    update(t) {
      map.offset.set(Math.sin(t * 0.13) * 0.3, t * 0.025);
      mat.emissiveIntensity = 1.1 + Math.sin(t * 1.7) * 0.12 + Math.sin(t * 4.1) * 0.05;
      const pulse = 0.9 + Math.sin(t * 2.2) * 0.1;
      glow.set(0, crater.x, h + 0.3, crater.y, radius * 3.2 * pulse, 0.4, RED);
      glow.set(1, crater.x, h + 0.2, crater.y, radius * 1.8, 0.3 * pulse, HOT);
      glow.set(2, crater.x - 0.3, h + 0.15, crater.y + 0.2, radius * 1.0, 0.15, GOLD);
      for (let k = 0; k < BUB; k++) {
        const life = 1.6 + jit(k, 1), ph = ((t + jit(k, 2) * 9) % life) / life, cyc = Math.floor((t + jit(k, 2) * 9) / life);
        const a = jit(k, cyc) * 6.28, r = Math.sqrt(jit(k + 3, cyc)) * radius * 0.8;
        const pop = ph > 0.85;
        bubbles.set(k, crater.x + Math.cos(a) * r, h + 0.02 + ph * 0.06, crater.y + Math.sin(a) * r,
          pop ? 0.16 * (ph - 0.85) / 0.15 + 0.08 : 0.04 + ph * 0.07, pop ? 1 - (ph - 0.85) / 0.15 : 0.9, pop ? GOLD : HOT);
      }
      for (let k = 0; k < EMB; k++) {
        const ph = (t * 0.35 + k / EMB) % 1, a = k * 2.39 + Math.floor(t * 0.35 + k / EMB) * 1.3, r = jit(k, 5) * radius * 0.7;
        embers.set(k, crater.x + Math.cos(a) * r + Math.sin(t * 2 + k) * 0.1 * ph, h + ph * 2.4, crater.y + Math.sin(a) * r,
          0.04, 1 - ph, ph < 0.4 ? GOLD : HOT);
      }
      for (let k = 0; k < SMOKE; k++) {
        const q = (t * 0.06 + k / SMOKE) % 1;
        smoke.set(k, crater.x + Math.sin(q * 5 + k) * 0.5 + q * 2.2, h + 0.6 + q * 6, crater.y - q * 1.3, 0.8 + q * 2.6, 0.5 * (1 - q) * Math.min(1, q * 6), SMK);
      }
      bubbles.commit(); embers.commit(); smoke.commit(); glow.commit();
    },
  };
}
