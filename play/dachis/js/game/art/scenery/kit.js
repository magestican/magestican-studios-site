












import * as THREE from 'three';
import * as S from '../../../vendor/fml/moon/mesh/sdf.js';
import { MeshData, NO_SHADOW_MATERIALS } from '../../../vendor/fml/moon/mesh/meshData.js';
import { createSheet, set, hash2, bayer, hex } from '../../../vendor/arbelo/paint/texturePaint.js';
import { unpackForms } from './formPack.js';

export { S };


export const lin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
export const mixLin = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const jit = (i, k = 0) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };

const forms = new Map();
export const buildStats = { forms: 0, ms: 0, tris: 0, baked: 0 };


export function preloadForms(entries) {
  for (const [name, arrays] of entries) if (!forms.has(name)) { forms.set(name, arrays); buildStats.baked++; }
}
export const allForms = () => [...forms.entries()];

export async function loadBakedForms(url) {
  const t0 = performance.now();
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return false;
    preloadForms(unpackForms(await res.arrayBuffer()).forms);
    buildStats.loadMs = Math.round(performance.now() - t0);
    return true;
  } catch (e) { console.warn('[scenery] baked forms not loaded, building live', e); return false; }
}

export function form(name, build, { min, max, cell = 0.05, tris = 600, uvScale = 1, ao } = {}) {
  if (forms.has(name)) return forms.get(name);
  const t0 = performance.now();
  const md = new MeshData(name);
  S.sdfPart(md, build(), { min, max, cell, targetTris: tris, material: 'stone', uvScale, ao });
  const arrays = md.toArrays();
  forms.set(name, arrays);
  buildStats.forms++; buildStats.ms += performance.now() - t0; buildStats.tris += arrays.triangles;
  return arrays;
}




const PAGE = 32;
export function page(seed, value, stops) {
  const sheet = createSheet(PAGE, PAGE), st = stops.map(hex);
  for (let y = 0; y < PAGE; y++) for (let x = 0; x < PAGE; x++) {
    const v = Math.max(0, Math.min(0.999, value(x, y) + (bayer(x, y) - 0.5) / st.length));
    set(sheet, x, y, st[Math.floor(v * st.length)]);
  }
  const cv = document.createElement('canvas'); cv.width = cv.height = PAGE;
  cv.getContext('2d').putImageData(new ImageData(sheet.data, PAGE, PAGE), 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  return tex;
}

export const tn = (x, y, P, s) => {
  const c = PAGE / P, gx = x / c, gy = y / c, i = Math.floor(gx), j = Math.floor(gy);
  const L = (a, b) => hash2(((a % P) + P) % P, ((b % P) + P) % P, s);
  let fx = gx - i, fy = gy - j; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = L(i, j), b = L(i + 1, j), cc = L(i, j + 1), d = L(i + 1, j + 1);
  return a + (b - a) * fx + (cc - a) * fy + (a - b - cc + d) * fx * fy;
};
const NEUTRAL = ['#c9c1b8', '#d9d2ca', '#e8e3dc', '#f4f0ea', '#fcfaf6'];
const PAINTERS = {
  
  stone: () => page(11, (x, y) => { const n = tn(x, y, 4, 11); const e = Math.abs(tn(x, y, 4, 12) - 0.5); return 0.25 + n * 0.75 - (e < 0.05 ? 0.35 : 0); }, NEUTRAL),
  
  wood: () => page(21, (x, y) => 0.45 + (tn(x * 4, y * 0.5, 8, 21) - 0.5) * 0.9 + (hash2(x, 0, 22) - 0.5) * 0.3, NEUTRAL),
  
  roof: () => page(31, (x, y) => { const col = hash2(x, Math.floor((y + (x % 3)) / 8), 31); return 0.35 + col * 0.55 + (hash2(x, y, 32) - 0.5) * 0.15; }, ['#a89c8e', '#c9bfb2', '#e2dace', '#f3eee6', '#fffcf5']),
  
  plank: () => page(41, (x, y) => 0.55 + (tn(x, y, 4, 41) - 0.5) * 0.7 + (hash2(x, y, 42) > 0.93 ? 0.3 : 0), NEUTRAL),
  soil: () => page(51, (x, y) => 0.4 + (tn(x, y, 8, 51) - 0.5) * 0.6 + (hash2(x, y, 52) > 0.85 ? 0.35 : 0) - (hash2(x, y, 53) > 0.9 ? 0.3 : 0), NEUTRAL),
  leaf: () => page(61, (x, y) => 0.5 + (tn(x, y, 8, 61) - 0.5) * 0.8, NEUTRAL),
  
  bark: () => page(91, (x, y) => 0.5 + (tn(x * 4, y * 0.4, 8, 91) - 0.5) * 1.0 - (hash2(x, 0, 92) > 0.8 ? 0.25 : 0), NEUTRAL),
  blossom: () => page(101, (x, y) => 0.6 + (tn(x, y, 8, 101) - 0.5) * 0.6 + (hash2(x, y, 102) > 0.94 ? 0.35 : 0), NEUTRAL),
  petal: () => page(71, (x, y) => 0.7 + (tn(x, y, 8, 71) - 0.5) * 0.4, NEUTRAL),
  metal: () => page(81, (x, y) => 0.45 + (tn(x, y, 4, 81) - 0.5) * 0.6 + (hash2(x, y, 82) > 0.92 ? 0.4 : 0), NEUTRAL),
};

const materials = new Map();
export function materialFor(id) {
  if (materials.has(id)) return materials.get(id);
  let m;
  if (id === 'fire' || id === 'lamp-glow') m = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#ff9a3a', emissiveIntensity: 1.1 });
  else if (id === 'glass') m = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#3a1c10', emissiveIntensity: 1 });
  
  
  else if (id === 'bark') m = new THREE.MeshLambertMaterial({ vertexColors: true, map: PAINTERS.bark(), emissive: '#2a200e', emissiveIntensity: 1 });
  else m = new THREE.MeshLambertMaterial({ vertexColors: true, map: PAINTERS[id] ? PAINTERS[id]() : null });
  materials.set(id, m);
  return m;
}


const M = new THREE.Matrix4(), N3 = new THREE.Matrix3(), Q = new THREE.Quaternion(), E = new THREE.Euler();
const P = new THREE.Vector3(), SC = new THREE.Vector3(), V = new THREE.Vector3();
export class Batch {
  constructor(name) { this.name = name; this.groups = new Map(); }
  
  add(arrays, at, tint = {}) {
    const s = at.s ?? 1, [sx, sy, sz] = Array.isArray(s) ? s : [s, s, s];
    E.set(at.tilt ? at.tilt[0] : 0, at.rot || 0, at.tilt ? at.tilt[1] : 0, 'YXZ');
    M.compose(P.set(at.x, at.h, at.y), Q.setFromEuler(E), SC.set(sx, sy, sz));
    N3.getNormalMatrix(M);
    for (const g of arrays.groups) {
      let out = this.groups.get(g.material);
      if (!out) this.groups.set(g.material, out = { pos: [], nor: [], col: [], uv: [], idx: [] });
      const base = out.pos.length / 3, t = tint[g.material] || null;
      for (let v = 0; v < g.position.length; v += 3) {
        V.set(g.position[v], g.position[v + 1], g.position[v + 2]).applyMatrix4(M); out.pos.push(V.x, V.y, V.z);
        V.set(g.normal[v], g.normal[v + 1], g.normal[v + 2]).applyMatrix3(N3).normalize(); out.nor.push(V.x, V.y, V.z);
        if (t) out.col.push(g.color[v] * t[0], g.color[v + 1] * t[1], g.color[v + 2] * t[2]);
        else out.col.push(g.color[v], g.color[v + 1], g.color[v + 2]);
      }
      for (let v = 0; v < g.uv.length; v++) out.uv.push(g.uv[v]);
      for (let k = 0; k < g.index.length; k++) out.idx.push(g.index[k] + base);
    }
    return this;
  }
  toGroup() {
    const root = new THREE.Group(); root.name = this.name;
    for (const [id, o] of this.groups) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(o.pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(o.nor, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(o.col, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(o.uv, 2));
      geo.setIndex(o.idx);
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, materialFor(id));
      mesh.name = `${this.name}:${id}`;
      mesh.castShadow = !NO_SHADOW_MATERIALS.includes(id) && id !== 'fire';
      mesh.receiveShadow = true;
      root.add(mesh);
    }
    return root;
  }
}



export const pointScale = { value: 34 };
export function setPointScale(stage) {
  const h = stage.pixel && stage.pixel.enabled ? stage.pixel.target.height : stage.renderer.domElement.height;
  pointScale.value = h / (stage.camera.top - stage.camera.bottom);
}
const VS =  `
attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
uniform float uScale; varying float vA; varying vec3 vC;
void main() { vA = aAlpha; vC = aColor; gl_PointSize = max(1.0, aSize * uScale); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FS =  `
uniform float uSoft; varying float vA; varying vec3 vC;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;
  float a = vA * mix(1.0, (1.0 - r) * (1.0 - r), uSoft);
  gl_FragColor = vec4(vC * a, a);
}`;

export function createParticles(scene, count, { mode = 'add', soft = false, name = 'particles' } = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), size = new Float32Array(count), alpha = new Float32Array(count), color = new Float32Array(count * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  const mat = new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false,
    uniforms: { uScale: pointScale, uSoft: { value: soft ? 1 : 0 } },
    blending: mode === 'add' ? THREE.AdditiveBlending : THREE.CustomBlending,
  });
  if (mode !== 'add') { mat.blendSrc = THREE.OneFactor; mat.blendDst = THREE.OneMinusSrcAlphaFactor; }
  const pts = new THREE.Points(geo, mat);
  pts.name = name; pts.frustumCulled = false; pts.renderOrder = 2;
  scene.add(pts);
  return {
    pos, size, alpha, color, count,
    set(i, x, h, y, s, a, c) { pos[i * 3] = x; pos[i * 3 + 1] = h; pos[i * 3 + 2] = y; size[i] = s; alpha[i] = a; color[i * 3] = c[0]; color[i * 3 + 1] = c[1]; color[i * 3 + 2] = c[2]; },
    commit() { for (const k of ['position', 'aSize', 'aAlpha', 'aColor']) geo.attributes[k].needsUpdate = true; },
  };
}
