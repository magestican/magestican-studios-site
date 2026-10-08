





import * as THREE from 'three';
import { U } from '../../../engine/core/util.js';
import { createTerrain, paintPixelDetail } from '../../../engine/iso/terrain.js';
import { createWater } from '../../../engine/iso/water.js';
import { buildScenery } from '../../art/scenery/village.js';
import { bakePathField, pathGroundMaterial } from '../../../engine/iso/groundPaths.js';
import { T, CRATER, PLATEAU_H, VOLC, RIM, SHRINE } from './mapgen.js';
import { SECTIONS, sectionById, edgeDepth, toUV, fromUV } from './sections.js';
import { lookName, groundPaletteBytes, WATER_TINT, regionByte, GROUND_REGIONS } from '../../art/look/celRules.js';
import { tintWater } from '../../art/look/celSurfaces.js';
import { classPage, tagSpots } from '../../art/look/worldRules.js';
import { createTags } from '../../art/look/tags.js';
import { noSlice } from '../../../engine/core/slicer.js';
import { HOME } from './regions.js';
import { backdropOf } from './backdrops.js';
import { liveObjects } from './bakeVerdicts.js';

const CEL = typeof location !== 'undefined' && lookName(location.search) === 'cel';

function pageTexture(data, w, h, srgb = false) {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}
function paletteTexture() { const p = groundPaletteBytes(); return pageTexture(p.data, p.width, p.height, true); }

const TILE_COLOR = {
  [T.SAND]: '#f2dea6', [T.GRASS]: '#5cc24e', [T.TALL]: '#46a83f', [T.PATH]: '#5cc24e',
  [T.ROCK]: '#85806a', [T.LAVA]: '#3a2420', [T.PLAZA]: '#8cc25a', [T.SHALLOW]: '#e6d49c', [T.DEEP]: '#d8c894',
  [T.WOOD]: '#3f8a3a', [T.CLIFF]: '#6e625a', [T.JUNGLE]: '#338a3e',
  
  [T.REEF]: '#e8d2bc', [T.KELP]: '#3f8a7a', [T.RUIN]: '#a9b4b8',
  
  [T.GLADE]: '#2f7a3a', [T.THICKET]: '#27663a', [T.MOSS]: '#7fa06a',
};


const DEEP_WASH = '#4aa0b8', CORAL_RECT = sectionById('coral').rect;

const MOUNTAIN = new Set(['kazan', 'slope']);





export async function buildWorld(stage, W, slice = noSlice) {
  const { scene } = stage;
  const SECS = W.sections || SECTIONS, kazan = !W.region || W.region === HOME;
  
  
  const backdrop = !!backdropOf(W.region || HOME);
  
  const before = new Set(scene.children), ownTextures = [];
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
    const deep = kazan ? U.clamp((edgeDepth(CORAL_RECT, ...toUV(x, y)).depth + 1.5) / 3, 0, 1) : 0; 
    if (deep > 0) { c.lerp(tmp.set(DEEP_WASH), deep * (0.28 + n * 0.3)); c.getHSL(hsl); }
    c.setHSL(hsl.h + n * 0.04, hsl.s, U.clamp(hsl.l + n * 0.08 + Math.min(h, 4) * 0.008, 0, 1));
    return c.getHex();
  };
  
  const field = backdrop ? null : await bakePathField(W.paths, W.N, 4, slice);
  await slice('path field');
  
  
  const ground = backdrop ? null : await createTerrain({ n: W.N, slice, heightAt: W.heightAt, colorAt, sub: 2, detail: paintPixelDetail(),
    keepQuad: (x, y) => W.onScreen(x + 0.25, y + 0.25, 1.2, 1.2),
    material: (map) => pathGroundMaterial({ map, field, span: W.N }) });
  if (ground) scene.add(ground);
  await slice('terrain');
  const water = createWater({ center: [W.N / 2, W.N / 2], depthAt: W.heightAt, mapN: W.N });
  scene.add(water.mesh);
  
  
  
  if (CEL && ground) ground.material.userData.look = { role: 'ground', classes: pageTexture(classPage(W), W.N, W.N), palette: paletteTexture(), field, n: W.N };
  if (CEL) water.mesh.material.userData.look = { role: 'water' };
  await slice('water + class page');

  
  const tuftTimes = { value: 0 };
  const blades = document.createElement('canvas'); blades.width = 64; blades.height = 64;
  const bx = blades.getContext('2d');
  for (let k = 0; k < 16; k++) {
    const x = 4 + k * 3.7, h = 36 + Math.sin(k * 2.3) * 16;
    const g = bx.createLinearGradient(0, 64, 0, 64 - h);
    
    for (const [at, c] of CEL ? [[0, '#3f8f2f'], [0.5, '#3f8f2f'], [0.5, '#8fd65a'], [1, '#8fd65a']] : [[0, '#2c7a2c'], [1, '#b8f27a']]) g.addColorStop(at, c);
    bx.fillStyle = g; bx.beginPath(); bx.moveTo(x - 2.5, 64); bx.quadraticCurveTo(x + 2, 64 - h * 0.6, x + Math.sin(k) * 6, 64 - h); bx.lineTo(x + 2.5, 64); bx.fill();
    if (CEL) { bx.strokeStyle = '#0d0a14'; bx.lineWidth = 1.2; bx.stroke(); }
  }
  const tex = new THREE.CanvasTexture(blades); tex.colorSpace = THREE.SRGBColorSpace;
  const tuft = crossedQuads(0.55, 0.5);
  
  const tuftMat = (color) => { const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, color }); m.onBeforeCompile = sway; return m; };
  const sway = sh => {
    sh.uniforms.uTime = tuftTimes;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n  float ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.5;\n  transformed.x += sin(uTime * 2.2 + ph) * 0.09 * position.y;\n  transformed.z += cos(uTime * 1.7 + ph) * 0.05 * position.y;');
  };
  
  const tmat = tuftMat('#cfe3bd'), kelpMat = tuftMat('#7fd8c8'), wildMat = tuftMat('#9fd08a'), frostMat = tuftMat('#f2f8ff'), ashMat = tuftMat('#c86a4a');
  
  
  const FROST = GROUND_REGIONS.indexOf('frost'), snowy = (sec) => !!sec && regionByte(sec) === FROST;
  const MAGMA = GROUND_REGIONS.indexOf('magma'), ashy = (sec) => !!sec && regionByte(sec) === MAGMA; 
  
  const tufts = {};
  const r = U.rng(99);
  const bySec = Object.fromEntries(SECS.map((sec) => [sec.id, []]));
  
  
  const rl = U.rng(1616), tall = (t) => t === T.TALL || t === T.KELP || t === T.THICKET;
  const tuftsOf = (t, rr, i, j) => {
    const n = tall(t) ? 5 : t === T.GRASS ? (rr() < 0.45 ? 1 : 0) : t === T.JUNGLE || t === T.GLADE ? (rr() < 0.3 ? 1 : 0) : t === T.WOOD ? (rr() < 0.5 ? 1 : 0) : 0, out = [];
    for (let k = 0; k < n; k++) out.push([i + rr(), j + rr(), tall(t) ? 1 + rr() * 0.5 : 0.55 + rr() * 0.3, rr() * 6.28]);
    return out;
  };
  for (let j = 0; j < W.N; j++) for (let i = 0, last = W.N - 1; i < W.N; i++) {
    if (i === last) await slice('tuft rows');
    const t = W.type[W.idx(i, j)], tb = W.baseType[W.idx(i, j)];
    let list = tuftsOf(tb, r, i, j);
    if (t !== tb) list = tuftsOf(t, rl, i, j);
    if (!list.length) continue;
    if ((t === T.GRASS || t === T.GLADE) && snowy(W.sectionAt(i + 0.5, j + 0.5))) continue;
    const ids = W.windowsOf(i + 0.5, j + 0.5, 0.6);
    for (const tuft of list) for (const id of ids) bySec[id].push(tuft);
  }
  const o = new THREE.Object3D();
  for (const id in bySec) {
    const spots = bySec[id];
    if (!spots.length) continue;
    const im = new THREE.InstancedMesh(tuft, id === 'coral' ? kelpMat : id === 'verdant' ? wildMat : snowy(id) ? frostMat : ashy(id) ? ashMat : tmat, spots.length);
    spots.forEach(([x, y, s, rot], k) => { o.position.set(x, W.groundAt(x, y), y); o.scale.set(s, s, s); o.rotation.set(0, rot, 0); o.updateMatrix(); im.setMatrixAt(k, o.matrix); });
    im.computeBoundingSphere();
    im.receiveShadow = true;
    im.name = 'tufts-' + id;
    scene.add(im);
    tufts[id] = im;
    await slice('tuft mesh ' + id);
  }

  
  const cr = kazan ? { x: CRATER.x, y: CRATER.y, r: 1.6, h: PLATEAU_H + 0.03, section: 'kazan' } : W.crater || null;
  
  
  
  
  
  
  
  const OLD_COURT = new Set(['hut', 'bed', 'temple', 'spring', 'torch']);
  const oldVillage = (o) => ((o.kind === 'hut' || o.kind === 'bed') && Math.hypot(o.x - VOLC.x, o.y - VOLC.y) < RIM.r)
    || (OLD_COURT.has(o.kind) && Math.hypot(o.x - SHRINE.x, o.y - SHRINE.y) < 4.6);
  const drawn = kazan ? Object.assign(Object.create(W), { objects: W.objects.filter((o) => !oldVillage(o)) }) : W;
  const scenery = await buildScenery(stage, drawn, { crater: cr, craterRadius: cr ? cr.r : 0, lavaHeight: cr ? cr.h : 0, craterSection: cr ? cr.section : null, sections: SECS.map((sec) => sec.id), keep: backdrop ? liveObjects : null }, slice);
  
  for (const id in scenery.groups) scenery.groups[id].userData.seeThrough = true;
  
  
  
  if (CEL && !backdrop && tagSpots(W).length) { createTags(W, scenery.groups); await slice('tags'); }
  
  
  if (W.bubble) { scene.add(bubbleSkin(W)); await slice('bubble'); } else bubbleLook(null);
  ownTextures.push(tex);
  const owned = scene.children.filter((o) => !before.has(o));

  return {
    water, scenery, tufts, owned,
    
    
    
    
    
    dispose() {
      for (const o of owned) {
        scene.remove(o);
        o.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.isInstancedMesh) m.dispose(); });
      }
      for (const t of ownTextures) t.dispose();
      for (const m of [ground && ground.material, water.mesh.material].filter(Boolean)) {
        const u = m.userData && m.userData.look;
        if (u) for (const k of ['classes', 'palette', 'field']) if (u[k] && u[k].dispose) u[k].dispose();
      }
      owned.length = 0;
    },
    update(t) {
      water.update(t); tuftTimes.value = t; scenery.update(t);
    },
    
    
    
    region: W.region || HOME,
    showSection(id) {
      water.mesh.visible = !!(sectionById(id) && sectionById(id).sea);
      tintWater(WATER_TINT[W.region] || null); 
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


const SKIN_MAT = new THREE.MeshBasicMaterial({ color: 0xa8ecff, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false });


const MURK = new THREE.Color(0x6fae98), CLEAR = new THREE.Color(0xdaf8ff);



let light = null;

export function bubbleLook(k, snap = false) {
  if (k === null) { if (light) light.style.display = 'none'; return; }
  SKIN_MAT.color.copy(MURK).lerp(CLEAR, k);
  SKIN_MAT.opacity = 0.22 - 0.08 * k;
  if (typeof document === 'undefined') return;
  if (!light) {
    light = document.createElement('div'); light.id = 'bubbleLight';
    light.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none';
    light.innerHTML = '<i style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%, rgba(70,120,80,.10), rgba(30,70,55,.42));mix-blend-mode:multiply"></i>'
      + '<i style="position:absolute;inset:-20%;background:repeating-linear-gradient(105deg, rgba(255,230,150,0) 0 70px, rgba(255,230,150,.22) 70px 110px, rgba(255,230,150,0) 110px 190px);mix-blend-mode:screen"></i>';
    document.body.appendChild(light);
  }
  light.style.display = '';
  for (const c of light.children) c.style.transition = snap ? 'none' : 'opacity 6s ease-in-out';
  light.children[0].style.opacity = String(1 - k);
  light.children[1].style.opacity = String(k);
}
function bubbleSkin(W) {
  const B = W.bubble, SEG = 96, RINGS = 5, pos = [], idx = [];
  for (let i = 0; i <= RINGS; i++) {
    const t = i / RINGS, k = 1 - t * t * 0.08, h = -0.3 + t * 3.2;
    for (let j = 0; j <= SEG; j++) {
      const a = j / SEG * Math.PI * 2, [x, y] = fromUV(B.u + Math.cos(a) * B.ru * k, B.v + Math.sin(a) * B.rv * k);
      pos.push(x, h, y);
    }
  }
  for (let i = 0; i < RINGS; i++) for (let j = 0; j < SEG; j++) {
    const a = i * (SEG + 1) + j, b = a + SEG + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, SKIN_MAT);
  m.name = 'bubble-skin'; m.renderOrder = 2;
  return m;
}
