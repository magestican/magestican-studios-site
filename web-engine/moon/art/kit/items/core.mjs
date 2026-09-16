





















import { MeshData } from '../../../mesh/meshData.mjs';
import * as S from '../../../mesh/sdf.mjs';
import { budgetFor } from '../../../budgets.mjs';
import { sweep, circleProfile, emit as emitShape } from '../../../mesh/bevel.mjs';
import { paintVertex } from '../shade.mjs';




export function farTube(md, material, path, r0, r1, color) {
  const shape = sweep({ profile: circleProfile(r0, 3), path, up: [0, 0, 1], scales: (t) => 1 - (1 - r1 / r0) * t, caps: ['none', 'flat'], capRings: [] });
  emitShape(md, material, shape, { color: (p, n) => paintVertex(color, p, n, { groundAO: 0, underside: 0.25, mottle: 0.03 }) });
}

export const TAU = Math.PI * 2;
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };


const FINE = new Map();
const FINE_MAX = 64;
const DECIMATED = new Map();
const DECIMATED_MAX = 400;



const LOD_CELL = [1, 1.4, 2.2];




function atLod(part, lod, coarsen) {
  const k = LOD_CELL[lod] * 1.45 ** coarsen;
  const cell = part.cell * k;
  const pad = 3 * cell;
  return { ...part, cell, key: `${part.key}|x${k.toFixed(3)}`, min: part.min.map((v) => v - pad), max: part.max.map((v) => v + pad) };
}



function decimated(key, fine, target) {
  const k = `${key}|${target}`;
  let m = DECIMATED.get(k);
  if (!m) {
    m = S.decimate(fine, target);
    if (DECIMATED.size >= DECIMATED_MAX) DECIMATED.delete(DECIMATED.keys().next().value);
    DECIMATED.set(k, m);
  }
  return { positions: Float64Array.from(m.positions), indices: m.indices };
}



function assertClosed(mesh, key) {
  const edges = new Map();
  const I = mesh.indices;
  for (let f = 0; f < I.length; f += 3) {
    for (let k = 0; k < 3; k++) {
      const a = I[f + k], b = I[f + ((k + 1) % 3)];
      const e = a < b ? a * 4194304 + b : b * 4194304 + a;
      edges.set(e, (edges.get(e) || 0) + 1);
    }
  }
  let odd = 0, over = 0;
  for (const c of edges.values()) { if (c % 2) odd++; else if (c > 2) over++; }
  
  
  if (odd) throw new Error(`item part '${key}' is not a closed surface (${odd} open edges, ${over} pinched) - it leaves its box or is thinner than its cell`);
}

function sound(fine) {
  const nv = fine.positions.length / 3;
  for (const i of fine.indices) if (i >= nv) return false;
  try { assertClosed(fine, ''); return true; } catch { return false; }
}

function fineSurface(part) {
  const key = part.key;
  if (FINE.has(key)) return FINE.get(key);
  const opts = { min: part.min, max: part.max, cell: part.cell };
  let fine = S.polygonise(part.node, opts);
  
  
  
  
  
  if (!sound(fine)) fine = S.polygonise(part.node, { ...opts, lipschitz: 6 });
  if (fine.indices.length === 0) throw new Error(`item part '${key}' polygonised to nothing`);
  const nv = fine.positions.length / 3;
  if (fine.indices.some((i) => i >= nv)) throw new Error(`item part '${key}' has quads on culled cells even with a loose bound`);
  assertClosed(fine, key);
  if (FINE.size >= FINE_MAX) FINE.delete(FINE.keys().next().value);
  FINE.set(key, fine);
  return fine;
}



export function remapUV(md, material, fn) {
  const g = md.groups.get(material);
  if (!g) return;
  const P = g.positions, N = g.normals, C = g.colors, I = g.indices;
  const nv = P.length / 3;
  const uv = new Array(nv);
  for (let v = 0; v < nv; v++) uv[v] = fn([P[v * 3], P[v * 3 + 1], P[v * 3 + 2]], [N[v * 3], N[v * 3 + 1], N[v * 3 + 2]]);
  const out = { positions: [], normals: [], colors: [], uvs: [], indices: [] };
  const seen = new Map();
  for (let f = 0; f < I.length; f += 3) {
    const tri = [I[f], I[f + 1], I[f + 2]];
    const us = tri.map((v) => uv[v][0]);
    const wrap = Math.max(...us) - Math.min(...us) > 0.5;
    for (const v of tri) {
      const shift = wrap && uv[v][0] < 0.5 ? 1 : 0;
      const key = v * 2 + shift;
      let i = seen.get(key);
      if (i === undefined) {
        i = out.positions.length / 3;
        out.positions.push(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]);
        out.normals.push(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]);
        out.colors.push(C[v * 3], C[v * 3 + 1], C[v * 3 + 2]);
        out.uvs.push(uv[v][0] + shift, uv[v][1]);
        seen.set(key, i);
      }
      out.indices.push(i);
    }
  }
  Object.assign(g, out);
}



export const sphereUV = (c, turns = 1) => (p) => {
  const x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2];
  const r = Math.hypot(x, y, z) || 1;
  return [(Math.atan2(z, x) / TAU + 0.5) * turns, Math.acos(Math.max(-1, Math.min(1, y / r))) / Math.PI];
};


export const cylinderUV = (c, vScale, turns = 1) => (p) => [(Math.atan2(p[2] - c[2], p[0] - c[0]) / TAU + 0.5) * turns, (p[1] - c[1]) / vScale];



export function itemTint({ groundFade = 0.03, groundAO = 0.3, underside = 0.3, mottle = 0.035 } = {}) {
  return (x, y, z, c, n) => paintVertex(c, [x, y, z], n, { groundFade, groundAO, underside, mottle });
}




const EMITTED = new Map();
const EMITTED_MAX = 400;






export function buildItem({ name, tier = 'dressing', lod, parts, extras = null, reach = 0.02, tint = itemTint() }) {
  const budget = budgetFor(tier, lod);
  const md = new MeshData(name);
  const extra = new MeshData(`${name}-extras`);
  if (extras) extras(extra);
  const room = budget - extra.triangleCount;
  
  
  const authored = parts.filter((p) => p && (p.share ?? 1) > 0)
    .map((p) => (p.lodCell ? { ...p, cell: (p.cell * p.lodCell[lod]) / LOD_CELL[lod] } : p));
  const shares = authored.reduce((s, p) => s + (p.share ?? 1), 0);
  const coarsen = authored.map(() => 0);
  const live = authored.map((p) => atLod(p, lod, 0));
  const fines = live.map(fineSurface);
  const targets = authored.map((p) => Math.max(12, Math.floor((room * (p.share ?? 1)) / shares * 0.97)));
  const meshes = live.map((p, i) => decimated(p.key, fines[i], targets[i]));
  const count = () => meshes.reduce((s, m) => s + m.indices.length / 3, 0);
  let total = count();
  const stuck = authored.map(() => false);
  for (let guard = 0; total > room && guard < 40; guard++) {
    
    let big = -1;
    meshes.forEach((m, i) => { if (!stuck[i] && (big < 0 || m.indices.length > meshes[big].indices.length)) big = i; });
    if (big < 0) break;
    const tris = meshes[big].indices.length / 3;
    const target = Math.max(12, tris - (total - room) - 2);
    const next = decimated(live[big].key, fines[big], target);
    if (next.indices.length / 3 < tris) {
      meshes[big] = next;
    } else if (coarsen[big] < (authored[big].maxCoarsen ?? 5)) {
      
      
      
      
      coarsen[big]++;
      live[big] = atLod(authored[big], lod, coarsen[big]);
      fines[big] = fineSurface(live[big]);
      meshes[big] = decimated(live[big].key, fines[big], Math.min(targets[big], target));
    } else {
      stuck[big] = true;
    }
    total = count();
  }
  if (total > room) throw new Error(`${name}: ${total + extra.triangleCount} triangles, over the ${budget} budget`);

  const scene = live.length > 1 ? S.union(0, live.map((p) => p.node)) : live[0].node;
  const sceneKey = live.map((p) => p.key).join(',');
  live.forEach((p, i) => {
    const mesh = meshes[i];
    const emitKey = `${p.key}|${mesh.indices.length}|${sceneKey}`;
    let tmp = EMITTED.get(emitKey);
    if (!tmp) {
      const P = mesh.positions;
      
      for (let v = 0; v < P.length; v += 3) {
        const d = p.node.d(P[v], P[v + 1], P[v + 2]);
        const n = S.normalAt(p.node, P[v], P[v + 1], P[v + 2], p.cell * 0.25);
        const step = Math.max(-p.cell, Math.min(p.cell, d));
        P[v] -= n[0] * step; P[v + 1] -= n[1] * step; P[v + 2] -= n[2] * step;
      }
      tmp = new MeshData(name);
      S.emit(tmp, mesh, p.node, {
        scene, material: p.material, uvScale: p.uvScale ?? 0.08, aoMin: p.aoMin ?? 0.55,
        ao: { reach: p.reach ?? reach, strength: 1.3 }, tint,
      });
      for (const [mat, fn] of Object.entries(p.uv || {})) remapUV(tmp, mat, fn);
      if (EMITTED.size >= EMITTED_MAX) EMITTED.delete(EMITTED.keys().next().value);
      EMITTED.set(emitKey, tmp);
    }
    md.append(tmp);
  });
  md.append(extra);

  
  let minY = Infinity;
  for (const g of md.groups.values()) for (let i = 1; i < g.positions.length; i += 3) minY = Math.min(minY, g.positions[i]);
  if (Number.isFinite(minY) && minY !== 0) for (const g of md.groups.values()) for (let i = 1; i < g.positions.length; i += 3) g.positions[i] -= minY;
  return md;
}




export function tube(points, r0, r1 = r0, k = 0) {
  const segs = [];
  for (let i = 0; i < points.length - 1; i++) {
    const t0 = i / (points.length - 1), t1 = (i + 1) / (points.length - 1);
    segs.push(S.roundCone(points[i], points[i + 1], r0 + (r1 - r0) * t0, r0 + (r1 - r0) * t1));
  }
  return segs.length === 1 ? segs[0] : S.union(k || Math.min(r0, r1) * 0.5, segs);
}


export function bezier(a, b, c, n) {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1), u = 1 - t;
    return [0, 1, 2].map((k) => u * u * a[k] + 2 * u * t * b[k] + t * t * c[k]);
  });
}


export function boxOf(points, pad) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of points) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); }
  return { min: min.map((v) => v - pad), max: max.map((v) => v + pad) };
}



export function rotationAffine(rot, t = [0, 0, 0]) {
  const R = S.rotationMatrix(rot);
  return [R[0], R[1], R[2], t[0], R[3], R[4], R[5], t[1], R[6], R[7], R[8], t[2]];
}








export function leafBlade(md, { base, dir, side, len, wid, color, rows = 4, cup = 0.28, curl = 0.12, skew = 0.14, droop = 0.1, material = 'leaf', window = [0.11, 0.2, 0.19, 0.4], shape = 'oval' }) {
  const d = norm(dir);
  let s = norm(sub(side, scl(d, dot(side, d))));
  let up = cross(s, d);
  if (up[1] < 0) { s = scl(s, -1); up = scl(up, -1); }
  const width = (t) => {
    if (shape === 'lance') return Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 1.2) * 0.8;
    return Math.pow(Math.sin(Math.PI * Math.pow(t, 0.85)), 0.8);
  };
  const at = (t, c) => {
    const hw = (wid / 2) * width(t) * (c < 0 ? 1 + skew : 1 - skew);
    const lift = cup * wid * 0.5 * Math.abs(c) * width(t) + curl * len * t * t * t - droop * len * Math.sin(Math.PI * t) * 0.5;
    return add(add(add(base, scl(d, len * t)), scl(s, hw * c)), scl(up, lift));
  };
  const ts = Array.from({ length: rows + 1 }, (_, i) => i / rows);
  const uvOf = (t, c) => [window[0] + (window[2] - window[0]) * (c + 1) / 2, window[1] + (window[3] - window[1]) * t];
  for (const face of [1, -1]) {
    const rowsIdx = ts.map((t, i) => {
      const cols = i === 0 || i === rows ? [0] : [-1, 0, 1];
      return cols.map((c) => {
        const n0 = norm(add(up, scl(s, -c * cup * 0.9)));
        const n = scl(norm(add(n0, [0, 0.25 * face, 0])), face);
        const k = (c === 0 ? 0.9 : 1.04) * (face > 0 ? 1 : 0.78) * (0.86 + 0.14 * t);
        return md.vertex(material, at(t, c), n, scl(color, k), uvOf(t, c));
      });
    });
    const tri = (a, b, c) => {
      const g = md.group(material);
      const p = (i) => [g.positions[i * 3], g.positions[i * 3 + 1], g.positions[i * 3 + 2]];
      const nn = cross(sub(p(b), p(a)), sub(p(c), p(a)));
      if (dot(nn, up) * face >= 0) md.tri(material, a, b, c); else md.tri(material, a, c, b);
    };
    for (let i = 0; i < rows; i++) {
      const A = rowsIdx[i], B = rowsIdx[i + 1];
      if (A.length === 1 && B.length === 3) { tri(A[0], B[0], B[1]); tri(A[0], B[1], B[2]); }
      else if (A.length === 3 && B.length === 1) { tri(A[0], A[1], B[0]); tri(A[1], A[2], B[0]); }
      else if (A.length === 3 && B.length === 3) {
        tri(A[0], A[1], B[0]); tri(A[1], B[1], B[0]);
        tri(A[1], A[2], B[1]); tri(A[2], B[2], B[1]);
      }
    }
  }
}
