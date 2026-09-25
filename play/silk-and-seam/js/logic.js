
import { TAGS, PARTS, SLOTS, FABRICS, TRIMS, DYES, LEVEL_XP, MAX_LEVEL, CLIENTS } from './data.js';

export const byId = (list, id) => list.find((x) => x.id === id);
export const part = (slot, id) => byId(PARTS[slot], id);
export const fabric = (id) => byId(FABRICS, id);
export const trim = (id) => byId(TRIMS, id);
export const dye = (id) => byId(DYES, id);

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

export function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}


export function hueClash(hexA, hexB) {
  const a = hexToHsl(hexA), b = hexToHsl(hexB);
  if (a.s < 0.25 || b.s < 0.25 || a.l > 0.88 || b.l > 0.88 || a.l < 0.15 || b.l < 0.15) return 0;
  const d = Math.abs(a.h - b.h);
  const dist = Math.min(d, 360 - d);
  return dist > 100 ? 1 : 0;
}

export function usesSecondary(design) {
  return SLOTS.some((slot) => (part(slot, design[slot])?.m.s || 0) > 0);
}

export function trimCount(design) {
  return Object.values(design.trims || {}).filter(Boolean).length;
}

export function computeTags(design) {
  const t = Object.fromEntries(TAGS.map((k) => [k, 0]));
  const add = (tags, w = 1) => { for (const k in tags) t[k] += tags[k] * w; };
  for (const slot of SLOTS) { const p = part(slot, design[slot]); if (p) add(p.tags); }
  const f1 = fabric(design.fab1), f2 = fabric(design.fab2);
  if (f1) add(f1.tags, 1);
  if (f2 && usesSecondary(design)) add(f2.tags, design.fab2 === design.fab1 ? 0 : 0.5);
  const d1 = dye(design.dye1), d2 = dye(design.dye2), d3 = dye(design.dye3);
  if (d1) add(d1.tags, 1);
  if (d2) add(d2.tags, design.dye2 === design.dye1 ? 0 : 0.5);
  if (d3) add(d3.tags, 0.25);
  for (const id of Object.values(design.trims || {})) { const tr = trim(id); if (tr) add(tr.tags); }
  const n = trimCount(design);
  t.Elaborate += Math.max(0, n - 2) * 0.8;
  t.Simple += n === 0 ? 2 : n === 1 ? 0.5 : -(n - 1) * 0.6;
  t.Unwearable += Math.max(0, n - 4) * 1.5;
  if (d1 && d2) t.Eclectic += hueClash(d1.hex, d2.hex) * 2.5;
  if (d1 && d3) t.Eclectic += hueClash(d1.hex, d3.hex) * 1;
  for (const k of TAGS) t[k] = Math.round(Math.min(10, Math.max(0, t[k])) * 10) / 10;
  return t;
}


export function fabricNeeds(design) {
  let p = 0, s = 0;
  for (const slot of SLOTS) { const pt = part(slot, design[slot]); if (pt) { p += pt.m.p; s += pt.m.s; } }
  const out = {};
  const put = (id, m) => { if (m > 0 && id) out[id] = (out[id] || 0) + m; };
  put(design.fab1, p);
  put(design.fab2, s);
  for (const k in out) out[k] = Math.round(out[k] * 1.05 * 20) / 20;
  return out;
}

export function totalMetres(design) {
  return Object.values(fabricNeeds(design)).reduce((a, b) => a + b, 0);
}

export function materialCost(design) {
  let c = 0;
  const needs = fabricNeeds(design);
  for (const id in needs) c += needs[id] * fabric(id).price;
  for (const id of Object.values(design.trims || {})) if (id) c += trim(id).price;
  return Math.round(c * 100) / 100;
}


export function shortages(inv, design) {
  const out = [];
  const needs = fabricNeeds(design);
  for (const id in needs) {
    const have = inv.fabrics[id] || 0;
    if (have + 1e-9 < needs[id]) out.push({ kind: 'fabric', id, need: needs[id], have });
  }
  const trimUse = {};
  for (const id of Object.values(design.trims || {})) if (id) trimUse[id] = (trimUse[id] || 0) + 1;
  for (const id in trimUse) {
    const have = inv.trims[id] || 0;
    if (have < trimUse[id]) out.push({ kind: 'trim', id, need: trimUse[id], have });
  }
  return out;
}

export function consume(inv, design) {
  const needs = fabricNeeds(design);
  for (const id in needs) inv.fabrics[id] = Math.round(((inv.fabrics[id] || 0) - needs[id]) * 100) / 100;
  for (const id of Object.values(design.trims || {})) if (id) inv.trims[id] = (inv.trims[id] || 0) - 1;
}

export function matchScore(tags, order) {
  const parts = [];
  for (const w of order.wants) parts.push(Math.min(1, tags[w.tag] / w.min));
  for (const a of order.avoid) parts.push(tags[a.tag] <= a.max ? 1 : Math.max(0, 1 - (tags[a.tag] - a.max) / 4));
  if (!parts.length) return 1;
  return parts.reduce((x, y) => x + y, 0) / parts.length;
}

export function stars(match) {
  return match >= 0.95 ? 5 : match >= 0.8 ? 4 : match >= 0.6 ? 3 : match >= 0.4 ? 2 : 1;
}

export function payout(order, match, quality, matCost) {
  const mm = 0.35 + 0.65 * match;
  const qm = 0.7 + 0.4 * quality;
  const fee = Math.round(order.fee * mm * qm);
  const materials = Math.round(Math.min(matCost * 1.25, order.budget) * mm);
  const tip = match >= 0.95 && quality >= 0.9 ? Math.round(order.fee * 0.2) : 0;
  const xp = Math.round(15 + order.fee * 0.6 * match * (0.5 + 0.5 * quality));
  return { fee, materials, tip, total: fee + materials + tip, xp };
}

export function levelFor(xp) {
  let lvl = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) lvl = i + 1;
  return lvl;
}

export function levelProgress(xp) {
  const lvl = levelFor(xp);
  if (lvl >= MAX_LEVEL) return { lvl, frac: 1, into: 0, span: 0 };
  const lo = LEVEL_XP[lvl - 1], hi = LEVEL_XP[lvl];
  return { lvl, frac: (xp - lo) / (hi - lo), into: xp - lo, span: hi - lo };
}

export function unlockedAt(lvl) {
  const out = [];
  for (const slot of SLOTS) for (const p of PARTS[slot]) if (p.lvl === lvl) out.push(p.name);
  for (const list of [FABRICS, TRIMS, DYES]) for (const x of list) if (x.lvl === lvl) out.push(x.name);
  return out;
}

const avail = (list, lvl) => list.filter((x) => x.lvl <= lvl);

export function randomDesign(lvl, rng) {
  const d = {};
  for (const slot of SLOTS) d[slot] = pick(avail(PARTS[slot], lvl), rng).id;
  const fabs = avail(FABRICS, lvl), dyes = avail(DYES, lvl);
  d.fab1 = pick(fabs, rng).id;
  d.fab2 = rng() < 0.4 ? d.fab1 : pick(fabs, rng).id;
  d.dye1 = pick(dyes, rng).id;
  d.dye2 = rng() < 0.4 ? d.dye1 : pick(dyes, rng).id;
  d.dye3 = pick(dyes, rng).id;
  d.trims = {};
  const trims = avail(TRIMS, lvl);
  const n = Math.floor(rng() * 5);
  for (let i = 0; i < n; i++) {
    const tr = pick(trims, rng);
    const z = pick(tr.zones, rng);
    if (z === 'sleeves' && d.sleeve === 'none') continue;
    d.trims[z] = tr.id;
  }
  return d;
}

export function defaultDesign() {
  return { bodice: 'square', collar: 'none', sleeve: 'puff', skirt: 'flounce', fab1: 'cotton', fab2: 'cotton', dye1: 'sage', dye2: 'ivory', dye3: 'navy', trims: {} };
}


export function generateOrder(lvl, rng, excludeNames = []) {
  const pool = CLIENTS.filter((c) => (c.minLvl || 1) <= lvl && !excludeNames.includes(c.name));
  const client = pick(pool.length ? pool : CLIENTS.filter((c) => (c.minLvl || 1) <= lvl), rng);
  const samples = [];
  for (let i = 0; i < 500; i++) samples.push(computeTags(randomDesign(lvl, rng)));
  const best = (tag) => Math.max(...samples.map((s) => s[tag]));
  const target = Math.min(8, 4.5 + lvl * 0.4);
  let wants = client.wants
    .filter((tag) => best(tag) >= 1.5)
    .map((tag) => ({ tag, min: Math.max(1, Math.round(Math.min(target, best(tag) * 0.85) * 2) / 2) }));
  if (!wants.length) wants = [{ tag: 'Daywear', min: 2 }];
  const avoid = client.avoid.map((tag) => ({ tag, max: Math.max(1.5, 3.5 - lvl * 0.2) }));
  const order = { client: client.name, occasion: client.occasion, look: client.look, wants, avoid };
  for (let tries = 0; tries < 8; tries++) {
    const top = Math.max(...samples.map((s) => matchScore(s, order)));
    if (top >= 0.97) break;
    for (const w of order.wants) w.min = Math.max(1, Math.round(w.min * 0.85 * 2) / 2);
  }
  order.fee = Math.round(25 + 18 * lvl + rng() * 12);
  order.budget = Math.round(30 + 28 * lvl * (0.8 + 0.4 * rng()));
  order.id = Math.floor(rng() * 1e9).toString(36);
  return order;
}
