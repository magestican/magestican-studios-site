





































import { mergeMeshes, stackMesh, jointBall } from '../ps1Mesh.mjs';

const TAU = Math.PI * 2;


export const PORKER_HEIGHT_M = 1.72;









export const ZONES = Object.freeze({
  legs: { lo: 0.0, hi: 0.44 },
  torso: { lo: 0.40, hi: 0.80 },
  arms: { lo: 0.52, hi: 0.80 },
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
    
    [0.00, 0.115, 0.135, 0.020],   
    [0.22, 0.165, 0.185, 0.062],   
    [0.48, 0.150, 0.175, 0.104],
    [0.74, 0.120, 0.150, 0.132],   
    [1.00, 0.088, 0.108, 0.145],   
  ].map(([t, rx, ry, cx]) => ring(lo + h * t, rx, ry, n, { cx }));
  return stackMesh(rings, { capFirst: true, capLast: true });
}








function head(n = 6) {
  const { lo, hi } = ZONES.head;
  const h = hi - lo;
  const rings = [
    ring(lo, 0.072, 0.082, n, { cx: 0.150 }),          
    ring(lo + h * 0.30, 0.092, 0.100, n, { cx: 0.170 }), 
    ring(lo + h * 0.62, 0.086, 0.092, n, { cx: 0.196 }), 
    ring(lo + h * 0.60, 0.062, 0.066, n, { cx: 0.262 }), 
    ring(lo + h * 0.52, 0.048, 0.052, n, { cx: 0.320 }), 
    ring(lo + h * 0.50, 0.044, 0.048, n, { cx: 0.352 }), 
  ];
  return stackMesh(rings, { capFirst: true, capLast: true });
}


function ear(side, n = 3) {
  const { lo, hi } = ZONES.head;
  const h = hi - lo;
  const y = side * 0.070;
  return stackMesh([
    ring(lo + h * 0.86, 0.030, 0.016, n, { cx: 0.150, cy: y }),
    ring(lo + h * 0.78, 0.040, 0.012, n, { cx: 0.215, cy: y * 1.25 }),
    ring(lo + h * 0.62, 0.022, 0.008, n, { cx: 0.250, cy: y * 1.35 }),
  ], { capLast: true });
}










function arm(side, human, n = 4) {
  const { lo, hi } = ZONES.arms;
  const h = hi - lo;
  
  
  
  
  
  
  
  
  
  
  
  const y = side * (0.245 + human * 0.015);
  const reach = 0.30 + human * 0.09;
  const thick = 1.25 - human * 0.35;
  const rings = [
    ring(lo + h * 0.98, 0.052 * thick, 0.052 * thick, n, { cx: 0.115, cy: y * 0.86 }),   
    ring(lo + h * 0.62, 0.040 * thick, 0.040 * thick, n, { cx: 0.190, cy: y }),          
    ring(lo + h * 0.30, 0.032 * thick, 0.032 * thick, n, { cx: 0.190 + reach * 0.55, cy: y * 1.08 }),
    ring(lo + h * 0.16, 0.028 * thick, 0.028 * thick, n, { cx: 0.190 + reach, cy: y * 1.12 }),
  ];
  const limb = stackMesh(rings, { capFirst: true, capLast: true });
  if (!human) return limb;
  
  
  const fingers = [-1, 0, 1].map((k) => stackMesh([
    ring(lo + h * 0.15, 0.011, 0.011, 3, { cx: 0.190 + reach, cy: y * 1.12 + k * 0.020 }),
    ring(lo + h * 0.05, 0.008, 0.008, 3, { cx: 0.190 + reach + 0.048, cy: y * 1.12 + k * 0.028 }),
  ], { capLast: true }));
  return mergeMeshes([limb, ...fingers]);
}








function leg(side, n = 5) {
  const { lo, hi } = ZONES.legs;
  const y = side * 0.082;
  const rings = [
    ring(hi, 0.078, 0.082, n, { cx: 0.010, cy: y }),          
    ring(hi - 0.115, 0.062, 0.062, n, { cx: 0.038, cy: y }),  
    ring(hi - 0.215, 0.040, 0.040, n, { cx: -0.020, cy: y }), 
    ring(lo + 0.070, 0.030, 0.030, n, { cx: 0.014, cy: y }),  
    ring(lo + 0.012, 0.028, 0.030, n, { cx: 0.030, cy: y }),
  ];
  const shank = stackMesh(rings, { capFirst: true, capLast: true });
  const toes = [1, -1].map((t) => stackMesh([
    ring(lo + 0.010, 0.019, 0.015, 3, { cx: 0.034, cy: y + t * 0.020 }),
    ring(lo + 0.002, 0.014, 0.011, 3, { cx: 0.078, cy: y + t * 0.026 }),
  ], { capLast: true }));
  return mergeMeshes([shank, ...toes]);
}









export function buildPorker() {
  const { lo, hi } = ZONES.head;
  const eyeZ = lo + (hi - lo) * 0.66;
  const parts = [
    { name: 'torso', zone: 'torso', mesh: torso() },
    { name: 'head', zone: 'head', mesh: head() },
    { name: 'earL', zone: 'head', mesh: ear(-1) },
    { name: 'earR', zone: 'head', mesh: ear(+1) },
    
    
    
    { name: 'armL', zone: 'arms', mesh: arm(-1, 1) },
    { name: 'armR', zone: 'arms', mesh: arm(+1, 0) },
    { name: 'legL', zone: 'legs', mesh: leg(-1) },
    { name: 'legR', zone: 'legs', mesh: leg(+1) },
    
    
    
    
    
    
    
    { name: 'eyeL', zone: 'head', mesh: jointBall([0.232, -0.052, eyeZ], 0.024, { sides: 4 }) },
    { name: 'eyeR', zone: 'head', mesh: jointBall([0.232, 0.052, eyeZ], 0.024, { sides: 4 }) },
    
    { name: 'snout', zone: 'head', mesh: jointBall([0.362, 0, lo + (hi - lo) * 0.50], 0.030, { sides: 5 }) },
  ].filter((p) => p.mesh && p.mesh.indices && p.mesh.indices.length);

  return { parts, tris: parts.reduce((n, p) => n + p.mesh.tris, 0) };
}

export function porkerTriangles() {
  return buildPorker().tris;
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
