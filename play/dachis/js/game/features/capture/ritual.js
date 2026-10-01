








import { U } from '../../../engine/core/util.js';

export const NODES = [1, 2, 3];
export const WINDOW = { perfect: 0.13, good: 0.3, late: 0.5 }; 
export const RARITY_CAP = { common: 1, uncommon: 1, rare: 0.7, legendary: 0.4 };
const RARITY_LEN = { common: 4, uncommon: 5, rare: 6, legendary: 8 };
const RARITY_BEAT = { common: 0.95, uncommon: 0.85, rare: 0.75, legendary: 0.62 };


export function makePattern(rarity, level, rng = Math.random) {
  const len = (RARITY_LEN[rarity] || 4) + (level >= 40 ? 1 : 0);
  const out = [];
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const opts = NODES.filter(n => n !== prev);
    prev = opts[Math.floor(rng() * opts.length)];
    out.push(prev);
  }
  return { nodes: out, beat: RARITY_BEAT[rarity] || 0.9, lead: 1.1 };
}


export const dueAt = (p, i) => p.lead + i * p.beat;


export function judge(p, i, node, t) {
  if (node !== p.nodes[i]) return { grade: 'wrong', score: 0 };
  const err = Math.abs(t - dueAt(p, i));
  if (err <= WINDOW.perfect) return { grade: 'perfect', score: 1 };
  if (err <= WINDOW.good) return { grade: 'good', score: 0.8 };
  if (err <= WINDOW.late) return { grade: 'late', score: 0.55 };
  return { grade: 'miss', score: 0 };
}

export const expired = (p, i, t) => t > dueAt(p, i) + WINDOW.late;

export function captureChance(grades, rarity) {
  const total = grades.length || 1;
  const right = grades.filter(g => g.score > 0).length / total;
  const timing = grades.reduce((a, g) => a + g.score, 0) / total;
  const cap = RARITY_CAP[rarity] ?? 1;
  const easy = rarity === 'common' || rarity === 'uncommon';
  const q = easy ? right * right : right * right * U.lerp(0.55, 1, timing);
  return U.clamp(cap * q, 0, 1);
}


export function nodeFromDirection(dx, dy, dead = 0.55) {
  const len = Math.hypot(dx, dy);
  if (len < dead) return 0;
  const a = Math.atan2(-dy, dx) * 180 / Math.PI; 
  if (a > 45 && a < 135) return 2;
  if (a >= 135 || a < -150) return 1;
  if (a <= 45 && a > -30) return 3;
  return 0;
}
