






export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const frac = (x) => x - Math.floor(x);

export function quatFromEuler(rx, ry, rz, out = [0, 0, 0, 1], o = 0) {
  const cx = Math.cos(rx / 2), sx = Math.sin(rx / 2);
  const cy = Math.cos(ry / 2), sy = Math.sin(ry / 2);
  const cz = Math.cos(rz / 2), sz = Math.sin(rz / 2);
  out[o] = cz * cy * sx - sz * sy * cx;
  out[o + 1] = cz * sy * cx + sz * cy * sx;
  out[o + 2] = sz * cy * cx - cz * sy * sx;
  out[o + 3] = cz * cy * cx + sz * sy * sx;
  return out;
}


export function mat3FromQuat(q, o = 0, out = new Array(9)) {
  const x = q[o], y = q[o + 1], z = q[o + 2], w = q[o + 3];
  const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  out[0] = 1 - 2 * (yy + zz); out[1] = 2 * (xy - wz); out[2] = 2 * (xz + wy);
  out[3] = 2 * (xy + wz); out[4] = 1 - 2 * (xx + zz); out[5] = 2 * (yz - wx);
  out[6] = 2 * (xz - wy); out[7] = 2 * (yz + wx); out[8] = 1 - 2 * (xx + yy);
  return out;
}

export function eulerFromMat3(R) {
  const sy = clamp(-R[6], -1, 1);
  const ry = Math.asin(sy);
  if (Math.abs(sy) < 0.999999) return [Math.atan2(R[7], R[8]), ry, Math.atan2(R[3], R[0])];
  return [Math.atan2(-R[5], R[4]), ry, 0];
}

export function eulerFromQuat(q, o = 0) {
  return eulerFromMat3(mat3FromQuat(q, o));
}

export function mat3FromEuler(rx, ry, rz) {
  return mat3FromQuat(quatFromEuler(rx, ry, rz));
}

export function mat3Mul(a, b, out = new Array(9)) {
  const r = new Array(9);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  }
  for (let i = 0; i < 9; i++) out[i] = r[i];
  return out;
}

export function mat3Transpose(a) {
  return [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]];
}

export function mat3Apply(R, v) {
  return [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
}


export function mat3FromColumns(a, b, c) {
  return [a[0], b[0], c[0], a[1], b[1], c[1], a[2], b[2], c[2]];
}


export function quatNlerp(a, ao, b, bo, t, out, oo) {
  const dot = a[ao] * b[bo] + a[ao + 1] * b[bo + 1] + a[ao + 2] * b[bo + 2] + a[ao + 3] * b[bo + 3];
  const s = dot < 0 ? -t : t;
  const u = 1 - t;
  const x = a[ao] * u + b[bo] * s, y = a[ao + 1] * u + b[bo + 1] * s, z = a[ao + 2] * u + b[bo + 2] * s, w = a[ao + 3] * u + b[bo + 3] * s;
  const l = Math.hypot(x, y, z, w) || 1;
  out[oo] = x / l; out[oo + 1] = y / l; out[oo + 2] = z / l; out[oo + 3] = w / l;
  return out;
}


export function transformPoint(m, o, p) {
  return [
    m[o] * p[0] + m[o + 1] * p[1] + m[o + 2] * p[2] + m[o + 3],
    m[o + 4] * p[0] + m[o + 5] * p[1] + m[o + 6] * p[2] + m[o + 7],
    m[o + 8] * p[0] + m[o + 9] * p[1] + m[o + 10] * p[2] + m[o + 11],
  ];
}

export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
};
