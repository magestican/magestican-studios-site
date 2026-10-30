
















import {
  START_FEN, parseFen, toFen, applyMove, iccsToMove, moveToIccs, positionKey, inCheck, status, other,
} from './xiangqiRules.js';

export const XMSG = Object.freeze({ HELLO: 'fxq-hello', VIEW: 'fxq-view', ACT: 'fxq-act', SAY: 'fxq-say' });
export const MOVE_CAP = 300;
export const IDLE_CAP = 120;
export const REPEATS = 3;
export const isBot = (id) => typeof id === 'string' && id.startsWith('bot:');
export const botLevel = (id) => (isBot(id) ? id.slice(4).split('#')[0] : null);

export const COLORS = Object.freeze(['r', 'b']);

export function createMatch({ seats, startFen = START_FEN } = {}) {
  const pos = parseFen(startFen);
  return {
    seats: [...seats],
    startFen,
    moves: [],
    pos,
    keys: [positionKey(pos)],
    checks: [false],
    result: null,
  };
}

export const seatOf = (match, id) => match.seats.indexOf(id);
export const seatToMove = (match) => COLORS.indexOf(match.pos.turn);
export const actorId = (match) => (match.result ? null : match.seats[seatToMove(match)]);


export function repetition(keys, checks) {
  const last = keys[keys.length - 1];
  const at = [];
  keys.forEach((k, i) => { if (k === last) at.push(i); });
  if (at.length < REPEATS) return null;
  
  const bySide = [[], []];
  for (let i = at[0] + 1; i < keys.length; i += 1) bySide[i % 2].push(checks[i]);
  const perpetual = [0, 1].filter((s) => bySide[s].length && bySide[s].every(Boolean));
  
  if (perpetual.length === 1) return { perpetualBy: perpetual[0] };
  return { draw: true };
}


function moverSeat(match, parity) {
  const first = COLORS.indexOf(parseFen(match.startFen).turn); 
  return parity === 1 ? first : 1 - first;
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
  if (seat !== seatToMove(match)) return false;
  const m = iccsToMove(match.pos, a.mv);
  if (!m) return false;
  match.pos = applyMove(match.pos, m);
  match.moves.push(a.mv);
  match.keys.push(positionKey(match.pos));
  match.checks.push(inCheck(match.pos, match.pos.turn));
  const st = status(match.pos);
  if (st.over) {
    match.result = { winner: COLORS.indexOf(st.winner), reason: st.reason };
    return true;
  }
  const rep = repetition(match.keys, match.checks);
  if (rep) {
    if (rep.perpetualBy !== undefined) {
      const loser = moverSeat(match, rep.perpetualBy);
      match.result = { winner: 1 - loser, reason: 'perpetualCheck' };
    } else match.result = { winner: null, reason: 'repetition' };
    return true;
  }
  if (match.pos.idle >= IDLE_CAP) match.result = { winner: null, reason: 'idle' };
  else if (match.moves.length >= MOVE_CAP) match.result = { winner: null, reason: 'moveCap' };
  return true;
}

export function sanitiseAction(a) {
  if (!a || typeof a !== 'object') return null;
  if (a.type === 'resign') return { type: 'resign' };
  if (a.type === 'move' && typeof a.mv === 'string' && /^[a-i][0-9][a-i][0-9]$/.test(a.mv)) return { type: 'move', mv: a.mv };
  return null;
}

export const PUBLIC_SEAT = -1;


export function viewFor(match, seat) {
  return {
    you: seat,
    seats: [...match.seats],
    startFen: match.startFen,
    moves: [...match.moves],
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

const RESULT_REASONS = ['checkmate', 'stalemate', 'resign', 'repetition', 'perpetualCheck', 'idle', 'moveCap'];





export function sanitiseView(v) {
  if (!v || typeof v !== 'object' || !Array.isArray(v.moves)) return null;
  let match;
  try {
    match = createMatch({ seats: ['a', 'b'], startFen: typeof v.startFen === 'string' ? v.startFen : START_FEN });
  } catch {
    return null;
  }
  for (const mv of v.moves.slice(0, MOVE_CAP)) {
    if (!act(match, match.seats[seatToMove(match)], { type: 'move', mv })) break;
  }
  let result = match.result;
  const r = v.result;
  if (!result && r && typeof r === 'object' && r.reason === 'resign' && (r.winner === 0 || r.winner === 1)) {
    result = { winner: r.winner, reason: 'resign' };
  }
  return {
    you: v.you === 0 || v.you === 1 ? v.you : PUBLIC_SEAT,
    seats: Array.isArray(v.seats) ? v.seats.slice(0, 2).map((s) => (typeof s === 'string' ? s : '')) : ['', ''],
    startFen: match.startFen,
    moves: [...match.moves],
    result: result && RESULT_REASONS.includes(result.reason) ? { ...result } : null,
  };
}


export function positionOf(view) {
  const m = createMatch({ seats: ['a', 'b'], startFen: view.startFen });
  for (const s of view.moves) {
    const mv = iccsToMove(m.pos, s);
    if (!mv) break;
    m.pos = applyMove(m.pos, mv);
  }
  return m.pos;
}


export function echoView(view, action) {
  if (!view || view.you < 0 || view.result) return null;
  const a = sanitiseAction(action);
  if (!a || a.type !== 'move') return null;
  const pos = positionOf(view);
  if (COLORS.indexOf(pos.turn) !== view.you || !iccsToMove(pos, a.mv)) return null;
  return { ...view, moves: [...view.moves, a.mv], echo: { mv: a.mv } };
}

export { toFen, moveToIccs, other };
