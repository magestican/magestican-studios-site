





































export const SUITS = Object.freeze(['e', 'b', 'o', 'c']);
export const RANKS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 10, 11, 12]);

const POWER = (() => {
  const p = {};
  for (const s of SUITS) {
    for (const r of RANKS) {
      let v;
      if (r === 1 && s === 'e') v = 14;
      else if (r === 1 && s === 'b') v = 13;
      else if (r === 7 && s === 'e') v = 12;
      else if (r === 7 && s === 'o') v = 11;
      else if (r === 3) v = 10;
      else if (r === 2) v = 9;
      else if (r === 1) v = 8;
      else if (r === 12) v = 7;
      else if (r === 11) v = 6;
      else if (r === 10) v = 5;
      else if (r === 7) v = 4;
      else v = r - 3; 
      p[`${r}${s}`] = v;
    }
  }
  return Object.freeze(p);
})();

export const rankOf = (c) => Number(String(c).slice(0, -1));
export const suitOf = (c) => String(c).slice(-1);
export const power = (c) => POWER[c] || 0;
export const isTrucoCard = (c) => Object.prototype.hasOwnProperty.call(POWER, c);
export const ALL_CARDS = Object.freeze(Object.keys(POWER));


export const envidoValue = (c) => { const r = rankOf(c); return r >= 10 ? 0 : r; };


export function envidoPoints(cards) {
  let best = 0;
  for (const s of SUITS) {
    const vals = cards.filter((c) => suitOf(c) === s).map(envidoValue).sort((a, b) => b - a);
    if (vals.length >= 2) best = Math.max(best, 20 + vals[0] + vals[1]);
    else if (vals.length === 1) best = Math.max(best, vals[0]);
  }
  return best;
}

export const hasFlor = (cards) => cards.length === 3 && cards.every((c) => suitOf(c) === suitOf(cards[0]));
export const florPoints = (cards) => 20 + cards.reduce((a, c) => a + envidoValue(c), 0);

export const team = (seat) => seat % 2;
export const TRUCO_WORTH = Object.freeze([1, 2, 3, 4]);
const ENVIDO_WORTH = { envido: 2, real: 3 };
export const TRUCO_CALLS = Object.freeze(['truco', 'retruco', 'vale4']);


export function newGame({ players = 2, target = 15, flor = false, mano = 0 } = {}) {
  return {
    opts: { players: players === 4 ? 4 : 2, target: target === 30 ? 30 : 15, flor: !!flor },
    scores: [0, 0],
    handNo: 0,
    mano: mano % (players === 4 ? 4 : 2),
    hand: null,
    over: false,
    winner: null,
    events: [],
  };
}





export function startHand(game, hands) {
  if (game.over) return game;
  const n = game.opts.players;
  const mano = game.hand ? (game.mano + 1) % n : game.mano;
  return {
    ...game,
    mano,
    handNo: game.handNo + (game.hand ? 1 : 0),
    hand: {
      hands: hands.map((h) => h.slice()),
      dealt: hands.map((h) => h.slice()),
      bazas: [[]], 
      results: [], 
      leads: [mano], 
      turn: mano,
      truco: { level: 0, owner: null },
      pending: null, 
      trucoWait: null, 
      envido: { chain: [], done: false, result: null },
      flor: { sung: [], done: false, result: null },
      over: false,
      winner: null, 
      worth: 0,
      reason: null,
      calls: [], 
    },
    events: [],
  };
}

const nextSeat = (game, s) => (s + 1) % game.opts.players;
const hasPlayed = (h, seat, baza = 0) => (h.bazas[baza] || []).some((p) => p.seat === seat);


export function actor(game) {
  const h = game.hand;
  if (!h || h.over || game.over) return null;
  if (h.pending) return h.pending.to;
  return h.turn;
}


export function faltaWorth(game) {
  const { target } = game.opts;
  const lead = Math.max(...game.scores);
  if (target === 30 && lead < 15) return target - Math.min(...game.scores); 
  return target - lead;
}

const envidoOrder = (chain) => {
  
  const e = chain.filter((c) => c === 'envido').length;
  const hasReal = chain.includes('real');
  const hasFalta = chain.includes('falta');
  const out = [];
  if (!hasFalta) {
    if (e < 2 && !hasReal) out.push('envido');
    if (!hasReal) out.push('real');
    out.push('falta');
  }
  return out;
};


export function envidoRefusedWorth(chain) {
  if (chain.length <= 1) return 1;
  return chain.slice(0, -1).reduce((a, c) => a + (ENVIDO_WORTH[c] || 0), 0) || 1;
}


export function envidoAcceptedWorth(game, chain) {
  if (chain.includes('falta')) return faltaWorth(game);
  return chain.reduce((a, c) => a + (ENVIDO_WORTH[c] || 0), 0);
}

const florAllowed = (game) => game.opts.flor;
const myCardsAtStart = (h, seat) => h.dealt[seat] || [];


function envidoOpen(game, seat) {
  const h = game.hand;
  if (h.envido.done || h.envido.chain.length || h.flor.sung.length) return false;
  if (h.results.length > 0 || h.truco.level > 0) return false;
  if (hasPlayed(h, seat, 0)) return false;
  return true;
}

function florOpen(game, seat) {
  const h = game.hand;
  if (!florAllowed(game) || h.flor.done || h.flor.sung.includes(seat)) return false;
  if (h.results.length > 0 || hasPlayed(h, seat, 0)) return false;
  const cards = h.hands[seat];
  return Array.isArray(cards) && cards.length === 3 && cards.every(Boolean) && hasFlor(cards);
}


function teamFlorSeats(game, t) {
  const h = game.hand;
  const out = [];
  for (let s = 0; s < game.opts.players; s++) {
    if (team(s) === t && Array.isArray(h.dealt[s]) && h.dealt[s].every(Boolean) && hasFlor(h.dealt[s])) out.push(s);
  }
  return out;
}





export function legalActions(game, seat) {
  const h = game.hand;
  if (!h || h.over || game.over || actor(game) !== seat) return [];
  const out = [];
  const p = h.pending;
  if (p) {
    if (p.kind === 'truco') {
      out.push({ type: 'quiero', seat }, { type: 'noquiero', seat });
      if (p.level < 3) out.push({ type: 'truco', seat });
      if (p.level === 1 && !h.trucoWait) {
        if (florOpen(game, seat)) out.push({ type: 'flor', seat });
        else if (envidoOpen(game, seat)) for (const call of ['envido', 'real', 'falta']) out.push({ type: 'envido', seat, call });
      }
    } else if (p.kind === 'envido') {
      out.push({ type: 'quiero', seat }, { type: 'noquiero', seat });
      for (const call of envidoOrder(h.envido.chain)) out.push({ type: 'envido', seat, call });
      if (florOpen(game, seat)) out.push({ type: 'flor', seat });
    } else if (p.kind === 'flor') {
      out.push({ type: 'contraflor', seat, resto: false }, { type: 'contraflor', seat, resto: true }, { type: 'achico', seat });
    }
    return out;
  }
  for (const card of h.hands[seat] || []) if (card) out.push({ type: 'play', seat, card });
  if (florOpen(game, seat)) out.push({ type: 'flor', seat });
  else if (envidoOpen(game, seat)) for (const call of ['envido', 'real', 'falta']) out.push({ type: 'envido', seat, call });
  const t = h.truco;
  if (t.level < 3 && (t.level === 0 || t.owner === team(seat))) out.push({ type: 'truco', seat });
  out.push({ type: 'mazo', seat });
  return out;
}


export function findLegal(game, action) {
  if (!action || typeof action.type !== 'string') return undefined;
  return legalActions(game, action.seat).find((a) => a.type === action.type
    && (a.card === undefined || a.card === action.card)
    && (a.call === undefined || a.call === action.call)
    && (a.resto === undefined || !!a.resto === !!action.resto));
}


export const isLegal = (game, action) => findLegal(game, action) !== undefined;

function addPoints(game, t, pts, why) {
  const scores = game.scores.slice();
  scores[t] += pts;
  const over = scores[t] >= game.opts.target;
  return {
    ...game,
    scores,
    over: game.over || over,
    winner: game.over ? game.winner : (over ? t : null),
    events: [...game.events, { kind: 'points', team: t, pts, why }],
  };
}

function endHand(game, winnerTeam, worth, reason) {
  let g = { ...game, hand: { ...game.hand, over: true, winner: winnerTeam, worth, reason, pending: null } };
  if (!g.over) g = addPoints(g, winnerTeam, worth, reason);
  g = { ...g, hand: { ...g.hand, over: true } };
  return g;
}


export function envidoWinner(game) {
  const h = game.hand;
  const n = game.opts.players;
  let best = -1;
  let seat = -1;
  for (let k = 0; k < n; k++) {
    const s = (game.mano + k) % n;
    const pts = envidoPoints(h.dealt[s]);
    if (pts > best) { best = pts; seat = s; }
  }
  return { seat, team: team(seat), points: best };
}

function florWinner(game) {
  const h = game.hand;
  const n = game.opts.players;
  let best = -1;
  let seat = -1;
  for (let k = 0; k < n; k++) {
    const s = (game.mano + k) % n;
    if (!hasFlor(h.dealt[s])) continue;
    const pts = florPoints(h.dealt[s]);
    if (pts > best) { best = pts; seat = s; }
  }
  return { seat, team: team(seat), points: best };
}


export function handWinnerFromBazas(results, manoTeam) {
  const [r1, r2, r3] = results;
  if (results.length >= 2) {
    if (r1 !== 'parda' && r1 === r2) return r1;
    if (r1 === 'parda' && r2 !== 'parda') return r2;
    if (r1 !== 'parda' && r2 === 'parda') return r1;
  }
  if (results.length === 3) {
    if (r3 === 'parda') return r1 === 'parda' ? manoTeam : r1;
    return r3;
  }
  return null;
}

function resolveEnvido(game, accepted) {
  const h = game.hand;
  const chain = h.envido.chain;
  const by = h.pending.by; 
  let g = game;
  let result;
  if (accepted) {
    const w = envidoWinner(game);
    const pts = envidoAcceptedWorth(game, chain);
    result = { accepted: true, chain: chain.slice(), seat: w.seat, team: w.team, points: w.points, worth: pts };
    g = addPoints(g, w.team, pts, 'envido');
  } else {
    const pts = envidoRefusedWorth(chain);
    result = { accepted: false, chain: chain.slice(), team: team(by), worth: pts };
    g = addPoints(g, team(by), pts, 'envido-no');
  }
  const pending = g.hand.trucoWait || null;
  g = { ...g, hand: { ...g.hand, envido: { chain: chain.slice(), done: true, result }, pending, trucoWait: null } };
  g = { ...g, events: [...g.events, { kind: 'envido', ...result }] };
  if (g.over) g = { ...g, hand: { ...g.hand, over: true, pending: null } };
  return g;
}

function playCard(game, seat, card) {
  const h = game.hand;
  const hands = h.hands.map((x) => x.slice());
  const k = hands[seat].indexOf(card);
  hands[seat].splice(k, 1);
  const bazas = h.bazas.map((b) => b.slice());
  const cur = bazas[bazas.length - 1];
  cur.push({ seat, card });
  
  let g = { ...game, hand: { ...h, hands, bazas } };
  const n = game.opts.players;
  if (cur.length < n) {
    return { ...g, hand: { ...g.hand, turn: nextSeat(game, seat) } };
  }
  
  let top = -1;
  let winSeat = -1;
  for (const p of cur) { const v = power(p.card); if (v > top) { top = v; winSeat = p.seat; } }
  const topTeams = new Set(cur.filter((p) => power(p.card) === top).map((p) => team(p.seat)));
  const res = topTeams.size > 1 ? 'parda' : team(winSeat);
  const results = [...h.results, res];
  const lead = h.leads[h.leads.length - 1];
  
  const firstTop = cur.find((p) => power(p.card) === top).seat;
  const nextLead = res === 'parda' ? lead : firstTop;
  g = { ...g, hand: { ...g.hand, results }, events: [...g.events, { kind: 'baza', n: results.length, result: res, seat: res === 'parda' ? null : firstTop }] };
  const won = handWinnerFromBazas(results, team(game.mano));
  if (won !== null) return endHand(g, won, TRUCO_WORTH[g.hand.truco.level], 'bazas');
  return {
    ...g,
    hand: { ...g.hand, bazas: [...bazas, []], leads: [...h.leads, nextLead], turn: nextLead },
  };
}





export function apply(game, action) {
  const g = applyInner(game, action);
  if (g.error || action.type === 'play') return g;
  
  
  
  const p = game.hand.pending;
  const entry = { seat: action.seat, type: action.type };
  if (action.call) entry.call = action.call;
  if (action.type === 'truco') entry.level = p && p.kind === 'truco' ? p.level + 1 : game.hand.truco.level + 1;
  if (action.type === 'quiero' || action.type === 'noquiero') entry.of = p.kind;
  if (action.type === 'contraflor') entry.resto = !!action.resto;
  return { ...g, hand: { ...g.hand, calls: [...(game.hand.calls || []), entry] } };
}

function applyInner(game, action) {
  if (!game || game.over) return { error: 'The game is over.' };
  const h = game.hand;
  if (!h || h.over) return { error: 'The hand is over. Deal the next one.' };
  if (!action || typeof action.type !== 'string') return { error: 'That is not a move.' };
  const seat = action.seat;
  if (actor(game) !== seat) return { error: h.pending ? 'Waiting for an answer to the call.' : 'It is not your turn.' };
  const match = findLegal(game, action);
  if (!match) {
    if (action.type === 'play') return { error: 'You do not have that card.' };
    if (action.type === 'envido') return { error: 'The envido can only be sung in the first baza, before you play and before the truco is accepted.' };
    if (action.type === 'truco') return { error: 'You cannot raise the truco now.' };
    return { error: 'That is not allowed now.' };
  }
  const p = h.pending;
  const ev = (g, e) => ({ ...g, events: [...g.events, e] });
  switch (match.type) {
    case 'play': {
      
      let g = ev({ ...game, events: [] }, { kind: 'play', seat, card: match.card });
      g = playCard(g, seat, match.card);
      if (!g.hand.over && g.hand.results.length > 0 && !g.hand.envido.done) {
        g = { ...g, hand: { ...g.hand, envido: { ...g.hand.envido, done: true } } };
      }
      return g;
    }
    case 'truco': {
      const g0 = { ...game, events: [] };
      if (p && p.kind === 'truco') {
        
        const level = p.level + 1;
        return ev({ ...g0, hand: { ...h, truco: { level: p.level, owner: team(seat) }, pending: { kind: 'truco', level, by: seat, to: p.by } } },
          { kind: 'call', seat, call: TRUCO_CALLS[level - 1] });
      }
      const level = h.truco.level + 1;
      return ev({ ...g0, hand: { ...h, pending: { kind: 'truco', level, by: seat, to: nextSeat(game, seat) } } },
        { kind: 'call', seat, call: TRUCO_CALLS[level - 1] });
    }
    case 'envido': {
      const g0 = { ...game, events: [] };
      const chain = [...h.envido.chain, match.call];
      let to;
      let trucoWait = h.trucoWait;
      if (p && p.kind === 'truco') { trucoWait = p; to = p.by; }
      else if (p && p.kind === 'envido') to = p.by;
      else to = nextSeat(game, seat);
      return ev({ ...g0, hand: { ...h, trucoWait, envido: { ...h.envido, chain }, pending: { kind: 'envido', by: seat, to } } },
        { kind: 'call', seat, call: match.call });
    }
    case 'flor': {
      let g = ev({ ...game, events: [] }, { kind: 'call', seat, call: 'flor' });
      const sung = [...h.flor.sung, seat];
      
      let pending = null;
      let trucoWait = h.trucoWait;
      if (p && p.kind === 'truco') { trucoWait = p; }
      if (p && p.kind === 'envido') pending = null;
      const envido = { chain: [], done: true, result: null };
      const other = teamFlorSeats(game, 1 - team(seat)).filter((s) => !hasPlayed(h, s, 0));
      if (other.length) {
        g = { ...g, hand: { ...g.hand, envido, trucoWait, flor: { ...h.flor, sung }, pending: { kind: 'flor', by: seat, to: other[0] } } };
        return g;
      }
      
      g = { ...g, hand: { ...g.hand, envido, flor: { ...h.flor, sung, result: { team: team(seat), worth: 3 * sung.length } }, pending: trucoWait || pending, trucoWait: null } };
      g = addPoints(g, team(seat), 3, 'flor');
      if (g.over) g = { ...g, hand: { ...g.hand, over: true, pending: null } };
      return g;
    }
    case 'contraflor':
    case 'achico': {
      let g = ev({ ...game, events: [] }, { kind: 'call', seat, call: match.type === 'achico' ? 'achico' : (match.resto ? 'contraflor-resto' : 'contraflor') });
      let result;
      if (match.type === 'achico') {
        result = { team: team(p.by), worth: 4, achico: true };
      } else {
        const w = florWinner(game);
        result = { team: w.team, seat: w.seat, points: w.points, worth: match.resto ? faltaWorth(game) : 6, contra: true };
      }
      g = { ...g, hand: { ...g.hand, flor: { ...h.flor, done: true, result }, pending: h.trucoWait || null, trucoWait: null } };
      g = addPoints(g, result.team, result.worth, 'flor');
      g = ev(g, { kind: 'flor', ...result });
      if (g.over) g = { ...g, hand: { ...g.hand, over: true, pending: null } };
      return g;
    }
    case 'quiero': {
      const g0 = { ...game, events: [] };
      if (p.kind === 'envido') return resolveEnvido(ev(g0, { kind: 'answer', seat, quiero: true }), true);
      
      return ev({ ...g0, hand: { ...h, truco: { level: p.level, owner: team(seat) }, pending: null } }, { kind: 'answer', seat, quiero: true });
    }
    case 'noquiero': {
      const g0 = ev({ ...game, events: [] }, { kind: 'answer', seat, quiero: false });
      if (p.kind === 'envido') return resolveEnvido(g0, false);
      return endHand(g0, team(p.by), TRUCO_WORTH[p.level - 1], 'noquiero');
    }
    case 'mazo': {
      const g0 = ev({ ...game, events: [] }, { kind: 'mazo', seat });
      const unsung = h.results.length === 0 && !h.envido.chain.length && !h.envido.done && !h.flor.sung.length;
      return endHand(g0, 1 - team(seat), TRUCO_WORTH[h.truco.level] + (unsung ? 1 : 0), 'mazo');
    }
    default:
      return { error: 'That is not a move.' };
  }
}


export const half = (game, t) => (game.opts.target === 30 ? (game.scores[t] < 15 ? 'malas' : 'buenas') : null);
