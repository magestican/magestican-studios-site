



















import { SeededRng } from '../rng/seededRng.js';


export const DECKS = Object.freeze({
  spanish40: Object.freeze({
    id: 'spanish40',
    suits: Object.freeze(['e', 'b', 'o', 'c']),
    ranks: Object.freeze(['1', '2', '3', '4', '5', '6', '7', '10', '11', '12']),
    jokers: Object.freeze([]),
  }),
  french52: Object.freeze({
    id: 'french52',
    suits: Object.freeze(['S', 'H', 'D', 'C']),
    ranks: Object.freeze(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']),
    jokers: Object.freeze(['JK1', 'JK2']),
  }),
});


export const RED_SUITS = Object.freeze(['H', 'D']);


export const faceOf = (id) => {
  const s = String(id);
  const k = s.indexOf('#');
  return k < 0 ? s : s.slice(0, k);
};


export const copyOf = (id) => {
  const s = String(id);
  const k = s.indexOf('#');
  return k < 0 ? 0 : Number(s.slice(k + 1)) || 0;
};


export const cardId = (rank, suit) => `${rank}${suit}`;





export function parseCard(id, deck = 'spanish40') {
  const d = typeof deck === 'string' ? DECKS[deck] : deck;
  if (!d || id === undefined || id === null) return null;
  const face = faceOf(id);
  const copy = copyOf(id);
  if (d.jokers.includes(face)) return { face, rank: null, suit: null, joker: true, copy };
  const suit = face.slice(-1);
  const rank = face.slice(0, -1);
  if (!d.suits.includes(suit) || !d.ranks.includes(rank)) return null;
  return { face, rank, suit, joker: false, copy };
}

export const isCard = (id, deck = 'spanish40') => parseCard(id, deck) !== null;


export function faces(deck = 'spanish40') {
  const d = typeof deck === 'string' ? DECKS[deck] : deck;
  const out = [];
  for (const s of d.suits) for (const r of d.ranks) out.push(cardId(r, s));
  return out.concat(d.jokers);
}






export function buildDeck(deck = 'spanish40', { copies = 1, jokers } = {}) {
  const d = typeof deck === 'string' ? DECKS[deck] : deck;
  const plain = [];
  for (const s of d.suits) for (const r of d.ranks) plain.push(cardId(r, s));
  const out = [];
  for (let c = 0; c < copies; c++) for (const f of plain) out.push(copies > 1 ? `${f}#${c}` : f);
  const nJ = jokers === undefined ? d.jokers.length * copies : jokers;
  if (nJ > 0 && !d.jokers.length) throw new Error(`${d.id} has no jokers`);
  for (let j = 0; j < nJ; j++) {
    const f = d.jokers[j % d.jokers.length];
    const c = Math.floor(j / d.jokers.length);
    out.push(nJ > d.jokers.length ? `${f}#${c}` : f);
  }
  return out;
}





export function rngFrom(seed) {
  if (typeof seed === 'function') return seed;
  const r = new SeededRng((Number(seed) >>> 0) || 1);
  return () => r.next();
}


export function shuffle(cards, rng = Math.random) {
  const next = rngFrom(rng);
  const a = cards.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}







export function deal(deck, { hands = 2, count = 3, order = 'round', start = 0 } = {}) {
  if (hands * count > deck.length) throw new Error(`cannot deal ${hands}x${count} from ${deck.length} cards`);
  const out = Array.from({ length: hands }, () => []);
  let k = 0;
  if (order === 'block') {
    for (let h = 0; h < hands; h++) {
      const seat = (start + h) % hands;
      for (let c = 0; c < count; c++) out[seat].push(deck[k++]);
    }
  } else {
    for (let c = 0; c < count; c++) {
      for (let h = 0; h < hands; h++) out[(start + h) % hands].push(deck[k++]);
    }
  }
  return { hands: out, rest: deck.slice(k) };
}


export function removeCard(hand, id) {
  const k = hand.indexOf(id);
  if (k < 0) return null;
  return hand.slice(0, k).concat(hand.slice(k + 1));
}


export function rankIndex(rank, deck = 'spanish40') {
  const d = typeof deck === 'string' ? DECKS[deck] : deck;
  return d.ranks.indexOf(String(rank));
}





export function sortHand(hand, { deck = 'spanish40', key } = {}) {
  const d = typeof deck === 'string' ? DECKS[deck] : deck;
  const k = key || ((id) => {
    const p = parseCard(id, d);
    if (!p) return 1e9;
    if (p.joker) return 1e6 + d.jokers.indexOf(p.face);
    return d.suits.indexOf(p.suit) * 100 + d.ranks.indexOf(p.rank);
  });
  return hand.map((id, i) => ({ id, i, v: k(id) }))
    .sort((a, b) => (a.v - b.v) || (a.i - b.i)).map((x) => x.id);
}







export function trickWinner(plays, strengthOf, sideOf = (s) => s) {
  let best = -1;
  let top = -Infinity;
  plays.forEach((p, i) => {
    const v = strengthOf(p.card);
    if (v > top) { top = v; best = i; }
  });
  if (best < 0) return { best: -1, tie: false };
  const teams = new Set(plays.filter((p) => strengthOf(p.card) === top).map((p) => sideOf(p.seat)));
  return { best, tie: teams.size > 1 };
}







export function isRun(cards, { deck = 'french52', isWild = () => false, maxWild = 1, aceHigh = true, min = 3 } = {}) {
  const d = typeof deck === 'string' ? DECKS[deck] : deck;
  if (!Array.isArray(cards) || cards.length < min) return { ok: false };
  const parsed = cards.map((id) => ({ id, p: parseCard(id, d) }));
  if (parsed.some((x) => !x.p)) return { ok: false };
  
  
  const tryWith = (wildIdx) => {
    const wilds = parsed.filter((_, i) => wildIdx.has(i));
    const nat = parsed.filter((_, i) => !wildIdx.has(i));
    if (wilds.length > maxWild || !nat.length) return null;
    const suit = nat[0].p.suit;
    if (nat.some((x) => x.p.joker || x.p.suit !== suit)) return null;
    for (const high of aceHigh ? [false, true] : [false]) {
      const idx = nat.map((x) => {
        const r = d.ranks.indexOf(x.p.rank);
        return high && x.p.rank === d.ranks[0] ? d.ranks.length : r;
      }).sort((a, b) => a - b);
      if (new Set(idx).size !== idx.length) continue;
      const gaps = idx[idx.length - 1] - idx[0] + 1 - idx.length;
      if (gaps > wilds.length) continue;
      const span = idx.length + wilds.length;
      let low = idx[0];
      const maxTop = high ? d.ranks.length : d.ranks.length - 1;
      let top = low + span - 1;
      if (top > maxTop) { low -= top - maxTop; top = maxTop; }
      if (low < 0) continue;
      return { ok: true, suit, low, high: top };
    }
    return null;
  };
  const cand = parsed.map((x, i) => (x.p.joker || isWild(x.id) ? i : -1)).filter((i) => i >= 0);
  
  const sets = [new Set()];
  for (const i of cand) sets.push(new Set([i]));
  sets.push(new Set(cand.filter((i) => parsed[i].p.joker)));
  sets.push(new Set(cand));
  for (const s of sets) {
    const r = tryWith(s);
    if (r) return r;
  }
  return { ok: false };
}














export function layRun(cards, { deck = 'french52', isWild = () => false, maxWild = 1, min = 3 } = {}) {
  const d = typeof deck === 'string' ? DECKS[deck] : deck;
  if (!Array.isArray(cards) || cards.length < min) return { ok: false };
  if (new Set(cards).size !== cards.length) return { ok: false };
  const parsed = cards.map((id) => ({ id, p: parseCard(id, d) }));
  if (parsed.some((x) => !x.p)) return { ok: false };
  const top = d.ranks.length + 1; 
  const jokers = [];
  const cand = [];
  parsed.forEach((x, i) => { if (x.p.joker) jokers.push(i); else if (isWild(x.id)) cand.push(i); });
  if (jokers.length > maxWild) return { ok: false };
  
  const wildSets = [];
  const room = maxWild - jokers.length;
  const pick = (from, k, acc) => {
    if (acc.length === k) { wildSets.push(new Set([...jokers, ...acc])); return; }
    for (let i = from; i < cand.length; i++) pick(i + 1, k, [...acc, cand[i]]);
  };
  for (let k = 0; k <= Math.min(room, cand.length); k++) pick(0, k, []);
  for (const ws of wildSets) {
    const nat = parsed.filter((_, i) => !ws.has(i));
    const wild = parsed.filter((_, i) => ws.has(i));
    if (!nat.length) continue;
    const suit = nat[0].p.suit;
    if (nat.some((x) => x.p.suit !== suit)) continue;
    const aces = nat.filter((x) => x.p.rank === d.ranks[0]);
    const fixed = nat.filter((x) => x.p.rank !== d.ranks[0]).map((x) => ({ id: x.id, pos: d.ranks.indexOf(x.p.rank) + 1 }));
    for (let mask = 0; mask < (1 << aces.length); mask++) {
      const placed = fixed.concat(aces.map((x, k) => ({ id: x.id, pos: (mask >> k) & 1 ? top : 1 })));
      const posSet = new Set(placed.map((x) => x.pos));
      if (posSet.size !== placed.length) continue;
      const ps = [...posSet].sort((a, b) => a - b);
      let lo = ps[0];
      let hi = ps[ps.length - 1];
      const gaps = hi - lo + 1 - placed.length;
      if (gaps > wild.length) continue;
      let extra = wild.length - gaps;
      while (extra > 0 && hi < top) { hi++; extra--; }
      while (extra > 0 && lo > 1) { lo--; extra--; }
      if (extra > 0) continue;
      const byPos = new Map(placed.map((x) => [x.pos, x.id]));
      const spare = wild.map((x) => x.id);
      const order = [];
      const wildAt = [];
      for (let pos = lo; pos <= hi; pos++) {
        if (byPos.has(pos)) order.push(byPos.get(pos));
        else { order.push(spare.shift()); wildAt.push(pos); }
      }
      return { ok: true, suit, low: lo, high: hi, order, wilds: wild.map((x) => x.id), wildAt };
    }
  }
  return { ok: false };
}
