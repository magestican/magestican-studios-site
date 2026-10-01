





















































import { MeshData, compose, translate, rotateY } from '../mesh/meshData.mjs';
import { emit, bend, sweep, lathe, blob, deform, circleProfile, smoothstep } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { valueNoise3 } from '../noise.mjs';
import { hex, vc, scaleC, mixC, paintVertex } from './kit/shade.mjs';
import { wallPanel, plinth } from './kit/wall.mjs';
import { cornerPost } from './kit/post.mjs';
import { door as doorUnit } from './kit/door.mjs';
import { windowUnit } from './kit/window.mjs';
import { gableRoof, awning } from './kit/roof.mjs';
import { chimney } from './kit/chimney.mjs';
import { flowerBox, steppingStone } from './kit/flowerBox.mjs';
import { slatCrate, stovePipe } from './kit/workshop.mjs';
import { levelOf, round3 } from './kit/plan.mjs';
import { rod } from './kit/rod.mjs';
import { postLantern, wallLantern } from './kit/lantern.mjs';
import { flowerPot } from './kit/flowerPot.mjs';
import { flowerBed } from './kit/flowerBed.mjs';
import { footpath } from './kit/footpath.mjs';
import { bench } from './kit/bench.mjs';
import { birdBath } from './kit/birdBath.mjs';
import { hedge, picketFence } from './kit/gardenEdge.mjs';
import { wreath, bunting, doormat } from './kit/homeDecor.mjs';
import { timberFrame, scaffold, plankStack } from './kit/buildingSite.mjs';

export const TIER = 'house';
export const STAGES = Object.freeze(['building', 'house', 'decorated', 'garden', 'upstairs']);
export const SPECIES = Object.freeze(['elephant', 'giraffe', 'panda', 'human', 'pig']);
export const LODS = Object.freeze([0, 1, 2]);
export const DEFAULT_PROGRESS = 0.65;

const BASE = 0.3;



const BODY = Object.freeze({
  human: { W: 3.0, D: 2.4, wallH: 1.9, rise: 1.0, ridge: 'x', overhang: 0.32, sag: 0.1, thickness: 0.24, rows: 4, door: { w: 0.84, h: 1.62 } },
  pig: { W: 2.7, D: 2.35, wallH: 1.55, rise: 1.1, ridge: 'z', overhang: 0.3, sag: 0.07, thickness: 0.26, rows: 4, door: { w: 0.78, h: 1.36 } },
  
  panda: { W: 3.2, D: 2.7, wallH: 1.5, rise: 0.9, ridge: 'x', overhang: 0.38, sag: 0.14, thickness: 0.3, rows: 4, door: { w: 0.92, h: 1.25 }, curl: 0.42 },
  elephant: { W: 3.6, D: 2.6, wallH: 2.05, rise: 1.15, ridge: 'x', overhang: 0.36, sag: 0.12, thickness: 0.26, rows: 4, door: { w: 1.24, h: 1.75 } },
  giraffe: { W: 2.7, D: 2.4, wallH: 2.55, rise: 1.3, ridge: 'z', overhang: 0.3, sag: 0.08, thickness: 0.24, rows: 4, door: { w: 0.8, h: 2.1 } },
});

const STYLES = Object.freeze({
  human: [
    { wall: '#f7dba0', roof: '#5d82c9', trim: '#fff4e0', door: '#c95a42', knob: '#e0b44e', side: 1, window: 'single', bench: '#d6a468', mat: '#b3845a', fence: '#fff4e0' },
    { wall: '#bcd8f0', roof: '#e0674e', trim: '#fff4e0', door: '#3f9e8e', knob: '#e0b44e', side: -1, window: 'shutters', bench: '#7fb7d8', mat: '#c9955f', fence: '#f6e7c8' },
    { wall: '#f5e2b0', roof: '#6fae6b', trim: '#b3845a', door: '#8a6cc0', knob: '#6b4a3a', side: 1, window: 'wide', bench: '#e6b84a', mat: '#a8784e', fence: '#d9b98a' },
  ],
  pig: [
    { wall: '#f7c7b8', roof: '#c95a72', trim: '#fff4e0', door: '#e6b84a', knob: '#6b4a3a', side: 1, bunting: ['#f7a8c4', '#fff1d6', '#f6d05b'], mat: '#c9955f', porthole: false },
    { wall: '#f5e2b0', roof: '#e886a9', trim: '#fff4e0', door: '#6a7fd0', knob: '#e0b44e', side: -1, bunting: ['#e886a9', '#9fd0dc', '#fff1d6'], mat: '#b3845a', porthole: false },
    { wall: '#fbd9c9', roof: '#8a6cc0', trim: '#b3845a', door: '#e0674e', knob: '#e0b44e', side: 1, bunting: ['#f6c453', '#e0674e', '#bfe0a8'], mat: '#a8784e', porthole: true },
  ],
  
  panda: [
    { wall: '#f6efe0', roof: '#4f5170', trim: '#fff4e0', door: '#7a6a8e', knob: '#e0b44e', side: 1, lantern: '#f28a6b', mat: '#b3845a', porthole: true },
    { wall: '#f3e6cf', roof: '#5b4f6e', trim: '#fff4e0', door: '#c95a42', knob: '#e0b44e', side: -1, lantern: '#f6c453', mat: '#a8784e', porthole: false },
    { wall: '#e8eef2', roof: '#3f6f5e', trim: '#fff4e0', door: '#5d82c9', knob: '#e6b84a', side: 1, lantern: '#e886a9', mat: '#c9955f', porthole: true },
  ],
  
  elephant: [
    { wall: '#c9c6de', roof: '#e6a13e', trim: '#fff4e0', door: '#3f9e8e', knob: '#e0b44e', side: 1, mat: '#a8784e', porthole: false },
    { wall: '#bcc3d6', roof: '#e0674e', trim: '#fff4e0', door: '#e6b84a', knob: '#6b4a3a', side: -1, mat: '#b3845a', porthole: true },
    { wall: '#d4cbe0', roof: '#5d82c9', trim: '#b3845a', door: '#c95a42', knob: '#e0b44e', side: 1, mat: '#c9955f', porthole: false },
  ],
  
  giraffe: [
    { wall: '#f6d98f', patch: '#c07638', roof: '#3f9e8e', trim: '#fff4e0', door: '#8a5e3c', knob: '#e0b44e', side: 1, mat: '#a8784e', fence: '#fff4e0', porthole: false },
    { wall: '#f5e2b0', patch: '#b56c36', roof: '#8a6cc0', trim: '#fff4e0', door: '#3f9e8e', knob: '#e0b44e', side: -1, mat: '#b3845a', fence: '#f6e7c8', porthole: false },
    { wall: '#f7dba0', patch: '#a35f34', roof: '#e0674e', trim: '#b3845a', door: '#6a7fd0', knob: '#e6b84a', side: 1, mat: '#c9955f', fence: '#d9b98a', porthole: true },
  ],
});
const WALLS = ['#f7dba0', '#bcd8f0', '#f5e2b0', '#f7c7b8', '#bfe0a8', '#fbd9c9'];
const ROOFS = ['#5d82c9', '#e0674e', '#6fae6b', '#c95a72', '#8a6cc0', '#e6a13e'];
const DOORS = ['#c95a42', '#3f9e8e', '#8a6cc0', '#e6b84a', '#6a7fd0'];

function speciesOf(species) {
  if (!SPECIES.includes(species)) throw new Error(`unknown species '${species}' (species: ${SPECIES.join(', ')})`);
  return species;
}

function styleFor(species, seed) {
  const set = STYLES[species];
  if (seed >= 1 && seed <= 3) return set[seed - 1];
  const r = new SeededRng(seed).child(`homeStyle-${species}`);
  return { ...r.pick(set), wall: r.pick(WALLS), roof: r.pick(ROOFS), door: r.pick(DOORS), side: r.pick([-1, 1]) };
}


function layoutOf(species, st, B) {
  const s = st.side, top = BASE + B.wallH;
  if (species === 'human') {
    const windows = st.window === 'wide'
      ? [{ face: 'front', u: -s * 0.66, y: BASE + 1.1, w: 1.0, h: 0.7, box: true }]
      : [{ face: 'front', u: -s * 0.72, y: BASE + 1.08, w: 0.78, h: 0.76, box: true, shutters: st.window === 'shutters' }];
    windows.push({ face: s > 0 ? 'right' : 'left', u: s * 0.18, y: BASE + 1.12, w: 0.55, h: 0.62, small: true });
    windows.push({ face: s > 0 ? 'left' : 'right', u: -s * 0.3, y: BASE + 1.05, w: 0.5, h: 0.56, small: true, minor: true });
    return { doorX: s * 0.52, windows, chimney: { u: s * 0.75, v: -0.55 } };
  }
  if (species === 'panda') {
    return {
      doorX: s * 0.55,
      windows: [
        { face: 'front', u: -s * 0.8, y: BASE + 0.88, w: 0.74, kind: 'round', muntins: 'cross' },
        { face: s > 0 ? 'left' : 'right', u: 0.12, y: BASE + 0.82, w: 0.5, kind: 'round', muntins: 'none', small: true },
      ],
    };
  }
  if (species === 'elephant') {
    return {
      doorX: s * 0.5,
      windows: [
        { face: 'front', u: -s * 1.02, y: BASE + 1.2, w: 1.0, h: 0.72, box: true },
        { face: s > 0 ? 'left' : 'right', u: 0.15, y: BASE + 1.3, w: 0.62, kind: 'round', muntins: 'cross', small: true },
        { face: s > 0 ? 'right' : 'left', u: -0.35, y: BASE + 1.3, w: 0.5, kind: 'round', muntins: 'none', small: true, minor: true },
      ],
    };
  }
  if (species === 'giraffe') {
    return {
      doorX: -s * 0.3,
      windows: [
        { face: 'front', u: s * 0.78, y: BASE + 1.4, w: 0.5, h: 0.95, box: true },
        { face: 'front', u: s * 0.02, y: top + B.rise * 0.38, w: 0.56, kind: 'round', muntins: 'cross' },
        { face: s > 0 ? 'right' : 'left', u: 0.1, y: BASE + 2.0, w: 0.5, h: 0.62, small: true },
      ],
    };
  }
  
  return {
    doorX: -s * 0.28,
    windows: [
      { face: 'front', u: s * 0.74, y: BASE + 0.98, w: 0.48, h: 0.52, box: true },
      { face: 'front', u: s * 0.05, y: top + B.rise * 0.44, w: 0.5, kind: 'round', muntins: 'bar' },
      { face: s > 0 ? 'right' : 'left', u: 0.22, y: BASE + 0.95, w: 0.5, h: 0.52, small: true },
    ],
    pipe: { u: -0.35, v: -s * 0.72 },
  };
}



function propsFor(species, st, B, lay) {
  const s = st.side, W = B.W, fz = B.D / 2, dx = lay.doorX, top = BASE + B.wallH;
  const P = [];
  const add = (level, kind, o) => P.push({ level, kind, ...o });
  add(2, 'step', { x: dx, z: fz + 0.42, upto: 2 });
  add(3, 'windowBoxes', {});
  add(3, 'doormat', { x: dx, z: fz + 0.44, w: B.door.w + 0.08 });
  if (species === 'human') {
    add(2, 'mailbox', { x: dx + s * 0.58, z: fz + 1.42, block: 0.2 });
    add(3, 'wallLantern', { x: dx + s * (B.door.w / 2 + 0.3), y: BASE + B.door.h + 0.12, z: fz + 0.02 });
    add(3, 'wreath', { x: dx, y: BASE + B.door.h * 0.64, z: fz + 0.13 });
    add(3, 'bench', { x: -s * 0.86, z: fz + 0.74, rotY: -s * 0.06, w: 1.0, block: 0.5 });
    add(4, 'path', { x: dx, z: fz + 0.64, length: 1.1, stones: 2, size: 0.46, bendX: -s * 0.12 });
    add(4, 'fence', { x: s > 0 ? 1.02 : -2.62, z: fz + 1.6, length: 1.6, block: 0.8 });
    add(4, 'bed', { x: -s * (W / 2 + 0.5), z: fz + 0.16, rotY: s * 0.4, w: 1.0, d: 0.7, edge: 'wood', spires: false });
    add(4, 'pot', { x: dx - s * 0.64, z: fz + 0.45, r: 0.17, h: 0.24 });
    add(4, 'pot', { x: dx + s * 0.64, z: fz + 0.36, r: 0.13, h: 0.3, flare: 0.92 });
    add(4, 'birdBath', { x: -s * 2.15, z: fz + 1.32, block: 0.32 });
  } else if (species === 'pig') {
    add(2, 'tailVane', {});
    add(3, 'bunting', { from: [-W / 2 - 0.03, top + 0.15, fz + 0.17], to: [W / 2 + 0.03, top + 0.19, fz + 0.17], sag: 0.07, flags: 7 });
    add(3, 'lantern', { x: -s * 1.16, z: fz + 0.52, h: 1.3, block: 0.14 });
    add(3, 'trough', { x: s * (W / 2 + 0.3), z: 0.05, rotY: s * Math.PI / 2, w: 1.2 });
    add(3, 'pot', { x: dx + s * 0.62, z: fz + 0.38, r: 0.15, h: 0.22 });
    add(4, 'path', { x: dx, z: fz + 0.64, length: 1.15, stones: 3, size: 0.4, bendX: s * 0.18 });
    add(4, 'hedge', { x: -s * 1.95, z: fz + 1.42, rotY: s * 0.12, length: 1.6, block: 0.8 });
    add(4, 'bed', { x: s * 1.45, z: fz + 1.05, rotY: -s * 0.18, w: 1.15, d: 0.62 });
    add(4, 'pot', { x: s * (W / 2 + 0.3), z: fz + 0.45, r: 0.2, h: 0.2, flare: 1.1 });
    add(4, 'birdBath', { x: s * 2.25, z: -0.85, block: 0.32 });
  } else if (species === 'panda') {
    add(2, 'bamboo', { x: -s * (W / 2 + 0.55), z: -B.D / 2 + 0.45, block: 0.33 });
    add(3, 'paperLantern', { x: dx + s * (B.door.w / 2 + 0.34), y: top - 0.1, z: fz + 0.3, drop: 0.12, size: 1 });
    add(3, 'paperLantern', { x: -s * 0.2, y: top - 0.1, z: fz + 0.32, drop: 0.3, size: 0.8 });
    add(3, 'pot', { x: dx - s * 0.74, z: fz + 0.45, r: 0.16, h: 0.26 });
    add(3, 'pot', { x: dx + s * 0.7, z: fz + 0.38, r: 0.13, h: 0.2, flare: 1.12 });
    add(4, 'path', { x: dx, z: fz + 0.62, length: 1.0, stones: 3, size: 0.36, bendX: -s * 0.15 });
    add(4, 'bed', { x: -s * 1.05, z: fz + 0.95, rotY: s * 0.2, w: 1.1, d: 0.6 });
    add(4, 'hedge', { x: s * 2.25, z: 0.2, rotY: Math.PI / 2, length: 1.3, block: 0.65 });
    add(4, 'birdBath', { x: -s * 2.2, z: fz + 0.9, block: 0.32 });
  } else if (species === 'elephant') {
    add(2, 'barrel', { x: s * 2.32, z: 0.95, block: 0.32 });
    
    add(3, 'awning', { x: dx, y: BASE + B.door.h + 0.26, z: fz + 0.04, w: 1.75, depth: 0.72, color: 'door' });
    add(3, 'wallLantern', { x: dx + s * (B.door.w / 2 + 0.36), y: BASE + 1.5, z: fz + 0.02 });
    add(4, 'path', { x: dx, z: fz + 0.66, length: 1.0, stones: 2, size: 0.52, bendX: s * 0.1 });
    add(4, 'bed', { x: -s * 1.15, z: fz + 1.0, rotY: s * 0.12, w: 1.4, d: 0.6 });
    add(4, 'pot', { x: dx + s * 0.86, z: fz + 0.42, r: 0.18, h: 0.26 });
    add(4, 'birdBath', { x: -s * 2.45, z: 0.2, h: 0.92, bowl: 0.34, block: 0.36 });
  } else {
    add(2, 'ossicones', {});
    add(3, 'wallLantern', { x: dx - s * (B.door.w / 2 + 0.3), y: BASE + B.door.h + 0.12, z: fz + 0.02 });
    add(3, 'hangingPot', { x: s * 0.78, y: BASE + 2.4, z: fz + 0.02 });
    add(4, 'path', { x: dx, z: fz + 0.64, length: 1.1, stones: 3, size: 0.38, bendX: s * 0.16 });
    add(4, 'bed', { x: s * 1.3, z: fz + 1.0, rotY: -s * 0.2, w: 1.1, d: 0.58 });
    add(4, 'fence', { x: s > 0 ? -2.55 : 0.95, z: fz + 1.55, length: 1.6, block: 0.8 });
    add(4, 'birdBath', { x: -s * 2.15, z: 0.4, h: 0.98, bowl: 0.26, block: 0.3 });
  }
  return P;
}






export const STOREY_M = 1.3;






const UPSTAIRS_PLANK_M = 0.44;
const UPSTAIRS_LEVEL = STAGES.indexOf('upstairs') + 1;
function storeyUp(B, lay) {
  const top = BASE + B.wallH;
  
  
  
  const windows = lay.windows.map((w) => (w.y >= top - 0.05 ? { ...w, y: w.y + STOREY_M } : w));
  for (const w of lay.windows) if (w.y < top - 0.05 && !w.minor) windows.push({ ...w, y: w.y + STOREY_M, box: false, upper: true });
  return { B: { ...B, wallH: B.wallH + STOREY_M }, lay: { ...lay, windows } };
}

function plan(seed, species, stage = 'house') {
  speciesOf(species);
  const st = styleFor(species, seed);
  let B = BODY[species];
  let lay = layoutOf(species, st, B);
  
  const props = propsFor(species, st, B, lay);
  if (stage === 'upstairs') ({ B, lay } = storeyUp(B, lay));
  return { B, st, lay, props };
}

const roofMetrics = (B) => {
  const alongX = B.ridge === 'x';
  const halfSpan = alongX ? B.D / 2 : B.W / 2;
  const len = Math.hypot(halfSpan, B.rise);
  const topAt = (v) => B.rise * (1 - Math.abs(v) / halfSpan) + (B.thickness * len) / halfSpan;
  return { alongX, halfSpan, topAt, ridgeTop: BASE + B.wallH + topAt(0) + 0.1 };
};
















function smokeTop(species, B, lay) {
  const R = roofMetrics(B);
  
  
  
  const place = (u, y, v) => (R.alongX ? { x: u, y, z: v } : { x: v, y, z: -u });
  const wallTop = BASE + B.wallH;
  if (species === 'human') {
    const ch = lay.chimney, chD = 0.52, courseH = 0.3;
    const edge = Math.abs(ch.v) + chD / 2;
    const lowY = R.topAt(edge) - 0.28, stoneY = R.topAt(edge) - 0.05;
    const courses = Math.max(3, Math.ceil((B.rise + 0.35 - stoneY) / courseH));
    return place(ch.u, wallTop + lowY + (stoneY - lowY) + courses * courseH + 0.06, ch.v);
  }
  if (species === 'pig') {
    const p = lay.pipe;
    
    return place(p.u, wallTop + R.topAt(Math.abs(p.v) + 0.08) - 0.12 + 0.95, p.v);
  }
  return null;
}

export function anchors({ seed = 1, species = 'human', stage = 'house' } = {}) {
  const level = levelOf(STAGES, stage);
  const { B, lay, props } = plan(seed, species, stage);
  const live = props.filter((p) => p.level <= level && (p.upto ?? 9) >= level);
  
  const obstacles = live.filter((p) => p.block).map((p) => {
    if (p.kind === 'fence') return { what: p.kind, shape: 'box', x: round3(p.x + p.length / 2), z: round3(p.z), hx: round3(p.length / 2 + 0.04), hz: 0.1 };
    if (p.kind === 'hedge') {
      const along = Math.abs(Math.cos(p.rotY || 0)) > 0.7;
      return { what: p.kind, shape: 'box', x: round3(p.x), z: round3(p.z), hx: round3(along ? p.length / 2 : 0.27), hz: round3(along ? 0.27 : p.length / 2) };
    }
    return { what: p.kind, shape: 'circle', x: round3(p.x), z: round3(p.z), r: p.block };
  });
  
  const R = roofMetrics(B);
  let hx = B.W / 2 + (R.alongX ? 0.35 : B.overhang + 0.1), hz = B.D / 2 + (R.alongX ? B.overhang + 0.1 : 0.35);
  const REACH = { step: 0.32, doormat: 0.3, mailbox: 0.25, wallLantern: 0.2, wreath: 0.25, bench: 0.6, lantern: 0.15, trough: 0.65, pot: 0.26, birdBath: 0.38, barrel: 0.35, awning: 0.9, paperLantern: 0.25, bamboo: 0.62, hangingPot: 0.25 };
  for (const p of live) {
    if (p.x === undefined) continue;
    let x0, x1, z0, z1;
    if (p.kind === 'fence') { x0 = p.x; x1 = p.x + p.length; z0 = p.z - 0.1; z1 = p.z + 0.1; } else if (p.kind === 'path') { x0 = p.x - 0.45; x1 = p.x + 0.45; z0 = p.z; z1 = p.z + p.length; } else if (p.kind === 'hedge' || p.kind === 'bed') {
      
      const c = Math.abs(Math.cos(p.rotY || 0)), s = Math.abs(Math.sin(p.rotY || 0));
      const a = p.kind === 'hedge' ? p.length / 2 + 0.08 : p.w / 2 + 0.08, b = p.kind === 'hedge' ? 0.3 : p.d / 2 + 0.08;
      const ex = a * c + b * s, ez = a * s + b * c;
      x0 = p.x - ex; x1 = p.x + ex; z0 = p.z - ez; z1 = p.z + ez;
    } else {
      const reach = REACH[p.kind] ?? 0.4;
      x0 = p.x - reach; x1 = p.x + reach; z0 = p.z - reach; z1 = p.z + reach;
    }
    hx = Math.max(hx, Math.abs(x0), Math.abs(x1));
    hz = Math.max(hz, Math.abs(z0), Math.abs(z1));
  }
  
  
  const smoke = smokeTop(species, B, lay);
  return {
    footprint: { hx: round3(B.W / 2 + 0.21), hz: round3(B.D / 2 + 0.21) },
    door: { x: round3(lay.doorX), z: round3(B.D / 2 + 0.75), w: B.door.w, h: B.door.h },
    room: { hx: round3(hx), hz: round3(hz) },
    height: round3(roofMetrics(B).ridgeTop),
    ...(smoke ? { smoke: { x: round3(smoke.x), y: round3(smoke.y), z: round3(smoke.z) } } : {}),
    obstacles,
  };
}





export const WALL_THICKNESS_M = 0.16;















export function roomPlan({ seed = 1, species = 'human' } = {}) {
  const B = BODY[speciesOf(species)];
  const st = styleFor(species, seed);
  const lay = layoutOf(species, st, B);
  const W = B.W - 2 * WALL_THICKNESS_M;
  const D = B.D - 2 * WALL_THICKNESS_M;
  
  
  
  const rise = B.rise * (D / (B.ridge === 'x' ? B.D : B.W));
  return Object.freeze({
    species,
    seed,
    hx: round3(W / 2),
    hz: round3(D / 2),
    wallH: round3(B.wallH),
    rise: round3(rise),
    
    door: Object.freeze({ x: round3(-lay.doorX), w: B.door.w, h: B.door.h, porthole: Boolean(st.porthole) }),
    
    windowSide: st.side,
    style: Object.freeze({
      wall: st.wall, roof: st.roof, trim: st.trim, door: st.door, knob: st.knob,
      mat: st.mat, floor: st.bench || st.mat,
    }),
  });
}



function faceMatrix(B, face, u, y, out) {
  if (face === 'front') return translate(u, y, B.D / 2 + out);
  if (face === 'back') return compose(translate(0, 0, -B.D / 2), compose(rotateY(Math.PI), translate(u, y, out)));
  if (face === 'right') return compose(translate(B.W / 2, 0, 0), compose(rotateY(Math.PI / 2), translate(u, y, out)));
  return compose(translate(-B.W / 2, 0, 0), compose(rotateY(-Math.PI / 2), translate(u, y, out)));
}

function plinthOf(mesh, c) {
  emit(mesh, 'stone', plinth({ width: c.B.W, depth: c.B.D, height: 0.4, thickness: 0.3, detail: c.detail, rng: c.rng.child('plinth') }), { color: vc(hex(c.pal.stone[1]), { useTag: true, groundAO: 0.15 }) });
}

function houseBody(mesh, c) {
  const { B, st, lay, detail, rng, snow } = c;
  const { W, D, wallH, rise } = B;
  const wallTop = BASE + wallH;
  const R = roofMetrics(B);
  const d1 = Math.min(2, detail + 1);
  const trimC = hex(st.trim), roofC = hex(st.roof);
  plinthOf(mesh, c);

  const gable = { eaveY: wallH, ridgeY: wallH + rise };
  const walls = [
    { m: translate(0, BASE, D / 2), width: W, gable: !R.alongX, d: detail },
    
    { m: compose(translate(0, BASE, -D / 2), rotateY(Math.PI)), width: W, gable: !R.alongX, d: 2 },
    { m: compose(translate(W / 2, BASE, 0), rotateY(Math.PI / 2)), width: D, gable: R.alongX, d: d1 },
    { m: compose(translate(-W / 2, BASE, 0), rotateY(-Math.PI / 2)), width: D, gable: R.alongX, d: d1 },
  ];
  const plainWall = vc(hex(st.wall), { useTag: true, groundAO: 0.15, groundFade: 0.9 });
  
  
  const patchWall = st.patch ? vc(hex(st.patch), { useTag: true, groundAO: 0.15, groundFade: 0.9 }) : null;
  const wallColour = patchWall
    ? (p, n, uv, tag) => mixC(plainWall(p, n, uv, tag), patchWall(p, n, uv, tag), smoothstep(0.56, 0.6, valueNoise3(p[0] * 3.1 + 11, p[1] * 2.6, p[2] * 3.1, 5)))
    : plainWall;
  walls.forEach((w, i) => {
    
    const cols = st.patch ? 6 : w.width > 3.2 ? 5 : 4;
    const panel = wallPanel({ width: w.width + 0.02, height: wallH, plankH: c.level >= UPSTAIRS_LEVEL ? UPSTAIRS_PLANK_M : 0.26, detail: w.d, rng: rng.child(`wall${i}`), gable: w.gable ? gable : null, cols, bulge: 0.018 });
    emit(mesh, 'plank', panel, { matrix: w.m, color: wallColour });
  });
  const postRng = rng.child('posts');
  for (const [x, z] of [[W / 2, D / 2], [-W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2]]) {
    const post = cornerPost({ height: wallTop - 0.16, radius: 0.12, detail: d1, rng: postRng });
    emit(mesh, 'wood', post, { matrix: translate(x, 0, z), color: vc(trimC, { groundAO: 0.25 }) });
  }

  doorUnit(mesh, translate(lay.doorX, BASE, D / 2 + 0.07), {
    width: B.door.w, height: B.door.h, detail, rng: rng.child('door'), color: hex(st.door), frameColor: trimC,
    knobColor: hex(st.knob), ironColor: hex('#4a4658'), glassColor: hex('#7fb0d8'), porthole: Boolean(st.porthole), part: 'door',
  });
  const winRng = rng.child('windows');
  for (const w of lay.windows) {
    if (w.small && (detail === 2 || (detail === 1 && w.minor))) continue;
    if (w.upper && (detail === 2 || w.small)) continue; 
    const boxed = w.box && c.level >= 3;
    windowUnit(mesh, faceMatrix(B, w.face, w.u, w.y, 0.075), {
      width: w.w, height: w.h ?? w.w, kind: w.kind || 'rect', muntins: w.muntins || 'cross', detail: w.upper ? 2 : w.small ? d1 : detail, rng: winRng,
      frameColor: trimC, glassColor: hex('#7fb0d8'), shutters: w.shutters, shutterColor: hex(st.door), snowColor: boxed ? null : snow, sill: w.kind !== 'round' && !w.upper,
    });
  }

  const roofM = R.alongX ? translate(0, wallTop, 0) : compose(translate(0, wallTop, 0), rotateY(Math.PI / 2));
  const roofLen = (R.alongX ? W : D) + 0.6;
  const roofMesh = B.curl ? new MeshData('roof') : mesh;
  gableRoof(roofMesh, roofM, {
    length: roofLen, halfSpan: R.halfSpan, rise, thickness: B.thickness, overhang: B.overhang, rows: B.rows,
    detail, rng: rng.child('roof'), color: roofC, ridgeColor: scaleC(roofC, 0.72), sag: B.sag, snowColor: snow, cols: detail === 0 ? 4 : detail === 1 ? 3 : 2,
  });
  if (B.curl) {
    
    
    const run = R.halfSpan + B.overhang;
    for (const g of roofMesh.groups.values()) {
      for (let i = 0; i < g.positions.length; i += 3) {
        const along = R.alongX ? g.positions[i] : g.positions[i + 2], across = R.alongX ? g.positions[i + 2] : g.positions[i];
        const t = Math.min(1.2, Math.abs(along) / (roofLen / 2)), u = Math.min(1.2, Math.abs(across) / run);
        g.positions[i + 1] += B.curl * t * t * t * u * u;
      }
    }
    mesh.append(roofMesh);
  }
  return { wallTop, roofM, R };
}

function humanDetails(mesh, c, body) {
  const { lay, detail, rng, pal, B } = c;
  const ch = lay.chimney;
  const chW = 0.6, chD = 0.52, courseH = 0.3;
  const edge = Math.abs(ch.v) + chD / 2;
  const lowY = body.R.topAt(edge) - 0.28;
  const stoneY = body.R.topAt(edge) - 0.05;
  const courses = Math.max(3, Math.ceil((B.rise + 0.35 - stoneY) / courseH));
  const chRng = rng.child('chimney');
  const chim = chimney({ width: chW, depth: chD, courseH, courses, stonesFrom: stoneY - lowY, detail: Math.min(2, detail + 1), rng: chRng });
  bend(chim.shape, { along: 1, dir: 0, from: 0, length: chim.height, amount: chRng.rangeF(0.04, 0.07) * Math.sign(ch.u || 1) });
  emit(mesh, 'stone', chim.shape, { matrix: compose(body.roofM, translate(ch.u, lowY, ch.v)), color: vc(hex(pal.stone[0]), { useTag: true, groundAO: 0, underside: 0.2 }) });
}

function pigDetails(mesh, c, body) {
  const { lay, detail, rng } = c;
  const p = lay.pipe;
  const lowY = body.R.topAt(Math.abs(p.v) + 0.08) - 0.12;
  stovePipe(mesh, compose(body.roofM, translate(p.u, lowY, p.v)), { height: 0.75, detail, rng: rng.child('pipe'), metal: hex('#9a9cb8'), cap: hex('#4a4658') });
}



function drawProps(mesh, c, body) {
  const { B, st, lay, detail, rng, pal, snow, season, props, level } = c;
  const leaf = hex(pal.leaf[1]), leafDark = hex(pal.leaf[2]);
  const stoneC = hex(pal.stone[season === 'winter' ? 0 : 1]);
  const at = (x, z, a = 0, y = 0) => (a ? compose(translate(x, y, z), rotateY(a)) : translate(x, y, z));
  props.forEach((p, i) => {
    if (p.level > level || (p.upto ?? 9) < level) return;
    const r = rng.child(`prop${i}-${p.kind}`);
    switch (p.kind) {
      case 'step': {
        const stone = steppingStone({ rng: r, size: 0.58, detail });
        emit(mesh, 'stone', stone, { matrix: at(p.x, p.z, r.rangeF(0, Math.PI)), color: vc(stoneC, { groundAO: 0.1 }) });
        break;
      }
      case 'windowBoxes':
        for (const w of lay.windows) {
          if (!w.box) continue;
          flowerBox(mesh, faceMatrix(B, w.face, w.u, w.y - w.h / 2 - 0.36, 0.1), { width: w.w + 0.3, detail, rng: r, season, boxColor: hex('#a8784e'), leafColor: leafDark, snowColor: snow });
        }
        break;
      case 'doormat':
        doormat(mesh, at(p.x, p.z), { width: p.w, depth: 0.46, detail, rng: r, color: hex(st.mat), material: 'plank' });
        break;
      case 'mailbox':
        if (detail < 2) mailbox(mesh, at(p.x, p.z, -0.25 * st.side), { detail, rng: r, color: hex(st.door), postColor: hex(st.trim), flagColor: hex('#e0674e') , snowColor: snow });
        break;
      case 'wallLantern':
        if (detail < 2) wallLantern(mesh, translate(p.x, p.y, p.z), { detail, rng: r, ironColor: hex('#4a4658'), glowColor: hex('#ffd38a'), capColor: scaleC(hex(st.roof), 0.9), snowColor: snow });
        break;
      case 'wreath':
        if (detail === 0) wreath(mesh, translate(p.x, p.y, p.z), { detail, rng: r, season, leafColor: leafDark });
        break;
      case 'bench':
        if (detail < 2) bench(mesh, at(p.x, p.z, p.rotY), { width: p.w, detail, rng: r, woodColor: hex(st.bench), frameColor: scaleC(hex(st.bench), 0.7), snowColor: snow });
        break;
      case 'bunting':
        bunting(mesh, translate(0, 0, 0), { from: p.from, to: p.to, sag: p.sag, flags: p.flags, detail, rng: r, colors: st.bunting, stringColor: hex('#fff4e0'), material: 'petal' });
        break;
      case 'lantern':
        postLantern(mesh, at(p.x, p.z), { height: p.h, detail, rng: r, postColor: hex(st.trim === '#fff4e0' ? '#9a6a44' : st.trim), ironColor: hex('#4a4658'), glowColor: hex('#ffd38a'), capColor: scaleC(hex(st.roof), 0.85), snowColor: snow });
        break;
      case 'trough':
        flowerBox(mesh, at(p.x, p.z, p.rotY, 0.02), { width: p.w, detail, rng: r, season, boxColor: hex('#b3845a'), leafColor: leaf, snowColor: snow });
        break;
      case 'pot':
        if (detail < 2) flowerPot(mesh, at(p.x, p.z), { radius: p.r, height: p.h, flare: p.flare ?? 1, detail, rng: r, season, potColor: hex('#d98a5f'), leafColor: leaf, snowColor: snow });
        break;
      case 'path':
        footpath(mesh, at(p.x, p.z), { length: p.length, stones: p.stones, bendX: p.bendX, size: p.size ?? 0.46, detail, rng: r, color: stoneC, snowColor: snow, snowDetail: 1 });
        break;
      case 'fence':
        picketFence(mesh, at(p.x, p.z), { length: p.length, spacing: 0.24, detail, rng: r, color: hex(st.fence), snowColor: snow });
        break;
      case 'hedge':
        hedge(mesh, at(p.x, p.z, p.rotY), { length: p.length, height: 0.62, depth: 0.5, detail, rng: r, leafColor: leafDark, snowColor: snow });
        break;
      case 'bed':
        flowerBed(mesh, at(p.x, p.z, p.rotY), { width: p.w, depth: p.d, edge: p.edge || 'stone', spires: p.spires ?? true, detail, rng: r, season, edgeColor: p.edge === 'wood' ? hex('#a8784e') : stoneC, leafColor: leaf, snowColor: snow });
        break;
      case 'bamboo':
        bamboo(mesh, at(p.x, p.z), { detail, rng: r, season, leafColor: hex(pal.leaf[0]) });
        break;
      case 'paperLantern':
        if (detail < 2) paperLantern(mesh, translate(p.x, p.y, p.z), { size: p.size, drop: p.drop, detail, rng: r, color: hex(st.lantern), capColor: hex('#4a4658') });
        break;
      case 'barrel':
        rainBarrel(mesh, c, body, p, r);
        break;
      case 'awning':
        awning(mesh, translate(p.x, p.y, p.z), { width: p.w, depth: p.depth, drop: 0.3, detail, rng: r, color: hex(p.color === 'door' ? st.door : st.roof), braceColor: hex(st.trim), snowColor: snow });
        break;
      case 'hangingPot':
        if (detail < 2) hangingPot(mesh, c, p, r);
        break;
      case 'ossicones':
        ossicones(mesh, body, c, r);
        break;
      case 'birdBath':
        if (detail < 2) birdBath(mesh, at(p.x, p.z), { height: p.h ?? 0.78, bowl: p.bowl ?? 0.3, detail, rng: r, stoneColor: hex(pal.stone[0]), birdColor: hex('#6a8fd0'), snowColor: snow });
        break;
      case 'tailVane':
        if (detail < 2) tailVane(mesh, body, c, r);
        break;
      default:
        throw new Error(`villagerHome: unknown prop '${p.kind}'`);
    }
  });
}



function mailbox(mesh, m, { detail, rng, color, postColor, flagColor, snowColor }) {
  const lean = rng.rangeF(-0.03, 0.03);
  emit(mesh, 'wood', rod({ path: [[0, -0.03, 0], [lean, 0.98, 0]], w: 0.08, h: 0.08, detail: 1, up: [0, 0, 1], caps: 'none' }), { matrix: m, color: vc(postColor, { groundAO: 0.3 }) });
  const sec = [];
  const n = detail === 0 ? 6 : 4;
  for (let k = 0; k <= n; k++) { const a = (k / n) * Math.PI; sec.push([Math.sin(a) * 0.13 + 0.02, Math.cos(a) * 0.1]); }
  sec.push([-0.06, -0.1], [-0.06, 0.1]);
  const box = sweep({ profile: sec.map(([x, y]) => [x, y]), path: [[lean, 1.06, -0.22], [lean, 1.06, 0.2]], up: [0, 1, 0], caps: 'round', capSegments: 0, capLength: 0.03 });
  emit(mesh, 'wood', box, { matrix: m, color: vc(color, { groundAO: 0, underside: 0.4 }) });
  emit(mesh, 'metal', rod({ path: [[lean + 0.105, 1.08, -0.12], [lean + 0.105, 1.32, -0.12], [lean + 0.105, 1.3, 0.0]], w: 0.02, h: 0.07, detail: 1, up: [1, 0, 0], capLength: 0.02 }), { matrix: m, color: vc(flagColor, { groundAO: 0 }) });
  if (snowColor) emit(mesh, 'snow', rod({ path: [[lean + 0.03, 1.2, -0.2], [lean + 0.03, 1.21, 0.18]], w: 0.05, h: 0.16, detail: 1, capLength: 0.04 }), { matrix: m, color: vc(snowColor, { groundAO: 0 }) });
}



function tailVane(mesh, body, c, rng) {
  const { B, detail } = c;
  const turns = rng.rangeF(1.25, 1.5);
  const n = detail === 0 ? 8 : 6;
  const path = [[0, 0, 0], [0, 0.28, 0]];
  for (let k = 1; k <= n; k++) {
    const t = k / n, a = t * turns * Math.PI * 2, r = 0.11 * (1 - t * 0.65);
    path.push([Math.sin(a) * r, 0.28 + 0.11 - Math.cos(a) * r, t * 0.03]);
  }
  const vane = sweep({ profile: circleProfile(0.019, 4, Math.PI / 4), path, up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.02 });
  const back = body.R.alongX ? [B.W / 2 + 0.05, 0, 0] : [0, 0, -B.D / 2 - 0.05];
  const y = body.wallTop + body.R.topAt(0) - 0.06;
  emit(mesh, 'metal', vane, { matrix: compose(translate(back[0], y, back[2]), rotateY(body.R.alongX ? Math.PI / 2 : 0)), color: vc(hex('#4a4658'), { groundAO: 0 }) });
}



function bamboo(mesh, m, { detail, rng, season, leafColor }) {
  const canes = detail === 0 ? 4 : detail === 1 ? 3 : 2;
  const caneC = hex(season === 'autumn' ? '#a9b24e' : season === 'winter' ? '#6f9e5c' : '#72b84e');
  for (let i = 0; i < canes; i++) {
    const a = rng.rangeF(0, Math.PI * 2), rr = rng.rangeF(0.02, 0.18);
    const x = Math.sin(a) * rr, z = Math.cos(a) * rr;
    const h = rng.rangeF(2.1, 2.9) * (i === 0 ? 1.08 : 1);
    const lx = rng.rangeF(-0.2, 0.2), lz = rng.rangeF(-0.2, 0.2);
    const stations = detail === 0 ? 7 : detail === 1 ? 4 : 2;
    const path = [];
    for (let k = 0; k < stations; k++) { const t = k / (stations - 1); path.push([x + lx * t * t, -0.03 + t * h, z + lz * t * t]); }
    const cane = rod({ path, w: 0.105 - i * 0.008, sides: detail === 0 ? 5 : 4, detail, caps: ['none', 'round'], capLength: 0.03, scales: (t, idx) => (detail === 0 && idx > 0 && idx % 2 === 0 ? 1.22 : 1) * (1 - 0.3 * t) });
    emit(mesh, 'wood', cane, { matrix: m, color: vc(caneC, { groundAO: 0.3, mottle: 0.1 }) });
    if (detail === 2) continue;
    for (let k = 0; k < (detail === 0 ? 3 : i < 2 ? 2 : 1); k++) {
      const t = 1 - k * 0.22;
      const cx = x + lx * t * t + rng.rangeF(-0.06, 0.06), cy = t * h - 0.08, cz = z + lz * t * t + rng.rangeF(-0.06, 0.06);
      const tuft = blob({ radii: [rng.rangeF(0.24, 0.32), 0.12, rng.rangeF(0.18, 0.24)], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.3 });
      deform(tuft, (q) => { q[0] += cx; q[1] += cy; q[2] += cz; });
      emit(mesh, 'grass', tuft, { matrix: m, color: vc(leafColor, { groundAO: 0, underside: 0.35 }) });
    }
  }
}



function paperLantern(mesh, m, { size = 1, drop = 0.15, detail, rng, color, capColor }) {
  const k = size, sides = detail === 0 ? 6 : 5;
  const top = -drop, cap = vc(capColor, { groundAO: 0 });
  emit(mesh, 'wood', rod({ path: [[0, 0.02, 0], [rng.rangeF(-0.01, 0.01), top, 0]], w: 0.016, sides: 3, detail: 2, caps: 'none' }), { matrix: m, color: cap });
  const yt = top - 0.02 * k, yb = yt - 0.35 * k;
  const pts = [[0.05, -0.35], [0.12, -0.32], [0.17, -0.25], [0.18, -0.15], [0.14, -0.05], [0.05, 0]].map(([rr, y]) => [rr * k, yt + y * k]);
  emit(mesh, 'lamp-glow', lathe({ points: pts, sides, phase: rng.rangeF(0, 1) }), { matrix: m, color });
  if (detail > 0) return;
  emit(mesh, 'wood', lathe({ points: [[0, yb - 0.03 * k], [0.065 * k, yb - 0.02 * k], [0.06 * k, yb + 0.012 * k], [0, yb + 0.02 * k]], sides }), { matrix: m, color: cap });
  emit(mesh, 'wood', lathe({ points: [[0, yt - 0.012 * k], [0.065 * k, yt - 0.006 * k], [0.05 * k, yt + 0.03 * k], [0, yt + 0.035 * k]], sides }), { matrix: m, color: cap });
}



function rainBarrel(mesh, c, body, p, rng) {
  const { B, detail, snow } = c;
  const sides = detail === 0 ? 8 : detail === 1 ? 6 : 5;
  const m = translate(p.x, 0, p.z);
  const pts = detail === 2 ? [[0, 0], [0.27, 0], [0.3, 0.4], [0.26, 0.8], [0, 0.76]] : [[0, 0], [0.24, 0], [0.28, 0.18], [0.3, 0.4], [0.28, 0.62], [0.25, 0.8], [0.21, 0.78], [0, 0.74]];
  const shape = lathe({ points: pts, sides, phase: rng.rangeF(0, 1) });
  const wet = shape.p.map((q) => q[1] > 0.7 && Math.hypot(q[0], q[2]) < 0.22);
  const staves = hex('#a8784e'), water = hex('#8fc3d4');
  emit(mesh, 'wood', shape, { matrix: m, color: (q, n, uv, tag, i) => { const col = paintVertex(staves, q, n, { groundAO: 0.35 }); return wet[i] ? mixC(col, water, snow ? 0.15 : 0.8) : col; } });
  if (detail < 2) {
    for (const y of [0.2, 0.6]) {
      const loop = circleProfile(0.293, detail === 0 ? 8 : 6).map(([x, z]) => [x, y, z]);
      emit(mesh, 'metal', sweep({ profile: circleProfile(0.02, 3), path: loop, closed: true, up: [0, 1, 0] }), { matrix: m, color: vc(hex('#4a4658'), { groundAO: 0 }) });
    }
    if (snow) emit(mesh, 'snow', lathe({ points: [[0.22, 0.77], [0.15, 0.83], [0, 0.85]], sides }), { matrix: m, color: vc(snow, { groundAO: 0 }) });
  }
  const sx = Math.sign(p.x) || 1;
  const x0 = sx * (B.W / 2 + 0.1), top = body.wallTop + 0.1, bz = p.z, tipX = p.x - sx * 0.02;
  const path = detail === 2
    ? [[x0, top, bz], [x0, 1.25, bz], [tipX, 1.05, bz]]
    : [[x0, top, bz], [x0, 1.42, bz], [x0 + sx * 0.05, 1.18, bz], [x0 + (tipX - x0) * 0.45, 1.04, bz], [x0 + (tipX - x0) * 0.85, 1.06, bz], [tipX, 1.18, bz]];
  const pipe = rod({ path, w: 0.1, sides: detail === 0 ? 6 : 4, detail, caps: ['none', 'round'], capLength: 0.03, scales: (t) => 1 + 0.4 * Math.max(0, (t - 0.8) / 0.2) });
  emit(mesh, 'metal', pipe, { color: vc(hex('#9fb0c4'), { groundAO: 0 }) });
}


function hangingPot(mesh, c, p, rng) {
  const { B, detail, season, snow, pal } = c;
  const fz = B.D / 2, iron = vc(hex('#4a4658'), { groundAO: 0 });
  emit(mesh, 'metal', rod({ path: [[p.x, p.y - 0.12, fz], [p.x, p.y + 0.02, fz + 0.2], [p.x, p.y, fz + 0.42]], w: 0.03, h: 0.04, detail: 1, up: [1, 0, 0], caps: ['none', 'round'], capLength: 0.02 }), { color: iron });
  emit(mesh, 'metal', rod({ path: [[p.x, p.y - 0.01, fz + 0.4], [p.x + rng.rangeF(-0.01, 0.01), p.y - 0.2, fz + 0.4]], w: 0.014, sides: 3, detail: 2, caps: 'none' }), { color: iron });
  flowerPot(mesh, translate(p.x, p.y - 0.44, fz + 0.4), { radius: 0.16, height: 0.24, flare: 1.12, detail, rng, season, potColor: hex('#d98a5f'), leafColor: hex(pal.leaf[1]), snowColor: snow });
}



function ossicones(mesh, body, c, rng) {
  const { B, detail } = c;
  const y0 = body.wallTop + body.R.topAt(0) - 0.08, z0 = B.D / 2 + 0.05;
  const hide = hex('#d9a066'), knob = hex('#7a4f36');
  for (const side of [-1, 1]) {
    const len = rng.rangeF(0.34, 0.44), lean = side * rng.rangeF(0.1, 0.16), x0 = side * 0.1;
    const path = [[x0, y0, z0], [x0 + lean * 0.35, y0 + len * 0.55, z0 + 0.02], [x0 + lean, y0 + len, z0 + 0.04]];
    const shape = rod({ path, w: 0.09, sides: detail === 0 ? 6 : 4, detail, caps: ['none', 'round'], capSegments: detail === 0 ? 1 : 0, capLength: 0.06, scales: (t) => 0.75 + 0.6 * t * t });
    const tipY = y0 + len * 0.72;
    emit(mesh, 'wood', shape, { color: (q, n) => mixC(paintVertex(hide, q, n, { groundAO: 0 }), paintVertex(knob, q, n, { groundAO: 0 }), smoothstep(tipY - 0.05, tipY + 0.06, q[1])) });
  }
}



function buildingSite(mesh, c, progress) {
  const { B, st, lay, detail, rng, snow } = c;
  const s = st.side;
  plinthOf(mesh, c);
  timberFrame(mesh, translate(0, 0, 0), {
    W: B.W, D: B.D, base: BASE, wallH: B.wallH, rise: B.rise, ridge: B.ridge, door: { x: lay.doorX, w: B.door.w, h: B.door.h },
    progress, detail, rng: rng.child('frame'), color: hex('#dcb57e'),
  });
  scaffold(mesh, compose(translate(s * (B.W / 2 + 0.14), 0, -0.05), rotateY(s * Math.PI / 2)), {
    width: B.D * 0.85, height: BASE + B.wallH + 0.15, depth: 0.72, detail, rng: rng.child('scaffold'), poleColor: hex('#b3845a'), plankColor: hex('#e8c990'),
  });
  const cr = rng.child('crates');
  const cx = -s * (B.W / 2 - 0.15), cz = B.D / 2 + 0.85;
  slatCrate(mesh, compose(translate(cx, 0, cz), rotateY(0.3)), { detail, rng: cr, color: hex('#c08a55') });
  if (detail < 2) slatCrate(mesh, compose(translate(cx - s * 0.62, 0, cz + 0.12), rotateY(-0.2)), { width: 0.48, depth: 0.4, height: 0.36, detail, rng: cr, color: hex('#b07a4a') });
  slatCrate(mesh, compose(translate(cx + s * 0.05, 0.42, cz - 0.02), rotateY(0.62)), { width: 0.46, depth: 0.38, height: 0.34, detail: Math.min(2, detail + 1), rng: cr, color: hex('#d09a62') });
  
  const away = -Math.sign(lay.doorX || s);
  plankStack(mesh, compose(translate(away * 1.0, 0, B.D / 2 + 1.38), rotateY(away * 0.12)), { length: 1.5, count: 4, detail, rng: rng.child('planks'), color: hex('#e8c990'), sleeperColor: hex('#8a5e3c'), snowColor: snow });
}



export function generate({ seed = 1, season = 'summer', lod = 0, species = 'human', stage = 'house', progress = DEFAULT_PROGRESS } = {}) {
  const level = levelOf(STAGES, stage);
  const { B, st, lay, props } = plan(seed, species, stage);
  const detail = Math.max(0, Math.min(2, lod | 0));
  const pal = seasonPalette(season);
  const snow = season === 'winter' ? hex(pal.snow[0]) : null;
  const rng = new SeededRng(seed).child(`villagerHome-${species}`);
  const mesh = new MeshData(`villagerHome-${species}-${seed}-${stage}-${season}-lod${detail}`);
  const c = { B, st, lay, props, detail, rng, pal, snow, season, level };
  if (stage === 'building') {
    buildingSite(mesh, c, progress);
    return mesh;
  }
  const body = houseBody(mesh, c);
  if (species === 'human') humanDetails(mesh, c, body);
  if (species === 'pig') pigDetails(mesh, c, body);
  drawProps(mesh, c, body);
  return mesh;
}
