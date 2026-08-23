




















import { SeededRng } from '../rng/seededRng.js';
import { WORLD_SIZE } from './voxelWorldGen.js';
import { getBackdrop, getSky } from './mapSpec.js';

const TAU = Math.PI * 2;
















const AUTHORED_CORNER = Math.hypot(40, 40);
export const RING_SHIFT = Math.max(
  0, Math.hypot(WORLD_SIZE.x / 2, WORLD_SIZE.z / 2) - AUTHORED_CORNER);

export const BACKDROP = Object.freeze({
  
  
  GROUND_Y: 1,
  
  
  
  
  
  MIN_RADIUS: 78 + RING_SHIFT,
  RING_SHIFT,
  
  
  
  PLAY_MARGIN: 8,
  
  
  
  
  SKIRT_OUTER: 300,
  
  
  
  
  
  
  
  
  
  
  
  
  MAX_EXTENT: 250 + RING_SHIFT,
  
  
  
  MIN_SKY_GAP: 0.15,
  
  
  
  
  
  SUN_DIR: Object.freeze([0.6, 1.0, 0.4]),
});





export function hexToRgb(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}




export function luma(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function mixHex(a, b, t) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  return [ar + (br - ar) * k, ag + (bg - ag) * k, ab + (bb - ab) * k];
}



export function skyHorizonHex(mapId) {
  const stops = getSky(mapId).gradient;
  const at = stops.find((s) => s.at === 0.55) ?? stops[Math.floor(stops.length / 2)];
  return at.hex;
}





const CENTRE = Object.freeze({ x: WORLD_SIZE.x / 2, z: WORLD_SIZE.z / 2 });




export function inwardYaw(theta) {
  return Math.atan2(-Math.cos(theta), -Math.sin(theta));
}



export function boxAabb(b) {
  const ca = Math.abs(Math.cos(b.yaw));
  const sa = Math.abs(Math.sin(b.yaw));
  const hx = (b.w / 2) * ca + (b.d / 2) * sa;
  const hz = (b.w / 2) * sa + (b.d / 2) * ca;
  return { x0: b.x - hx, x1: b.x + hx, z0: b.z - hz, z1: b.z + hz };
}


export function keepOut() {
  const m = BACKDROP.PLAY_MARGIN;
  return { x0: -m, z0: -m, x1: WORLD_SIZE.x + m, z1: WORLD_SIZE.z + m };
}

function allowed(box) {
  const a = boxAabb(box);
  const k = keepOut();
  if (a.x1 > k.x0 && a.x0 < k.x1 && a.z1 > k.z0 && a.z0 < k.z1) return false;
  return Math.hypot(box.x - CENTRE.x, box.z - CENTRE.z) >= BACKDROP.MIN_RADIUS;
}






class Emitter {
  constructor() { this.solids = []; this.lights = []; this.dropped = 0; }

  
  
  box(anchor, { lx = 0, y, lz = 0, w, h, d, lit, shade }) {
    const s = Math.sin(anchor.yaw), c = Math.cos(anchor.yaw);
    const box = {
      x: anchor.x + lx * c + lz * s,
      y, z: anchor.z - lx * s + lz * c,
      w, h, d, yaw: anchor.yaw, lit, shade,
    };
    if (!allowed(box)) { this.dropped++; return null; }
    this.solids.push(box);
    return box;
  }

  
  
  light(anchor, { lx, y, lz, w, h, hex }) {
    const s = Math.sin(anchor.yaw), c = Math.cos(anchor.yaw);
    this.lights.push({
      x: anchor.x + lx * c + lz * s,
      y, z: anchor.z - lx * s + lz * c,
      w, h, yaw: anchor.yaw, hex,
    });
  }
}









function ringWalk(rng, band, place) {
  const start = rng.rangeF(0, TAU);
  let a = 0;
  let guard = 0;
  
  
  
  
  
  let run = band.clump ? rng.rangeI(band.clump[0], band.clump[1]) : Infinity;
  while (a < TAU && guard++ < 500) {
    const w = rng.rangeF(band.w[0], band.w[1]);
    const r = rng.rangeF(band.r[0], band.r[1]) + RING_SHIFT;
    const theta = start + a;
    place({
      theta, r, w,
      x: CENTRE.x + Math.cos(theta) * r,
      z: CENTRE.z + Math.sin(theta) * r,
      yaw: inwardYaw(theta),
    });
    a += Math.max(w * 0.35, w + rng.rangeF(band.gap[0], band.gap[1])) / r;
    if (band.clump && --run <= 0) {
      a += rng.rangeF(band.clumpGap[0], band.clumpGap[1]) / r;
      run = rng.rangeI(band.clump[0], band.clump[1]);
    }
  }
}

function anchorAt(turn, r) {
  const theta = turn * TAU;
  return {
    theta, r,
    x: CENTRE.x + Math.cos(theta) * r,
    z: CENTRE.z + Math.sin(theta) * r,
    yaw: inwardYaw(theta),
  };
}





function tower(em, rng, band, spot, win) {
  const { lit, shade } = band;
  const g = BACKDROP.GROUND_Y;
  const d = rng.rangeF(band.d[0], band.d[1]);
  const h = rng.rangeF(band.h[0], band.h[1]);
  const shaft = em.box(spot, { y: g, w: spot.w, h, d, lit, shade });
  if (!shaft) return;

  
  
  
  let topY = g + h, tw = spot.w, td = d, off = 0;
  const steps = rng.chance(band.setback ?? 0) ? rng.rangeI(1, 2) : 0;
  for (let i = 0; i < steps; i++) {
    const sh = h * rng.rangeF(0.14, 0.32);
    tw *= rng.rangeF(0.6, 0.84);
    td *= rng.rangeF(0.62, 0.86);
    off += rng.rangeF(-1, 1) * (spot.w - tw) * 0.18;
    em.box(spot, { lx: off, y: topY, w: tw, h: sh, d: td, lit, shade });
    topY += sh;
  }

  switch (rng.pick(band.crowns ?? ['flat'])) {
    case 'water-tower': {
      
      const tx = off + rng.rangeF(-1, 1) * tw * 0.22;
      em.box(spot, { lx: tx, y: topY, w: 1.0, h: 2.0, d: 1.0, lit, shade });
      em.box(spot, { lx: tx, y: topY + 2.0, w: 2.6, h: 3.2, d: 2.6, lit, shade });
      break;
    }
    case 'penthouse':
      em.box(spot, { lx: off, y: topY, w: tw * 0.5, h: rng.rangeF(2.5, 4.5),
                     d: td * 0.5, lit, shade });
      break;
    case 'step':
      em.box(spot, { lx: off, y: topY, w: tw * 0.66, h: h * rng.rangeF(0.08, 0.18),
                     d: td * 0.66, lit, shade });
      break;
    case 'spire':
      em.box(spot, { lx: off, y: topY, w: 1.4, h: h * rng.rangeF(0.16, 0.34),
                     d: 1.4, lit, shade });
      break;
    case 'twin-mast':
      for (const s of [-1, 1]) {
        em.box(spot, { lx: off + s * tw * 0.3, y: topY, w: 0.8,
                       h: h * rng.rangeF(0.1, 0.2), d: 0.8, lit, shade });
      }
      break;
    default: break;
  }

  if (band.windows > 0 && win) towerWindows(em, rng, band, spot, win, h, d);
}







function towerWindows(em, rng, band, spot, win, h, d) {
  const bias = rng.rangeF(win.bias[0], win.bias[1]);
  const p = Math.min(0.95, band.windows * bias);
  const usableW = spot.w - win.margin * 2;
  const cols = Math.floor(usableW / win.colPitch);
  if (cols < 1) return;
  const floors = Math.floor((h - win.sill - 1.5) / win.floorPitch);
  if (floors < 1) return;
  const x0 = -(cols - 1) * win.colPitch / 2;
  const face = d / 2 + 0.12;
  const crownBand = rng.chance(win.crownLit) ? floors - rng.rangeI(1, 2) : -99;

  for (let f = 0; f < floors; f++) {
    const dark = f !== crownBand && rng.chance(win.darkFloor);
    if (dark) continue;
    const y = BACKDROP.GROUND_Y + win.sill + f * win.floorPitch;
    for (let c = 0; c < cols; c++) {
      if (f !== crownBand && !rng.chance(p)) continue;
      em.light(spot, {
        lx: x0 + c * win.colPitch, y: y + win.h / 2, lz: face,
        w: win.w, h: win.h,
        hex: rng.chance(win.coolMix) ? win.cool : rng.pick(win.warm),
      });
    }
  }
}






function conifer(em, rng, band, spot) {
  const { lit, shade } = band;
  const h = rng.rangeF(band.h[0], band.h[1]);
  const seg = h / 4;
  let y = BACKDROP.GROUND_Y;
  for (const k of [1.0, 0.74, 0.5, 0.26]) {
    em.box(spot, { y, w: spot.w * k, h: seg * rng.rangeF(0.92, 1.12),
                   d: spot.w * k, lit, shade });
    y += seg;
  }
}




function canopy(em, rng, band, spot) {
  const { lit, shade } = band;
  const h = rng.rangeF(band.h[0], band.h[1]);
  em.box(spot, { y: BACKDROP.GROUND_Y, w: spot.w, h: h * 0.62,
                 d: spot.w * rng.rangeF(0.7, 1.1), lit, shade });
  em.box(spot, {
    lx: rng.rangeF(-1, 1) * spot.w * 0.22, y: BACKDROP.GROUND_Y + h * 0.62,
    w: spot.w * rng.rangeF(0.5, 0.85), h: h * 0.38,
    d: spot.w * rng.rangeF(0.5, 0.85), lit, shade,
  });
}

function shrub(em, rng, band, spot) {
  em.box(spot, { y: BACKDROP.GROUND_Y, w: spot.w,
                 h: rng.rangeF(band.h[0], band.h[1]),
                 d: spot.w * rng.rangeF(0.6, 1.1),
                 lit: band.lit, shade: band.shade });
}




function peak(em, rng, band, spot) {
  const h = rng.rangeF(band.h[0], band.h[1]);
  
  
  
  
  
  const steps = rng.rangeI(9, 14);
  const capFrom = band.cap > 0 ? Math.ceil(steps * (1 - band.cap)) : steps + 1;
  let y = BACKDROP.GROUND_Y, off = 0;
  for (let i = 0; i < steps; i++) {
    
    
    const k = Math.pow(1 - i / steps, 1.35);
    const snow = i >= capFrom;
    const w = spot.w * Math.max(0.06, k);
    
    
    off += rng.rangeF(-1, 1) * spot.w * 0.03;
    em.box(spot, {
      lx: off, y, w, h: h / steps * rng.rangeF(0.92, 1.1),
      d: w * rng.rangeF(0.7, 1.05),
      lit: snow ? band.capLit : band.lit,
      shade: snow ? band.capShade : band.shade,
    });
    y += h / steps;
  }
}




function ridge(em, rng, band, spot) {
  const { lit, shade } = band;
  const n = rng.rangeI(3, 7);
  const seg = spot.w / n;
  for (let i = 0; i < n; i++) {
    if (rng.chance(0.18)) continue;               
    em.box(spot, {
      lx: -spot.w / 2 + seg * (i + 0.5), y: BACKDROP.GROUND_Y,
      w: seg * rng.rangeF(0.7, 1.0),
      h: rng.rangeF(band.h[0], band.h[1]),
      d: rng.rangeF(2.5, 6), lit, shade,
    });
  }
}






function berg(em, rng, band, spot) {
  const g = BACKDROP.GROUND_Y;
  const h = rng.rangeF(band.h[0], band.h[1]);
  const d = spot.w * rng.rangeF(0.5, 0.95);
  const tier = rng.chance(0.66);
  const mainW = tier ? spot.w * rng.rangeF(0.5, 0.7) : spot.w;
  const side = rng.chance(0.5) ? -1 : 1;
  const cap = (y, w, dd, lx) => {
    if (!band.cap) return;
    
    em.box(spot, { lx, y, w: w * 0.96, h: Math.max(2.2, h * 0.13), d: dd * 0.96,
                   lit: band.cap, shade: band.shade });
  };
  const mainX = tier ? side * (spot.w - mainW) / 2 : 0;
  em.box(spot, { lx: mainX, y: g, w: mainW, h, d, lit: band.lit, shade: band.shade });
  cap(g + h, mainW, d, mainX);
  if (tier) {
    const lowW = spot.w - mainW;
    const lowH = h * rng.rangeF(0.3, 0.62);
    const lowX = -side * mainW / 2;
    em.box(spot, { lx: lowX, y: g, w: lowW, h: lowH, d: d * rng.rangeF(0.7, 1),
                   lit: band.lit, shade: band.shade });
    cap(g + lowH, lowW, d * 0.85, lowX);
  }
}



function silo(em, rng, mark, spot) {
  const { lit, shade } = mark;
  em.box(spot, { y: BACKDROP.GROUND_Y, w: mark.w, h: mark.h, d: mark.w, lit, shade });
  
  em.box(spot, { y: BACKDROP.GROUND_Y + mark.h, w: mark.w * 0.92, h: mark.w * 0.32,
                 d: mark.w * 0.92, lit, shade });
  em.box(spot, { y: BACKDROP.GROUND_Y + mark.h + mark.w * 0.32, w: mark.w * 0.5,
                 h: mark.w * 0.26, d: mark.w * 0.5, lit, shade });
}

function farBarn(em, rng, mark, spot) {
  const { lit, shade } = mark;
  em.box(spot, { y: BACKDROP.GROUND_Y, w: mark.w, h: mark.h, d: mark.d, lit, shade });
  
  
  let y = BACKDROP.GROUND_Y + mark.h;
  for (const k of [0.86, 0.58, 0.28]) {
    em.box(spot, { y, w: mark.w * 0.99, h: mark.h * 0.16, d: mark.d * k, lit, shade });
    y += mark.h * 0.16;
  }
}






function fenceLine(em, rng, line, fence) {
  const theta = line.turn * TAU;
  const n = Math.floor((line.to - line.from) / line.postPitch);
  
  
  const from = line.from + RING_SHIFT;
  for (let i = 0; i <= n; i++) {
    const r = from + i * line.postPitch;
    
    
    const a = theta + line.drift * (i / Math.max(1, n));
    const spot = {
      x: CENTRE.x + Math.cos(a) * r, z: CENTRE.z + Math.sin(a) * r,
      yaw: inwardYaw(a),
    };
    em.box(spot, { y: BACKDROP.GROUND_Y, w: fence.postW, h: fence.postH,
                   d: fence.postW, lit: fence.lit, shade: fence.shade });
    if (i === n) continue;
    
    
    
    
    const rMid = r + line.postPitch / 2;
    const aMid = theta + line.drift * ((i + 0.5) / Math.max(1, n));
    const anchor = {
      x: CENTRE.x + Math.cos(aMid) * rMid, z: CENTRE.z + Math.sin(aMid) * rMid,
      yaw: inwardYaw(aMid) + Math.PI / 2,
    };
    for (const ry of [fence.railY, fence.railY * 0.52]) {
      em.box(anchor, { y: BACKDROP.GROUND_Y + ry, w: line.postPitch, h: fence.railH,
                       d: 0.3, lit: fence.lit, shade: fence.shade });
    }
  }
}

const FORMS = { tower, conifer, canopy, shrub, peak, ridge, berg };










export function generateBackdrop(mapId, seed = 1) {
  const spec = getBackdrop(mapId);
  if (!spec) return null;
  const em = new Emitter();
  const rng = new SeededRng((seed ^ 0x5EEDBACD) >>> 0);

  for (const band of spec.bands) {
    const form = FORMS[band.form];
    if (!form) continue;
    const bandRng = rng.child(`band:${band.id}`);
    ringWalk(bandRng, band, (spot) => form(em, bandRng, band, spot, spec.window));
  }

  for (const mark of spec.marks ?? []) {
    const spot = { ...anchorAt(mark.turn, mark.r + RING_SHIFT), w: mark.w };
    if (mark.form === 'silo') silo(em, rng, mark, spot);
    else if (mark.form === 'barn') farBarn(em, rng, mark, spot);
  }

  for (const line of spec.lines ?? []) fenceLine(em, rng, line, spec.fence);

  return {
    mapId, id: spec.id,
    
    
    
    dropped: em.dropped,
    skirt: {
      inner: { x0: 0, z0: 0, x1: WORLD_SIZE.x, z1: WORLD_SIZE.z },
      outer: BACKDROP.SKIRT_OUTER,
      y: BACKDROP.GROUND_Y,
      hex: spec.skirt,
    },
    solids: em.solids,
    lights: em.lights,
  };
}




export function faceShade(nx, ny, nz) {
  const [sx, sy, sz] = BACKDROP.SUN_DIR;
  const len = Math.hypot(sx, sy, sz);
  const d = (nx * sx + ny * sy + nz * sz) / len;
  
  
  
  return 0.5 + 0.5 * d;
}
