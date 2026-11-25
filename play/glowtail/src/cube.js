














export const N = 9; 
export const CELLS = 6 * N * N;
const AXES = ['x', 'y', 'z'];

export const vec = (x, y, z) => ({ x: x || 0, y: y || 0, z: z || 0 }); 
export const add = (a, b) => vec(a.x + b.x, a.y + b.y, a.z + b.z);
export const sub = (a, b) => vec(a.x - b.x, a.y - b.y, a.z - b.z);
export const neg = (a) => vec(-a.x, -a.y, -a.z);
export const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a, b) => vec(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
export const same = (a, b) => a.x === b.x && a.y === b.y && a.z === b.z;
const inRange = (v) => v >= 0 && v < N;


function faceAxis(c) {
  for (let i = 0; i < 3; i++) {
    const v = c[AXES[i]];
    if (v === -1) return { i, s: -1 };
    if (v === N) return { i, s: 1 };
  }
  throw new Error(`not a cube cell: ${JSON.stringify(c)}`);
}


export function normalOf(c) {
  const { i, s } = faceAxis(c);
  const n = vec(0, 0, 0);
  n[AXES[i]] = s;
  return n;
}


export function faceOf(c) {
  const { i, s } = faceAxis(c);
  return i * 2 + (s > 0 ? 0 : 1);
}


export function faceOfNormal(n) {
  for (let i = 0; i < 3; i++) if (n[AXES[i]]) return i * 2 + (n[AXES[i]] > 0 ? 0 : 1);
  throw new Error('zero normal');
}

export function isCell(c) {
  let face = 0;
  for (const a of AXES) {
    const v = c[a];
    if (v === -1 || v === N) face++;
    else if (!inRange(v)) return false;
  }
  return face === 1;
}


export function cellKey(c) {
  const { i } = faceAxis(c);
  const u = c[AXES[(i + 1) % 3]], v = c[AXES[(i + 2) % 3]];
  return faceOf(c) * N * N + u * N + v;
}

export function cellAt(k) {
  const f = Math.floor(k / (N * N)), r = k % (N * N);
  const i = f >> 1, s = f & 1 ? -1 : 1;
  const c = vec(0, 0, 0);
  c[AXES[i]] = s > 0 ? N : -1;
  c[AXES[(i + 1) % 3]] = Math.floor(r / N);
  c[AXES[(i + 2) % 3]] = r % N;
  return c;
}


export function stepCell(c, d) {
  const p = add(c, d);
  if (isCell(p)) return { cell: p, crossed: false };
  const n = normalOf(c);
  return { cell: sub(p, n), crossed: true };
}


export function rollVec(v, n, d) {
  const a = dot(v, n), b = dot(v, d);
  const rest = sub(sub(v, vec(n.x * a, n.y * a, n.z * a)), vec(d.x * b, d.y * b, d.z * b));
  return add(rest, add(vec(d.x * a, d.y * a, d.z * a), vec(-n.x * b, -n.y * b, -n.z * b)));
}

export function rollFrame(frame, n, d) {
  return { R: rollVec(frame.R, n, d), U: rollVec(frame.U, n, d), F: rollVec(frame.F, n, d) };
}


export function screenVec(frame, dir) {
  switch (dir) {
    case 'up': return frame.U;
    case 'down': return neg(frame.U);
    case 'right': return frame.R;
    case 'left': return neg(frame.R);
    default: throw new Error(`bad dir ${dir}`);
  }
}


export function move(c, frame, dir) {
  const d = screenVec(frame, dir);
  const r = stepCell(c, d);
  if (!r.crossed) return { cell: r.cell, frame, crossed: false };
  const n = normalOf(c);
  return { cell: r.cell, frame: rollFrame(frame, n, d), crossed: true, from: n, to: d };
}


export const START_FRAME = Object.freeze({ R: vec(1, 0, 0), U: vec(0, -1, 0), F: vec(0, 0, -1) });


export function neighbors(k) {
  const c = cellAt(k);
  const { i } = faceAxis(c);
  const out = [];
  for (const j of [(i + 1) % 3, (i + 2) % 3]) {
    for (const s of [1, -1]) {
      const d = vec(0, 0, 0);
      d[AXES[j]] = s;
      out.push(cellKey(stepCell(c, d).cell));
    }
  }
  return out;
}


export function faceDirs(c) {
  const { i } = faceAxis(c);
  const out = [];
  for (const j of [(i + 1) % 3, (i + 2) % 3]) for (const s of [1, -1]) {
    const d = vec(0, 0, 0);
    d[AXES[j]] = s;
    out.push(d);
  }
  return out;
}


export function distances(from) {
  const dist = new Int16Array(CELLS).fill(-1);
  const start = cellKey(from);
  dist[start] = 0;
  const q = [start];
  for (let h = 0; h < q.length; h++) {
    const k = q[h];
    for (const nk of neighbors(k)) if (dist[nk] < 0) { dist[nk] = dist[k] + 1; q.push(nk); }
  }
  return dist;
}


export function inset(c) {
  const { i } = faceAxis(c);
  let m = N;
  for (const j of [(i + 1) % 3, (i + 2) % 3]) { const v = c[AXES[j]]; m = Math.min(m, v, N - 1 - v); }
  return m;
}





export function keepOut(head, band = 2) {
  const n = normalOf(head);
  const { i, s } = faceAxis(head);
  const opposite = faceOfNormal(neg(n));
  const own = faceOf(head);
  return (c) => {
    const f = faceOf(c);
    if (f === opposite) return true;
    if (f === own) return false;
    const v = c[AXES[i]];
    return (s > 0 ? N - 1 - v : v) < band;
  };
}






export function startBody(length) {
  const mid = (N - 1) / 2;
  const z = START_FRAME.F.z < 0 ? -1 : N;
  const cells = [];
  for (let y = mid; y < N; y++) cells.push(vec(mid, y, z));
  
  for (let x = mid; x >= 0; x--) cells.push(vec(x, N, 0));
  for (let row = 1; row < N; row++) {
    const xs = [...Array(N).keys()];
    if (row % 2 === 0) xs.reverse();
    for (const x of xs) cells.push(vec(x, N, row));
  }
  return cells.slice(0, Math.max(1, length));
}


export const FIRST_MOTE = Object.freeze(vec((N - 1) / 2, -1, 2));


export function surfacePoint(c) {
  const f = (v) => (v === -1 ? -N / 2 : v === N ? N / 2 : v - (N - 1) / 2);
  return vec(f(c.x), f(c.y), f(c.z));
}


export function edgePoint(a, b) {
  const pa = surfacePoint(a), pb = surfacePoint(b);
  const ia = faceAxis(a).i, ib = faceAxis(b).i;
  const out = vec((pa.x + pb.x) / 2, (pa.y + pb.y) / 2, (pa.z + pb.z) / 2);
  out[AXES[ia]] = pa[AXES[ia]];
  out[AXES[ib]] = pb[AXES[ib]];
  return out;
}






export const LANDMARKS = Object.freeze(['vent', 'coral', 'lamp', 'geode', 'wreck', 'stalagmite']);

const LANDMARK_CORNERS = [[1, 1], [N - 2, 1], [1, N - 2], [N - 2, N - 2], [N - 2, 1], [1, N - 2]];


export function landmarkCells() {
  return LANDMARK_CORNERS.map(([u, v], f) => {
    const i = f >> 1, s = f & 1 ? -1 : 1;
    const c = vec(0, 0, 0);
    c[AXES[i]] = s > 0 ? N : -1;
    c[AXES[(i + 1) % 3]] = u;
    c[AXES[(i + 2) % 3]] = v;
    return c;
  });
}
