















import { Shape, sweep, lathe, blob, emit, roundedRectProfile, circleProfile } from '../../mesh/bevel.mjs';
import { compose, translate, rotateZ } from '../../mesh/meshData.mjs';
import { wallPanel } from './wall.mjs';
import { cornerPost } from './post.mjs';
import { vc, vary, scaleC, hex } from './shade.mjs';



export function filletLoop(pts, r, segs, skip = () => false) {
  if (!segs) return pts.map((q) => q.slice());
  const out = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const P = pts[(i - 1 + n) % n], V = pts[i], N = pts[(i + 1) % n];
    if (skip(i)) { out.push(V.slice()); continue; }
    const la = Math.hypot(P[0] - V[0], P[1] - V[1]), lb = Math.hypot(N[0] - V[0], N[1] - V[1]);
    const rr = Math.min(r, la * 0.45, lb * 0.45);
    const A = [V[0] + ((P[0] - V[0]) / la) * rr, V[1] + ((P[1] - V[1]) / la) * rr];
    const B = [V[0] + ((N[0] - V[0]) / lb) * rr, V[1] + ((N[1] - V[1]) / lb) * rr];
    for (let k = 0; k <= segs; k++) {
      const t = k / segs, u = 1 - t;
      out.push([u * u * A[0] + 2 * u * t * V[0] + t * t * B[0], u * u * A[1] + 2 * u * t * V[1] + t * t * B[1]]);
    }
  }
  return out;
}


export function insetLoop(pts, d) {
  const n = pts.length;
  const unit = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  return pts.map((V, i) => {
    const P = pts[(i - 1 + n) % n], N = pts[(i + 1) % n];
    const e1 = unit(V[0] - P[0], V[1] - P[1]), e2 = unit(N[0] - V[0], N[1] - V[1]);
    const n1 = [-e1[1], e1[0]], n2 = [-e2[1], e2[0]];
    const mdir = unit(n1[0] + n2[0], n1[1] + n2[1]);
    const c = Math.max(0.35, mdir[0] * n1[0] + mdir[1] * n1[1]);
    return [V[0] + (mdir[0] * d) / c, V[1] + (mdir[1] * d) / c];
  });
}




export function plate(mesh, material, m, { loop, th, star, color, rim = true, rimMaterial = material, rimColor = color, uv = (x, y) => [x, y], detail = 0 }) {
  const face = insetLoop(loop, rim ? th * 0.3 : 0);
  for (const sgn of [1, -1]) {
    const s = new Shape();
    const z = sgn * (th / 2 - 0.002);
    const c = s.add([star[0], star[1], z], uv(star[0], star[1]));
    const ring = face.map(([x, y]) => s.add([x, y, z], uv(x, y)));
    for (let k = 0; k < ring.length; k++) {
      const a = ring[k], b = ring[(k + 1) % ring.length];
      if (sgn > 0) s.tri(c, a, b); else s.tri(c, b, a);
    }
    emit(mesh, material, s, { matrix: m, color });
  }
  if (rim) {
    const tube = sweep({ profile: roundedRectProfile(th, th * 0.7, th * 0.3, detail === 0 ? 1 : 0), path: loop.map(([x, y]) => [x, y, 0]), closed: true, up: [0, 0, 1] });
    emit(mesh, rimMaterial, tube, { matrix: m, color: rimColor });
  }
}

const BOARD_T = 0.055;






export function displayStand(mesh, m, { width, tiers, detail = 0, rng, color, riserColor = null, backboard = false }) {
  const cheekC = scaleC(vary(rng, color, 0.04), 0.8);
  const riserC = riserColor || scaleC(color, 0.85);
  tiers.forEach((t, i) => {
    const c = vary(rng, color, 0.07);
    const tilt = rng.rangeF(-0.006, 0.006);
    const path = [[-width / 2, t.y - BOARD_T / 2 - tilt, t.z], [width / 2, t.y - BOARD_T / 2 + tilt, t.z]];
    const board = sweep({ profile: roundedRectProfile(BOARD_T, t.depth, 0.02, detail === 0 ? 1 : 0), path, up: [0, 1, 0], caps: 'round', capSegments: 0, capLength: 0.025 });
    emit(mesh, 'wood', board, { matrix: m, color: vc(c, { groundAO: 0.2 }) });
    const prev = tiers[i - 1];
    
    if (detail === 2 && prev) return;
    const below = prev ? prev.y - 0.03 : 0.02;
    const top = t.y + 0.02, h = top - below;
    const zr = prev ? prev.z - prev.depth / 2 + 0.006 : t.z + t.depth / 2 - 0.012;
    const riser = sweep({ profile: roundedRectProfile(h, 0.028, 0.01, 0), path: [[-width / 2 + 0.07, below + h / 2, zr], [width / 2 - 0.07, below + h / 2 + rng.rangeF(-0.004, 0.004), zr]], up: [0, 1, 0], caps: 'round', capSegments: 0, capLength: 0.01 });
    emit(mesh, 'wood', riser, { matrix: m, color: vc(vary(rng, riserC, 0.04), { groundAO: 0.35 }) });
  });

  
  const first = tiers[0], last = tiers[tiers.length - 1];
  const zF = first.z + first.depth / 2 - 0.02, zB = last.z - last.depth / 2 + 0.02;
  const pts = [[zB, 0], [zF, 0]];
  tiers.forEach((t, i) => {
    const zFront = i === 0 ? zF : t.z + t.depth / 2 - 0.02;
    if (i > 0) pts.push([zFront, tiers[i - 1].y - BOARD_T * 0.6]);
    pts.push([zFront, t.y - BOARD_T * 0.6]);
  });
  pts.push([zB, last.y - BOARD_T * 0.6]);
  const loop = filletLoop(pts, 0.05, detail === 0 ? 2 : detail === 1 ? 1 : 0, (i) => i < 2);
  const sideX = width / 2 - 0.05;
  for (const sgn of [-1, 1]) {
    const M = compose(m, [0, 0, sgn, sgn * sideX, 0, 1, 0, 0, 1, 0, 0, 0]);
    
    
    plate(mesh, 'wood', M, { loop, th: 0.045, star: [zB + 0.05, 0.05], color: vc(cheekC, { groundAO: 0.3 }), rim: detail < 2, detail: Math.max(1, detail), uv: (x, y) => [x * 0.9, y * 0.9] });
  }

  if (backboard && detail < 2) {
    const panel = wallPanel({ width: width - 0.04, height: 0.32, plankH: 0.16, detail: detail + 1, rng: rng.child('backboard'), cols: 3, bulge: 0.01 });
    emit(mesh, 'plank', panel, { matrix: compose(m, translate(0, last.y - 0.02, zB - 0.025)), color: vc(scaleC(color, 0.9), { useTag: true, groundAO: 0 }) });
  }
}

export function shopCounter(mesh, m, { width = 1, height = 0.95, depth = 0.55, detail = 0, rng, color, topColor, postColor, bellColor, boxColor, snowColor = null }) {
  const d1 = Math.min(2, detail + 1);
  const front = wallPanel({ width, height: height - 0.05, plankH: 0.21, detail, rng: rng.child('front'), cols: detail === 0 ? 4 : 2, bulge: 0.015 });
  emit(mesh, 'plank', front, { matrix: compose(m, translate(0, 0, depth / 2 - 0.02)), color: vc(color, { useTag: true, groundAO: 0.25 }) });
  const sides = [
    compose(translate(width / 2, 0, 0), [0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0]),
    compose(translate(-width / 2, 0, 0), [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0]),
    compose(translate(0, 0, -depth / 2 + 0.02), [-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0]),
  ];
  sides.forEach((sm, i) => {
    const w = i < 2 ? depth - 0.04 : width;
    const panel = wallPanel({ width: w, height: height - 0.05, plankH: 0.21, detail: i < 2 ? d1 : 2, rng: rng.child(`side${i}`), cols: 2, bulge: 0.01 });
    emit(mesh, 'plank', panel, { matrix: compose(m, sm), color: vc(scaleC(color, 0.9), { useTag: true, groundAO: 0.25 }) });
  });

  const n = detail === 0 ? 3 : 1;
  const topPath = [];
  for (let k = 0; k <= n; k++) {
    const u = (2 * k) / n - 1;
    topPath.push([u * (width / 2 + 0.05), height - 0.035 + 0.004 * (1 - u * u), 0.03]);
  }
  const top = sweep({ profile: roundedRectProfile(0.07, depth + 0.1, 0.03, detail === 0 ? 1 : 0), path: topPath, up: [0, 1, 0], caps: 'round', capSegments: detail === 2 ? 0 : 1, capLength: 0.035 });
  emit(mesh, 'wood', top, { matrix: m, color: vc(topColor, { groundAO: 0 }) });

  if (detail < 2) {
    const pr = rng.child('posts');
    for (const sgn of [-1, 1]) {
      const post = cornerPost({ height: height - 0.07, radius: 0.055, detail: d1, rng: pr });
      emit(mesh, 'wood', post, { matrix: compose(m, translate((sgn * width) / 2, 0, depth / 2)), color: vc(postColor, { groundAO: 0.25 }) });
    }
  }
  const bellSide = rng.rangeF(0, 1) < 0.5 ? -1 : 1;
  if (detail === 0) {
    const bell = lathe({ points: [[0, 0], [0.06, 0.004], [0.058, 0.02], [0.045, 0.045], [0.022, 0.07], [0.012, 0.085], [0.016, 0.1], [0, 0.108]], sides: 8 });
    emit(mesh, 'gold', bell, { matrix: compose(m, translate(bellSide * width * 0.3, height, 0.08)), color: vc(bellColor, { groundAO: 0 }) });
    const bx = -bellSide * width * 0.22, skew = rng.rangeF(-0.03, 0.03);
    const box = sweep({ profile: roundedRectProfile(0.12, 0.2, 0.03, 1), path: [[bx - 0.13, height + 0.06, -0.02 + skew], [bx + 0.13, height + 0.06, -0.02 - skew]], up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.03 });
    emit(mesh, 'wood', box, { matrix: m, color: vc(boxColor, { groundAO: 0 }) });
  }
  if (snowColor && detail < 2) {
    const profile = circleProfile(depth * 0.42, 7, 0, 0.05).map(([a, b]) => [b + 0.02, a]);
    const path = [[-width / 2 + 0.04, height, 0.03], [0, height + 0.005, 0.03], [width / 2 - 0.06, height, 0.03]];
    const snow = sweep({ profile, path, up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.05, scales: (t) => 0.85 + 0.3 * Math.sin(Math.PI * t) });
    emit(mesh, 'snow', snow, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
}


const GLYPHS = [
  [[0, 0.05], [0.3, 1], [0.55, 0.35], [0.8, 0.95], [1, 0.1]],
  [[0, 0.1], [0.35, 1.8], [0.5, 0.2], [1, 0.05]],
  [[0, 0.6], [0.4, 1], [0.35, 0.05], [0.75, 0.4], [1, 0.1]],
];


export function signBoard(mesh, m, { width = 2, height = 0.5, detail = 0, rng, boardColor, rimColor, paintColor, emblemColor, leafColor, emblem = 'apple', snowColor = null }) {
  const th = 0.07;
  const hw = width / 2, hh = height / 2;
  const arch = height * rng.rangeF(0.14, 0.22);
  const peak = rng.rangeF(-0.2, 0.2);
  const topY = (x) => { const t = x / hw - peak; return hh + arch * Math.max(0, 1 - t * t * 0.8); };
  const archN = detail === 0 ? 6 : detail === 1 ? 3 : 1;
  const pts = [[-hw, -hh + rng.rangeF(-0.01, 0.01)], [hw, -hh]];
  for (let k = 0; k <= archN; k++) { const x = hw - (width * k) / archN; pts.push([x, topY(x)]); }
  const corner = new Set([0, 1, 2, pts.length - 1]);
  const loop = filletLoop(pts, 0.1, detail === 0 ? 2 : detail === 1 ? 1 : 0, (i) => !corner.has(i));
  plate(mesh, 'plank', m, {
    loop, th, star: [0, 0], color: vc(boardColor, { groundAO: 0, underside: 0.2 }), rim: detail < 2, rimMaterial: 'wood', rimColor: vc(rimColor, { groundAO: 0 }), detail,
    uv: (x, y) => [x / 1.04, (y + hh) / (height * 2)],
  });

  const z = th / 2 + 0.008;
  const er = height * 0.3;
  const ex = emblem ? -hw + er * 1.55 : 0, ey = -0.01;
  if (detail < 2) {
    const glyphs = detail === 0 ? 7 : 4;
    const x0 = emblem ? ex + er * 1.3 : -hw + 0.14, x1 = hw - 0.16;
    const step = (x1 - x0) / (glyphs + 0.6);
    const xH = height * 0.2, baseY = -hh * 0.35;
    const words = [[], []];
    const split = Math.ceil(glyphs / 2);
    for (let g = 0; g < glyphs; g++) {
      const word = g < split ? 0 : 1;
      const gx = x0 + (g + (word ? 0.6 : 0)) * step;
      const tpl = GLYPHS[rng.rangeI(0, GLYPHS.length - 1)];
      tpl.forEach(([u, v], k) => {
        if (k === 0 && words[word].length) return;
        words[word].push([gx + u * step, baseY + v * xH + rng.rangeF(-0.008, 0.008), z]);
      });
    }
    for (const path of words) {
      if (path.length < 2) continue;
      const stroke = sweep({ profile: circleProfile(0.02, 3), path, up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.015, scales: (t) => 0.75 + 0.45 * Math.sin(Math.PI * t) });
      emit(mesh, 'wood', stroke, { matrix: m, color: vc(paintColor, { groundAO: 0, underside: 0 }) });
    }
    if (emblem === 'apple') {
      const apple = blob({ radii: [er, er * 0.92, er * 0.42], subdiv: detail === 0 ? 2 : 1, seed: rng.rangeI(1, 1e6), lump: 0.06 });
      emit(mesh, 'fruit', apple, { matrix: compose(m, translate(ex, ey, th / 2 + er * 0.18)), color: vc(emblemColor, { groundAO: 0, underside: 0.25 }) });
      const leaf = blob({ radii: [er * 0.45, er * 0.18, er * 0.12], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.05 });
      emit(mesh, 'fruit', leaf, { matrix: compose(m, compose(translate(ex + er * 0.35, ey + er * 1.02, th / 2 + 0.03), rotateZ(0.6))), color: vc(leafColor, { groundAO: 0 }) });
      emit(mesh, 'wood', sweep({ profile: circleProfile(0.013, 3), path: [[ex, ey + er * 0.7, th / 2 + 0.04], [ex - 0.02, ey + er * 1.2, th / 2 + 0.035]], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.01 }), { matrix: m, color: vc(hex('#6b4a34'), { groundAO: 0 }) });
    } else if (emblem === 'jar') {
      const jar = filletLoop([[-er * 0.72, -er * 0.95], [er * 0.72, -er * 0.95], [er * 0.72, er * 0.62], [-er * 0.72, er * 0.62]], er * 0.3, detail === 0 ? 2 : 1);
      plate(mesh, 'wood', compose(m, translate(ex, ey, th / 2 + 0.018)), { loop: jar, th: 0.035, star: [0, 0], color: vc(emblemColor, { groundAO: 0 }), rim: false });
      const lid = filletLoop([[-er * 0.82, er * 0.6], [er * 0.82, er * 0.6], [er * 0.8, er * 0.95], [-er * 0.84, er * 0.95]], er * 0.12, 1);
      plate(mesh, 'wood', compose(m, translate(ex, ey, th / 2 + 0.028)), { loop: lid, th: 0.04, star: [0, er * 0.78], color: vc(leafColor, { groundAO: 0 }), rim: false });
    }
  }
  if (snowColor && detail < 2) {
    const n = detail === 0 ? 5 : 3;
    const path = [];
    for (let k = 0; k <= n; k++) { const x = -hw + 0.12 + ((width - 0.24) * k) / n; path.push([x, topY(x) + 0.02, 0]); }
    const snow = sweep({ profile: circleProfile(0.045, 6, 0, 0.055), path, up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.05, scales: (t) => 0.7 + 0.45 * Math.sin(Math.PI * t) });
    emit(mesh, 'snow', snow, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
  return { topY: hh + arch };
}


export function hangingLantern(mesh, m, { reach = 0.38, detail = 0, rng, ironColor, glowColor, capColor }) {
  const iron = vc(ironColor, { groundAO: 0 });
  if (detail < 2) {
    const n = detail === 0 ? 5 : 3;
    const arm = [];
    for (let k = 0; k <= n; k++) { const t = k / n; arm.push([0, 0.07 * Math.sin(Math.PI * t) - 0.02 * t, t * reach]); }
    emit(mesh, 'metal', sweep({ profile: roundedRectProfile(0.022, 0.03, 0.008, 0), path: arm, up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.015 }), { matrix: m, color: iron });
    if (detail === 0) {
      const scroll = [];
      const turns = rng.rangeF(1.0, 1.3);
      for (let k = 0; k <= 8; k++) {
        const a = (k / 8) * turns * Math.PI * 2, r = 0.075 * (1 - k / 11);
        scroll.push([0, -0.085 + r * Math.cos(a), 0.09 + r * Math.sin(a)]);
      }
      emit(mesh, 'metal', sweep({ profile: roundedRectProfile(0.016, 0.022, 0.006, 0), path: scroll, up: [1, 0, 0], caps: 'round', capSegments: 0, capLength: 0.01 }), { matrix: m, color: iron });
    }
  }
  const sides = detail === 0 ? 8 : detail === 1 ? 6 : 4;
  const at = compose(m, translate(0, -0.02, reach));
  emit(mesh, 'metal', sweep({ profile: circleProfile(0.008, 3), path: [[0, 0, 0], [0.004, -0.06, 0]], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.006 }), { matrix: at, color: iron });
  const facet = (th) => 1 - 0.12 * Math.abs(Math.cos(th * 2));
  const glass = lathe({ points: [[0, -0.37], [0.05, -0.36], [0.078, -0.29], [0.072, -0.21], [0.046, -0.17], [0, -0.16]], sides, phase: Math.PI / sides, radiusFn: detail === 0 ? (th, j, r) => r * facet(th) : null });
  emit(mesh, 'lamp-glow', glass, { matrix: at, color: glowColor });
  const hat = lathe({ points: [[0, -0.185], [0.09, -0.175], [0.052, -0.12], [0.014, -0.085], [0.02, -0.07], [0, -0.058]], sides });
  emit(mesh, 'metal', hat, { matrix: at, color: vc(capColor, { groundAO: 0, underside: 0.4 }) });
  const foot = lathe({ points: [[0, -0.4], [0.055, -0.395], [0.064, -0.37], [0.05, -0.355], [0, -0.35]], sides });
  emit(mesh, 'metal', foot, { matrix: at, color: iron });
}
