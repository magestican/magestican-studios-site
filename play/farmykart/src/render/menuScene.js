










































import * as THREE from 'three';

import { surface, paintedSurface, applyShadows } from './materials.js';
import { buildSky, buildLights, fogFor, sunDirFor } from './world.js';
import { PALETTE } from '../palette.js';
import { STAGE, yardPlacements, subjectShiftMetres } from '../../../../web-engine/kart/menuStage.js';




const THEME = 'summer';




const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const CONE = new THREE.ConeGeometry(0.5, 1, 9);
const DISC = new THREE.CircleGeometry(1, 48);

const box = (mat, sx, sy, sz, x, y, z, ry = 0) => {
  const m = new THREE.Mesh(BOX, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  return m;
};

function buildBarn(mats) {
  const g = new THREE.Group();
  
  
  g.add(box(mats.barn, 7.4, 4.6, 5.2, 0, 2.3, 0));
  for (const s of [1, -1]) {
    const roof = box(mats.roof, 4.35, 0.22, 5.6, s * 1.86, 5.36, 0);
    roof.rotation.z = s * -0.62;
    g.add(roof);
  }
  
  g.add(box(mats.barn, 0.30, 1.7, 5.2, 0, 5.3, 0));
  
  g.add(box(mats.trim, 2.5, 3.0, 0.16, 0, 1.5, 2.66));
  g.add(box(mats.trim, 0.18, 3.0, 0.16, 0, 1.5, 2.70));
  g.add(box(mats.dark, 1.15, 1.15, 0.16, 0, 4.35, 2.66));
  return g;
}

function buildSilo(mats) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(CYL, mats.silo);
  body.scale.set(3.2, 8.2, 3.2);
  body.position.y = 4.1;
  g.add(body);
  const cap = new THREE.Mesh(CONE, mats.roof);
  cap.scale.set(3.5, 1.9, 3.5);
  cap.position.y = 9.15;
  g.add(cap);
  
  for (const y of [2.6, 5.6]) {
    const hoop = new THREE.Mesh(CYL, mats.trim);
    hoop.scale.set(3.28, 0.18, 3.28);
    hoop.position.y = y;
    g.add(hoop);
  }
  return g;
}

function buildTree(mats) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(CYL, mats.trunk);
  trunk.scale.set(0.44, 2.6, 0.44);
  trunk.position.y = 1.3;
  g.add(trunk);
  
  
  const clumps = [[0, 3.5, 0, 2.5], [0.9, 3.0, 0.5, 1.9], [-0.8, 3.2, -0.6, 1.7]];
  for (const [x, y, z, r] of clumps) {
    const c = new THREE.Mesh(CONE, mats.leaf);
    c.scale.set(r, r * 1.5, r);
    c.position.set(x, y, z);
    g.add(c);
  }
  return g;
}

function buildBale(mats) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(CYL, mats.hay);
  b.scale.set(1.5, 1.7, 1.5);
  
  
  b.rotation.z = Math.PI / 2;
  b.position.y = 0.75;
  g.add(b);
  return g;
}

function buildFence(mats, radius) {
  const g = new THREE.Group();
  
  
  const posts = 40;
  for (let i = 0; i < posts; i += 1) {
    const a = (i / posts) * Math.PI * 2;
    
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.42) continue;
    const x = Math.sin(a) * radius;
    const z = Math.cos(a) * radius;
    g.add(box(mats.trunk, 0.16, 1.15, 0.16, x, 0.575, z, a));
    for (const y of [0.44, 0.86]) {
      const next = ((i + 1) / posts) * Math.PI * 2;
      const rail = box(mats.trunk, 0.09, 0.10, radius * (Math.PI * 2) / posts * 1.06,
        (x + Math.sin(next) * radius) / 2, y, (z + Math.cos(next) * radius) / 2, a);
      g.add(rail);
    }
  }
  return g;
}

function buildPlinth(mats) {
  const g = new THREE.Group();
  
  
  
  
  
  
  
  const pad = new THREE.Mesh(DISC, mats.dirt);
  pad.rotation.x = -Math.PI / 2;
  pad.scale.set(1.45, 1.45, 1);
  pad.position.y = STAGE.plinthY + 0.005;
  g.add(pad);
  const kerb = new THREE.Mesh(CYL, mats.trunk);
  kerb.scale.set(3.0, STAGE.plinthY, 3.0);
  kerb.position.y = STAGE.plinthY / 2;
  g.add(kerb);
  return g;
}







export function buildMenuScene() {
  const group = new THREE.Group();
  group.name = 'menu-yard';

  const mats = {
    grass: surface({ color: PALETTE.grass ?? 0x5c7f3a, roughness: 0.95, flatShading: true }),
    dirt: surface({ color: PALETTE.roadLight ?? 0x87735a, roughness: 0.95, flatShading: true }),
    barn: paintedSurface({ color: 0xa8412f, flatShading: true }),
    roof: paintedSurface({ color: 0x4a4640, flatShading: true }),
    silo: paintedSurface({ color: 0xd8d2c2, flatShading: true }),
    trim: paintedSurface({ color: 0xf1ead9, flatShading: true }),
    dark: paintedSurface({ color: 0x2a2118, flatShading: true }),
    trunk: surface({ color: 0x6b4c2f, roughness: 0.9, flatShading: true }),
    leaf: surface({ color: 0x3f6b2c, roughness: 0.95, flatShading: true }),
    hay: surface({ color: PALETTE.hay ?? 0xd9b04a, roughness: 0.9, flatShading: true }),
  };

  
  
  
  const ground = new THREE.Mesh(DISC, mats.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.scale.set(260, 260, 1);
  group.add(ground);
  applyShadows(ground, 'ground');

  const plinth = buildPlinth(mats);
  applyShadows(plinth, 'ground');
  group.add(plinth);

  const builders = {
    barn: () => buildBarn(mats),
    silo: () => buildSilo(mats),
    tree: () => buildTree(mats),
    bale: () => buildBale(mats),
    fence: () => buildFence(mats, 9.5),
  };
  
  
  
  
  
  
  
  const ROLE = {
    barn: 'barn', silo: 'silo', tree: 'tree', bale: 'bale', fence: 'fencePost',
  };
  for (const p of yardPlacements()) {
    const make = builders[p.kind];
    if (!make) continue;
    const m = make();
    if (p.kind !== 'fence') {
      m.position.set(p.x, 0, p.z);
      m.scale.multiplyScalar(p.scale);
      
      
      m.rotation.y = Math.atan2(p.x, p.z) + Math.PI;
    }
    applyShadows(m, ROLE[p.kind]);
    group.add(m);
  }

  const sunDir = sunDirFor(THEME);
  const sky = buildSky(THEME, sunDir);
  const lights = buildLights(THEME);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const sun = lights.userData && lights.userData.sun;
  if (sun && sun.shadow) {
    sun.shadow.mapSize.set(1024, 1024);
    const c = sun.shadow.camera;
    c.left = -15; c.right = 15; c.top = 15; c.bottom = -15;
    c.near = 1; c.far = 90;
    c.updateProjectionMatrix();
  }

  return {
    group,
    sky,
    lights,
    fog: fogFor(THEME),
    






    layout(w, h) {
      group.position.x = subjectShiftMetres(w, h);
    },
  };
}
