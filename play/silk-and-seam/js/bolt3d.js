





import * as THREE from './vendor/three.module.min.js';
import { init, renderer, mount, onRestore } from './gfx.js';
import { lightScene } from './env3d.js';
import { fabricSpec } from './fabrics.js';
import { fabricMaterial, flatMaterial, mapSize } from './fabric3d.js';
import { mapsFor } from './dress3d.js';

const R0 = 4.6, LEN = 24, DROP = 13, SCALE = 5;       


export function boltGeometry() {
  const pos = [], uv = [], col = [], idx = [];
  const grid = (nu, nv, at) => {
    const base = pos.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const p = at(i / nu, j / nv);
      pos.push(p.x, p.y, p.z); uv.push(p.u, p.v); col.push(p.ao, p.ao, p.ao);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  };
  
  
  const turn = Math.PI * 2 * 0.97;
  grid(36, 56, (s, t) => {
    const ph = (1 - t) * turn, x = (s - 0.5) * LEN;
    return { x, y: R0 * Math.sin(ph), z: R0 * Math.cos(ph), u: s * LEN, v: -ph * R0, ao: 0.8 + 0.2 * Math.max(0, Math.sin(ph) * 0.5 + 0.5) };
  });
  
  grid(36, 40, (s, t) => {
    const x = (s - 0.5) * LEN, d = t * DROP, f = Math.pow(t, 1.3);
    const z = R0 + f * (1.1 * Math.sin((x / LEN) * Math.PI * 3.4 + 0.7) + 0.5 * Math.sin((x / LEN) * Math.PI * 7.1));
    return { x: x * (1 - 0.05 * f), y: -d, z, u: s * LEN, v: d, ao: 0.78 + 0.22 * Math.min(1, t * 4) };
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}


function ends(spec) {
  const g = new THREE.Group(), cloth = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(...spec.tint, THREE.SRGBColorSpace), roughness: 0.9 });
  const card = new THREE.MeshStandardMaterial({ color: '#a77f52', roughness: 0.8 });
  for (const s of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, R0 - 0.05, 40), cloth);
    const core = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), card);
    for (const m of [ring, core]) { m.rotation.y = s * Math.PI / 2; m.position.x = s * LEN / 2; g.add(m); }
  }
  return g;
}

export async function showBolt(canvas, fab, dye, quality = 'auto') {
  const t0 = performance.now();
  const tier = await init(quality);
  if (tier !== 'mid' && tier !== 'high') return null;
  const R = renderer(), spec = fabricSpec(fab, dye), size = Math.min(512, mapSize(tier));
  const maps = await mapsFor(spec.id, spec.hex, size);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(24, 1, 10, 2000);
  lightScene(R, scene, 'day');
  const offRestore = onRestore(() => lightScene(R, scene, 'day'));
  const geo = boltGeometry(), mat = maps ? fabricMaterial(spec, maps, tier, R) : flatMaterial(spec, tier);
  const bolt = new THREE.Group();
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = mesh.receiveShadow = true;
  bolt.add(mesh, ends(spec));
  bolt.scale.setScalar(SCALE); bolt.position.y = 150;
  scene.add(bolt);
  let yaw = 1.15, pitch = 0.36, alive = true;
  const dist = 400, target = 128;
  const gv = mount(canvas, scene, cam, { mood: 'day' });
  gv.before = () => {
    cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, target + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist);
    cam.lookAt(0, target, 0);
  };
  gv.tick = (dt) => { yaw += dt * 0.6; };
  
  const swing0 = performance.now();
  const swing = () => { if (!alive) return; const k = Math.min(1, (performance.now() - swing0) / 1100); yaw = 1.15 - 0.6 * (1 - (1 - k) ** 3); gv.invalidate(); if (k < 1) requestAnimationFrame(swing); };
  requestAnimationFrame(swing);
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', () => { down = null; });
  canvas.addEventListener('pointermove', (e) => {
    if (!down) return;
    yaw += (e.clientX - down[0]) * 0.012; pitch = Math.max(-0.2, Math.min(0.9, pitch + (e.clientY - down[1]) * 0.008));
    down = [e.clientX, e.clientY]; gv.invalidate();
  });
  const info = { tier, size, hash: maps?.hash || null, tris: geo.index.count / 3, shownMs: Math.round(performance.now() - t0) };
  return {
    info, render: () => gv.invalidate(),
    turn(y) { yaw = y; gv.invalidate(); },
    dispose() { alive = false; gv.unmount(); offRestore(); geo.dispose(); },
  };
}
