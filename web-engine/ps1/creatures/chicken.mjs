
































import { emptyMesh, mergeMeshes, stackMesh, jointBall } from '../ps1Mesh.mjs';













export const CHICKEN_HEIGHT_M = 0.72;









export const ZONES = Object.freeze({
  legs: Object.freeze({ lo: 0.03, hi: 0.21 }),
  torso: Object.freeze({ lo: 0.22, hi: 0.74 }),
  head: Object.freeze({ lo: 0.75, hi: 0.99 }),
});

const TAU = Math.PI * 2;













function ring(z, rx, ry, n, { yaw = 0, cx = 0, cy = 0 } = {}) {
  const pts = []; const uv = [];
  for (let j = 0; j < n; j += 1) {
    const a = yaw - (j / n) * TAU;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, z]);
    uv.push([j / n, z]);
  }
  return { pts, uv };
}










function torso(n = 6) {
  const { lo, hi } = ZONES.torso;
  const h = hi - lo;
  
  const profile = [
    [0.00, 0.110, 0.080, 0.010],
    [0.16, 0.195, 0.150, -0.010],
    [0.38, 0.250, 0.185, -0.035],  
    [0.62, 0.230, 0.170, -0.020],
    [0.82, 0.165, 0.125, 0.020],
    [1.00, 0.095, 0.078, 0.055],   
  ];
  
  
  
  
  
  const rings = profile.map(([t, rx, ry, cx]) => ring(lo + t * h, rx, ry, n, { cx }));
  return stackMesh(rings, { capFirst: true, capLast: true });
}










function neckAndHead(n = 5) {
  const { lo, hi } = ZONES.head;
  const h = hi - lo;
  const profile = [
    [0.00, 0.085, 0.078, 0.040],
    [0.30, 0.068, 0.062, 0.070],   
    [0.55, 0.072, 0.066, 0.098],
    [0.74, 0.098, 0.090, 0.118],   
    [0.90, 0.086, 0.079, 0.124],
    [1.00, 0.042, 0.038, 0.118],
  ];
  
  
  
  
  
  const rings = profile.map(([t, rx, ry, cx]) => ring(lo + t * h, rx, ry, n, { cx }));
  return stackMesh(rings, { capFirst: true, capLast: true });
}







function beak() {
  const { lo, hi } = ZONES.head;
  const z = lo + (hi - lo) * 0.80;
  const rings = [
    ring(z + 0.010, 0.034, 0.030, 5, { cx: 0.150 }),
    ring(z - 0.004, 0.026, 0.022, 5, { cx: 0.196 }),
    ring(z - 0.030, 0.010, 0.009, 5, { cx: 0.214 }),  
  ];
  return stackMesh(rings, { capFirst: true, capLast: true });
}


function comb() {
  const { hi } = ZONES.head;
  const rings = [
    ring(hi - 0.045, 0.014, 0.030, 4, { cx: 0.095 }),
    ring(hi + 0.005, 0.012, 0.042, 4, { cx: 0.088 }),
    ring(hi + 0.030, 0.009, 0.030, 4, { cx: 0.060 }),
  ];
  return stackMesh(rings, { capFirst: true, capLast: true });
}








function leg(side, n = 5) {
  const { lo, hi } = ZONES.legs;
  const y = side * 0.062;
  const rings = [
    ring(hi, 0.032, 0.032, n, { cx: -0.010, cy: y }),        
    ring(hi - 0.055, 0.024, 0.024, n, { cx: 0.005, cy: y }), 
    ring(hi - 0.100, 0.016, 0.016, n, { cx: -0.020, cy: y }),
    ring(lo + 0.020, 0.012, 0.012, n, { cx: 0.010, cy: y }), 
    ring(lo, 0.011, 0.011, n, { cx: 0.020, cy: y }),
  ];
  const shank = stackMesh(rings, { capFirst: true, capLast: true });
  
  
  
  
  
  
  
  const toes = [1, -1].map((t) => stackMesh([
    ring(lo + 0.004, 0.010, 0.010, 3, { cx: 0.020, cy: y + t * 0.024 }),
    ring(lo + 0.002, 0.007, 0.007, 3, { cx: 0.058, cy: y + t * 0.042 }),
  ], { capLast: true }));
  return mergeMeshes([shank, ...toes]);
}









function wing(side, n = 4) {
  const { lo, hi } = ZONES.torso;
  const h = hi - lo;
  
  
  
  
  
  
  
  
  
  
  
  
  const y = side * 0.240;
  const rings = [
    ring(lo + h * 0.72, 0.065, 0.030, n, { cx: -0.010, cy: y * 0.82 }),
    ring(lo + h * 0.50, 0.115, 0.038, n, { cx: -0.040, cy: y }),
    ring(lo + h * 0.26, 0.100, 0.030, n, { cx: -0.090, cy: y * 0.99 }),
    ring(lo + h * 0.10, 0.055, 0.020, n, { cx: -0.135, cy: y * 0.90 }),
  ];
  return stackMesh(rings, { capFirst: true, capLast: true });
}


function tail(n = 4) {
  const { lo, hi } = ZONES.torso;
  const h = hi - lo;
  const rings = [
    ring(lo + h * 0.55, 0.045, 0.090, n, { cx: -0.190 }),
    ring(lo + h * 0.85, 0.038, 0.135, n, { cx: -0.265 }),
    ring(lo + h * 1.05, 0.020, 0.105, n, { cx: -0.300 }),
  ];
  return stackMesh(rings, { capFirst: true, capLast: true });
}








export function buildChicken() {
  const parts = [
    { name: 'torso', zone: 'torso', mesh: torso() },
    { name: 'head', zone: 'head', mesh: neckAndHead() },
    { name: 'beak', zone: 'head', mesh: beak() },
    { name: 'comb', zone: 'head', mesh: comb() },
    
    
    
    
    
    
    { name: 'legL', zone: 'legs', mesh: leg(-1) },
    { name: 'legR', zone: 'legs', mesh: leg(+1) },
    { name: 'wingL', zone: 'torso', mesh: wing(-1) },
    { name: 'wingR', zone: 'torso', mesh: wing(+1) },
    { name: 'tail', zone: 'torso', mesh: tail() },
    
    
    
    { name: 'eyeL', zone: 'head', mesh: jointBall([0.128, 0.048, ZONES.head.lo + (ZONES.head.hi - ZONES.head.lo) * 0.86], 0.021, { sides: 4 }) },
    { name: 'eyeR', zone: 'head', mesh: jointBall([0.128, -0.048, ZONES.head.lo + (ZONES.head.hi - ZONES.head.lo) * 0.86], 0.021, { sides: 4 }) },
  ].filter((p) => p.mesh && p.mesh.indices && p.mesh.indices.length);

  return { parts, tris: parts.reduce((n, p) => n + p.mesh.tris, 0) };
}


export function chickenTriangles() {
  return buildChicken().tris;
}


export function partBounds(mesh) {
  const b = {
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  };
  for (let i = 0; i < mesh.positions.length; i += 3) {
    for (let a = 0; a < 3; a += 1) {
      b.min[a] = Math.min(b.min[a], mesh.positions[i + a]);
      b.max[a] = Math.max(b.max[a], mesh.positions[i + a]);
    }
  }
  return b;
}
