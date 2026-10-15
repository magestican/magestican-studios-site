



























import { parseCard, faceOf, rngFrom } from '../cards/cards.js';
import { meldInfo, isWildCard, cardPoints, hasCleanCanastra, teamOf, CANASTRA } from './buracoRules.js';

export const LEVELS = Object.freeze(['easy', 'medium', 'hard']);

const pos = (id) => {
  const p = parseCard(id, 'french52');
  if (!p || p.joker) return null;
  return ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].indexOf(p.rank) + 1;
};
const suitOf = (id) => {
  const p = parseCard(id, 'french52');
  return p && !p.joker ? p.suit : null;
};
const isJoker = (id) => faceOf(id).startsWith('JK');





export function cleanRuns(cards) {
  const bySuit = new Map();
  for (const c of cards) {
    if (isJoker(c)) continue;
    const s = suitOf(c);
    if (!bySuit.has(s)) bySuit.set(s, new Map());
    const m = bySuit.get(s);
    const p = pos(c);
    if (!m.has(p)) m.set(p, c);
  }
  const out = [];
  for (const [, m] of bySuit) {
    let best = [];
    for (const aceHigh of [false, true]) {
      const at = new Map();
      for (const [p, c] of m) at.set(p === 1 && aceHigh ? 14 : p, c);
      const segs = [];
      let cur = [];
      for (let p = 1; p <= 14; p++) {
        if (at.has(p)) cur.push(at.get(p));
        else { if (cur.length >= 3) segs.push(cur); cur = []; }
      }
      if (cur.length >= 3) segs.push(cur);
      const used = segs.reduce((s, x) => s + x.length, 0);
      if (used > best.reduce((s, x) => s + x.length, 0)) best = segs;
    }
    out.push(...best);
  }
  return out.sort((a, b) => b.length - a.length);
}


function wildPairs(cards) {
  const nat = cards.filter((c) => !isWildCard(c));
  const out = [];
  for (let i = 0; i < nat.length; i++) {
    for (let j = i + 1; j < nat.length; j++) {
      if (suitOf(nat[i]) !== suitOf(nat[j])) continue;
      const d = Math.abs(pos(nat[i]) - pos(nat[j]));
      const dHigh = Math.abs((pos(nat[i]) === 1 ? 14 : pos(nat[i])) - (pos(nat[j]) === 1 ? 14 : pos(nat[j])));
      if (d === 1 || d === 2 || dHigh === 1 || dHigh === 2) out.push([nat[i], nat[j]]);
    }
  }
  return out;
}


function fitsNatural(m, c) {
  if (isJoker(c)) return false;
  const before = meldInfo(m);
  const after = meldInfo([...m, c]);
  if (!after.ok) return false;
  if (isWildCard(c) && after.wild === c) return false;
  return !(before.ok && before.clean && !after.clean);
}


function mayEmpty(h, team, melds) {
  if (!h.mortoTaken[team] && h.mortosLeft > 0) return true;
  return h.mortoTaken[team] && hasCleanCanastra(melds);
}


export function layable(cards, melds) {
  let pts = 0;
  let left = cards.slice();
  const ms = melds.map((m) => m.slice());
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of left) {
      const k = ms.findIndex((m) => fitsNatural(m, c));
      if (k >= 0) {
        ms[k] = meldInfo([...ms[k], c]).order;
        pts += cardPoints(c) + (ms[k].length === CANASTRA ? 200 : 0);
        left = left.filter((x) => x !== c);
        changed = true;
        break;
      }
    }
  }
  for (const r of cleanRuns(left)) {
    pts += r.reduce((s, c) => s + cardPoints(c), 0) + (r.length >= CANASTRA ? 200 : 0) + r.length * 4;
    left = left.filter((x) => !r.includes(x));
  }
  return { pts, left };
}


function keepScore(c, hand, ownMelds) {
  if (isWildCard(c)) return 1000;
  let v = 0;
  const s = suitOf(c);
  const p = pos(c);
  for (const o of hand) {
    if (o === c || isWildCard(o) || suitOf(o) !== s) continue;
    const d = Math.min(Math.abs(pos(o) - p), Math.abs((pos(o) === 1 ? 14 : pos(o)) - (p === 1 ? 14 : p)));
    if (d === 0) v -= 2; 
    else if (d === 1) v += 12;
    else if (d === 2) v += 6;
  }
  
  for (const m of ownMelds) {
    const i = meldInfo(m);
    if (i.ok && i.suit === s && (p === i.low - 2 || p === i.high + 2)) v += 5;
  }
  return v;
}


function dangerScore(c, view, level, seen) {
  const h = view.game.hand;
  const me = view.you;
  const opp = 1 - teamOf(me);
  let d = 0;
  for (const m of h.melds[opp]) if (fitsNatural(m, c)) d += 60;
  if (level === 'hard') {
    const s = suitOf(c);
    const p = pos(c);
    const n = view.game.opts.players;
    for (let seat = 0; seat < n; seat++) {
      if (teamOf(seat) !== opp) continue;
      for (const k of h.known[seat] || []) {
        if (suitOf(k) !== s || isWildCard(k)) continue;
        const dist = Math.abs(pos(k) - p);
        if (dist === 1) d += 18;
        else if (dist === 2) d += 8;
      }
    }
    
    const thrown = seen.get(faceOf(c)) || 0;
    d -= thrown * 4;
    
    d += h.pile.length * (d > 0 ? 2 : 0);
  }
  return d;
}


function seenFaces(view) {
  const m = new Map();
  const add = (c) => m.set(faceOf(c), (m.get(faceOf(c)) || 0) + 1);
  const h = view.game.hand;
  for (const c of h.pile) add(c);
  for (const t of h.melds) for (const j of t) for (const c of j) add(c);
  for (const e of view.game.events) if (e.type === 'discard' && e.card) add(e.card);
  return m;
}

function chooseDiscard(view, level, rng) {
  const h = view.game.hand;
  const hand = h.mine;
  const team = teamOf(view.you);
  const nonWild = hand.filter((c) => !isWildCard(c));
  const pool = nonWild.length ? nonWild : hand.slice();
  
  if (level === 'easy') {
    if (rng() < 0.6) return pool[Math.floor(rng() * pool.length)];
  }
  const seen = level === 'hard' ? seenFaces(view) : new Map();
  const oppClose = level === 'hard' && h.mortoTaken[1 - team];
  let best = null;
  let bestV = Infinity;
  for (const c of pool) {
    let v = keepScore(c, hand, h.melds[team]) + dangerScore(c, view, level, seen);
    
    if (oppClose) v -= cardPoints(c) * 0.6;
    if (v < bestV) { bestV = v; best = c; }
  }
  return best;
}


function emptyOk(h, team, rest, meldsAfter) {
  return rest.length > 1 || mayEmpty(h, team, meldsAfter);
}




export function botAction(view, level = 'medium', rng = Math.random) {
  const next = rngFrom(rng);
  const h = view.game.hand;
  const me = view.you;
  const team = teamOf(me);
  const hand = h.mine;
  const own = h.melds[team];

  if (h.phase === 'draw') {
    const canDraw = h.stockCount > 0 || h.mortosLeft > 0;
    if (!h.pile.length) return { type: 'draw' };
    if (!canDraw) return { type: 'take' };
    const now = layable(hand, own).pts;
    const withPile = layable([...hand, ...h.pile], own).pts;
    const gain = withPile - now;
    if (level === 'easy') {
      const top = h.pile[h.pile.length - 1];
      const plays = own.some((m) => fitsNatural(m, top)) || cleanRuns([...hand, top]).some((r) => r.includes(top));
      return plays && next() < 0.5 ? { type: 'take' } : { type: 'draw' };
    }
    if (level === 'medium') return gain >= 25 ? { type: 'take' } : { type: 'draw' };
    const wilds = h.pile.filter(isWildCard).length;
    const late = h.mortoTaken[1 - team] ? 2 : 0;
    const score = gain + h.pile.length * 3 + wilds * 25 - late * h.pile.reduce((s, c) => s + cardPoints(c), 0) * 0.15;
    return gain > 0 && score >= 20 ? { type: 'take' } : { type: 'draw' };
  }

  
  const skip = level === 'easy' && next() < 0.25;
  if (!skip) {
    
    let best = null;
    for (const c of hand) {
      for (let k = 0; k < own.length; k++) {
        if (!fitsNatural(own[k], c)) continue;
        const rest = hand.filter((x) => x !== c);
        const after = own.map((m, i) => (i === k ? [...m, c] : m));
        if (!emptyOk(h, team, rest, after)) continue;
        const score = own[k].length + 1 === CANASTRA ? 100 : own[k].length;
        if (!best || score > best.score) best = { score, a: { type: 'layoff', meld: k, cards: [c] } };
      }
    }
    if (best) return best.a;
    
    for (const r of cleanRuns(hand)) {
      const rest = hand.filter((x) => !r.includes(x));
      if (!emptyOk(h, team, rest, [...own, r])) continue;
      return { type: 'meld', cards: r };
    }
    
    const wilds = hand.filter(isWildCard);
    if (wilds.length) {
      const w = wilds.find(isJoker) || wilds[0];
      const longHand = hand.length >= 14;
      const ending = h.mortoTaken[1 - team] || h.stockCount < 12;
      const haveClean = hasCleanCanastra(own);
      for (let k = 0; k < own.length; k++) {
        const i = meldInfo(own[k]);
        if (!i.ok || !i.clean) continue;
        
        
        const want = level === 'easy' ? own[k].length >= 3
          : level === 'hard' ? own[k].length === CANASTRA - 1 && (haveClean || h.stockCount < 12)
            : own[k].length === CANASTRA - 1 && (haveClean || ending || own.length >= 3);
        if (!want) continue;
        const after = meldInfo([...own[k], w]);
        if (!after.ok) continue;
        const rest = hand.filter((x) => x !== w);
        const meldsAfter = own.map((m, j) => (j === k ? after.order : m));
        if (!emptyOk(h, team, rest, meldsAfter)) continue;
        return { type: 'layoff', meld: k, cards: [w] };
      }
      const newOk = level === 'easy' || longHand || ending;
      if (newOk) {
        for (const [a, b] of wildPairs(hand)) {
          const cards = [a, b, w];
          const i = meldInfo(cards);
          if (!i.ok) continue;
          const rest = hand.filter((x) => !cards.includes(x));
          if (!emptyOk(h, team, rest, [...own, i.order])) continue;
          return { type: 'meld', cards };
        }
      }
    }
  }

  
  if (hand.length === 1) return { type: 'discard', card: hand[0] };
  const card = chooseDiscard(view, level, next);
  return { type: 'discard', card: card || hand[0] };
}
