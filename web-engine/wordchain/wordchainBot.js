













import { endsGame } from './wordchainLang.js';
import { followers, continuations, tailsOf, headOf, isKiller } from './wordchainDict.js';

export const LEVELS = Object.freeze(['easy', 'medium', 'hard']);






export const KILL_FROM = 10;







export const TRAP_FROM = 6;
export const TRAP_CHANCE = 0.5;


export function seededRng(seed = 1) {
  let a = (Number(seed) >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickOne = (list, rng) => list[Math.floor(rng() * list.length)];


export function candidates(dict, game) {
  const last = game.chain[game.chain.length - 1];
  const pool = last === undefined
    ? [...dict.common].filter((i) => !isKiller(dict, game.link, i))
    : followers(dict, game.link, last, game.used);
  return pool.filter((i) => !game.used.has(i) && !endsGame(game.lang, game.link, dict.words[i]));
}















export const RECALL = Object.freeze({
  easy: Object.freeze({ common: 0.3, rare: 0, stuckGuess: 0.2, blankFrom: 4, blankBase: 0.07, blankPerWord: 0.015, blankMax: 0.4 }),
  medium: Object.freeze({ common: 0.6, rare: 0.05, stuckGuess: 0.3, blankFrom: 6, blankBase: 0.03, blankPerWord: 0.008, blankMax: 0.3 }),
  hard: Object.freeze({ common: 0.8, rare: 0.25, stuckGuess: 0.6, blankFrom: 10, blankBase: 0.01, blankPerWord: 0.005, blankMax: 0.15 }),
});


export function recallRoll(i, seed) {
  let h = (Math.imul(i + 1, 2654435761) ^ Math.imul(seed + 7, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}


export function recalledBy(dict, game, level, all) {
  const r = RECALL[level] ?? RECALL.medium;
  
  const salt = ((game.chain[0] ?? 0) * 131 + LEVELS.indexOf(level) * 7919 + 17) >>> 0;
  return all.filter((i) => recallRoll(i, salt) < (dict.common.has(i) ? r.common : r.rare));
}


export function chooseWord(dict, game, { level = 'medium', rng = Math.random } = {}) {
  if (game.over) return null;
  const everything = candidates(dict, game);
  if (!everything.length) return null;
  const r = RECALL[level] ?? RECALL.medium;
  const len = game.chain.length;
  
  
  if (len >= r.blankFrom && rng() < Math.min(r.blankMax, r.blankBase + r.blankPerWord * (len - r.blankFrom))) return null;
  let all = recalledBy(dict, game, level, everything);
  
  
  if (!all.length) {
    if (rng() >= r.stuckGuess) return null;
    all = everything;
  }
  const common = all.filter((i) => dict.common.has(i));
  if (level === 'easy') return pickOne(common.length ? common : all, rng);
  const trapping = level === 'hard' && len >= TRAP_FROM && rng() < TRAP_CHANCE;
  if (!trapping) return common.length && rng() < 0.75 ? pickOne(common, rng) : pickOne(all, rng);
  return trapPick(dict, game, all, rng);
}





export function trapPick(dict, game, all, rng = Math.random) {
  const holdKillers = game.chain.length < KILL_FROM;
  let best = Infinity;
  let bestList = [];
  for (const i of all) {
    
    
    let n = continuations(dict, game.link, i, game.used);
    if (tailsOf(dict, game.link, i).includes(headOf(dict, game.link, i))) n -= 1;
    if (holdKillers && n <= 0) n = 1e9;
    else if (n > 0 && n <= LOOKAHEAD) n += DANGER * counterTraps(dict, game, i);
    if (n < best) { best = n; bestList = [i]; } else if (n === best) bestList.push(i);
  }
  return pickOne(bestList, rng);
}







const LOOKAHEAD = 6;
const DANGER = 1000;
function counterTraps(dict, game, i) {
  const used = new Set(game.used);
  used.add(i);
  let bad = 0;
  for (const r of followers(dict, game.link, i, used)) {
    if (endsGame(game.lang, game.link, dict.words[r])) continue; 
    used.add(r);
    if (followers(dict, game.link, r, used).every((k) => endsGame(game.lang, game.link, dict.words[k]))) bad++;
    used.delete(r);
  }
  return bad;
}
