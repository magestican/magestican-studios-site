












import {
  RULES, BLACK, WHITE, newGame, play, isLegal, fiveAt, isDoubleThree, other,
} from './gomokuRules.js';






export const GMSG = Object.freeze({
  HELLO: 'fgo-hello',
  LOG: 'fgo-log',
  
  DELTA: 'fgo-dlt',
  NEED: 'fgo-need',
  ACT: 'fgo-act',
  SAY: 'fgo-say',
});

export const SEATS = 2;
export const SOLO = 'you';


export function createMatch({ seats = [SOLO, 'bot'], rules = 'free' } = {}) {
  return { seats: seats.slice(0, SEATS), rules, moves: [] };
}

export const colourOfSeat = (seat) => (seat === 0 ? BLACK : WHITE);
export const seatOfColour = (colour) => (colour === BLACK ? 0 : 1);
export const seatOf = (state, id) => state.seats.indexOf(id);
export const isMyTurn = (state, id) => !state.game.over && state.seats[seatOfColour(state.game.turn)] === id;






export function replayMatch({ seats = [SOLO, 'bot'], rules = 'free', moves = [] } = {}) {
  let game = newGame({ rules: RULES.includes(rules) ? rules : 'free' });
  let broke = null;
  for (let k = 0; k < moves.length; k++) {
    if (!isLegal(game, moves[k])) { broke = k; break; }
    game = play(game, moves[k]);
  }
  return { seats: seats.slice(0, SEATS), game, broke };
}





export function applyAction(state, action) {
  const { game } = state;
  if (game.over) return { error: 'The game is over. Start a new one.' };
  if (!action || action.kind !== 'move') return { error: 'That is not a move.' };
  if (action.by !== undefined && action.by !== null) {
    const seat = seatOf(state, action.by);
    if (seat < 0) return { error: 'You are watching this game, not playing it.' };
    if (colourOfSeat(seat) !== game.turn) return { error: 'It is not your turn yet.' };
  }
  const at = Number(action.at);
  if (!Number.isInteger(at) || at < 0 || at >= game.cells.length) return { error: 'That point is not on the board.' };
  if (game.cells[at] !== 0) return { error: 'That point is already taken.' };
  if (!isLegal(game, at)) {
    
    if (game.rules === 'omok' && !fiveAt(game.cells, game.size, at, game.turn, game.rules)
      && isDoubleThree(game.cells, game.size, at, game.turn)) {
      return { error: 'A double-three is not allowed in omok.', rule: 'doubleThree' };
    }
    return { error: 'That move is not allowed.' };
  }
  return { at };
}


export const withMove = (match, at) => ({ seats: match.seats, rules: match.rules, moves: [...match.moves, at] });






export function undoPlies(state, { me = SOLO, bots = [] } = {}) {
  const n = state.game.moves.length;
  if (!n) return 0;
  const opponent = state.seats.find((s) => s !== me);
  if (!bots.includes(opponent)) return 1;
  const lastBy = state.seats[seatOfColour(other(state.game.turn))];
  return lastBy === me ? 1 : Math.min(2, n);
}


export function undoMatch(match, count) {
  const keep = Math.max(0, match.moves.length - Math.max(0, count));
  return { seats: match.seats, rules: match.rules, moves: match.moves.slice(0, keep) };
}





export function seatsWith(seats, id, started) {
  if (!id || seats.includes(id) || started) return seats;
  if (seats.length >= SEATS) return [seats[0], id];
  return [...seats, id];
}


export const rematch = (match) => ({ seats: [...match.seats].reverse(), rules: match.rules, moves: [] });


export function winnerSeat(state) {
  const { game } = state;
  if (!game.over || !game.winner) return null;
  return seatOfColour(game.winner);
}


export function sanitiseMatch(m) {
  const seats = Array.isArray(m?.seats) ? m.seats.filter((s) => typeof s === 'string').slice(0, SEATS) : [];
  const rules = RULES.includes(m?.rules) ? m.rules : 'free';
  const moves = Array.isArray(m?.moves) ? m.moves.filter((x) => Number.isInteger(x) && x >= 0 && x < 225) : [];
  return { seats, rules, moves };
}
