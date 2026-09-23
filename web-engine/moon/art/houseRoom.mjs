
































import { MeshData, compose, translate, rotateX, rotateY } from '../mesh/meshData.mjs';
import { emit, sweep, roundedRectProfile, lathe } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { hex, vc, vary, mixC, scaleC, paintVertex } from './kit/shade.mjs';
import { wallPanel } from './kit/wall.mjs';
import { door } from './kit/door.mjs';
import { windowUnit } from './kit/window.mjs';
import { doormat } from './kit/homeDecor.mjs';
import { rod } from './kit/rod.mjs';
import { fixture, FIXTURE_KINDS } from './kit/interiorFixtures.mjs';
import { interiorPlan, INTERIOR, SPECIES } from './interiorPlan.mjs';

export const TIER = 'interior';
export const LODS = Object.freeze([0, 1, 2]);
export { SPECIES };

const JAMB = 0.07;
const r3 = (v) => Math.round(v * 1000) / 1000;
const TURN = (n) => (n[1] === 1 ? 0 : n[1] === -1 ? Math.PI : n[0] === 1 ? Math.PI / 2 : -Math.PI / 2);











export function anchors({ seed = 1, species = 'human' } = {}) {
  const p = interiorPlan({ seed, species });
  return Object.freeze({
    species, seed,
    hx: p.hx, hz: p.hz, wallH: p.wallH,
    door: p.door,
    spawn: Object.freeze({ x: r3(p.door.x), z: r3(-p.hz + 0.62), heading: 0 }),
    atDoor: Object.freeze({ x: r3(p.door.x), z: r3(-p.hz + 0.05) }),
    floor: p.floor,
    plan: p,
  });
}



function floorOf(mesh, c) {
  const { p, detail, rng } = c;
  const panel = wallPanel({
    width: p.hx * 2, height: p.hz * 2, plankH: detail === 2 ? 0.6 : 0.32, lap: 0.018,
    detail: detail === 0 ? 0 : 2, rng: rng.child('floor'), bulge: 0, cols: 1, flat: true,
  });
  emit(mesh, 'plank', panel, {
    matrix: compose(translate(0, 0, p.hz), rotateX(-Math.PI / 2)),
    color: (pt, n, uv, tag) => mixC(paintVertex(c.floorC, pt, n, { groundAO: 0.18, groundFade: 0.5, mottle: 0.05, seed: 11 }), c.floorC, 0.15 * (1 - tag)),
  });
}



function face(mesh, c, { n, along, faceAt, width, height, y0 = 0, key, detail = c.detail, color = c.wallC, cols = 1 }) {
  if (width < 0.03 || height < 0.03) return;
  const panel = wallPanel({ width, height, plankH: 0.26, lap: 0.03, detail: detail === 0 ? 0 : 2, rng: c.rng.child(key), bulge: 0, cols, flat: true });
  const at = n[1] !== 0 ? translate(along, y0, faceAt) : translate(faceAt, y0, along);
  emit(mesh, 'plank', panel, { matrix: compose(at, rotateY(TURN(n))), color: vc(color, { useTag: true, groundAO: y0 > 0 ? 0 : 0.24, underside: 0.3 }) });
}



function railAlong(mesh, c, r, y, w) {
  const P = (a, yy) => (r.axis === 'x' ? [r.at, yy, a] : [a, yy, r.at]);
  const mid = (r.a0 + r.a1) / 2;
  emit(mesh, 'wood', rod({
    path: [P(r.a0, y), P(mid, y + 0.004), P(r.a1, y - 0.002)], w: 0.05, h: w, detail: c.detail, up: [0, 1, 0], caps: 'round', capSegments: 0,
  }), { color: vc(c.trimC, { groundAO: 0 }) });
}

function wallsOf(mesh, c) {
  const { p, detail } = c;
  const PT = INTERIOR.partT, H = p.wallH;
  for (const [i, r] of p.runs.entries()) {
    const along = (r.a0 + r.a1) / 2, width = r.a1 - r.a0, key = `run-${i}`;
    if (r.kind === 'outer') {
      face(mesh, c, { n: r.n, along, faceAt: r.at, width, height: r.h, key, detail, cols: r.axis === 'x' && detail === 0 ? 3 : 1 });
    } else if (r.kind === 'cut') {
      face(mesh, c, { n: r.n, along, faceAt: r.at, width, height: r.h, key, detail: Math.min(2, detail + 1) });
      railAlong(mesh, c, { ...r, at: r.at - 0.03 }, r.h + 0.02, 0.09);
    } else {
      
      const n0 = r.axis === 'x' ? [1, 0] : [0, 1];
      const lod = r.kind === 'low' ? Math.min(2, detail + 1) : detail;
      face(mesh, c, { n: n0, along, faceAt: r.at + PT / 2, width, height: r.h, key: `${key}a`, detail: lod });
      face(mesh, c, { n: [-n0[0], -n0[1]], along, faceAt: r.at - PT / 2, width, height: r.h, key: `${key}b`, detail: lod });
      railAlong(mesh, c, r, r.h - 0.005, PT + 0.04);
    }
  }
  
  
  const dw = p.door.w + JAMB * 2, dh = p.door.h + JAMB;
  if (H - dh > 0.08) face(mesh, c, { n: [0, 1], along: p.door.x, faceAt: -p.hz, width: dw, height: H - dh, y0: dh, key: 'lintel', detail: Math.min(2, detail + 1) });
  for (const [i, d] of p.doorways.entries()) {
    if (H - d.h > 0.06) {
      for (const s of [1, -1]) face(mesh, c, { n: [s, 0], along: d.z, faceAt: d.at + s * PT / 2, width: d.w, height: H - d.h, y0: d.h, key: `head-${i}-${s}`, detail: Math.min(2, detail + 1) });
      railAlong(mesh, c, { axis: 'x', at: d.at, a0: d.z - d.w / 2 - 0.01, a1: d.z + d.w / 2 + 0.01 }, H - 0.005, PT + 0.04);
    }
    if (detail < 2) {
      const z0 = d.z - d.w / 2 + 0.025, z1 = d.z + d.w / 2 - 0.025, top = Math.min(d.h, H - 0.02);
      emit(mesh, 'wood', rod({
        path: [[d.at, 0, z0], [d.at, top, z0], [d.at, top, z1], [d.at, 0, z1]], w: 0.05, h: PT + 0.05, detail, up: [1, 0, 0], caps: 'none', corner: 0,
      }), { color: vc(c.trimC, { groundAO: 0.2 }) });
    }
  }
  
  if (detail < 2) {
    const s = 0.035, y = 0.055;
    emit(mesh, 'wood', rod({
      path: [[p.hx - s, y, p.hz - 0.06], [p.hx - s, y + 0.004, -p.hz + s], [-p.hx + s, y - 0.003, -p.hz + s], [-p.hx + s, y, p.hz - 0.06]],
      w: 0.075, h: 0.05, detail, up: [0, 1, 0], caps: 'none', corner: 0,
    }), { color: vc(c.trimC, { groundAO: 0.35, groundFade: 0.12 }) });
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



function windowAt(mesh, c, f, i) {
  const { detail } = c;
  if (detail === 2) return;
  const n = [Math.round(Math.sin(f.rotY)), Math.round(Math.cos(f.rotY))];
  
  const wx = f.x - n[0] * (f.d / 2 - 0.035), wz = f.z - n[1] * (f.d / 2 - 0.035);
  windowUnit(mesh, compose(translate(wx, f.y + f.h / 2, wz), rotateY(f.rotY)), {
    width: f.w, height: f.h, kind: c.p.door.porthole && f.room === 'hall' ? 'round' : 'rect', muntins: f.room === 'bathroom' ? 'none' : 'cross', detail,
    rng: c.rng.child(`window-${i}`), frameColor: c.trimC, glassColor: hex('#bfe2f2'), sill: true,
  });
}



function rugAt(mesh, c, f, i) {
  const { detail } = c;
  if (detail === 2) return;
  const r = c.rng.child(`rug-${i}`);
  const RX = f.w / 2, RZ = f.d / 2;
  const rings = detail === 0 ? 4 : 3;
  const m = compose(translate(f.x, 0, f.z), rotateY(f.rotY));
  const cols = i % 2 ? [c.rugB, c.rugC, c.rugA] : [c.rugA, c.rugB, mixC(c.rugA, c.rugC, 0.5)];
  const band = (Math.min(RX, RZ) / rings) * 1.2;
  for (let k = 0; k < rings; k++) {
    const t = (rings - k) / rings;
    const path = roundedRectProfile(RX * 2 * t, RZ * 2 * t, Math.min(RX, RZ) * t * 0.85, detail === 0 ? 2 : 1)
      .map(([x, y], j) => [x * (1 + 0.03 * Math.sin(j * 1.7 + i)), 0.011 + k * 0.0013, y * (1 + 0.03 * Math.cos(j * 2.3))]);
    const braid = sweep({ profile: roundedRectProfile(0.026 - k * 0.001, band, 0.01, 0), path, closed: true, up: [0, 1, 0], uvScale: 3.2 });
    emit(mesh, 'canvas', braid, { matrix: m, color: vc(vary(r, cols[k % cols.length], 0.05), { groundAO: 0.1, groundFade: 0.05 }) });
  }
}



function lampAt(mesh, c, f) {
  const { p, detail } = c;
  if (detail === 2) return;
  const r = c.rng.child('lamp');
  const x = f.x, z = f.z;
  const y = Math.min(1.42, p.wallH - 0.2) + r.rangeF(-0.04, 0.03);
  const lean = [r.rangeF(-0.025, 0.025), r.rangeF(-0.02, 0.02)];
  const at = (dx, dz) => translate(x + dx, 0, z + dz);
  const foot = lathe({
    points: [[0, 0.045], [0.07, 0.042], [0.12, 0.02], [0.125, 0.004], [0, 0.0]],
    sides: detail === 0 ? 9 : 6, phase: r.rangeF(0, 1),
    radiusFn: (th, j, rad) => rad * (1 + 0.03 * Math.sin(th * 2 + r.rangeF(0, 1))),
  });
  emit(mesh, 'metal', foot, { matrix: at(0, 0), color: vc(hex('#4a4658'), { groundAO: 0.3 }) });
  emit(mesh, 'metal', rod({
    path: [[x, 0.04, z], [x + lean[0] * 0.4, y * 0.55, z + lean[1] * 0.4], [x + lean[0], y + 0.06, z + lean[1]]],
    w: 0.024, detail: 1, up: [1, 0, 0], caps: 'none',
  }), { color: vc(hex('#4a4658'), { groundAO: 0.2 }) });
  const R = 0.19;
  const shade = lathe({
    points: [[0.04, y + 0.16], [R * 0.62, y + 0.15], [R * 0.9, y + 0.02], [R, y - 0.04], [R * 0.97, y - 0.05], [0.06, y + 0.02]],
    sides: detail === 0 ? 9 : 6, phase: r.rangeF(0, 1),
    radiusFn: (th, j, rad) => rad * (1 + 0.035 * Math.sin(th * 3 + r.rangeF(0, 1))),
  });
  emit(mesh, 'canvas', shade, { matrix: at(lean[0], lean[1]), color: vc(c.lampC, { groundAO: 0, underside: 0.55 }) });
  const bulb = lathe({ points: [[0, y + 0.12], [0.045, y + 0.1], [0.05, y + 0.06], [0.03, y + 0.03], [0, y + 0.025]], sides: detail === 0 ? 7 : 5, phase: r.rangeF(0, 1) });
  emit(mesh, 'lamp-glow', bulb, { matrix: at(lean[0], lean[1]), color: hex('#ffe6b4') });
}

function fixturesOf(mesh, c) {
  const { p, detail } = c;
  for (const [i, f] of p.fixtures.entries()) {
    if (f.kind === 'window') { windowAt(mesh, c, f, i); continue; }
    if (f.kind === 'rug') { rugAt(mesh, c, f, i); continue; }
    if (f.kind === 'lamp') { lampAt(mesh, c, f); continue; }
    if (!FIXTURE_KINDS.includes(f.kind)) continue;
    
    
    if (detail === 2 && !['stove', 'counter', 'tub', 'bed', 'table'].includes(f.kind)) continue;
    
    
    const m = compose(translate(f.x, f.y, f.z), rotateY(f.rotY));
    fixture(mesh, f.kind, m, {
      size: { w: f.w, d: f.d, h: f.h }, detail, rng: c.rng.child(`fx-${f.kind}-${i}`), c: c.fx,
      spin: f.spin || 0, flueTop: p.wallH - 0.08,
    });
  }
}



export function generate({ seed = 1, season = 'summer', lod = 0, species = 'human' } = {}) {
  if (!SPECIES.includes(species)) throw new Error(`unknown house species '${species}' (species: ${SPECIES.join(', ')})`);
  const detail = Math.max(0, Math.min(2, lod | 0));
  const p = interiorPlan({ seed, species });
  const pal = seasonPalette(season);
  const rng = new SeededRng(seed).child(`houseRoom-${species}`);
  
  
  
  const warm = hex(pal.sun ? pal.sun[0] : '#ffe6c0');
  const tone = (col, k, mix = 0.12) => mixC(scaleC(hex(col), k), warm, mix);
  const s = p.style;
  const c = {
    p, detail, rng,
    wallC: tone(s.wall, 0.88),
    floorC: tone(s.floor, 0.82, 0.1),
    trimC: tone(s.trim, 0.94, 0.16),
    doorC: tone(s.door, 0.9, 0.06),
    matC: tone(s.mat, 0.9),
    lampC: tone(s.roof, 0.85, 0.2),
    rugA: tone(s.door, 0.95, 0.08),
    rugB: tone(s.roof, 0.95, 0.08),
    rugC: tone(s.knob, 0.9, 0.1),
  };
  c.fx = {
    wood: tone(s.mat, 0.95, 0.1),
    darkWood: tone(s.mat, 0.72, 0.06),
    top: tone(s.floor, 1.02, 0.12),
    stone: tone(pal.stone ? pal.stone[1] : '#a39a90', 0.9, 0.1),
    iron: hex('#4a4658'),
    fire: hex('#ffb060'),
    ceramic: tone('#f4efe6', 0.97, 0.06),
    brass: tone(s.knob, 0.95, 0.05),
    mirror: tone('#d8e6ee', 1, 0.05),
    trim: c.trimC,
    towel: tone(s.roof, 0.95, 0.12),
    sheet: tone('#f6f1e6', 0.96, 0.08),
    blanket: tone(s.door, 0.92, 0.1),
    pillow: tone('#fbf6ec', 0.98, 0.05),
    jarA: tone(s.roof, 0.9, 0.1),
    jarB: tone(s.door, 0.9, 0.1),
    book: tone(s.wall, 0.7, 0.05),
  };
  const mesh = new MeshData(`houseRoom-${species}-${seed}-${season}-lod${detail}`);
  floorOf(mesh, c);
  wallsOf(mesh, c);
  doorOf(mesh, c);
  fixturesOf(mesh, c);
  return mesh;
}
