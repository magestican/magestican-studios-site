

































import { mergeMeshes, stackMesh, jointBall } from '../ps1Mesh.mjs';

const TAU = Math.PI * 2;


export const COW_HEIGHT_M = 2.05;








export const ZONES = Object.freeze({
  legs: { lo: 0.0, hi: 0.42 },
  torso: { lo: 0.38, hi: 0.86 },
  udder: { lo: 0.30, hi: 0.58 },
  head: { lo: 0.80, hi: 1.0 },
});

function ring(z, rx, ry, n, { yaw = 0, cx = 0, cy = 0 } = {}) {
  const pts = []; const uv = [];
  for (let j = 0; j < n; j += 1) {
    const a = yaw - (j / n) * TAU;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, z]);
    uv.push([j / n, z]);
  }
  return { pts, uv };
}










function torso(n = 7) {
  const { lo, hi } = ZONES.torso;
  const h = hi - lo;
  const rings = [
    
    [0.00, 0.130, 0.150, 0.010],
    [0.26, 0.160, 0.190, -0.030],   
    [0.55, 0.150, 0.180, -0.078],
    [0.80, 0.125, 0.150, -0.108],
    [1.00, 0.095, 0.115, -0.122],   
  ].map(([t, rx, ry, cx]) => ring(lo + h * t, rx, ry, n, { cx }));
  return stackMesh(rings, { capFirst: true, capLast: true });
}










function head(n = 6) {
  const { lo, hi } = ZONES.head;
  const h = hi - lo;
  const rings = [
    ring(lo - 0.06, 0.078, 0.086, n, { cx: -0.090 }),     
    ring(lo + h * 0.30, 0.086, 0.094, n, { cx: -0.020 }), 
    ring(lo + h * 0.46, 0.080, 0.086, n, { cx: 0.060 }),  
    ring(lo + h * 0.34, 0.062, 0.062, n, { cx: 0.140 }),  
    ring(lo + h * 0.24, 0.056, 0.058, n, { cx: 0.215 }),  
    ring(lo + h * 0.20, 0.050, 0.054, n, { cx: 0.250 }),
  ];
  return stackMesh(rings, { capFirst: true, capLast: true });
}


function horn(side, n = 3) {
  const { lo, hi } = ZONES.head;
  const h = hi - lo;
  const y = side * 0.070;
  return stackMesh([
    ring(lo + h * 0.62, 0.022, 0.022, n, { cx: -0.030, cy: y }),
    ring(lo + h * 0.82, 0.017, 0.017, n, { cx: -0.010, cy: y * 1.5 }),
    ring(lo + h * 0.92, 0.011, 0.011, n, { cx: 0.030, cy: y * 1.7 }),
  ], { capFirst: true, capLast: true });
}


function ear(side, n = 3) {
  const { lo, hi } = ZONES.head;
  const h = hi - lo;
  const y = side * 0.086;
  return stackMesh([
    ring(lo + h * 0.44, 0.026, 0.014, n, { cx: -0.030, cy: y }),
    ring(lo + h * 0.40, 0.036, 0.010, n, { cx: -0.020, cy: y * 1.7 }),
    ring(lo + h * 0.34, 0.018, 0.007, n, { cx: -0.010, cy: y * 2.1 }),
  ], { capLast: true });
}







function udder(n = 6) {
  const { lo, hi } = ZONES.udder;
  const h = hi - lo;
  const bag = stackMesh([
    ring(lo + h * 0.95, 0.090, 0.130, n, { cx: 0.115 }),
    ring(lo + h * 0.62, 0.115, 0.160, n, { cx: 0.140 }),
    ring(lo + h * 0.28, 0.100, 0.140, n, { cx: 0.135 }),
    ring(lo + h * 0.06, 0.060, 0.085, n, { cx: 0.120 }),
  ], { capFirst: true, capLast: true });
  const teats = [-1, 1].map((t) => stackMesh([
    ring(lo + h * 0.14, 0.020, 0.020, 3, { cx: 0.150, cy: t * 0.062 }),
    ring(lo - 0.030, 0.014, 0.014, 3, { cx: 0.160, cy: t * 0.070 }),
  ], { capLast: true }));
  return mergeMeshes([bag, ...teats]);
}













function tentacle(side, n = 4) {
  const { lo, hi } = ZONES.udder;
  const N = 8;
  const rings = [];
  for (let i = 0; i < N; i += 1) {
    const t = i / (N - 1);
    
    const z = hi - 0.02 - t * (hi - lo + 0.06);
    const r = 0.042 * (1 - t * 0.72);
    
    const y = side * (0.150 + Math.sin(t * Math.PI * 0.8) * 0.115);
    const x = 0.130 + Math.sin(t * 2.4) * 0.085 + t * 0.055;
    rings.push(ring(z, r, r, n, { cx: x, cy: y }));
  }
  return stackMesh(rings, { capFirst: true, capLast: true });
}




function leg(side, n = 5) {
  const { lo, hi } = ZONES.legs;
  const y = side * 0.098;
  const rings = [
    ring(hi, 0.086, 0.092, n, { cx: -0.010, cy: y }),
    ring(hi - 0.110, 0.066, 0.068, n, { cx: 0.030, cy: y }),   
    ring(hi - 0.210, 0.040, 0.042, n, { cx: -0.038, cy: y }),  
    ring(lo + 0.075, 0.028, 0.030, n, { cx: 0.006, cy: y }),   
    ring(lo + 0.014, 0.030, 0.034, n, { cx: 0.020, cy: y }),
  ];
  const shank = stackMesh(rings, { capFirst: true, capLast: true });
  
  
  const hoof = [1, -1].map((t) => stackMesh([
    ring(lo + 0.012, 0.020, 0.015, 3, { cx: 0.024, cy: y + t * 0.020 }),
    ring(lo + 0.001, 0.017, 0.012, 3, { cx: 0.062, cy: y + t * 0.024 }),
  ], { capLast: true }));
  return mergeMeshes([shank, ...hoof]);
}


function tail(n = 3) {
  const { lo, hi } = ZONES.torso;
  return stackMesh([
    ring(lo + (hi - lo) * 0.12, 0.026, 0.026, n, { cx: -0.130 }),
    ring(lo - 0.070, 0.018, 0.018, n, { cx: -0.190 }),
    ring(lo - 0.190, 0.012, 0.012, n, { cx: -0.205 }),
  ], { capFirst: true, capLast: true });
}


export function buildCow() {
  const { lo, hi } = ZONES.head;
  const eyeZ = lo + (hi - lo) * 0.44;
  const parts = [
    { name: 'torso', zone: 'torso', mesh: torso() },
    { name: 'udder', zone: 'torso', mesh: udder() },
    { name: 'head', zone: 'head', mesh: head() },
    { name: 'hornL', zone: 'head', mesh: horn(-1) },
    { name: 'hornR', zone: 'head', mesh: horn(+1) },
    { name: 'earL', zone: 'head', mesh: ear(-1) },
    { name: 'earR', zone: 'head', mesh: ear(+1) },
    
    { name: 'tentacleL', zone: 'tentacles', mesh: tentacle(-1) },
    { name: 'tentacleR', zone: 'tentacles', mesh: tentacle(+1) },
    { name: 'legL', zone: 'legs', mesh: leg(-1) },
    { name: 'legR', zone: 'legs', mesh: leg(+1) },
    { name: 'tail', zone: 'torso', mesh: tail() },
    
    
    { name: 'eyeL', zone: 'head', mesh: jointBall([0.050, -0.078, eyeZ], 0.026, { sides: 4 }) },
    { name: 'eyeR', zone: 'head', mesh: jointBall([0.050, 0.078, eyeZ], 0.026, { sides: 4 }) },
  ].filter((p) => p.mesh && p.mesh.indices && p.mesh.indices.length);

  return { parts, tris: parts.reduce((n, p) => n + p.mesh.tris, 0) };
}

export function cowTriangles() {
  return buildCow().tris;
}


export function partBounds(mesh) {
  const b = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (let i = 0; i < mesh.positions.length; i += 3) {
    for (let a = 0; a < 3; a += 1) {
      b.min[a] = Math.min(b.min[a], mesh.positions[i + a]);
      b.max[a] = Math.max(b.max[a], mesh.positions[i + a]);
    }
  }
  return b;
}
