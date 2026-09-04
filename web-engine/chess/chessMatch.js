




















































import { fromFen, START_FEN, WHITE, BLACK } from './position.js';
import { legalMoves, makeMove, moveFromKey, moveKey, inCheck } from './moves.js';
import { outcomeOf, refuse, describeState, capturedBy, materialOf } from './outcome.js';
import { toSan, moveList, speakMove } from './notation.js';
import { BOT_ID, isBot } from './chessBot.js';


export const CMSG = Object.freeze({
  HELLO: 'fchess-hello',   
  LOG: 'fchess-log',       
  ACT: 'fchess-act',       
  SAY: 'fchess-say',       
});


export const SOLO = 'you';


export function newMatch({ seats = [SOLO, BOT_ID], startFen = START_FEN } = {}) {
  return { startFen, seats: [...seats], moves: [], resigned: null };
}










export function replay(match) {
  const start = fromFen(match?.startFen || START_FEN);
  const positions = [start];
  const played = [];
  for (const key of match?.moves ?? []) {
    const at = positions[positions.length - 1];
    const m = moveFromKey(at, key);
    
    
    
    
    if (!m) break;
    played.push(m);
    positions.push(makeMove(at, m));
  }
  const pos = positions[positions.length - 1];
  const outcome = outcomeOf(positions, { resigned: match?.resigned ?? null });
  const seats = match?.seats ?? [SOLO, BOT_ID];
  return {
    startFen: match?.startFen || START_FEN,
    seats,
    positions,
    moves: played,
    pos,
    turn: pos.turn,
    turnId: pos.turn === WHITE ? seats[0] : seats[1],
    check: inCheck(pos),
    outcome,
    over: outcome.over,
    resigned: match?.resigned ?? null,
    legal: legalMoves(pos),
    material: materialOf(pos),
    captured: capturedBy(played),
    list: moveList(positions, played),
    last: played.length ? played[played.length - 1] : null,
    lastFrom: played.length ? played[played.length - 1].from : -1,
    lastTo: played.length ? played[played.length - 1].to : -1,
  };
}


export function sideFor(seats, id) {
  if (seats[0] === id) return WHITE;
  if (seats[1] === id) return BLACK;
  return 0;
}


export function isMyTurn(derived, id) {
  return !derived.over && derived.turnId === id;
}


export function sanFor(derived, m) {
  return toSan(derived.pos, m, derived.legal);
}


export function speakFor(derived, m) {
  return speakMove(derived.pos, m);
}










export function applyMove(match, key, by) {
  const derived = replay(match);
  if (derived.over) return { error: 'The game is over. Start a new one.' };
  if (by !== undefined && by !== null && derived.turnId !== by) {
    return { error: 'It is not your move.' };
  }
  const pos = derived.pos;
  const m = moveFromKey(pos, key);
  if (!m) {
    const [from, to] = squaresOf(key);
    return { error: refuse(pos, from, to) ?? 'That move is not allowed.' };
  }
  return { match: { ...match, moves: [...match.moves, moveKey(m)] } };
}

function squaresOf(key) {
  const s = String(key ?? '').toLowerCase();
  const at = (name) => {
    const file = 'abcdefgh'.indexOf(name[0]);
    const rank = 8 - Number(name[1]);
    return file < 0 || !(rank >= 0 && rank <= 7) ? -1 : rank * 8 + file;
  };
  return [at(s.slice(0, 2)), at(s.slice(2, 4))];
}















export function undo(match) {
  if (!match.moves.length && !match.resigned) return { error: 'There is nothing to take back.' };
  if (match.resigned) return { match: { ...match, resigned: null } };
  const back = match.seats.some(isBot) && match.moves.length >= 2 ? 2 : 1;
  return { match: { ...match, moves: match.moves.slice(0, -back) } };
}


export function resign(match, by) {
  const side = sideFor(match.seats, by);
  if (!side) return { error: 'Only a player can resign.' };
  return { match: { ...match, resigned: side } };
}


export function swapSides(match) {
  return { ...newMatch({ seats: [match.seats[1], match.seats[0]], startFen: match.startFen }) };
}










export function seatsWith(seats, id) {
  if (seats.includes(id)) return seats;
  const free = seats.findIndex((s) => !s);
  if (free >= 0) return seats.map((s, i) => (i === free ? id : s));
  const bot = seats.findIndex(isBot);
  if (bot >= 0) return seats.map((s, i) => (i === bot ? id : s));
  return seats;
}


export function describeMatch(derived, { names = {}, me = null } = {}) {
  const label = (id) => (id === me ? 'You' : (names[id] ?? (isBot(id) ? 'The bot' : 'The other player')));
  return describeState(derived.positions, {
    resigned: derived.resigned,
    names: { white: label(derived.seats[0]), black: label(derived.seats[1]) },
  });
}


export function resultFor(derived, id) {
  if (!derived.over) return null;
  const side = sideFor(derived.seats, id);
  if (derived.outcome.result === '1/2-1/2') return 'draw';
  if (!side) return 'watched';
  return derived.outcome.winner === side ? 'won' : 'lost';
}
