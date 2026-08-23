
































































































export const BODY_RADIUS = 0.72;

export const PERSONAL_SPACE = 2 * BODY_RADIUS;   





export const AVOID_RANGE = 2.30;

export const CELL = AVOID_RANGE;



export const SEP_GAIN = 1.9;



export const HEAD_ON_DOT = -0.80;




const KEY_OFFSET = 2048;
const KEY_STRIDE = 4096;
function cellKey(cx, cz) {
  return (cx + KEY_OFFSET) * KEY_STRIDE + (cz + KEY_OFFSET);
}






export class Neighbourhood {
  constructor(bodies = [], cell = CELL) {
    this.cell = cell;
    this.count = 0;
    this.buckets = new Map();
    for (const b of bodies) {
      if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.z)) continue;
      const k = cellKey(Math.floor(b.x / cell), Math.floor(b.z / cell));
      let a = this.buckets.get(k);
      if (!a) this.buckets.set(k, (a = []));
      a.push(b);
      this.count++;
    }
  }

  
  
  forEachNear(x, z, radius, fn) {
    const cell = this.cell;
    const cx = Math.floor(x / cell), cz = Math.floor(z / cell);
    const r = Math.max(1, Math.ceil(radius / cell));
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        const a = this.buckets.get(cellKey(cx + dx, cz + dz));
        if (!a) continue;
        for (let i = 0; i < a.length; i++) fn(a[i]);
      }
    }
  }
}












let _memoFor = null;
let _memoHood = null;
let _builds = 0;
export function neighbourhoodFor(bodies) {
  if (bodies === _memoFor && _memoHood) return _memoHood;
  _memoFor = bodies;
  _memoHood = new Neighbourhood(bodies || []);
  _builds++;
  return _memoHood;
}






export function neighbourhoodStats() { return { builds: _builds }; }
export function resetNeighbourhoodCache() {
  _memoFor = null; _memoHood = null; _builds = 0;
}







function coincidentHeading(aId, bId) {
  const a = String(aId ?? ''), b = String(bId ?? '');
  let h = 2166136261;
  const lo = a < b ? a : b, hi = a < b ? b : a;
  for (let i = 0; i < lo.length; i++) h = Math.imul(h ^ lo.charCodeAt(i), 16777619);
  for (let i = 0; i < hi.length; i++) h = Math.imul(h ^ hi.charCodeAt(i), 16777619);
  const ang = ((h >>> 0) / 4294967296) * Math.PI * 2;
  
  
  return a <= b ? ang : ang + Math.PI;
}








export function separationPush(hood, self, opts = {}) {
  const space = opts.space ?? PERSONAL_SPACE;
  const range = Math.max(space + 0.05, opts.range ?? AVOID_RANGE);
  const ramp = range - space;
  let px = 0, pz = 0, closest = Infinity, neighbours = 0;

  hood.forEachNear(self.x, self.z, range, (b) => {
    if (b === self) return;
    if (b.peerId != null && self.peerId != null && b.peerId === self.peerId) return;
    let dx = self.x - b.x, dz = self.z - b.z;
    let d = Math.hypot(dx, dz);
    if (d >= range) return;
    
    
    
    const pairSpace = space * 0.5 * ((self.size ?? 1) + (b.size ?? 1));
    if (d < 1e-4) {
      const ang = coincidentHeading(self.peerId, b.peerId);
      dx = Math.cos(ang); dz = Math.sin(ang); d = 1e-4;
    }
    if (d < closest) closest = d;
    neighbours++;
    const w = Math.max(0, (range - d) / Math.max(1e-6, range - pairSpace));
    px += (dx / d) * w;
    pz += (dz / d) * w;
  });

  return { x: px, z: pz, closest, neighbours };
}









export function quarterTurn(x, z) { return { x: z, z: -x }; }
