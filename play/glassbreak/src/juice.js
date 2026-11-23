





import { paneValue } from './sim/sim.js';
import { FP } from './sim/fixed.js';


export const CHAIN_POP_FROM = 3;

export const MAX_POPS = 4;

const MAX_STEPS = 12;

const isBreak = (e) => e && (e.k === 'break' || e.k === 'sun');
const chainOf = (e) => (e.a >> 6) & 15;   
const kindOf = (e) => (e.a >> 2) & 15;


export function breakRate(e) {
  if (!isBreak(e)) return 1;
  return 2 ** (Math.min(chainOf(e), MAX_STEPS) / 12);
}





export function popsFor(events) {
  const chains = [], lights = [];
  for (const e of events) {
    if (!isBreak(e)) continue;
    const x = e.x / FP, y = -e.y / FP;
    const n = chainOf(e) + 1;
    lights.push({ kind: 'light', text: `+${paneValue(kindOf(e), chainOf(e))}`, x, y, big: e.k === 'sun' });
    if (n >= CHAIN_POP_FROM) chains.push({ kind: 'chain', text: `CHAIN ${n}`, x, y, big: n >= 8 });
  }
  
  chains.sort((a, b) => b.text.length - a.text.length || b.text.localeCompare(a.text));
  return [...chains.slice(0, 1), ...lights].slice(0, MAX_POPS);
}






export function tallyPlan(s, bestBefore = 0, parTicks = Infinity, tickHz = 60) {
  const time = s.phT - s.wt;
  const stars = [
    { why: 'Window broken', earned: true },
    { why: 'No lantern lost', earned: s.wLost === 0 },
    { why: `Under par · ${Math.round(parTicks / tickHz)} s`, earned: time <= parTicks },
  ];
  const count = stars.filter((x) => x.earned).length;
  return { stars, count, newBest: count > (bestBefore || 0) };
}


export function tallyTimes(nStars, nRows, reduce = false) {
  if (reduce) return { stars: Array(nStars).fill(0), rows: Array(nRows).fill(0), best: 0, countMs: 0 };
  
  const stars = Array.from({ length: nStars }, (_, i) => 200 + i * 240);
  const rowsFrom = stars[nStars - 1] + 220;
  const rows = Array.from({ length: nRows }, (_, i) => rowsFrom + i * 100);
  return { stars, rows, best: rows[nRows - 1] + 160, countMs: 420 };
}
