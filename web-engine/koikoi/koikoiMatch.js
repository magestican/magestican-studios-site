









import { newRound, apply, actor, nextOya, isCard, YAKU_IDS } from './koikoiRules.js';

export const KMSG = Object.freeze({ HELLO: 'fkk-hello', VIEW: 'fkk-view', ACT: 'fkk-act', SAY: 'fkk-say' });
export const ROUND_CHOICES = Object.freeze([3, 6, 12]); 
export const isBot = (id) => typeof id === 'string' && id.startsWith('bot:');
export const botLevel = (id) => (isBot(id) ? id.slice(4).split('#')[0] : null);


export function roundSeed(seed, n) {
  let h = (seed >>> 0) ^ Math.imul(n + 1, 0x9E3779B1);
  h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B);
  h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
  return ((h ^ (h >>> 16)) >>> 0) || 1;
}

export function createMatch({ seats, rounds = 6, seed = 1, oya = 0, fixed = null } = {}) {
  const r = ROUND_CHOICES.includes(rounds) ? rounds : 6;
  const m = { seats: [...seats], rounds: r, seed, roundNo: 1, scores: [0, 0], history: [], fixed };
  m.state = newRound({ seed: roundSeed(seed, 0), oya, fixed });
  return m;
}

export const seatOf = (match, id) => match.seats.indexOf(id);
export const actorId = (match) => {
  const s = actor(match.state);
  return s === null ? null : match.seats[s];
};


export function act(match, id, action) {
  const seat = seatOf(match, id);
  if (seat < 0 || actor(match.state) !== seat) return false;
  try {
    match.state = apply(match.state, sanitiseAction(action));
  } catch {
    return false;
  }
  if (match.state.phase === 'over' && !match.state.recorded) {
    const r = match.state.result;
    if (r.winner !== null) match.scores[r.winner] += r.points;
    match.history.push({ round: match.roundNo, winner: r.winner, points: r.points, yaku: r.yaku.map((y) => y.id),
      handYaku: r.handYaku || null });
    match.state.recorded = true;
  }
  return true;
}

export const matchOver = (match) => match.state.phase === 'over' && match.roundNo >= match.rounds;


export function nextRound(match) {
  if (match.state.phase !== 'over' || matchOver(match)) return false;
  const oya = nextOya(match.state);
  match.state = newRound({ seed: roundSeed(match.seed, match.roundNo), oya });
  match.roundNo += 1;
  return true;
}

export function sanitiseAction(a) {
  if (!a || typeof a !== 'object') return null;
  if (a.type === 'play' || a.type === 'pick') return isCard(a.card) ? { type: a.type, card: a.card } : null;
  if (a.type === 'stop' || a.type === 'koikoi') return { type: a.type };
  return null;
}

export const PUBLIC_SEAT = -1;


export function viewFor(match, seat) {
  const st = match.state;
  const over = st.phase === 'over';
  const pend = st.pending ? { card: st.pending.card, source: st.pending.source, options: [...st.pending.options] } : null;
  return {
    you: seat,
    seats: [...match.seats],
    roundNo: match.roundNo,
    rounds: match.rounds,
    scores: [...match.scores],
    history: match.history.map((h) => ({ ...h, yaku: [...h.yaku] })),
    oya: st.oya,
    turn: st.turn,
    phase: st.phase,
    hand: seat >= 0 ? [...st.hands[seat]] : [],
    handCounts: [st.hands[0].length, st.hands[1].length],
    
    hands: over ? [[...st.hands[0]], [...st.hands[1]]] : null,
    field: [...st.field],
    captured: [[...st.captured[0]], [...st.captured[1]]],
    stockCount: st.stock.length,
    drawn: st.drawn,
    pending: pend,
    koikoi: [...st.koikoi],
    lastTotal: [...st.lastTotal],
    
    log: st.log.map((e) => (e.took ? { ...e, took: [...e.took] } : { ...e })),
    result: st.result ? { ...st.result, yaku: st.result.yaku.map((y) => ({ ...y })) } : null,
    matchOver: matchOver(match),
  };
}


export function viewForPeer(match, id) {
  const seat = seatOf(match, id);
  return viewFor(match, seat < 0 ? PUBLIC_SEAT : seat);
}





export function seatsWith(seats, id, started = false) {
  if (!id || seats.includes(id) || started) return seats;
  if (seats[1] && !isBot(seats[1])) return seats;
  return [seats[0], id];
}

const PHASES = ['play', 'pickHand', 'pickDraw', 'decide', 'over'];
const int = (x, lo, hi, d) => (Number.isInteger(x) && x >= lo && x <= hi ? x : d);
const cardList = (a, max = 48) => (Array.isArray(a) ? a.filter(isCard).slice(0, max) : []);
const pair = (a, f) => (Array.isArray(a) && a.length === 2 ? [f(a[0]), f(a[1])] : [f(null), f(null)]);
const num = (x) => Math.max(0, Number(x) || 0);
const yakuList = (a) => (Array.isArray(a) ? a.filter((y) => y && YAKU_IDS.includes(y.id)).map((y) => ({ id: y.id, points: num(y.points) })) : []);


export function sanitiseView(v) {
  if (!v || typeof v !== 'object' || !Array.isArray(v.hand) || !Array.isArray(v.field)) return null;
  const card = (c) => (isCard(c) ? c : null);
  const out = {
    you: int(v.you, 0, 1, PUBLIC_SEAT),
    seats: Array.isArray(v.seats) ? v.seats.slice(0, 2).map((s) => (typeof s === 'string' ? s : '')) : ['', ''],
    roundNo: int(v.roundNo, 1, 12, 1),
    rounds: ROUND_CHOICES.includes(v.rounds) ? v.rounds : 6,
    scores: pair(v.scores, num),
    history: Array.isArray(v.history) ? v.history.slice(0, 12).map((h) => ({
      round: int(h?.round, 1, 12, 1), winner: h?.winner === 0 || h?.winner === 1 ? h.winner : null, points: num(h?.points),
      yaku: Array.isArray(h?.yaku) ? h.yaku.filter((y) => YAKU_IDS.includes(y)) : [],
      handYaku: h?.handYaku === 'teshi' || h?.handYaku === 'kuttsuki' ? h.handYaku : null,
    })) : [],
    oya: int(v.oya, 0, 1, 0),
    turn: int(v.turn, 0, 1, 0),
    phase: PHASES.includes(v.phase) ? v.phase : 'play',
    hand: cardList(v.hand, 8),
    handCounts: pair(v.handCounts, (x) => Math.min(8, num(x))),
    hands: Array.isArray(v.hands) ? pair(v.hands, (h) => cardList(h, 8)) : null,
    field: cardList(v.field),
    captured: pair(v.captured, (h) => cardList(h)),
    stockCount: Math.min(48, num(v.stockCount)),
    drawn: card(v.drawn),
    pending: v.pending && isCard(v.pending.card) ? {
      card: v.pending.card, source: v.pending.source === 'stock' ? 'stock' : 'hand', options: cardList(v.pending.options, 3),
    } : null,
    koikoi: pair(v.koikoi, (x) => Math.min(9, num(x))),
    lastTotal: pair(v.lastTotal, num),
    log: Array.isArray(v.log) ? v.log.slice(-60).map((e) => {
      const seat = e?.seat === 1 ? 1 : 0;
      if (e?.koikoi) return { seat, koikoi: true };
      return { seat, source: e?.source === 'stock' ? 'stock' : 'hand', card: card(e?.card), took: cardList(e?.took, 3) };
    }) : [],
    result: null,
    matchOver: v.matchOver === true,
  };
  const r = v.result;
  if (r && typeof r === 'object') {
    const res = { winner: r.winner === 0 || r.winner === 1 ? r.winner : null, points: num(r.points), yaku: yakuList(r.yaku) };
    for (const k of ['noGame', 'doubled7', 'koikoiDoubled']) if (k in r) res[k] = r[k] === true;
    if ('base' in r) res.base = num(r.base);
    if (r.handYaku === 'teshi' || r.handYaku === 'kuttsuki') res.handYaku = r.handYaku;
    out.result = res;
  }
  return out;
}






export function echoView(view, action) {
  if (!view || view.you < 0 || view.turn !== view.you || view.phase !== 'play') return null;
  const a = sanitiseAction(action);
  if (!a || a.type !== 'play' || !view.hand.includes(a.card)) return null;
  const v = JSON.parse(JSON.stringify(view));
  v.hand = v.hand.filter((c) => c !== a.card);
  v.echo = { card: a.card };
  return v;
}
