






















import { Shape, sweep, lathe, surface, emit, roundedRectProfile, circleProfile } from '../../mesh/bevel.mjs';
import { compose, translate, rotateY, rotateZ } from '../../mesh/meshData.mjs';
import { valueNoise3 } from '../../noise.mjs';
import { vc, vary, scaleC } from './shade.mjs';
import { plinth } from './wall.mjs';
import { plate, filletLoop } from './shopFittings.mjs';

const lerp = (a, b, t) => a + (b - a) * t;


export function outlineY(outline, x) {
  if (x <= outline[0][0]) return outline[0][1];
  for (let k = 0; k + 1 < outline.length; k++) {
    const [x0, y0] = outline[k], [x1, y1] = outline[k + 1];
    if (x <= x1) return lerp(y0, y1, (x - x0) / Math.max(1e-6, x1 - x0));
  }
  return outline[outline.length - 1][1];
}

export function boardWall({ width, height = 2, topAt = null, boardW = 0.3, detail = 0, rng, battens = true, proud = 0.03, bulge = 0.014, breaks = [] }) {
  const hw = width / 2;
  const top = topAt || (() => height);
  const nB = Math.max(1, Math.round(width / boardW));
  const bw = width / nB;
  const value = Array.from({ length: nB }, () => rng.rangeF(0.84, 1.08));
  const seed = rng.rangeI(1, 1e6);
  const bt = Math.min(0.08, bw * 0.3), e = 0.014, g = 0.012;
  const cols = [[-hw, 0, 0, 0.85]];
  if (detail < 2) {
    for (let k = 0; k < nB; k++) {
      const x0 = -hw + k * bw;
      if (k > 0) {
        if (battens && detail === 0) cols.push([x0 - bt / 2, 0, k - 1, 0.7], [x0 - bt / 2 + e, proud, k - 1, 1.06], [x0 + bt / 2 - e, proud, k, 1.06], [x0 + bt / 2, 0, k, 0.7]);
        else if (battens) cols.push([x0 - bt / 2, 0, k - 1, 0.76], [x0, proud, k, 1.05], [x0 + bt / 2, 0, k, 0.76]);
        else if (detail === 0) cols.push([x0 - e, 0, k - 1, 0.92], [x0, -g, k, 0.55], [x0 + e, 0, k, 0.92]);
        else cols.push([x0, -g, k, 0.6]);
      }
      if (detail === 0) cols.push([x0 + bw / 2, 0, k, 1]);
    }
  }
  cols.push([hw, 0, nB - 1, 0.85]);
  
  const extra = breaks.filter((bx) => bx > -hw + 0.02 && bx < hw - 0.02 && !cols.some((c) => Math.abs(c[0] - bx) < 0.02));
  for (const bx of extra) cols.push([bx, null, Math.min(nB - 1, Math.floor((bx + hw) / bw)), 1]);
  cols.sort((a, b) => a[0] - b[0]);
  cols.forEach((c, i) => {
    if (c[1] !== null) return;
    const a = cols[i - 1], b = cols[i + 1];
    c[1] = a[1] + ((b[1] ?? 0) - a[1]) * ((c[0] - a[0]) / (b[0] - a[0]));
  });
  const fr = detail === 0 ? [0, 0.5, 1] : [0, 1];
  return surface({
    us: cols.map((_, i) => i),
    vs: fr,
    at: (i, f) => {
      const [x, z] = cols[i];
      const y = f * Math.max(0.04, top(x));
      const u = x / hw;
      const belly = bulge * (1 - u * u) * Math.sin(Math.PI * f);
      const wob = detail === 2 ? 0 : (valueNoise3(x * 2.1, y * 1.7, 0, seed) - 0.5) * 0.016;
      return [x, y, z + belly + wob];
    },
    uv: (i, f, p) => [p[1] / 1.04, (p[0] + hw) / (4 * bw)],
    tag: (i, f) => value[cols[i][2]] * cols[i][3] * (f === 0 ? 0.88 : 1),
  });
}

export function tinRoof(mesh, m, {
  outline, zBack, zFront, thickness = 0.07, amp = 0.024, wave = 0.24, detail = 0, rng, color, trimColor = null,
  snowColor = null, sag = 0.04, droop = 0.05, barge = [true, true], ridge = true, sheetW = 0.86, bargeH = 0.2, lite = false,
}) {
  const seed = rng.rangeI(1, 1e6);
  const L = zFront - zBack, zMid = (zFront + zBack) / 2;
  const n = outline.length;
  const xs = outline.map((q) => q[0]);
  const xMid = (Math.min(...xs) + Math.max(...xs)) / 2, xHalf = Math.max(0.1, (Math.max(...xs) - Math.min(...xs)) / 2);
  const dropAt = (x, z) => { const t = (2 * (z - zMid)) / L; return sag * Math.max(0, 1 - t * t) + droop * t * t * Math.min(1, Math.abs(x - xMid) / xHalf); };
  const segN = [];
  for (let k = 0; k + 1 < n; k++) {
    const dx = outline[k + 1][0] - outline[k][0], dy = outline[k + 1][1] - outline[k][1], l = Math.hypot(dx, dy);
    segN.push([-dy / l, dx / l]);
  }
  const N = outline.map((_, k) => {
    const a = segN[Math.max(0, k - 1)], b = segN[Math.min(n - 2, k)];
    let nx = a[0] + b[0], ny = a[1] + b[1];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l; ny /= l;
    const c = Math.max(0.55, nx * a[0] + ny * a[1]);
    return [nx / c, ny / c];
  });
  const arc = [0];
  for (let k = 1; k < n; k++) arc.push(arc[k - 1] + Math.hypot(outline[k][0] - outline[k - 1][0], outline[k][1] - outline[k - 1][1]));
  const tan0 = (() => { const dx = outline[0][0] - outline[1][0], dy = outline[0][1] - outline[1][1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; })();
  const tanN = (() => { const dx = outline[n - 1][0] - outline[n - 2][0], dy = outline[n - 1][1] - outline[n - 2][1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; })();

  
  
  
  const rows = [];
  rows.push({ k: 0, o: 0, t: tan0.map((v) => v * 0.025), w: 0, ao: 0.62, s: -0.03 });
  for (let k = 0; k < n; k++) rows.push({ k, o: thickness, t: [0, 0], w: 1, ao: 1, s: arc[k] });
  rows.push({ k: n - 1, o: 0, t: tanN.map((v) => v * 0.025), w: 0, ao: 0.62, s: arc[n - 1] + 0.03 });

  
  
  const per = detail === 0 ? (lite ? 2 : 3) : detail === 1 ? 2 : 0;
  const waves = Math.max(2, Math.round(L / (wave * (detail === 1 ? (lite ? 2.4 : 1.8) : 1))));
  const count = per ? waves * per : 1;
  const zs = Array.from({ length: count + 1 }, (_, i) => zBack + (L * i) / count);
  const sheetVal = Array.from({ length: Math.ceil(L / sheetW) + 1 }, () => rng.rangeF(0.88, 1.08));
  const flute = (i) => (per ? Math.cos((2 * Math.PI * i) / per) : 0);
  const top = surface({
    us: zs.map((_, i) => i),
    vs: rows.map((_, j) => j),
    at: (i, j) => {
      const r = rows[j], z = zs[i];
      const o = r.o + (per ? amp * r.w * (1 + flute(i)) : amp);
      const x = outline[r.k][0] + N[r.k][0] * o + r.t[0];
      const y = outline[r.k][1] + N[r.k][1] * o + r.t[1];
      const wob = detail === 2 ? 0 : (valueNoise3(x * 0.9, z * 0.7, 3, seed) - 0.5) * 0.03 * r.w;
      return [x, y - dropAt(x, z) + wob, z];
    },
    uv: (i, j) => [rows[j].s / 1.1, zs[i] / 1.1],
    tag: (i, j) => sheetVal[Math.min(sheetVal.length - 1, Math.floor((zs[i] - zBack) / sheetW))] * rows[j].ao * (per && rows[j].w > 0.9 ? 0.9 + 0.1 * flute(i) : 1),
  });
  emit(mesh, 'metal', top, { matrix: m, color: vc(color, { useTag: true, groundAO: 0, underside: 0.5, mottle: 0.09 }) });

  const zu = detail === 2 ? [zFront, zBack] : detail === 1 || lite ? [zFront, zMid, zBack] : [zFront, zMid + L * 0.25, zMid, zMid - L * 0.25, zBack];
  const under = surface({
    us: zu.map((_, i) => i),
    vs: outline.map((_, k) => k),
    at: (i, k) => { const [x, y] = outline[k]; return [x, y - dropAt(x, zu[i]), zu[i]]; },
    uv: (i, k) => [arc[k] / 1.1, zu[i] / 1.1],
    tag: () => 0.55,
  });
  emit(mesh, 'metal', under, { matrix: m, color: vc(scaleC(color, 0.8), { useTag: true, groundAO: 0, underside: 0.3 }) });

  if (trimColor) {
    [zFront + 0.02, zBack - 0.02].forEach((z, e) => {
      if (!barge[e] || (detail === 2 && (e === 1 || lite))) return;
      const off = thickness * 0.5 + amp;
      const path = outline.map(([x, y], k) => [x + N[k][0] * off, y + N[k][1] * off, z]);
      path[0] = [path[0][0] + tan0[0] * 0.03, path[0][1] + tan0[1] * 0.03, z];
      path[n - 1] = [path[n - 1][0] + tanN[0] * 0.03, path[n - 1][1] + tanN[1] * 0.03, z];
      for (const p of path) p[1] -= dropAt(p[0], z);
      const board = sweep({ profile: roundedRectProfile(0.075, bargeH, 0.028, 0), path, up: [0, 0, 1], caps: 'round', capSegments: detail === 2 ? 0 : 1, capLength: 0.03 });
      emit(mesh, 'wood', board, { matrix: m, color: vc(vary(rng, trimColor, 0.04), { groundAO: 0, underside: 0.4 }) });
    });
  }

  let peak = -1;
  for (let k = 1; k + 1 < n; k++) if (outline[k][1] > outline[k - 1][1] && outline[k][1] > outline[k + 1][1]) peak = k;
  if (ridge && peak > 0 && !snowColor && detail < 2) {
    const [x, y] = outline[peak];
    const o = thickness + amp * 2 + 0.015;
    const path = [0, 0.33, 0.66, 1].map((t) => { const z = lerp(zBack - 0.03, zFront + 0.03, t); return [x + N[peak][0] * o, y + N[peak][1] * o - dropAt(x, z), z]; });
    const cap = sweep({ profile: roundedRectProfile(0.075, 0.26, 0.035, 1), path, up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.03 });
    emit(mesh, 'metal', cap, { matrix: m, color: vc(scaleC(color, 0.78), { groundAO: 0, underside: 0.4 }) });
  }

  if (snowColor) {
    
    
    
    const steep = (k) => Math.abs(outline[k + 1][1] - outline[k][1]) >= 0.84 * Math.abs(outline[k + 1][0] - outline[k][0]);
    const thin = (k) => (steep(Math.min(n - 2, k)) ? 0.32 : 1);
    const runs = [[0, n - 1]];
    const zsS = detail === 0 ? 7 : detail === 1 ? 4 : 2;
    for (const [k0, k1] of runs) {
      const samples = [];
      for (let k = k0; k < k1; k++) {
        const sub = steep(k) ? 1 : detail === 0 ? 3 : detail === 1 ? 2 : 1;
        for (let q = 0; q < sub; q++) samples.push([k, q / sub]);
      }
      samples.push([k1, 0]);
      const total = arc[k1] - arc[k0];
      const snow = surface({
        us: Array.from({ length: zsS + 1 }, (_, i) => i),
        vs: samples.map((_, j) => j),
        at: (i, j) => {
          const [k, f] = samples[j];
          const k2 = Math.min(n - 1, k + 1);
          const px = lerp(outline[k][0], outline[k2][0], f), py = lerp(outline[k][1], outline[k2][1], f);
          const nx = lerp(N[k][0], N[k2][0], f), ny = lerp(N[k][1], N[k2][1], f);
          const z = lerp(zBack + 0.04, zFront - 0.04, i / zsS);
          const sAlong = (lerp(arc[k], arc[k2], f) - arc[k0]) / Math.max(1e-6, total);
          const edgeS = Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, sAlong)))), 0.35);
          const edgeZ = Math.pow(Math.max(0, Math.sin((Math.PI * i) / zsS)), 0.3);
          const lump = (valueNoise3(px * 1.6, z * 1.3, 9, seed) - 0.5) * 0.07;
          const h = (0.13 + lump) * thin(k) * edgeS * edgeZ;
          const o = thickness + amp * 2 + 0.008 + h;
          return [px + nx * o, py + ny * o - dropAt(px, z), z];
        },
        uv: (i, j, p) => [p[0] * 0.5, p[2] * 0.5],
      });
      emit(mesh, 'snow', snow, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.25, mottle: 0.04 }) });
    }
  }
  return { dropAt, crest: thickness + amp * 2 };
}



export function barnShell(mesh, root, {
  W, D, cz, base = 0.42, eave, knee, ridge, kneeX = 0.6, ridgeShift = 0, overhang = 0.34,
  detail = 0, rng, stoneColor, boardColor, trimColor, roofColor, snowColor = null,
}) {
  const hw = W / 2, frontZ = cz + D / 2, backZ = cz - D / 2;
  const d1 = Math.min(2, detail + 1);
  const R = (mm) => compose(root, mm);
  const kx = hw * kneeX;
  
  const wall = [[-hw, eave], [-kx + ridgeShift * 0.4, knee - 0.04], [ridgeShift, ridge], [kx + ridgeShift * 0.4, knee + 0.04], [hw, eave]];
  const topFront = (x) => outlineY(wall, x) - base;
  emit(mesh, 'stone', plinth({ width: W, depth: D, height: 0.5, thickness: 0.32, detail: d1, rng: rng.child('plinth') }), { matrix: R(translate(0, 0, cz)), color: vc(stoneColor, { useTag: true, groundAO: 0.15 }) });

  const breaks = wall.map((q) => q[0]);
  const board = (c) => vc(c, { useTag: true, groundAO: 0.18, groundFade: 0.9 });
  const front = boardWall({ width: W + 0.02, topAt: topFront, detail, rng: rng.child('front'), breaks });
  emit(mesh, 'plank', front, { matrix: R(translate(0, base, frontZ)), color: board(boardColor) });
  const back = boardWall({ width: W + 0.02, topAt: (x) => topFront(-x), detail: 2, rng: rng.child('back'), breaks: breaks.map((x) => -x) });
  emit(mesh, 'plank', back, { matrix: R(compose(translate(0, base, backZ), rotateY(Math.PI))), color: board(scaleC(boardColor, 0.92)) });
  for (const sgn of [1, -1]) {
    const side = boardWall({ width: D + 0.02, height: eave - base + 0.02, detail: d1, rng: rng.child(`side${sgn}`) });
    emit(mesh, 'plank', side, { matrix: R(compose(translate(sgn * hw, base, cz), rotateY((sgn * Math.PI) / 2))), color: board(scaleC(boardColor, 0.95)) });
  }
  if (detail < 2) {
    
    for (const sgn of [1, -1]) {
      const lean = rng.rangeF(-0.02, 0.02);
      const post = sweep({ profile: roundedRectProfile(0.055, 0.17, 0.02, detail === 0 ? 1 : 0), path: [[sgn * (hw - 0.05), base - 0.06, frontZ + 0.035], [sgn * (hw - 0.05) + lean, eave - 0.06, frontZ + 0.035]], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.02 });
      emit(mesh, 'wood', post, { matrix: R(IDENT), color: vc(vary(rng, trimColor, 0.04), { groundAO: 0.2 }) });
    }
  }
  const outline = [[-hw - overhang, eave - 0.1], ...wall, [hw + overhang, eave - 0.1]];
  const roof = tinRoof(mesh, root, {
    outline, zBack: backZ - 0.3, zFront: frontZ + 0.3, detail, rng: rng.child('roof'), color: roofColor, trimColor, snowColor, sag: 0.05, droop: 0.06, amp: 0.032,
  });
  const ridgeTop = ridge + roof.crest + 0.05;
  return { wall, outline, frontZ, backZ, ridgeTop, topAt: (x) => outlineY(wall, x), roofZ: [backZ - 0.3, frontZ + 0.3], d1 };
}

const IDENT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];


export function slidingDoors(mesh, m, { opening = 1.05, height = 1.9, detail = 0, rng, color, trimColor, ironColor, glowColor, brace = 'z' }) {
  const hO = opening / 2, lw = opening * 0.62;
  const g = new Shape();
  const gz = 0.012;
  const a = g.add([-hO, 0, gz], [0, 0], 0.7), b = g.add([hO, 0, gz], [1, 0], 0.7), c = g.add([hO, height, gz], [1, 1], 0.32), d = g.add([-hO, height, gz], [0, 1], 0.32);
  const mid = g.add([0, height * 0.45, gz], [0.5, 0.45], 1);
  g.tri(a, b, mid); g.tri(b, c, mid); g.tri(c, d, mid); g.tri(d, a, mid);
  emit(mesh, 'glass', g, { matrix: m, color: vc(glowColor, { useTag: true, groundAO: 0, underside: 0, mottle: 0 }) });
  if (detail < 2) {
    const frame = sweep({ profile: roundedRectProfile(0.06, 0.11, 0.022, 0), path: [[-hO - 0.05, -0.02, 0.035], [-hO - 0.05, height + 0.05, 0.035], [hO + 0.05, height + 0.05, 0.035], [hO + 0.05, -0.02, 0.035]], up: [0, 0, 1], caps: 'none' });
    emit(mesh, 'wood', frame, { matrix: m, color: vc(trimColor, { groundAO: 0.2 }) });
  }
  const trim = vc(trimColor, { groundAO: 0.15 });
  for (const side of [-1, 1]) {
    const overlap = rng.rangeF(0.06, 0.14);
    const cx = side * (hO - overlap + lw / 2);
    const lm = compose(m, translate(cx, 0, 0.085));
    const leaf = boardWall({ width: lw, height: height + 0.08, boardW: 0.17, battens: false, detail, rng: rng.child(`leaf${side}`), bulge: 0.004 });
    emit(mesh, 'plank', leaf, { matrix: compose(lm, translate(0, -0.02, 0)), color: vc(vary(rng, color, 0.05), { useTag: true, groundAO: 0.2 }) });
    if (detail === 2) continue;
    const bar = (p, q) => emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.034, 0.1, 0.014, 0), path: [p, q], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.01 }), { matrix: lm, color: trim });
    const hx = lw / 2 - 0.05, yB = 0.14, yT = height - 0.08, zt = 0.03;
    bar([-hx, yB, zt], [hx, yB, zt]);
    bar([-hx, yT, zt], [hx, yT, zt]);
    const s = side * (brace === 'x' ? 1 : 1);
    bar([-hx * s, yB + 0.05, zt + 0.006], [hx * s, yT - 0.05, zt + 0.006]);
    if (brace === 'x') bar([hx * s, yB + 0.05, zt + 0.012], [-hx * s, yT - 0.05, zt + 0.012]);
  }
  if (detail < 2) {
    const reach = hO + lw * 1.15;
    emit(mesh, 'metal', sweep({ profile: roundedRectProfile(0.05, 0.03, 0.01, 0), path: [[-reach, height + 0.13, 0.1], [reach, height + 0.13, 0.1]], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.015 }), { matrix: m, color: vc(ironColor, { groundAO: 0 }) });
  }
}


export function hoistBeam(mesh, m, { reach = 0.85, detail = 0, rng, wood, iron, rope, snowColor = null }) {
  const droop = rng.rangeF(0.02, 0.05), yaw = rng.rangeF(-0.08, 0.08);
  const tip = [reach * Math.sin(yaw), -droop, reach];
  const path = [[0, 0.01, -0.25], [tip[0] * 0.5, -droop * 0.3, reach * 0.5], tip];
  emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.18, 0.15, 0.045, 0), path, up: [0, 1, 0], caps: 'round', capSegments: detail === 2 ? 0 : 1, capLength: 0.05 }), { matrix: m, color: vc(wood, { groundAO: 0 }) });
  if (snowColor && detail < 2) {
    emit(mesh, 'snow', sweep({ profile: circleProfile(0.07, 6, 0, 0.045), path: path.map(([x, y, z]) => [x, y + 0.1, z]), up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.05, scales: (t) => 0.7 + 0.35 * Math.sin(Math.PI * t) }), { matrix: m, color: vc(snowColor, { groundAO: 0 }) });
  }
  if (detail === 2) return;
  const px = tip[0] * 0.92, pz = reach - 0.1;
  const wheel = lathe({ points: [[0, -0.035], [0.1, -0.035], [0.115, 0], [0.1, 0.035], [0, 0.035]], sides: detail === 0 ? 9 : 5 });
  if (detail === 0) emit(mesh, 'metal', wheel, { matrix: compose(m, compose(translate(px, -0.2, pz), rotateZ(Math.PI / 2))), color: vc(iron, { groundAO: 0 }) });
  const sway = rng.rangeF(-0.04, 0.04);
  const drop = rng.rangeF(0.55, 0.7);
  emit(mesh, 'wood', sweep({ profile: circleProfile(0.02, 4), path: [[px, -0.2, pz + 0.11], [px + sway * 0.5, -0.2 - drop * 0.5, pz + 0.115], [px + sway, -0.2 - drop, pz + 0.11]], up: [0, 0, 1], caps: 'none' }), { matrix: m, color: vc(rope, { groundAO: 0 }) });
  if (detail === 0) {
    const hy = -0.2 - drop, hk = [];
    for (let k = 0; k <= 5; k++) { const a = (k / 5) * Math.PI * 1.3; hk.push([px + sway + 0.06 * Math.sin(a), hy - 0.06 + 0.06 * Math.cos(a) - 0.02, pz + 0.11]); }
    emit(mesh, 'metal', sweep({ profile: circleProfile(0.016, 4), path: [[px + sway, hy + 0.01, pz + 0.11], ...hk], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.01 }), { matrix: m, color: vc(iron, { groundAO: 0 }) });
  }
}


export function appleLoop(r, segs = 12, lean = 0.08) {
  const pts = [];
  for (let k = 0; k < segs; k++) {
    const a = (k / segs) * Math.PI * 2 - Math.PI / 2;
    const top = Math.max(0, Math.sin(a));
    const dimple = top > 0.92 ? 0.22 * (top - 0.92) / 0.08 : 0;
    const rr = r * (1 - dimple) * (1 + 0.06 * Math.cos(a + lean * 6)) * (a > Math.PI * 0.2 && a < Math.PI * 0.8 ? 1.02 : 1);
    pts.push([rr * Math.cos(a) * 1.06 + lean * r * Math.max(0, Math.sin(a)), rr * Math.sin(a) * 0.96]);
  }
  return pts;
}


export function weatherVane(mesh, m, { detail = 0, rng, iron, emblemColor, emblem = 'apple', height = 0.62 }) {
  const ironC = vc(iron, { groundAO: 0 });
  emit(mesh, 'metal', sweep({ profile: circleProfile(0.026, detail === 0 ? 5 : 4), path: [[0, -0.1, 0], [0, height, 0]], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.02 }), { matrix: m, color: ironC });
  const yaw = rng.rangeF(0.35, 0.6) * (rng.rangeF(0, 1) < 0.5 ? -1 : 1);
  const ay = height * 0.66;
  const ax = Math.cos(yaw) * 0.34, az = -Math.sin(yaw) * 0.34;
  if (detail < 2) emit(mesh, 'metal', sweep({ profile: circleProfile(0.018, 4), path: [[-ax, ay, -az], [ax, ay, az]], up: [0, 1, 0], caps: 'round', capSegments: 0, capLength: 0.015 }), { matrix: m, color: ironC });
  if (detail < 2) {
    const head = [[0, 0.07], [-0.12, 0], [0, -0.07], [-0.03, 0]];
    plate(mesh, 'metal', compose(m, compose(translate(ax, ay, az), rotateY(yaw))), { loop: head.map(([x, y]) => [-x, y]).reverse(), th: 0.02, star: [0.04, 0], color: ironC, rim: false });
    const fin = [[0, -0.09], [0.14, -0.05], [0.14, 0.05], [0, 0.09], [0.04, 0]];
    plate(mesh, 'metal', compose(m, compose(translate(-ax, ay, -az), rotateY(yaw))), { loop: fin.map(([x, y]) => [-x, y]).reverse(), th: 0.02, star: [-0.08, 0], color: ironC, rim: false });
  }
  const er = emblem === 'apple' ? 0.14 : 0.1;
  if (emblem === 'apple') {
    plate(mesh, 'metal', compose(m, translate(0, height + er * 0.8, 0)), { loop: appleLoop(er, detail === 0 ? 14 : 9), th: 0.04, star: [0, 0], color: vc(emblemColor, { groundAO: 0 }), rim: false });
    if (detail === 0) emit(mesh, 'metal', sweep({ profile: circleProfile(0.012, 3), path: [[0.01, height + er * 1.6, 0], [0.04, height + er * 2.05, 0]], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.01 }), { matrix: m, color: ironC });
  } else {
    const ball = lathe({ points: [[0, height - 0.02], [0.07, height + 0.06], [0.05, height + 0.14], [0, height + 0.16]], sides: detail === 0 ? 7 : 5 });
    emit(mesh, 'metal', ball, { matrix: m, color: vc(emblemColor, { groundAO: 0 }) });
  }
}


export function cupola(mesh, m, { detail = 0, rng, boardColor, trimColor, roofColor, snowColor = null, lean = 0 }) {
  const sides = 4, ph = Math.PI / 4;
  const body = lathe({ points: [[0.44, -0.45], [0.43, 0.5], [0, 0.5]], sides, phase: ph + lean });
  emit(mesh, 'plank', body, { matrix: m, color: vc(boardColor, { groundAO: 0 }) });
  const cap = lathe({ points: detail === 2 ? [[0.62, 0.48], [0.06, 0.98], [0, 1.0]] : [[0.36, 0.47], [0.62, 0.5], [0.64, 0.56], [0.36, 0.8], [0.08, 0.97], [0, 1.0]], sides, phase: ph + lean });
  emit(mesh, 'metal', cap, { matrix: m, color: vc(roofColor, { groundAO: 0, underside: 0.5 }) });
  if (detail < 2) {
    const face = 0.43 * Math.SQRT1_2;
    const n = detail === 0 ? 4 : 3;
    for (let k = 0; k < n; k++) {
      const y = 0.1 + (0.32 * k) / (n - 1);
      const tilt = rng.rangeF(-0.008, 0.008);
      emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.035, 0.05, 0.012, 0), path: [[-face + 0.06, y + tilt, face + 0.02], [face - 0.06, y - tilt, face + 0.02]], up: [0, 1, 0], caps: 'round', capSegments: 0, capLength: 0.01 }), { matrix: compose(m, rotateY(lean)), color: vc(trimColor, { groundAO: 0 }) });
    }
  }
  if (snowColor) {
    const snow = lathe({ points: [[0.6, 0.55], [0.44, 0.72], [0.2, 0.9], [0, 1.02]], sides, phase: ph + lean });
    emit(mesh, 'snow', snow, { matrix: compose(m, translate(0, 0.035, 0)), color: vc(snowColor, { groundAO: 0 }) });
  }
  return { top: 1.0 };
}



export function leanTo(mesh, root, {
  xWall, xOuter, zBack, zFront, yWall, yOuter, base = 0.36, open = false, overhang = 0.26, detail = 0, rng,
  stoneColor, boardColor, trimColor, roofColor, woodColor, snowColor = null,
}) {
  const dir = Math.sign(xOuter - xWall);
  const R = (mm) => compose(root, mm);
  const d1 = Math.min(2, detail + 1);
  const slope = (yWall - yOuter) / Math.abs(xOuter - xWall);
  const pIn = [xWall - dir * 0.06, yWall + slope * 0.06], pOut = [xOuter + dir * overhang, yOuter - slope * overhang];
  const outline = dir > 0 ? [pIn, pOut] : [pOut, pIn];
  const roofY = (x) => lerp(yWall, yOuter, (x - xWall) / (xOuter - xWall));
  const zb = zBack - 0.2, zf = zFront + 0.24;
  tinRoof(mesh, root, { outline, zBack: zb, zFront: zf, detail, rng: rng.child('roof'), color: roofColor, trimColor, snowColor, sag: 0.025, droop: 0.03, barge: [true, false], ridge: false, thickness: 0.06, amp: 0.022, bargeH: 0.16, lite: true });
  const W = Math.abs(xOuter - xWall), cx = (xWall + xOuter) / 2, D = zFront - zBack, cz = (zFront + zBack) / 2;
  const board = (c) => vc(c, { useTag: true, groundAO: 0.18, groundFade: 0.9 });
  if (!open) {
    emit(mesh, 'stone', plinth({ width: W, depth: D, height: 0.42, thickness: 0.28, detail: d1, rng: rng.child('plinth') }), { matrix: R(translate(cx, 0, cz)), color: vc(stoneColor, { useTag: true, groundAO: 0.15 }) });
    const front = boardWall({ width: W, topAt: (x) => roofY(cx + x) - base, boardW: 0.28, detail, rng: rng.child('front') });
    emit(mesh, 'plank', front, { matrix: R(translate(cx, base, zFront)), color: board(boardColor) });
    const outer = boardWall({ width: D, height: yOuter - base, detail: d1, rng: rng.child('outer') });
    emit(mesh, 'plank', outer, { matrix: R(compose(translate(xOuter, base, cz), rotateY((dir * Math.PI) / 2))), color: board(scaleC(boardColor, 0.94)) });
    if (detail < 2) {
      const lean = rng.rangeF(-0.02, 0.02);
      emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.05, 0.15, 0.018, 0), path: [[xOuter - dir * 0.04, base - 0.05, zFront + 0.03], [xOuter - dir * 0.04 + lean, yOuter - 0.05, zFront + 0.03]], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.02 }), { matrix: root, color: vc(trimColor, { groundAO: 0.2 }) });
    }
    return { roofY, outline };
  }
  const backWall = boardWall({ width: W, topAt: (x) => roofY(cx + x) - 0.02, boardW: 0.3, detail: d1, rng: rng.child('back') });
  emit(mesh, 'plank', backWall, { matrix: R(translate(cx, 0, zBack)), color: board(scaleC(boardColor, 0.88)) });
  const wood = vc(woodColor, { groundAO: 0.25 });
  const px = xOuter - dir * 0.08;
  const beamY = yOuter - 0.1;
  for (const [z, k] of [[zFront, 0], [zBack + 0.12, 1]]) {
    const lean = rng.rangeF(-0.025, 0.025);
    emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.15, 0.15, 0.045, detail === 0 ? 1 : 0), path: [[px, -0.02, z], [px + lean, beamY, z]], up: [0, 0, 1], caps: 'none' }), { matrix: root, color: wood });
    if (detail === 0) {
      emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.08, 0.08, 0.025, 0), path: [[px, beamY - 0.5, z + (k ? 0.04 : -0.04)], [px, beamY - 0.06, z + (k ? 0.45 : -0.45)]], up: [1, 0, 0], caps: 'round', capSegments: 0, capLength: 0.02 }), { matrix: root, color: wood });
    }
  }
  emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.14, 0.13, 0.04, detail === 0 ? 1 : 0), path: [[px, beamY, zb + 0.05], [px, beamY - 0.02, cz], [px, beamY, zf - 0.08]], up: [1, 0, 0], caps: 'round', capSegments: detail === 2 ? 0 : 1, capLength: 0.04 }), { matrix: root, color: wood });
  return { roofY, outline };
}

export { filletLoop };
