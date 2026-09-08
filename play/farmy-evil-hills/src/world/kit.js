


















import * as THREE from 'three';
import { stationKit, RECIPES } from '../../../../web-engine/horror/tools/stationMaterials.mjs';
import { paintMaterial } from '../../../../web-engine/horror/tools/materials.mjs';
import { bindSheet, texturedMaterial } from './textures.js';

const KITS = new Map();






export function kitFor(arch, deckNo = 1) {
  let k = KITS.get(arch.name);
  if (!k) {
    const sheets = stationKit(arch, { size: 128, seed: 11 + arch.act * 7, deckNo });
    sheets.hide = paintMaterial('hidePig', { size: 64, seed: 3 + arch.act });
    const tex = {}; const mat = {};
    for (const [name, sheet] of Object.entries(sheets)) {
      if (name === 'sign') continue;
      
      tex[name] = bindSheet(sheet, { flipY: true });
      mat[name] = texturedMaterial(tex[name]);
    }
    
    mat.doorLeaf = texturedMaterial(tex.door, { side: THREE.DoubleSide });
    k = { arch, sheets, tex, mat, signFor: -1, sign: null, signTex: null };
    KITS.set(arch.name, k);
  }
  if (k.signFor !== deckNo) {
    if (k.signTex) k.signTex.dispose();
    const line1 = arch.name === 'processing' ? 'PROC' : arch.name === 'dark' ? 'DECK' : 'STOCK';
    const sheet = RECIPES.sign(128, 10 + deckNo, arch.palette, { line1, line2: String(deckNo).padStart(2, '0') });
    k.signTex = bindSheet(sheet, { repeat: false, flipY: true });
    k.sign = texturedMaterial(k.signTex);
    k.signFor = deckNo;
  }
  return k;
}


export function kitTextureCount(kit) { return Object.keys(kit.tex).length + (kit.signTex ? 1 : 0); }





export function readyGeometry(geo, colour = null) {
  const n = geo.attributes.position.count;
  const col = new Float32Array(n * 3);
  if (colour === null) col.fill(1);
  else {
    const c = new THREE.Color(colour);
    for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  }
  geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
  if (!geo.attributes.normal) geo.computeVertexNormals();
  return geo;
}


export function boxGeo(w, h, d, tile = 1) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  const uv = g.attributes.uv;
  
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f += 1) {
    const [fw, fh] = dims[f];
    for (let k = 0; k < 6; k += 1) {
      const i = f * 6 + k;
      uv.setXY(i, uv.getX(i) * (fw / tile), uv.getY(i) * (fh / tile));
    }
  }
  return readyGeometry(g);
}


export function cylGeo(rTop, rBot, h, segs = 8, tile = 1, { open = false } = {}) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, segs, 1, open).toNonIndexed();
  const uv = g.attributes.uv;
  const circ = Math.PI * (rTop + rBot);
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * (circ / tile), uv.getY(i) * (h / tile));
  return readyGeometry(g);
}


export function quadGeo(w, h, tile = 1, { stretch = false } = {}) {
  const g = new THREE.PlaneGeometry(w, h).toNonIndexed();
  if (!stretch) {
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * (w / tile), uv.getY(i) * (h / tile));
  }
  return readyGeometry(g);
}

const mesh = (geo, material, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); return m; };








const SIMPLE = {
  strawBale: ['straw', 0.95, 0.5, 0.5, 0.6],
  feedSack: ['hessian', 0.55, 0.7, 0.4, 0.5],
  chickenCrate: ['wood', 0.7, 0.6, 0.5, 0.5],
  offalBin: ['steel', 0.7, 0.8, 0.6, 0.7],
  sandbag: ['hessian', 0.7, 0.5, 0.5, 0.5],
  bodyBag: ['vinyl', 1.8, 0.3, 0.6, 0.6],
  filingCabinet: ['steel', 0.5, 1.5, 0.6, 0.7],
  medCabinet: ['steel', 0.6, 1.6, 0.4, 0.7],
  sink: ['steel', 0.6, 0.9, 0.5, 0.7],
  switchboard: ['steel', 0.4, 1.8, 0.24, 0.6],
  scaldTank: ['steel', 1.0, 1.3, 1.0, 0.8],
  fuelDrum: null,   
};

const BUILDERS = {
  barrel(k, spec) {
    const r = spec.r || 0.27; const h = spec.h || 0.86;
    const g = new THREE.Group();
    g.add(mesh(cylGeo(r, r, h, 8, 0.6), k.mat.rust, 0, h / 2, 0));
    
    for (const y of [h * 0.28, h * 0.72]) g.add(mesh(cylGeo(r + 0.012, r + 0.012, 0.05, 8, 0.3), k.mat.steel, 0, y, 0));
    return g;
  },
  locker(k, spec) {
    
    const g = new THREE.Group();
    g.add(mesh(boxGeo(0.72, spec.h || 2.0, 0.42, 0.7), k.mat.steel, 0, (spec.h || 2.0) / 2, 0));
    return g;
  },
  feedHopper(k, spec) {
    const h = spec.h || 1.9;
    const g = new THREE.Group();
    g.add(mesh(cylGeo(0.45, 0.16, h * 0.55, 8, 0.6), k.mat.rust, 0, h * 0.55 / 2 + 0.25, 0));
    g.add(mesh(boxGeo(0.95, h * 0.4, 0.9, 0.7), k.mat.steel, 0, h * 0.55 + 0.25 + h * 0.2, 0));
    for (const sx of [-1, 1]) g.add(mesh(boxGeo(0.06, h * 0.6, 0.06, 0.3), k.mat.steel, sx * 0.4, h * 0.3, 0.3));
    g.add(mesh(boxGeo(0.5, 0.18, 0.5, 0.5), k.mat.hessian, 0, 0.09, 0.15));
    return g;
  },
  waterTrough(k, spec) {
    const len = spec.len || 1.4; const h = spec.h || 0.6;
    const g = new THREE.Group();
    g.add(mesh(boxGeo(len, h, 0.55, 0.6), k.mat.steel, 0, h / 2, 0));
    const top = mesh(quadGeo(len - 0.08, 0.47, 0.8), k.mat.water, 0, h - 0.06, 0);
    top.rotation.x = -Math.PI / 2;
    g.add(top);
    return g;
  },
  penGate(k, spec) {
    const len = spec.len || 1.2; const h = spec.h || 1.2;
    const g = new THREE.Group();
    for (const sx of [-1, 1]) g.add(mesh(boxGeo(0.08, h, 0.08, 0.4), k.mat.wood, sx * (len / 2 - 0.04), h / 2, 0));
    for (const y of [0.3, 0.65, 1.0]) g.add(mesh(boxGeo(len, 0.07, 0.05, 0.5), k.mat.wood, 0, y * (h / 1.2), 0));
    return g;
  },
  penRail(k, spec) { return BUILDERS.penGate(k, { len: spec.len || 1.6, h: spec.h || 1.1 }); },
  heatLamp(k) {
    
    const g = new THREE.Group();
    g.add(mesh(cylGeo(0.02, 0.02, 0.5, 6, 0.3), k.mat.rubber, 0, -0.25, 0));
    g.add(mesh(cylGeo(0.09, 0.2, 0.22, 8, 0.3, { open: true }), k.mat.rust, 0, -0.6, 0));
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.16, 8), new THREE.MeshBasicMaterial({ color: 0xff8a3c, fog: false }));
    glow.rotation.x = Math.PI / 2; glow.position.y = -0.7;
    g.add(glow);
    g.userData.light = { colour: 0xff7a30, intensity: 1.8, radius: 1.4, y: -0.7 };
    return g;
  },
  emergencyBeacon(k) {
    const g = new THREE.Group();
    g.add(mesh(boxGeo(0.3, 0.12, 0.2, 0.4), k.mat.steel, 0, -0.06, 0));
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.14), new THREE.MeshBasicMaterial({ color: 0xff2020, fog: false }));
    lamp.position.y = -0.19;
    g.add(lamp);
    g.userData.light = { colour: 0xff2a30, intensity: 2.4, radius: 1.8, y: -0.2, flicker: true };
    g.userData.lamp = lamp;
    return g;
  },
  meatHook(k) {
    const g = new THREE.Group();
    g.add(mesh(cylGeo(0.015, 0.015, 0.9, 5, 0.2), k.mat.steel, 0, -0.45, 0));
    const hook = mesh(boxGeo(0.05, 0.22, 0.05, 0.2), k.mat.steel, 0.05, -1.0, 0);
    hook.rotation.z = -0.5;
    g.add(hook);
    return g;
  },
  hangingCarcass(k) {
    const g = BUILDERS.meatHook(k);
    const body = mesh(boxGeo(0.5, 1.5, 0.32, 0.5), k.mat.hide, 0, -1.85, 0);
    body.rotation.z = 0.06;
    g.add(body);
    return g;
  },
  conveyorSection(k, spec) {
    const len = spec.len || 2.4; const h = spec.h || 0.9;
    const g = new THREE.Group();
    g.add(mesh(boxGeo(len, 0.18, 0.7, 0.6), k.mat.rubber, 0, h - 0.09, 0));
    g.add(mesh(boxGeo(len, 0.1, 0.78, 0.6), k.mat.steel, 0, h - 0.23, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(boxGeo(0.07, h - 0.28, 0.07, 0.3), k.mat.steel, sx * (len / 2 - 0.15), (h - 0.28) / 2, sz * 0.3));
    return g;
  },
  chute(k, spec) {
    const h = spec.h || 2.2;
    const g = new THREE.Group();
    const body = mesh(boxGeo(0.6, h * 0.8, 0.5, 0.7), k.mat.steel, 0, h * 0.5, -0.1);
    body.rotation.x = 0.18;
    g.add(body);
    g.add(mesh(boxGeo(0.7, 0.35, 0.7, 0.6), k.mat.rust, 0, 0.2, 0.15));
    return g;
  },
  steelTable(k, spec) {
    const len = spec.len || 1.6; const h = spec.h || 0.9;
    const g = new THREE.Group();
    g.add(mesh(boxGeo(len, 0.06, 0.7, 0.7), k.mat.steel, 0, h - 0.03, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(boxGeo(0.05, h - 0.06, 0.05, 0.3), k.mat.steel, sx * (len / 2 - 0.1), (h - 0.06) / 2, sz * 0.28));
    g.add(mesh(boxGeo(0.4, 0.12, 0.3, 0.4), k.mat.hide, len * 0.2, h + 0.06, 0.05));
    return g;
  },
  hoseReel(k) {
    const g = new THREE.Group();
    const reel = mesh(cylGeo(0.3, 0.3, 0.26, 10, 0.5), k.mat.rubber, 0, 0.62, 0);
    reel.rotation.x = Math.PI / 2;
    g.add(reel);
    g.add(mesh(boxGeo(0.1, 0.62, 0.36, 0.4), k.mat.steel, 0, 0.31, -0.02));
    return g;
  },
  drainGrate(k) {
    const g = new THREE.Group();
    const q = mesh(quadGeo(1.1, 1.1, 0.55), k.mat.grille, 0, 0.012, 0);
    q.rotation.x = -Math.PI / 2;
    g.add(q);
    return g;
  },
  carcassTrolley(k, spec) {
    const h = spec.h || 1.4;
    const g = new THREE.Group();
    g.add(mesh(boxGeo(0.8, 0.06, 0.55, 0.5), k.mat.steel, 0, 0.14, 0));
    for (const sx of [-1, 1]) g.add(mesh(boxGeo(0.05, h, 0.05, 0.3), k.mat.steel, sx * 0.36, h / 2, 0));
    g.add(mesh(boxGeo(0.8, 0.05, 0.05, 0.3), k.mat.steel, 0, h - 0.02, 0));
    g.add(mesh(boxGeo(0.42, 1.0, 0.28, 0.5), k.mat.hide, 0.05, h - 0.55, 0));
    return g;
  },
  floodPool(k, spec) {
    const len = spec.len || 4.0;
    const g = new THREE.Group();
    const q = mesh(quadGeo(len, 2.9, 1.0), k.mat.water, 0, 0.02, 0);
    q.rotation.x = -Math.PI / 2;
    g.add(q);
    return g;
  },
  fallenPanel(k, spec) {
    const len = spec.len || 1.5;
    const g = new THREE.Group();
    const p = mesh(quadGeo(len, 1.6, 1.0), k.mat.wallA, 0, 0.72, 0.2);
    p.rotation.x = 0.42; p.material = k.mat.wallC;
    g.add(p);
    g.add(mesh(boxGeo(len * 0.5, 0.08, 0.4, 0.5), k.mat.concrete, 0.2, 0.04, 0.35));
    return g;
  },
  burstPipe(k, spec) {
    const h = spec.h || 1.6;
    const g = new THREE.Group();
    g.add(mesh(cylGeo(0.14, 0.14, h * 0.55, 8, 0.5), k.mat.rust, 0, h * 0.55 / 2, 0));
    const top = mesh(cylGeo(0.14, 0.14, h * 0.4, 8, 0.5), k.mat.rust, 0.1, h * 0.55 + h * 0.2 + 0.1, 0);
    top.rotation.z = 0.35;
    g.add(top);
    g.add(mesh(cylGeo(0.18, 0.18, 0.06, 8, 0.3), k.mat.steel, 0, h * 0.55, 0));
    return g;
  },
  cableBundle(k, spec) {
    
    const len = spec.len || 1.6;
    const g = new THREE.Group();
    for (let i = 0; i < 3; i += 1) {
      const c = mesh(cylGeo(0.02, 0.02, len, 5, 0.3), k.mat.rubber, 0, -0.18 - i * 0.05, (i - 1) * 0.06);
      c.rotation.z = Math.PI / 2; c.rotation.y = 0.25 * (i - 1);
      g.add(c);
    }
    return g;
  },
  overturnedTrolley(k) {
    const g = new THREE.Group();
    const body = mesh(boxGeo(0.9, 0.5, 1.2, 0.6), k.mat.steel, 0, 0.25, 0);
    body.rotation.x = 0.1;
    g.add(body);
    for (let i = 0; i < 2; i += 1) { const w = mesh(cylGeo(0.12, 0.12, 0.05, 8, 0.3), k.mat.rubber, -0.5, 0.35 + i * 0.3, (i - 0.5) * 0.7); w.rotation.z = Math.PI / 2; g.add(w); }
    return g;
  },
  desk(k, spec) {
    const len = spec.len || 1.4; const h = spec.h || 0.75;
    const g = new THREE.Group();
    g.add(mesh(boxGeo(len, 0.05, 0.7, 0.6), k.mat.wood, 0, h - 0.025, 0));
    for (const sx of [-1, 1]) g.add(mesh(boxGeo(0.4, h - 0.05, 0.62, 0.6), k.mat.steel, sx * (len / 2 - 0.22), (h - 0.05) / 2, 0));
    return g;
  },
  chair(k) {
    const g = new THREE.Group();
    g.add(mesh(boxGeo(0.44, 0.05, 0.44, 0.5), k.mat.steel, 0, 0.45, 0));
    g.add(mesh(boxGeo(0.44, 0.45, 0.05, 0.5), k.mat.steel, 0, 0.7, -0.2));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(boxGeo(0.04, 0.45, 0.04, 0.3), k.mat.steel, sx * 0.19, 0.225, sz * 0.19));
    return g;
  },
  noticeBoard(k) {
    const g = new THREE.Group();
    const b = mesh(quadGeo(1.2, 0.9, 1.0, { stretch: true }), k.mat.hessian, 0, 1.5, 0.03);
    g.add(b);
    g.add(mesh(boxGeo(1.26, 0.04, 0.04, 0.3), k.mat.wood, 0, 1.97, 0.02));
    g.add(mesh(boxGeo(1.26, 0.04, 0.04, 0.3), k.mat.wood, 0, 1.03, 0.02));
    return g;
  },
  canteenTable(k, spec) {
    const len = spec.len || 1.6; const h = spec.h || 0.75;
    const g = new THREE.Group();
    g.add(mesh(boxGeo(len, 0.05, 0.8, 0.6), k.mat.wood, 0, h - 0.025, 0));
    for (const sx of [-1, 1]) g.add(mesh(boxGeo(0.06, h - 0.05, 0.7, 0.4), k.mat.steel, sx * (len / 2 - 0.2), (h - 0.05) / 2, 0));
    return g;
  },
  vendingMachine(k) {
    const g = new THREE.Group();
    g.add(mesh(boxGeo(0.8, 1.9, 0.7, 0.7), k.mat.steel, 0, 0.95, 0));
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.0), new THREE.MeshBasicMaterial({ color: 0x1d2a2a, fog: true }));
    pane.position.set(-0.1, 1.15, 0.351);
    g.add(pane);
    return g;
  },
  urn(k) {
    const g = new THREE.Group();
    g.add(mesh(cylGeo(0.22, 0.25, 0.6, 8, 0.5), k.mat.steel, 0, 0.3, 0));
    g.add(mesh(cylGeo(0.05, 0.05, 0.1, 6, 0.3), k.mat.brass, 0, 0.65, 0));
    return g;
  },
  bunk(k, spec) {
    const len = spec.len || 1.9;
    const g = new THREE.Group();
    g.add(mesh(boxGeo(len, 0.08, 0.85, 0.6), k.mat.steel, 0, 0.5, 0));
    g.add(mesh(boxGeo(len - 0.1, 0.16, 0.78, 0.6), k.mat.hessian, 0, 0.62, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(boxGeo(0.05, 0.5, 0.05, 0.3), k.mat.steel, sx * (len / 2 - 0.05), 0.25, sz * 0.4));
    return g;
  },
  ivStand(k) {
    const g = new THREE.Group();
    g.add(mesh(cylGeo(0.02, 0.02, 1.7, 6, 0.3), k.mat.steel, 0, 0.85, 0));
    g.add(mesh(cylGeo(0.25, 0.25, 0.03, 8, 0.3), k.mat.steel, 0, 0.015, 0));
    g.add(mesh(boxGeo(0.14, 0.24, 0.06, 0.3), k.mat.vinyl, 0.12, 1.5, 0));
    return g;
  },
  generator(k, spec) {
    const h = spec.h || 1.4;
    const g = new THREE.Group();
    g.add(mesh(boxGeo(1.5, h * 0.7, 0.9, 0.7), k.mat.rust, 0, h * 0.35, 0));
    const drum = mesh(cylGeo(0.3, 0.3, 1.2, 8, 0.5), k.mat.steel, 0, h * 0.7 + 0.28, 0);
    drum.rotation.z = Math.PI / 2;
    g.add(drum);
    g.add(mesh(boxGeo(0.5, 0.4, 0.4, 0.4), k.mat.steel, 0.4, h * 0.7 + 0.2, -0.3));
    return g;
  },
  toolBench(k, spec) {
    const len = spec.len || 1.6; const h = spec.h || 0.9;
    const g = new THREE.Group();
    g.add(mesh(boxGeo(len, 0.08, 0.7, 0.6), k.mat.wood, 0, h - 0.04, 0));
    for (const sx of [-1, 1]) g.add(mesh(boxGeo(0.08, h - 0.08, 0.6, 0.4), k.mat.steel, sx * (len / 2 - 0.1), (h - 0.08) / 2, 0));
    g.add(mesh(boxGeo(0.5, 0.1, 0.3, 0.4), k.mat.steel, -0.3, h + 0.05, 0));
    return g;
  },
  freezerRack(k, spec) {
    const len = spec.len || 1.8; const h = spec.h || 2.0;
    const g = new THREE.Group();
    for (const y of [0.3, 0.9, 1.5]) g.add(mesh(boxGeo(len, 0.05, 0.6, 0.6), k.mat.steel, 0, y, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(boxGeo(0.05, h, 0.05, 0.3), k.mat.steel, sx * (len / 2 - 0.05), h / 2, sz * 0.28));
    g.add(mesh(boxGeo(0.5, 0.3, 0.4, 0.4), k.mat.hide, -0.3, 1.07, 0));
    g.add(mesh(boxGeo(0.4, 0.25, 0.35, 0.4), k.mat.hide, 0.4, 0.44, 0.05));
    return g;
  },
};


export const PROP_NAMES = Object.freeze([...Object.keys(SIMPLE), ...Object.keys(BUILDERS)]);






export function buildProp(name, spec, kit) {
  if (BUILDERS[name]) return BUILDERS[name](kit, spec || {});
  const s = SIMPLE[name];
  if (s === null) return BUILDERS.barrel(kit, spec || {});
  if (!s) return BUILDERS.barrel(kit, spec || {});
  const [material, w0, h0, d0, tile] = s;
  const w = spec && spec.len ? spec.len : w0;
  const h = spec && spec.h ? spec.h : h0;
  const g = new THREE.Group();
  g.add(mesh(boxGeo(w, h, d0, tile), kit.mat[material], 0, h / 2, 0));
  return g;
}
