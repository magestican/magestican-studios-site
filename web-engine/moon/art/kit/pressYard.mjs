












import { sweep, lathe, emit, roundedRectProfile, circleProfile } from '../../mesh/bevel.mjs';
import { compose, translate, rotateX, rotateZ } from '../../mesh/meshData.mjs';
import { vc, vary, scaleC } from './shade.mjs';
import { plate, filletLoop } from './shopFittings.mjs';
import { appleLoop } from './barn.mjs';

const shift = (loop, dx, dy) => loop.map(([x, y]) => [x + dx, y + dy]);


export function cutoutSign(mesh, m, {
  detail = 0, rng, glassColor, jamColor, labelColor, lidColor, juiceColor, corkColor, rimColor, markColor, ironColor,
  snowColor = null, flip = 1, back = 0.08,
}) {
  const segs = detail === 0 ? 1 : 0;
  const th = 0.05;
  const face = (c) => vc(c, { groundAO: 0, underside: 0.2, mottle: 0.05 });
  const tiltJ = rng.rangeF(0.04, 0.09) * -flip, tiltB = rng.rangeF(0.1, 0.16) * flip;
  const jarM = compose(m, compose(translate(-0.2 * flip, -0.02, 0.03), rotateZ(tiltJ)));
  const botM = compose(m, compose(translate(0.3 * flip, 0.04, -0.01), rotateZ(tiltB)));
  const layer = (base, dz) => compose(base, translate(0, 0, dz));

  
  const jar = filletLoop([[-0.3, -0.4], [0.31, -0.4], [0.33, 0.18], [0.24, 0.29], [-0.23, 0.3], [-0.32, 0.17]], 0.1, segs);
  plate(mesh, 'wood', jarM, { loop: jar, th, star: [0, 0], color: face(glassColor), rim: detail === 0, rimColor: vc(rimColor, { groundAO: 0 }), detail: 1 });
  const jam = filletLoop([[-0.25, -0.35], [0.26, -0.35], [0.28, 0.06], [0.1, 0.1], [-0.12, 0.07], [-0.27, 0.09]], 0.06, segs);
  plate(mesh, 'wood', layer(jarM, th / 2 + 0.008), { loop: jam, th: 0.02, star: [0, -0.1], color: face(jamColor), rim: false });
  const lid = filletLoop([[-0.28, 0.27], [0.29, 0.26], [0.27, 0.42], [-0.27, 0.43]], 0.05, segs);
  plate(mesh, 'wood', layer(jarM, th / 2 + 0.01), { loop: lid, th: 0.035, star: [0, 0.34], color: face(lidColor), rim: false });
  if (detail < 2) {
    const label = filletLoop([[-0.2, -0.24], [0.21, -0.25], [0.22, 0.0], [-0.19, 0.01]], 0.04, segs);
    plate(mesh, 'wood', layer(jarM, th / 2 + 0.026), { loop: label, th: 0.02, star: [0, -0.12], color: face(labelColor), rim: false });
    plate(mesh, 'wood', layer(jarM, th / 2 + 0.042), { loop: shift(appleLoop(0.075, detail === 0 ? 10 : 7), 0.01, -0.12), th: 0.02, star: [0.01, -0.12], color: face(markColor), rim: false });
  }

  
  const bottle = filletLoop([[-0.16, -0.48], [0.16, -0.48], [0.17, 0.08], [0.075, 0.21], [0.06, 0.38], [-0.055, 0.38], [-0.07, 0.21], [-0.165, 0.07]], 0.06, segs);
  plate(mesh, 'wood', botM, { loop: bottle, th, star: [0, -0.08], color: face(glassColor), rim: detail === 0, rimColor: vc(rimColor, { groundAO: 0 }), detail: 1 });
  const juice = filletLoop([[-0.12, -0.43], [0.12, -0.43], [0.13, 0.0], [-0.125, 0.03]], 0.04, segs);
  plate(mesh, 'wood', layer(botM, th / 2 + 0.008), { loop: juice, th: 0.02, star: [0, -0.2], color: face(juiceColor), rim: false });
  const cork = filletLoop([[-0.05, 0.35], [0.05, 0.35], [0.045, 0.49], [-0.045, 0.49]], 0.02, segs);
  plate(mesh, 'wood', layer(botM, 0), { loop: cork, th: th * 1.2, star: [0, 0.42], color: face(corkColor), rim: false });
  if (detail < 2) {
    const tag = filletLoop([[-0.1, -0.3], [0.1, -0.31], [0.105, -0.12], [-0.095, -0.11]], 0.03, segs);
    plate(mesh, 'wood', layer(botM, th / 2 + 0.026), { loop: tag, th: 0.02, star: [0, -0.21], color: face(labelColor), rim: false });
  }

  if (detail < 2) {
    const ironC = vc(ironColor, { groundAO: 0 });
    for (const [x, y] of [[-0.2 * flip, 0.12], [0.3 * flip, -0.2]]) {
      emit(mesh, 'metal', sweep({ profile: circleProfile(0.018, 4), path: [[x, y, 0], [x, y, -back]], up: [0, 1, 0], caps: 'none' }), { matrix: m, color: ironC });
    }
  }
  if (snowColor && detail < 2) {
    const path = [[-0.25, 0.44, 0], [0, 0.46, 0], [0.25, 0.45, 0]];
    emit(mesh, 'snow', sweep({ profile: circleProfile(0.05, 6, 0, 0.04), path, up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.04, scales: (t) => 0.6 + 0.5 * Math.sin(Math.PI * t) }), { matrix: jarM, color: vc(snowColor, { groundAO: 0 }) });
  }
}


export function caskPair(mesh, m, { detail = 0, rng, wood, darkWood, iron, radius = 0.33, length = 0.74, gap = 0.74 }) {
  const cy = radius + 0.2;
  const sides = detail === 0 ? 10 : detail === 1 ? 7 : 5;
  const L = length / 2, r = radius;
  const pts = detail === 2
    ? [[0, -L], [r * 0.88, -L], [r, 0], [r * 0.88, L], [0, L]]
    : [[0, -L + 0.035], [r * 0.8, -L + 0.035], [r * 0.87, -L], [r * 0.96, -L * 0.5], [r, 0], [r * 0.96, L * 0.5], [r * 0.87, L], [r * 0.8, L - 0.035], [0, L - 0.035]];
  const ironC = vc(iron, { groundAO: 0 });
  [-1, 1].forEach((sgn, c) => {
    const x = (sgn * gap) / 2 + rng.rangeF(-0.03, 0.03);
    const rr = r * (c ? rng.rangeF(0.9, 0.97) : 1);
    const cm = compose(m, compose(translate(x, cy - (r - rr), 0), rotateX(Math.PI / 2)));
    const staves = lathe({ points: pts.map(([a, b]) => [a * (rr / r), b]), sides, phase: rng.rangeF(0, 1), radiusFn: detail === 2 ? null : (th, j, rad, i) => (j > 1 && j < pts.length - 2 ? rad * (i % 2 ? 0.985 : 1.01) : rad) });
    emit(mesh, 'wood', staves, { matrix: cm, color: vc(vary(rng, wood, 0.06), { groundAO: 0.25, underside: 0.35 }) });
    if (detail < 2) {
      for (const y of detail === 0 ? [-L * 0.62, L * 0.62] : [L * 0.6]) {
        const ring = [];
        const k = detail === 0 ? 9 : 7;
        const rad = rr * (1 - 0.04 * (Math.abs(y) / L) ** 2) + 0.012;
        for (let q = 0; q < k; q++) { const a = (q / k) * Math.PI * 2; ring.push([rad * Math.sin(a), y, rad * Math.cos(a)]); }
        emit(mesh, 'metal', sweep({ profile: roundedRectProfile(0.022, 0.05, 0.008, 0), path: ring, closed: true, up: [0, 1, 0] }), { matrix: cm, color: ironC });
      }
      
      const tap = sweep({ profile: circleProfile(0.028, detail === 0 ? 6 : 4), path: [[0, -rr * 0.45, L - 0.04], [0, -rr * 0.45, L + 0.1], [0, -rr * 0.55, L + 0.16]], up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.02 });
      emit(mesh, 'wood', tap, { matrix: compose(m, compose(translate(x, cy - (r - rr), 0), rotateX(0))), color: vc(scaleC(darkWood, 0.9), { groundAO: 0 }) });
    }
  });
  
  for (const z of detail === 2 ? [] : [-L * 0.55, L * 0.55]) {
    const path = [[-gap / 2 - r * 0.8, 0.12, z], [0, 0.1 + rng.rangeF(-0.01, 0.01), z], [gap / 2 + r * 0.8, 0.12, z]];
    emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.22, 0.13, 0.05, 0), path, up: [0, 1, 0], caps: 'round', capSegments: detail === 2 ? 0 : 1, capLength: 0.04 }), { matrix: m, color: vc(darkWood, { groundAO: 0.35 }) });
  }
  return { top: cy + r };
}


export function copperCowl(mesh, m, { detail = 0, copper, snowColor = null, rng }) {
  const sides = detail === 0 ? 11 : detail === 1 ? 8 : 6;
  const lean = rng.rangeF(-0.04, 0.04);
  const pts = detail === 2
    ? [[0.3, -0.06], [0.56, 0.22], [0.3, 0.5], [0, 0.6]]
    : [[0.3, -0.08], [0.33, 0.1], [0.5, 0.18], [0.58, 0.24], [0.55, 0.31], [0.44, 0.42], [0.27, 0.53], [0.1, 0.6], [0.06, 0.64], [0.07, 0.7], [0, 0.73]];
  const cowl = lathe({ points: pts, sides, radiusFn: detail === 2 ? null : (th, j, r) => r * (1 + 0.035 * Math.sin(3 * th + j) * (j > 1 && j < 7 ? 1 : 0)) });
  const mm = compose(m, rotateZ(lean));
  emit(mesh, 'copper', cowl, { matrix: mm, color: vc(copper, { groundAO: 0, underside: 0.5 }) });
  if (snowColor) {
    const snow = lathe({ points: [[0.54, 0.3], [0.4, 0.46], [0.2, 0.58], [0, 0.66]], sides });
    emit(mesh, 'snow', snow, { matrix: compose(mm, translate(0, 0.045, 0)), color: vc(snowColor, { groundAO: 0 }) });
  }
  return { top: 0.73 };
}



export function copperFlue(mesh, m, { path, radius = 0.095, detail = 0, copper }) {
  if (detail === 2) return;
  const flue = sweep({ profile: circleProfile(radius, detail === 0 ? 8 : 6), path, up: [1, 0, 0], caps: 'none', scales: (t) => 1 + 0.06 * Math.sin(Math.PI * t) });
  emit(mesh, 'copper', flue, { matrix: m, color: vc(copper, { groundAO: 0, underside: 0.4 }) });
  if (detail === 0) {
    const [a, b] = [path[path.length - 2], path[path.length - 1]];
    const t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const l = Math.hypot(...t);
    const c = [b[0] - (t[0] / l) * 0.06, b[1] - (t[1] / l) * 0.06, b[2] - (t[2] / l) * 0.06];
    emit(mesh, 'copper', sweep({ profile: circleProfile(radius * 1.35, 8), path: [c, [c[0] + (t[0] / l) * 0.05, c[1] + (t[1] / l) * 0.05, c[2] + (t[2] / l) * 0.05]], up: [1, 0, 0], caps: 'round', capSegments: 0, capLength: 0.01 }), { matrix: m, color: vc(scaleC(copper, 0.85), { groundAO: 0 }) });
  }
}


export function canvasRoll(mesh, m, { length = 1.5, radius = 0.1, detail = 0, rng, color, strapColor }) {
  const n = detail === 0 ? 3 : 2;
  const sagA = rng.rangeF(0.015, 0.035);
  const path = Array.from({ length: n + 1 }, (_, k) => { const u = (2 * k) / n - 1; return [u * length / 2, -sagA * (1 - u * u), 0]; });
  const roll = sweep({ profile: circleProfile(radius, detail === 0 ? 7 : 5), path, up: [0, 1, 0], caps: 'round', capSegments: detail === 2 ? 0 : 1, capLength: radius * 0.4, scales: (t) => 1 + 0.08 * Math.sin(Math.PI * t * 3 + 1) });
  emit(mesh, 'canvas', roll, { matrix: m, color: vc(color, { groundAO: 0, underside: 0.35 }) });
  if (detail === 0) {
    for (const u of [-0.3, 0.32]) {
      const x = u * length, y = -sagA * (1 - 4 * u * u) - 0.005;
      const ring = [];
      for (let q = 0; q < 6; q++) { const a = (q / 6) * Math.PI * 2; ring.push([x, y + (radius + 0.012) * Math.cos(a), (radius + 0.012) * Math.sin(a)]); }
      emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.05, 0.012, 0.004, 0), path: ring, closed: true, up: [1, 0, 0] }), { matrix: m, color: vc(strapColor, { groundAO: 0 }) });
    }
  }
}
