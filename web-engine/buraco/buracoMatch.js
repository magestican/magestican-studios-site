















import { buildDeck, shuffle, deal, faceOf } from '../cards/cards.js';
import {
  newGame, startHand, apply, actor, legalActions, isBuracoCard, HAND_SIZE, MORTO_SIZE, TARGETS, teamOf,
} from './buracoRules.js';


export const BMSG = Object.freeze({
  HELLO: 'fbu-hello',
  VIEW: 'fbu-view',
  ACT: 'fbu-act',
});

export const SOLO = 'you';


export function handSeed(seed, handNo) {
  let h = (seed >>> 0) ^ Math.imul(handNo + 1, 0x9E3779B1);
  h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B);
  h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
  return ((h ^ (h >>> 16)) >>> 0) || 1;
}





export function pickFaces(deck, wanted) {
  const left = deck.slice();
  const out = [];
  for (const w of wanted || []) {
    const k = left.findIndex((c) => faceOf(c) === faceOf(w));
    if (k >= 0) { out.push(left[k]); left.splice(k, 1); }
  }
  return { picked: out, rest: left };
}





export function dealHand(players, dealer, seed, { fixed = null } = {}) {
  let deck = shuffle(buildDeck('french52', { copies: 2, jokers: 4 }), seed);
  let pre = null;
  if (Array.isArray(fixed) && fixed.length) {
    const { picked, rest } = pickFaces(deck, fixed.slice(0, HAND_SIZE));
    pre = picked;
    deck = rest;
  }
  const start = (dealer + 1) % players;
  const need = pre ? HAND_SIZE - pre.length : 0;
  const { hands, rest } = deal(deck, { hands: players, count: HAND_SIZE, start });
  let stockFrom = rest;
  if (pre) {
    
    const own = hands[0];
    hands[0] = [...pre, ...own.slice(0, need)];
    stockFrom = [...own.slice(need), ...rest];
  }
  const m = deal(stockFrom, { hands: 2, count: MORTO_SIZE, order: 'block' });
  return { hands, mortos: m.hands, stock: m.rest };
}





export function createMatch({ seats = [SOLO, 'bot:medium#1'], target = 3000, seed = 1, dealer = 0, fixedHand = null, mortoTaken = false } = {}) {
  const players = seats.length === 4 ? 4 : 2;
  const s = seats.slice(0, players);
  let game = newGame({ players, target, dealer });
  const d = dealHand(players, game.dealer, handSeed(seed, 0), { fixed: fixedHand });
  game = startHand(game, d, { mortoTaken: [!!mortoTaken, false] });
  return { seats: s, seed: seed >>> 0, game };
}

export const seatOf = (match, id) => match.seats.indexOf(id);
export const isBot = (id) => typeof id === 'string' && id.startsWith('bot:');
export const botLevel = (id) => (isBot(id) ? id.slice(4).split('#')[0] : null);


export function act(match, id, action) {
  const seat = seatOf(match, id);
  if (seat < 0) return { error: 'You are watching this game, not playing it.' };
  const a = sanitiseAction(action);
  if (!a) return { error: 'That is not a move.' };
  const g = apply(match.game, { ...a, seat });
  if (g.error) return { error: g.error };
  return { match: { ...match, game: g } };
}


export function nextHand(match) {
  const g = match.game;
  if (g.over || !g.hand || !g.hand.over) return match;
  const players = g.opts.players;
  const dealer = (g.dealer + 1) % players;
  const d = dealHand(players, dealer, handSeed(match.seed, g.handNo + 1));
  return { ...match, game: startHand(g, d) };
}


export function rematch(match, seed) {
  const g = match.game;
  return createMatch({ seats: match.seats, target: g.opts.target, seed, dealer: (g.dealer + 1) % g.opts.players });
}


export function sanitiseAction(a) {
  if (!a || typeof a !== 'object') return null;
  const out = { type: a.type };
  if (a.type === 'draw' || a.type === 'take') return out;
  if (a.type === 'discard') { if (!isBuracoCard(a.card)) return null; out.card = a.card; return out; }
  if (a.type === 'meld' || a.type === 'layoff') {
    if (!Array.isArray(a.cards) || !a.cards.length || a.cards.length > 60 || !a.cards.every(isBuracoCard)) return null;
    out.cards = a.cards.slice();
    if (a.type === 'layoff') { if (!Number.isInteger(a.meld) || a.meld < 0 || a.meld > 60) return null; out.meld = a.meld; }
    return out;
  }
  return null;
}


const publicEvent = (e) => {
  const o = { type: e.type };
  for (const k of ['seat', 'how', 'meld', 'canastra', 'reason', 'outBy', 'card']) if (e[k] !== undefined) o[k] = e[k];
  if (Array.isArray(e.cards)) o.cards = e.cards.slice();
  return o;
};






export function viewFor(match, seat) {
  const g = match.game;
  const h = g.hand;
  const n = g.opts.players;
  const hand = h ? {
    mine: seat >= 0 && seat < n ? h.hands[seat].slice() : [],
    counts: h.hands.map((x) => x.length),
    known: h.known.map((k, s) => (s === seat ? [] : k.slice())),
    mortosLeft: h.mortos.length,
    mortoTaken: h.mortoTaken.slice(),
    stockCount: h.stock.length,
    pile: h.pile.slice(),
    melds: h.melds.map((team) => team.map((m) => m.slice())),
    turn: h.turn,
    phase: h.phase,
    drew: h.drew,
    over: h.over,
    reason: h.reason,
    outBy: h.outBy,
    result: h.result ? { reason: h.result.reason, outBy: h.result.outBy, lines: h.result.lines.map((l) => ({ ...l, canastras: { ...l.canastras } })) } : null,
    turns: h.turns,
  } : null;
  return {
    seats: match.seats.slice(),
    you: seat,
    game: {
      opts: { ...g.opts },
      scores: g.scores.slice(),
      handNo: g.handNo,
      dealer: g.dealer,
      hand,
      over: g.over,
      winner: g.winner,
      events: g.events.map(publicEvent),
      past: g.past.map((p) => ({ handNo: p.handNo, totals: p.totals.slice(), reason: p.reason })),
    },
  };
}






export const PUBLIC_SEAT = -1;









export function publicView(match) {
  return viewFor(match, PUBLIC_SEAT);
}






export function viewForPeer(match, id) {
  const seat = seatOf(match, id);
  return seat < 0 ? publicView(match) : viewFor(match, seat);
}


export function sanitiseView(v) {
  if (!v || typeof v !== 'object' || !v.game || typeof v.game !== 'object') return null;
  const g = v.game;
  const n = g.opts && g.opts.players === 4 ? 4 : 2;
  const h = g.hand;
  if (!h || typeof h !== 'object') return null;
  const cards = (arr, max = 120) => (Array.isArray(arr) ? arr.filter(isBuracoCard).slice(0, max) : []);
  const num = (x, max) => Math.max(0, Math.min(max, Number(x) || 0));
  return {
    seats: Array.isArray(v.seats) ? v.seats.filter((s) => typeof s === 'string').slice(0, n) : [],
    you: Number.isInteger(v.you) && v.you >= 0 && v.you < n ? v.you : -1,
    game: {
      opts: { players: n, target: TARGETS.includes(g.opts && g.opts.target) ? g.opts.target : 3000 },
      scores: Array.isArray(g.scores) ? g.scores.slice(0, 2).map((x) => Number(x) || 0) : [0, 0],
      handNo: num(g.handNo, 1e6),
      dealer: num(g.dealer, n - 1),
      over: !!g.over,
      winner: g.winner === 0 || g.winner === 1 ? g.winner : null,
      events: Array.isArray(g.events) ? g.events.slice(-40).filter((e) => e && typeof e === 'object') : [],
      past: Array.isArray(g.past) ? g.past.slice(-200) : [],
      hand: {
        mine: cards(h.mine),
        counts: Array.isArray(h.counts) ? h.counts.slice(0, n).map((x) => num(x, 120)) : [],
        known: Array.isArray(h.known) ? h.known.slice(0, n).map((k) => cards(k)) : [],
        mortosLeft: num(h.mortosLeft, 2),
        mortoTaken: Array.isArray(h.mortoTaken) ? h.mortoTaken.slice(0, 2).map((x) => !!x) : [false, false],
        stockCount: num(h.stockCount, 108),
        pile: cards(h.pile),
        melds: Array.isArray(h.melds) ? h.melds.slice(0, 2).map((t) => (Array.isArray(t) ? t.slice(0, 40).map((m) => cards(m, 14)) : [])) : [[], []],
        turn: num(h.turn, n - 1),
        phase: h.phase === 'play' ? 'play' : 'draw',
        drew: h.drew === 'pile' || h.drew === 'stock' ? h.drew : null,
        over: !!h.over,
        reason: typeof h.reason === 'string' ? h.reason : null,
        outBy: Number.isInteger(h.outBy) ? h.outBy : null,
        result: h.result && Array.isArray(h.result.lines) ? h.result : null,
        turns: num(h.turns, 1e6),
      },
    },
  };
}


export function actorId(match) {
  const s = actor(match.game);
  return s === null ? null : match.seats[s];
}

export function legalFor(match, id) {
  const s = seatOf(match, id);
  return s < 0 ? [] : legalActions(match.game, s);
}


export { teamOf };





export function seatsWith(seats, id, started) {
  if (!id || seats.includes(id) || started) return seats;
  const order = seats.length === 4 ? [2, 1, 3] : [1];
  const k = order.find((i) => !seats[i] || isBot(seats[i]));
  if (k === undefined) return seats;
  const out = seats.slice();
  out[k] = id;
  return out;
}
