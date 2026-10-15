

















import { buildDeck, shuffle, deal } from '../cards/cards.js';
import {
  newGame, startHand, apply, actor, legalActions, isTrucoCard, envidoPoints, hasFlor,
} from './trucoRules.js';


export const TMSG = Object.freeze({
  HELLO: 'ftr-hello',
  VIEW: 'ftr-view',
  ACT: 'ftr-act',
  SAY: 'ftr-say',
});

export const SOLO = 'you';


export function handSeed(seed, handNo) {
  let h = (seed >>> 0) ^ Math.imul(handNo + 1, 0x9E3779B1);
  h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B);
  h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
  return ((h ^ (h >>> 16)) >>> 0) || 1;
}





export function dealHands(players, mano, seed, { fixed = null, fixedSeat = 0 } = {}) {
  let deck = shuffle(buildDeck('spanish40'), seed);
  let pre = null;
  if (Array.isArray(fixed) && fixed.length === 3 && fixed.every(isTrucoCard) && new Set(fixed).size === 3) {
    deck = deck.filter((c) => !fixed.includes(c));
    pre = fixed.slice();
  }
  const { hands } = deal(deck, { hands: players, count: 3, start: mano });
  if (pre) hands[fixedSeat] = pre;
  return hands;
}






export function createMatch({ seats = [SOLO, 'bot:medium'], target = 15, flor = false, seed = 1, mano = 0, fixedHand = null } = {}) {
  const players = seats.length === 4 ? 4 : 2;
  const s = seats.slice(0, players);
  let game = newGame({ players, target, flor, mano });
  const hands = dealHands(players, game.mano, handSeed(seed, 0), { fixed: fixedHand, fixedSeat: 0 });
  game = startHand(game, hands);
  return { seats: s, seed: seed >>> 0, game, history: [] };
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
  return { match: { ...match, game: g, history: [...match.history, { seat, ...a }].slice(-60) } };
}


export function nextHand(match) {
  const g = match.game;
  if (g.over || !g.hand || !g.hand.over) return match;
  const players = g.opts.players;
  const mano = (g.mano + 1) % players;
  const hands = dealHands(players, mano, handSeed(match.seed, g.handNo + 1));
  return { ...match, game: startHand(g, hands), history: [] };
}


export function rematch(match, seed) {
  const g = match.game;
  return createMatch({
    seats: match.seats, target: g.opts.target, flor: g.opts.flor, seed, mano: (g.mano + 1) % g.opts.players,
  });
}


export function sanitiseAction(a) {
  if (!a || typeof a !== 'object') return null;
  const types = ['play', 'envido', 'truco', 'quiero', 'noquiero', 'flor', 'contraflor', 'achico', 'mazo'];
  if (!types.includes(a.type)) return null;
  const out = { type: a.type };
  if (a.type === 'play') { if (!isTrucoCard(a.card)) return null; out.card = a.card; }
  if (a.type === 'envido') { if (!['envido', 'real', 'falta'].includes(a.call)) return null; out.call = a.call; }
  if (a.type === 'contraflor') out.resto = !!a.resto;
  return out;
}






export function viewFor(match, seat) {
  const g = match.game;
  const h = g.hand;
  const n = g.opts.players;
  const hand = h ? {
    hands: Array.from({ length: n }, (_, s) => (s === seat ? h.hands[s].slice() : h.hands[s].map(() => null))),
    dealt: Array.from({ length: n }, (_, s) => (s === seat ? h.dealt[s].slice() : null)),
    bazas: h.bazas.map((b) => b.map((p) => ({ seat: p.seat, card: p.card }))),
    results: h.results.slice(),
    leads: h.leads.slice(),
    turn: h.turn,
    truco: { ...h.truco },
    pending: h.pending ? { ...h.pending } : null,
    trucoWait: h.trucoWait ? { ...h.trucoWait } : null,
    envido: { chain: h.envido.chain.slice(), done: h.envido.done, result: h.envido.result ? { ...h.envido.result } : null },
    flor: { sung: h.flor.sung.slice(), done: h.flor.done, result: h.flor.result ? { ...h.flor.result } : null },
    over: h.over,
    winner: h.winner,
    worth: h.worth,
    reason: h.reason,
    calls: (h.calls || []).map((c) => ({ ...c })),
  } : null;
  return {
    seats: match.seats.slice(),
    you: seat,
    game: {
      opts: { ...g.opts },
      scores: g.scores.slice(),
      handNo: g.handNo,
      mano: g.mano,
      hand,
      over: g.over,
      winner: g.winner,
      events: g.events.map((e) => ({ ...e })),
    },
  };
}


export function sanitiseView(v) {
  if (!v || typeof v !== 'object' || !v.game || typeof v.game !== 'object') return null;
  const g = v.game;
  const n = g.opts && g.opts.players === 4 ? 4 : 2;
  const cards = (arr) => (Array.isArray(arr) ? arr.map((c) => (isTrucoCard(c) ? c : null)).slice(0, 3) : []);
  const h = g.hand;
  if (!h || !Array.isArray(h.hands) || h.hands.length !== n) return null;
  return {
    seats: Array.isArray(v.seats) ? v.seats.filter((s) => typeof s === 'string').slice(0, n) : [],
    you: Number.isInteger(v.you) && v.you >= 0 && v.you < n ? v.you : -1,
    game: {
      ...g,
      opts: { players: n, target: g.opts.target === 30 ? 30 : 15, flor: !!g.opts.flor },
      scores: Array.isArray(g.scores) ? g.scores.slice(0, 2).map((x) => Math.max(0, Number(x) || 0)) : [0, 0],
      hand: { ...h, hands: h.hands.map(cards), dealt: Array.isArray(h.dealt) ? h.dealt.map((d) => (d ? cards(d) : null)) : [] },
      events: Array.isArray(g.events) ? g.events.slice(0, 20) : [],
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


export function myNumbers(view) {
  const h = view.game.hand;
  const mine = h && h.dealt[view.you];
  if (!mine) return null;
  return { envido: envidoPoints(mine), flor: hasFlor(mine) };
}







export function seatsWith(seats, id, started) {
  if (!id || seats.includes(id) || started) return seats;
  const order = seats.length === 4 ? [2, 1, 3] : [1];
  const k = order.find((i) => !seats[i] || isBot(seats[i]));
  if (k === undefined) return seats;
  const out = seats.slice();
  out[k] = id;
  return out;
}
