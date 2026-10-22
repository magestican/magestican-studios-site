


































import { buildDeck, shuffle, deal, parseCard, faceOf } from '../cards/cards.js';

export const DECK = 'spanish50';
export const HAND = 7;
export const LIMIT = 100;
export const CUT_MAX = 5;
export const ALL_COMBINED = -10;
export const JOKER_POINTS = 50;
export const SUITS = Object.freeze(['e', 'b', 'o', 'c']);

export const isJoker = (c) => c === 'JK1' || c === 'JK2';
export const isCongaCard = (c) => typeof c === 'string' && parseCard(c, DECK) !== null && faceOf(c) === c;
export const rankOf = (c) => (isJoker(c) ? null : Number(String(c).slice(0, -1)));
export const suitOf = (c) => (isJoker(c) ? null : String(c).slice(-1));
export const cardPoints = (c) => (isJoker(c) ? JOKER_POINTS : rankOf(c));
export const sumPoints = (cards) => cards.reduce((s, c) => s + cardPoints(c), 0);







export function meldInfo(cards) {
  if (!Array.isArray(cards) || cards.length < 3 || new Set(cards).size !== cards.length) return null;
  const jokers = cards.filter(isJoker);
  const real = cards.filter((c) => !isJoker(c));
  if (jokers.length > 1 || real.length < 2) return null;
  
  if (cards.length <= 4 && real.every((c) => rankOf(c) === rankOf(real[0]))) {
    return { kind: 'set', rank: rankOf(real[0]), joker: jokers.length === 1 };
  }
  
  const suit = suitOf(real[0]);
  if (!real.every((c) => suitOf(c) === suit)) return null;
  const ranks = real.map(rankOf).sort((a, b) => a - b);
  for (let i = 1; i < ranks.length; i++) if (ranks[i] === ranks[i - 1]) return null;
  const span = ranks[ranks.length - 1] - ranks[0] + 1;
  const gaps = span - ranks.length;
  if (gaps > jokers.length) return null;
  let lo = ranks[0];
  let hi = ranks[ranks.length - 1];
  if (jokers.length && gaps === 0) {
    if (hi < 12) hi += 1; else if (lo > 1) lo -= 1; else return null;
  }
  return { kind: 'run', suit, lo, hi, joker: jokers.length === 1 };
}

export const isMeld = (cards) => meldInfo(cards) !== null;


export const isConga = (cards) => cards.length === HAND && !cards.some(isJoker) && (meldInfo(cards) || {}).kind === 'run';


export function candidateMelds(cards) {
  const out = [];
  const jokers = cards.filter(isJoker);
  const real = cards.filter((c) => !isJoker(c));
  const seen = new Set();
  const push = (m) => { const k = m.slice().sort().join(','); if (!seen.has(k) && isMeld(m)) { seen.add(k); out.push(m); } };
  
  const byRank = new Map();
  for (const c of real) byRank.set(rankOf(c), [...(byRank.get(rankOf(c)) || []), c]);
  for (const group of byRank.values()) {
    const subs = subsets(group).filter((s) => s.length >= 2);
    for (const s of subs) {
      if (s.length >= 3) push(s);
      for (const j of jokers) if (s.length <= 3) push([...s, j]);
    }
  }
  
  for (const suit of SUITS) {
    const mine = real.filter((c) => suitOf(c) === suit);
    if (mine.length < 2) continue;
    const has = new Map(mine.map((c) => [rankOf(c), c]));
    for (let lo = 1; lo <= 12; lo++) {
      for (let hi = lo + 2; hi <= 12; hi++) {
        const missing = [];
        const take = [];
        for (let r = lo; r <= hi; r++) { if (has.has(r)) take.push(has.get(r)); else missing.push(r); }
        if (missing.length === 0) push(take);
        else if (missing.length === 1) for (const j of jokers) push([...take, j]);
      }
    }
    
    for (let lo = 1; lo <= 11; lo++) {
      if (has.has(lo) && has.has(lo + 1)) for (const j of jokers) push([has.get(lo), has.get(lo + 1), j]);
    }
  }
  return out;
}

function subsets(arr) {
  const out = [];
  for (let m = 1; m < 1 << arr.length; m++) out.push(arr.filter((_, i) => m & (1 << i)));
  return out;
}





export function bestMelds(cards) {
  const cands = candidateMelds(cards);
  let best = { melds: [], left: cards.slice(), points: sumPoints(cards) };
  const used = new Set();
  const chosen = [];
  const dfs = (from) => {
    const left = cards.filter((c) => !used.has(c));
    const pts = sumPoints(left);
    if (pts < best.points || (pts === best.points && left.length < best.left.length)) {
      best = { melds: chosen.map((m) => m.slice()), left, points: pts };
    }
    for (let i = from; i < cands.length; i++) {
      const m = cands[i];
      if (m.some((c) => used.has(c))) continue;
      for (const c of m) used.add(c);
      chosen.push(m);
      dfs(i + 1);
      chosen.pop();
      for (const c of m) used.delete(c);
    }
  };
  dfs(0);
  return best;
}


export function extendMeld(meld, card) {
  const next = [...meld, card];
  const a = meldInfo(meld);
  const b = meldInfo(next);
  if (!a || !b || a.kind !== b.kind) return null;
  if (a.kind === 'set' && b.rank !== a.rank) return null;
  return next;
}


export function ligar(left, melds) {
  const ms = melds.map((m) => m.slice());
  let rest = left.slice().sort((x, y) => cardPoints(y) - cardPoints(x));
  let moved = true;
  const laid = [];
  while (moved) {
    moved = false;
    for (const c of rest) {
      const k = ms.findIndex((m) => extendMeld(m, c));
      if (k >= 0) { ms[k] = extendMeld(ms[k], c); laid.push({ card: c, meld: k }); rest = rest.filter((x) => x !== c); moved = true; break; }
    }
  }
  return { melds: ms, left: rest, laid };
}






export function checkCut(hand, melds) {
  if (hand.filter(isJoker).length === 2) return { ok: false, why: 'twoJokers' };
  const seen = new Set();
  for (const m of melds) {
    if (!isMeld(m)) return { ok: false, why: 'notMeld' };
    for (const c of m) { if (!hand.includes(c) || seen.has(c)) return { ok: false, why: 'notMeld' }; seen.add(c); }
  }
  const left = hand.filter((c) => !seen.has(c));
  const points = sumPoints(left);
  if (points > CUT_MAX) return { ok: false, why: 'tooMany' };
  return { ok: true, left, points, conga: melds.length === 1 && isConga(melds[0]) };
}


export function findCut(hand8) {
  let best = null;
  for (const card of new Set(hand8)) {
    const rest = hand8.filter((c, i) => i !== hand8.indexOf(card));
    if (rest.filter(isJoker).length === 2) continue;
    const conga = isConga(rest);
    const b = conga ? { melds: [rest], left: [], points: 0 } : bestMelds(rest);
    if (b.points > CUT_MAX) continue;
    const score = conga ? -1000 : (b.left.length ? b.points : ALL_COMBINED);
    if (!best || score < best.score) best = { card, melds: b.melds, points: b.points, conga, score };
  }
  if (!best) return null;
  const { score, ...out } = best;
  return out;
}




export function newGame({ players = 2, reenganche = false, dealer = null } = {}) {
  const n = Math.min(4, Math.max(2, players | 0));
  return {
    opts: { players: n, reenganche: !!reenganche },
    scores: Array(n).fill(0),
    out: Array(n).fill(false),
    rejoined: Array(n).fill(false),
    handNo: 0,
    dealer: dealer === null ? n - 1 : dealer % n,
    hand: null,
    over: false,
    winner: null,
    events: [],
  };
}

export const activeSeats = (game) => game.scores.map((_, s) => s).filter((s) => !game.out[s]);
const nextActive = (game, s) => {
  const n = game.opts.players;
  for (let k = 1; k <= n; k++) { const t = (s + k) % n; if (!game.out[t]) return t; }
  return s;
};


export const nextDealer = (game) => (game.hand ? nextActive(game, game.dealer) : game.dealer);






export function dealFrom(game, deck, { fixed = null } = {}) {
  const dealer = nextDealer(game);
  const seats = [];
  for (let k = 1; k <= game.opts.players; k++) { const s = (dealer + k) % game.opts.players; if (!game.out[s]) seats.push(s); }
  let d = deck.slice();
  let pre = null;
  if (fixed && Array.isArray(fixed.cards) && fixed.cards.length === HAND && fixed.cards.every(isCongaCard) && new Set(fixed.cards).size === HAND) {
    d = d.filter((c) => !fixed.cards.includes(c));
    pre = fixed;
  }
  const { hands, rest } = deal(d, { hands: seats.length, count: HAND });
  const out = Array.from({ length: game.opts.players }, () => []);
  seats.forEach((s, i) => { out[s] = hands[i]; });
  let stock = rest;
  if (pre && seats.includes(pre.seat)) {
    
    stock = [...stock, ...out[pre.seat]];
    out[pre.seat] = pre.cards.slice();
  }
  const pile = [stock[0]];
  stock = stock.slice(1);
  return { dealer, hands: out, stock, pile };
}


export function startHand(game, { dealer, hands, stock, pile }) {
  if (game.over) return game;
  return {
    ...game,
    dealer,
    handNo: game.hand ? game.handNo + 1 : game.handNo,
    hand: {
      hands: hands.map((h) => h.slice()),
      stock: stock.slice(),
      pile: pile.slice(),
      turn: nextActive(game, dealer),
      phase: 'draw', 
      drawn: null, 
      known: hands.map(() => []), 
      turns: 0,
      reshuffles: 0,
      over: false,
      result: null, 
    },
    events: [],
  };
}

export const actor = (game) => (game.over || !game.hand || game.hand.over ? null : game.hand.turn);


export function legalActions(game, seat) {
  const h = game.hand;
  if (!h || h.over || game.over || h.turn !== seat) return [];
  if (h.phase === 'draw') {
    const out = [{ type: 'draw', from: 'stock', seat }];
    if (h.pile.length) out.push({ type: 'draw', from: 'pile', seat });
    return out;
  }
  
  const cards = h.hands ? h.hands[seat] : (h.mine || []);
  const out = cards.map((card) => ({ type: 'discard', seat, card }));
  if (findCut(cards)) out.push({ type: 'cut', seat });
  return out;
}








export function apply(game, action, { rng = Math.random } = {}) {
  if (!game || game.over) return { error: 'The game is over.' };
  const h = game.hand;
  if (!h || h.over) return { error: 'The hand is over. Deal the next one.' };
  if (!action || typeof action.type !== 'string') return { error: 'That is not a move.' };
  const seat = action.seat;
  if (h.turn !== seat) return { error: 'It is not your turn.' };
  const ev = (g, e) => ({ ...g, events: [...g.events, e] });
  const g0 = { ...game, events: [] };
  if (action.type === 'draw') {
    if (h.phase !== 'draw') return { error: 'You already drew: throw a card or cut.' };
    let stock = h.stock.slice();
    let pile = h.pile.slice();
    let reshuffles = h.reshuffles;
    let card;
    if (action.from === 'pile') {
      if (!pile.length) return { error: 'The pozo is empty.' };
      card = pile.pop();
    } else {
      if (!stock.length) {
        if (pile.length <= 1) return { error: 'There are no cards left to draw.' };
        const top = pile.pop();
        stock = shuffle(pile, rng);
        pile = [top];
        reshuffles += 1;
      }
      card = stock.shift();
    }
    const hands = h.hands.map((x) => x.slice());
    hands[seat].push(card);
    const from = action.from === 'pile' ? 'pile' : 'stock';
    const known = h.known.map((k, s) => (s === seat && from === 'pile' ? [...k, card] : k.slice()));
    return ev({ ...g0, hand: { ...h, hands, stock, pile, reshuffles, known, phase: 'discard', drawn: { from, card } } },
      { kind: 'draw', seat, from, card: from === 'pile' ? card : null });
  }
  if (h.phase !== 'discard') return { error: 'Take a card first, from the mazo or the pozo.' };
  if (action.type === 'discard') {
    const k = h.hands[seat].indexOf(action.card);
    if (k < 0) return { error: 'You do not have that card.' };
    const hands = h.hands.map((x) => x.slice());
    hands[seat].splice(k, 1);
    const next = nextActive(game, seat);
    const known = h.known.map((x, s) => (s === seat ? x.filter((c) => c !== action.card) : x.slice()));
    return ev({ ...g0, hand: { ...h, hands, known, pile: [...h.pile, action.card], phase: 'draw', drawn: null, turn: next, turns: h.turns + 1 } },
      { kind: 'discard', seat, card: action.card });
  }
  if (action.type === 'cut') {
    const hand8 = h.hands[seat];
    let card = action.card;
    let melds = action.melds;
    if (card === undefined || !Array.isArray(melds)) {
      const best = findCut(hand8);
      if (!best) return { error: 'You cannot cut yet: what is left over must add up to 5 or less.' };
      card = best.card; melds = best.melds;
    }
    const k = hand8.indexOf(card);
    if (k < 0) return { error: 'You do not have that card.' };
    const rest = hand8.filter((_, i) => i !== k);
    const chk = checkCut(rest, melds);
    if (!chk.ok) {
      if (chk.why === 'twoJokers') return { error: 'Nobody may cut holding both comodines.' };
      if (chk.why === 'tooMany') return { error: 'You cannot cut yet: what is left over must add up to 5 or less.' };
      return { error: 'Those are not combinations.' };
    }
    return finishHand(ev(g0, { kind: 'cut', seat, conga: chk.conga }), seat, card, melds.map((m) => m.slice()), chk);
  }
  return { error: 'That is not a move.' };
}


function finishHand(game, cutter, card, cutMelds, chk) {
  const h = game.hand;
  const n = game.opts.players;
  const shows = [];
  const add = Array(n).fill(0);
  let tableMelds = cutMelds.map((m) => m.slice());
  shows.push({ seat: cutter, melds: cutMelds, left: chk.left, laid: [], points: chk.left.length ? chk.points : ALL_COMBINED });
  add[cutter] = chk.left.length ? chk.points : ALL_COMBINED;
  for (let k = 1; k < n; k++) {
    const s = (cutter + k) % n;
    if (game.out[s]) continue;
    const b = bestMelds(h.hands[s]);
    const l = ligar(b.left, tableMelds);
    tableMelds = l.melds;
    const pts = sumPoints(l.left);
    shows.push({ seat: s, melds: b.melds, left: l.left, laid: l.laid.map((x) => x.card), points: pts });
    add[s] = pts;
  }
  const scores = game.scores.map((v, s) => v + add[s]);
  let out = game.out.slice();
  const rejoined = game.rejoined.slice();
  const events = [...game.events];
  let over = false;
  let winner = null;
  if (chk.conga) {
    over = true; winner = cutter;
    events.push({ kind: 'conga', seat: cutter });
  } else {
    const goingOut = scores.map((v, s) => !out[s] && v > LIMIT);
    const stillIn = scores.map((v, s) => !out[s] && !goingOut[s]);
    const inCount = stillIn.filter(Boolean).length;
    const top = Math.max(...scores.filter((_, s) => stillIn[s]), 0);
    for (let s = 0; s < n; s++) {
      if (!goingOut[s]) continue;
      if (game.opts.reenganche && !rejoined[s] && inCount >= 2) {
        rejoined[s] = true;
        scores[s] = top;
        events.push({ kind: 'rejoin', seat: s, score: top });
      } else {
        out[s] = true;
        events.push({ kind: 'out', seat: s, score: scores[s] });
      }
    }
    const left = out.map((o, s) => (o ? -1 : s)).filter((s) => s >= 0);
    if (left.length <= 1) {
      over = true;
      
      winner = left.length === 1 ? left[0]
        : [...Array(n).keys()].map((k) => (cutter + k) % n).reduce((a, s) => (scores[s] < scores[a] ? s : a), cutter);
    }
  }
  events.push({ kind: 'hand', cutter, conga: chk.conga, add });
  return {
    ...game,
    scores,
    out,
    rejoined,
    over,
    winner,
    events,
    hand: { ...h, over: true, phase: 'over', result: { cutter, card, conga: chk.conga, shows, add, table: tableMelds } },
  };
}
