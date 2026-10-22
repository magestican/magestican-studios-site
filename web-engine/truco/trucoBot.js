
























import { SeededRng } from '../rng/seededRng.js';
import {
  ALL_CARDS, power, envidoPoints, team, legalActions, actor, faltaWorth, envidoRefusedWorth,
  envidoAcceptedWorth, TRUCO_WORTH, handWinnerFromBazas, hasFlor, florPoints,
} from './trucoRules.js';

export const LEVELS = Object.freeze(['easy', 'medium', 'hard']);

const CFG = Object.freeze({
  easy: { samples: 12, singEnvido: 0.7, callTruco: 0.75, accept: 0.5, raise: 0.9, bluff: 0.05, noise: 0.15 },
  medium: { samples: 40, singEnvido: 0.6, callTruco: 0.66, accept: 0.42, raise: 0.8, bluff: 0.1, noise: 0.06 },
  hard: { samples: 120, singEnvido: 0.55, callTruco: 0.62, accept: 0.2, raise: 0.74, bluff: 0.15, noise: 0.03 },
});


export function seededRng(seed = 1) {
  const r = new SeededRng((seed >>> 0) || 1);
  return () => r.next();
}

const played = (h) => h.bazas.flat();


export function unseenCards(view) {
  const h = view.game.hand;
  const mine = new Set(h.dealt[view.you] || []);
  const seen = new Set(played(h).map((p) => p.card));
  if (h.muestra) seen.add(h.muestra); 
  return ALL_CARDS.filter((c) => !mine.has(c) && !seen.has(c));
}





export function sampleDeals(view, rng, n, { useReveals = false } = {}) {
  const h = view.game.hand;
  const players = view.game.opts.players;
  const pool = unseenCards(view);
  const playedBy = Array.from({ length: players }, () => []);
  for (const p of played(h)) playedBy[p.seat].push(p.card);
  const reveal = useReveals && h.envido.result && h.envido.result.accepted && h.envido.result.seat !== view.you
    ? h.envido.result : null;
  const out = [];
  let tries = 0;
  while (out.length < n && tries < n * 30) {
    tries++;
    const deck = pool.slice();
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    let k = 0;
    const dealt = [];
    for (let s = 0; s < players; s++) {
      if (s === view.you) { dealt.push(h.dealt[s].slice()); continue; }
      const hand = playedBy[s].slice();
      while (hand.length < 3) hand.push(deck[k++]);
      dealt.push(hand);
    }
    if (reveal && envidoPoints(dealt[reveal.seat], h.muestra) !== reveal.points) continue;
    out.push(dealt);
  }
  
  if (!out.length) return sampleDeals(view, rng, n, { useReveals: false });
  return out;
}

const smooth = (lo, hi, x) => { const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo))); return t * t * (3 - 2 * t); };


export function trucoStrength(cards, muestra) {
  const p = cards.map((c) => power(c, muestra)).sort((a, b) => b - a);
  
  return Math.min(1, ((p[0] || 0) + (p[1] || 0) * 0.7 + (p[2] || 0) * 0.3) / 26.7);
}






export function signalWeights(view, deals, kind, floor = 0.15) {
  const h = view.game.hand;
  const opp = 1 - team(view.you);
  const seats = new Set();
  for (const c of h.calls || []) {
    if (team(c.seat) !== opp) continue;
    if (kind === 'truco' && (c.type === 'truco' || (c.type === 'quiero' && c.of === 'truco'))) seats.add(c.seat);
    if (kind === 'envido' && (c.type === 'envido' || (c.type === 'quiero' && c.of === 'envido'))) seats.add(c.seat);
  }
  if (!seats.size) return null;
  return deals.map((d) => {
    let w = 1;
    for (const s of seats) {
      const x = kind === 'truco' ? smooth(0.4, 0.75, trucoStrength(d[s], h.muestra)) : smooth(22, 30, envidoPoints(d[s], h.muestra));
      w *= floor + (1 - floor) * x;
    }
    return w;
  });
}


export function envidoOdds(view, deals, weights = null) {
  const n = view.game.opts.players;
  const myTeam = team(view.you);
  let wins = 0;
  let total = 0;
  deals.forEach((d, i) => {
    const w = weights ? weights[i] : 1;
    total += w;
    let best = -1;
    let bestTeam = -1;
    for (let k = 0; k < n; k++) {
      const s = (view.game.mano + k) % n;
      const p = envidoPoints(d[s], view.game.hand.muestra);
      if (p > best) { best = p; bestTeam = team(s); }
    }
    if (bestTeam === myTeam) wins += w;
  });
  return total > 0 ? wins / total : 0.5;
}



function greedyCard(hand, cur, seat, muestra) {
  const pw = (c) => power(c, muestra);
  
  
  const sorted = hand.slice().sort((a, b) => pw(a) - pw(b));
  if (!cur.length) return sorted.length === 3 ? sorted[1] : sorted[sorted.length - 1];
  let top = -1;
  let topTeam = -1;
  for (const p of cur) if (pw(p.card) > top) { top = pw(p.card); topTeam = team(p.seat); }
  if (topTeam === team(seat)) return sorted[0];
  const win = sorted.find((c) => pw(c) > top);
  return win || sorted[0];
}


export function playOut(h, hands, players, mano, first = null) {
  const pw = (c) => power(c, h.muestra);
  const hs = hands.map((x) => x.slice());
  let results = h.results.slice();
  let cur = (h.bazas[h.bazas.length - 1] || []).slice();
  let lead = h.leads[h.leads.length - 1];
  let turn = h.turn;
  let forced = first;
  for (let guard = 0; guard < 16; guard++) {
    const won = handWinnerFromBazas(results, team(mano));
    if (won !== null) return won;
    if (cur.length === players) {
      let top = -1;
      let seat = -1;
      for (const p of cur) if (pw(p.card) > top) { top = pw(p.card); seat = p.seat; }
      const teams = new Set(cur.filter((p) => pw(p.card) === top).map((p) => team(p.seat)));
      const res = teams.size > 1 ? 'parda' : team(seat);
      results = [...results, res];
      const next = res === 'parda' ? lead : cur.find((p) => pw(p.card) === top).seat;
      lead = next; turn = next; cur = [];
      continue;
    }
    const hand = hs[turn];
    if (!hand.length) return team(mano);
    const card = forced && hand.includes(forced) ? forced : greedyCard(hand, cur, turn, h.muestra);
    forced = null;
    hand.splice(hand.indexOf(card), 1);
    cur.push({ seat: turn, card });
    turn = (turn + 1) % players;
  }
  return team(mano);
}


export function handOdds(view, deals, card = null, weights = null) {
  const h = view.game.hand;
  const players = view.game.opts.players;
  const myTeam = team(view.you);
  const seen = played(h);
  let wins = 0;
  let total = 0;
  deals.forEach((d, i) => {
    const w = weights ? weights[i] : 1;
    total += w;
    const remaining = d.map((cards, s) => cards.filter((c) => !seen.some((p) => p.seat === s && p.card === c)));
    remaining[view.you] = h.hands[view.you].slice();
    if (playOut(h, remaining, players, view.game.mano, card) === myTeam) wins += w;
  });
  return total > 0 ? wins / total : 0.5;
}


const crudeStrength = (cards, muestra) => (cards.length ? Math.min(1, cards.reduce((a, c) => a + power(c, muestra), 0) / (cards.length * 14)) : 0.3);






export const breakEven = (W, R) => (W - R) / (2 * W);





export function chooseAction(view, { level = 'medium', rng = Math.random } = {}) {
  const cfg = CFG[level] || CFG.medium;
  const g = view.game;
  const h = g.hand;
  const me = view.you;
  const legal = legalActions(g, me);
  if (!legal.length) return null;
  const has = (type, extra = {}) => legal.find((a) => a.type === type && Object.entries(extra).every(([k, v]) => a[k] === v));
  const jitter = () => (rng() - 0.5) * 2 * cfg.noise;
  const myTeam = team(me);
  const hard = level === 'hard';
  const easy = level === 'easy';
  const deals = sampleDeals(view, rng, cfg.samples, { useReveals: hard });
  const pend = h.pending;
  const need = g.opts.target - g.scores[1 - myTeam]; 
  const myNeed = g.opts.target - g.scores[myTeam];
  const myDealt = h.dealt[me];
  const result = (action, bluff, reason) => ({ action, bluff: !!bluff, reason });
  const eOdds = () => (easy ? Math.min(1, envidoPoints(myDealt, h.muestra) / 33)
    : envidoOdds(view, deals, hard ? signalWeights(view, deals, 'envido') : null));
  const tOdds = (card = null, n = deals.length) => (easy ? crudeStrength(h.hands[me], h.muestra) + 0.1
    : handOdds(view, deals.slice(0, n), card, hard ? signalWeights(view, deals.slice(0, n), 'truco') : null));

  
  if (pend && pend.kind === 'flor') {
    const strong = florPoints(myDealt, h.muestra) >= 32;
    if (strong && has('contraflor', { resto: false })) return result(has('contraflor', { resto: false }), false, 'contraflor');
    return result(has('achico'), false, 'achico');
  }
  if (has('flor')) return result(has('flor'), false, 'flor');

  
  if (pend && pend.kind === 'envido') {
    const chain = h.envido.chain;
    const W = envidoAcceptedWorth(g, chain);
    const R = envidoRefusedWorth(chain);
    const p = eOdds() + jitter();
    const raise = legal.filter((a) => a.type === 'envido');
    if (p > cfg.raise && raise.length) {
      const falta = raise.find((a) => a.call === 'falta');
      const pick = (!easy && falta && (p > 0.93 || faltaWorth(g) >= myNeed)) ? falta
        : (raise.find((a) => a.call === 'real') || raise[0]);
      return result(pick, false, 'raise envido');
    }
    if (R >= need) return result(has('quiero'), false, 'refusing loses the game');
    if (W >= need && p < 0.5) return result(has('noquiero'), false, 'quiero could lose the game');
    const bar = easy ? 0.5 : breakEven(W, R) + (hard ? 0.08 : 0.15);
    if (p > bar) return result(has('quiero'), false, 'envido odds');
    return result(has('noquiero'), false, 'envido too weak');
  }

  
  if (pend && pend.kind === 'truco') {
    
    const envCalls = legal.filter((a) => a.type === 'envido');
    if (envCalls.length && eOdds() + jitter() > cfg.singEnvido) {
      return result(envCalls.find((a) => a.call === 'envido'), false, 'envido first');
    }
    const p = tOdds() + jitter();
    const W = TRUCO_WORTH[pend.level];
    const R = TRUCO_WORTH[pend.level - 1];
    if (R >= need) return result(has('quiero'), false, 'refusing loses the game');
    if (p > cfg.raise && has('truco')) return result(has('truco'), false, 'raise truco');
    const bar = easy ? cfg.accept + (pend.level - 1) * 0.06 : breakEven(W, R) + cfg.accept;
    if (p > bar) return result(has('quiero'), false, 'truco odds');
    return result(has('noquiero'), false, 'truco too weak');
  }

  
  const envCalls = legal.filter((a) => a.type === 'envido');
  if (envCalls.length) {
    const eo = eOdds();
    const p = eo + jitter();
    if (p > cfg.singEnvido) {
      const call = p > 0.9 && !easy ? (faltaWorth(g) <= 4 || faltaWorth(g) >= myNeed ? 'falta' : 'real') : 'envido';
      return result(envCalls.find((a) => a.call === call) || envCalls[0], false, 'envido odds');
    }
    if (eo < 0.3 && rng() < cfg.bluff) return result(envCalls.find((a) => a.call === 'envido'), true, 'envido bluff');
  }
  const trucoCall = has('truco');
  if (trucoCall) {
    const odds = tOdds();
    const bar = cfg.callTruco + h.truco.level * 0.05;
    if (odds + jitter() > bar) return result(trucoCall, false, 'truco odds');
    if (odds < 0.4 && rng() < cfg.bluff) return result(trucoCall, true, 'truco bluff');
  }
  
  const plays = legal.filter((a) => a.type === 'play');
  if (!plays.length) return result(legal[0], false, 'only move');
  if (hard && plays.length > 1) {
    let best = plays[0];
    let bestP = -1;
    for (const a of plays) {
      const p = tOdds(a.card, 60) - power(a.card, h.muestra) * 0.0005; 
      if (p > bestP) { bestP = p; best = a; }
    }
    return result(best, false, 'rollout');
  }
  const cur = h.bazas[h.bazas.length - 1];
  if (easy) {
    const cards = plays.map((a) => a.card);
    const pick = cur.length ? greedyCard(cards, cur, me, h.muestra) : cards[Math.floor(rng() * cards.length)];
    return result(plays.find((a) => a.card === pick), false, 'easy play');
  }
  const pick = greedyCard(plays.map((a) => a.card), cur, me, h.muestra);
  return result(plays.find((a) => a.card === pick), false, 'greedy');
}


export const botToMove = (view) => actor(view.game) === view.you;

export { hasFlor };
