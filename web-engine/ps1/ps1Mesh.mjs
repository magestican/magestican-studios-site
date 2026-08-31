






































































































































































const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => {
  const l = len(a);
  
  
  
  
  return l < 1e-9 ? [0, 0, 1] : [a[0] / l, a[1] / l, a[2] / l];
};
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];









function frameOf(forward = [1, 0, 0], up = [0, 0, 1]) {
  const f = norm(forward);
  let u = norm(up);
  const s = norm(cross(u, f));
  u = cross(f, s);
  return { f, s, u };
}


const place = (o, fr, p) =>
  add(o, add(add(mul(fr.f, p[0]), mul(fr.s, p[1])), mul(fr.u, p[2])));





export function emptyMesh() {
  return { positions: [], normals: [], uvs: [], indices: [], tris: 0 };
}








export function pushTri(m, p0, p1, p2, uv0, uv1, uv2) {
  const n = norm(cross(sub(p1, p0), sub(p2, p0)));
  const base = m.positions.length / 3;
  m.positions.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
  m.normals.push(n[0], n[1], n[2], n[0], n[1], n[2], n[0], n[1], n[2]);
  m.uvs.push(uv0[0], uv0[1], uv1[0], uv1[1], uv2[0], uv2[1]);
  m.indices.push(base, base + 1, base + 2);
  m.tris += 1;
  return m;
}


export function pushQuad(m, p0, p1, p2, p3, uv0, uv1, uv2, uv3) {
  pushTri(m, p0, p1, p2, uv0, uv1, uv2);
  pushTri(m, p0, p2, p3, uv0, uv2, uv3);
  return m;
}










export function pushTriOut(m, c, p0, p1, p2, uv0, uv1, uv2) {
  const n = cross(sub(p1, p0), sub(p2, p0));
  if (dot(n, sub(p0, c)) < 0) return pushTri(m, p0, p2, p1, uv0, uv2, uv1);
  return pushTri(m, p0, p1, p2, uv0, uv1, uv2);
}

export function pushQuadOut(m, c, p0, p1, p2, p3, uv0, uv1, uv2, uv3) {
  const n = cross(sub(p1, p0), sub(p2, p0));
  if (dot(n, sub(p0, c)) < 0) {
    pushTri(m, p0, p3, p2, uv0, uv3, uv2);
    pushTri(m, p0, p2, p1, uv0, uv2, uv1);
  } else {
    pushTri(m, p0, p1, p2, uv0, uv1, uv2);
    pushTri(m, p0, p2, p3, uv0, uv2, uv3);
  }
  return m;
}


export function mergeMeshes(list) {
  const out = emptyMesh();
  for (const m of list) {
    if (!m) continue;
    const base = out.positions.length / 3;
    out.positions.push(...m.positions);
    out.normals.push(...m.normals);
    out.uvs.push(...m.uvs);
    for (const i of m.indices) out.indices.push(i + base);
    out.tris += m.tris;
  }
  return out;
}

const centroidOf = (pts) => {
  const c = [0, 0, 0];
  for (const p of pts) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; }
  return mul(c, 1 / Math.max(1, pts.length));
};




























export function stackMesh(rings, opts = {}) {
  const {
    apex = null, apexUV = null, capFirst = false, capLast = false,
    firstCapUV = null, lastCapUV = null, skipBand = null, capCols = null,
  } = opts;
  const m = emptyMesh();
  if (rings.length === 0) return m;
  const n = rings[0].pts.length;

  if (apex) {
    const r = rings[0];
    for (let j = 0; j < n; j += 1) {
      const k = (j + 1) % n;
      if (skipBand && skipBand(j)) continue;
      
      
      
      const au = typeof apexUV === 'function' ? apexUV(r.uv[j], r.uv[k])
        : (apexUV || [(r.uv[j][0] + r.uv[k][0]) / 2, r.uv[j][1] - 0.02]);
      pushTri(m, apex, r.pts[j], r.pts[k], au, r.uv[j], r.uv[k]);
    }
  } else if (capFirst) {
    const r = rings[0];
    const cols = capCols || r.pts.map((_, i) => i);
    const uv = firstCapUV || ((i) => r.uv[i]);
    for (let j = 1; j < cols.length - 1; j += 1) {
      pushTri(m, r.pts[cols[0]], r.pts[cols[j]], r.pts[cols[j + 1]],
        uv(cols[0]), uv(cols[j]), uv(cols[j + 1]));
    }
  }

  for (let i = 0; i + 1 < rings.length; i += 1) {
    const U = rings[i]; const L = rings[i + 1];
    for (let j = 0; j < n; j += 1) {
      const k = (j + 1) % n;
      if (skipBand && skipBand(j)) continue;
      
      
      
      pushTri(m, U.pts[j], L.pts[j], L.pts[k], U.uv[j], L.uv[j], L.uv[k]);
      pushTri(m, U.pts[j], L.pts[k], U.pts[k], U.uv[j], L.uv[k], U.uv[k]);
    }
  }

  if (capLast) {
    const r = rings[rings.length - 1];
    const cols = capCols || r.pts.map((_, i) => i);
    const uv = lastCapUV || ((i) => r.uv[i]);
    for (let j = 1; j < cols.length - 1; j += 1) {
      pushTri(m, r.pts[cols[0]], r.pts[cols[j + 1]], r.pts[cols[j]],
        uv(cols[0]), uv(cols[j + 1]), uv(cols[j]));
    }
  }
  return m;
}

const remapUV = (rect, u, v) => [
  rect[0] + (rect[2] - rect[0]) * u,
  rect[1] + (rect[3] - rect[1]) * v,
];




































































export const LIMB_PROFILE = {
  
  upperArm: [[0.00, 1.06, 1.04, 0.00, 0.00],   
             [0.30, 0.96, 0.98, 0.12, 0.00],   
             [0.66, 0.84, 0.88, 0.04, 0.00],
             [1.00, 0.68, 0.74, -0.06, 0.00]], 
  foreArm: [[0.00, 1.00, 1.00, 0.08, 0.00],    
            [0.26, 0.97, 0.95, 0.12, 0.00],
            [1.00, 0.56, 0.62, 0.00, 0.00]],   
  thigh: [[0.00, 1.00, 1.00, 0.12, 0.00],      
          [0.34, 0.88, 0.92, 0.02, 0.00],
          [0.72, 0.78, 0.84, -0.10, 0.00],     
          [1.00, 0.70, 0.80, -0.06, 0.00]],    
  shin: [[0.00, 0.90, 0.94, -0.08, 0.00],      
         [0.22, 1.02, 1.00, 0.24, -0.42],      
         [0.34, 1.00, 0.98, 0.28, 0.46],       
         [1.00, 0.50, 0.56, 0.02, 0.00]],      
  neck: [[0.00, 1.00, 1.10], [1.00, 0.90, 1.00]],
  straight: [[0.00, 1.00, 1.00], [1.00, 1.00, 1.00]],
};


































export function tubeAlong(a, b, opts = {}) {
  const {
    sides = 6, w = 0.05, d = 0.05, roll = 0,
    profile = LIMB_PROFILE.straight,
    capStart = true, capEnd = true,
    flex = null, medial = 1,
    uv = [0, 0, 1, 1],
  } = opts;

  const axis = sub(b, a);
  
  
  
  const back = norm(mul(axis, -1));
  let svHint = [0, 1, 0];
  if (Math.abs(dot(svHint, back)) > 0.94) svHint = [0, 0, 1];
  const sv = norm(sub(svHint, mul(back, dot(svHint, back))));
  const su = cross(sv, back);

  
  
  
  
  
  let fx = su;
  if (flex) {
    const perp = sub(flex, mul(back, dot(flex, back)));
    if (len(perp) > 1e-6) fx = norm(perp);
  }
  const med = mul(sv, medial >= 0 ? 1 : -1);

  const rings = profile.map(([t, wm, dm, fo = 0, mo = 0]) => {
    const rw = (w / 2) * wm; const rd = (d / 2) * dm;
    
    
    
    
    const c = add(lerp3(a, b, t), add(mul(fx, fo * (w / 2)), mul(med, mo * (d / 2))));
    const pts = []; const uvs = [];
    for (let j = 0; j < sides; j += 1) {
      const th = (j / sides) * Math.PI * 2 + roll;
      pts.push(add(c, add(mul(su, Math.cos(th) * rw), mul(sv, Math.sin(th) * rd))));
      uvs.push(remapUV(uv, j / sides, t));
    }
    return { pts, uv: uvs };
  });

  return stackMesh(rings, {
    capFirst: capStart,
    capLast: capEnd,
    
    
    
    firstCapUV: capStart ? ((i) => remapUV(uv, 0.5 + 0.45 * Math.cos((i / sides) * Math.PI * 2), 0.02)) : null,
    lastCapUV: capEnd ? ((i) => remapUV(uv, 0.5 + 0.45 * Math.cos((i / sides) * Math.PI * 2), 0.98)) : null,
  });
}




















const TORSO_SECTION = [
  [1.00, 0.00], [0.88, 0.56], [0.40, 0.98], [-0.44, 0.86],
  [-0.94, 0.00], [-0.44, -0.86], [0.40, -0.98], [0.88, -0.56],
];









































export function loftTorso(sections, opts = {}) {
  const {
    across = [0, 1, 0], through = [1, 0, 0],
    capTop = true, capBottom = true, uv = [0, 0, 1, 1],
  } = opts;
  const ax = norm(across); const th = norm(through);
  const n = TORSO_SECTION.length;

  const rings = sections.map((s, si) => {
    const v = sections.length > 1 ? si / (sections.length - 1) : 0;
    const pts = []; const uvs = [];
    
    
    
    
    const a = s.yaw ?? s.roll ?? 0;
    const cr = Math.cos(a); const sr = Math.sin(a);
    for (let j = 0; j < n; j += 1) {
      
      
      
      
      
      
      
      
      
      
      
      
      const [fq, sq] = TORSO_SECTION[j];
      const px = fq * (s.d / 2);
      const py = sq * (s.w / 2);
      pts.push(add(s.c, add(mul(th, px * cr - py * sr), mul(ax, px * sr + py * cr))));
      uvs.push(remapUV(uv, j / n, v));
    }
    return { pts, uv: uvs };
  });

  return stackMesh(rings, {
    capFirst: capTop,
    capLast: capBottom,
    firstCapUV: (i) => remapUV(uv, 0.5 + 0.45 * TORSO_SECTION[i][1], 0.02),
    lastCapUV: (i) => remapUV(uv, 0.5 + 0.45 * TORSO_SECTION[i][1], 0.98),
  });
}























































































































export function girdleYawOf(points) {
  if (!points || points.length !== 2) return 0;
  const [p0, p1] = points;
  return Math.atan2(p1[0] - p0[0], p0[1] - p1[1]);
}


export const girdleReach = (points, fallback = 0) => (points && points.length === 2
  ? Math.hypot(points[1][0] - points[0][0], points[1][1] - points[0][1],
    points[1][2] - points[0][2])
  : fallback);

export function torsoSectionsFrom(box, opts = {}) {
  const { build = 1.0, hipSpan = 0, shoulderSpan = 0 } = opts;
  const topYawIn = opts.topYaw ?? box.topYaw ?? 0;
  const bottomYawIn = opts.bottomYaw ?? box.bottomYaw ?? 0;
  const bw = 1 + (build - 1) * 0.45;   
  
  
  let base = Math.max(box.topW, box.bottomW * 1.02);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (shoulderSpan > 0) {
    base = Math.max(shoulderSpan * 0.94, Math.min(base, shoulderSpan * 1.06));
  }
  const topD = box.topD ?? box.depth ?? 0.11;
  const botD = box.bottomD ?? box.depth ?? 0.11;
  const topYaw = topYawIn;
  
  
  
  
  let botYaw = bottomYawIn;
  while (botYaw - topYaw > Math.PI) botYaw -= Math.PI * 2;
  while (botYaw - topYaw < -Math.PI) botYaw += Math.PI * 2;
  
  
  
  const hipFloor = Math.max(box.bottomW, hipSpan * 1.34);

  const rows = [
    
    [0.00, 1.00 * build, 0.92 * build, 0.00],
    [0.15, 0.85 * build, 1.00 * build, 0.04],
    [0.42, 0.81 * build, 1.02 * build, 0.28],
    [0.70, 0.72 * bw, 0.88 * bw, 0.72],
    [1.00, 0.88 * bw, 1.00 * bw, 1.00],
    [1.17, 0.80 * bw, 0.92 * bw, 1.00],
    [1.32, 0.44 * bw, 0.62 * bw, 1.00],
  ];
  return rows.map(([t, wm, dm, tw]) => ({
    c: lerp3(box.top, box.bottom, t),
    w: Math.max(base * wm, t >= 1.0 && t < 1.2 ? hipFloor : 0),
    d: lerp(topD, botD, Math.min(1, t)) * dm,
    yaw: lerp(topYaw, botYaw, tw),
  }));
}














const TRAP_SECTION = [
  [1.00, 0.00], [0.42, 0.92], [-0.55, 0.80],
  [-1.00, 0.00], [-0.55, -0.80], [0.42, -0.92],
];














































export function trapezius(opts = {}) {
  const {
    shoulderMid = [0, 0, 0], neckBase = [0, 0, 0.1],
    w = 0.24, d = 0.13, neckW = 0.04, neckD = 0.04, yaw = 0,
    forward = [1, 0, 0], uv = BODY_UV.shoulder,
  } = opts;
  const fwd = norm(forward);
  const rows = [
    
    [0.00, (neckW * 0.92) / w, (neckD * 1.05) / d, 0.34],
    [0.44, 0.62, 0.78, 0.18],
    [1.00, 1.00, 1.00, 0.00],
  ];
  const n = TRAP_SECTION.length;
  const cr = Math.cos(yaw); const sr = Math.sin(yaw);
  const rings = rows.map(([t, wm, dm, aft], i) => {
    
    
    const c = add(lerp3(neckBase, shoulderMid, t), mul(fwd, -aft * d));
    const pts = []; const uvs = [];
    for (let j = 0; j < n; j += 1) {
      const [fq, sq] = TRAP_SECTION[j];
      
      
      
      
      
      const px = fq * (d * dm) / 2;
      const py = sq * (w * wm) / 2;
      pts.push(add(c, [px * cr - py * sr, px * sr + py * cr, 0]));
      uvs.push(remapUV(uv, j / n, 0.1 + 0.8 * (i / (rows.length - 1))));
    }
    return { pts, uv: uvs };
  });
  
  
  return stackMesh(rings, { capFirst: false, capLast: false });
}



















export const JAW = {
  oval: { cheek: 0.96, chin: 0.86, drop: 0.98, crown: 1.02 },
  taper: { cheek: 0.94, chin: 0.62, drop: 1.06, crown: 1.00 },
  round: { cheek: 1.00, chin: 0.92, drop: 0.88, crown: 1.04 },
  square: { cheek: 1.04, chin: 1.00, drop: 0.90, crown: 1.02 },
  long: { cheek: 0.90, chin: 0.78, drop: 1.16, crown: 0.96 },
  wide: { cheek: 1.10, chin: 0.94, drop: 0.86, crown: 1.08 },
};


export const HEAD_UV = {
  face: [0.00, 0.00, 0.50, 0.75],
  sides: [0.52, 0.00, 1.00, 0.75],
  hair: [0.00, 0.78, 0.50, 1.00],
  scrap: [0.52, 0.78, 1.00, 1.00],
};
































const HEAD_RINGS = [
  { name: 'cranium', z: 0.74, hw: 0.86, key: 'crown', f: 0.66, b: 0.80, v: 0.10 },
  { name: 'forehead', z: 0.44, hw: 0.95, key: 'crown', f: 0.82, b: 0.90, v: 0.22 },
  { name: 'brow', z: 0.16, hw: 0.99, key: 'cheek', f: 0.87, b: 0.92, v: 0.34 },
  { name: 'eye', z: -0.02, hw: 0.99, key: 'cheek', f: 0.76, b: 0.92, v: 0.42 },
  { name: 'cheek', z: -0.20, hw: 1.00, key: 'cheek', f: 0.84, b: 0.90, v: 0.52 },
  { name: 'mouth', drop: 0.44, hw: 0.97, key: 'mix45', f: 0.77, b: 0.80, v: 0.68 },
  { name: 'jaw', drop: 0.74, hw: 0.92, key: 'mix82', f: 0.68, b: 0.70, v: 0.84 },
  { name: 'chin', drop: 0.97, hw: 0.50, key: 'chin', f: 0.52, b: 0.42, v: 0.97 },
];
















const HEAD_COLS = [
  [1.00, 0.00],  
  [0.84, 0.72],  
  [0.26, 1.00],  
  [-0.66, 0.80], 
  [-1.00, 0.00], 
  [-0.66, -0.80],
  [0.26, -1.00], 
  [0.84, -0.72], 
];







const HEAD_UNWRAP = [6, 7, 0, 1, 2, 2, 3, 4, 5, 6];
const HEAD_SIDE_U = [null, null, null, null, null, 0.00, 0.25, 0.50, 0.75, 1.00];

















export function head(opts = {}) {
  const {
    centre = [0, 0, 0], r = 0.118, jaw = 'oval', brow = 3,
    nose = true, forward = [1, 0, 0], up = [0, 0, 1],
    uvFace = HEAD_UV.face, uvSides = HEAD_UV.sides, uvScrap = HEAD_UV.scrap,
  } = opts;

  const J = JAW[jaw] || JAW.oval;
  const fr = frameOf(forward, up);
  const browPush = (brow - 3) * 0.006;   
  const hwOf = (ring) => {
    switch (ring.key) {
      case 'crown': return J.crown * ring.hw;
      case 'chin': return J.chin * ring.hw;
      case 'mix45': return lerp(J.cheek, J.chin, 0.45) * ring.hw;
      case 'mix82': return lerp(J.cheek, J.chin, 0.82) * ring.hw;
      default: return J.cheek * ring.hw;
    }
  };

  
  
  
  
  
  let yMax = 0;
  for (const ring of HEAD_RINGS) yMax = Math.max(yMax, hwOf(ring) * 1.00);

  const rings = HEAD_RINGS.map((ring) => {
    const z = ring.drop !== undefined ? -J.drop * ring.drop : ring.z;
    const hw = hwOf(ring);
    let f = ring.f; let b = ring.b;
    if (ring.name === 'brow') f += browPush;
    if (ring.name === 'eye') f -= browPush * 0.5;
    const pts = []; const uvs = [];
    for (let k = 0; k < HEAD_UNWRAP.length; k += 1) {
      const col = HEAD_COLS[HEAD_UNWRAP[k]];
      const x = (col[0] >= 0 ? f : b) * col[0] * r;
      const y = col[1] * hw * r;
      pts.push(place(centre, fr, [x, y, z * r]));
      if (HEAD_SIDE_U[k] === null) {
        
        
        uvs.push(remapUV(uvFace, 0.5 + 0.46 * (y / (yMax * r)), ring.v));
      } else {
        
        uvs.push(remapUV(uvSides, HEAD_SIDE_U[k], ring.v));
      }
    }
    return { pts, uv: uvs };
  });

  
  
  
  
  
  const apex = place(centre, fr, [-0.07 * r, 0, 1.06 * r]);
  const skull = stackMesh(rings, {
    apex,
    
    
    
    
    
    apexUV: (a, b) => [(a[0] + b[0]) / 2, Math.min(uvFace[1], uvSides[1])],
    capLast: true,
    
    
    
    lastCapUV: (i) => remapUV(uvScrap, 0.5 + 0.4 * Math.cos((i / HEAD_UNWRAP.length) * Math.PI * 2),
      0.5 + 0.4 * Math.sin((i / HEAD_UNWRAP.length) * Math.PI * 2)),
    
    
    
    skipBand: (j) => j === 4 || j === HEAD_UNWRAP.length - 1,
    capCols: [0, 1, 2, 3, 4, 6, 7, 8],
  });

  if (!nose) return skull;

  
  
  
  
  
  
  
  
  
  
  
  const A = place(centre, fr, [0.86 * r, 0, 0.14 * r]);        
  const T = place(centre, fr, [0.97 * r, 0, -0.10 * r]);        
  const L = place(centre, fr, [0.80 * r, 0.14 * r, -0.26 * r]); 
  const R = place(centre, fr, [0.80 * r, -0.14 * r, -0.26 * r]);
  const c = centroidOf([A, T, L, R]);
  const m = emptyMesh();
  
  
  const nu = (du, v) => remapUV(uvFace, 0.5 + du, v);
  pushTriOut(m, c, A, T, L, nu(0, 0.30), nu(0, 0.44), nu(0.05, 0.49));
  pushTriOut(m, c, A, T, R, nu(0, 0.30), nu(0, 0.44), nu(-0.05, 0.49));
  pushTriOut(m, c, T, L, R, nu(0, 0.44), nu(0.05, 0.49), nu(-0.05, 0.49));
  pushTriOut(m, c, A, L, R, nu(0, 0.30), nu(0.05, 0.49), nu(-0.05, 0.49));
  return mergeMeshes([skull, m]);
}






export const BODY_UV = {
  torso: [0.00, 0.00, 0.62, 0.60],
  upperArm: [0.64, 0.00, 0.80, 0.30],
  foreArm: [0.82, 0.00, 0.98, 0.30],
  thigh: [0.64, 0.32, 0.80, 0.66],
  shin: [0.82, 0.32, 0.98, 0.66],
  hand: [0.00, 0.62, 0.24, 0.80],
  foot: [0.26, 0.62, 0.62, 0.86],
  neck: [0.64, 0.68, 0.80, 0.80],
  shoulder: [0.82, 0.68, 0.98, 0.80],
};


















































export function hand(opts = {}) {
  const {
    centre = [0, 0, 0], forward = [1, 0, 0], up = [0, 0, 1],
    style = 'fist', thumb = true, uv = BODY_UV.hand, side = 1,
  } = opts;
  const open = style === 'open';
  const {
    len: L = open ? 0.092 : 0.070,
    wide = open ? 0.056 : 0.052,
    deep = open ? 0.030 : 0.058,
  } = opts;
  const fr = frameOf(forward, up);
  const P = (x, y, z) => place(centre, fr, [x, y, z]);
  
  
  
  
  const sy = side >= 0 ? 1 : -1;

  const hy0 = wide * 0.40; const hz0 = deep * 0.41;   
  
  
  
  const hy1 = wide * (open ? 0.46 : 0.50);
  const hz1 = deep * (open ? 0.38 : 0.50);
  const xb = -L * 0.43;                                
  
  
  const xkIn = L * 0.57; const xkOut = L * (open ? 0.34 : 0.45);

  const w0 = P(xb, -hy0 * sy, -hz0); const w1 = P(xb, hy0 * sy, -hz0);
  const w2 = P(xb, hy0 * sy, hz0); const w3 = P(xb, -hy0 * sy, hz0);
  const k0 = P(xkOut, -hy1 * sy, -hz1); const k1 = P(xkIn, hy1 * sy, -hz1);
  const k2 = P(xkIn, hy1 * sy, hz1); const k3 = P(xkOut, -hy1 * sy, hz1);

  const m = emptyMesh();
  const c = centroidOf([w0, w1, w2, w3, k0, k1, k2, k3]);
  const U = (u, v) => remapUV(uv, u, v);
  
  
  pushQuadOut(m, c, k0, k1, k2, k3, U(0.34, 0.10), U(0.66, 0.10), U(0.66, 0.42), U(0.34, 0.42)); 
  pushQuadOut(m, c, w0, w1, w2, w3, U(0.34, 0.90), U(0.66, 0.90), U(0.66, 0.58), U(0.34, 0.58)); 
  pushQuadOut(m, c, w1, w2, k2, k1, U(0.70, 0.58), U(0.70, 0.90), U(0.98, 0.90), U(0.98, 0.58)); 
  pushQuadOut(m, c, w0, k0, k3, w3, U(0.30, 0.58), U(0.02, 0.58), U(0.02, 0.90), U(0.30, 0.90)); 
  pushQuadOut(m, c, w3, k3, k2, w2, U(0.34, 0.46), U(0.34, 0.10), U(0.66, 0.10), U(0.66, 0.46)); 
  pushQuadOut(m, c, w0, w1, k1, k0, U(0.34, 0.54), U(0.66, 0.54), U(0.66, 0.90), U(0.34, 0.90)); 

  if (thumb) {
    
    
    
    
    
    
    
    
    const ty = open ? 1.95 : 1.10;   
    const tx = open ? 0.18 : 0.49;   
    const t0 = P(-L * 0.09, hy1 * 0.95 * sy, -deep * 0.20);
    const t1 = P(L * 0.37, hy1 * ty * sy, -deep * 0.34);
    const t2 = P(L * tx, hy1 * (open ? 1.30 : 0.50) * sy, -deep * 0.44);
    const t3 = P(-L * 0.09, hy1 * 0.95 * sy, deep * 0.24);
    const t4 = P(L * 0.37, hy1 * ty * sy, deep * 0.10);
    const t5 = P(L * tx, hy1 * (open ? 1.30 : 0.50) * sy, deep * 0.02);
    const tc = centroidOf([t0, t1, t2, t3, t4, t5]);
    pushTriOut(m, tc, t0, t1, t2, U(0.72, 0.06), U(0.90, 0.06), U(0.98, 0.20));
    pushTriOut(m, tc, t3, t4, t5, U(0.72, 0.50), U(0.90, 0.50), U(0.98, 0.36));
    pushQuadOut(m, tc, t0, t1, t4, t3, U(0.72, 0.06), U(0.90, 0.06), U(0.90, 0.50), U(0.72, 0.50));
    pushQuadOut(m, tc, t1, t2, t5, t4, U(0.90, 0.06), U(0.98, 0.20), U(0.98, 0.36), U(0.90, 0.50));
    pushQuadOut(m, tc, t2, t0, t3, t5, U(0.98, 0.20), U(0.72, 0.06), U(0.72, 0.50), U(0.98, 0.36));
  }
  return m;
}




























const SHOE = [
  
  [-0.042, 0.0200, 0.038, -0.014],  
  [-0.004, 0.0235, 0.046, -0.014],  
  [0.030, 0.0250, 0.032, -0.014],  
  [0.062, 0.0165, 0.017, -0.013],  
];












export function foot(opts = {}) {
  const {
    origin = [0, 0, 0], forward = [1, 0, 0], up = [0, 0, 1],
    pitch = 0, side = 1, uv = BODY_UV.foot,
    
    
    
    
    
    
    
    
    
    
    long: kx = 1, wide: ky = 1, tall: kz = 1,
  } = opts;
  const cp = Math.cos(pitch); const sp = Math.sin(pitch);
  const fr = frameOf(forward, up);
  const sy = side >= 0 ? 1 : -1;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const P = (x, y, z) => place(origin, fr,
    [(x * kx) * cp - (z * kz) * sp, y * ky, (x * kx) * sp + (z * kz) * cp]);

  const rings = SHOE.map(([x, hw, top, sole], si) => {
    const v = si / (SHOE.length - 1);
    const inner = hw * 0.86;   
    const outer = -hw * 1.00;  
    
    
    
    
    
    
    const WELT = 1.10; const UPPER = 0.90;
    
    
    
    const pts = [
      P(x, outer * WELT * sy, sole), P(x, outer * UPPER * sy, top),
      P(x, 0, top * 1.06),
      P(x, inner * UPPER * sy, top), P(x, inner * WELT * sy, sole),
    ];
    const uvs = [
      remapUV(uv, 0.02, v), remapUV(uv, 0.26, v),
      remapUV(uv, 0.50, v), remapUV(uv, 0.74, v), remapUV(uv, 0.98, v),
    ];
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (sy < 0) { pts.reverse(); uvs.reverse(); }
    return { pts, uv: uvs };
  });

  return stackMesh(rings, {
    capFirst: true, capLast: true,
    firstCapUV: (i) => remapUV(uv, 0.10 + 0.2 * i, 0.02),
    lastCapUV: (i) => remapUV(uv, 0.10 + 0.2 * i, 0.98),
  });
}














function hairDome(centre, fr, r, o = {}) {
  const {
    scale = 1.07, low = -0.20, frontLow = null, rings: nRings = 2,
    sides = 8, uv = HEAD_UV.hair,
  } = o;
  const fl = frontLow === null ? low : frontLow;
  const rows = [];
  for (let i = 1; i <= nRings; i += 1) {
    
    
    
    const t = i === nRings ? 1.0 : 0.62;
    const pts = []; const uvs = [];
    for (let j = 0; j < sides; j += 1) {
      const th = (j / sides) * Math.PI * 2;
      const cx = Math.cos(th); const cy = Math.sin(th);
      
      const bottom = cx > 0 ? fl : low;
      const zz = lerp(0.86, bottom, t);
      const spread = Math.sqrt(Math.max(0.06, 1 - (zz / 1.12) * (zz / 1.12)));
      pts.push(place(centre, fr, [cx * spread * r * scale, cy * spread * r * scale, zz * r]));
      uvs.push(remapUV(uv, j / sides, 0.15 + 0.7 * t));
    }
    rows.push({ pts, uv: uvs });
  }
  const apex = place(centre, fr, [-0.06 * r, 0, 1.14 * r * (scale / 1.07)]);
  return stackMesh(rows, {
    apex,
    capLast: true,
    lastCapUV: (i) => remapUV(uv, 0.5 + 0.4 * Math.cos((i / sides) * Math.PI * 2), 0.94),
  });
}










function hairLock(a, b, wTop, wBot, uv) {
  return tubeAlong(a, b, {
    sides: 4, w: wTop * 2, d: wTop * 1.5,
    profile: [[0, 1, 1], [1, wBot / wTop, wBot / wTop]],
    roll: Math.PI / 4, uv,
  });
}














export function hairCap(style, opts = {}) {
  const {
    centre = [0, 0, 0], r = 0.118, forward = [1, 0, 0], up = [0, 0, 1],
    uv = HEAD_UV.hair,
  } = opts;
  const fr = frameOf(forward, up);
  const P = (x, y, z) => place(centre, fr, [x * r, y * r, z * r]);
  const parts = [];

  switch (style) {
    case 'spike': {
      
      
      
      
      parts.push(hairDome(centre, fr, r, { low: -0.16, frontLow: -0.06, uv }));
      const spikes = [
        
        [-1.15, 0.62, 1.62, 0.44, 1.58],
        [-0.58, 0.86, 1.94, 0.30, 1.92],
        [0.00, 0.94, 2.04, 0.10, 2.06],
        [0.62, 0.84, 1.86, -0.34, 1.86],
        [1.20, 0.58, 1.52, -0.50, 1.52],
      ];
      for (let i = 0; i < spikes.length; i += 1) {
        const [yaw, , , , tipZ] = spikes[i];
        
        
        
        
        const sgn = i % 2 === 0 ? 1 : -1;
        const bw = 0.30 + (i % 3) * 0.05;
        const cx = Math.cos(yaw) * 0.34; const cy = Math.sin(yaw) * 0.62 * sgn;
        const base = [
          P(cx - bw, cy - bw * 0.8, 0.86), P(cx + bw, cy - bw * 0.8, 0.86),
          P(cx + bw, cy + bw * 0.8, 0.86), P(cx - bw, cy + bw * 0.8, 0.86),
        ];
        const tip = P(cx + Math.cos(yaw) * 0.72, cy + Math.sin(yaw) * 0.9 * sgn, tipZ);
        const c = centroidOf([...base, tip]);
        const m = emptyMesh();
        const U = (u, v) => remapUV(uv, u, v);
        for (let j = 0; j < 4; j += 1) {
          pushTriOut(m, c, base[j], base[(j + 1) % 4], tip,
            U(0.05 + j * 0.2, 0.9), U(0.20 + j * 0.2, 0.9), U(0.12 + j * 0.2, 0.55));
        }
        pushQuadOut(m, c, base[0], base[1], base[2], base[3],
          U(0.05, 0.9), U(0.25, 0.9), U(0.25, 0.99), U(0.05, 0.99));
        parts.push(m);
      }
      break;
    }
    case 'curtain': {
      
      
      
      
      parts.push(hairDome(centre, fr, r, { low: -0.32, frontLow: -0.10, scale: 1.10, uv }));
      for (const s of [-1, 1]) {
        parts.push(hairLock(P(-0.30, s * 0.92, 0.30), P(-0.36, s * 0.86, -3.30),
          0.30 * r, 0.20 * r, uv));
        parts.push(hairLock(P(0.62, s * 0.86, 0.34), P(0.56, s * 0.80, -1.42),
          0.22 * r, 0.05 * r, uv));
      }
      break;
    }
    case 'tails': {
      
      
      
      parts.push(hairDome(centre, fr, r, { low: -0.20, frontLow: -0.12, uv }));
      parts.push(hairLock(P(-0.10, 1.10, 0.62), P(-0.62, 1.86, -2.10), 0.40 * r, 0.11 * r, uv));
      parts.push(hairLock(P(-0.10, -1.10, 0.62), P(-0.58, -1.80, -1.94), 0.40 * r, 0.11 * r, uv));
      break;
    }
    case 'crop':
      
      
      
      parts.push(hairDome(centre, fr, r, { low: -0.44, frontLow: -0.40, scale: 1.045, uv }));
      break;
    case 'topknot': {
      
      
      
      
      
      parts.push(hairDome(centre, fr, r, { low: -0.34, frontLow: -0.44, scale: 1.05, uv }));
      const knotC = P(-0.62, 0, 1.34);
      const knot = [];
      const nRing = 6;
      for (const zz of [0.30, -0.30]) {
        const pts = []; const uvs = [];
        for (let j = 0; j < nRing; j += 1) {
          const th = (j / nRing) * Math.PI * 2;
          const rad = 0.34 * r * Math.sqrt(Math.max(0.15, 1 - (zz / 0.42) ** 2));
          pts.push(add(knotC, place([0, 0, 0], fr, [Math.cos(th) * rad, Math.sin(th) * rad, zz * r])));
          uvs.push(remapUV(uv, j / nRing, zz > 0 ? 0.2 : 0.6));
        }
        knot.push({ pts, uv: uvs });
      }
      parts.push(stackMesh(knot, {
        apex: add(knotC, place([0, 0, 0], fr, [0, 0, 0.42 * r])),
        capLast: true,
        lastCapUV: (i) => remapUV(uv, 0.5 + 0.3 * Math.cos((i / nRing) * Math.PI * 2), 0.85),
      }));
      
      
      
      parts.push(hairLock(P(-0.10, 0, 0.86), knotC, 0.26 * r, 0.20 * r, uv));
      parts.push(hairLock(P(-0.72, 0, 1.10), P(-0.92, 0.06, -2.20), 0.24 * r, 0.14 * r, uv));
      break;
    }
    default: {
      
      
      
      
      const rows = [];
      const sides = 8;
      const prof = [[0.86, 1.00], [-0.10, 1.12], [-0.86, 1.30]];
      for (let i = 0; i < prof.length; i += 1) {
        const [zz, sc] = prof[i];
        const pts = []; const uvs = [];
        for (let j = 0; j < sides; j += 1) {
          const th = (j / sides) * Math.PI * 2;
          const cx = Math.cos(th); const cy = Math.sin(th);
          const spread = i === 0 ? 0.62 : 1.0;
          
          
          
          const frontCut = cx > 0.4 ? 0.90 : 1.0;
          pts.push(place(centre, fr, [
            cx * spread * sc * r * 1.06 * frontCut,
            cy * spread * sc * r * 1.06,
            (i === 0 ? zz : zz) * r,
          ]));
          uvs.push(remapUV(uv, j / sides, 0.1 + 0.4 * i));
        }
        rows.push({ pts, uv: uvs });
      }
      parts.push(stackMesh(rows, {
        apex: place(centre, fr, [-0.06 * r, 0, 1.12 * r]),
        capLast: true,
        lastCapUV: (i) => remapUV(uv, 0.5 + 0.4 * Math.cos((i / 8) * Math.PI * 2), 0.95),
      }));
      break;
    }
  }
  return mergeMeshes(parts);
}
















export function jointBall(centre, radius, opts = {}) {
  const {
    sides = 5, uv = BODY_UV.shoulder, squash = 0.86,
    axis = [0, 0, 1], rings = [0.48, -0.28], capLast = true,
  } = opts;
  
  
  
  
  
  
  
  
  
  
  
  const ax = norm(axis);
  
  
  
  let h = [0, 0, 1];
  if (Math.abs(dot(h, ax)) > 0.94) h = [1, 0, 0];
  const e1 = norm(cross(h, ax));
  const e2 = cross(ax, e1);

  const rows = [];
  for (const zz of rings) {
    const pts = []; const uvs = [];
    for (let j = 0; j < sides; j += 1) {
      const th = (j / sides) * Math.PI * 2;
      const rad = radius * Math.sqrt(Math.max(0.12, 1 - zz * zz));
      pts.push(add(centre, add(add(mul(e1, Math.cos(th) * rad), mul(e2, Math.sin(th) * rad)),
        mul(ax, zz * radius * squash))));
      uvs.push(remapUV(uv, j / sides, zz > 0 ? 0.2 : 0.7));
    }
    rows.push({ pts, uv: uvs });
  }
  return stackMesh(rows, {
    apex: add(centre, mul(ax, radius * squash)),
    capLast,
    lastCapUV: (i) => remapUV(uv, 0.5 + 0.4 * Math.cos((i / sides) * Math.PI * 2), 0.95),
  });
}






















export function buildFighter(K, opts = {}) {
  const {
    segments = [], torso = null, joints = null, girdle = null,
    headR = 0.118, arch = {}, flip = false, pose = null, hands: handStyles = null,
    head: headMesh = true,
  } = opts;
  const sx = flip ? -1 : 1;
  const fwd = [sx, 0, 0];
  const parts = [];
  const add1 = (name, mesh) => { if (mesh && mesh.tris) parts.push({ name, mesh, tris: mesh.tris }); };

  const uvFor = {
    upperArm: BODY_UV.upperArm, foreArm: BODY_UV.foreArm,
    thigh: BODY_UV.thigh, shin: BODY_UV.shin, neck: BODY_UV.neck,
  };
  
  
  
  const shPts = girdle && girdle.shoulder && girdle.shoulder.points;
  const hipPts = girdle && girdle.hip && girdle.hip.points;
  const G = girdle ? {
    topYaw: shPts ? girdleYawOf(shPts) : (torso ? torso.topYaw ?? 0 : 0),
    bottomYaw: hipPts ? girdleYawOf(hipPts) : (torso ? torso.bottomYaw ?? 0 : 0),
    shoulderSpan: girdleReach(shPts, girdle.shoulder.span),
    hipSpan: girdleReach(hipPts, girdle.hip.span),
  } : null;

  const byPart = new Map(splayElbows(segments, girdle, torso, arch.build || 1,
    G ? G.shoulderSpan : 0).map((s) => [s.part, s]));

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const flexOf = (part) => {
    const m = /^(upperArm|foreArm|thigh|shin)(\d)$/.exec(part);
    if (!m) return null;
    const [, kind, i] = m;
    const pick = {
      upperArm: [`foreArm${i}`, false], foreArm: [`upperArm${i}`, true],
      thigh: [`shin${i}`, false], shin: [`thigh${i}`, true],
    }[kind];
    const o = byPart.get(pick[0]);
    if (!o) return null;
    
    
    return pick[1] ? sub(o.a, o.b) : sub(o.b, o.a);
  };

  for (const s of segments) {
    const kind = s.part.replace(/\d+$/, '');
    const prof = LIMB_PROFILE[kind] || LIMB_PROFILE.straight;
    
    
    
    const isNeck = kind === 'neck';
    add1(s.part, tubeAlong(s.a, s.b, {
      sides: isNeck ? 5 : 6,
      w: s.w, d: s.d, profile: prof,
      capStart: isNeck, capEnd: false,
      flex: flexOf(s.part),
      
      
      
      medial: (s.a[1] + s.b[1]) > 0 ? -1 : 1,
      uv: uvFor[kind] || BODY_UV.upperArm,
    }));
  }

  
  
  
  
  
  
  
  if (torso) {
    const secs = torsoSectionsFrom(torso, {
      build: arch.build || 1,
      hipSpan: G ? G.hipSpan : 0,
      shoulderSpan: G ? G.shoulderSpan : 0,
      topYaw: G ? G.topYaw : undefined,
      bottomYaw: G ? G.bottomYaw : undefined,
    });
    
    
    
    const trunk = secs.slice(0, 5);
    const pelvis = secs.slice(4);
    
    
    
    
    
    
    
    
    add1('torso', loftTorso(trunk, { capTop: true, capBottom: false, uv: BODY_UV.torso }));
    add1('pelvis', loftTorso(pelvis, { capTop: false, capBottom: true, uv: BODY_UV.torso }));

    
    
    
    
    
    
    
    
    
    
    const top = trunk[0];
    const neckSeg = byPart.get('neck');
    if (neckSeg) {
      add1('trapezius', trapezius({
        shoulderMid: top.c, neckBase: lerp3(neckSeg.a, neckSeg.b, 0.38),
        w: top.w, d: top.d, neckW: neckSeg.w, neckD: neckSeg.d,
        yaw: top.yaw || 0, forward: fwd,
      }));
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  const BALL = {
    shoulder: { sides: 5, squash: 0.80 },
    elbow: { sides: 4, squash: 0.92 },
    
    
    
    
    
    wrist: { sides: 4, squash: 0.94, rings: [0.40, -0.40], capLast: false },
    hip: { sides: 4, squash: 0.88 },
    knee: { sides: 5, squash: 0.90 },
    
    
    
    
    
    ankle: { sides: 4, squash: 0.94, rings: [0.40, -0.40], capLast: false },
  };
  
  
  
  
  
  
  
  
  
  
  
  const AXIS_OF = {
    shoulder: ['upperArm', 0.62, 'a'], elbow: ['foreArm', 0.10, 'a'],
    wrist: ['foreArm', -0.04, 'b'], hip: ['thigh', 0.30, 'a'],
    knee: ['shin', 0.12, 'a'], ankle: ['shin', -0.04, 'b'],
  };
  
  
  
  const jointList = (joints || fallbackJoints(segments)).map((j) => ({ ...j }));
  for (const j of jointList) {
    const m = /^([a-z]+)(\d)$/.exec(j.part);
    if (!m) continue;
    const [, kind, i] = m;
    const cfg = BALL[kind];
    const spec = AXIS_OF[kind];
    if (!cfg || !spec) continue;
    const bone = byPart.get(`${spec[0]}${i}`);
    const axis = bone ? sub(bone.b, bone.a) : [0, 0, 1];
    const dir = norm(axis);
    const at = bone ? bone[spec[2]] : j.centre;
    j.centre = at;
    add1(`${j.part}Ball`, jointBall(add(at, mul(dir, spec[1] * j.r)), j.r, {
      ...cfg, axis: dir,
    }));
  }

  
  
  
  const headC = [K.head[0] * sx, 0, K.head[1]];
  if (headMesh) {
    add1('head', head({
      centre: headC, r: headR, jaw: arch.jaw || 'oval', brow: arch.brow ?? 3,
      forward: fwd,
    }));
    add1('hair', hairCap(arch.hair || 'spike', { centre: headC, r: headR, forward: fwd }));
  }

  
  
  
  
  
  
  
  
  
  
  
  
  const styles = handStyles || handStyleFor(pose);
  for (let i = 0; i < 2; i += 1) {
    const armEnd = byPart.get(`foreArm${i}`);
    const legEnd = byPart.get(`shin${i}`);
    const fallbackY = (i === 0 ? 1 : -1) * 0.055 * sx;
    if (K.hands && K.hands[i]) {
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const armDir = armEnd ? norm(sub(armEnd.b, armEnd.a)) : fwd;
      add1(`hand${i}`, hand({
        centre: [K.hands[i][0] * sx, armEnd ? armEnd.b[1] : fallbackY, K.hands[i][1]],
        forward: armDir,
        up: Math.abs(armDir[2]) > 0.90 ? fwd : [0, 0, 1],
        side: i === 0 ? 1 : -1, style: styles[i] || 'fist',
      }));
    }
    if (K.feet && K.feet[i]) {
      
      
      
      
      
      const grounded = K.feet[i][1] <= 0.02;
      let pitch = 0;
      if (!grounded && legEnd) {
        const s = norm(sub(legEnd.b, legEnd.a));
        pitch = Math.max(-0.55, Math.min(0.95, dot(s, fwd) * 0.85));
      }
      
      
      
      
      
      
      
      
      
      if (pose && Array.isArray(pose.toe) && Number.isFinite(pose.toe[i])) {
        pitch = pose.toe[i];
      }
      add1(`foot${i}`, foot({
        origin: [K.feet[i][0] * sx, legEnd ? legEnd.b[1] : fallbackY, K.feet[i][1]],
        forward: fwd, side: i === 0 ? 1 : -1, pitch,
        ...(opts.footScale || {}),
      }));
    }
  }

  const mesh = mergeMeshes(parts.map((p) => p.mesh));
  return {
    parts, mesh, tris: mesh.tris,
    
    
    
    
    segments: [...byPart.values()], joints: jointList,
  };
}






































export function splayElbows(segments, girdle, torso, build = 1, shoulderSpan = 0) {
  if (!girdle || !torso) return segments;
  const yaw = girdle.shoulder.points
    ? girdleYawOf(girdle.shoulder.points) : (girdle.shoulder.yaw || 0);
  const g = [-Math.sin(yaw), Math.cos(yaw), 0];        
  const n = [Math.cos(yaw), Math.sin(yaw), 0];         
  const axis = sub(torso.bottom, torso.top);
  const L2 = Math.max(1e-9, dot(axis, axis));
  
  
  
  
  
  
  
  const secs = torsoSectionsFrom(torso, { build, shoulderSpan });
  const halfW = secs[2].w / 2;
  const halfD = secs[2].d / 2;
  
  
  
  
  
  
  
  
  const CAP = 0.034;

  const out = segments.map((s) => ({ ...s }));
  const by = new Map(out.map((s) => [s.part, s]));
  for (let i = 0; i < 2; i += 1) {
    const ua = by.get(`upperArm${i}`); const fa = by.get(`foreArm${i}`);
    if (!ua || !fa) continue;
    const sgn = dot(sub(ua.a, torso.top), g) >= 0 ? 1 : -1;
    let need = 0;
    
    
    
    
    
    
    
    
    
    
    
    
    const samples = [
      [lerp3(ua.a, ua.b, 0.45), ua.w / 2, 0.45],
      [lerp3(ua.a, ua.b, 0.80), ua.w / 2, 0.80],
      [ua.b, ua.w / 2, 1.00],
      [lerp3(fa.a, fa.b, 0.30), fa.w / 2, 1.00],
    ];
    for (const [p, r, f] of samples) {
      
      
      
      const t = Math.max(0.02, Math.min(1, dot(sub(p, torso.top), axis) / L2));
      const c = lerp3(torso.top, torso.bottom, t);
      const q = sub(p, c);
      const ln = dot(q, n);
      if (Math.abs(ln) >= halfD) continue;             
      
      const surface = halfW * Math.sqrt(Math.max(0, 1 - (ln / halfD) ** 2));
      need = Math.max(need, ((surface + r * 0.8) - dot(q, g) * sgn) / f);
    }
    
    
    
    
    if (need <= 0) continue;
    const shift = mul(g, sgn * Math.min(need, CAP));
    ua.b = add(ua.b, shift);
    fa.a = add(fa.a, shift);
  }
  return out;
}












function fallbackJoints(segments) {
  const by = new Map(segments.map((s) => [s.part, s]));
  const out = [];
  const at = (part, p, r) => { if (p) out.push({ part, centre: p, r }); };
  for (let i = 0; i < 2; i += 1) {
    const ua = by.get(`upperArm${i}`); const fa = by.get(`foreArm${i}`);
    const th = by.get(`thigh${i}`); const sh = by.get(`shin${i}`);
    if (ua) at(`shoulder${i}`, ua.a, ua.w * 0.66);
    if (fa) at(`elbow${i}`, fa.a, fa.w * 0.62);
    if (fa) at(`wrist${i}`, fa.b, fa.w * 0.46);
    if (th) at(`hip${i}`, th.a, th.w * 0.52);
    if (sh) at(`knee${i}`, sh.a, sh.w * 0.62);
    if (sh) at(`ankle${i}`, sh.b, sh.w * 0.46);
  }
  return out;
}





















const OPEN_BOTH = new Set([
  'block-high', 'block-mid', 'block-low', 'block-mid-in', 'block-high-in', 'air-guard',
  'hit-head', 'hit-body', 'hit-head-mid', 'hit-body-mid', 'stagger', 'stagger-mid',
  'knockdown', 'defeated', 'victory', 'talk', 'land',
]);
const OPEN_LEAD = new Set(['parry', 'talk-point', 'charge', 'charge-max', 'finish-wind']);

export function handStyleFor(pose) {
  if (!pose) return ['fist', 'fist'];
  const id = pose.id || '';
  
  
  
  if (OPEN_LEAD.has(id)) {
    const h = pose.hands;
    const reach = !h ? 0 : (h[0][0] >= h[1][0] ? 0 : 1);
    return reach === 0 ? ['open', 'fist'] : ['fist', 'open'];
  }
  if (OPEN_BOTH.has(id) || /palm|open hand/i.test(pose.note || '')) return ['open', 'open'];
  return ['fist', 'fist'];
}


export function budgetOf(built) {
  const rows = built.parts.map((p) => [p.name, p.tris]);
  return { rows, total: built.tris };
}
