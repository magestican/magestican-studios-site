










import { yaku, month, kind, stopScore, DECK, INOSHIKACHO, AKATAN, AOTAN, SAKE_CUP } from './koikoiRules.js';

export const LEVELS = Object.freeze(['easy', 'medium', 'hard']);

export function seededRng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const VALUE = { H: 20, T: 10, R: 5, K: 1 };
export const cardValue = (c) => VALUE[kind(c)] + (c === SAKE_CUP ? 4 : 0);


export function progress(pile) {
  const has = new Set(pile);
  const n = (pred) => pile.filter(pred).length;
  const frac = (list) => list.filter((c) => has.has(c)).length / list.length;
  return Math.min(1, n((c) => kind(c) === 'H') / 3) * 1.5
    + frac(INOSHIKACHO) + frac(AKATAN) + frac(AOTAN)
    + Math.min(1, n((c) => kind(c) === 'T') / 5) + Math.min(1, n((c) => kind(c) === 'R') / 5)
    + Math.min(1, (n((c) => kind(c) === 'K') + (has.has(SAKE_CUP) ? 1 : 0)) / 10) * 0.6;
}


function unseenOfMonth(view, m) {
  const seen = [...view.hand, ...view.field, ...view.captured[0], ...view.captured[1]];
  return 4 - seen.filter((c) => month(c) === m).length;
}

function captureGain(view, card, taken) {
  const mine = view.captured[view.you];
  const theirs = view.captured[1 - view.you];
  const got = [card, ...taken];
  const before = yaku(mine).total;
  const after = yaku([...mine, ...got]).total;
  const denial = taken.length ? progress([...theirs, ...taken]) - progress(theirs) : 0;
  return {
    value: got.reduce((s, c) => s + cardValue(c), 0),
    yakuDelta: after - before,
    progressDelta: progress([...mine, ...got]) - progress(mine),
    denial,
  };
}

function scorePlay(view, card, level) {
  const m = view.field.filter((c) => month(c) === month(card));
  if (m.length === 0) {
    
    const risk = level === 'hard' ? cardValue(card) * Math.min(1, unseenOfMonth(view, month(card)) / 2) : 0;
    return -cardValue(card) * 0.3 - risk;
  }
  const taken = m.length === 3 ? m : [m.slice().sort((a, b) => cardValue(b) - cardValue(a))[0]];
  const g = captureGain(view, card, taken);
  if (level === 'medium') return 5 + g.value;
  return 5 + g.value + g.yakuDelta * 12;
}

function shouldKoikoi(view, level, rng) {
  const myHand = view.hand.length;
  const total = yaku(view.captured[view.you]).total;
  if (level === 'easy') return myHand >= 2 && rng() < 0.3;
  if (level === 'medium') return false;
  if (total >= 7 || myHand < 2) return false;
  const ev = evalKoikoi(view, rng);
  return ev.koikoi > ev.stop + 1;
}








export const SAMPLES = 24;

function unseen(view) {
  const seen = new Set([...view.hand, ...view.field, ...view.captured[0], ...view.captured[1]]);
  if (view.pending) seen.add(view.pending.card);
  return DECK.filter((c) => !seen.has(c));
}

function determinise(view, rng) {
  const pool = unseen(view);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const other = 1 - view.you;
  const hands = [];
  hands[view.you] = [...view.hand];
  hands[other] = pool.slice(0, view.handCounts[other]);
  return { hands, stock: pool.slice(view.handCounts[other]), field: [...view.field],
    captured: [[...view.captured[0]], [...view.captured[1]]], koikoi: [...view.koikoi], last: [...view.lastTotal] };
}

const bestOf = (cards) => cards.reduce((a, c) => (cardValue(c) > cardValue(a) ? c : a));


function simPlace(g, seat, card, pick = null) {
  const m = g.field.filter((c) => month(c) === month(card));
  if (!m.length) { g.field.push(card); return; }
  const taken = m.length === 3 ? m : [pick && m.includes(pick) ? pick : bestOf(m)];
  g.field = g.field.filter((c) => !taken.includes(c));
  g.captured[seat].push(card, ...taken);
}


function simCheck(g, seat, me) {
  const t = yaku(g.captured[seat]).total;
  if (t <= g.last[seat]) return null;
  const pts = stopScore(t, g.koikoi[1 - seat] > 0);
  return seat === me ? pts : -pts;
}

function greedyCard(g, seat) {
  let top = g.hands[seat][0]; let topS = -1e9;
  for (const c of g.hands[seat]) {
    const m = g.field.filter((f) => month(f) === month(c));
    const s = m.length ? 5 + cardValue(c) + cardValue(bestOf(m)) : -cardValue(c) * 0.3;
    if (s > topS) { topS = s; top = c; }
  }
  return top;
}

function playout(g, turn, me) {
  for (let seat = turn, guard = 0; guard < 40; seat = 1 - seat, guard += 1) {
    if (!g.hands[0].length && !g.hands[1].length) return 0;
    if (!g.hands[seat].length) continue;
    const c = greedyCard(g, seat);
    g.hands[seat] = g.hands[seat].filter((x) => x !== c);
    simPlace(g, seat, c);
    if (g.stock.length) simPlace(g, seat, g.stock.shift());
    const r = simCheck(g, seat, me);
    if (r !== null) return r;
  }
  return 0;
}


function evalKoikoi(view, rng, n = SAMPLES * 2) {
  const now = stopScore(yaku(view.captured[view.you]).total, view.koikoi[1 - view.you] > 0);
  let sum = 0;
  for (let k = 0; k < n; k += 1) {
    const g = determinise(view, rng);
    g.koikoi[view.you] += 1;
    
    g.last[view.you] = yaku(view.captured[view.you]).total;
    sum += playout(g, 1 - view.you, view.you);
  }
  return { stop: now, koikoi: sum / n };
}


export function viewActions(view) {
  if (view.turn !== view.you) return [];
  if (view.phase === 'play') return view.hand.map((card) => ({ type: 'play', card }));
  if (view.phase === 'pickHand' || view.phase === 'pickDraw') return view.pending.options.map((card) => ({ type: 'pick', card }));
  if (view.phase === 'decide') return [{ type: 'stop' }, { type: 'koikoi' }];
  return [];
}


export function chooseAction(view, { level = 'medium', rng = Math.random } = {}) {
  const acts = viewActions(view);
  if (!acts.length) return null;
  if (view.phase === 'decide') return { type: shouldKoikoi(view, level, rng) ? 'koikoi' : 'stop' };
  if (view.phase === 'pickHand' || view.phase === 'pickDraw') {
    const card = view.pending.card;
    const best = acts.map((a) => ({ a, s: level === 'easy' ? rng() : (() => {
      const g = captureGain(view, card, [a.card]);
      return g.value + (level === 'hard' ? g.yakuDelta * 12 : 0);
    })() }));
    best.sort((x, y) => y.s - x.s);
    return best[0].a;
  }
  if (level === 'easy') {
    const caps = acts.filter((a) => view.field.some((c) => month(c) === month(a.card)));
    const pool = caps.length && rng() < 0.5 ? caps : acts;
    return pool[Math.floor(rng() * pool.length)];
  }
  const scored = acts.map((a) => ({ a, s: scorePlay(view, a.card, level) + rng() * 0.01 }));
  scored.sort((x, y) => y.s - x.s);
  return scored[0].a;
}
