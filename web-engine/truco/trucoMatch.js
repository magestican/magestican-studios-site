

















import { buildDeck, shuffle, deal } from '../cards/cards.js';
import {
  newGame, startHand, apply, actor, legalActions, isTrucoCard, envidoPoints, hasFlor, florPoints,
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





export function dealHands(players, mano, seed, opts = {}) {
  return dealTable(players, mano, seed, opts).hands;
}







export function dealTable(players, mano, seed, { fixed = null, fixedSeat = 0, fixedMuestra = null } = {}) {
  let deck = shuffle(buildDeck('spanish40'), seed);
  let pre = null;
  if (Array.isArray(fixed) && fixed.length === 3 && fixed.every(isTrucoCard) && new Set(fixed).size === 3) {
    deck = deck.filter((c) => !fixed.includes(c));
    pre = fixed.slice();
  }
  const mFixed = isTrucoCard(fixedMuestra) && !(pre || []).includes(fixedMuestra) ? fixedMuestra : null;
  if (mFixed) deck = deck.filter((c) => c !== mFixed);
  const { hands, rest } = deal(deck, { hands: players, count: 3, start: mano });
  if (pre) hands[fixedSeat] = pre;
  return { hands, muestra: mFixed || rest[0] };
}






export function createMatch({
  seats = [SOLO, 'bot:medium'], target, flor, variant = 'ar', seed = 1, mano = 0, fixedHand = null, fixedMuestra = null,
} = {}) {
  const players = seats.length === 4 ? 4 : 2;
  const s = seats.slice(0, players);
  let game = newGame({ players, target, flor, mano, variant });
  const t = dealTable(players, game.mano, handSeed(seed, 0), { fixed: fixedHand, fixedSeat: 0, fixedMuestra });
  game = startHand(game, t.hands, t.muestra);
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
  const t = dealTable(players, mano, handSeed(match.seed, g.handNo + 1));
  return { ...match, game: startHand(g, t.hands, t.muestra), history: [] };
}


export function rematch(match, seed) {
  const g = match.game;
  return createMatch({
    seats: match.seats, target: g.opts.target, flor: g.opts.flor, variant: g.opts.variant, seed, mano: (g.mano + 1) % g.opts.players,
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
    muestra: h.muestra || null, 
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
  const cards = (arr) => (Array.isArray(arr) ? arr.map((c) => (isTrucoCard(c) ? c : null)).slice(0, 3) : []);
  const h = g.hand;
  if (!h || !Array.isArray(h.hands) || h.hands.length !== n) return null;
  return {
    seats: Array.isArray(v.seats) ? v.seats.filter((s) => typeof s === 'string').slice(0, n) : [],
    you: Number.isInteger(v.you) && v.you >= 0 && v.you < n ? v.you : -1,
    game: {
      ...g,
      opts: { players: n, target: g.opts.target === 30 ? 30 : 15, flor: !!g.opts.flor, variant: g.opts.variant === 'uy' ? 'uy' : 'ar' },
      scores: Array.isArray(g.scores) ? g.scores.slice(0, 2).map((x) => Math.max(0, Number(x) || 0)) : [0, 0],
      hand: { ...h, muestra: g.opts.variant === 'uy' && isTrucoCard(h.muestra) ? h.muestra : null, hands: h.hands.map(cards), dealt: Array.isArray(h.dealt) ? h.dealt.map((d) => (d ? cards(d) : null)) : [] },
      events: Array.isArray(g.events) ? g.events.slice(0, 20) : [],
    },
  };
}












export function echoView(view, action) {
  if (!view || !Number.isInteger(view.you) || view.you < 0 || !view.game || !view.game.hand) return null;
  const a = sanitiseAction(action);
  if (!a) return null;
  const v = JSON.parse(JSON.stringify(view));
  const h = v.game.hand;
  const you = v.you;
  if (a.type === 'play') {
    const mine = Array.isArray(h.hands[you]) ? h.hands[you] : [];
    if (!mine.includes(a.card)) return null;
    h.hands[you] = mine.filter((c) => c !== a.card);
    if (!Array.isArray(h.bazas) || !h.bazas.length) h.bazas = [[]];
    h.bazas[h.bazas.length - 1].push({ seat: you, card: a.card, echo: true });
  } else {
    
    const p = h.pending;
    const entry = { seat: you, type: a.type, echo: true };
    if (a.call) entry.call = a.call;
    if (a.type === 'truco') entry.level = p && p.kind === 'truco' ? p.level + 1 : ((h.truco && h.truco.level) || 0) + 1;
    if ((a.type === 'quiero' || a.type === 'noquiero') && p) entry.of = p.kind;
    if (a.type === 'contraflor') entry.resto = !!a.resto;
    h.calls = [...(h.calls || []), entry];
  }
  v.echo = { type: a.type };
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


export function myNumbers(view) {
  const h = view.game.hand;
  const mine = h && h.dealt[view.you];
  if (!mine) return null;
  const flor = hasFlor(mine, h.muestra);
  
  
  return { envido: envidoPoints(mine, h.muestra), flor, florPoints: flor ? florPoints(mine, h.muestra) : 0 };
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
