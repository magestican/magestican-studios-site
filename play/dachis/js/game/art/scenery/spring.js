


import * as THREE from 'three';
import { S, form, lin, jit, createParticles } from './kit.js';
import { stoneForm } from './rocks.js';
import { createSheet, set, hash2, bayer, hex } from '../../../vendor/arbelo/paint/texturePaint.js';

const LIP = lin('#b4a99c');
const R = 0.68;

function basinNode() {
  const lip = S.displace(S.torus([0, 0.05, 0], R, 0.1), (x, y, z) => (jit(Math.floor(Math.atan2(x, z) * 5), 2) - 0.5) * 0.04, 0.03);
  const floor = S.roundCylinder([0, -0.06, 0], R, R, 0.04, 0.02);
  return S.paint(S.union(0.05, lip, floor), { color: LIP, material: 'stone' });
}
export const basinForm = () => form('spring-basin', basinNode, { min: [-0.95, -0.15, -0.95], max: [0.95, 0.25, 0.95], cell: 0.03, tris: 360 });

export function placeSprings(batch, W) {
  const basin = basinForm();
  for (const o of W.objects) {
    if (o.kind !== 'spring') continue;
    const h = W.groundAt(o.x, o.y);
    batch.add(basin, { x: o.x, h, y: o.y });
    for (let k = 0; k < 9; k++) {
      if (k === 4) continue; 
      const a = k / 9 * Math.PI * 2 + 0.3, r = R + 0.2 + jit(k, 3) * 0.08;
      batch.add(stoneForm(k), { x: o.x + Math.cos(a) * r, h: h - 0.06, y: o.y + Math.sin(a) * r, rot: k * 2.1, s: 0.55 + jit(k, 5) * 0.3 });
    }
  }
}

let ripple = null;
function ripplePage() {
  if (ripple) return ripple;
  const n = 32, sheet = createSheet(n, n), stops = ['#bfe9e4', '#d4f2ee', '#e8faf7', '#ffffff'].map(hex);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const w = Math.sin((x + Math.sin(y * 0.4) * 3) * 0.4) * Math.sin((y + Math.sin(x * 0.3) * 2) * 0.35);
    const v = Math.max(0, Math.min(0.999, 0.45 + w * 0.35 + (hash2(x, y, 9) > 0.96 ? 0.4 : 0) + (bayer(x, y) - 0.5) / stops.length));
    set(sheet, x, y, stops[Math.floor(v * stops.length)]);
  }
  const cv = document.createElement('canvas'); cv.width = cv.height = n;
  cv.getContext('2d').putImageData(new ImageData(sheet.data, n, n), 0, 0);
  ripple = new THREE.CanvasTexture(cv);
  ripple.wrapS = ripple.wrapT = THREE.RepeatWrapping; ripple.colorSpace = THREE.SRGBColorSpace;
  return ripple;
}

export function createSpringWater(scene, W) {
  const list = W.objects.filter((o) => o.kind === 'spring');
  const map = ripplePage();
  const mat = new THREE.MeshLambertMaterial({ color: '#8fe0dc', emissive: '#2a8a90', emissiveIntensity: 0.55, map });
  const geo = new THREE.CircleGeometry(R - 0.02, 24).rotateX(-Math.PI / 2);
  
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - 0.5) * 1.4, (uv.getY(i) - 0.5) * 1.4);
  for (const o of list) {
    const m = new THREE.Mesh(geo, mat); m.position.set(o.x, W.groundAt(o.x, o.y) + 0.03, o.y); m.receiveShadow = true;
    scene.add(m);
  }
  const PER = 10, steam = createParticles(scene, list.length * PER, { mode: 'soft', soft: true, name: 'spring-steam' });
  const WHITE = lin('#ffffff');
  return {
    update(t) {
      map.offset.set(Math.sin(t * 0.3) * 0.08, t * 0.03);
      list.forEach((o, s) => {
        const h = W.groundAt(o.x, o.y) + 0.05;
        for (let k = 0; k < PER; k++) {
          const ph = (t * 0.22 + k / PER + s * 0.5) % 1, a = k * 2.39;
          steam.set(s * PER + k, o.x + Math.cos(a) * 0.4 * (1 - ph * 0.5) + ph * 0.25, h + ph * 1.3, o.y + Math.sin(a) * 0.4 * (1 - ph * 0.5) - ph * 0.1,
            0.35 + ph * 0.5, 0.3 * Math.sin(ph * Math.PI), WHITE);
        }
      });
      steam.commit();
    },
  };
}
