
import {
  TAGS, PARTS, SLOTS, FABRICS, TRIMS, DYES, LEVEL_XP, MAX_LEVEL, CLIENTS, SEASONS, SEASON_LENGTH, SEASON_BONUS,
  REP_GAIN, REP_TIERS, PREMIUM_FEE, NATURAL_DYES, DYE_PRICE, RARE_DYE_PRICE, RARE_DYE_LVL, WINDOW_WAIT, SALE_EVERY,
  UPGRADES, ACCESSORIES, ACHIEVEMENTS, BODY_SHAPES, CHARITY_REP,
} from './data.js';

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
  const perfect = match >= 0.95 && quality >= 0.9 ? Math.round(order.fee * 0.2) : 0;
  
  
  const loyal = order.repeat?.mood === 'happy' && match >= 0.6 ? Math.round(order.fee * LOYALTY_TIP) : 0;
  const tip = perfect + loyal;
  
  const xp = Math.round(15 + (order.xpFee ?? order.fee) * 0.6 * match * (0.5 + 0.5 * quality));
  return { fee, materials, tip, loyal, total: fee + materials + tip, xp };
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




export function generateOrder(lvl, rng, excludeNames = [], opts = {}) {
  const history = opts.history || {};
  const rep = opts.rep || 0;
  
  const eligible = (c) => (c.minLvl || 1) <= lvl && (!c.season || c.season === opts.season) && (!c.premium || rep >= c.minRep);
  const pool = CLIENTS.filter((c) => eligible(c) && !excludeNames.includes(c.name));
  const seasonal = pool.filter((c) => c.season);
  const premium = pool.filter((c) => c.premium);
  const returning = pool.filter((c) => history[c.name]);
  const roll = rng();
  const client = seasonal.length && roll < 0.35 ? pick(seasonal, rng)
    : premium.length && roll < 0.55 ? pick(premium, rng)
      : returning.length && roll < 0.75 ? pick(returning, rng)
        : pick(pool.length ? pool : CLIENTS.filter((c) => (c.minLvl || 1) <= lvl && !c.season && !c.premium), rng);
  const order = briefFor(client, lvl, rng);
  order.fee = Math.round(25 + 18 * lvl + rng() * 12);
  if (client.season) {
    order.season = client.season;
    order.bonus = Math.round(order.fee * SEASON_BONUS);
    order.fee += order.bonus;
  }
  if (client.premium) {
    order.premium = true;
    order.premiumBonus = Math.round(order.fee * (PREMIUM_FEE - 1));
    order.fee += order.premiumBonus;
  }
  const back = repeatTerms(history[client.name]);
  if (back) order.repeat = back;
  order.budget = Math.round(30 + 28 * lvl * (0.8 + 0.4 * rng()));
  order.id = Math.floor(rng() * 1e9).toString(36);
  return order;
}




export function briefFor(client, lvl, rng) {
  const samples = [];
  for (let i = 0; i < 500; i++) samples.push(computeTags(randomDesign(lvl, rng)));
  const best = (tag) => Math.max(...samples.map((s) => s[tag]));
  const target = Math.min(8, 4.5 + lvl * 0.4);
  let wants = client.wants
    .filter((tag) => best(tag) >= 1.5)
    .map((tag) => ({ tag, min: Math.max(1, Math.round(Math.min(target, best(tag) * 0.85) * 2) / 2) }));
  if (!wants.length) wants = [{ tag: 'Daywear', min: 2 }];
  const avoid = client.avoid.map((tag) => ({ tag, max: Math.max(1.5, 3.5 - lvl * 0.2) }));
  const order = { client: client.name, occasion: client.occasion, look: client.look, wants, avoid, body: bodyFor(client) };
  if (client.garment) order.garment = { ...client.garment };
  for (let tries = 0; tries < 8; tries++) {
    const top = Math.max(...samples.map((s) => matchScore(s, order)));
    if (top >= 0.97) break;
    for (const w of order.wants) w.min = Math.max(1, Math.round(w.min * 0.85 * 2) / 2);
  }
  return order;
}


export function seasonFor(made) {
  return SEASONS[Math.floor(Math.max(0, made || 0) / SEASON_LENGTH) % SEASONS.length];
}

export function seasonLeft(made) {
  return SEASON_LENGTH - (Math.max(0, made || 0) % SEASON_LENGTH);
}


export const LOYALTY_TIP = 0.15;
export const REPEAT_PENALTY = 0.7;

export function rememberClient(history, name, rec) {
  const prev = (history || {})[name];
  return { ...(history || {}), [name]: { stars: rec.stars, dress: rec.dress, bodice: rec.bodice, skirt: rec.skirt, visits: (prev?.visits || 0) + 1 } };
}

export function repeatTerms(mem) {
  if (!mem) return null;
  const mood = mem.stars >= 4 ? 'happy' : mem.stars <= 2 ? 'unhappy' : 'neutral';
  const out = { mood, stars: mem.stars, dress: mem.dress, visits: mem.visits || 1 };
  if (mood === 'unhappy') out.differ = { bodice: mem.bodice, skirt: mem.skirt };
  return out;
}


export function sameAsLast(order, design) {
  const df = order?.repeat?.differ;
  return !!df && design.bodice === df.bodice && design.skirt === df.skirt;
}
export function clientMatch(tags, order, design) {
  let m = matchScore(tags, order);
  if (design && missingGarment(order, design)) m *= GARMENT_PENALTY;
  return design && sameAsLast(order, design) ? m * REPEAT_PENALTY : m;
}





export function designSeed(design) {
  const s = [design.bodice, design.collar, design.sleeve, design.skirt, design.fab1, design.dye1].join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}



export const NEAT_QUALITY = 0.85;
export function looseThreads(quality, seed = 1) {
  const q = Math.max(0, Math.min(1, quality ?? 1));
  if (q >= NEAT_QUALITY) return [];
  const n = Math.min(9, Math.ceil((NEAT_QUALITY - q) * 18));
  const rng = mulberry32(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      t: 0.06 + ((i + rng() * 0.8) / n) * 0.88,
      len: 10 + rng() * 12 + (NEAT_QUALITY - q) * 24,
      curl: (rng() < 0.5 ? -1 : 1) * (0.6 + rng() * 0.8),
      where: i % 3 === 2 ? 'seam' : 'hem',
    });
  }
  return out;
}


export function tagText(tags) {
  return Object.entries(tags || {}).filter(([, v]) => v)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t, v]) => `${t} ${v > 0 ? '+' : ''}${v}`).join(', ') || 'no tags';
}



export const BOBBIN_WINDOW = [0.35, 0.7];
export function bobbinRunOut(seamLens, rng) {
  if (!seamLens || !seamLens.length) return null;
  let seam = 0;
  seamLens.forEach((l, i) => { if (l > seamLens[seam]) seam = i; });
  const [a, b] = BOBBIN_WINDOW;
  return { seam, at: Math.round(seamLens[seam] * (a + rng() * (b - a))) };
}


export function threadTension(err, speed) {
  return Math.min(1, (Math.abs(err) / 40) * 0.7 + (Math.max(0, speed) / 3) * 0.3);
}


export function sketchKey(key, row, rows) {
  if (key === 'ArrowDown') return { row: (row + 1) % rows };
  if (key === 'ArrowUp') return { row: (row - 1 + rows) % rows };
  if (key === 'ArrowLeft') return { row, step: -1 };
  if (key === 'ArrowRight') return { row, step: 1 };
  if (key === 'Enter' || key === ' ') return { row, activate: true };
  return null;
}


export const DEFAULT_SETTINGS = { master: 0.8, sfx: 1, music: 0.55, ambience: 0.7, motion: 'auto' };
export function reducedMotion(motion, systemPrefers) {
  return motion === 'on' ? true : motion === 'off' ? false : !!systemPrefers;
}
const clamp01 = (v, d) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : d);
export function gains(settings, muted) {
  const s = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  return {
    master: muted ? 0 : 0.625 * clamp01(s.master, DEFAULT_SETTINGS.master), sfx: clamp01(s.sfx, DEFAULT_SETTINGS.sfx),
    music: clamp01(s.music, DEFAULT_SETTINGS.music), ambience: clamp01(s.ambience, DEFAULT_SETTINGS.ambience),
  };
}


export const TUTORIAL_STEPS = ['sketch', 'cut', 'sew', 'embellish', 'reveal'];
export function needsNote(seen, step) {
  return TUTORIAL_STEPS.includes(step) && !(seen && seen[step]);
}


const round2 = (v) => Math.round(v * 100) / 100;
const clampQ = (q) => Math.max(0, Math.min(1, Number.isFinite(q) ? q : 0.7));




export function repAfter(rep, starCount, order = null) {
  const gain = REP_GAIN[starCount] ?? 0;
  return Math.max(0, (rep || 0) + (order?.charity ? Math.max(0, gain) + CHARITY_REP : gain));
}



export const DECLINE = { fee: 0.05, feeStarted: 0.15, rep: 1, repStarted: 2, min: 5 };
export function declinePenalty(order, { money = 0, rep = 0, started = false } = {}) {
  const share = started ? DECLINE.feeStarted : DECLINE.fee;
  const gift = Math.min(Math.max(0, Math.floor(money)), Math.max(DECLINE.min, Math.round((order?.fee || 0) * share)));
  const lose = started ? DECLINE.repStarted : DECLINE.rep;
  return { money: gift, rep: Math.min(Math.max(0, rep || 0), lose), repAfter: Math.max(0, (rep || 0) - lose) };
}
export function repTier(rep) {
  let i = 0;
  REP_TIERS.forEach((t, k) => { if ((rep || 0) >= t.at) i = k; });
  const next = REP_TIERS[i + 1];
  return { ...REP_TIERS[i], index: i, next: next ? next.at : null, nextName: next ? next.name : null };
}

export function repFromGallery(gallery) {
  return (gallery || []).reduce((r, g) => repAfter(r, g.stars), 0);
}




export function dyesUsed(design) {
  const out = new Set([design.dye1]);
  if (usesSecondary(design)) out.add(design.dye2);
  out.add(design.dye3);
  return [...out].filter((id) => dye(id));
}
export function dyePrice(id) {
  const d = dye(id);
  if (!d || NATURAL_DYES.includes(id)) return 0;
  return d.lvl >= RARE_DYE_LVL ? RARE_DYE_PRICE : DYE_PRICE;
}
export function dyeCost(design) {
  return dyesUsed(design).reduce((a, id) => a + dyePrice(id), 0);
}




export function shopValue(design, quality) {
  const t = computeTags(design);
  const vals = TAGS.filter((k) => k !== 'Unwearable' && k !== 'Simple').map((k) => t[k]).sort((a, b) => b - a);
  const appeal = Math.max(0, vals[0] + vals[1] + vals[2] - t.Unwearable * 3);
  const mats = materialCost(design) + dyeCost(design);
  return Math.max(5, Math.round(mats * 1.15 + appeal * 3.2 * (0.55 + 0.6 * clampQ(quality))));
}
export function placeInWindow(design, quality, made, name = '') {
  return { design, quality: clampQ(quality), value: shopValue(design, quality), name, placedAt: made || 0, sellsAt: (made || 0) + WINDOW_WAIT };
}

export function windowLeft(win, made) {
  return win ? Math.max(0, win.sellsAt - (made || 0)) : null;
}


export function weeklySales(made, lvl) {
  const week = Math.floor(Math.max(0, made || 0) / SALE_EVERY);
  const rng = mulberry32(week * 7919 + 101);
  const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pcts = [20, 25, 30, 40];
  const fabrics = {}, trims = {};
  for (const f of shuffle(avail(FABRICS, lvl)).slice(0, 2)) fabrics[f.id] = pick(pcts, rng);
  for (const t of shuffle(avail(TRIMS, lvl)).slice(0, 2)) trims[t.id] = pick(pcts, rng);
  return { week, left: SALE_EVERY - (Math.max(0, made || 0) % SALE_EVERY), fabrics, trims };
}

export function saleCost(price, qty, pct = 0) {
  return Math.max(1, Math.round(price * qty * (100 - (pct || 0)) / 100));
}


export const BASE_TOL = { cutTol: 16, cutSlack: 3, sewSlack: 3, sewSpan: 30 };
export const upgrade = (id) => byId(UPGRADES, id);
export function tolerances(owned) {
  const t = { ...BASE_TOL };
  for (const id of owned || []) { const u = upgrade(id); if (u) for (const k in u.fx) t[k] += u.fx[k]; }
  return t;
}

export function upgradeBlock(owned, id, lvl, money) {
  const u = upgrade(id);
  if (!u) return 'unknown';
  if ((owned || []).includes(id)) return 'owned';
  if (u.lvl > lvl) return `level ${u.lvl}`;
  if (u.needs && !(owned || []).includes(u.needs)) return `needs ${upgrade(u.needs).name}`;
  if ((money || 0) < u.price) return 'money';
  return '';
}

export function stitchAcc(err, tol = BASE_TOL) {
  return Math.max(0, 1 - Math.max(0, Math.abs(err) - tol.sewSlack) / tol.sewSpan);
}

export function cutAccuracy(devs, wobble, tol = BASE_TOL) {
  if (!devs.length) return 1;
  const m = devs.reduce((a, b) => a + (1 - Math.min(Math.max(0, b - tol.cutSlack), tol.cutTol) / tol.cutTol), 0) / devs.length;
  return Math.max(0.3, Math.min(1, m * 0.85 + 0.15 - (wobble || 0) * 0.04));
}



export function scrapsFrom(design, cutAcc) {
  const out = {};
  const needs = fabricNeeds(design);
  const k = 0.06 + 0.08 * clampQ(cutAcc);
  for (const id in needs) out[id] = round2(needs[id] * k);
  return out;
}
export function addScraps(scraps, add) {
  const out = { ...(scraps || {}) };
  for (const id in add) out[id] = round2((out[id] || 0) + add[id]);
  return out;
}
export const accessory = (id) => byId(ACCESSORIES, id);
export function accessoryPrice(accId, fabId) {
  const a = accessory(accId), f = fabric(fabId);
  return a && f ? Math.round(a.base + f.price * a.need * 1.6) : 0;
}

export function makeAccessory(scraps, accId, fabId) {
  const a = accessory(accId);
  if (!a || (scraps?.[fabId] || 0) + 1e-9 < a.need) return null;
  const left = round2(scraps[fabId] - a.need);
  const out = { ...scraps, [fabId]: left };
  if (left < 0.05) delete out[fabId];
  return { scraps: out, price: accessoryPrice(accId, fabId) };
}


export function freshStats() {
  return { bodices: {}, fiveStars: 0, windowSold: 0, accessories: 0 };
}
export function recordDress(stats, starCount, bodice) {
  const s = { ...freshStats(), ...(stats || {}) };
  return { ...s, bodices: { ...s.bodices, [bodice]: true }, fiveStars: s.fiveStars + (starCount === 5 ? 1 : 0) };
}
export function statsFromGallery(gallery) {
  return (gallery || []).reduce((s, g) => recordDress(s, g.stars, g.design?.bodice), freshStats());
}
const RULES = {
  first: (s) => s.made >= 1,
  five_star: (s) => s.stats.fiveStars >= 1,
  five_fives: (s) => s.stats.fiveStars >= 5,
  ten: (s) => s.made >= 10,
  year: (s) => s.made >= SEASON_LENGTH * SEASONS.length,
  bodices: (s) => PARTS.bodice.every((p) => s.stats.bodices[p.id]),
  level5: (s) => levelFor(s.xp) >= 5,
  level10: (s) => levelFor(s.xp) >= 10,
  rich: (s) => s.money >= 1000,
  window: (s) => s.stats.windowSold >= 1,
  scraps: (s) => s.stats.accessories >= 3,
  upgrade: (s) => s.upgrades.length >= 1,
  equipped: (s) => UPGRADES.every((u) => s.upgrades.includes(u.id)),
  darling: (s) => s.rep >= 45,
  loyal: (s) => Object.values(s.clients).some((c) => (c.visits || 0) >= 3),
  
  kind: (s) => (s.town?.charity || 0) >= 1,
  gossip: (s) => (s.town?.known?.length || 0) >= 15,
  bravo: (s) => (s.town?.kinds?.opera || 0) >= 1,
  noble: (s) => (s.town?.kinds?.noble || 0) >= 1,
  bride: (s) => (s.town?.kinds?.church || 0) >= 1,
  double: (s) => (s.town?.kinds?.asianwedding || 0) >= 1,
};
export function achievementsEarned(st) {
  const s = { made: 0, xp: 0, money: 0, rep: 0, upgrades: [], clients: {}, ...st, stats: { ...freshStats(), ...(st?.stats || {}) } };
  return ACHIEVEMENTS.filter((a) => RULES[a.id] && RULES[a.id](s)).map((a) => a.id);
}
export function newAchievements(st) {
  const have = st?.achievements || {};
  return achievementsEarned(st).filter((id) => !have[id]);
}



export const GARMENT_PENALTY = 0.55;
export function missingGarment(order, design) {
  return !!(order?.garment && design && design[order.garment.slot] !== order.garment.id);
}






const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export function bodyFor(client) {
  if (client?.body && BODY_SHAPES.some((b) => b.id === client.body)) return client.body;
  return BODY_SHAPES[hashStr(client?.name || '') % BODY_SHAPES.length].id;
}
export const bodyShape = (id) => BODY_SHAPES.find((b) => b.id === id) || BODY_SHAPES[0];

const FORM_HW = [[40, 8], [88, 14], [112, 64], [150, 60], [170, 52], [226, 32], [300, 40], [620, 40]];
export const HIP_Y = 300;
function knotLerp(knots, y) {
  if (y <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) {
    const [y1, v1] = knots[i];
    if (y <= y1) {
      const [y0, v0] = knots[i - 1];
      const t = (y - y0) / (y1 - y0), s = t * t * (3 - 2 * t);   
      return v0 + (v1 - v0) * s;
    }
  }
  return knots[knots.length - 1][1];
}
export const formHalfWidth = (y) => knotLerp(FORM_HW, y);
export function bodyScale(id, y) {
  const b = bodyShape(id);
  return knotLerp([[88, 1], [112, b.sh], [165, b.bu], [226, b.wa], [HIP_Y, b.hi], [620, 1 + (b.hi - 1) * 0.8]], y);
}

export const bodyGrowth = (id, y) => formHalfWidth(y) * (bodyScale(id, y) - 1);




const DRAPE = {
  weave: [0.45, 0.55], slub: [0.3, 0.45], check: [0.4, 0.55], floral: [0.3, 0.45], sheen: [0.5, 0.5],
  net: [0.2, 0.95], velvet: [0.55, 0.25], silk: [0.9, 0.8], sparkle: [0.6, 0.45], brocade: [0.1, 0.2],
  chiffon: [0.85, 1], organza: [0.15, 0.9], tartan: [0.25, 0.3], lame: [0.6, 0.45], damask: [0.35, 0.4],
  guipure: [0.4, 0.45], wax: [0.35, 0.5], zari: [0.6, 0.6], shot: [0.45, 0.6],
  batik: [0.55, 0.6], songket: [0.2, 0.25], clouds: [0.6, 0.55],
};
export function drapeOf(tex) {
  const [cling, flutter] = DRAPE[tex] || DRAPE.weave;
  return { cling, flutter };
}




export function contourX(x, y, id, { zone = 'body', cling = 0.5 } = {}) {
  if (!id || id === 'classic') return x;
  const dx = x - 200, sgn = dx < 0 ? -1 : 1;
  if (zone === 'arm') return x - bodyGrowth(id, Math.min(y, 226));
  let g;
  if (zone === 'skirt' && y > HIP_Y) {
    const gh = bodyGrowth(id, HIP_Y), t = Math.min(1, (y - HIP_Y) / 320);
    g = gh * (1 - cling * 0.45 * t) + gh * (1 - cling) * 0.25 * t;
  } else g = bodyGrowth(id, y);
  const k = Math.min(1, Math.abs(dx) / Math.max(1, formHalfWidth(y)));
  return x + sgn * g * k;
}




export function windAt(t, open = true) {
  if (!open) return 0;
  const swell = 0.32 + 0.14 * Math.sin(t * 0.63) + 0.08 * Math.sin(t * 1.71 + 1.3);
  const P = 6.7, k = Math.floor(t / P), ph = t - k * P;
  const size = 0.35 + 0.65 * Math.abs(Math.sin(k * 12.9898 + 4.1));
  const gust = size * Math.exp(-((ph - 2.2) ** 2) / 0.9);
  return Math.max(0, Math.min(1.2, swell + gust));
}

export function springStep(s, target, dt, stiff = 14, damp = 4.2) {
  const h = Math.min(0.05, Math.max(0, dt));
  const v = s.v + (stiff * (target - s.x) - damp * s.v) * h;
  return { x: s.x + v * h, v };
}


export const isNightHour = (h) => h >= 19 || h < 6;









export const DEVICE_LINE = 'Hearing nothing? On a phone, the silent switch or Do Not Disturb silences web pages too - turn it off to hear the music.';
const SILENCES = {
  muted: { short: 'Sound is off', line: 'Sound is off. Tap the speaker to bring it back.' },
  down: { short: 'Sound is turned down', line: 'The master volume is at zero. Raise it to hear anything.' },
  locked: { short: 'Tap to start the sound', line: 'Your browser holds sound back until the page is touched. Tap anywhere and it will start.' },
  interrupted: { short: 'Sound paused - tap to bring it back', line: 'The sound stopped when the page went into the background. Tap anywhere to bring it back.' },
  dead: { short: 'Sound lost - tap to bring it back', line: 'Your phone took the sound away while the page was in the background. Tap anywhere and the game starts it again; if it stays quiet, reload.' },
};
export const SILENCE_REASONS = Object.keys(SILENCES);
export function silenceOf({ muted = false, unlocked = false, ctxState = 'none', master = 1, dead = false } = {}) {
  const reason = muted ? 'muted' : !(master > 0) ? 'down' : !unlocked || ctxState === 'none' ? 'locked'
    : ctxState !== 'running' ? 'interrupted' : dead ? 'dead' : null;
  if (!reason) return { silent: false, reason: null, short: 'Sound is on', line: DEVICE_LINE };
  return { silent: true, reason, ...SILENCES[reason] };
}





const TUNES = {
  day: { bpm: 92, scale: [0, 2, 4, 5, 7, 9, 11].map((n) => n + 65), chords: [[53, 'M'], [50, 'm'], [46, 'M'], [48, 'M'], [53, 'M'], [45, 'm'], [43, 'm'], [48, 'M']] },
  night: { bpm: 64, scale: [0, 2, 3, 5, 7, 8, 10].map((n) => n + 69), chords: [[45, 'm'], [41, 'M'], [48, 'M'], [43, 'M'], [45, 'm'], [50, 'm'], [52, 'm'], [45, 'm']] },
};
export const tuneOf = (mood) => TUNES[mood] || TUNES.day;
export function musicBar(mood, bar) {
  const T = tuneOf(mood), [root, q] = T.chords[((bar % 8) + 8) % 8];
  const tones = q === 'M' ? [0, 4, 7] : [0, 3, 7];
  const rng = mulberry32(hashStr(`${mood}|${bar % 8}|${Math.floor(bar / 8) % 2}`));
  const notes = [];
  const night = mood === 'night';
  notes.push({ t: 0, midi: root, dur: 3, voice: 'pad', vel: night ? 0.9 : 0.6 });
  notes.push({ t: 0, midi: root + 12 + tones[1], dur: 3, voice: 'pad', vel: night ? 0.7 : 0.45 });
  if (!night) {
    notes.push({ t: 0, midi: root - 12, dur: 1.2, voice: 'harp', vel: 0.9 });
    for (const b of [1, 2]) for (const k of [1, 2]) notes.push({ t: b, midi: root + 12 + tones[k], dur: 0.9, voice: 'harp', vel: 0.55 });
  } else {
    notes.push({ t: 0, midi: root, dur: 2, voice: 'harp', vel: 0.6 }, { t: 1.5, midi: root + 12 + tones[2], dur: 1.4, voice: 'harp', vel: 0.4 });
  }
  
  const rhythms = night ? [[0, 1.5], [0], [0, 2], [1]] : [[0, 1, 2], [0, 2], [0, 1, 1.5, 2], [0, 1.5, 2], [0, 1, 2, 2.5]];
  const rest = (bar % 8 === 7) || rng() < (night ? 0.25 : 0.08);
  if (!rest) {
    const beats = rhythms[Math.floor(rng() * rhythms.length)];
    const chordPcs = tones.map((n) => (root + n) % 12);
    const inScale = T.scale.concat(T.scale.map((n) => n + 12));
    let i = Math.max(0, inScale.findIndex((n) => chordPcs.includes(n % 12) && n >= T.scale[2]));
    for (const b of beats) {
      if (b % 1 === 0) {
        
        for (let d = 0; d < inScale.length; d++) {
          if (i + d < inScale.length && chordPcs.includes(inScale[i + d] % 12)) { i += d; break; }
          if (i - d >= 0 && chordPcs.includes(inScale[i - d] % 12)) { i -= d; break; }
        }
      }
      notes.push({ t: b, midi: inScale[i], dur: night ? 1.6 : 0.8, voice: 'bell', vel: night ? 0.55 : 0.7 });
      i = Math.max(0, Math.min(inScale.length - 2, i + (rng() < 0.5 ? -1 : 1) * (rng() < 0.7 ? 1 : 2)));
    }
  }
  return notes;
}






export const EMOTION_VOICE = {
  love: { p: 1.12, r: 1.08, end: 2, v: 1 }, laugh: { p: 1.2, r: 1.25, end: 3, v: 1.05 }, joy: { p: 1.18, r: 1.12, end: 4, v: 1.1 },
  hmm: { p: 1, r: 1, end: 0, v: 0.9 }, cold: { p: 0.95, r: 0.9, end: -1, v: 0.8 },
  hurt: { p: 0.86, r: 0.72, end: -4, v: 0.75 }, angry: { p: 1.05, r: 1.35, end: -2, v: 1.3 },
};
export const BABBLE_MAX = 30;
export function babblePlan(voice, text, emotion = 'hmm') {
  const e = EMOTION_VOICE[emotion] || EMOTION_VOICE.hmm;
  const v = { pitch: 240, rate: 9, vowel: 1, wobble: 0.1, vib: 0, ...(voice || {}) };
  let h = 7;
  for (const ch of String(text)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = mulberry32(h);
  const step = 1 / (v.rate * e.r), notes = [];
  let t = 0;
  const words = String(text).match(/[A-Za-zÀ-ɏ']+[^A-Za-zÀ-ɏ']*/g) || [];
  for (const w of words) {
    const syl = Math.max(1, Math.min(4, (w.toLowerCase().match(/[aeiouy]+/g) || []).length));
    for (let s = 0; s < syl && notes.length < BABBLE_MAX; s++) {
      const semis = (rnd() * 2 - 1) * v.wobble * 12;
      notes.push({ t, dur: step * (0.62 + rnd() * 0.3), freq: v.pitch * e.p * 2 ** (semis / 12), formant: [650, 950, 1350, 420][Math.floor(rnd() * 4)] * v.vowel, vol: 0.11 * e.v });
      t += step;
    }
    if (/[,;:-]/.test(w)) t += step * 1.4;
    if (/[.!?]/.test(w)) t += step * 2.4;
    if (notes.length >= BABBLE_MAX) break;
  }
  
  const n = notes.length;
  notes.forEach((x, i) => { x.freq *= 2 ** ((e.end * (i / Math.max(1, n - 1))) / 12); });
  if (n && /\?\s*$/.test(text)) notes[n - 1].freq *= 2 ** (4 / 12);
  return { notes, dur: t, vib: v.vib, wave: v.wave || 'triangle' };
}
