




















export const MS = 1000;
export const BP = 10000;




export function decay(value, elapsed_ms, halfLife_ms) {
  if (value <= 0) return 0;
  if (elapsed_ms <= 0) return value;
  const halvings = Math.floor(elapsed_ms / halfLife_ms);
  if (halvings >= 40) return 0;
  const v = Math.floor(value / 2 ** halvings);
  const rem = elapsed_ms - halvings * halfLife_ms;
  return v - Math.floor((v * rem) / (2 * halfLife_ms));
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}



export function draw(seed, ...keys) {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  for (const key of keys) {
    const k = typeof key === 'string' ? hashString(key) : key >>> 0;
    h = Math.imul(h ^ k, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export function chance(bp, seed, ...keys) {
  return draw(seed, ...keys) % BP < bp;
}


export function pickWeighted(weights, seed, ...keys) {
  let total = 0;
  for (const w of weights) total += w;
  if (total <= 0) return -1;
  let r = draw(seed, ...keys) % total;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1;
}
