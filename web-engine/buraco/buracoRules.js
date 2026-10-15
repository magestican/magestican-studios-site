































import { parseCard, faceOf, layRun, removeCard } from '../cards/cards.js';

export const TARGETS = Object.freeze([1500, 2000, 3000]);
export const HAND_SIZE = 11;
export const MORTO_SIZE = 11;
export const CANASTRA = 7;
export const BONUS = Object.freeze({ limpa: 200, suja: 100, ak: 500, aa: 1000, batida: 100, noMorto: -100 });

export const teamOf = (seat) => seat % 2;
export const isBuracoCard = (id) => parseCard(id, 'french52') !== null && /^(?:[A2-9JQK]|10)[SHDC](?:#[01])?$|^JK[12](?:#[01])?$/.test(String(id));


export const isWildCard = (id) => {
  const f = faceOf(id);
  return f === 'JK1' || f === 'JK2' || f.startsWith('2');
};


export function cardPoints(id) {
  const p = parseCard(id, 'french52');
  if (!p) return 0;
  if (p.joker) return 50;
  if (p.rank === '2') return 10;
  if (p.rank === 'A') return 15;
  if (['8', '9', '10', 'J', 'Q', 'K'].includes(p.rank)) return 10;
  return 5;
}

export const sumPoints = (cards) => cards.reduce((s, c) => s + cardPoints(c), 0);





export function meldInfo(cards) {
  const r = layRun(cards, { deck: 'french52', isWild: isWildCard, maxWild: 1, min: 3 });
  if (!r.ok) return { ok: false };
  const size = r.order.length;
  const clean = r.wilds.length === 0;
  let canastra = null;
  if (size >= CANASTRA) {
    if (!clean) canastra = 'suja';
    else if (size === 14) canastra = 'aa';
    else if (size === 13) canastra = 'ak';
    else canastra = 'limpa';
  }
  return {
    ok: true, order: r.order, suit: r.suit, low: r.low, high: r.high, wild: r.wilds[0] || null,
    wildAt: r.wildAt[0] || null, clean, size, canastra, bonus: canastra ? BONUS[canastra] : 0,
  };
}


export const hasCleanCanastra = (melds) => melds.some((m) => {
  const i = meldInfo(m);
  return i.ok && i.canastra && i.canastra !== 'suja';
});


export function newGame({ players = 2, target = 3000, dealer = 0 } = {}) {
  const n = players === 4 ? 4 : 2;
  return {
    opts: { players: n, target: TARGETS.includes(Number(target)) ? Number(target) : 3000 },
    scores: [0, 0],
    handNo: -1,
    dealer: dealer % n,
    hand: null,
    over: false,
    winner: null,
    events: [],
    past: [], 
  };
}






export function startHand(game, { hands, mortos, stock }, { mortoTaken = [false, false] } = {}) {
  const n = game.opts.players;
  const dealer = game.handNo < 0 ? game.dealer : (game.dealer + 1) % n;
  const ms = mortos.map((m) => m.slice());
  const taken = [!!mortoTaken[0], !!mortoTaken[1]];
  for (const t of [0, 1]) if (taken[t] && ms.length) ms.pop();
  return {
    ...game,
    handNo: game.handNo + 1,
    dealer,
    events: [],
    hand: {
      hands: hands.map((h) => h.slice()),
      mortos: ms,
      mortoTaken: taken,
      stock: stock.slice(),
      pile: [],
      melds: [[], []],
      known: Array.from({ length: n }, () => []),
      turn: (dealer + 1) % n,
      phase: 'draw',
      drew: null,
      over: false,
      reason: null,
      outBy: null,
      result: null,
      turns: 0,
    },
  };
}


export const actor = (game) => (game.over || !game.hand || game.hand.over ? null : game.hand.turn);


export const mortoFor = (h, team) => !h.mortoTaken[team] && h.mortos.length > 0;


export function emptyingAllowed(h, seat, melds = h.melds[teamOf(seat)]) {
  const t = teamOf(seat);
  if (mortoFor(h, t)) return 'morto';
  if (h.mortoTaken[t] && hasCleanCanastra(melds)) return 'batida';
  return null;
}


export function legalActions(game, seat) {
  const h = game.hand;
  if (actor(game) !== seat) return [];
  if (h.phase === 'draw') {
    const out = [];
    if (h.stock.length || h.mortos.length) out.push({ type: 'draw' });
    if (h.pile.length) out.push({ type: 'take' });
    return out;
  }
  return [{ type: 'meld' }, { type: 'layoff' }, { type: 'discard' }];
}

const err = (error) => ({ error });

function withHand(game, h, events) {
  return { ...game, hand: h, events: [...game.events, ...events].slice(-40) };
}


function takeOut(hand, cards) {
  let out = hand;
  for (const c of cards) {
    out = removeCard(out, c);
    if (!out) return null;
  }
  return out;
}


function afterEmptied(game, h, seat, how, events) {
  const t = teamOf(seat);
  if (h.hands[seat].length) return withHand(game, h, events);
  if (mortoFor(h, t)) {
    const hands = h.hands.slice();
    const mortos = h.mortos.slice();
    hands[seat] = mortos.shift();
    const mortoTaken = h.mortoTaken.slice();
    mortoTaken[t] = true;
    const h2 = { ...h, hands, mortos, mortoTaken };
    events.push({ seat, type: 'morto', how });
    if (how === 'discard') return endTurn(game, h2, seat, events);
    return withHand(game, h2, events);
  }
  
  events.push({ seat, type: 'batida' });
  return finishHand(withHand(game, h, events), 'batida', seat);
}

function endTurn(game, h, seat, events) {
  const n = game.opts.players;
  const h2 = { ...h, turn: (seat + 1) % n, phase: 'draw', drew: null, turns: h.turns + 1 };
  
  if (!h2.stock.length && !h2.mortos.length) return finishHand(withHand(game, h2, events), 'stock', null);
  return withHand(game, h2, events);
}


function forget(known, seat, cards) {
  const k = known.slice();
  k[seat] = k[seat].filter((c) => !cards.includes(c));
  return k;
}









export function apply(game, action) {
  const h = game.hand;
  if (!action || typeof action !== 'object') return err('That is not a move.');
  const seat = action.seat;
  if (game.over) return err('The game is over.');
  if (!h || h.over) return err('The hand is over.');
  if (seat !== h.turn) return err('It is not your turn.');
  const t = teamOf(seat);
  const mine = h.hands[seat];
  const events = [];

  if (action.type === 'draw') {
    if (h.phase !== 'draw') return err('You have already drawn this turn.');
    let stock = h.stock;
    let mortos = h.mortos;
    if (!stock.length) {
      if (!mortos.length) return err('Nothing is left to draw.');
      mortos = mortos.slice();
      stock = mortos.shift();
      events.push({ seat, type: 'mortoStock' });
    }
    const hands = h.hands.slice();
    hands[seat] = [...mine, stock[0]];
    events.push({ seat, type: 'draw' });
    return withHand(game, { ...h, hands, stock: stock.slice(1), mortos, phase: 'play', drew: 'stock' }, events);
  }

  if (action.type === 'take') {
    if (h.phase !== 'draw') return err('You have already drawn this turn.');
    if (!h.pile.length) return err('The discard pile is empty.');
    const hands = h.hands.slice();
    hands[seat] = [...mine, ...h.pile];
    const known = h.known.slice();
    known[seat] = [...known[seat], ...h.pile];
    events.push({ seat, type: 'take', cards: h.pile.slice() });
    return withHand(game, { ...h, hands, known, pile: [], phase: 'play', drew: 'pile' }, events);
  }

  if (h.phase !== 'play') return err('Draw a card or take the discard pile first.');

  if (action.type === 'meld' || action.type === 'layoff') {
    const cards = Array.isArray(action.cards) ? action.cards : [];
    if (!cards.length || new Set(cards).size !== cards.length) return err('Choose the cards to lay down.');
    const rest = takeOut(mine, cards);
    if (!rest) return err('Those cards are not in your hand.');
    const melds = h.melds.map((m) => m.slice());
    let info;
    if (action.type === 'meld') {
      info = meldInfo(cards);
      if (!info.ok) return err('A jogo is 3 or more cards of one suit in sequence, with at most one wild card.');
      melds[t] = [...melds[t], info.order];
    } else {
      const k = action.meld;
      if (!Number.isInteger(k) || k < 0 || k >= melds[t].length) return err('Choose one of your team\'s jogos.');
      info = meldInfo([...melds[t][k], ...cards]);
      if (!info.ok) return err('Those cards do not fit that jogo.');
      melds[t][k] = info.order;
    }
    
    
    const hNext = { ...h, melds };
    if (rest.length <= 1 && !emptyingAllowed(hNext, seat, melds[t])) {
      return err('You cannot go out yet: your team needs its morto and a clean canastra. Keep a card to discard.');
    }
    const hands = h.hands.slice();
    hands[seat] = rest;
    const known = forget(h.known, seat, cards);
    events.push({ seat, type: action.type, cards: cards.slice(), meld: action.type === 'layoff' ? action.meld : melds[t].length - 1, canastra: info.canastra });
    return afterEmptied(game, { ...hNext, hands, known }, seat, 'meld', events);
  }

  if (action.type === 'discard') {
    const card = action.card;
    const rest = removeCard(mine, card);
    if (!rest) return err('That card is not in your hand.');
    if (!rest.length && !emptyingAllowed(h, seat)) {
      return err('You cannot go out yet: your team needs its morto and a clean canastra.');
    }
    const hands = h.hands.slice();
    hands[seat] = rest;
    const known = forget(h.known, seat, [card]);
    events.push({ seat, type: 'discard', card });
    const h2 = { ...h, hands, known, pile: [...h.pile, card] };
    if (!rest.length) return afterEmptied(game, h2, seat, 'discard', events);
    return endTurn(game, h2, seat, events);
  }

  return err('That is not a move.');
}


export function teamScore(h, team, outBy, players) {
  let melded = 0;
  let bonus = 0;
  const canastras = { limpa: 0, suja: 0, ak: 0, aa: 0 };
  for (const m of h.melds[team]) {
    melded += sumPoints(m);
    const i = meldInfo(m);
    if (i.ok && i.canastra) { bonus += i.bonus; canastras[i.canastra]++; }
  }
  let inHand = 0;
  for (let s = 0; s < players; s++) if (teamOf(s) === team) inHand += sumPoints(h.hands[s]);
  const batida = outBy !== null && teamOf(outBy) === team ? BONUS.batida : 0;
  const morto = h.mortoTaken[team] ? 0 : BONUS.noMorto;
  return { melded, bonus, canastras, inHand: -inHand, batida, morto, total: melded + bonus - inHand + batida + morto };
}


export function finishHand(game, reason, outBy) {
  const h = game.hand;
  const n = game.opts.players;
  const lines = [teamScore(h, 0, outBy, n), teamScore(h, 1, outBy, n)];
  const scores = [game.scores[0] + lines[0].total, game.scores[1] + lines[1].total];
  let over = false;
  let winner = null;
  const top = Math.max(...scores);
  if (top >= game.opts.target && scores[0] !== scores[1]) {
    over = true;
    winner = scores[0] > scores[1] ? 0 : 1;
  }
  const result = { reason, outBy, lines };
  return {
    ...game,
    scores,
    over,
    winner,
    past: [...game.past, { handNo: game.handNo, totals: [lines[0].total, lines[1].total], reason }],
    hand: { ...h, over: true, reason, outBy, result },
    events: [...game.events, { type: 'handOver', reason, outBy }].slice(-40),
  };
}
