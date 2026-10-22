





















import {
  bestMelds, findCut, isJoker, rankOf, suitOf, cardPoints, legalActions, extendMeld, isMeld,
} from './congaRules.js';
import { SeededRng } from '../rng/seededRng.js';
import { buildDeck } from '../cards/cards.js';

const ALL_FACES = Object.freeze(buildDeck('spanish50'));

export const LEVELS = Object.freeze(['easy', 'medium', 'hard']);


export function seededRng(seed = 1) {
  const r = new SeededRng((seed >>> 0) || 1);
  return () => r.next();
}


const near = (a, b) => {
  if (isJoker(a) || isJoker(b)) return true;
  if (rankOf(a) === rankOf(b)) return true;
  return suitOf(a) === suitOf(b) && Math.abs(rankOf(a) - rankOf(b)) <= 2;
};


const completers = (a, b) => {
  if (rankOf(a) === rankOf(b)) return ['e', 'b', 'o', 'c'].map((s) => `${rankOf(a)}${s}`).filter((x) => x !== a && x !== b);
  const lo = Math.min(rankOf(a), rankOf(b));
  const hi = Math.max(rankOf(a), rankOf(b));
  const s = suitOf(a);
  const out = hi - lo === 2 ? [lo + 1] : [lo - 1, hi + 1];
  return out.filter((r) => r >= 1 && r <= 12).map((r) => `${r}${s}`);
};






export function handValue(cards, { almost = true, dead = null } = {}) {
  const b = bestMelds(cards);
  let v = b.left.reduce((s, c) => s + (isJoker(c) ? 0 : cardPoints(c)), 0);
  if (almost) {
    
    
    const w = almost === true ? 1 : Number(almost);
    const loose = b.left.filter((c) => !isJoker(c));
    const live = (c, d) => !dead || completers(c, d).some((x) => !dead.has(x) && !cards.includes(x));
    for (const c of loose) {
      if (loose.some((d) => d !== c && near(c, d) && live(c, d)) || cards.some(isJoker)) v -= w * Math.min(4, cardPoints(c) * 0.35);
    }
  }
  return v;
}


export function bestThrow(cards8, { almost = true, avoid = null, dead = null } = {}) {
  let best = null;
  for (const c of cards8) {
    if (isJoker(c)) continue;
    const rest = cards8.filter((x) => x !== c);
    let v = handValue(rest, { almost, dead });
    if (avoid && avoid(c)) v += 2;
    const key = v - cardPoints(c) * 0.01; 
    if (!best || key < best.key) best = { card: c, value: v, key };
  }
  if (!best) best = { card: cards8[0], value: handValue(cards8.slice(1), { almost }), key: 0 };
  return { card: best.card, value: best.value };
}


const feeds = (taken) => (card) => taken.some((t) => !isJoker(t) && (rankOf(t) === rankOf(card)
  || (suitOf(t) === suitOf(card) && Math.abs(rankOf(t) - rankOf(card)) <= 1)))
  || taken.length >= 2 && isMeld([...taken.slice(-2), card]);





export function chooseAction(view, { level = 'medium', rng = Math.random } = {}) {
  const g = view.game;
  const h = g.hand;
  const me = view.you;
  const legal = legalActions(g, me);
  if (!legal.length) return null;
  const easy = level === 'easy';
  const hard = level === 'hard';
  
  
  const almost = !easy;
  const mine = h.mine || h.hands[me];
  const n = g.opts.players;
  let next = (me + 1) % n;
  for (let k = 1; k < n && g.out[next]; k++) next = (me + 1 + k) % n;
  const known = (h.known || [])[next] || [];
  const avoid = hard && known.length ? feeds(known) : null;
  const dead = hard ? new Set([...h.pile, ...(h.known || []).filter((_, s) => s !== me).flat()]) : null;

  if (h.phase === 'draw') {
    const now = handValue(mine, { almost, dead });
    const top = h.pile[h.pile.length - 1];
    if (top) {
      const take = isJoker(top) ? -Infinity : bestThrow([...mine, top], { almost, dead }).value;
      const margin = easy ? 2 : 1;
      
      
      
      let bar = now - margin;
      if (hard) {
        const unseen = ALL_FACES.filter((c) => !mine.includes(c) && !dead.has(c));
        const step = Math.max(1, Math.floor(unseen.length / 18));
        let sum = 0;
        let k = 0;
        for (let i = 0; i < unseen.length; i += step) { sum += bestThrow([...mine, unseen[i]], { almost, dead }).value; k++; }
        if (k) bar = Math.min(now, sum / k) - 0.5;
      }
      
      if (isJoker(top) || findCut([...mine, top]) || take < bar) {
        return { action: legal.find((a) => a.from === 'pile'), reason: 'pozo helps' };
      }
    }
    return { action: legal.find((a) => a.from === 'stock'), reason: 'mazo' };
  }

  
  const cut = findCut(mine);
  if (cut) {
    
    
    const miss = easy && rng() < 0.25;
    if (!miss) return { action: { type: 'cut', seat: me, card: cut.card, melds: cut.melds }, reason: cut.conga ? 'conga' : 'cut' };
  }
  let pick = bestThrow(mine, { almost, avoid, dead }).card;
  if (easy && rng() < 0.3) {
    const ranked = mine.filter((c) => !isJoker(c))
      .map((c) => ({ c, v: handValue(mine.filter((x) => x !== c), { almost: false }) }))
      .sort((a, b) => a.v - b.v).slice(0, 3);
    if (ranked.length) pick = ranked[Math.floor(rng() * ranked.length)].c;
  }
  return { action: legal.find((a) => a.type === 'discard' && a.card === pick) || legal.find((a) => a.type === 'discard'), reason: 'throw' };
}


export const botToMove = (view) => view.game.hand && !view.game.hand.over && !view.game.over && view.game.hand.turn === view.you;

export { extendMeld };
