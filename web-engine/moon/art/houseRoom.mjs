



































import { MeshData, compose, translate, rotateX, rotateY, scale } from '../mesh/meshData.mjs';
import { emit, sweep, roundedRectProfile, circleProfile, lathe, deform } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { hex, vc, vary, mixC, scaleC, paintVertex } from './kit/shade.mjs';
import { wallPanel } from './kit/wall.mjs';
import { door } from './kit/door.mjs';
import { windowUnit } from './kit/window.mjs';
import { doormat } from './kit/homeDecor.mjs';
import { rod } from './kit/rod.mjs';
import { roomPlan, SPECIES } from './villagerHome.mjs';

export const TIER = 'house';
export const LODS = Object.freeze([0, 1, 2]);
export { SPECIES };




const CUT_H = 0.52;


const JAMB = 0.07;










export function anchors({ seed = 1, species = 'human' } = {}) {
  const p = roomPlan({ seed, species });
  const r3 = (v) => Math.round(v * 1000) / 1000;
  return Object.freeze({
    species, seed,
    hx: p.hx, hz: p.hz, wallH: p.wallH, ridgeY: r3(p.wallH + p.rise),
    door: p.door,
    
    
    spawn: Object.freeze({ x: r3(p.door.x), z: r3(-p.hz + 0.62), heading: 0 }),
    
    atDoor: Object.freeze({ x: r3(p.door.x), z: r3(-p.hz + 0.05) }),
    floor: Object.freeze({ hx: r3(Math.max(0.3, p.hx - 0.22)), hz: r3(Math.max(0.3, p.hz - 0.22)) }),
  });
}






function floorOf(mesh, c) {
  const { p, detail, rng } = c;
  const W = p.hx * 2, D = p.hz * 2;
  const panel = wallPanel({
    width: W, height: D, plankH: detail === 2 ? 0.5 : 0.3, lap: 0.018,
    detail, rng: rng.child('floor'), bulge: 0, cols: detail === 0 ? 4 : 2,
  });
  emit(mesh, 'plank', panel, {
    matrix: compose(translate(0, 0, p.hz), rotateX(-Math.PI / 2)),
    color: (pt, n, uv, tag) => mixC(paintVertex(c.floorC, pt, n, { groundAO: 0.18, groundFade: 0.5, mottle: 0.05, seed: 11 }), c.floorC, 0.15 * (1 - tag)),
  });
}


function wall(mesh, c, { width, height, gable = null, at, detail = c.detail, color = c.wallC }) {
  const panel = wallPanel({
    width, height, plankH: 0.26, lap: 0.035, detail,
    rng: c.rng.child(`wall-${Math.round(at[0] * 100)}-${Math.round(at[2] * 100)}-${Math.round(width * 100)}`),
    gable, bulge: 0.015, cols: detail === 0 ? 5 : detail === 1 ? 3 : 2,
  });
  emit(mesh, 'plank', panel, { matrix: at[3], color: vc(color, { useTag: true, groundAO: 0.24, underside: 0.3 }) });
}



function wallsOf(mesh, c) {
  const { p, detail } = c;
  const W = p.hx * 2, D = p.hz * 2, H = p.wallH;
  const gable = { eaveY: H, ridgeY: H + p.rise };
  const m = (x, y, z, rotY) => [x, y, z, compose(translate(x, y, z), rotateY(rotY))];

  
  
  const dw = p.door.w + JAMB * 2, dh = p.door.h + JAMB;
  const left = p.door.x - dw / 2 + p.hx;          
  const right = p.hx - (p.door.x + dw / 2);        
  if (left > 0.05) wall(mesh, c, { width: left, height: H, at: m(-p.hx + left / 2, 0, -p.hz, 0) });
  if (right > 0.05) wall(mesh, c, { width: right, height: H, at: m(p.hx - right / 2, 0, -p.hz, 0) });
  if (H - dh > 0.08) {
    
    const panel = wallPanel({
      width: dw, height: H - dh, plankH: 0.26, lap: 0.035, detail: Math.min(2, detail + 1),
      rng: c.rng.child('lintel'), bulge: 0, cols: 2,
    });
    emit(mesh, 'plank', panel, { matrix: translate(p.door.x, dh, -p.hz), color: vc(c.wallC, { useTag: true, groundAO: 0, underside: 0.3 }) });
  }

  
  wall(mesh, c, { width: D, height: H, gable, at: m(-p.hx, 0, 0, Math.PI / 2) });
  wall(mesh, c, { width: D, height: H, gable, at: m(p.hx, 0, 0, -Math.PI / 2), detail: Math.min(2, detail + 1) });

  
  wall(mesh, c, { width: W, height: CUT_H, at: m(0, 0, p.hz, Math.PI), detail: Math.min(2, detail + 1) });
  emit(mesh, 'wood', rod({
    path: [[-p.hx - 0.02, CUT_H + 0.02, p.hz - 0.03], [0, CUT_H + 0.028, p.hz - 0.035], [p.hx + 0.02, CUT_H + 0.018, p.hz - 0.03]],
    w: 0.09, h: 0.05, detail, up: [0, 1, 0], caps: 'round', capSegments: detail === 0 ? 1 : 0,
  }), { matrix: translate(0, 0, 0), color: vc(c.trimC, { groundAO: 0 }) });

  
  
  if (detail < 2) {
    const s = 0.035;
    const y = 0.055;
    emit(mesh, 'wood', rod({
      path: [[p.hx - s, y, p.hz - 0.06], [p.hx - s, y + 0.004, -p.hz + s], [-p.hx + s, y - 0.003, -p.hz + s], [-p.hx + s, y, p.hz - 0.06]],
      w: 0.075, h: 0.05, detail, up: [0, 1, 0], caps: 'none', corner: 0,
    }), { matrix: translate(0, 0, 0), color: vc(c.trimC, { groundAO: 0.35, groundFade: 0.12 }) });
  }
}




function ceilingOf(mesh, c) {
  const { p, detail } = c;
  const L = Math.hypot(p.hz, p.rise);
  const a = Math.atan2(p.hz, p.rise);
  const slopes = [
    { key: 'back', m: compose(translate(0, p.wallH, -p.hz), rotateX(a)) },
    { key: 'front', m: compose(translate(0, p.wallH, p.hz), compose(rotateY(Math.PI), rotateX(a))) },
  ];
  for (const s of slopes) {
    const panel = wallPanel({
      width: p.hx * 2, height: L, plankH: detail === 2 ? 0.45 : 0.28, lap: 0.02,
      detail: Math.min(2, detail + (s.key === 'front' ? 1 : 0)), rng: c.rng.child(`ceiling-${s.key}`), bulge: 0, cols: detail === 0 ? 4 : 2,
    });
    emit(mesh, 'plank', panel, { matrix: s.m, color: vc(c.ceilC, { useTag: true, groundAO: 0, underside: 0.12 }) });
  }
  
  emit(mesh, 'wood', rod({
    path: [[-p.hx - 0.02, p.wallH + p.rise - 0.02, 0], [0, p.wallH + p.rise - 0.055, 0.004], [p.hx + 0.02, p.wallH + p.rise - 0.025, -0.003]],
    w: 0.13, h: 0.1, detail, up: [0, 1, 0], caps: 'round', capSegments: detail === 0 ? 1 : 0,
  }), { matrix: translate(0, 0, 0), color: vc(c.beamC, { groundAO: 0, underside: 0.4 }) });
  
  const n = detail === 0 ? 3 : detail === 1 ? 2 : 1;
  const r = c.rng.child('ties');
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? r.rangeF(-0.2, 0.2) : (-p.hx * 0.62) + (i / (n - 1)) * p.hx * 1.24 + r.rangeF(-0.08, 0.08);
    const y = p.wallH + r.rangeF(0.02, 0.09);
    const sag = r.rangeF(0.012, 0.03);
    emit(mesh, 'wood', rod({
      path: [[x, y, -p.hz + 0.02], [x + r.rangeF(-0.02, 0.02), y - sag, 0], [x, y + r.rangeF(-0.01, 0.01), p.hz - 0.02]],
      w: r.rangeF(0.07, 0.095), h: r.rangeF(0.06, 0.085), detail, up: [0, 1, 0], caps: 'none',
    }), { matrix: translate(0, 0, 0), color: vc(vary(r, c.beamC, 0.06), { groundAO: 0, underside: 0.45 }) });
  }
}



function doorOf(mesh, c) {
  const { p, detail } = c;
  door(mesh, compose(translate(p.door.x, 0, -p.hz + 0.02), rotateY(0)), {
    width: p.door.w, height: p.door.h, detail, rng: c.rng.child('door'),
    color: c.doorC, frameColor: c.trimC, knobColor: hex(p.style.knob), ironColor: hex('#4a4658'),
    glassColor: hex('#7fb0d8'), porthole: p.door.porthole,
  });
  if (detail < 2) {
    doormat(mesh, translate(p.door.x + (p.door.x > 0 ? -0.06 : 0.06), 0.004, -p.hz + 0.46), {
      width: p.door.w + 0.1, depth: 0.42, detail, rng: c.rng.child('mat'), color: c.matC, material: 'canvas',
    });
  }
}




function windowOf(mesh, c) {
  const { p, detail } = c;
  if (detail === 2) return;
  const s = p.windowSide;
  const w = Math.min(0.78, p.hz * 0.8);
  const h = Math.min(0.78, (p.wallH - 0.75) * 0.9);
  const zOff = c.rng.child('win').rangeF(-0.12, 0.12) - 0.05;
  windowUnit(mesh, compose(translate(s * (p.hx - 0.035), 0.78 + h / 2, zOff), rotateY(-s * Math.PI / 2)), {
    width: w, height: h, kind: p.door.porthole ? 'round' : 'rect', muntins: 'cross', detail,
    rng: c.rng.child('window'), frameColor: c.trimC, glassColor: hex('#bfe2f2'), sill: true,
  });
}




function rugOf(mesh, c) {
  const { p, detail } = c;
  if (detail === 2) return;
  const r = c.rng.child('rug');
  const RX = Math.max(0.3, p.hx * 0.5), RZ = Math.max(0.24, p.hz * 0.46);
  const rings = detail === 0 ? 5 : 3;
  const turn = r.rangeF(-0.28, 0.28);
  const m = compose(translate(r.rangeF(-0.1, 0.12), 0, r.rangeF(-0.05, 0.16)), rotateY(turn));
  const cols = [c.rugA, c.rugB, mixC(c.rugA, c.rugB, 0.5)];
  
  
  const band = (RX / rings) * 1.2;
  for (let k = 0; k < rings; k++) {
    const f = (rings - k) / rings;
    const seg = detail === 0 ? 2 : 1;
    const path = roundedRectProfile(RX * 2 * f, RZ * 2 * f, Math.min(RX, RZ) * f * 0.85, seg)
      .map(([x, y], i) => [x * (1 + 0.035 * Math.sin(i * 1.7 + turn)), 0.011 + k * 0.0013, y * (1 + 0.03 * Math.cos(i * 2.3))]);
    const braid = sweep({
      profile: roundedRectProfile(0.026 - k * 0.001, band, 0.01, 0),
      path, closed: true, up: [0, 1, 0], uvScale: 3.2,
    });
    emit(mesh, 'canvas', braid, { matrix: m, color: vc(vary(r, cols[k % cols.length], 0.05), { groundAO: 0.1, groundFade: 0.05 }) });
  }
}




function lampOf(mesh, c) {
  const { p, detail } = c;
  if (detail === 2) return;
  const r = c.rng.child('lamp');
  const x = -p.door.x * 0.7 + r.rangeF(-0.1, 0.1);
  const z = r.rangeF(-0.12, 0.2);
  const top = p.wallH + p.rise - 0.08;
  const drop = Math.min(0.62, (p.wallH - 0.95) * 0.75 + 0.22);
  const y = top - drop;
  emit(mesh, 'metal', rod({
    path: [[x, top, z], [x + r.rangeF(-0.015, 0.015), y + 0.08, z + r.rangeF(-0.01, 0.01)]],
    w: 0.02, detail: 1, up: [0, 1, 0], caps: 'none',
  }), { matrix: translate(0, 0, 0), color: vc(hex('#4a4658'), { groundAO: 0 }) });
  const R = 0.17;
  const shade = lathe({
    points: [[0.03, y + 0.1], [R * 0.34, y + 0.075], [R * 0.86, y - 0.055], [R, y - 0.085], [R * 0.97, y - 0.1], [0.05, y - 0.05]],
    sides: detail === 0 ? 9 : 6, phase: r.rangeF(0, 1),
    radiusFn: (th, j, rad) => rad * (1 + 0.035 * Math.sin(th * 3 + r.rangeF(0, 1))),
  });
  emit(mesh, 'metal', shade, { matrix: translate(0, 0, 0), color: vc(c.lampC, { groundAO: 0, underside: 0.55 }) });
  const bulb = lathe({
    points: [[0, y - 0.055], [0.05, y - 0.075], [0.055, y - 0.11], [0.03, y - 0.14], [0, y - 0.145]],
    sides: detail === 0 ? 7 : 5, phase: r.rangeF(0, 1),
  });
  emit(mesh, 'lamp-glow', bulb, { matrix: translate(0, 0, 0), color: hex('#ffe6b4') });
}



export function generate({ seed = 1, season = 'summer', lod = 0, species = 'human' } = {}) {
  if (!SPECIES.includes(species)) throw new Error(`unknown house species '${species}' (species: ${SPECIES.join(', ')})`);
  const detail = Math.max(0, Math.min(2, lod | 0));
  const p = roomPlan({ seed, species });
  const pal = seasonPalette(season);
  const rng = new SeededRng(seed).child(`houseRoom-${species}`);
  
  
  
  const warm = hex(pal.sun ? pal.sun[0] : '#ffe6c0');
  const tone = (c, k, mix = 0.12) => mixC(scaleC(hex(c), k), warm, mix);
  const c = {
    p, detail, rng,
    wallC: tone(p.style.wall, 0.88),
    ceilC: tone(p.style.trim, 0.74, 0.18),
    floorC: tone(p.style.floor, 0.82, 0.1),
    beamC: tone(p.style.mat, 0.78, 0.08),
    trimC: tone(p.style.trim, 0.94, 0.16),
    doorC: tone(p.style.door, 0.9, 0.06),
    matC: tone(p.style.mat, 0.9),
    lampC: tone(p.style.roof, 0.85, 0.2),
    rugA: tone(p.style.door, 0.95, 0.08),
    rugB: tone(p.style.roof, 0.95, 0.08),
  };
  const mesh = new MeshData(`houseRoom-${species}-${seed}-${season}-lod${detail}`);
  floorOf(mesh, c);
  wallsOf(mesh, c);
  ceilingOf(mesh, c);
  doorOf(mesh, c);
  windowOf(mesh, c);
  rugOf(mesh, c);
  lampOf(mesh, c);
  return mesh;
}
