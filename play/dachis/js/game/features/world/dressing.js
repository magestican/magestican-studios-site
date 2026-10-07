













import { T, addObj, BLOCKED } from './mapgen.js';


export const LIFE = {
  
  bowl: [0.2, 0], basket: [0.28, 0], pots: [0.38, 0.26], crates: [0.45, 0.36], fishrack: [0.72, 0.15], cookfire: [0.56, 0.48],
  well: [0.62, 0.6], washline: [0.95, 0], strawbed: [0.65, 0], toys: [0.5, 0], tools: [0.32, 0.26], fruitfall: [0.32, 0],
  sandbags: [0, 0], seawall: [0, 0], stilts: [0, 0], jetty: [0, 0], mango: [0.4, 0.3], appletree: [0.4, 0.3], banana: [0.4, 0.25], palm: [0.4, 0.3],
};
export const FRUIT_OF = { mango: '#f0b030', appletree: '#e03a3a', banana: '#e8d040', palm: '#6a4422' };
export const WEED_C = ['#fff0f8', '#ffd84a', '#ff9ab0', '#c8a0ff', '#ffffff'];
const WET = new Set([T.DEEP, T.SHALLOW]);


export function spreadAt(W, x, y, r) {
  let lo = Infinity, hi = -Infinity;
  for (let k = 0; k <= 8; k++) {
    const a = k / 8 * Math.PI * 2, d = k === 8 ? 0 : r, h = W.groundAt(x + Math.sin(a) * d, y + Math.cos(a) * d);
    lo = Math.min(lo, h); hi = Math.max(hi, h);
  }
  return hi - lo;
}
export function dryAt(W, x, y, r) {
  for (let k = 0; k <= 8; k++) {
    const a = k / 8 * Math.PI * 2, d = k === 8 ? 0 : r, t = W.tileType(x + Math.sin(a) * d, y + Math.cos(a) * d);
    if (BLOCKED.has(t)) return false;
  }
  return true;
}
export const flatAt = (W, x, y, r) => spreadAt(W, x, y, Math.max(r, 0.1)) < 0.1 && dryAt(W, x, y, r);

const radiusOf = (o) => Math.max(o.solid || 0, LIFE[o.kind] ? LIFE[o.kind][0] : 0, o.kind === 'hut' ? 0.85 * (o.s || 1) : 0, o.kind === 'stilts' ? 1.0 * (o.s || 1) : 0, 0.15);
export const freeAt = (W, x, y, r) => W.objects.every((o) => o.kind === 'fence' || Math.hypot(o.x - x, o.y - y) > radiusOf(o) + r + 0.05);

function put(W, kind, x, y, extra = {}) {
  const [, solid] = LIFE[kind] || [0, 0];
  const o = { kind, x, y, solid, ...extra };
  addObj(W, o);
  return o;
}


function waterNear(W, x, y, reach) {
  let best = null;
  for (let k = 0; k < 24; k++) for (const d of [reach * 0.5, reach * 0.75, reach]) {
    const a = k / 24 * Math.PI * 2, px = x + Math.sin(a) * d, py = y + Math.cos(a) * d;
    if (WET.has(W.tileType(px, py)) && (!best || d < best.d)) best = { a, d };
  }
  return best;
}

export function guardHuts(W, huts) {
  for (const h of huts) {
    const s = h.s || 1, foot = 0.9 * s, obj = W.objects.find((o) => o.kind === 'hut' && o.x === h.x && o.y === h.y);
    if (obj) h.id = obj.id;
    const spread = spreadAt(W, h.x, h.y, foot), wet = !dryAt(W, h.x, h.y, foot);
    if (spread > 0.15 || wet || h.stilt) { 
      
      let top = 0;
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; top = Math.max(top, W.groundAt(h.x + Math.sin(a) * foot, h.y + Math.cos(a) * foot)); }
      h.h = top + 0.3;
      if (obj) obj.h = h.h;
      put(W, 'stilts', h.x, h.y, { h: h.h, rot: h.rot, s, guards: h.id ?? null });
      continue;
    }
    const w = waterNear(W, h.x, h.y, 2.6 * s);
    if (w) {
      
      const r = 1.1 * s; let lo = Infinity;
      for (let k = -3; k <= 3; k++) { const a = w.a + k * 0.27; lo = Math.min(lo, W.groundAt(h.x + Math.sin(a) * r, h.y + Math.cos(a) * r)); }
      put(W, 'sandbags', h.x, h.y, { h: lo - 0.03, rot: w.a, s, guards: h.id ?? null });
    }
  }
  return huts;
}


export function dressHuts(W, huts, opts) {
  const { rng, kinds, food = ['#f0b030', '#e03a3a', '#a8d050'], clear = () => true, perHut = [2, 4], weeds = true } = opts;
  const placed = [];
  huts.forEach((h, i) => {
    const s = h.s || 1, n = perHut[0] + Math.floor(rng() * (perHut[1] - perHut[0] + 1));
    
    const slots = [0.95, -0.95, 1.5, -1.5, 2.1, -2.1, 2.7, -2.7].map((da) => da + (rng() - 0.5) * 0.2);
    let got = 0;
    for (let k = 0; k < kinds.length * 2 && got < n; k++) {
      const kind = kinds[(i * 3 + k) % kinds.length], [r] = LIFE[kind];
      for (const da of slots) {
        
        const a = h.rot + da, d = (h.h != null ? 1.05 : 0.9) * s + r + 0.12, x = h.x + Math.sin(a) * d, y = h.y + Math.cos(a) * d;
        if (!flatAt(W, x, y, r) || !freeAt(W, x, y, r) || !clear(x, y, r)) continue;
        const extra = { rot: a + Math.PI + (rng() - 0.5) * 0.6 };
        if (kind === 'bowl' || kind === 'basket') extra.c = food[Math.floor(rng() * food.length)];
        placed.push(put(W, kind, x, y, extra)); got++;
        break;
      }
    }
    if (!weeds) return;
    for (const da of [2.5, Math.PI, -2.5, 1.9, -1.9]) {
      const a = h.rot + da + (rng() - 0.5) * 0.3, d = (h.h != null ? 1.05 : 0.9) * s + 0.12, x = h.x + Math.sin(a) * d, y = h.y + Math.cos(a) * d;
      if (!flatAt(W, x, y, 0.12) || !freeAt(W, x, y, 0.1) || !clear(x, y, 0.1)) continue;
      if (rng() < 0.6) addObj(W, { kind: 'flower', x, y, solid: 0, rot: rng() * 6.28, s: 0.8, c: WEED_C[Math.floor(rng() * WEED_C.length)] });
      else addObj(W, { kind: 'fern', x, y, solid: 0, rot: rng() * 6.28, s: 0.45 });
    }
  });
  return placed;
}


export function placeYard(W, kind, p, { rot = 0, clear = () => true, extra = {} } = {}) {
  const [r] = LIFE[kind];
  for (let d = 0; d <= 2.5; d += 0.25) for (let k = 0; k < (d ? 12 : 1); k++) {
    const a = k / 12 * Math.PI * 2, x = p.x + Math.sin(a) * d, y = p.y + Math.cos(a) * d;
    if (flatAt(W, x, y, r) && freeAt(W, x, y, r) && clear(x, y, r)) return put(W, kind, x, y, { rot, ...extra });
  }
  return null;
}


export function fruitGrove(W, p, kind, { rng, clear = () => true, falls = 2 } = {}) {
  const tree = placeYard(W, kind, p, { rot: rng() * 6.28, clear, extra: { s: 0.95 + rng() * 0.2 } });
  if (!tree) return null;
  const out = [tree];
  for (let k = 0, t = 0; k < falls && t < 12; t++) {
    const a = rng() * 6.28, d = 0.55 + rng() * 0.45, x = tree.x + Math.sin(a) * d, y = tree.y + Math.cos(a) * d;
    if (!flatAt(W, x, y, LIFE.fruitfall[0]) || !freeAt(W, x, y, 0.2) || !clear(x, y, 0.2)) continue;
    out.push(put(W, 'fruitfall', x, y, { rot: a, c: FRUIT_OF[kind], under: tree.id })); k++;
  }
  return out;
}
