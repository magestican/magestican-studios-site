



























import { v3 } from '../rig/math.mjs';



export const SPHERE_R = 24;


const POLE = Object.freeze([0, 1, 0]);





export const discRadius = (R = SPHERE_R) => 2 * R;

































export function fromDisc({ x, z }, R = SPHERE_R) {
  const rho = Math.hypot(x, z);
  const rim = discRadius(R);
  if (!(rho > 0)) return [...POLE];
  
  
  const c = 2 * Math.asin(Math.min(1, rho / rim));
  const sc = Math.sin(c);
  return [(sc * x) / rho, Math.cos(c), (sc * z) / rho];
}



export function toDisc(n, R = SPHERE_R) {
  const [nx, ny, nz] = n;
  const horiz = Math.hypot(nx, nz);
  const c = Math.atan2(horiz, ny); 
  const rho = discRadius(R) * Math.sin(c / 2);
  if (!(horiz > 0)) return { x: 0, z: rho }; 
  return { x: (rho * nx) / horiz, z: (rho * nz) / horiz };
}





export function scaleAt(n) {
  const c = Math.atan2(Math.hypot(n[0], n[2]), n[1]);
  const half = Math.cos(c / 2);
  return { radial: half, azimuthal: half > 0 ? 1 / half : Infinity };
}




export const position = (n, h = 0, R = SPHERE_R) => v3.mul(n, R + h);


export const up = (n) => [...n];





export function geodesic(a, b, R = SPHERE_R) {
  return R * Math.atan2(v3.len(v3.cross(a, b)), v3.dot(a, b));
}







export function tangentBasis(n) {
  let east = v3.cross(POLE, n);
  if (v3.len(east) < 1e-9) east = v3.cross([0, 0, 1], n);
  east = v3.norm(east);
  return { east, north: v3.norm(v3.cross(n, east)) };
}




export function headingToward(from, to) {
  const t = v3.sub(to, v3.mul(from, v3.dot(from, to)));
  const l = v3.len(t);
  return l < 1e-9 ? null : v3.mul(t, 1 / l);
}










export function walk(n, t, metres, R = SPHERE_R) {
  const theta = metres / R;
  const c = Math.cos(theta), s = Math.sin(theta);
  const n2 = v3.norm(v3.add(v3.mul(n, c), v3.mul(t, s)));
  let t2 = v3.add(v3.mul(n, -s), v3.mul(t, c));
  t2 = v3.norm(v3.sub(t2, v3.mul(n2, v3.dot(n2, t2)))); 
  return { n: n2, t: t2 };
}


export const circumference = (R = SPHERE_R) => 2 * Math.PI * R;









export const horizon = (eyeHeight, R = SPHERE_R) => Math.sqrt(2 * R * eyeHeight + eyeHeight * eyeHeight);
