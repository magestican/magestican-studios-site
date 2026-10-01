








export const POOL_SIZE = Object.freeze({ high: 8, medium: 4, low: 2 });

export function poolSize(tier) {
  if (!(tier in POOL_SIZE)) throw new Error(`unknown quality tier '${tier}'`);
  return POOL_SIZE[tier];
}



export function assignLights(sources, focus, size, out = new Int32Array(size)) {
  if (out.length !== size) throw new Error('out must have exactly the pool size');
  const dist = new Float64Array(size).fill(Infinity);
  out.fill(-1);
  for (let i = 0; i < sources.length; i++) {
    const dx = sources[i].x - focus.x, dz = sources[i].z - focus.z;
    const d = dx * dx + dz * dz;
    if (!(d < dist[size - 1])) continue;
    let j = size - 1;
    while (j > 0 && d < dist[j - 1]) {
      dist[j] = dist[j - 1];
      out[j] = out[j - 1];
      j--;
    }
    dist[j] = d;
    out[j] = i;
  }
  return out;
}
