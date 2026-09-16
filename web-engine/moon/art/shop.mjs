





































import { MeshData, compose, translate, rotateX, rotateY } from '../mesh/meshData.mjs';
import { emit, sweep, roundedRectProfile } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { hex, vc, scaleC } from './kit/shade.mjs';
import { cornerPost } from './kit/post.mjs';
import { gableRoof } from './kit/roof.mjs';
import { steppingStone } from './kit/flowerBox.mjs';
import { canvasAwning } from './kit/canvasAwning.mjs';
import { displayStand, shopCounter, signBoard, hangingLantern } from './kit/shopFittings.mjs';
import { slatCrate } from './kit/workshop.mjs';
import { buildingBody } from './kit/body.mjs';
import { rotY, boxRect, frameOf, round3, levelOf } from './kit/plan.mjs';

export const TIER = 'heroBuilding';
export const STAGES = ['level1', 'level2', 'level3'];
export const LODS = [0, 1, 2];

const STYLES = [
  { awning: ['#e25a4f', '#fff3e0'], wall: '#f6d98f', roof: '#3f9e8e', trim: '#fff4e0', door: '#3f9e8e', post: '#b3845a', stand: '#d49a5c', counter: '#e8a25a', sign: '#fff1d6', paint: '#c9402f', accent: '#c95a42', side: 1 },
  { awning: ['#4fae95', '#fffaf0'], wall: '#f7c7b8', roof: '#e0674e', trim: '#fff4e0', door: '#c95a42', post: '#a8784e', stand: '#c9955f', counter: '#7fb7d8', sign: '#3f6f9e', paint: '#ffe7a8', accent: '#e6b84a', side: -1 },
  { awning: ['#f2b640', '#7a6cc0'], wall: '#bcd8f0', roof: '#8a6cc0', trim: '#fff4e0', door: '#e6b84a', post: '#8a5e3c', stand: '#d8a868', counter: '#f7dba0', sign: '#f6d98f', paint: '#5a3f8a', accent: '#6a7fd0', side: 1 },
];
const AWNINGS = [['#e25a4f', '#fff3e0'], ['#4fae95', '#fffaf0'], ['#f2b640', '#7a6cc0'], ['#6a7fd0', '#fff3e0'], ['#e886a9', '#fffaf0']];
const WALLS = ['#f6d98f', '#f7c7b8', '#bcd8f0', '#bfe0a8', '#f5e2b0'];
const ROOFS = ['#3f9e8e', '#e0674e', '#8a6cc0', '#5d82c9', '#6fae6b'];

function styleFor(seed) {
  if (seed >= 1 && seed <= 3) return STYLES[seed - 1];
  const r = new SeededRng(seed).child('shopStyle');
  const base = r.pick(STYLES);
  return { ...base, awning: r.pick(AWNINGS), wall: r.pick(WALLS), roof: r.pick(ROOFS), side: r.pick([-1, 1]) };
}

const T3 = [{ y: 0.55, z: 0.37, depth: 0.34 }, { y: 0.83, z: 0, depth: 0.34 }, { y: 1.11, z: -0.37, depth: 0.34 }];
const T2 = [{ y: 0.55, z: 0.185, depth: 0.34 }, { y: 0.83, z: -0.185, depth: 0.34 }];
const stripesFor = (width) => Math.max(4, Math.round(width / 0.37));








function design(level, s) {
  if (level === 1) {
    return {
      stall: { posts: [[-1.5 * s, 0.7, 2.32], [1.5 * s, 0.7, 2.32], [-1.5 * s, -0.72, 3.35], [1.5 * s, -0.72, 3.35]] },
      awnings: [{ x: 0, y: 2.74, z: -0.8, width: 3.35, depth: 1.75, drop: 0.3, hang: 0.22 }],
      stands: [{ x: -0.45 * s, z: 0.35, rotY: 0, width: 1.9, tiers: T3, backboard: true }],
      counter: { x: 1.02 * s, z: 0.615, width: 0.9, depth: 0.55, height: 0.95 },
      sign: { mount: 'posts', x: 0.06 * s, y: 3.02, z: -0.55, width: 3.24, height: 0.5 },
      lantern: { x: -1.61 * s, y: 2.05, z: 0.7, rotY: (-s * Math.PI) / 2 },
      crates: [{ x: 1.12 * s, z: -0.3, rotY: 0.3 * s }],
      rects: [[-1.66, 1.66, -0.9, 0.84]],
    };
  }
  if (level === 2) {
    const body = { W: 4.4, D: 2.1, wallH: 2.55, rise: 1.3, cz: -1.2, overhang: 0.32, sideDoor: s, windows: [{ x: 0.3 * s, y: 1.66, w: 1.2, h: 0.7, box: true }, { x: -1.35 * s, y: 1.92, w: 0.75, h: 0.58, shutters: true }] };
    return {
      body,
      awnings: [{ x: 0, y: 2.45, z: -0.12, width: 4.75, depth: 0.95, drop: 0.25, hang: 0.2 }],
      stands: [
        { x: -1.3 * s, z: 0.55, rotY: 0, width: 1.6, tiers: T3, backboard: true },
        { x: 1.62 * s, z: 0.72, rotY: -0.18 * s, width: 1.15, tiers: T2 },
      ],
      counter: { x: 0.3 * s, z: 0.8, width: 1.05, depth: 0.55, height: 0.95 },
      sign: { mount: 'roof', x: -0.35 * s, zl: 0.42, width: 2.1, height: 0.56 },
      lantern: { x: -2.34 * s, y: 2.1, z: -0.15, rotY: (-s * Math.PI) / 2 },
      stones: [{ x: 0.3 * s, z: 0 }, { x: 0.18 * s, z: 0.56 }],
      rects: [[-body.W / 2 - 0.2, body.W / 2 + 0.2, body.cz - body.D / 2 - 0.2, body.cz + body.D / 2 + 0.1]],
    };
  }
  const body = { W: 5.8, D: 2.5, wallH: 2.7, rise: 1.5, cz: -1.4, overhang: 0.35, sideDoor: 0, windows: [{ x: 0, y: 1.7, w: 1.0, h: 0.72, box: true }, { x: -1.95 * s, y: 1.94, w: 0.8, h: 0.56 }, { x: 1.95 * s, y: 1.94, w: 0.8, h: 0.56, shutters: true }] };
  return {
    body,
    porch: { x: 0 },
    awnings: [
      { x: -1.95 * s, y: 2.5, z: -0.12, width: 2.05, depth: 0.95, drop: 0.26, hang: 0.22 },
      { x: 1.95 * s, y: 2.64, z: -0.12, width: 1.85, depth: 0.9, drop: 0.24, hang: 0.2 },
    ],
    stands: [
      { x: -1.95 * s, z: 0.55, rotY: 0, width: 1.6, tiers: T3, backboard: true },
      { x: 1.9 * s, z: 0.55, rotY: 0, width: 1.5, tiers: T3, backboard: true },
      { x: -3.55 * s, z: 0.62, rotY: 0.4 * s, width: 1.05, tiers: T2 },
    ],
    counter: { x: 0, z: 0.8, width: 1.1, depth: 0.55, height: 0.95 },
    sign: { mount: 'roof', x: -0.3 * s, zl: 0.5, width: 2.6, height: 0.62 },
    lantern: { x: 0.93 * s, y: 2.2, z: 0.83, rotY: (s * Math.PI) / 2 },
    stones: [{ x: 0.05, z: 0 }, { x: -0.12, z: 0.55 }],
    rects: [[-body.W / 2 - 0.2, body.W / 2 + 0.2, body.cz - body.D / 2 - 0.2, body.cz + body.D / 2 + 0.1], [-0.92, 0.92, 0.7, 0.96]],
  };
}

function plan(seed, stage) {
  const style = styleFor(seed);
  const level = levelOf(STAGES, stage);
  const s = style.side;
  const d = design(level, s);
  const rects = [...d.rects];
  for (const sd of d.stands) {
    const z0 = Math.min(...sd.tiers.map((t) => t.z - t.depth / 2)), z1 = Math.max(...sd.tiers.map((t) => t.z + t.depth / 2));
    rects.push(boxRect(sd.x, sd.z, [-sd.width / 2 - 0.03, sd.width / 2 + 0.03, z0 - 0.02, z1], sd.rotY));
  }
  const c = d.counter;
  rects.push([c.x - c.width / 2 - 0.08, c.x + c.width / 2 + 0.08, c.z - c.depth / 2, c.z + c.depth / 2 + 0.03]);
  const frame = frameOf(rects);
  return { style, level, s, d, frame };
}

export function anchors({ seed = 1, stage = 'level1' } = {}) {
  const { d, frame, s } = plan(seed, stage);
  const { ox, oz, hx, hz } = frame;
  const P = (x, z) => ({ x: round3(x + ox), z: round3(z + oz) });
  const shelves = [];
  for (const sd of d.stands) {
    for (const t of sd.tiers) {
      const [dx, dz] = rotY(0, t.z, sd.rotY);
      shelves.push({ ...P(sd.x + dx, sd.z + dz), y: t.y, rotY: sd.rotY, width: round3(sd.width - 0.16), depth: t.depth });
    }
  }
  const zFront = hz - oz; 
  const xMin = -hx - ox, xMax = hx - ox;
  const first = d.stands[0];
  const start = s > 0 ? xMin - 0.9 : xMax + 0.9, away = s > 0 ? xMax + 0.9 : xMin - 0.9;
  const stop = P(d.counter.x, zFront + 0.45);
  return {
    footprint: { hx: round3(hx), hz: round3(hz) },
    front: P(first.x, zFront + 0.6),
    shelves,
    counter: { x: stop.x, y: d.counter.height, z: stop.z, rotY: Math.PI },
    customerPath: [P(start, zFront + 2.2), P(first.x, zFront + 1.25), stop, P(away, zFront + 2.2)],
  };
}

export function generate({ seed = 1, season = 'summer', stage = 'level1', lod = 0 } = {}) {
  const { style: st, d, frame } = plan(seed, stage);
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('shop');
  const pal = seasonPalette(season);
  const snow = season === 'winter' ? hex(pal.snow[0]) : null;
  const mesh = new MeshData(`shop-${seed}-${stage}-${season}-lod${detail}`);
  const R = translate(frame.ox, 0, frame.oz);
  const at = (x, y, z, a = 0) => compose(R, a ? compose(translate(x, y, z), rotateY(a)) : translate(x, y, z));
  const postC = hex(st.post), trimC = hex(st.trim), roofC = hex(st.roof), iron = hex('#4a4658');

  let body = null;
  if (d.body) {
    body = buildingBody(mesh, {
      ...d.body, root: R, detail, rng: rng.child('body'), season, pal, snow,
      wallColor: hex(st.wall), trimColor: trimC, roofColor: roofC, doorColor: hex(st.door),
    });
  }

  if (d.stall) {
    const postRng = rng.child('posts');
    for (const [x, z, h] of d.stall.posts) {
      const post = cornerPost({ height: h, radius: 0.12, detail: z < 0 ? Math.min(2, detail + 1) : detail, rng: postRng });
      emit(mesh, 'wood', post, { matrix: at(x, 0, z), color: vc(postC, { groundAO: 0.25 }) });
    }
    if (detail < 2) {
      const rail = sweep({ profile: roundedRectProfile(0.1, 0.08, 0.03, 0), path: [[-1.62, 2.7, -0.8], [0, 2.72, -0.8], [1.62, 2.69, -0.8]], up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.04 });
      emit(mesh, 'wood', rail, { matrix: R, color: vc(postC, { groundAO: 0 }) });
    }
  }

  if (d.porch && body) {
    const px = d.porch.x;
    const pm = compose(at(px, body.wallTop - 0.3, body.frontZ + 0.2), rotateY(Math.PI / 2));
    gableRoof(mesh, pm, {
      length: 1.9, halfSpan: 0.8, rise: 0.5, thickness: 0.18, overhang: 0.18, rows: 3, detail: Math.min(2, detail + 1), cols: 2,
      rng: rng.child('porch'), color: roofC, ridgeColor: scaleC(roofC, 0.72), sag: 0.05, snowColor: detail === 2 ? null : snow,
    });
    if (detail < 2) {
      const pr = rng.child('porchPosts');
      const pz = body.frontZ + 0.98;
      for (const sgn of [-1, 1]) {
        const post = cornerPost({ height: body.wallTop - 0.36, radius: 0.11, detail: Math.min(2, detail + 1), rng: pr });
        emit(mesh, 'wood', post, { matrix: at(px + sgn * 0.78, 0, pz), color: vc(trimC, { groundAO: 0.25 }) });
      }
      const beam = sweep({ profile: roundedRectProfile(0.1, 0.1, 0.03, 0), path: [[px - 0.86, body.wallTop - 0.42, pz], [px + 0.86, body.wallTop - 0.43, pz]], up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.05 });
      emit(mesh, 'wood', beam, { matrix: R, color: vc(trimC, { groundAO: 0 }) });
    }
  }

  d.awnings.forEach((a, i) => {
    canvasAwning(mesh, at(a.x, a.y, a.z), {
      width: a.width, depth: a.depth, drop: a.drop, hang: a.hang, stripes: stripesFor(a.width), colors: st.awning.map(hex),
      detail, rng: rng.child(`awning${i}`), barColor: postC, snowColor: snow,
    });
  });

  d.stands.forEach((sd, i) => {
    displayStand(mesh, at(sd.x, 0, sd.z, sd.rotY), { width: sd.width, tiers: sd.tiers, detail, rng: rng.child(`stand${i}`), color: hex(st.stand), riserColor: hex(st.counter), backboard: sd.backboard });
  });

  const c = d.counter;
  shopCounter(mesh, at(c.x, 0, c.z), {
    width: c.width, height: c.height, depth: c.depth, detail, rng: rng.child('counter'),
    color: hex(st.counter), topColor: hex('#c99a66'), postColor: trimC, bellColor: hex('#e6b84a'), boxColor: hex(st.accent), snowColor: snow,
  });

  const sg = d.sign;
  const signOpts = {
    width: sg.width, height: sg.height, detail, rng: rng.child('sign'), boardColor: hex(st.sign), rimColor: postC,
    paintColor: hex(st.paint), emblemColor: hex('#de3b36'), leafColor: hex('#5aa84a'), emblem: 'apple', snowColor: snow,
  };
  if (sg.mount === 'posts') {
    signBoard(mesh, at(sg.x, sg.y, sg.z), signOpts);
  } else if (body) {
    const zw = d.body.cz + sg.zl;
    const bottom = body.roofTopAt(sg.x, sg.zl) - 0.08;
    const cy = bottom + 0.16 + sg.height / 2;
    signBoard(mesh, compose(at(sg.x, cy, zw), rotateX(-0.12)), signOpts);
    if (detail < 2) {
      for (const sgn of [-1, 1]) {
        const lx = sg.x + sgn * sg.width * 0.3;
        const leg = sweep({ profile: roundedRectProfile(0.07, 0.06, 0.02, 0), path: [[lx, body.roofTopAt(lx, sg.zl - 0.08) - 0.12, zw - 0.08], [lx, cy, zw - 0.07]], up: [0, 0, 1], caps: ['none', 'round'], capSegments: 1, capLength: 0.03 });
        emit(mesh, 'wood', leg, { matrix: R, color: vc(postC, { groundAO: 0 }) });
      }
    }
  }

  if (d.lantern) {
    const l = d.lantern;
    hangingLantern(mesh, at(l.x, l.y, l.z, l.rotY), { detail, rng: rng.child('lantern'), ironColor: iron, glowColor: hex('#ffd38a'), capColor: scaleC(roofC, 0.9) });
  }

  if (detail < 2) {
    for (const [i, cr] of (d.crates || []).entries()) slatCrate(mesh, at(cr.x, 0, cr.z, cr.rotY), { detail, rng: rng.child(`crate${i}`), color: hex('#c08a55') });
    const stepRng = rng.child('steps');
    const zFront = frame.hz - frame.oz;
    for (const [i, stn] of (d.stones || []).entries()) {
      if (detail === 1 && i > 1) break;
      const stone = steppingStone({ rng: stepRng, size: 0.52 - i * 0.04, detail });
      emit(mesh, 'stone', stone, { matrix: at(d.counter.x + stn.x + stepRng.rangeF(-0.05, 0.05), 0, zFront + 0.35 + stn.z, stepRng.rangeF(0, Math.PI)), color: vc(hex(pal.stone[season === 'winter' ? 0 : 1]), { groundAO: 0.1 }) });
    }
  }
  return mesh;
}
