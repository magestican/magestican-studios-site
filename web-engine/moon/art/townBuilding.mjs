























































import { MeshData, compose, translate, rotateX, rotateY, rotateZ } from '../mesh/meshData.mjs';
import { emit, sweep, roundedRectProfile, circleProfile, lathe, roundedBox, taper } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { hex, vc, scaleC } from './kit/shade.mjs';
import { cornerPost } from './kit/post.mjs';
import { gableRoof } from './kit/roof.mjs';
import { steppingStone } from './kit/flowerBox.mjs';
import { canvasAwning } from './kit/canvasAwning.mjs';
import { displayStand, shopCounter, signBoard, hangingLantern } from './kit/shopFittings.mjs';
import { slatCrate } from './kit/workshop.mjs';
import { barrel } from './kit/decor/barrel.mjs';
import { buildingBody } from './kit/body.mjs';
import { rotY as rot2, boxRect, frameOf, round3 } from './kit/plan.mjs';

export const TIER = 'heroBuilding';
export const KINDS = ['emporium', 'market', 'townHall'];
export const STAGES = KINDS;
export const LODS = [0, 1, 2];

const STYLES = [
  { wall: '#f6d98f', roof: '#3f9e8e', trim: '#fff4e0', door: '#c95a42', post: '#b3845a', stand: '#d49a5c', counter: '#e8a25a', sign: '#fff1d6', paint: '#c9402f', awning: ['#e25a4f', '#fff3e0'], stone: '#cfc4b4', side: 1 },
  { wall: '#bcd8f0', roof: '#8a6cc0', trim: '#fff4e0', door: '#3f6f9e', post: '#a8784e', stand: '#c9955f', counter: '#7fb7d8', sign: '#f6d98f', paint: '#3f6f9e', awning: ['#4fae95', '#fffaf0'], stone: '#c8c8d4', side: -1 },
  { wall: '#f7c7b8', roof: '#e0674e', trim: '#fff4e0', door: '#5aa84a', post: '#8a5e3c', stand: '#d8a868', counter: '#f7dba0', sign: '#fff1d6', paint: '#7a5ec0', awning: ['#f2b640', '#7a6cc0'], stone: '#d4c8bc', side: 1 },
];
const AWNINGS = [['#e25a4f', '#fff3e0'], ['#4fae95', '#fffaf0'], ['#f2b640', '#7a6cc0'], ['#6a7fd0', '#fff3e0'], ['#e886a9', '#fffaf0']];
const WALLS = ['#f6d98f', '#bcd8f0', '#f7c7b8', '#bfe0a8', '#f5e2b0'];
const ROOFS = ['#3f9e8e', '#8a6cc0', '#e0674e', '#5d82c9', '#6fae6b'];

function styleFor(seed) {
  if (seed >= 1 && seed <= 3) return STYLES[seed - 1];
  const r = new SeededRng(seed).child('townStyle');
  const base = r.pick(STYLES);
  return { ...base, awning: r.pick(AWNINGS), wall: r.pick(WALLS), roof: r.pick(ROOFS), side: r.pick([-1, 1]) };
}



const T3 = [{ y: 0.55, z: 0.37, depth: 0.34 }, { y: 0.83, z: 0, depth: 0.34 }, { y: 1.11, z: -0.37, depth: 0.34 }];
const T2 = [{ y: 0.55, z: 0.185, depth: 0.34 }, { y: 0.83, z: -0.185, depth: 0.34 }];
const stripesFor = (width) => Math.max(4, Math.round(width / 0.37));

const kindOf = (stage) => {
  const kind = stage || KINDS[0];
  if (!KINDS.includes(kind)) throw new Error(`unknown town building '${kind}' (kinds: ${KINDS.join(', ')})`);
  return kind;
};



function design(kind, s) {
  if (kind === 'emporium') {
    const body = {
      W: 5.2, D: 3.0, wallH: 2.72, rise: 1.5, cz: -1.6, overhang: 0.34, sideDoor: -s,
      door: { x: 1.42 * s },
      
      
      
      windows: [{ x: -0.95 * s, y: 1.62, w: 1.68, h: 1.14, box: true }, { x: -2.05 * s, y: 2.02, w: 0.7, h: 0.6, shutters: true }],
    };
    return {
      body,
      awnings: [{ x: -0.25 * s, y: 2.52, z: -0.06, width: 4.5, depth: 1.04, drop: 0.27, hang: 0.22 }],
      
      
      
      counter: { x: -0.95 * s, z: 1.1, width: 1.35, depth: 0.58, height: 0.95 },
      keeper: { x: -0.95 * s, z: 0.36 },
      sign: { mount: 'roof', x: -0.5 * s, zl: 0.46, width: 2.55, height: 0.6, emblem: 'apple' },
      lantern: { x: 2.38 * s, y: 2.16, z: 0.12, rotY: (s * Math.PI) / 2 },
      crates: [{ x: 2.05 * s, z: 0.5, rotY: 0.28 * s }, { x: 2.52 * s, z: 0.02, rotY: -0.5 * s, small: true }],
      barrels: [{ x: 1.55 * s, z: 0.62, rotY: 0.2 * s }],
      stones: [{ x: 0, z: 0 }, { x: -0.1 * s, z: 0.56 }],
      rects: [[-body.W / 2 - 0.2, body.W / 2 + 0.2, body.cz - body.D / 2 - 0.2, body.cz + body.D / 2 + 0.1]],
    };
  }

  if (kind === 'market') {
    
    
    
    
    const W = 5.6, D = 2.4;
    const xs = [-2.3, 0.05, 2.25];
    const roof = { y: 2.56, length: W + 1.0, halfSpan: 1.78, rise: 1.02, cz: -0.2, thickness: 0.2, overhang: 0.24, tilt: 0 };
    
    
    const under = (z) => roof.y + roof.rise * (1 - Math.abs(z - roof.cz) / roof.halfSpan);
    
    const len = Math.hypot(roof.halfSpan, roof.rise);
    const over = (zl) => roof.y + roof.rise * (1 - Math.abs(zl) / roof.halfSpan) + (roof.thickness * len) / roof.halfSpan;
    return {
      hall: {
        W, D, roof, under,
        posts: [
          ...xs.map((x) => ({ x, z: 0.95, h: under(0.95) - 0.07 })),
          ...xs.map((x) => ({ x, z: -1.35, h: under(-1.35) - 0.07 })),
        ],
      },
      
      
      
      
      
      
      
      
      
      awnings: [{ x: 0, y: 2.46, z: 0.45, width: 5.1, depth: 0.95, drop: 0.2, hang: 0.14 }],
      
      
      counter: { x: 1.15 * s, z: 1.46, width: 2.0, depth: 0.6, height: 0.95 },
      keeper: { x: 1.15 * s, z: 0.25 },
      stands: [
        { x: -1.95 * s, z: -0.1, rotY: 0.18 * s, width: 1.5, tiers: T3, backboard: false },
        { x: 2.15 * s, z: -0.26, rotY: -0.36 * s, width: 1.15, tiers: T2, backboard: false },
      ],
      
      sign: { mount: 'eave', x: -0.45 * s, zl: 0.52, y: over(0.52), z: roof.cz + 0.52, width: 2.15, height: 0.56, emblem: 'jar' },
      lantern: { x: xs[0], y: under(0.95) - 0.5, z: 0.95, rotY: -Math.PI / 2 },
      crates: [{ x: -2.15 * s, z: -1.05, rotY: 0.22 * s }, { x: -1.45 * s, z: -1.2, rotY: -0.4 * s, small: true }],
      barrels: [{ x: 2.4 * s, z: -1.12, rotY: -0.3 * s }],
      stones: [{ x: 0.1, z: 0 }, { x: -0.06, z: 0.5 }],
      rects: [[-W / 2 - 0.45, W / 2 + 0.45, -D / 2 - 0.8, D / 2 + 0.4]],
    };
  }

  
  const body = {
    W: 6.0, D: 3.3, wallH: 3.0, rise: 1.6, cz: -1.75, overhang: 0.38, sideDoor: 0,
    door: { x: 0.35 * s },
    windows: [
      { x: -1.55, y: 1.7, w: 0.95, h: 1.24 },
      { x: 2.05, y: 1.7, w: 0.95, h: 1.24, shutters: true },
      { x: -2.55, y: 2.3, w: 0.62, h: 0.54 },
    ],
  };
  return {
    body,
    porch: { x: 0.35 * s, width: 2.85, halfSpan: 0.92, rise: 0.42, reach: 1.06, drop: 0.46 },
    
    
    
    
    
    tower: {
      x: -(body.W / 2 - 0.05) * s, z: body.cz + body.D / 2 + 0.34,
      half: 0.64, halfTop: 0.56, shaft: 4.7, belfry: 0.94, spire: 1.0,
      clock: { y: 3.62, r: 0.29 },
    },
    notice: { x: 2.72 * s, z: 1.34, width: 1.36, height: 0.88, rotY: -0.3 * s },
    
    keeper: { x: 1.3 * s, z: 1.45 },
    sign: { mount: 'roof', x: 1.05 * s, zl: 0.54, width: 2.3, height: 0.56, emblem: null },
    lantern: { x: 1.9 * s, y: 2.44, z: 0.02, rotY: (s * Math.PI) / 2 },
    steps: true,
    stones: [{ x: 0, z: 0.55 }],
    rects: [
      [-body.W / 2 - 0.22, body.W / 2 + 0.22, body.cz - body.D / 2 - 0.22, body.cz + body.D / 2 + 0.12],
      [-1.4, 1.4, 1.5, 1.95],
    ],
  };
}

function plan(seed, stage) {
  const style = styleFor(seed);
  const kind = kindOf(stage);
  const s = style.side;
  const d = design(kind, s);
  const rects = [...d.rects];
  for (const sd of d.stands || []) {
    const z0 = Math.min(...sd.tiers.map((t) => t.z - t.depth / 2)), z1 = Math.max(...sd.tiers.map((t) => t.z + t.depth / 2));
    rects.push(boxRect(sd.x, sd.z, [-sd.width / 2 - 0.03, sd.width / 2 + 0.03, z0 - 0.02, z1], sd.rotY));
  }
  const c = d.counter;
  if (c) rects.push([c.x - c.width / 2 - 0.08, c.x + c.width / 2 + 0.08, c.z - c.depth / 2, c.z + c.depth / 2 + 0.03]);
  if (d.tower) rects.push([d.tower.x - d.tower.half - 0.12, d.tower.x + d.tower.half + 0.12, d.tower.z - d.tower.half - 0.12, d.tower.z + d.tower.half + 0.12]);
  if (d.notice) rects.push(boxRect(d.notice.x, d.notice.z, [-d.notice.width / 2 - 0.08, d.notice.width / 2 + 0.08, -0.1, 0.1], d.notice.rotY));
  const frame = frameOf(rects);
  return { style, kind, s, d, frame };
}

export function anchors({ seed = 1, stage = KINDS[0] } = {}) {
  const { d, frame, kind } = plan(seed, stage);
  const { ox, oz, hx, hz } = frame;
  const P = (x, z) => ({ x: round3(x + ox), z: round3(z + oz) });
  const box = (x, z, bx, bz) => ({ ...P(x, z), hx: round3(bx), hz: round3(bz) });
  const blocks = [];
  if (d.body) blocks.push(box(0, d.body.cz, d.body.W / 2 + 0.02, d.body.D / 2 + 0.02));
  
  for (const post of (d.hall ? d.hall.posts : [])) blocks.push(box(post.x, post.z, 0.2, 0.2));
  if (d.counter) blocks.push(box(d.counter.x, d.counter.z, d.counter.width / 2 + 0.08, d.counter.depth / 2 + 0.06));
  for (const sd of d.stands || []) blocks.push(box(sd.x, sd.z, sd.width / 2 + 0.1, 0.45));
  if (d.tower) blocks.push(box(d.tower.x, d.tower.z, d.tower.half + 0.12, d.tower.half + 0.12));
  if (d.notice) blocks.push(box(d.notice.x, d.notice.z, d.notice.width / 2 + 0.08, 0.2));
  const zFront = hz - oz;
  
  const c = d.counter || { x: d.notice.x, z: d.notice.z, height: d.notice.height };
  const stop = P(c.x, (d.counter ? c.z + c.depth / 2 : c.z) + 0.52);
  return {
    footprint: { hx: round3(hx), hz: round3(hz) },
    blocks,
    front: P(c.x, zFront + 0.55),
    counter: { x: stop.x, y: c.height, z: stop.z, rotY: Math.PI },
    keeper: { ...P(d.keeper.x, d.keeper.z), heading: 0 },
    notice: d.notice ? { ...P(d.notice.x, d.notice.z), y: round3(0.52 + d.notice.height / 2), rotY: d.notice.rotY } : null,
  };
}







function bellTower(mesh, m, { spec, detail, rng, wallC, roofC, trimC, stoneC, ironC, snow }) {
  const { half, halfTop, shaft, belfry, spire, clock } = spec;
  const R = Math.SQRT2;
  const sq = (points) => lathe({ points, sides: 4, phase: Math.PI / 4 });

  emit(mesh, 'stone', sq([[(half + 0.1) * R, 0], [(half + 0.09) * R, 0.34], [half * R, 0.42]]), { matrix: m, color: vc(stoneC, { useTag: true, groundAO: 0.2 }) });
  emit(mesh, 'plank', sq([[half * R, 0.38], [(half - 0.02) * R, shaft * 0.5], [halfTop * R, shaft], [halfTop * R, shaft]]), { matrix: m, color: vc(wallC, { useTag: true, groundAO: 0.18, groundFade: 0.85 }) });

  
  
  if (detail < 2) {
    const cm = compose(m, compose(translate(0, clock.y, halfTop * 1.02), rotateX(Math.PI / 2)));
    const sides = detail === 0 ? 10 : 7;
    emit(mesh, 'wood', lathe({ points: [[clock.r, 0], [clock.r, 0.06], [clock.r - 0.06, 0.07]], sides }), { matrix: cm, color: vc(trimC, { groundAO: 0 }) });
    emit(mesh, 'paper', lathe({ points: [[clock.r - 0.04, 0.04], [clock.r - 0.05, 0.062], [0.005, 0.062]], sides }), { matrix: cm, color: vc(hex('#fdf6e6'), { groundAO: 0, underside: 0.4 }) });
    const face = compose(m, translate(0, clock.y, halfTop * 1.02 + 0.035));
    if (detail === 0) {
      for (let h = 0; h < 4; h++) {
        const a = (h * Math.PI) / 2;
        const mark = sweep({ profile: circleProfile(0.014, 3), path: [[Math.sin(a) * clock.r * 0.82, Math.cos(a) * clock.r * 0.82, 0], [Math.sin(a) * clock.r * 0.62, Math.cos(a) * clock.r * 0.62, 0]], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.01 });
        emit(mesh, 'metal', mark, { matrix: face, color: vc(ironC, { groundAO: 0 }) });
      }
    }
    for (const [len, ang, w] of [[clock.r * 0.52, -0.55, 0.028], [clock.r * 0.8, 2.2, 0.021]]) {
      const hand = sweep({ profile: circleProfile(w, 4), path: [[0, 0, 0], [Math.sin(ang) * len, Math.cos(ang) * len, 0.004]], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.014 });
      emit(mesh, 'metal', hand, { matrix: face, color: vc(scaleC(ironC, 0.6), { groundAO: 0 }) });
    }
  }

  
  
  
  const by = shaft, bw = halfTop + 0.06;
  if (detail < 2) {
    const pier = 0.13;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        emit(mesh, 'wood', lathe({ points: [[pier * R, 0], [pier * R, belfry], [pier * 0.8 * R, belfry]], sides: 4, phase: Math.PI / 4 }), {
          matrix: compose(m, translate(sx * (bw - pier), by, sz * (bw - pier))), color: vc(trimC, { groundAO: 0 }),
        });
      }
    }
    const bell = lathe({ points: [[0.005, 0], [0.15, 0.025], [0.175, 0.12], [0.125, 0.28], [0.05, 0.35], [0.022, 0.37]], sides: detail === 0 ? 8 : 6 });
    emit(mesh, 'copper', bell, { matrix: compose(m, translate(0, by + belfry * 0.26, 0)), color: vc(hex('#c98a4a'), { groundAO: 0, underside: 0.3 }) });
    const yoke = sweep({ profile: roundedRectProfile(0.05, 0.05, 0.015, 0), path: [[-bw * 0.7, by + belfry * 0.78, 0], [bw * 0.7, by + belfry * 0.77, 0]], up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.03 });
    emit(mesh, 'metal', yoke, { matrix: m, color: vc(ironC, { groundAO: 0 }) });
  } else {
    
    emit(mesh, 'wood', sq([[bw * R, 0], [bw * R, belfry], [(bw - 0.05) * R, belfry]]), { matrix: compose(m, translate(0, by, 0)), color: vc(trimC, { groundAO: 0 }) });
  }
  
  emit(mesh, 'wood', sq([[(bw + 0.08) * R, -0.1], [(bw + 0.08) * R, 0.04], [bw * R, 0.08]]), { matrix: compose(m, translate(0, by, 0)), color: vc(trimC, { groundAO: 0 }) });

  
  const cy = by + belfry;
  emit(mesh, 'roof', sq([[(bw + 0.16) * R, 0], [(bw + 0.13) * R, 0.08], [0.02 * R, spire]]), { matrix: compose(m, translate(0, cy, 0)), color: vc(roofC, { groundAO: 0, underside: 0.4 }) });
  if (snow && detail < 2) {
    emit(mesh, 'snow', sq([[(bw + 0.14) * R, 0.03], [0.03 * R, spire * 0.9]]), { matrix: compose(m, translate(0, cy + 0.02, 0)), color: vc(snow, { groundAO: 0, underside: 0.5 }) });
  }
  if (detail < 2) {
    const pole = sweep({ profile: circleProfile(0.024, 4), path: [[0, cy + spire - 0.06, 0], [0, cy + spire + 0.52, 0]], up: [0, 0, 1], caps: 'round', capSegments: 1, capLength: 0.03 });
    emit(mesh, 'metal', pole, { matrix: m, color: vc(ironC, { groundAO: 0 }) });
    const fly = 0.5, drop = 0.11;
    const flag = sweep({
      profile: roundedRectProfile(0.012, 0.27, 0.006, 0),
      path: [[0.03, cy + spire + 0.36, 0], [0.03 + fly * 0.5, cy + spire + 0.36 - drop * 0.4, 0.06], [0.03 + fly, cy + spire + 0.36 - drop, -0.02]],
      up: [0, 1, 0], caps: 'none',
    });
    emit(mesh, 'cloth', flag, { matrix: compose(m, rotateY(rng.rangeF(-0.5, 0.5))), color: vc(hex('#e25a4f'), { groundAO: 0, underside: 0.5 }) });
  }
}



function noticeBoard(mesh, m, { spec, detail, rng, woodC, boardC, paintC, roofC, snow }) {
  const { width, height } = spec;
  const hw = width / 2;
  const legRng = rng.child('legs');
  for (const sgn of [-1, 1]) {
    const leg = cornerPost({ height: height + 0.52, radius: 0.065, detail: Math.min(2, detail + 1), rng: legRng });
    emit(mesh, 'wood', leg, { matrix: compose(m, translate(sgn * (hw - 0.1), 0, 0)), color: vc(woodC, { groundAO: 0.28 }) });
  }
  const cy = height / 2 + 0.52;
  const board = roundedBox({ size: [width, height, 0.07], radius: 0.035, segments: [detail === 0 ? 2 : 1, detail === 0 ? 2 : 1, 1] });
  emit(mesh, 'plank', board, { matrix: compose(m, translate(0, cy, 0.035)), color: vc(boardC, { useTag: true, groundAO: 0, underside: 0.3 }) });
  if (detail < 2) {
    
    for (let i = 0; i < (detail === 0 ? 3 : 2); i++) {
      const w = rng.rangeF(0.22, 0.31), h = rng.rangeF(0.26, 0.34);
      const sheet = roundedBox({ size: [w, h, 0.012], radius: 0.01, segments: [1, 1, 1] });
      const x = -hw + 0.22 + i * ((width - 0.46) / 2.2), y = cy + rng.rangeF(-0.12, 0.1);
      emit(mesh, 'paper', sheet, { matrix: compose(m, compose(translate(x, y, 0.078), rotateZ(rng.rangeF(-0.14, 0.14)))), color: vc(hex('#fdf6e6'), { groundAO: 0, underside: 0.4 }) });
    }
    
    const hood = roundedBox({ size: [width + 0.16, 0.08, 0.34], radius: 0.03, segments: [1, 1, 1] });
    emit(mesh, 'roof', hood, { matrix: compose(m, compose(translate(0, cy + height / 2 + 0.1, 0.14), rotateX(-0.28))), color: vc(roofC, { groundAO: 0, underside: 0.4 }) });
    if (snow) emit(mesh, 'snow', roundedBox({ size: [width + 0.1, 0.05, 0.28], radius: 0.02, segments: [1, 1, 1] }), { matrix: compose(m, compose(translate(0, cy + height / 2 + 0.16, 0.14), rotateX(-0.28))), color: vc(snow, { groundAO: 0, underside: 0.5 }) });
    
    const crest = lathe({ points: [[0.001, 0], [0.09, 0.03], [0.1, 0.1], [0.001, 0.17]], sides: detail === 0 ? 8 : 5 });
    emit(mesh, 'wood', crest, { matrix: compose(m, compose(translate(hw - 0.2, cy + height / 2 - 0.22, 0.08), rotateX(Math.PI / 2))), color: vc(paintC, { groundAO: 0 }) });
  }
}

export function generate({ seed = 1, season = 'summer', stage = KINDS[0], lod = 0 } = {}) {
  const { style: st, kind, d, frame, s } = plan(seed, stage);
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child(`town-${kind}`);
  const pal = seasonPalette(season);
  const snow = season === 'winter' ? hex(pal.snow[0]) : null;
  const mesh = new MeshData(`townBuilding-${kind}-${seed}-${season}-lod${detail}`);
  const R = translate(frame.ox, 0, frame.oz);
  const at = (x, y, z, a = 0) => compose(R, a ? compose(translate(x, y, z), rotateY(a)) : translate(x, y, z));
  const postC = hex(st.post), trimC = hex(st.trim), roofC = hex(st.roof), wallC = hex(st.wall), iron = hex('#4a4658');

  let body = null;
  if (d.body) {
    body = buildingBody(mesh, {
      ...d.body, root: R, detail, rng: rng.child('body'), season, pal, snow,
      wallColor: wallC, trimColor: trimC, roofColor: roofC, doorColor: hex(st.door),
    });
  }

  if (d.hall) {
    
    const h = d.hall;
    const postRng = rng.child('posts');
    for (const p of h.posts) {
      const post = cornerPost({ height: p.h, radius: 0.13, detail: p.z < 0 ? Math.min(2, detail + 1) : detail, rng: postRng });
      emit(mesh, 'wood', post, { matrix: at(p.x, 0, p.z), color: vc(postC, { groundAO: 0.25 }) });
    }
    const rm = compose(at(0, h.roof.y, h.roof.cz), rotateX(h.roof.tilt));
    gableRoof(mesh, rm, {
      length: h.roof.length, halfSpan: h.roof.halfSpan, rise: h.roof.rise, thickness: 0.22, overhang: 0.3,
      rows: detail === 0 ? 5 : 3, detail, rng: rng.child('roof'), color: roofC, ridgeColor: scaleC(roofC, 0.72),
      sag: 0.09, snowColor: snow,
    });
    if (detail < 2) {
      
      const beam = sweep({ profile: roundedRectProfile(0.11, 0.09, 0.03, 0), path: h.posts.slice(0, 3).map((p, i) => [p.x, p.h - 0.16 - i * 0.012, p.z]), up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.05 });
      emit(mesh, 'wood', beam, { matrix: R, color: vc(postC, { groundAO: 0 }) });
    }
  }

  if (d.porch && body) {
    const p = d.porch;
    
    
    
    
    const pm = at(p.x, body.wallTop - p.drop, body.frontZ);
    gableRoof(mesh, pm, {
      length: p.width, halfSpan: p.halfSpan, rise: p.rise, thickness: 0.16, overhang: 0.18, rows: 3,
      detail: Math.min(2, detail + 1), cols: 3, rng: rng.child('porch'), color: roofC,
      ridgeColor: scaleC(roofC, 0.72), sag: 0.05, snowColor: detail === 2 ? null : snow,
    });
    if (detail < 2) {
      const pr = rng.child('porchPosts');
      const pz = body.frontZ + p.reach;
      for (const sgn of [-1, 1]) {
        const post = cornerPost({ height: body.wallTop - p.drop - 0.08, radius: 0.12, detail: Math.min(2, detail + 1), rng: pr });
        emit(mesh, 'wood', post, { matrix: at(p.x + sgn * (p.width / 2 - 0.16), 0, pz), color: vc(trimC, { groundAO: 0.25 }) });
      }
      const beam = sweep({ profile: roundedRectProfile(0.11, 0.11, 0.03, 0), path: [[p.x - p.width / 2, body.wallTop - p.drop - 0.14, pz], [p.x + p.width / 2, body.wallTop - p.drop - 0.15, pz]], up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.05 });
      emit(mesh, 'wood', beam, { matrix: R, color: vc(trimC, { groundAO: 0 }) });
    }
  }

  if (d.tower) {
    bellTower(mesh, at(d.tower.x, 0, d.tower.z), { spec: d.tower, detail, rng: rng.child('tower'), wallC, roofC, trimC, stoneC: hex(st.stone), ironC: iron, snow });
  }

  for (const [i, a] of (d.awnings || []).entries()) {
    canvasAwning(mesh, at(a.x, a.y, a.z), {
      width: a.width, depth: a.depth, drop: a.drop, hang: a.hang, stripes: stripesFor(a.width),
      colors: st.awning.map(hex), detail, rng: rng.child(`awning${i}`), barColor: postC, snowColor: snow,
    });
  }

  (d.stands || []).forEach((sd, i) => {
    displayStand(mesh, at(sd.x, 0, sd.z, sd.rotY), { width: sd.width, tiers: sd.tiers, detail, rng: rng.child(`stand${i}`), color: hex(st.stand), riserColor: hex(st.counter), backboard: sd.backboard });
  });

  if (d.counter) {
    const c = d.counter;
    shopCounter(mesh, at(c.x, 0, c.z), {
      width: c.width, height: c.height, depth: c.depth, detail, rng: rng.child('counter'),
      color: hex(st.counter), topColor: hex('#c99a66'), postColor: trimC, bellColor: hex('#e6b84a'), boxColor: hex(st.paint), snowColor: snow,
    });
  }

  if (d.notice) {
    noticeBoard(mesh, at(d.notice.x, 0, d.notice.z, d.notice.rotY), {
      spec: d.notice, detail, rng: rng.child('notice'), woodC: postC, boardC: hex(st.sign), paintC: hex(st.paint), roofC, snow,
    });
  }

  const sg = d.sign;
  const signOpts = {
    width: sg.width, height: sg.height, detail, rng: rng.child('sign'), boardColor: hex(st.sign), rimColor: postC,
    paintColor: hex(st.paint), emblemColor: hex('#de3b36'), leafColor: hex('#5aa84a'), emblem: sg.emblem, snowColor: snow,
  };
  if (sg.mount === 'eave') {
    
    signBoard(mesh, compose(at(sg.x, sg.y + sg.height / 2 + 0.14, sg.z), rotateX(-0.1)), signOpts);
    if (detail < 2) {
      for (const sgn of [-1, 1]) {
        const lx = sg.x + sgn * sg.width * 0.3;
        const leg = sweep({ profile: roundedRectProfile(0.07, 0.06, 0.02, 0), path: [[lx, sg.y - 0.06, sg.z - 0.07], [lx, sg.y + sg.height / 2 + 0.14, sg.z - 0.06]], up: [0, 0, 1], caps: ['none', 'round'], capSegments: 1, capLength: 0.03 });
        emit(mesh, 'wood', leg, { matrix: R, color: vc(postC, { groundAO: 0 }) });
      }
    }
  } else if (sg.mount === 'hang') {
    
    signBoard(mesh, at(sg.x, sg.y, sg.z), signOpts);
    if (detail < 2) {
      for (const sgn of [-1, 1]) {
        const hx = sg.x + sgn * sg.width * 0.32;
        const hang = sweep({ profile: circleProfile(0.017, 4), path: [[hx, sg.y + sg.height * 0.52, sg.z], [hx, sg.y + sg.height * 0.52 + 0.24, sg.z]], up: [0, 0, 1], caps: 'round', capSegments: 1, capLength: 0.02 });
        emit(mesh, 'metal', hang, { matrix: R, color: vc(iron, { groundAO: 0 }) });
      }
    }
  } else if (body) {
    const zw = d.body.cz + sg.zl;
    const bottom = body.roofTopAt(sg.x, sg.zl) - 0.08;
    const cy = bottom + 0.17 + sg.height / 2;
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
    for (const [i, cr] of (d.crates || []).entries()) {
      slatCrate(mesh, at(cr.x, 0, cr.z, cr.rotY), { detail, rng: rng.child(`crate${i}`), color: hex(cr.small ? '#b07a4c' : '#c08a55'), ...(cr.small ? { width: 0.44, depth: 0.36, height: 0.34 } : {}) });
    }
    for (const [i, br] of (d.barrels || []).entries()) {
      barrel(mesh, at(br.x, 0, br.z, br.rotY), { detail, rng: rng.child(`barrel${i}`), woodColor: hex('#b3845a'), hoopColor: iron, lidColor: hex('#8a5e3c'), snowColor: snow });
    }
    const stepRng = rng.child('steps');
    const zFront = frame.hz - frame.oz;
    if (d.steps && body) {
      
      for (let i = 0; i < 2; i++) {
        const tread = roundedBox({ size: [2.1 - i * 0.28, 0.13, 0.42 - i * 0.05], radius: 0.05, segments: [detail === 0 ? 2 : 1, 1, 1] });
        emit(mesh, 'stone', tread, { matrix: at(d.porch.x + (i ? 0.04 * s : 0), 0.065 + i * 0.12, body.frontZ + 0.52 - i * 0.3), color: vc(hex(st.stone), { useTag: true, groundAO: 0.2 }) });
      }
    }
    for (const [i, stn] of (d.stones || []).entries()) {
      if (detail === 1 && i > 0) break;
      const cx = (d.counter || d.notice).x;
      const stone = steppingStone({ rng: stepRng, size: 0.54 - i * 0.05, detail });
      emit(mesh, 'stone', stone, { matrix: at(cx + stn.x + stepRng.rangeF(-0.05, 0.05), 0, zFront + 0.34 + stn.z, stepRng.rangeF(0, Math.PI)), color: vc(hex(pal.stone[season === 'winter' ? 0 : 1]), { groundAO: 0.1 }) });
    }
  }
  return mesh;
}
