

import * as THREE from 'three';
import { createSheet, set, hash2, bayer, speckle, hex } from '../../vendor/arbelo/paint/texturePaint.js';




export function createTerrain({ n, heightAt, colorAt, sub = 2, detail, material = null, keepQuad = null }) {
  const V = n * sub + 1;
  const pos = new Float32Array(V * V * 3), col = new Float32Array(V * V * 3), uv = new Float32Array(V * V * 2);
  const c = new THREE.Color();
  for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) {
    const x = i / sub, y = j / sub, k = j * V + i;
    pos[k * 3] = x; pos[k * 3 + 1] = heightAt(x, y); pos[k * 3 + 2] = y;
    c.set(colorAt(x, y));
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    uv[k * 2] = x / 2; uv[k * 2 + 1] = y / 2;
  }
  const idx = [];
  for (let j = 0; j < V - 1; j++) for (let i = 0; i < V - 1; i++) {
    if (keepQuad && !keepQuad(i / sub, j / sub)) continue;
    const a = j * V + i, b = a + 1, d = a + V, e = d + 1;
    idx.push(a, d, b, b, d, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const map = detail ? new THREE.CanvasTexture(detail) : null;
  if (map) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace;
    map.magFilter = map.minFilter = THREE.NearestFilter; map.generateMipmaps = false;
  }
  const mesh = new THREE.Mesh(g, material ? material(map) : new THREE.MeshLambertMaterial({ vertexColors: true, map }));
  mesh.receiveShadow = true;
  return mesh;
}





const DETAIL_STOPS = ['#c9c6cf', '#d8d5dc', '#e6e3e8', '#f1eff2', '#faf9f7'].map(hex);
export function paintPixelDetail(seed = 7, size = 64) {
  const sheet = createSheet(size, size);
  const P = 8, cell = size / P;
  const lattice = (i, j, s) => hash2(((i % P) + P) % P, ((j % P) + P) % P, s);
  const tileNoise = (x, y, s) => {
    const gx = x / cell, gy = y / cell, i = Math.floor(gx), j = Math.floor(gy);
    let fx = gx - i, fy = gy - j; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const a = lattice(i, j, s), b = lattice(i + 1, j, s), c = lattice(i, j + 1, s), d = lattice(i + 1, j + 1, s);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const n = 0.65 * tileNoise(x, y, seed) + 0.35 * tileNoise(x * 2, y * 2, seed + 17);
    const v = Math.max(0, Math.min(0.999, (n - 0.5) * 1.7 + 0.5 + (bayer(x, y) - 0.5) / DETAIL_STOPS.length));
    set(sheet, x, y, DETAIL_STOPS[Math.floor(v * DETAIL_STOPS.length)]);
  }
  speckle(sheet, '#ffffff', { seed: seed + 3, density: 0.035 });
  speckle(sheet, '#bdb9c4', { seed: seed + 5, density: 0.03 });
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  cv.getContext('2d').putImageData(new ImageData(sheet.data, size, size), 0, 0);
  return cv;
}


export function paintDetailTexture(seed = 7, size = 256) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#eeeeee'; ctx.fillRect(0, 0, size, size);
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 900; k++) {
    const x = r() * size, y = r() * size, v = 200 + Math.floor(r() * 55);
    ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x, y, 2 + r() * 3, 2 + r() * 3);
  }
  ctx.lineCap = 'round';
  for (let k = 0; k < 700; k++) {
    const x = r() * size, y = r() * size, h = 3 + r() * 6, v = r() < 0.5 ? 255 : 185 + Math.floor(r() * 30);
    ctx.strokeStyle = `rgba(${v},${v},${v},0.9)`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 1, y - h * 0.6, x + (r() - 0.5) * 4, y - h); ctx.stroke();
  }
  return cv;
}
