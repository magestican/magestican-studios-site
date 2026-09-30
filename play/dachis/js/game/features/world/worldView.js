





import * as THREE from 'three';
import { U } from '../../../engine/core/util.js';
import { createTerrain, paintPixelDetail } from '../../../engine/iso/terrain.js';
import { createWater } from '../../../engine/iso/water.js';
import { buildScenery } from '../../art/scenery/village.js';
import { bakePathField, pathGroundMaterial } from '../../../engine/iso/groundPaths.js';
import { T, CRATER, PLATEAU_H } from './mapgen.js';
import { SECTIONS, sectionById, edgeDepth, toUV } from './sections.js';

const TILE_COLOR = {
  [T.SAND]: '#f2dea6', [T.GRASS]: '#5cc24e', [T.TALL]: '#46a83f', [T.PATH]: '#5cc24e',
  [T.ROCK]: '#85806a', [T.LAVA]: '#3a2420', [T.PLAZA]: '#8cc25a', [T.SHALLOW]: '#e6d49c', [T.DEEP]: '#d8c894',
  [T.WOOD]: '#3f8a3a', [T.CLIFF]: '#6e625a', [T.JUNGLE]: '#338a3e',
  
  [T.REEF]: '#e8d2bc', [T.KELP]: '#3f8a7a', [T.RUIN]: '#a9b4b8',
  
  [T.GLADE]: '#2f7a3a', [T.THICKET]: '#27663a', [T.MOSS]: '#7fa06a',
};


const DEEP_WASH = '#4aa0b8', CORAL_RECT = sectionById('coral').rect;

const MOUNTAIN = new Set(['kazan', 'slope']);

export function buildWorld(stage, W) {
  const { scene } = stage;
  const c = new THREE.Color(), tmp = new THREE.Color();
  const colorAt = (x, y) => {
    c.setRGB(0, 0, 0);
    for (const [dx, dy] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
      const t = W.tileType(x + dx, y + dy);
      c.add(tmp.set(TILE_COLOR[t === T.PATH && MOUNTAIN.has(W.sectionAt(x + dx, y + dy)) ? T.ROCK : t]));
    }
    c.multiplyScalar(0.25);
    const n = U.fbm(x * 0.22, y * 0.22, 99) - 0.5, h = W.heightAt(x, y);
    const hsl = {}; c.getHSL(hsl);
    if (h < 0) { c.lerp(tmp.set('#2e6f86'), U.clamp(-h / 2.2, 0, 0.85)); return c.getHex(); }
    const deep = U.clamp((edgeDepth(CORAL_RECT, ...toUV(x, y)).depth + 1.5) / 3, 0, 1); 
    if (deep > 0) { c.lerp(tmp.set(DEEP_WASH), deep * (0.28 + n * 0.3)); c.getHSL(hsl); }
    c.setHSL(hsl.h + n * 0.04, hsl.s, U.clamp(hsl.l + n * 0.08 + Math.min(h, 4) * 0.008, 0, 1));
    return c.getHex();
  };
  
  const field = bakePathField(W.paths, W.N);
  
  
  scene.add(createTerrain({ n: W.N, heightAt: W.heightAt, colorAt, sub: 2, detail: paintPixelDetail(),
    keepQuad: (x, y) => W.onScreen(x + 0.25, y + 0.25, 1.2, 1.2),
    material: (map) => pathGroundMaterial({ map, field, span: W.N }) }));
  const water = createWater({ center: [W.N / 2, W.N / 2], depthAt: W.heightAt, mapN: W.N });
  scene.add(water.mesh);

  
  const tuftTimes = { value: 0 };
  const blades = document.createElement('canvas'); blades.width = 64; blades.height = 64;
  const bx = blades.getContext('2d');
  for (let k = 0; k < 16; k++) {
    const x = 4 + k * 3.7, h = 36 + Math.sin(k * 2.3) * 16;
    const g = bx.createLinearGradient(0, 64, 0, 64 - h); g.addColorStop(0, '#2c7a2c'); g.addColorStop(1, '#b8f27a');
    bx.fillStyle = g; bx.beginPath(); bx.moveTo(x - 2.5, 64); bx.quadraticCurveTo(x + 2, 64 - h * 0.6, x + Math.sin(k) * 6, 64 - h); bx.lineTo(x + 2.5, 64); bx.fill();
  }
  const tex = new THREE.CanvasTexture(blades); tex.colorSpace = THREE.SRGBColorSpace;
  const tuft = crossedQuads(0.55, 0.5);
  
  const tuftMat = (color) => { const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, color }); m.onBeforeCompile = sway; return m; };
  const sway = sh => {
    sh.uniforms.uTime = tuftTimes;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n  float ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.5;\n  transformed.x += sin(uTime * 2.2 + ph) * 0.09 * position.y;\n  transformed.z += cos(uTime * 1.7 + ph) * 0.05 * position.y;');
  };
  
  const tmat = tuftMat('#cfe3bd'), kelpMat = tuftMat('#7fd8c8'), wildMat = tuftMat('#9fd08a');
  
  const tufts = {};
  const r = U.rng(99);
  const bySec = Object.fromEntries(SECTIONS.map((sec) => [sec.id, []]));
  
  
  const rl = U.rng(1616), tall = (t) => t === T.TALL || t === T.KELP || t === T.THICKET;
  const tuftsOf = (t, rr, i, j) => {
    const n = tall(t) ? 5 : t === T.GRASS ? (rr() < 0.45 ? 1 : 0) : t === T.JUNGLE || t === T.GLADE ? (rr() < 0.3 ? 1 : 0) : t === T.WOOD ? (rr() < 0.5 ? 1 : 0) : 0, out = [];
    for (let k = 0; k < n; k++) out.push([i + rr(), j + rr(), tall(t) ? 1 + rr() * 0.5 : 0.55 + rr() * 0.3, rr() * 6.28]);
    return out;
  };
  for (let j = 0; j < W.N; j++) for (let i = 0; i < W.N; i++) {
    const t = W.type[W.idx(i, j)], tb = W.baseType[W.idx(i, j)];
    let list = tuftsOf(tb, r, i, j);
    if (t !== tb) list = tuftsOf(t, rl, i, j);
    if (!list.length) continue;
    const ids = W.windowsOf(i + 0.5, j + 0.5, 0.6);
    for (const tuft of list) for (const id of ids) bySec[id].push(tuft);
  }
  const o = new THREE.Object3D();
  for (const id in bySec) {
    const spots = bySec[id];
    if (!spots.length) continue;
    const im = new THREE.InstancedMesh(tuft, id === 'coral' ? kelpMat : id === 'verdant' ? wildMat : tmat, spots.length);
    spots.forEach(([x, y, s, rot], k) => { o.position.set(x, W.groundAt(x, y), y); o.scale.set(s, s, s); o.rotation.set(0, rot, 0); o.updateMatrix(); im.setMatrixAt(k, o.matrix); });
    im.computeBoundingSphere();
    im.receiveShadow = true;
    im.name = 'tufts-' + id;
    scene.add(im);
    tufts[id] = im;
  }

  const scenery = buildScenery(stage, W, { crater: CRATER, craterRadius: 1.6, lavaHeight: PLATEAU_H + 0.03, sections: SECTIONS.map((sec) => sec.id) });
  
  for (const id in scenery.groups) scenery.groups[id].userData.seeThrough = true;

  return {
    water, scenery, tufts,
    update(t) {
      water.update(t); tuftTimes.value = t; scenery.update(t);
    },
    
    
    
    showSection(id) {
      water.mesh.visible = !!(sectionById(id) && sectionById(id).sea);
      scenery.showSection(id);
      for (const k in tufts) tufts[k].visible = k === id;
    },
  };
}


function crossedQuads(w, h) {
  const pos = [], uv = [], nor = [], idx = [];
  for (let k = 0; k < 3; k++) {
    const a = k * Math.PI / 3, cx = Math.cos(a) * w / 2, cz = Math.sin(a) * w / 2, b = pos.length / 3;
    pos.push(-cx, 0, -cz, cx, 0, cz, cx, h, cz, -cx, h, -cz);
    uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    for (let v = 0; v < 4; v++) nor.push(0, 1, 0);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}
