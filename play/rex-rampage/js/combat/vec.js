




export const v3 = (x = 0, y = 0, z = 0) => ({ x, y, z });

export const add = (a, b) => v3(a.x + b.x, a.y + b.y, a.z + b.z);

export const sub = (a, b) => v3(a.x - b.x, a.y - b.y, a.z - b.z);

export const scale = (a, s) => v3(a.x * s, a.y * s, a.z * s);

export const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

export const len = (a) => Math.hypot(a.x, a.y, a.z);

export const norm = (a) => {
  const l = len(a) || 1;
  return v3(a.x / l, a.y / l, a.z / l);
};

export const lerp = (a, b, t) => v3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
