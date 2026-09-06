










































































import { tubeAlong } from '../../ps1/ps1Mesh.mjs';
import { box, meshByColour, partsBounds } from './unitMeshes.js';
import { BUILDINGS, HERD, YIELD } from '../roster.js';

export { box, meshByColour, partsBounds };






const STRAIGHT = [[0.00, 1.00, 1.00], [1.00, 1.00, 1.00]];

const TAPER = [[0.00, 1.00, 1.00], [1.00, 0.66, 0.66]];

const STEM = [[0.00, 1.00, 1.00], [1.00, 0.22, 0.22]];

const CONE = [[0.00, 1.00, 1.00], [1.00, 0.05, 0.05]];

const DOME = [[0.00, 1.00, 1.00], [0.42, 0.97, 0.97], [0.74, 0.78, 0.78],
  [0.92, 0.46, 0.46], [1.00, 0.05, 0.05]];

const BARREL = [[0.00, 1.00, 1.00], [0.30, 0.80, 0.80], [0.72, 0.72, 0.72],
  [1.00, 0.86, 0.86]];









const tube = (a, b, w, d, profile = STRAIGHT, sides = 6) => tubeAlong(a, b, {
  w, d, sides, profile,
});


const post = (a, b, r, profile = STRAIGHT, sides = 6) => tube(a, b, r * 2, r * 2, profile, sides);









const strut = (a, b, r) => tubeAlong(a, b, {
  w: r * 2.83, d: r * 2.83, sides: 4, roll: Math.PI / 4, profile: STRAIGHT,
});












function gable(x0, x1, y, ridgeZ, span, rise) {
  
  
  
  
  
  
  
  
  
  
  
  
  
  return tubeAlong([x0, y, ridgeZ - rise], [x1, y, ridgeZ - rise], {
    w: rise * 2, d: span, sides: 4, profile: STRAIGHT,
  });
}

const part = (mesh, colour) => ({ mesh, colour });




















export const primitives = { tube, post, strut, gable, STRAIGHT, TAPER, CONE, DOME };









const Y_SHEET = '#b0b6c0';
const Y_ROOF = '#7d858f';
const Y_STEEL = '#8b949f';
const Y_ACCENT = '#f4842c';
const Y_DARK = '#39424e';
const Y_GLASS = '#a8cbe6';
const Y_RUST = '#9c5f3c';
const Y_CONCRETE = '#c2bfb2';

const H_BARK = '#6b4f34';
const H_BARK_DARK = '#4c3823';
const H_LEAF = '#4f8f3a';
const H_LEAF_DARK = '#39702a';
const H_MUD = '#7d6242';
const H_MUD_DARK = '#5b452e';
const H_STONE = '#8d887a';
const H_REED = '#93b04d';






const H_GRASS = '#7d9c42';
const H_HOLE = '#221a12';














function tree(x, y, h, spread, opts = {}) {
  const bark = opts.bark || H_BARK;
  const leaf = opts.leaf || H_LEAF;
  const trunkR = spread * 0.085;
  const parts = [
    part(post([x, y, 0], [x, y, h * 0.58], trunkR, TAPER), bark),
    part(tube([x, y, h * 0.38], [x, y, h], spread, spread, DOME, 7), leaf),
  ];
  if (opts.lobe !== false) {
    parts.push(part(tube(
      [x + spread * 0.20, y - spread * 0.16, h * 0.30],
      [x + spread * 0.20, y - spread * 0.16, h * 0.78],
      spread * 0.68, spread * 0.68, DOME, 6,
    ), opts.leaf2 || H_LEAF_DARK));
  }
  return parts;
}


const mound = (x, y, r, h, colour, sides = 8) => part(
  tube([x, y, 0], [x, y, h], r * 2, r * 2, DOME, sides), colour,
);


const stone = (x, y, z, r, colour = H_STONE) => part(
  tube([x, y, z], [x, y, z + r * 1.4], r * 2, r * 1.7, DOME, 5), colour,
);


const panel = (centre, size, colour = Y_SHEET) => part(box(centre, size), colour);













function watchtower() {
  const DECK = 4.40;     
  const CABIN = 1.00;    
  const RIDGE = 6.00;    
  const BASE = 1.55;
  const TOP = 0.92;
  const parts = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      
      
      
      
      parts.push(part(strut([sx * BASE, sy * BASE, 0.04], [sx * TOP, sy * TOP, DECK], 0.10),
        Y_STEEL));
    }
  }
  
  
  for (const sy of [-1, 1]) {
    parts.push(part(strut([-BASE, sy * BASE, 0.3], [TOP, sy * TOP, DECK * 0.92], 0.05), Y_STEEL));
  }
  parts.push(panel([0, 0, DECK + 0.08], [TOP * 2.5, TOP * 2.5, 0.16], Y_CONCRETE));
  
  parts.push(panel([0, 0, DECK + 0.16 + CABIN / 2], [TOP * 2.1, TOP * 2.1, CABIN], Y_SHEET));
  parts.push(panel([0, 0, DECK + 0.16 + CABIN * 0.66], [TOP * 2.16, TOP * 2.16, 0.34], Y_GLASS));
  parts.push(part(gable(-TOP * 1.35, TOP * 1.35, 0, RIDGE, TOP * 2.7, 0.5), Y_ROOF));
  
  parts.push(part(post([TOP * 0.5, 0, DECK + 0.75], [TOP * 3.1, 0, DECK + 0.62], 0.10, TAPER, 5),
    Y_DARK));
  
  
  parts.push(panel([0, 0, RIDGE + 0.12], [0.3, 0.3, 0.24], Y_ACCENT));
  return parts;
}









function pesticideBattery() {
  const parts = [
    panel([0, 0, 0.28], [3.0, 2.6, 0.56], Y_CONCRETE),
    panel([-0.35, 0, 1.0], [1.9, 2.0, 1.0], Y_SHEET),
    part(post([-0.9, 0, 1.5], [-0.9, 0, 2.5], 0.44, BARREL, 8), Y_ACCENT),
    part(post([-0.9, 0, 2.5], [-0.9, 0, 2.72], 0.30, CONE, 8), Y_DARK),
  ];
  
  
  
  
  
  
  
  for (let i = 0; i < 4; i += 1) {
    const y = (i - 1.5) * 0.42;
    const spread = (i - 1.5) * 0.62;
    parts.push(part(post([0.15, y, 1.35], [2.55, y + spread, 2.30], 0.145, STRAIGHT, 5), Y_DARK));
    parts.push(part(post([2.55, y + spread, 2.30], [2.85, y + spread * 1.12, 2.42],
      0.11, CONE, 5), Y_ACCENT));
  }
  parts.push(panel([0.2, 0, 1.2], [0.34, 2.1, 0.34], Y_STEEL));
  return parts;
}










function electricFence() {
  
  
  
  
  
  
  
  
  
  const L = 5.4;
  const H = 2.1;
  const parts = [];
  for (const x of [-L / 2, 0, L / 2]) {
    parts.push(part(strut([x, 0, 0], [x, 0, H], 0.10), Y_STEEL));
    parts.push(part(box([x, 0, H], [0.30, 0.34, 0.12]), Y_DARK));
  }
  for (let i = 0; i < 4; i += 1) {
    const z = 0.55 + i * 0.46;
    parts.push(part(post([-L / 2, 0, z], [L / 2, 0, z], 0.035, STRAIGHT, 4), Y_DARK));
  }
  parts.push(panel([0, 0.14, 1.45], [0.52, 0.06, 0.42], Y_ACCENT));
  return parts;
}









function shed(o) {
  const { len = 7.0, wid = 5.0, wall = 2.5, rise = 1.15 } = o;
  const parts = [
    panel([0, 0, wall / 2], [len, wid, wall], o.body || Y_SHEET),
    part(gable(-len / 2 - 0.25, len / 2 + 0.25, 0, wall + rise, wid + 0.5, rise), o.roof || Y_ROOF),
    
    panel([-len * 0.28, 0, wall / 2], [0.12, wid + 0.06, wall * 0.98], Y_STEEL),
    panel([0, 0, wall / 2], [0.12, wid + 0.06, wall * 0.98], Y_STEEL),
    panel([len * 0.28, 0, wall / 2], [0.12, wid + 0.06, wall * 0.98], Y_STEEL),
    
    panel([len / 2 + 0.03, 0, wall * 0.42], [0.10, wid * 0.52, wall * 0.80], Y_DARK),
    panel([len / 2 + 0.06, 0, wall * 0.83], [0.14, wid * 0.56, 0.16], Y_ACCENT),
  ];
  if (o.vent) {
    parts.push(part(post([-len * 0.2, 0, wall + rise], [-len * 0.2, 0, wall + rise + 0.5], 0.22,
      STRAIGHT, 6), Y_STEEL));
    parts.push(part(post([-len * 0.2, 0, wall + rise + 0.5], [-len * 0.2, 0, wall + rise + 0.72],
      0.30, CONE, 6), Y_DARK));
  }
  return parts;
}

const machineShed = () => shed({ len: 7.0, wid: 5.2, wall: 2.6, rise: 1.2, vent: true });








function pumpStation() {
  const parts = shed({ len: 3.6, wid: 3.2, wall: 2.2, rise: 0.85, body: Y_SHEET });
  parts.push(part(post([1.9, 0, 1.1], [4.6, 0, 0.55], 0.42, STRAIGHT, 8), Y_STEEL));
  parts.push(part(post([4.6, 0, 0.55], [5.5, 0, 0.46], 0.42, STRAIGHT, 8), Y_STEEL));
  parts.push(part(post([4.6, 0, 0.55], [4.6, 0, 1.55], 0.16, STRAIGHT, 6), Y_ACCENT));
  
  
  parts.push(part(post([4.6, 0, 1.55], [4.6, 0, 1.70], 0.42, STRAIGHT, 8), Y_ACCENT));
  parts.push(part(post([-1.1, 0, 3.05], [-1.1, 0, 4.3], 0.26, STRAIGHT, 6), Y_RUST));
  parts.push(part(post([-1.1, 0, 4.3], [-1.1, 0, 4.55], 0.34, CONE, 6), Y_DARK));
  return parts;
}








function processingPlant() {
  const parts = shed({ len: 7.6, wid: 5.6, wall: 3.2, rise: 1.4, body: Y_CONCRETE, roof: Y_ROOF });
  
  
  
  
  for (const y of [-2.2, 2.2]) {
    parts.push(part(post([-5.6, y, 0], [-5.6, y, 5.8], 1.15, STRAIGHT, 8), Y_SHEET));
    parts.push(part(post([-5.6, y, 5.8], [-5.6, y, 6.8], 1.15, CONE, 8), Y_ROOF));
    parts.push(part(post([-5.6, y, 2.6], [-5.6, y, 2.9], 1.22, STRAIGHT, 8), Y_ACCENT));
  }
  
  parts.push(part(strut([4.6, 0, 0.5], [1.2, 0, 4.4], 0.34), Y_STEEL));
  parts.push(part(strut([4.6, 0, 0.1], [4.6, 0, 1.1], 0.12), Y_STEEL));
  parts.push(part(box([4.9, 0, 0.55], [1.5, 2.0, 1.1]), Y_ACCENT));
  parts.push(part(post([-1.0, 0, 4.6], [-1.0, 0, 8.2], 0.40, STRAIGHT, 7), Y_STEEL));
  parts.push(part(post([-1.0, 0, 8.2], [-1.0, 0, 8.55], 0.52, STRAIGHT, 7), Y_DARK));
  return parts;
}









function haven() {
  
  
  
  
  
  
  
  
  
  
  return [
    mound(0, 0, 3.4, 0.40, H_MUD),
    ...tree(1.8, 0.9, 4.7, 2.2),
    ...tree(-2.0, -1.3, 3.5, 1.8, { leaf: H_LEAF_DARK, leaf2: H_LEAF }),
    ...tree(-0.5, 2.3, 2.9, 1.5, { lobe: false }),
    stone(2.2, -1.9, 0.25, 0.34),
    stone(-2.4, 1.9, 0.22, 0.26),
  ];
}










function greatTree() {
  const parts = [
    mound(0, 0, 2.2, 0.35, H_MUD_DARK),
    part(post([0, 0, 0], [0, 0, 4.4], 0.62, BARREL, 7), H_BARK),
  ];
  
  
  for (let i = 0; i < 3; i += 1) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    parts.push(part(post([0, 0, 1.5], [Math.cos(a) * 1.7, Math.sin(a) * 1.7, 0.22], 0.30, TAPER, 5),
      H_BARK_DARK));
  }
  
  
  
  
  
  
  
  parts.push(part(tube([0, 0, 4.6], [0, 0, 8.4], 4.6, 4.6, DOME, 8), H_LEAF));
  parts.push(part(tube([1.1, -0.9, 4.1], [1.1, -0.9, 6.9], 3.0, 3.0, DOME, 7), H_LEAF_DARK));
  
  
  
  
  
  parts.push(part(post([0.2, 0, 4.3], [2.6, -0.4, 4.9], 0.22, TAPER, 5), H_BARK));
  parts.push(stone(2.2, -0.35, 4.75, 0.30));
  parts.push(stone(2.55, -0.4, 4.85, 0.24));
  parts.push(stone(-1.5, 0.9, 0.30, 0.42));
  parts.push(stone(-1.0, 1.5, 0.30, 0.30));
  parts.push(stone(-1.7, 0.3, 0.30, 0.26));
  return parts;
}








function mudWall() {
  
  
  const parts = [];
  const R = [0.95, 1.15, 1.30, 1.10, 0.90];
  const HGT = [1.15, 1.45, 1.70, 1.40, 1.10];
  for (let i = 0; i < 5; i += 1) {
    parts.push(mound((i - 2) * 1.15, 0, R[i], HGT[i], i % 2 ? H_MUD : H_MUD_DARK, 6));
  }
  parts.push(stone(-1.4, 0.5, 0.25, 0.34));
  parts.push(stone(1.6, -0.45, 0.30, 0.28));
  
  
  parts.push(part(post([-0.4, -0.5, 0.6], [-0.2, 0.7, 2.3], 0.10, TAPER, 4), H_BARK_DARK));
  parts.push(part(post([1.0, 0.5, 0.6], [1.2, -0.6, 2.1], 0.09, TAPER, 4), H_BARK_DARK));
  return parts;
}










function sanctuary() {
  
  
  
  
  
  
  
  const parts = [
    mound(-1.9, 0, 3.2, 2.5, H_MUD),
    part(post([3.6, -2.6, 0.06], [3.0, -2.1, 5.0], 0.42, TAPER, 6), H_BARK),
    part(post([3.6, 2.6, 0.06], [3.0, 2.1, 5.0], 0.42, TAPER, 6), H_BARK),
    part(post([3.0, -2.7, 4.85], [3.0, 2.7, 4.85], 0.36, STRAIGHT, 5), H_BARK_DARK),
    
    stone(3.4, 0, 0.0, 0.30),
    part(post([3.4, 0, 0.25], [3.4, 0, 1.15], 0.36, CONE, 5), '#e0873a'),
  ];
  parts.push(...tree(-2.6, -1.9, 4.6, 2.9, { leaf: H_LEAF_DARK, leaf2: H_LEAF }));
  parts.push(...tree(-2.2, 2.1, 3.9, 2.4));
  parts.push(stone(0.2, -2.8, 0.2, 0.44));
  parts.push(stone(0.0, 2.9, 0.2, 0.40));
  return parts;
}









function reedbed() {
  const parts = [mound(0, 0, 2.6, 0.42, H_MUD_DARK, 7)];
  
  
  
  for (let i = 0; i < 16; i += 1) {
    const a = i * 2.399;
    const r = 0.35 + (i / 16) * 2.1;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    const h = 1.7 + ((i * 7) % 5) * 0.34;
    parts.push(part(post([x, y, 0.2], [x + 0.12, y, 0.2 + h], 0.055, STEM, 4),
      i % 3 ? H_REED : H_GRASS));
    if (i % 4 === 0) {
      parts.push(part(post([x + 0.12, y, 0.2 + h], [x + 0.14, y, 0.2 + h + 0.34], 0.10, CONE, 4),
        '#c9b25e'));
    }
  }
  parts.push(part(tube([1.9, -1.6, 0.02], [1.9, -1.6, 0.10], 1.5, 1.2, STRAIGHT, 7), H_LEAF));
  parts.push(part(tube([-1.7, 1.9, 0.02], [-1.7, 1.9, 0.10], 1.2, 1.0, STRAIGHT, 7), H_LEAF_DARK));
  return parts;
}









function greatWarren() {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const parts = [
    mound(0, 0, 5.4, 2.2, H_GRASS, 9),
    mound(2.6, -2.4, 2.4, 1.2, H_LEAF_DARK, 7),
    mound(-2.9, 2.5, 2.1, 1.0, H_LEAF_DARK, 7),
  ];
  const MOUTH = [[5.4, 0.4], [-2.9, -5.0], [-3.1, 4.8]];
  for (const [mx, my] of MOUTH) {
    const a = Math.atan2(my, mx);
    
    
    parts.push(part(tube([mx, my, 0], [mx, my, 1.9], 3.0, 3.0, DOME, 7), H_MUD));
    
    parts.push(part(tube(
      [mx + Math.cos(a) * 1.15, my + Math.sin(a) * 1.15, 0.72],
      [mx - Math.cos(a) * 0.55, my - Math.sin(a) * 0.55, 0.72],
      1.42, 1.42, STRAIGHT, 6,
    ), H_HOLE));
    parts.push(part(tube([mx, my, 0], [mx, my, 0.16], 3.1, 3.1, STRAIGHT, 7), H_MUD_DARK));
  }
  
  
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + 0.6;
    parts.push(part(post([0, 0, 2.8], [Math.cos(a) * 3.4, Math.sin(a) * 3.4, 0.5], 0.26, TAPER, 5),
      H_BARK_DARK));
  }
  parts.push(part(post([0, 0, 2.6], [0, 0, 4.6], 0.55, TAPER, 6), H_BARK));
  parts.push(part(tube([0, 0, 4.1], [0, 0, 7.2], 3.4, 3.4, DOME, 8), H_LEAF));
  parts.push(stone(3.2, 2.8, 0.1, 0.5));
  parts.push(stone(-3.6, -1.7, 0.1, 0.42));
  return parts;
}














export const BUILDING_MESHES = Object.freeze({
  electricFence,
  greatTree,
  greatWarren,
  haven,
  machineShed,
  mudWall,
  pesticideBattery,
  processingPlant,
  pumpStation,
  reedbed,
  sanctuary,
  watchtower,
});


export const BUILDING_MESH_IDS = Object.freeze(Object.keys(BUILDING_MESHES).sort());








export function buildBuildingMesh(id) {
  const make = BUILDING_MESHES[id];
  if (!make) throw new Error(`no mesh for building '${id}'`);
  return make();
}


export const factionOf = (id) => (BUILDINGS[id] ? BUILDINGS[id].faction : null);

export { HERD, YIELD };
