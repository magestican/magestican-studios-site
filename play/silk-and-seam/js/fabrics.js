




import { FABRICS, DYES, PARTS } from './data.js';










const PHYS = {
  cotton: [130, 1, 0.6, 0.12, 1.5, 1, 0],
  linen: [170, 1, 0.65, 0.2, 1.5, 1, 0.35],
  gingham: [130, 1, 0.6, 0.12, 1.5, 1, 0],
  jacquard: [200, 1, 0.65, 0.2, 1.5, 1, 0],
  satin: [120, 1, 0.55, 0.06, 1.3, 1, 0],
  tulle: [30, 0.9, 0.55, 0.2, 1.5, 0.985, 0],
  velvet: [330, 0.85, 0.55, 0.05, 1.8, 1, 0],
  silk: [60, 1, 0.55, 0.04, 1.3, 0.99, 0],
  sequin: [250, 0.9, 0.6, 0.15, 1.5, 1, 0],
  brocade: [260, 1, 0.8, 0.35, 1.5, 1, 0],
  chiffon: [45, 1, 0.55, 0.02, 1.4, 0.985, 0],
  organza: [40, 1, 0.7, 0.3, 1.5, 0.985, 0],
  tartan: [250, 1, 0.65, 0.22, 1.6, 1, 0],
  damask: [200, 1, 0.6, 0.18, 1.4, 1, 0],
  lame: [150, 0.85, 0.55, 0.1, 1.4, 1, 0],
  couture: [180, 1, 0.6, 0.2, 1.5, 1, 0],
  ankara: [140, 1, 0.65, 0.2, 1.5, 1, 0],
  banarasi: [260, 1, 0.7, 0.28, 1.5, 1, 0],
  thaisilk: [90, 1, 0.55, 0.14, 1.4, 1, 0],
  batik: [140, 1, 0.6, 0.12, 1.5, 1, 0],
  songket: [260, 1, 0.8, 0.4, 1.5, 1, 0],
  cloudsilk: [90, 1, 0.55, 0.08, 1.4, 1, 0],
};
export const COTTON_GSM = 130;






export function physicsOf(id) {
  const [gsm, stretch, shear, bend, fric, drag, plastic] = PHYS[id] || PHYS.cotton;
  return { gsm, stretch, shear, bend, fric, mass: Math.sqrt(gsm / COTTON_GSM), air: COTTON_GSM / gsm, drag, plastic };
}





const SECONDARY = { flounce: ['flounce.'], odette: ['skirt.over'], saree: ['skirt.pallu'], bustle: ['skirt.drape'], lehenga: ['skirt.dupatta'], aodai: ['skirt.front', 'skirt.back'] };
export function slotOf(design, panel) {
  const part = panel.split('.')[0];
  if (part === 'collar' || part === 'sleeve') return 2;
  const sec = SECONDARY[design.skirt];
  if (sec && (part === 'skirt' || part === 'flounce') && sec.some((p) => panel.startsWith(p))) return 2;
  return 1;
}
export const usesFabric2 = (design) => ['collar', 'sleeve'].some((s) => design[s] && design[s] !== 'none' && PARTS[s].some((p) => p.id === design[s] && p.m.s > 0)) || !!SECONDARY[design.skirt];









const LOOK = {
  cotton: { tile: [2, 2], rough: 0.86, sheen: 0.15, sheenRough: 0.8, bump: 0.5 },
  linen: { tile: [4, 4], rough: 0.82, sheen: 0.1, sheenRough: 0.9, bump: 0.9 },
  gingham: { tile: [2, 2], rough: 0.8, sheen: 0.12, sheenRough: 0.8, bump: 0.5 },
  jacquard: { tile: [8, 8], rough: 0.7, sheen: 0.3, sheenRough: 0.5, aniso: 0.3, bump: 0.8 },
  satin: { tile: [2, 2], rough: 0.3, sheen: 0.4, sheenRough: 0.3, aniso: 0.75, bump: 0.2 },
  tulle: { tile: [1, 1], rough: 0.7, sheen: 0.2, sheenRough: 0.6, trans: 0.9, opacity: 0.55, bump: 0.3 },
  velvet: { tile: [16, 16], rough: 0.95, sheen: 1, sheenRough: 0.35, velvet: 0.5, bump: 0.3 },
  silk: { tile: [4, 4], rough: 0.32, sheen: 0.6, sheenRough: 0.3, aniso: 0.4, bump: 0.15 },
  sequin: { tile: [2, 2], rough: 0.6, metal: 1, sheen: 0.2, sheenRough: 0.5, bump: 1.2 },
  brocade: { tile: [10, 10], rough: 0.55, metal: 1, sheen: 0.3, sheenRough: 0.5, bump: 1.4 },
  chiffon: { tile: [1, 1], rough: 0.75, sheen: 0.3, sheenRough: 0.5, trans: 0.8, opacity: 0.7, bump: 0.4 },
  organza: { tile: [1, 1], rough: 0.4, sheen: 0.3, sheenRough: 0.4, irid: 0.6, trans: 0.85, opacity: 0.6, bump: 0.2 },
  tartan: { tile: [12, 12], rough: 0.88, sheen: 0.1, sheenRough: 0.9, bump: 0.8 },
  damask: { tile: [10, 10], rough: 0.45, sheen: 0.4, sheenRough: 0.4, aniso: 0.7, anisoMap: true, bump: 0.3 },
  lame: { tile: [2, 2], rough: 0.32, metal: 0.9, sheen: 0.1, sheenRough: 0.5, bump: 0.8 },
  couture: { tile: [6, 6], rough: 0.78, sheen: 0.2, sheenRough: 0.6, alphaTest: 0.5, bump: 1.2 },
  ankara: { tile: [12, 12], rough: 0.62, sheen: 0.1, sheenRough: 0.6, printBack: 0.7, bump: 0.3 },
  banarasi: { tile: [8, 8], rough: 0.36, metal: 1, sheen: 0.5, sheenRough: 0.35, aniso: 0.4, bump: 0.9 },
  thaisilk: { tile: [3, 3], rough: 0.36, sheen: 0.5, sheenRough: 0.35, shot: 140, bump: 0.3 },
  batik: { tile: [10, 10], rough: 0.85, sheen: 0.1, sheenRough: 0.8, printBack: 0.4, bump: 0.3 },
  songket: { tile: [6, 6], rough: 0.5, metal: 1, sheen: 0.3, sheenRough: 0.45, bump: 1 },
  cloudsilk: { tile: [16, 16], rough: 0.42, sheen: 0.5, sheenRough: 0.4, aniso: 0.3, bump: 0.3 },
};
export const FABRIC_IDS = Object.keys(PHYS);

export const hexRGB = (h) => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const dyeHex = (d) => (typeof d === 'string' && d.startsWith('#') ? d : (DYES.find((x) => x.id === d) || DYES[0]).hex);
export function hueShift(rgb, deg) {
  const [r, g, b] = rgb, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, dd = mx - mn;
  let h = 0, s = 0;
  if (dd) { s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = (mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4) / 6; }
  h = (h + deg / 360) % 1;
  if (!s) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}




export function fabricSpec(fab, dye = 'ivory') {
  const f = FABRICS.find((x) => x.id === fab) || FABRICS[0], L = LOOK[f.id] || LOOK.cotton, hex = dyeHex(dye);
  const maps = ['albedo', 'normal', 'roughness'];
  if (L.metal) maps.push('metalness');
  if (L.opacity || L.alphaTest) maps.push('alpha');
  if (L.anisoMap) maps.push('anisotropy');
  const tint = hexRGB(hex);
  return {
    id: f.id, tex: f.tex, gsm: physicsOf(f.id).gsm, physics: physicsOf(f.id), tile: L.tile, maps, tint, hex,
    material: {
      roughness: L.rough, metalness: L.metal || 0, sheen: L.sheen || 0, sheenRoughness: L.sheenRough ?? 0.5,
      sheenColor: tint.map((v) => 0.55 * v + 0.45), anisotropy: L.aniso || 0, iridescence: L.irid || 0,
      transmission: L.trans || 0, opacity: L.opacity ?? 1, alphaTest: L.alphaTest || 0, bump: L.bump ?? 0.5,
      shot: L.shot ? hueShift(tint, L.shot) : null, velvet: L.velvet || 0,
    },
    back: { pale: 0.28, print: L.printBack || 0 },
  };
}



function h2(x, y, s) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const md = (a, p) => ((a % p) + p) % p;

function vnoise(x, y, px, py, s) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const x0 = md(xi, px), x1 = md(xi + 1, px), y0 = md(yi, py), y1 = md(yi + 1, py);
  const a = h2(x0, y0, s), b = h2(x1, y0, s), c = h2(x0, y1, s), d = h2(x1, y1, s);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(u, v, tx, ty, c, s, oct = 3) {
  let t = 0, amp = 0.5, n = 0;
  for (let o = 0; o < oct; o++) { const k = 2 ** o; t += amp * vnoise((u / c) * k, (v / c) * k, (tx / c) * k, (ty / c) * k, s + o); n += amp; amp *= 0.5; }
  return t / n;
}
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const WHITE = [0.97, 0.96, 0.93], GOLD = [0.86, 0.69, 0.34], CREAM = [0.93, 0.88, 0.76], INK = [0.12, 0.1, 0.12];

function weave(u, v, p) {
  const i = Math.floor(u / p), j = Math.floor(v / p), fu = u / p - i, fv = v / p - j;
  const warpUp = ((i + j) & 1) === 0;
  const across = Math.sin(Math.PI * (warpUp ? fu : fv));
  return warpUp ? 0.55 + 0.45 * across * Math.sin(Math.PI * fv) ** 0.3 : 0.45 + 0.45 * across * Math.sin(Math.PI * fu) ** 0.3;
}

function cell(u, v, cw, ch, drop = true) {
  const i = Math.floor(u / cw), vv = v - (drop && i & 1 ? ch / 2 : 0), j = Math.floor(vv / ch);
  return { x: u - (i + 0.5) * cw, y: vv - (j + 0.5) * ch, i, j };
}

function rosette(x, y, R, petals, aa, inner = 0.72) {
  const r = Math.hypot(x, y), a = Math.atan2(y, x);
  return sstep(aa, -aa, r - R * (inner + (1 - inner) * Math.abs(Math.cos((petals / 2) * a))));
}
function ring(x, y, R, w, aa) { return sstep(aa, -aa, Math.abs(Math.hypot(x, y) - R) - w); }



const PX = {
  cotton(u, v, o, T) { const w = weave(u, v, 0.025), n = fbm(u, v, 2, 2, 0.25, 3); o.h = w; o.c = mul3(T.dye, 0.9 + 0.08 * w + 0.06 * (n - 0.5)); },
  linen(u, v, o, T) {
    
    const p = 0.04, sw = vnoise(u / p, v / 0.6, 100, 4 / 0.6, 11), sf = vnoise(u / 0.6, v / p, 4 / 0.6, 100, 12);
    const w = weave(u, v, p), slub = Math.max(sw, sf);
    o.h = w * (0.7 + 0.5 * slub); o.c = mul3(T.dye, 0.84 + 0.1 * w + 0.14 * sstep(0.62, 0.9, slub)); o.r = 0.82 + 0.06 * slub;
  },
  gingham(u, v, o, T) {
    const a = Math.floor(u) & 1, b = Math.floor(v) & 1, w = weave(u, v, 0.025);
    o.c = mul3(mix3(WHITE, T.dye, (a + b) / 2), 0.92 + 0.08 * w); o.h = w;
  },
  jacquard(u, v, o, T) {
    const q = cell(u, v, 4, 4), m = Math.max(rosette(q.x, q.y, 1.5, 6, T.aa), 0.9 * ring(q.x, q.y, 0.35, 0.12, T.aa)), w = weave(u, v, 0.05);
    const leaf = rosette(q.x - 1.5, q.y + 1.2, 0.5, 2, T.aa, 0.2);
    const mm = Math.max(m, leaf);
    o.c = mul3(T.dye, 0.9 + 0.16 * mm + 0.03 * w); o.h = 0.3 * w + 0.7 * mm; o.r = 0.8 - 0.35 * mm; o.an = mm > 0.5 ? 1 : 0;
  },
  satin(u, v, o, T) {
    
    const p = 0.02, i = Math.floor(u / p), j = Math.floor(v / p);
    const tie = md(j - 2 * i, 5) === 0;
    o.h = tie ? 0.2 : 0.6 + 0.4 * Math.sin(Math.PI * (u / p - i));
    o.c = mul3(T.dye, 0.95 + 0.05 * o.h); o.r = 0.3 + (tie ? 0.2 : 0);
  },
  tulle(u, v, o, T) {
    
    const s = 1 / 7, d = (x) => Math.abs(md(x / s, 1) - 0.5);
    const l = Math.max(sstep(0.36, 0.5, d(u)), sstep(0.36, 0.5, d(u * 0.5 + v * 0.866)), sstep(0.36, 0.5, d(u * 0.5 - v * 0.866)));
    o.c = T.dye; o.h = l; o.a = 0.25 + 0.75 * l;
  },
  velvet(u, v, o, T) {
    
    const n = fbm(u, v, 16, 16, 4, 21, 4), crush = sstep(0.3, 0.8, n);
    o.c = mul3(T.dye, 0.84 + 0.16 * crush); o.h = 0.5 + 0.3 * (n - 0.5); o.r = 0.9 + 0.08 * (1 - crush);
  },
  silk(u, v, o, T) { const n = vnoise(u / 0.05, v / 1, 80, 4, 31); o.c = mul3(T.dye, 0.95 + 0.06 * n); o.h = 0.5 + 0.2 * n; o.r = 0.3 + 0.05 * n; },
  sequin(u, v, o, T) {
    
    const q = cell(v, u, 0.5, 0.5), r = Math.hypot(q.x, q.y), disc = sstep(0.22, 0.2, r);
    const tilt = h2(q.i, q.j, 41) - 0.5;
    o.c = disc ? mix3(mul3(T.dye, 0.35), mix3(T.dye, WHITE, 0.25), disc) : mul3(T.dye, 0.35);
    o.h = disc * (0.7 + 0.3 * Math.cos(r * 6) + tilt * q.x * 3); o.m = disc; o.r = disc ? 0.15 + 0.1 * Math.abs(tilt) : 0.7;
  },
  brocade(u, v, o, T) {
    
    const q = cell(u, v, 5, 5), m = Math.max(rosette(q.x, q.y, 1.3, 8, T.aa, 0.45), ring(q.x, q.y, 1.75, 0.07, T.aa)), w = weave(u, v, 0.05);
    o.c = mix3(mul3(T.dye, 0.9 + 0.05 * w), mix3(GOLD, T.dye, 0.3), m); o.m = m; o.h = 0.25 * w + m * (0.75 + 0.25 * Math.sin(u * 40)); o.r = m ? 0.32 : 0.55;
  },
  chiffon(u, v, o, T) { const n = fbm(u, v, 1, 1, 0.125, 51, 3); o.c = mul3(T.dye, 0.94 + 0.08 * n); o.h = n; o.a = 0.62 + 0.2 * n; },
  organza(u, v, o, T) { const w = weave(u, v, 1 / 30); o.c = mul3(T.dye, 0.96 + 0.05 * w); o.h = w; o.a = 0.5 + 0.2 * w; },
  tartan(u, v, o, T) {
    
    const C = [mul3(T.dye, 0.32), T.dye, T.alt, T.dye, mix3(T.dye, WHITE, 0.7), T.dye];
    const W = [1.4, 1.8, 0.6, 1.4, 0.2, 0.6];
    const at = (x) => { x = md(x, 12); if (x > 6) x = 12 - x; let s = 0; for (let k = 0; k < W.length; k++) { s += W[k]; if (x < s) return C[k]; } return C[C.length - 1]; };
    
    const p = 0.04, ph = md(Math.floor(u / p) + Math.floor(v / p), 4) < 2;
    const warp = at(u), weft = at(v), tw = md((u + v) / p, 4) / 4;
    o.c = mul3(ph ? warp : weft, 0.9 + 0.1 * Math.sin(Math.PI * tw)); o.h = 0.4 + 0.4 * Math.sin(2 * Math.PI * tw);
  },
  damask(u, v, o, T) {
    const q = cell(u, v, 5, 5), m = Math.max(rosette(q.x, q.y, 1.9, 10, T.aa, 0.5), rosette(q.x, q.y, 0.7, 5, T.aa, 0.3));
    o.c = mul3(T.dye, 0.94 + 0.08 * m); o.h = 0.5; o.r = 0.5 - 0.15 * m; o.an = m > 0.5 ? 1 : 0;
  },
  lame(u, v, o, T) {
    
    const p = 0.1, i = Math.floor(u / p), fu = u / p - i, fv = md(v / (p * 1.4), 1);
    const loop = 1 - Math.abs(fv - Math.abs(fu - 0.5) * 1.2 - 0.2) * 3;
    o.c = mix3(T.dye, WHITE, 0.15); o.h = clamp01(loop); o.m = 1; o.r = 0.28 + 0.12 * (1 - clamp01(loop));
  },
  couture(u, v, o, T) {
    
    const q = cell(u, v, 3, 3), fl = rosette(q.x, q.y, 1.05, 5, T.aa, 0.35), eye = ring(q.x, q.y, 0.3, 0.07, T.aa);
    const bars = Math.max(sstep(0.09, 0.05, Math.abs(q.x)), sstep(0.09, 0.05, Math.abs(q.y))) * (Math.abs(q.x) + Math.abs(q.y) > 1 ? 1 : 0);
    const solid = clamp01(Math.max(fl - eye, bars));
    o.c = mul3(T.dye, 0.88 + 0.12 * solid); o.a = solid; o.h = solid * (0.6 + 0.4 * Math.cos(Math.hypot(q.x, q.y) * 9));
  },
  ankara(u, v, o, T) {
    const q = cell(u, v, 4, 4, false), r = Math.hypot(q.x, q.y);
    const rings = sstep(0.1, -0.1, Math.sin(r * 5.5)) * (r < 1.8 ? 1 : 0), dia = sstep(T.aa, -T.aa, Math.abs(q.x) + Math.abs(q.y) - 2.6) ? 0 : 1;
    const crack = sstep(0.49, 0.5, fbm(u, v, 12, 12, 1, 61, 3)) * 0.15;
    o.c = r < 1.8 ? mix3(T.dye, T.alt, rings) : dia ? INK : mix3(CREAM, T.dye, 0.15);
    o.c = mul3(o.c, 1 - crack); o.h = 0.5;
  },
  banarasi(u, v, o, T) {
    
    const q = cell(u, v, 2, 2), bx = q.x, by = q.y + 0.1;
    const drop = sstep(T.aa, -T.aa, Math.hypot(bx, by * 0.8) - 0.42 + 0.25 * Math.max(0, -by));
    const tip = sstep(T.aa, -T.aa, Math.hypot(bx + 0.18, by + 0.55) - 0.12);
    const m = Math.max(drop, tip), n = vnoise(u / 0.05, v, 160, 8, 71);
    o.c = mix3(mul3(T.dye, 0.94 + 0.06 * n), mix3(GOLD, T.dye, 0.12), m); o.m = m; o.h = 0.4 + 0.6 * m; o.r = m ? 0.3 : 0.36;
  },
  thaisilk(u, v, o, T) {
    const n = vnoise(u / 0.04, v / 0.5, 75, 6, 81), w = weave(u, v, 0.04);
    o.c = mul3(mix3(T.dye, T.alt, 0.12 * w), 0.93 + 0.1 * n); o.h = 0.5 * w + 0.5 * n; o.r = 0.34 + 0.06 * n;
  },
  batik(u, v, o, T) {
    
    const d = md(u + v, 5) - 2.5, s = Math.sin(((u - v) / 5) * Math.PI * 4) * 0.8;
    const band = sstep(0.2, -0.2, Math.abs(d - s) - 0.9), edge = sstep(0.12, 0, Math.abs(Math.abs(d - s) - 0.9));
    const n = fbm(u, v, 10, 10, 0.5, 91, 3), crack = sstep(0.025, 0, Math.abs(n - 0.5));
    o.c = mix3(mix3(CREAM, T.dye, 0.18), T.dye, Math.max(band, edge)); o.c = mix3(o.c, mul3(T.dye, 0.45), Math.max(edge * 0.6, crack * 0.7)); o.h = 0.5;
  },
  songket(u, v, o, T) {
    
    const row = md(v, 3), inRow = row < 1.5, q = cell(u, row - 0.75 + 0.75, 1.5, 1.5, false);
    const loz = inRow ? sstep(T.aa, -T.aa, Math.abs(q.x) + Math.abs(q.y) - 0.6) : 0;
    const lines = inRow ? sstep(0.06, 0.03, Math.min(row, 1.5 - row)) : 0;
    const m = Math.max(loz, lines), w = weave(u, v, 0.05);
    o.c = mix3(mul3(T.dye, 0.9 + 0.06 * w), GOLD, m); o.m = m; o.h = 0.3 * w + 0.7 * m; o.r = m ? 0.28 : 0.5;
  },
  cloudsilk(u, v, o, T) {
    const q = cell(u, v, 8, 8), cl = (x, y) => Math.max(ring(x, y, 1.1, 0.05, T.aa), ring(x - 1.2, y + 0.4, 0.8, 0.05, T.aa), ring(x + 1.2, y + 0.4, 0.8, 0.05, T.aa));
    const fill = Math.max(sstep(T.aa, -T.aa, Math.hypot(q.x, q.y) - 1.1), sstep(T.aa, -T.aa, Math.hypot(q.x - 1.2, q.y - 0.4) - 0.8), sstep(T.aa, -T.aa, Math.hypot(q.x + 1.2, q.y - 0.4) - 0.8));
    const m = Math.max(0.6 * fill, cl(q.x, q.y));
    o.c = mul3(T.dye, 0.95 + 0.1 * m); o.h = 0.5 + 0.2 * m; o.r = 0.45 - 0.12 * m; o.an = m > 0.3 ? 1 : 0;
  },
};




export function fabricMaps(fab, dye = 'ivory', size = 256) {
  const spec = fabricSpec(fab, dye), L = LOOK[spec.id] || LOOK.cotton, px = PX[spec.id] || PX.cotton;
  const [tx, ty] = L.tile, N = size * size;
  const T = { dye: spec.tint, alt: spec.material.shot || hueShift(spec.tint, 180), aa: (1.5 * tx) / size };
  if (spec.id === 'ankara') T.alt = mul3(hueShift(spec.tint, 170), 0.8);
  if (spec.id === 'tartan') T.alt = mul3(hueShift(spec.tint, 150), 0.75);
  const albedo = new Uint8Array(N * 4), normal = new Uint8Array(N * 4), orm = new Uint8Array(N * 4), H = new Float32Array(N);
  const aniso = L.anisoMap ? new Uint8Array(N * 4) : null;
  const o = { c: null, h: 0.5, r: 0, m: 0, a: 1, an: 0 };
  const b8 = (x) => Math.round(clamp01(x) * 255);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = ((x + 0.5) / size) * tx, v = ((y + 0.5) / size) * ty, k = y * size + x;
    o.c = spec.tint; o.h = 0.5; o.r = L.rough; o.m = 0; o.a = 1; o.an = 0;
    px(u, v, o, T);
    albedo[k * 4] = b8(o.c[0]); albedo[k * 4 + 1] = b8(o.c[1]); albedo[k * 4 + 2] = b8(o.c[2]); albedo[k * 4 + 3] = b8(o.a);
    orm[k * 4] = 255; orm[k * 4 + 1] = b8(o.r); orm[k * 4 + 2] = b8(o.m); orm[k * 4 + 3] = 255;
    if (aniso) { const dx = o.an ? 0 : 1, dy = o.an ? 1 : 0; aniso[k * 4] = b8(dx * 0.5 + 0.5); aniso[k * 4 + 1] = b8(dy * 0.5 + 0.5); aniso[k * 4 + 2] = 255; aniso[k * 4 + 3] = 255; }
    H[k] = o.h;
  }
  
  const s = (L.bump ?? 0.5) * (size / 256) * 1.5;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const k = y * size + x, xl = y * size + md(x - 1, size), xr = y * size + md(x + 1, size), yu = md(y - 1, size) * size + x, yd = md(y + 1, size) * size + x;
    let nx = (H[xl] - H[xr]) * s, ny = (H[yu] - H[yd]) * s, nz = 1;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    normal[k * 4] = b8(nx * 0.5 + 0.5); normal[k * 4 + 1] = b8(ny * 0.5 + 0.5); normal[k * 4 + 2] = b8(nz * 0.5 + 0.5); normal[k * 4 + 3] = 255;
  }
  return { id: spec.id, size, tile: [tx, ty], albedo, normal, orm, aniso, hash: hashBytes(albedo) + hashBytes(normal).slice(0, 4) };
}
export const mapBuffers = (m) => [m.albedo.buffer, m.normal.buffer, m.orm.buffer, ...(m.aniso ? [m.aniso.buffer] : [])];
export function hashBytes(a) {
  let h = 2166136261;
  for (let i = 0; i < a.length; i++) { h ^= a[i]; h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function meanRGB(albedo) {
  const s = [0, 0, 0], n = albedo.length / 4;
  for (let i = 0; i < n; i++) { s[0] += albedo[i * 4]; s[1] += albedo[i * 4 + 1]; s[2] += albedo[i * 4 + 2]; }
  return s.map((x) => x / n / 255);
}

export const MAP_SIZE = { high: 1024, mid: 512, low: 256 };
