

import { GLTFLoader, THREE } from '../vendor/three-vendor.js';
import { ART_ROOT, BUDGET, themeFiles } from './artManifest.js';

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);
}






export async function loadArt(theme, { root = ART_ROOT, timeoutMs = BUDGET.loadTimeoutMs } = {}) {
  const f = themeFiles(theme);
  const texLoader = new THREE.TextureLoader();
  const gltf = new GLTFLoader();
  const tex = (p) =>
    withTimeout(
      texLoader.loadAsync(root + p).catch(() => null),
      timeoutMs,
    ).then((t) => [p, t]);
  const model = (p) =>
    withTimeout(
      gltf
        .loadAsync(root + p)
        .then((g) => g.scene)
        .catch(() => null),
      timeoutMs,
    ).then((m) => [p, m]);
  const texPaths = [...f.textures, ...f.normals, ...f.surfaces, ...f.sprites, ...(f.sky ? [f.sky] : [])];
  const [t, m] = await Promise.all([Promise.all(texPaths.map(tex)), Promise.all(f.models.map(model))]);
  const textures = Object.fromEntries(t.filter(([, v]) => v));
  const models = Object.fromEntries(m.filter(([, v]) => v));
  for (const [p, texture] of Object.entries(textures)) {
    if (!p.endsWith('normal.png')) texture.colorSpace = THREE.SRGBColorSpace;
  }
  return { textures, models };
}


export function rowColour(texture, v) {
  const img = texture.image;
  if (!img || typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 1;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, Math.floor(v * img.height), img.width, 1, 0, 0, 64, 1);
  const d = ctx.getImageData(0, 0, 64, 1).data;
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < d.length; i += 4) {
    r += d[i];
    g += d[i + 1];
    b += d[i + 2];
  }
  return new THREE.Color().setRGB(r / 64 / 255, g / 64 / 255, b / 64 / 255, THREE.SRGBColorSpace);
}
