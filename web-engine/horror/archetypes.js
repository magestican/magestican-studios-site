








































import { actFor } from './acts.js';
import {
  seededRng, insideLevel, progressAt, routeLength, corners,
} from './level.js';
import { gatesFor } from './gates.js';






import { inwardYaw } from './facing.mjs';

export const ARCHETYPE_NAMES = Object.freeze(['stock', 'processing', 'dark']);









export const ROOM_PROPS = Object.freeze({
  penRail: { r: 0.22, h: 1.1, len: 1.6, solid: true },
  desk: { r: 0.55, h: 0.75, len: 1.4, solid: true },
  filingCabinet: { r: 0.3, h: 1.5, solid: true },
  noticeBoard: { r: 0, h: 0.9, solid: false },
  chair: { r: 0.25, h: 0.9, solid: true },
  canteenTable: { r: 0.55, h: 0.75, len: 1.6, solid: true },
  vendingMachine: { r: 0.45, h: 1.9, solid: true },
  urn: { r: 0.25, h: 0.6, solid: true },
  bunk: { r: 0.45, h: 0.6, len: 1.9, solid: true },
  medCabinet: { r: 0.3, h: 1.6, solid: true },
  ivStand: { r: 0.2, h: 1.7, solid: true },
  sink: { r: 0.3, h: 0.9, solid: true },
  generator: { r: 0.8, h: 1.4, solid: true },
  fuelDrum: { r: 0.3, h: 0.9, solid: true },
  switchboard: { r: 0.2, h: 1.8, solid: true },
  toolBench: { r: 0.5, h: 0.9, len: 1.6, solid: true },
  freezerRack: { r: 0.45, h: 2.0, len: 1.8, solid: true },
  hangingCarcass: { r: 0, h: 0, solid: false, place: 'ceiling' },
});












export const ROOM_TEMPLATES = Object.freeze({
  penBlock: [
    { prop: 'penRail', fx: 0.55, fz: 0.15 },
    { prop: 'penRail', fx: 0.55, fz: 0.85 },
    { prop: 'strawBale', fx: 0.85, fz: 0.2 },
    { prop: 'strawBale', fx: 0.85, fz: 0.8 },
    { prop: 'feedSack', fx: 0.3, fz: 0.1 },
    { prop: 'heatLamp', fx: 0.6, fz: 0.5 },
  ],
  office: [
    { prop: 'desk', fx: 0.82, fz: 0.28 },
    { prop: 'desk', fx: 0.82, fz: 0.72 },
    { prop: 'chair', fx: 0.68, fz: 0.28 },
    { prop: 'chair', fx: 0.68, fz: 0.72 },
    { prop: 'filingCabinet', fx: 0.3, fz: 0.08 },
    { prop: 'filingCabinet', fx: 0.45, fz: 0.08 },
    { prop: 'noticeBoard', fx: 0.5, fz: 0.96 },
  ],
  canteen: [
    { prop: 'canteenTable', fx: 0.3, fz: 0.18 },
    { prop: 'canteenTable', fx: 0.3, fz: 0.82 },
    { prop: 'canteenTable', fx: 0.75, fz: 0.18 },
    { prop: 'canteenTable', fx: 0.75, fz: 0.82 },
    { prop: 'vendingMachine', fx: 0.92, fz: 0.5 },
    { prop: 'urn', fx: 0.92, fz: 0.12 },
  ],
  medbay: [
    { prop: 'bunk', fx: 0.85, fz: 0.22 },
    { prop: 'bunk', fx: 0.85, fz: 0.78 },
    { prop: 'ivStand', fx: 0.68, fz: 0.22 },
    { prop: 'medCabinet', fx: 0.5, fz: 0.06 },
    { prop: 'sink', fx: 0.3, fz: 0.94 },
  ],
  generatorRoom: [
    { prop: 'generator', fx: 0.86, fz: 0.5 },
    { prop: 'fuelDrum', fx: 0.86, fz: 0.12 },
    { prop: 'fuelDrum', fx: 0.86, fz: 0.88 },
    { prop: 'switchboard', fx: 0.4, fz: 0.05 },
    { prop: 'toolBench', fx: 0.3, fz: 0.94 },
    { prop: 'cableBundle', fx: 0.5, fz: 0.5 },
  ],
  coldStore: [
    { prop: 'freezerRack', fx: 0.3, fz: 0.08 },
    { prop: 'freezerRack', fx: 0.7, fz: 0.08 },
    { prop: 'freezerRack', fx: 0.3, fz: 0.92 },
    { prop: 'freezerRack', fx: 0.7, fz: 0.92 },
    { prop: 'hangingCarcass', fx: 0.85, fz: 0.35 },
    { prop: 'hangingCarcass', fx: 0.85, fz: 0.65 },
    { prop: 'meatHook', fx: 0.5, fz: 0.3 },
    { prop: 'meatHook', fx: 0.5, fz: 0.7 },
  ],
});
























export const ARCHETYPES = Object.freeze({
  stock: {
    name: 'stock',
    act: 1,
    title: 'THE STOCK DECKS',
    palette: {
      wall: 0x9a8c58, floor: 0x6e5c38, ceiling: 0x4a3f2a, trim: 0x7c5a2e,
      light: 0xffc24a, safeLight: 0x8fb4d8, fog: 0x1a1508,
    },
    lights: { kind: 'sodium', colour: 0xffc24a, spacing: 7.5, flicker: 0.15, dead: 0.0 },
    hazards: ['steam', 'fire'],
    take: 4,
    kit: [
      { name: 'locker', place: 'wall', per10m: 0.8, r: 0.36, h: 2.0, solid: true, fixed: true },
      { name: 'feedHopper', place: 'wall', per10m: 0.5, r: 0.45, h: 1.9, solid: true, fixed: true },
      { name: 'strawBale', place: 'wall', per10m: 1.2, r: 0.5, h: 0.5, solid: true },
      { name: 'waterTrough', place: 'wall', per10m: 0.4, r: 0.4, h: 0.6, len: 1.4, solid: true },
      { name: 'penGate', place: 'wall', per10m: 0.5, r: 0.2, h: 1.2, len: 1.2, solid: true },
      { name: 'feedSack', place: 'wall', per10m: 0.9, r: 0.3, h: 0.7, solid: true },
      { name: 'chickenCrate', place: 'wall', per10m: 0.6, r: 0.35, h: 0.6, solid: true },
      { name: 'heatLamp', place: 'ceiling', per10m: 0.7, r: 0, h: 0, solid: false },
      { name: 'barrel', place: 'wall', per10m: 0.7, r: 0.27, h: 0.86, solid: true },
    ],
    rooms: { safe: 'medbay', back: ['penBlock', 'canteen'] },
  },
  processing: {
    name: 'processing',
    act: 2,
    title: 'PROCESSING',
    palette: {
      wall: 0x86a3b0, floor: 0x50626a, ceiling: 0x36444c, trim: 0xa8b6bd,
      light: 0xd8ecff, safeLight: 0xf0b860, fog: 0x0a1014,
    },
    lights: { kind: 'fluorescent', colour: 0xd8ecff, spacing: 5.5, flicker: 0.35, dead: 0.1 },
    hazards: ['steam', 'electric', 'fire'],
    take: 5,
    kit: [
      { name: 'locker', place: 'wall', per10m: 0.8, r: 0.36, h: 2.0, solid: true, fixed: true },
      { name: 'meatHook', place: 'ceiling', per10m: 1.5, r: 0, h: 0, solid: false, fixed: true },
      { name: 'conveyorSection', place: 'wall', per10m: 0.6, r: 0.5, h: 0.9, len: 2.4, solid: true },
      { name: 'chute', place: 'wall', per10m: 0.4, r: 0.4, h: 2.2, solid: true },
      { name: 'steelTable', place: 'wall', per10m: 0.5, r: 0.45, h: 0.9, len: 1.6, solid: true },
      { name: 'hoseReel', place: 'wall', per10m: 0.5, r: 0.3, h: 1.0, solid: true },
      { name: 'offalBin', place: 'wall', per10m: 0.7, r: 0.35, h: 0.8, solid: true },
      { name: 'scaldTank', place: 'wall', per10m: 0.3, r: 0.55, h: 1.3, solid: true },
      { name: 'drainGrate', place: 'centre', per10m: 0.8, r: 0, h: 0, solid: false },
      { name: 'carcassTrolley', place: 'centre', per10m: 0.25, r: 0.45, h: 1.4, solid: true },
    ],
    rooms: { safe: 'office', back: ['coldStore', 'canteen'] },
  },
  dark: {
    name: 'dark',
    act: 3,
    title: 'THE DARK DECKS',
    palette: {
      wall: 0x5c3a3c, floor: 0x2d282e, ceiling: 0x261c1e, trim: 0x8c2b2b,
      light: 0xff2a3c, safeLight: 0xe8f0e0, fog: 0x050203,
    },
    lights: { kind: 'emergency', colour: 0xff2a3c, spacing: 9.0, flicker: 0.6, dead: 0.3 },
    hazards: ['gas', 'electric', 'steam', 'fire'],
    take: 5,
    kit: [
      { name: 'locker', place: 'wall', per10m: 0.8, r: 0.36, h: 2.0, solid: true, fixed: true },
      { name: 'emergencyBeacon', place: 'ceiling', per10m: 0.5, r: 0, h: 0, solid: false, fixed: true },
      { name: 'floodPool', place: 'centre', per10m: 0.6, r: 0, h: 0, len: 4.0, solid: false },
      { name: 'fallenPanel', place: 'wall', per10m: 0.5, r: 0.4, h: 0.3, len: 1.5, solid: true },
      { name: 'burstPipe', place: 'wall', per10m: 0.4, r: 0.2, h: 1.6, solid: true },
      { name: 'cableBundle', place: 'ceiling', per10m: 1.0, r: 0, h: 0, solid: false },
      { name: 'sandbag', place: 'wall', per10m: 0.6, r: 0.35, h: 0.5, solid: true },
      { name: 'overturnedTrolley', place: 'centre', per10m: 0.25, r: 0.5, h: 0.7, solid: true },
      { name: 'bodyBag', place: 'wall', per10m: 0.4, r: 0.3, h: 0.3, len: 1.8, solid: true },
      { name: 'barrel', place: 'wall', per10m: 0.5, r: 0.27, h: 0.86, solid: true },
    ],
    rooms: { safe: 'generatorRoom', back: ['medbay', 'office'] },
  },
});




export function archetypeFor(level) {
  return ARCHETYPES[ARCHETYPE_NAMES[actFor(level) - 1]];
}





function shuffle(list, r) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}















export function kitFor(level, campaignSeed = 1) {
  let prev = null;
  let out = null;
  for (let L = 1; L <= Math.max(1, level); L += 1) {
    const arch = archetypeFor(L);
    const fixed = arch.kit.filter((p) => p.fixed).map((p) => p.name);
    const pool = arch.kit.filter((p) => !p.fixed).map((p) => p.name);
    let choice = null;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const r = seededRng(campaignSeed * 104729 + L * 7919 + attempt * 131 + 5);
      const names = shuffle(pool, r).slice(0, arch.take).sort();
      const spacingStep = Math.floor(r() * 3) - 1;      
      const key = `${arch.name}:${names.join(',')}:${spacingStep}`;
      if (!(prev && prev.archetype === arch.name && prev.key === key)) {
        choice = { names, spacingStep, key };
        break;
      }
    }
    out = {
      level,
      archetype: arch.name,
      props: [...fixed, ...choice.names],
      key: choice.key,
      spacingStep: choice.spacingStep,
    };
    prev = out;
  }
  return out;
}


export function lightSpacingFor(level, campaignSeed = 1) {
  const arch = archetypeFor(level);
  return arch.lights.spacing + kitFor(level, campaignSeed).spacingStep * 0.8;
}





export const DRESSING = Object.freeze({
  
  
  
  playerAllowance: 0.16,
  wallInset: 0.06,          
  wallSlotEvery: 1.2,       
  centreSlotEvery: 2.5,
  runEndMargin: 1.8,        
  centreEndMargin: 4.0,     
  minFromDoor: 1.8,
  minFromBay: 1.0,          
  minFromGate: 2.2,
  minFromStart: 3.5,
  wallSpacing: 1.4,         
  centreSpacing: 6.0,       
  centreToWall: 2.0,        
                            
  roomCentreClear: 0.9,     
  doorZone: { fx: 0.2, fz: 0.25 },
  sideCap: 6,               
});

const propSpec = (arch, name) => arch.kit.find((p) => p.name === name) || ROOM_PROPS[name] || null;

const distToRect = (rc, x, z) => {
  const dx = Math.max(rc.x0 - x, 0, x - rc.x1);
  const dz = Math.max(rc.z0 - z, 0, z - rc.z1);
  return Math.hypot(dx, dz);
};


function solidsOf(spec, x, z, along) {
  if (!spec.solid) return [];
  const r = spec.r + DRESSING.playerAllowance;
  if (!spec.len || spec.len <= spec.r * 2) return [{ x, z, r }];
  const n = Math.max(2, Math.ceil(spec.len / (spec.r * 1.6)));
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const t = -spec.len / 2 + spec.r + (spec.len - spec.r * 2) * (i / (n - 1));
    out.push({ x: x + along.x * t, z: z + along.z * t, r });
  }
  return out;
}













export function dressDeck(plan, level, { campaignSeed = 1 } = {}) {
  const arch = archetypeFor(level);
  const kit = kitFor(level, campaignSeed);
  const r = seededRng(plan.seed * 7919 + level * 31 + 11);
  const gates = gatesFor(plan, plan.seed, { act: actFor(level) });
  const doors = plan.rooms.map((m) => m.door);
  const bays = plan.bays || [];
  const startP = progressAt(plan, plan.start.x, plan.start.z);
  const cornerList = corners(plan);

  
  const spacing = lightSpacingFor(level, campaignSeed);
  const fixtures = [];
  let progress = 0;
  plan.runs.forEach((run, ri) => {
    const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
    const dx = (run.x1 - run.x0) / len; const dz = (run.z1 - run.z0) / len;
    const offset = 1.0 + r() * Math.min(spacing - 1.0, len * 0.4);
    for (let u = offset; u < len - 1.2; u += spacing) {
      const dead = r() < arch.lights.dead;
      fixtures.push({
        x: run.x0 + dx * u, z: run.z0 + dz * u, run: ri, progress: progress + u,
        dead, flicker: !dead && r() < arch.lights.flicker,
        phase: r() * 6.283,
      });
    }
    progress += len;
  });
  const lights = {
    kind: arch.lights.kind, colour: arch.lights.colour, spacing,
    flicker: arch.lights.flicker, fixtures,
  };

  
  const props = [];
  const solids = [];
  const clearOf = (x, z, place) => {
    if (Math.hypot(x - plan.start.x, z - plan.start.z) < DRESSING.minFromStart) return false;
    for (const d of doors) if (Math.hypot(x - d.x, z - d.z) < DRESSING.minFromDoor) return false;
    for (const b of bays) if (distToRect(b, x, z) < DRESSING.minFromBay) return false;
    for (const g of gates) if (Math.hypot(x - g.x, z - g.z) < DRESSING.minFromGate) return false;
    for (const p of props) {
      const d = Math.hypot(x - p.x, z - p.z);
      if (!p.solid) continue;
      if (place === 'centre' && p.place === 'centre' && d < DRESSING.centreSpacing) return false;
      if (place === 'centre' && p.place === 'wall' && d < DRESSING.centreToWall) return false;
      if (place === 'wall' && p.place === 'centre' && d < DRESSING.centreToWall) return false;
      if (place === 'wall' && p.place === 'wall' && d < DRESSING.wallSpacing) return false;
    }
    return true;
  };

  plan.runs.forEach((run, ri) => {
    const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
    const dx = (run.x1 - run.x0) / len; const dz = (run.z1 - run.z0) / len;
    const along = { x: dx, z: dz };
    const half = run.w / 2;
    
    const wallSlots = [];
    for (let u = DRESSING.runEndMargin; u <= len - DRESSING.runEndMargin; u += DRESSING.wallSlotEvery) {
      for (const side of [-1, 1]) wallSlots.push({ u, side });
    }
    const centreSlots = [];
    for (let u = DRESSING.centreEndMargin; u <= len - DRESSING.centreEndMargin; u += DRESSING.centreSlotEvery) {
      centreSlots.push({ u, side: 0 });
    }
    const ceilSlots = [];
    for (let u = 1.0; u <= len - 1.0; u += 1.5) ceilSlots.push({ u, side: 0 });
    const queues = {
      wall: shuffle(wallSlots, r), centre: shuffle(centreSlots, r), ceiling: shuffle(ceilSlots, r),
    };
    for (const name of kit.props) {
      const spec = propSpec(arch, name);
      const want = Math.round(spec.per10m * (len / 10) + (r() - 0.5) * 0.6);
      let placed = 0;
      const q = queues[spec.place];
      for (let k = 0; k < q.length && placed < want; k += 1) {
        const s = q[k];
        if (s.used) continue;
        const inset = spec.place === 'wall' ? half - spec.r - DRESSING.wallInset : 0;
        const x = run.x0 + dx * s.u + (run.axis === 'z' ? s.side * inset : 0);
        const z = run.z0 + dz * s.u + (run.axis === 'x' ? s.side * inset : 0);
        if (spec.solid && !insideLevel(plan, x, z, 0.05)) continue;
        if (!clearOf(x, z, spec.place)) continue;
        s.used = true;
        const yaw = spec.place === 'wall'
          ? inwardYaw(run.axis === 'z' ? s.side : 0, run.axis === 'x' ? s.side : 0)
          : r() * Math.PI;
        const item = {
          name, x, z, yaw, run: ri, side: s.side, place: spec.place, r: spec.r, h: spec.h,
          solid: !!spec.solid, solids: solidsOf(spec, x, z, along),
        };
        props.push(item);
        solids.push(...item.solids);
        placed += 1;
      }
    }
  });

  
  const rooms = plan.rooms.map((m) => {
    const template = m.kind === 'safe'
      ? arch.rooms.safe
      : arch.rooms.back[Math.floor(r() * arch.rooms.back.length) % arch.rooms.back.length];
    const w = m.x1 - m.x0; const d = m.z1 - m.z0;
    const cx = (m.x0 + m.x1) / 2; const cz = (m.z0 + m.z1) / 2;
    const placed = ROOM_TEMPLATES[template].map((t) => {
      const spec = propSpec(arch, t.prop) || { r: 0.3, h: 1, solid: true };
      
      
      const fxIn = Math.min(1 - spec.r / w, Math.max(spec.r / w, t.fx));
      const fzIn = Math.min(1 - spec.r / d, Math.max(spec.r / d, t.fz));
      const x = m.side > 0 ? m.x0 + fxIn * w : m.x1 - fxIn * w;
      const z = m.z0 + fzIn * d;
      
      const nearFar = Math.min(fxIn, 1 - fxIn) < Math.min(fzIn, 1 - fzIn);
      const along = nearFar ? { x: 0, z: 1 } : { x: 1, z: 0 };
      const item = {
        name: t.prop, x, z, fx: t.fx, fz: t.fz, yaw: nearFar ? 0 : Math.PI / 2,
        place: spec.place || 'floor', r: spec.r, h: spec.h, solid: !!spec.solid,
        solids: solidsOf(spec, x, z, along),
      };
      solids.push(...item.solids);
      return item;
    });
    return {
      room: m, template, props: placed,
      light: { x: cx, z: cz, colour: m.kind === 'safe' ? arch.palette.safeLight : arch.lights.colour },
    };
  });

  return {
    archetype: arch.name, palette: arch.palette, kit, lights, props, rooms, solids,
    startProgress: startP, length: routeLength(plan), corners: cornerList,
  };
}
