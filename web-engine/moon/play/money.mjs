















import { MS } from '../economy/math.mjs';

export const MONEY = Object.freeze({
  
  flyS: 0.95,
  
  coinsPerIcon: 12,
  maxIcons: 5,
  
  iconStagger: 0.12,
  
  
  easePerS: 5,
  minPerS: 12,
  
  arc: 0.35,
});

const flyMs = (cfg) => Math.round(cfg.flyS * MS);


export function unlandedCoins(visits, now, cfg = MONEY) {
  let n = 0;
  for (const v of visits) {
    if (!v.walker) continue;
    if (now < v.payMs + flyMs(cfg)) n += v.coins;
  }
  return n;
}


export const coinTarget = (worldCoins, visits, now, cfg = MONEY) => worldCoins - unlandedCoins(visits, now, cfg);


export const iconsFor = (coins, cfg = MONEY) => Math.max(1, Math.min(cfg.maxIcons, Math.ceil(coins / cfg.coinsPerIcon)));


export function flightsAt(visits, now, cfg = MONEY) {
  const out = [];
  for (const v of visits) {
    if (!v.walker || now < v.payMs || now >= v.payMs + flyMs(cfg)) continue;
    out.push({ id: v.id, coins: v.coins, good: v.good, u: (now - v.payMs) / flyMs(cfg), icons: iconsFor(v.coins, cfg) });
  }
  return out;
}


export function landedBetween(visits, prev, now, cfg = MONEY) {
  return visits.filter((v) => v.walker && v.payMs + flyMs(cfg) > prev && v.payMs + flyMs(cfg) <= now).map((v) => v.id);
}


export function paidBetween(visits, prev, now) {
  return visits.filter((v) => v.walker && v.payMs > prev && v.payMs <= now).map((v) => v.id);
}


export function countStep(shown, target, dtS, cfg = MONEY) {
  const diff = target - shown;
  if (Math.abs(diff) < 1e-9 || !(dtS > 0)) return Math.abs(diff) < 1e-9 ? target : shown;
  const step = Math.max(cfg.minPerS * dtS, Math.abs(diff) * (1 - Math.exp(-cfg.easePerS * dtS)));
  return Math.abs(diff) <= step ? target : shown + Math.sign(diff) * step;
}





export function flightPoint(from, to, u, k = 0, cfg = MONEY) {
  const s = Math.max(0, Math.min(1, (u - k * cfg.iconStagger) / Math.max(1e-9, 1 - k * cfg.iconStagger)));
  if (u < k * cfg.iconStagger) return { x: from.x, y: from.y, scale: 0, visible: false };
  const e = s * s * (3 - 2 * s);
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const lift = cfg.arc * dist * 4 * s * (1 - s);
  
  const scale = s < 0.2 ? 0.6 + 2.5 * s : 1.1 - 0.35 * Math.max(0, (s - 0.2) / 0.8);
  return { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e - lift, scale, visible: s < 1 };
}
