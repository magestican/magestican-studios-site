













import { endsGame } from './wordchainLang.js';
import { followers, continuations, tailsOf, headOf, isKiller } from './wordchainDict.js';

export const LEVELS = Object.freeze(['easy', 'medium', 'hard']);






export const KILL_FROM = 10;


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


export function chooseWord(dict, game, { level = 'medium', rng = Math.random } = {}) {
  if (game.over) return null;
  const all = candidates(dict, game);
  if (!all.length) return null;
  const common = all.filter((i) => dict.common.has(i));
  if (level === 'easy') {
    
    
    const blank = game.chain.length < 4 ? 0 : 0.04 + 0.012 * Math.min(game.chain.length, 25);
    if (rng() < blank) return null;
    
    
    if (!common.length) return rng() < 0.5 ? pickOne(all, rng) : null;
    return pickOne(common, rng);
  }
  if (level === 'medium') {
    if (rng() < 0.02) return null;
    return common.length && rng() < 0.75 ? pickOne(common, rng) : pickOne(all, rng);
  }
  
  
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
