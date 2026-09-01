




























































































































































import {
  emptyMesh, pushTri, pushTriOut, pushQuadOut, mergeMeshes, stackMesh,
} from './ps1Mesh.mjs';







const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]);
  
  
  return l < 1e-9 ? [0, 0, 1] : [a[0] / l, a[1] / l, a[2] / l];
};
const lerp = (a, b, t) => a + (b - a) * t;


function frameOf(forward = [1, 0, 0], up = [0, 0, 1]) {
  const f = norm(forward);
  let u = norm(up);
  const s = norm(cross(u, f));
  u = cross(f, s);
  return { f, s, u };
}


const place = (o, fr, p) =>
  add(o, add(add(mul(fr.f, p[0]), mul(fr.s, p[1])), mul(fr.u, p[2])));

const remapUV = (rect, u, v) => [
  rect[0] + (rect[2] - rect[0]) * u,
  rect[1] + (rect[3] - rect[1]) * v,
];




















export const JAW = {
  oval: { cheek: 0.96, chin: 0.86, drop: 0.98, crown: 1.02 },
  taper: { cheek: 0.94, chin: 0.62, drop: 1.06, crown: 1.00 },
  round: { cheek: 1.00, chin: 0.92, drop: 0.88, crown: 1.04 },
  square: { cheek: 1.04, chin: 1.00, drop: 0.90, crown: 1.02 },
  long: { cheek: 0.90, chin: 0.78, drop: 1.16, crown: 0.96 },
  wide: { cheek: 1.10, chin: 0.94, drop: 0.86, crown: 1.08 },
};






export const WIDEST_JAW = Object.keys(JAW).reduce((a, b) =>
  (JAW[b].crown + JAW[b].cheek > JAW[a].crown + JAW[a].cheek ? b : a));


export const HEAD_UV = {
  face: [0.00, 0.00, 0.50, 0.75],
  sides: [0.52, 0.00, 1.00, 0.75],
  hair: [0.00, 0.78, 0.50, 1.00],
  scrap: [0.52, 0.78, 1.00, 1.00],
};




























export const HEAD_COLS = [0.00, 0.62, 1.00, 0.66, -0.66, -1.00, -0.62];











const HEAD_UNWRAP = [5, 6, 0, 1, 2, 2, 3, 4, 5];
const HEAD_SIDE_U = [null, null, null, null, null, 0.00, 0.34, 0.68, 1.00];

const HEAD_CAP_COLS = [0, 1, 2, 3, 4, 6, 7];






















































export const HEAD_RINGS = [
  
  { name: 'cranium', z: 0.74, key: 'crown', hw: 0.80, v: 0.139, x: [0.56, 0.50, 0.12, -0.62], s: [0.60, 0.64] },
  { name: 'forehead', z: 0.46, key: 'crown', hw: 0.95, v: 0.278, x: [0.82, 0.78, 0.22, -0.84], s: [0.63, 0.70] },
  { name: 'browTop', z: 0.24, key: 'cheek', hw: 0.99, v: 0.388, x: [0.84, 0.88, 0.26, -0.90], s: [0.64, 0.72] },
  { name: 'browLip', z: 0.11, key: 'cheek', hw: 1.00, v: 0.452, x: [0.83, 0.86, 0.24, -0.92], s: [0.64, 0.72] },
  { name: 'eye', z: -0.06, key: 'cheek', hw: 1.00, v: 0.537, x: [0.80, 0.72, 0.20, -0.92], s: [0.63, 0.72] },
  { name: 'cheek', z: -0.24, key: 'cheek', hw: 1.00, v: 0.626, x: [0.86, 0.78, 0.22, -0.88], s: [0.66, 0.70] },
  { name: 'mouth', drop: 0.44, key: 'mix45', hw: 0.96, v: 0.721, x: [0.80, 0.70, 0.10, -0.78], s: [0.62, 0.66] },
  { name: 'jaw', drop: 0.72, key: 'mix82', hw: 0.90, v: 0.858, x: [0.70, 0.60, 0.02, -0.62], s: [0.58, 0.60] },
  { name: 'chin', drop: 0.95, key: 'chin', hw: 0.55, v: 0.970, x: [0.56, 0.42, -0.14, -0.40], s: [0.72, 0.70] },
];








const APEX = [-0.10, 0, 1.02];












const browPushOf = (brow) => Math.max(-0.05, Math.min(0.05, ((brow ?? 3.5) - 3.5) * 0.012));


function halfWidthOf(ring, J) {
  switch (ring.key) {
    case 'crown': return J.crown * ring.hw;
    case 'chin': return J.chin * ring.hw;
    
    
    
    case 'mix45': return lerp(J.cheek, J.chin, 0.45) * ring.hw;
    case 'mix82': return lerp(J.cheek, J.chin, 0.82) * ring.hw;
    default: return J.cheek * ring.hw;
  }
}









function resolveSkull(J, brow) {
  const push = browPushOf(brow);
  const rows = HEAD_RINGS.map((ring) => {
    const z = ring.drop !== undefined ? -J.drop * ring.drop : ring.z;
    const hw = halfWidthOf(ring, J);
    
    
    
    let bump = 0;
    if (ring.name === 'browTop' || ring.name === 'browLip') bump = push;
    if (ring.name === 'eye') bump = -push * 0.6;
    const xs = [
      ring.x[0] + bump, ring.x[1] + bump, ring.x[2] + bump * 0.3, ring.x[3],
    ];
    const pts2 = HEAD_COLS.map((sFrac, ci) => {
      
      const which = ci === 0 ? 0 : (ci === 1 || ci === 6 ? 1 : (ci === 2 || ci === 5 ? 2 : 3));
      const sMul = which === 1 ? ring.s[0] : (which === 3 ? ring.s[1] : 1);
      
      
      
      
      return [xs[which], sFrac * sMul * hw, z];
    });
    return { name: ring.name, z, hw, v: ring.v, pts2 };
  });
  return { apex: APEX, rows };
}






function skullAt(res, z) {
  const { rows, apex } = res;
  const stack = [{ pts2: HEAD_COLS.map(() => [apex[0], 0, apex[2]]), z: apex[2] }, ...rows];
  if (z >= stack[0].z) return stack[0].pts2.map((p) => [p[0], p[1], z]);
  for (let i = 0; i + 1 < stack.length; i += 1) {
    const a = stack[i]; const b = stack[i + 1];
    if (z <= a.z && z >= b.z) {
      const t = (a.z - z) / Math.max(1e-6, a.z - b.z);
      return a.pts2.map((p, ci) => [
        lerp(p[0], b.pts2[ci][0], t), lerp(p[1], b.pts2[ci][1], t), z,
      ]);
    }
  }
  const last = stack[stack.length - 1];
  return last.pts2.map((p) => [p[0], p[1], z]);
}

























export function head3d(opts = {}) {
  const {
    centre = [0, 0, 0], r = 0.118, jaw = 'oval', brow = 3.5,
    forward = [1, 0, 0], up = [0, 0, 1],
    nose = true, ears = true, uv = null,
    
    uvFace = null, uvSides = null, uvScrap = null,
  } = opts;

  const charts = uv || HEAD_UV;
  const cFace = uvFace || charts.face || HEAD_UV.face;
  const cSides = uvSides || charts.sides || HEAD_UV.sides;
  const cScrap = uvScrap || charts.scrap || HEAD_UV.scrap;

  const J = JAW[jaw] || JAW.oval;
  const fr = frameOf(forward, up);
  const P = (x, y, z) => place(centre, fr, [x * r, y * r, z * r]);
  const res = resolveSkull(J, brow);

  
  
  
  
  
  let yMax = 1e-6;
  for (const row of res.rows) yMax = Math.max(yMax, row.hw);

  const rings = res.rows.map((row) => {
    const pts = []; const uvs = [];
    for (let k = 0; k < HEAD_UNWRAP.length; k += 1) {
      const ci = HEAD_UNWRAP[k];
      const p = row.pts2[ci];
      pts.push(P(p[0], p[1], p[2]));
      if (HEAD_SIDE_U[k] === null) {
        
        
        uvs.push(remapUV(cFace, 0.5 + 0.46 * (p[1] / yMax), row.v));
      } else {
        
        uvs.push(remapUV(cSides, HEAD_SIDE_U[k], row.v));
      }
    }
    return { pts, uv: uvs };
  });

  const skull = stackMesh(rings, {
    apex: P(APEX[0], APEX[1], APEX[2]),
    
    
    
    
    
    apexUV: (a, b) => [(a[0] + b[0]) / 2, Math.min(cFace[1], cSides[1])],
    capLast: true,
    
    
    
    lastCapUV: (i) => remapUV(cScrap,
      0.5 + 0.4 * Math.cos((i / HEAD_UNWRAP.length) * Math.PI * 2),
      0.5 + 0.4 * Math.sin((i / HEAD_UNWRAP.length) * Math.PI * 2)),
    skipBand: (j) => j === 4 || j === HEAD_UNWRAP.length - 1,
    capCols: HEAD_CAP_COLS,
  });

  const parts = [{ name: 'skull', mesh: skull }];
  if (nose) parts.push({ name: 'nose', mesh: noseWedge(P, cFace, nose === 'human' ? jaw : null) });
  if (ears) {
    parts.push({ name: 'earL', mesh: earBlade(P, res, cSides, 1) });
    parts.push({ name: 'earR', mesh: earBlade(P, res, cSides, -1) });
  }
  const out = mergeMeshes(parts.map((p) => p.mesh));
  out.parts = parts.map((p) => ({ name: p.name, mesh: p.mesh, tris: p.mesh.tris }));
  return out;
}

























export const NOSE = Object.freeze({
  
  root: 0.13,
  
  bridge: -0.06,
  
  tip: -0.335,
  
  wing: -0.275,
  
  column: -0.318,
  
  halfY: 0.19,
  
  halfU: 0.052,
});










export function chartRowOf(z, jawId = 'oval') {
  const J = JAW[jawId] || JAW.oval;
  const a = HEAD_RINGS[0];
  const b = HEAD_RINGS[HEAD_RINGS.length - 1];
  const bz = b.drop !== undefined ? -J.drop * b.drop : b.z;
  return a.v + (a.z - z) * ((b.v - a.v) / (a.z - bz));
}



























function noseWedge(P, cFace, humanJaw) {
  if (humanJaw) return humanNose(P, cFace, humanJaw);
  const A = P(0.83, 0, 0.13);    
  const B = P(0.91, 0, -0.05);   
  const T = P(0.96, 0, -0.24);   
  const L = P(0.85, 0.20, -0.33);  
  const R = P(0.85, -0.20, -0.33); 
  const c = P(0.10, 0, -0.12);   
  const m = emptyMesh();
  
  
  const nu = (du, v) => remapUV(cFace, 0.5 + du, v);
  const uA = nu(0, 0.34); const uB = nu(0, 0.46); const uT = nu(0, 0.57);
  const uL = nu(0.055, 0.62); const uR = nu(-0.055, 0.62);
  pushTriOut(m, c, A, B, L, uA, uB, uL);
  pushTriOut(m, c, A, R, B, uA, uR, uB);
  pushTriOut(m, c, B, T, L, uB, uT, uL);
  pushTriOut(m, c, B, R, T, uB, uR, uT);
  pushTriOut(m, c, T, L, R, uT, uL, uR);
  pushTriOut(m, c, A, L, R, uA, uL, uR);
  return m;
}





























































function humanNose(P, cFace, jawId) {
  const A = P(0.83, 0, NOSE.root);
  const B = P(0.91, 0, NOSE.bridge);
  const T = P(0.97, 0, NOSE.tip);
  const L = P(0.82, NOSE.halfY, NOSE.wing);
  const R = P(0.82, -NOSE.halfY, NOSE.wing);
  const C = P(0.885, 0, NOSE.column);
  const c = [
    (A[0] + B[0] + T[0] + L[0] + R[0] + C[0]) / 6,
    (A[1] + B[1] + T[1] + L[1] + R[1] + C[1]) / 6,
    (A[2] + B[2] + T[2] + L[2] + R[2] + C[2]) / 6,
  ];
  const m = emptyMesh();
  const nu = (du, z) => remapUV(cFace, 0.5 + du, chartRowOf(z, jawId));
  const uA = nu(0, NOSE.root);
  const uB = nu(0, NOSE.bridge);
  const uT = nu(0, NOSE.tip);
  const uC = nu(0, NOSE.column);
  const uL = nu(NOSE.halfU, NOSE.wing);
  const uR = nu(-NOSE.halfU, NOSE.wing);
  
  pushTriOut(m, c, A, B, L, uA, uB, uL);
  pushTriOut(m, c, A, R, B, uA, uR, uB);
  pushTriOut(m, c, B, T, L, uB, uT, uL);
  pushTriOut(m, c, B, R, T, uB, uR, uT);
  
  pushTriOut(m, c, T, L, C, uT, uL, uC);
  pushTriOut(m, c, T, C, R, uT, uC, uR);
  
  pushTriOut(m, c, A, L, C, uA, uL, uC);
  pushTriOut(m, c, A, C, R, uA, uC, uR);
  return m;
}






















function earBlade(P, res, cSides, sgn) {
  
  
  
  const eye = res.rows.find((q) => q.name === 'eye');
  const mouth = res.rows.find((q) => q.name === 'mouth');
  const hw = (eye.hw + mouth.hw) / 2;
  const y = (k) => sgn * hw * k;
  
  
  
  
  
  
  
  const e0 = P(0.02, y(0.92), 0.06);   
  const e1 = P(-0.32, y(0.92), 0.02);  
  const e2 = P(-0.36, y(0.92), -0.30); 
  const e3 = P(-0.04, y(0.92), -0.32); 
  const apex = P(-0.22, y(1.14), -0.12);
  const c = P(0.00, y(0.10), -0.10);   
  const m = emptyMesh();
  
  
  
  const U = (u, v) => remapUV(cSides, u, v);
  const q0 = U(0.24, 0.40); const q1 = U(0.36, 0.40);
  const q2 = U(0.36, 0.56); const q3 = U(0.24, 0.56);
  const qa = U(0.30, 0.48);
  pushTriOut(m, c, e0, e1, apex, q0, q1, qa);
  pushTriOut(m, c, e1, e2, apex, q1, q2, qa);
  pushTriOut(m, c, e2, e3, apex, q2, q3, qa);
  pushTriOut(m, c, e3, e0, apex, q3, q0, qa);
  return m;
}
































































































function flipWinding(mesh) {
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const t = mesh.indices[i + 1];
    mesh.indices[i + 1] = mesh.indices[i + 2];
    mesh.indices[i + 2] = t;
  }
  for (let i = 0; i < mesh.normals.length; i += 1) mesh.normals[i] = -mesh.normals[i];
  return mesh;
}

function hairShell(P, res, o = {}) {
  const {
    low = -0.20, frontLow = null, sideLow = null, puffTop = 1.10, puffMid = 1.09,
    puffLow = 1.03, uv = HEAD_UV.hair,
    
    
    
    
    
    
    crown = 0,
  } = o;
  const fl = frontLow === null ? low : frontLow;
  const sl = sideLow === null ? (fl + low) / 2 : sideLow;
  
  
  
  const colLow = [fl, fl, sl, low, low, sl, fl];
  const CROWN = 0.74;

  const rowAt = (zOf, puff, v) => {
    const pts = []; const uvs = [];
    for (let ci = 0; ci < HEAD_COLS.length; ci += 1) {
      const z = zOf(ci);
      const p = skullAt(res, z)[ci];
      pts.push(P(p[0] * puff, p[1] * puff, z));
      uvs.push(remapUV(uv, ci / HEAD_COLS.length, v));
    }
    return { pts, uv: uvs };
  };

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const rows = [
    rowAt(() => CROWN, puffTop, 0.10),
    rowAt((ci) => lerp(CROWN, colLow[ci], 0.40), puffMid, 0.36),
    rowAt((ci) => lerp(CROWN, colLow[ci], 0.72), puffMid, 0.64),
    rowAt((ci) => colLow[ci], puffLow, 0.92),
  ];
  const apexP = P(APEX[0] * puffTop, 0, APEX[2] * puffTop + 0.06);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const stack = crown > 0
    ? [{
      pts: skullAt(res, CROWN).map((p) => P(
        p[0] * puffTop * crown + APEX[0] * puffTop * (1 - crown),
        p[1] * puffTop * crown,
        APEX[2] * puffTop + 0.02,
      )),
      uv: HEAD_COLS.map((_, ci) => remapUV(uv, ci / HEAD_COLS.length, 0.02)),
    }, ...rows]
    : rows;

  
  
  
  return flipWinding(stackMesh(stack, crown > 0
    ? {
      capFirst: true,
      firstCapUV: (i) => remapUV(uv, 0.10 + 0.12 * i, uv[1] + (uv[3] - uv[1]) * 0.01),
    }
    : {
      apex: apexP,
      apexUV: (a, b) => [(a[0] + b[0]) / 2, uv[1] + (uv[3] - uv[1]) * 0.02],
    }));
}





























function hairBlade(a, b, wide, thick, tip, wDir, uv, m) {
  const ax = norm(sub(b, a));
  let side = sub(wDir, mul(ax, dot(wDir, ax)));
  
  
  if (Math.hypot(side[0], side[1], side[2]) < 1e-6) side = norm(cross(ax, [0, 1, 0]));
  const W = mul(norm(side), wide);
  const D = mul(norm(cross(ax, norm(side))), thick);
  const p0 = add(sub(a, W), mul(D, -1));
  const p1 = add(add(a, W), mul(D, -1));
  const p2 = add(add(a, W), D);
  const p3 = add(sub(a, W), D);
  const q0 = sub(b, mul(W, tip));
  const q1 = add(b, mul(W, tip));
  const c = mul(add(add(p0, p2), add(q0, q1)), 0.25);
  const U = (u, v) => remapUV(uv, u, v);
  pushQuadOut(m, c, p3, p2, q1, q0, U(0.06, 0.86), U(0.30, 0.86), U(0.26, 0.42), U(0.10, 0.42));
  pushQuadOut(m, c, p1, p0, q0, q1, U(0.36, 0.86), U(0.60, 0.86), U(0.56, 0.42), U(0.40, 0.42));
  pushTriOut(m, c, p2, p1, q1, U(0.66, 0.86), U(0.86, 0.86), U(0.76, 0.42));
  pushTriOut(m, c, p0, p3, q0, U(0.66, 0.60), U(0.86, 0.60), U(0.76, 0.16));
  return m;
}





















































export function hair3d(style, opts = {}) {
  const {
    centre = [0, 0, 0], r = 0.118, forward = [1, 0, 0], up = [0, 0, 1],
    jaw = WIDEST_JAW, brow = 3.5, uv = HEAD_UV.hair,
  } = opts;
  const fr = frameOf(forward, up);
  const P = (x, y, z) => place(centre, fr, [x * r, y * r, z * r]);
  const V = (p) => place(centre, fr, [p[0] * r, p[1] * r, p[2] * r]);
  const res = resolveSkull(JAW[jaw] || JAW.oval, brow);
  const parts = [];

  switch (style) {
    case 'curtain': {
      
      
      
      
      
      
      
      parts.push({
        name: 'shell',
        mesh: hairShell(P, res, { low: -0.46, frontLow: 0.34, puffTop: 1.13, puffMid: 1.12, puffLow: 1.06, uv }),
      });
      for (const s of [-1, 1]) {
        
        
        
        
        
        
        
        
        const m = emptyMesh();
        hairBlade(V([-0.28, s * 0.98, 0.26]), V([-0.36, s * 1.02, -2.40]),
          0.42 * r, 0.13 * r, 0.55, FORE_AFT, uv, m);
        parts.push({ name: `lock${s > 0 ? 'L' : 'R'}`, mesh: m });
        
        
        
        
        
        
        
        const f = emptyMesh();
        hairBlade(V([0.04, s * 0.94, 0.34]), V([-0.06, s * 1.00, -1.20]),
          0.12 * r, 0.08 * r, 0.30, FORE_AFT, uv, f);
        parts.push({ name: `frame${s > 0 ? 'L' : 'R'}`, mesh: f });
      }
      break;
    }
    case 'tails': {
      
      
      
      parts.push({
        name: 'shell',
        mesh: hairShell(P, res, { low: -0.30, frontLow: 0.40, puffTop: 1.12, puffMid: 1.11, puffLow: 1.04, uv }),
      });
      const a = emptyMesh();
      hairBlade(V([-0.16, 1.02, 0.60]), V([-0.64, 1.80, -1.55]), 0.39 * r, 0.22 * r, 0.28, FORE_AFT, uv, a);
      parts.push({ name: 'tailL', mesh: a });
      const b = emptyMesh();
      hairBlade(V([-0.16, -1.02, 0.60]), V([-0.60, -1.70, -1.34]), 0.39 * r, 0.22 * r, 0.28, FORE_AFT, uv, b);
      parts.push({ name: 'tailR', mesh: b });
      break;
    }
    case 'crop':
      
      
      
      
      parts.push({
        name: 'shell',
        mesh: hairShell(P, res, { low: -0.50, frontLow: 0.26, sideLow: -0.02, puffTop: 1.075, puffMid: 1.07, puffLow: 1.045, uv }),
      });
      break;
    case 'sleek': {
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      parts.push({
        name: 'shell',
        mesh: hairShell(P, res, {
          low: -0.46, frontLow: 0.30, sideLow: 0.10,
          puffTop: 1.075, puffMid: 1.052, puffLow: 1.008, uv,
          
          
          
          
          crown: 0.22,
        }),
      });
      
      
      
      
      
      
      
      
      const sweep = emptyMesh();
      hairBlade(V([0.52, 0.26, 0.60]), V([0.94, -0.30, 0.24]),
        0.15 * r, 0.07 * r, 0.30, FORE_AFT, uv, sweep);
      parts.push({ name: 'sweep', mesh: sweep });
      
      
      
      for (const s2 of [-1, 1]) {
        const sb = emptyMesh();
        hairBlade(V([0.20, s2 * 0.90, 0.10]), V([0.24, s2 * 0.86, -0.26]),
          0.09 * r, 0.06 * r, 0.18, FORE_AFT, uv, sb);
        parts.push({ name: `burn${s2 > 0 ? 'L' : 'R'}`, mesh: sb });
      }
      break;
    }
    case 'topknot': {
      
      
      
      
      
      
      
      
      
      parts.push({
        name: 'shell',
        mesh: hairShell(P, res, { low: -0.34, frontLow: 0.58, puffTop: 1.08, puffMid: 1.07, puffLow: 1.03, uv }),
      });
      
      
      
      
      
      
      
      
      
      
      const knotC = [-0.50, 0, 1.10];
      const knotR = 0.52;
      const knotH = 0.60;
      const ring = { pts: [], uv: [] };
      for (let j = 0; j < 5; j += 1) {
        const th = (j / 5) * Math.PI * 2;
        ring.pts.push(V([knotC[0] + Math.cos(th) * knotR, Math.sin(th) * knotR, knotC[2]]));
        ring.uv.push(remapUV(uv, j / 5, 0.5));
      }
      const knot = stackMesh([ring], {
        apex: V([knotC[0], 0, knotC[2] + knotR * knotH]),
        apexUV: [remapUV(uv, 0.5, 0.16)[0], remapUV(uv, 0.5, 0.16)[1]],
      });
      
      
      const lowApex = V([knotC[0], 0, knotC[2] - knotR * knotH]);
      for (let j = 0; j < 5; j += 1) {
        const k = (j + 1) % 5;
        pushTri(knot, lowApex, ring.pts[k], ring.pts[j],
          remapUV(uv, 0.5, 0.88), ring.uv[k], ring.uv[j]);
      }
      parts.push({ name: 'knot', mesh: knot });
      
      
      
      const g = emptyMesh();
      hairBlade(V([-0.04, 0, 0.78]), V(knotC), 0.29 * r, 0.22 * r, 0.80, ACROSS, uv, g);
      parts.push({ name: 'gather', mesh: g });
      const t = emptyMesh();
      hairBlade(V([-0.70, 0, 0.80]), V([-0.92, 0.04, -1.55]), 0.32 * r, 0.17 * r, 0.40, ACROSS, uv, t);
      parts.push({ name: 'tail', mesh: t });
      break;
    }
    case 'bob': {
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      parts.push({
        name: 'shell',
        mesh: hairShell(P, res, { low: -0.44, frontLow: 0.22, sideLow: 0.02, puffTop: 1.11, puffMid: 1.12, puffLow: 1.08, uv }),
      });
      for (const s of [-1, 1]) {
        
        
        
        
        
        
        
        
        const m = emptyMesh();
        hairBlade(V([-0.26, s * 1.04, 0.10]), V([-0.32, s * 1.22, -1.30]),
          0.29 * r, 0.16 * r, 0.92, FORE_AFT, uv, m);
        parts.push({ name: `panel${s > 0 ? 'L' : 'R'}`, mesh: m });
      }
      break;
    }
    default: {
      
      
      
      
      
      parts.push({
        name: 'shell',
        mesh: hairShell(P, res, { low: -0.26, frontLow: 0.44, puffTop: 1.14, puffMid: 1.12, puffLow: 1.05, uv }),
      });
      const spikes = [
        
        [-1.15, 0.30, 0.46, 1.56],
        [-0.58, 0.35, 0.32, 1.90],
        [0.00, 0.40, 0.12, 2.04],
        [0.62, 0.30, -0.34, 1.84],
        [1.20, 0.35, -0.52, 1.50],
      ];
      const m = emptyMesh();
      for (let i = 0; i < spikes.length; i += 1) {
        const [yaw, bw, tipOut, tipZ] = spikes[i];
        
        
        
        
        
        const sgn = i % 2 === 0 ? 1 : -1;
        
        
        
        
        const cx = Math.cos(yaw) * 0.24; const cy = Math.sin(yaw) * 0.44 * sgn;
        const base = [
          V([cx - bw, cy - bw * 0.8, 0.66]), V([cx + bw, cy - bw * 0.8, 0.66]),
          V([cx + bw, cy + bw * 0.8, 0.66]), V([cx - bw, cy + bw * 0.8, 0.66]),
        ];
        const tip = V([cx + tipOut, cy + Math.sin(yaw) * 0.9 * sgn, tipZ]);
        const c = V([cx * 0.4, cy * 0.4, 0.40]);
        const U = (u, v) => remapUV(uv, u, v);
        for (let j = 0; j < 4; j += 1) {
          pushTriOut(m, c, base[j], base[(j + 1) % 4], tip,
            U(0.05 + j * 0.2, 0.92), U(0.20 + j * 0.2, 0.92), U(0.12 + j * 0.2, 0.40));
        }
      }
      parts.push({ name: 'spikes', mesh: m });
      break;
    }
  }

  const out = mergeMeshes(parts.map((p) => p.mesh));
  out.parts = parts.map((p) => ({ name: p.name, mesh: p.mesh, tris: p.mesh.tris }));
  return out;
}










const FORE_AFT = [1, 0, 0];
const ACROSS = [0, 1, 0];


export const HAIR_STYLES = ['spike', 'curtain', 'tails', 'crop', 'topknot', 'bob'];
