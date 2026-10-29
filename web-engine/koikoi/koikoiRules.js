












import { shuffle } from '../cards/cards.js';

export const MONTH_TYPES = Object.freeze({
  1: ['H', 'R', 'K1', 'K2'], 2: ['T', 'R', 'K1', 'K2'], 3: ['H', 'R', 'K1', 'K2'],
  4: ['T', 'R', 'K1', 'K2'], 5: ['T', 'R', 'K1', 'K2'], 6: ['T', 'R', 'K1', 'K2'],
  7: ['T', 'R', 'K1', 'K2'], 8: ['H', 'T', 'K1', 'K2'], 9: ['T', 'R', 'K1', 'K2'],
  10: ['T', 'R', 'K1', 'K2'], 11: ['H', 'T', 'R', 'K1'], 12: ['H', 'K1', 'K2', 'K3'],
});


export const DECK = Object.freeze(
  Object.entries(MONTH_TYPES).flatMap(([m, ts]) => ts.map((t) => `${String(m).padStart(2, '0')}${t}`)),
);

export const isCard = (id) => typeof id === 'string' && DECK.includes(id);
export const month = (id) => Number(id.slice(0, 2));
export const kind = (id) => id[2]; 

export const RAIN_MAN = '11H';
export const SAKE_CUP = '09T';
export const CURTAIN = '03H';
export const MOON = '08H';
export const INOSHIKACHO = Object.freeze(['07T', '10T', '06T']); 
export const AKATAN = Object.freeze(['01R', '02R', '03R']); 
export const AOTAN = Object.freeze(['06R', '09R', '10R']); 


export const YAKU_IDS = Object.freeze([
  'goko', 'shiko', 'ameShiko', 'sanko', 'hanamiZake', 'tsukimiZake', 'inoshikacho',
  'akatanAotan', 'akatan', 'aotan', 'tane', 'tanzaku', 'kasu',
]);





export function yaku(captured) {
  const has = new Set(captured);
  const count = (pred) => captured.filter(pred).length;
  const out = [];
  const lights = count((c) => kind(c) === 'H');
  const rain = has.has(RAIN_MAN);
  if (lights === 5) out.push({ id: 'goko', points: 10 });
  else if (lights === 4) out.push(rain ? { id: 'ameShiko', points: 7 } : { id: 'shiko', points: 8 });
  else if (lights === 3 && !rain) out.push({ id: 'sanko', points: 5 });
  if (has.has(SAKE_CUP) && has.has(CURTAIN)) out.push({ id: 'hanamiZake', points: 5 });
  if (has.has(SAKE_CUP) && has.has(MOON)) out.push({ id: 'tsukimiZake', points: 5 });
  if (INOSHIKACHO.every((c) => has.has(c))) out.push({ id: 'inoshikacho', points: 5 });
  const aka = AKATAN.every((c) => has.has(c));
  const ao = AOTAN.every((c) => has.has(c));
  if (aka && ao) out.push({ id: 'akatanAotan', points: 10 });
  else if (aka) out.push({ id: 'akatan', points: 5 });
  else if (ao) out.push({ id: 'aotan', points: 5 });
  const tane = count((c) => kind(c) === 'T');
  if (tane >= 5) out.push({ id: 'tane', points: 1 + tane - 5 });
  const tan = count((c) => kind(c) === 'R');
  if (tan >= 5) out.push({ id: 'tanzaku', points: 1 + tan - 5 });
  const kasu = count((c) => kind(c) === 'K') + (has.has(SAKE_CUP) ? 1 : 0);
  if (kasu >= 10) out.push({ id: 'kasu', points: 1 + kasu - 10 });
  return { list: out, total: out.reduce((s, y) => s + y.points, 0) };
}


export function stopScore(total, otherCalledKoikoi) {
  let s = total;
  if (s >= 7) s *= 2;
  if (otherCalledKoikoi) s *= 2;
  return s;
}


export function handYaku(hand) {
  const byMonth = {};
  for (const c of hand) byMonth[month(c)] = (byMonth[month(c)] || 0) + 1;
  const n = Object.values(byMonth);
  if (n.some((v) => v === 4)) return 'teshi';
  if (n.length === 4 && n.every((v) => v === 2)) return 'kuttsuki';
  return null;
}
export const HAND_YAKU_POINTS = 6;

const fieldFourOfAMonth = (field) => {
  const byMonth = {};
  for (const c of field) byMonth[month(c)] = (byMonth[month(c)] || 0) + 1;
  return Object.values(byMonth).some((v) => v === 4);
};







export function dealRound(seed, oya = 0, { fixed = null } = {}) {
  for (let s = seed, tries = 0; tries < 64; s += 1, tries += 1) {
    let deck = shuffle([...DECK], s);
    let pre = null;
    if (Array.isArray(fixed) && fixed.length === 8 && fixed.every(isCard) && new Set(fixed).size === 8) {
      pre = fixed;
      deck = deck.filter((c) => !fixed.includes(c));
    }
    const field = []; const hands = [[], []];
    const other = 1 - oya;
    for (let r = 0; r < 4; r += 1) {
      field.push(deck.shift(), deck.shift());
      if (!pre) hands[other].push(deck.shift(), deck.shift());
      else hands[other].push(deck.shift(), deck.shift());
      if (!pre) hands[oya].push(deck.shift(), deck.shift());
    }
    if (pre) hands[oya] = [...pre];
    if (fieldFourOfAMonth(field)) continue;
    return { field, hands, stock: deck, seedUsed: s };
  }
  throw new Error('koikoi: no legal deal in 64 seeds');
}









export function newRound({ seed = 1, oya = 0, fixed = null } = {}) {
  const { field, hands, stock } = dealRound(seed, oya, { fixed });
  const st = {
    field, hands, stock, captured: [[], []], oya, turn: oya, phase: 'play',
    pending: null, drawn: null, koikoi: [0, 0], lastTotal: [0, 0], log: [], result: null,
  };
  for (const seat of [oya, 1 - oya]) {
    const hy = handYaku(hands[seat]);
    if (hy) {
      st.phase = 'over';
      st.result = { winner: seat, points: HAND_YAKU_POINTS, handYaku: hy, yaku: [] };
      break;
    }
  }
  return st;
}

const matchesOf = (field, card) => field.filter((c) => month(c) === month(card));


export function legalActions(st) {
  switch (st.phase) {
    case 'play': return st.hands[st.turn].map((card) => ({ type: 'play', card }));
    case 'pickHand':
    case 'pickDraw': return st.pending.options.map((card) => ({ type: 'pick', card }));
    case 'decide': return [{ type: 'stop' }, { type: 'koikoi' }];
    default: return [];
  }
}

const clone = (st) => JSON.parse(JSON.stringify(st));


function place(st, card, source) {
  const m = matchesOf(st.field, card);
  if (m.length === 0) {
    st.field.push(card);
    st.log.push({ seat: st.turn, source, card, took: [] });
    return false;
  }
  if (m.length === 2) {
    st.pending = { card, source, options: m };
    st.phase = source === 'hand' ? 'pickHand' : 'pickDraw';
    return true;
  }
  
  st.field = st.field.filter((c) => !m.includes(c));
  st.captured[st.turn].push(card, ...m);
  st.log.push({ seat: st.turn, source, card, took: m });
  return false;
}

function take(st, card, picked) {
  st.field = st.field.filter((c) => c !== picked);
  st.captured[st.turn].push(card, picked);
  st.log.push({ seat: st.turn, source: st.pending.source, card, took: [picked] });
  st.pending = null;
}

function draw(st) {
  const card = st.stock.shift();
  st.drawn = card;
  if (!place(st, card, 'stock')) afterTurn(st);
}


function afterTurn(st) {
  st.phase = 'play';
  const seat = st.turn;
  const { total } = yaku(st.captured[seat]);
  if (total > st.lastTotal[seat]) {
    st.lastTotal[seat] = total;
    
    if (st.hands[seat].length === 0) return finish(st, seat);
    
    
    if (st.koikoi[0] + st.koikoi[1] > 0) return finish(st, seat);
    st.phase = 'decide';
    return undefined;
  }
  return nextTurn(st);
}

function nextTurn(st) {
  st.phase = 'play';
  st.turn = 1 - st.turn;
  st.drawn = null;
  if (st.hands[0].length === 0 && st.hands[1].length === 0) {
    st.phase = 'over';
    st.result = { winner: null, points: 0, noGame: true, yaku: [] }; 
  }
}

function finish(st, seat) {
  const { list, total } = yaku(st.captured[seat]);
  st.phase = 'over';
  st.result = { winner: seat, points: stopScore(total, st.koikoi[1 - seat] > 0), base: total, yaku: list,
    doubled7: total >= 7, koikoiDoubled: st.koikoi[1 - seat] > 0 };
}


export function apply(state, action) {
  const st = clone(state);
  const a = action || {};
  if (st.phase === 'play' && a.type === 'play' && st.hands[st.turn].includes(a.card)) {
    st.hands[st.turn] = st.hands[st.turn].filter((c) => c !== a.card);
    if (!place(st, a.card, 'hand')) draw(st);
    return st;
  }
  if ((st.phase === 'pickHand' || st.phase === 'pickDraw') && a.type === 'pick' && st.pending.options.includes(a.card)) {
    const wasHand = st.phase === 'pickHand';
    take(st, st.pending.card, a.card);
    if (wasHand) draw(st); else afterTurn(st);
    return st;
  }
  if (st.phase === 'decide' && a.type === 'stop') {
    finish(st, st.turn);
    return st;
  }
  if (st.phase === 'decide' && a.type === 'koikoi') {
    st.koikoi[st.turn] += 1;
    st.log.push({ seat: st.turn, koikoi: true });
    nextTurn(st);
    return st;
  }
  throw new Error(`koikoi: illegal action ${JSON.stringify(a)} in phase ${st.phase}`);
}


export const actor = (st) => (st.phase === 'over' ? null : st.turn);


export const nextOya = (st) => (st.result && st.result.winner !== null ? st.result.winner : 1 - st.oya);
