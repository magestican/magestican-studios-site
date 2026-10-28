














import {
  START_SFEN, parseSfen, toSfen, applyMove, usiToMove, moveToUsi, positionKey, inCheck, status, other,
} from './shogiRules.js';

export const SMSG = Object.freeze({ HELLO: 'fsg-hello', VIEW: 'fsg-view', ACT: 'fsg-act', SAY: 'fsg-say' });
export const MOVE_CAP = 256;
export const isBot = (id) => typeof id === 'string' && id.startsWith('bot:');
export const botLevel = (id) => (isBot(id) ? id.slice(4).split('#')[0] : null);

export const COLORS = Object.freeze(['b', 'w']);

export function createMatch({ seats, startSfen = START_SFEN } = {}) {
  const pos = parseSfen(startSfen);
  return {
    seats: [...seats],
    startSfen,
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
  if (at.length < 4) return null;
  
  const from = at[0];
  const to = keys.length - 1;
  
  const bySide = [[], []];
  for (let i = from + 1; i <= to; i += 1) bySide[i % 2].push(checks[i]);
  for (const side of [0, 1]) {
    if (bySide[side].length && bySide[side].every(Boolean)) return { perpetualBy: side };
  }
  return { draw: true };
}

function finish(match, result) {
  match.result = result;
}


export function act(match, id, action) {
  if (match.result) return false;
  const seat = seatOf(match, id);
  if (seat < 0) return false;
  const a = sanitiseAction(action);
  if (!a) return false;
  if (a.type === 'resign') {
    finish(match, { winner: 1 - seat, reason: 'resign' });
    return true;
  }
  if (seat !== seatToMove(match)) return false;
  const m = usiToMove(match.pos, a.usi);
  if (!m) return false;
  match.pos = applyMove(match.pos, m);
  match.moves.push(a.usi);
  match.keys.push(positionKey(match.pos));
  match.checks.push(inCheck(match.pos, match.pos.turn));
  const st = status(match.pos);
  if (st.over) {
    finish(match, { winner: COLORS.indexOf(st.winner), reason: st.reason });
    return true;
  }
  const rep = repetition(match.keys, match.checks);
  if (rep) {
    if (rep.perpetualBy !== undefined) {
      const loser = moverSeat(match, rep.perpetualBy);
      finish(match, { winner: 1 - loser, reason: 'perpetualCheck' });
    } else finish(match, { winner: null, reason: 'sennichite' });
    return true;
  }
  if (match.moves.length >= MOVE_CAP) finish(match, { winner: null, reason: 'moveCap' });
  return true;
}


function moverSeat(match, parity) {
  const first = COLORS.indexOf(parseSfen(match.startSfen).turn); 
  return parity === 1 ? first : 1 - first;
}

export function sanitiseAction(a) {
  if (!a || typeof a !== 'object') return null;
  if (a.type === 'resign') return { type: 'resign' };
  if (a.type === 'move' && typeof a.usi === 'string' && /^([1-9][a-i][1-9][a-i]\+?|[RBGSNLP]\*[1-9][a-i])$/.test(a.usi)) {
    return { type: 'move', usi: a.usi };
  }
  return null;
}

export const PUBLIC_SEAT = -1;


export function viewFor(match, seat) {
  return {
    you: seat,
    seats: [...match.seats],
    startSfen: match.startSfen,
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

const RESULT_REASONS = ['checkmate', 'noMoves', 'resign', 'sennichite', 'perpetualCheck', 'moveCap'];






export function sanitiseView(v) {
  if (!v || typeof v !== 'object' || !Array.isArray(v.moves)) return null;
  let match;
  try {
    match = createMatch({ seats: ['a', 'b'], startSfen: typeof v.startSfen === 'string' ? v.startSfen : START_SFEN });
  } catch {
    return null;
  }
  for (const usi of v.moves.slice(0, MOVE_CAP)) {
    const seat = seatToMove(match);
    if (!act(match, match.seats[seat], { type: 'move', usi })) break;
  }
  let result = match.result;
  const r = v.result;
  if (!result && r && typeof r === 'object' && r.reason === 'resign' && (r.winner === 0 || r.winner === 1)) {
    result = { winner: r.winner, reason: 'resign' };
  }
  return {
    you: v.you === 0 || v.you === 1 ? v.you : PUBLIC_SEAT,
    seats: Array.isArray(v.seats) ? v.seats.slice(0, 2).map((s) => (typeof s === 'string' ? s : '')) : ['', ''],
    startSfen: match.startSfen,
    moves: [...match.moves],
    result: result && RESULT_REASONS.includes(result.reason) ? { ...result } : null,
  };
}


export function positionOf(view) {
  const m = createMatch({ seats: ['a', 'b'], startSfen: view.startSfen });
  for (const usi of view.moves) {
    const mv = usiToMove(m.pos, usi);
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
  if (COLORS.indexOf(pos.turn) !== view.you || !usiToMove(pos, a.usi)) return null;
  return { ...view, moves: [...view.moves, a.usi], echo: { usi: a.usi } };
}

export { toSfen, moveToUsi, other };
