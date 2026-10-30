
















import {
  BLACK, WHITE, PASS, SIZES, RULES, createPosition, play, fromSgf, toSgf, score, estimateDead,
} from './goRules.js';


export const XMSG = Object.freeze({ HELLO: 'fwq-hello', VIEW: 'fwq-view', ACT: 'fwq-act', SAY: 'fwq-say' });
export const RESUME = 'resume';
export const MOVE_CAP = (n) => 3 * n * n;
export const isBot = (id) => typeof id === 'string' && id.startsWith('bot:');
export const botLevel = (id) => (isBot(id) ? id.slice(4).split('#')[0] : null);

export const COLORS = Object.freeze([BLACK, WHITE]);

export function createMatch({ seats, n = 9, rules = 'japanese' } = {}) {
  if (!SIZES.includes(n)) throw new Error(`board size ${n} is not offered`);
  if (!RULES.includes(rules)) throw new Error(`unknown count "${rules}"`);
  return {
    seats: [...seats],
    n,
    rules,
    moves: [],
    pos: createPosition(n),
    phase: 'play',
    dead: [],
    count: null,
    accepts: [false, false],
    capped: false,
    result: null,
  };
}

export const seatOf = (match, id) => match.seats.indexOf(id);
export const seatToMove = (match) => COLORS.indexOf(match.pos.turn);

export const actorId = (match) => (match.result || match.phase !== 'play' ? null : match.seats[seatToMove(match)]);

function enterCount(match) {
  match.phase = 'count';
  match.dead = estimateDead(match.pos.board, match.pos.turn);
  match.count = summary(score(match.pos.board, { rules: match.rules, dead: match.dead }));
  match.accepts = match.seats.map((id) => isBot(id));
  settle(match);
}

function summary(s) {
  return { black: s.black, white: s.white, komi: s.komi, margin: s.margin, winner: s.winner };
}

function settle(match) {
  if (match.phase === 'count' && match.accepts[0] && match.accepts[1]) {
    match.result = { winner: COLORS.indexOf(match.count.winner), reason: 'score', count: { ...match.count } };
  }
}


export function act(match, id, action) {
  if (match.result) return false;
  const seat = seatOf(match, id);
  if (seat < 0) return false;
  const a = sanitiseAction(action);
  if (!a) return false;
  if (a.type === 'resign') {
    match.result = { winner: 1 - seat, reason: 'resign' };
    return true;
  }
  if (match.phase === 'count') {
    if (a.type === 'accept') {
      if (match.accepts[seat]) return false;
      match.accepts[seat] = true;
      settle(match);
      return true;
    }
    if (a.type === 'resume' && !match.capped) {
      match.phase = 'play';
      match.dead = [];
      match.count = null;
      match.accepts = [false, false];
      match.pos = { ...match.pos, passes: 0 };
      match.moves.push(RESUME);
      return true;
    }
    return false;
  }
  if (a.type !== 'move' || seat !== seatToMove(match)) return false;
  const p = fromSgf(a.mv, match.n);
  if (p === null) return false;
  const next = play(match.pos, p);
  if (!next) return false;
  match.pos = next;
  match.moves.push(a.mv);
  if (next.passes >= 2) enterCount(match);
  else if (next.plies >= MOVE_CAP(match.n)) {
    match.capped = true;
    enterCount(match);
  }
  return true;
}

export function sanitiseAction(a) {
  if (!a || typeof a !== 'object') return null;
  if (a.type === 'resign' || a.type === 'accept' || a.type === 'resume') return { type: a.type };
  if (a.type === 'move' && typeof a.mv === 'string' && /^([a-s]{2}|pass)$/.test(a.mv)) return { type: 'move', mv: a.mv };
  return null;
}

export const PUBLIC_SEAT = -1;


export function viewFor(match, seat) {
  return {
    you: seat,
    seats: [...match.seats],
    n: match.n,
    rules: match.rules,
    moves: [...match.moves],
    accepts: [...match.accepts],
    result: match.result ? { ...match.result } : null,
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

const RESULT_REASONS = ['score', 'resign'];





export function replay({ seats = ['a', 'b'], n, rules, moves = [], accepts = [false, false] }) {
  const match = createMatch({ seats, n, rules });
  for (const mv of moves.slice(0, MOVE_CAP(n) * 2)) {
    let ok;
    if (mv === RESUME) {
      
      ok = match.phase === 'count' && act(match, match.seats[0], { type: 'resume' });
    } else ok = act(match, match.seats[seatToMove(match)], { type: 'move', mv });
    if (!ok) break;
  }
  if (match.phase === 'count' && !match.result) {
    [0, 1].forEach((s) => { if (accepts[s] === true && !match.accepts[s]) act(match, match.seats[s], { type: 'accept' }); });
  }
  return match;
}


export function sanitiseView(v) {
  if (!v || typeof v !== 'object' || !Array.isArray(v.moves)) return null;
  if (!SIZES.includes(v.n) || !RULES.includes(v.rules)) return null;
  const seats = Array.isArray(v.seats) ? v.seats.slice(0, 2).map((s) => (typeof s === 'string' ? s : '')) : ['', ''];
  while (seats.length < 2) seats.push('');
  let match;
  try {
    
    match = replay({ n: v.n, rules: v.rules, moves: v.moves, accepts: Array.isArray(v.accepts) ? v.accepts : [] });
  } catch {
    return null;
  }
  let result = match.result;
  const r = v.result;
  if (!result && r && typeof r === 'object' && r.reason === 'resign' && (r.winner === 0 || r.winner === 1)) {
    result = { winner: r.winner, reason: 'resign' };
  }
  return {
    you: v.you === 0 || v.you === 1 ? v.you : PUBLIC_SEAT,
    seats,
    n: match.n,
    rules: match.rules,
    moves: [...match.moves],
    accepts: [...match.accepts],
    result: result && RESULT_REASONS.includes(result.reason) ? { ...result } : null,
  };
}


export function matchOf(view) {
  return replay({ seats: view.seats, n: view.n, rules: view.rules, moves: view.moves, accepts: view.accepts });
}


export function echoView(view, action) {
  if (!view || view.you < 0 || view.result) return null;
  const a = sanitiseAction(action);
  if (!a || a.type !== 'move') return null;
  const m = matchOf(view);
  if (m.phase !== 'play' || seatToMove(m) !== view.you) return null;
  const p = fromSgf(a.mv, m.n);
  if (p === null || !play(m.pos, p)) return null;
  return { ...view, moves: [...view.moves, a.mv], echo: { mv: a.mv } };
}

export { toSgf, fromSgf, PASS };
