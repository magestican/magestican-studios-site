









































import {
  HOME, LAP, TEAM_COUNT, TOKENS, YARD, isSafe, squareOf,
} from './ludoBoard.js';
import { choose } from './ludoBots.js';


export const SIXES_FORFEIT = 3;









export function start(seats) {
  return {
    seats: seats.map((s, i) => ({ kind: 'bot', by: null, name: null, ...s, team: i })),
    tokens: Array.from({ length: TEAM_COUNT }, () => Array.from({ length: TOKENS }, () => YARD)),
    turn: 0,
    
    
    
    n: 0,
    die: null,
    moves: [],
    
    
    
    awaiting: 'roll',
    sixes: 0,
    finished: [],
    winner: null,
    
    event: null,
  };
}


export function occupants(tokens, square) {
  const out = [];
  if (square === null) return out;
  for (let team = 0; team < tokens.length; team += 1) {
    for (let token = 0; token < tokens[team].length; token += 1) {
      if (squareOf(team, tokens[team][token]) === square) out.push({ team, token });
    }
  }
  return out;
}









export function movesFor(state, die) {
  const t = state.turn;
  const mine = state.tokens[t];
  const out = [];
  for (let i = 0; i < mine.length; i += 1) {
    const from = mine[i];
    if (from >= HOME) continue;                       
    let to;
    if (from === YARD) {
      if (die !== 6) continue;                        
      to = 0;
    } else {
      to = from + die;
      if (to > HOME) continue;                        
    }
    const square = squareOf(t, to);
    let captures = [];
    let safe = false;
    if (square !== null) {
      safe = isSafe(square);
      const there = occupants(state.tokens, square)
        .filter((o) => !(o.team === t && o.token === i));
      
      
      
      
      if (there.length >= 2) continue;
      if (there.length === 1 && there[0].team !== t && !safe) {
        captures = [{ ...there[0], from: state.tokens[there[0].team][there[0].token] }];
      }
    }
    out.push({
      token: i,
      from,
      to,
      captures,
      safe,
      enters: from === YARD,
      finishes: to === HOME,
      square,
    });
  }
  return out;
}


export function nextSeat(state, from = state.turn) {
  for (let i = 1; i <= TEAM_COUNT; i += 1) {
    const seat = (from + i) % TEAM_COUNT;
    if (!state.finished.includes(seat)) return seat;
  }
  return from;
}


export const allHome = (row) => row.every((p) => p >= HOME);


export const progressOf = (row) => ({
  done: row.filter((p) => p >= HOME).length,
  total: row.length,
  
  travelled: row.reduce((n, p) => n + Math.max(0, p), 0),
});











export function rolled(state, die) {
  const s = {
    ...state,
    tokens: state.tokens.map((row) => row.slice()),
    die,
    n: state.n + 1,
    event: null,
  };
  s.sixes = die === 6 ? state.sixes + 1 : 0;

  if (s.sixes >= SIXES_FORFEIT) {
    s.moves = [];
    s.sixes = 0;
    s.event = { kind: 'forfeit', team: state.turn, die };
    s.turn = nextSeat(s, state.turn);
    s.awaiting = 'roll';
    return s;
  }

  s.moves = movesFor(state, die);
  if (!s.moves.length) {
    s.sixes = 0;
    s.event = { kind: 'pass', team: state.turn, die };
    s.turn = nextSeat(s, state.turn);
    s.awaiting = 'roll';
    return s;
  }
  s.event = { kind: 'roll', team: state.turn, die };
  s.awaiting = 'move';
  return s;
}












export function moved(state, token) {
  const move = state.moves.find((m) => m.token === token);
  if (!move || state.awaiting !== 'move') {
    return { ...state, event: { kind: 'refused', team: state.turn, token } };
  }
  const tokens = state.tokens.map((row) => row.slice());
  tokens[state.turn][token] = move.to;
  for (const c of move.captures) tokens[c.team][c.token] = YARD;

  const finished = [...state.finished];
  if (allHome(tokens[state.turn]) && !finished.includes(state.turn)) finished.push(state.turn);
  const winner = state.winner ?? (finished.length ? finished[0] : null);
  const over = winner !== null;

  
  
  
  const again = state.die === 6 && !over;

  const s = {
    ...state,
    tokens,
    finished,
    winner,
    moves: [],
    sixes: again ? state.sixes : 0,
    awaiting: over ? 'over' : 'roll',
    event: {
      kind: 'move',
      team: state.turn,
      token,
      from: move.from,
      to: move.to,
      captures: move.captures,
      finishes: move.finishes,
      enters: move.enters,
      again,
      won: over ? winner : null,
    },
  };
  s.turn = again ? state.turn : nextSeat(s, state.turn);
  return s;
}
































export function stepOnce(state, entries) {
  if (state.awaiting === 'over') return { state, did: 'over' };

  if (state.awaiting === 'roll') {
    const e = entries[state.n];
    if (!e || typeof e.die !== 'number') return { state, did: 'wait-roll' };
    return { state: rolled(state, e.die), did: 'roll' };
  }

  
  const at = state.n - 1;
  const seat = state.seats[state.turn];
  const e = entries[at];

  
  
  
  
  
  
  
  
  if (e && typeof e.token === 'number') {
    if (e.by && seat.kind === 'person' && seat.by && e.by !== seat.by) {
      
      
      
      return { state, did: 'stuck' };
    }
    if (!state.moves.some((m) => m.token === e.token)) {
      
      
      
      
      return { state, did: 'stuck' };
    }
    return { state: moved(state, e.token), did: 'move' };
  }

  if (seat.kind === 'bot') return { state: moved(state, choose(state)), did: 'move' };
  return { state, did: 'wait-move' };
}








export function advance(state, entries, limit = 20000) {
  let s = state;
  for (let i = 0; i < limit; i += 1) {
    const r = stepOnce(s, entries);
    s = r.state;
    if (r.did === 'wait-roll' || r.did === 'wait-move' || r.did === 'stuck' || r.did === 'over') {
      return { state: s, did: r.did };
    }
  }
  return { state: s, did: 'limit' };
}


export function replay(seats, entries) {
  return advance(start(seats), entries).state;
}








export function standings(state) {
  return state.seats
    .map((seat, team) => ({
      team,
      seat,
      ...progressOf(state.tokens[team]),
      place: state.finished.indexOf(team),
      won: state.winner === team,
    }))
    .sort((a, b) => {
      const ap = a.place < 0 ? 99 : a.place;
      const bp = b.place < 0 ? 99 : b.place;
      if (ap !== bp) return ap - bp;
      if (a.done !== b.done) return b.done - a.done;
      if (a.travelled !== b.travelled) return b.travelled - a.travelled;
      return a.team - b.team;
    });
}
