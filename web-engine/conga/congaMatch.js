















import { buildDeck, shuffle } from '../cards/cards.js';
import {
  newGame, dealFrom, startHand, apply, actor, legalActions, isCongaCard, DECK, HAND,
} from './congaRules.js';


export const CMSG = Object.freeze({
  HELLO: 'fcg-hello',
  VIEW: 'fcg-view',
  ACT: 'fcg-act',
});

export const SOLO = 'you';
export const MAX_SEATS = 4;


export function handSeed(seed, handNo, k = 0) {
  let h = (seed >>> 0) ^ Math.imul(handNo + 1, 0x9E3779B1) ^ Math.imul(k + 1, 0x7F4A7C15);
  h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B);
  h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
  return ((h ^ (h >>> 16)) >>> 0) || 1;
}

function dealGame(game, seed, fixed) {
  const deck = shuffle(buildDeck(DECK), handSeed(seed, game.hand ? game.handNo + 1 : 0));
  return startHand(game, dealFrom(game, deck, { fixed: fixed ? { seat: 0, cards: fixed } : null }));
}





export function createMatch({ seats = [SOLO, 'bot:medium#1'], reenganche = false, seed = 1, dealer = null, fixedHand = null } = {}) {
  const players = Math.min(MAX_SEATS, Math.max(2, seats.length));
  const s = seats.slice(0, players);
  const game = newGame({ players, reenganche, dealer });
  return { seats: s, seed: seed >>> 0, game: dealGame(game, seed, fixedHand) };
}

export const seatOf = (match, id) => match.seats.indexOf(id);
export const isBot = (id) => typeof id === 'string' && id.startsWith('bot:');
export const botLevel = (id) => (isBot(id) ? id.slice(4).split('#')[0] : null);


export function act(match, id, action) {
  const seat = seatOf(match, id);
  if (seat < 0) return { error: 'You are watching this game, not playing it.' };
  const a = sanitiseAction(action);
  if (!a) return { error: 'That is not a move.' };
  const h = match.game.hand;
  const rng = handSeed(match.seed, match.game.handNo, 1 + (h ? h.reshuffles : 0));
  const g = apply(match.game, { ...a, seat }, { rng });
  if (g.error) return { error: g.error };
  return { match: { ...match, game: g } };
}


export function nextHand(match) {
  const g = match.game;
  if (g.over || !g.hand || !g.hand.over) return match;
  return { ...match, game: dealGame(g, match.seed, null) };
}


export function rematch(match, seed) {
  const g = match.game;
  return createMatch({ seats: match.seats, reenganche: g.opts.reenganche, seed, dealer: (g.dealer + 1) % g.opts.players });
}


export function sanitiseAction(a) {
  if (!a || typeof a !== 'object') return null;
  if (a.type === 'draw') return { type: 'draw', from: a.from === 'pile' ? 'pile' : 'stock' };
  if (a.type === 'discard') return isCongaCard(a.card) ? { type: 'discard', card: a.card } : null;
  if (a.type === 'cut') {
    if (a.card === undefined && a.melds === undefined) return { type: 'cut' };
    if (!isCongaCard(a.card) || !Array.isArray(a.melds) || a.melds.length > 3) return null;
    if (!a.melds.every((m) => Array.isArray(m) && m.length >= 3 && m.length <= HAND && m.every(isCongaCard))) return null;
    return { type: 'cut', card: a.card, melds: a.melds.map((m) => m.slice()) };
  }
  return null;
}


const publicEvent = (e) => {
  const o = { kind: e.kind };
  for (const k of ['seat', 'from', 'card', 'conga', 'score', 'cutter']) if (e[k] !== undefined) o[k] = e[k];
  if (e.kind === 'draw' && e.from !== 'pile') o.card = null;
  if (Array.isArray(e.add)) o.add = e.add.slice();
  return o;
};


export function viewFor(match, seat) {
  const g = match.game;
  const h = g.hand;
  const n = g.opts.players;
  const mineSeat = seat >= 0 && seat < n;
  const hand = h ? {
    mine: mineSeat ? h.hands[seat].slice() : [],
    counts: h.hands.map((x) => x.length),
    known: h.known.map((k, s) => (s === seat ? [] : k.slice())),
    stockCount: h.stock.length,
    pile: h.pile.slice(),
    turn: h.turn,
    phase: h.phase,
    drawn: h.drawn ? { from: h.drawn.from, card: h.drawn.from === 'pile' || h.turn === seat ? h.drawn.card : null } : null,
    turns: h.turns,
    over: h.over,
    result: h.result ? JSON.parse(JSON.stringify(h.result)) : null,
  } : null;
  return {
    seats: match.seats.slice(),
    you: mineSeat ? seat : -1,
    game: {
      opts: { ...g.opts },
      scores: g.scores.slice(),
      out: g.out.slice(),
      rejoined: g.rejoined.slice(),
      handNo: g.handNo,
      dealer: g.dealer,
      hand,
      over: g.over,
      winner: g.winner,
      events: g.events.map(publicEvent),
    },
  };
}


export const PUBLIC_SEAT = -1;
export const publicView = (match) => viewFor(match, PUBLIC_SEAT);


export function viewForPeer(match, id) {
  const seat = seatOf(match, id);
  return seat < 0 ? publicView(match) : viewFor(match, seat);
}


export function sanitiseView(v) {
  if (!v || typeof v !== 'object' || !v.game || typeof v.game !== 'object') return null;
  const g = v.game;
  const n = Math.min(MAX_SEATS, Math.max(2, (g.opts && g.opts.players) | 0));
  const h = g.hand;
  if (!h || typeof h !== 'object') return null;
  const cards = (arr, max = 50) => (Array.isArray(arr) ? arr.filter(isCongaCard).slice(0, max) : []);
  const num = (x, max) => Math.max(0, Math.min(max, Number(x) || 0));
  const bools = (arr) => Array.from({ length: n }, (_, i) => !!(Array.isArray(arr) && arr[i]));
  return {
    seats: Array.isArray(v.seats) ? v.seats.filter((s) => typeof s === 'string').slice(0, n) : [],
    you: Number.isInteger(v.you) && v.you >= 0 && v.you < n ? v.you : -1,
    game: {
      opts: { players: n, reenganche: !!(g.opts && g.opts.reenganche) },
      scores: Array.from({ length: n }, (_, i) => (Array.isArray(g.scores) ? Number(g.scores[i]) || 0 : 0)),
      out: bools(g.out),
      rejoined: bools(g.rejoined),
      handNo: num(g.handNo, 1e6),
      dealer: num(g.dealer, n - 1),
      over: !!g.over,
      winner: Number.isInteger(g.winner) && g.winner >= 0 && g.winner < n ? g.winner : null,
      events: Array.isArray(g.events) ? g.events.slice(-40).filter((e) => e && typeof e === 'object') : [],
      hand: {
        mine: cards(h.mine, 8),
        counts: Array.from({ length: n }, (_, i) => (Array.isArray(h.counts) ? num(h.counts[i], 8) : 0)),
        known: Array.from({ length: n }, (_, i) => (Array.isArray(h.known) ? cards(h.known[i], 8) : [])),
        stockCount: num(h.stockCount, 50),
        pile: cards(h.pile),
        turn: num(h.turn, n - 1),
        phase: ['draw', 'discard', 'over'].includes(h.phase) ? h.phase : 'draw',
        drawn: h.drawn && (h.drawn.from === 'pile' || h.drawn.from === 'stock')
          ? { from: h.drawn.from, card: isCongaCard(h.drawn.card) ? h.drawn.card : null } : null,
        turns: num(h.turns, 1e6),
        over: !!h.over,
        result: h.result && Array.isArray(h.result.shows) ? h.result : null,
      },
    },
  };
}








export function echoView(view, action) {
  if (!view || !Number.isInteger(view.you) || view.you < 0 || !view.game || !view.game.hand) return null;
  const a = sanitiseAction(action);
  if (!a || a.type === 'cut') return null;
  const v = JSON.parse(JSON.stringify(view));
  const h = v.game.hand;
  const you = v.you;
  const echo = { type: a.type, cards: [], incoming: 0 };
  if (a.type === 'draw') {
    if (h.phase !== 'draw') return null;
    if (a.from === 'pile') {
      if (!h.pile.length) return null;
      const c = h.pile.pop();
      h.mine.push(c);
      echo.cards = [c];
    } else {
      if (!(h.stockCount > 0)) return null;
      h.stockCount -= 1;
      echo.incoming = 1;
    }
    h.counts[you] += 1;
    h.phase = 'discard';
  } else {
    const k = h.mine.indexOf(a.card);
    if (k < 0 || h.phase !== 'discard') return null;
    h.mine.splice(k, 1);
    h.pile.push(a.card);
    h.counts[you] -= 1;
    echo.cards = [a.card];
  }
  v.echo = echo;
  return v;
}


export function actorId(match) {
  const s = actor(match.game);
  return s === null ? null : match.seats[s];
}

export function legalFor(match, id) {
  const s = seatOf(match, id);
  return s < 0 ? [] : legalActions(match.game, s);
}





export function seatsWith(seats, id, started) {
  if (!id || seats.includes(id) || started) return seats;
  const k = seats.findIndex((s, i) => i > 0 && (!s || isBot(s)));
  if (k < 0) return seats;
  const out = seats.slice();
  out[k] = id;
  return out;
}
