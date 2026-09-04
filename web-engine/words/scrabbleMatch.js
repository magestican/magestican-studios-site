





































































import {
  RACK_SIZE, BLANK, newBoard, newBag, shuffled, seededRandom, refill, draw,
  withPlacement, removeTiles, tilesUsedBy, exchange, judge, isEmptyBoard,
  endReason, finalAdjustments, rackValue, SCORELESS_LIMIT,
} from './scrabbleRules.js';


export const SMSG = Object.freeze({
  HELLO: 'fs-hello',   
  ACT: 'fs-act',       
  LOG: 'fs-log',       
  SAY: 'fs-say',       
  WHERE: 'fs-where',   
});


export const ACTIONS = Object.freeze({
  PLAY: 'play',
  PASS: 'pass',
  EXCHANGE: 'exchange',
});


export const MAX_SEATS = 4;










export function createMatch({ seed = 1, seats = ['solo'] } = {}) {
  const players = seats.slice(0, MAX_SEATS);
  let bag = shuffled(newBag(), seededRandom(seed));
  const racks = [];
  for (let i = 0; i < players.length; i += 1) {
    const { drawn, bag: rest } = draw(bag, RACK_SIZE);
    racks.push(drawn);
    bag = rest;
  }
  return {
    seed,
    seats: players,
    board: newBoard(),
    bag,
    racks,
    scores: players.map(() => 0),
    turn: 0,
    
    history: [],
    
    scoreless: 0,
    over: false,
    ending: null,
    
    last: null,
  };
}


export const seatToPlay = (state) => state.seats[state.turn] ?? null;


export const seatOf = (state, id) => state.seats.indexOf(id);


export const isMyTurn = (state, id) => !state.over && seatToPlay(state) === id;










const nextTurn = (state) => (state.turn + 1) % Math.max(1, state.seats.length);









const stirFor = (state) => seededRandom((state.seed >>> 0) + state.history.length * 7919 + 13);












export function applyAction(state, action, isWord) {
  if (state.over) return { state, error: 'The game is over.' };
  const { kind, seat } = action ?? {};
  if (!Number.isInteger(seat) || seat < 0 || seat >= state.seats.length) {
    return { state, error: 'That player is not in this game.' };
  }
  if (seat !== state.turn) return { state, error: 'It is not your turn yet.' };

  if (kind === ACTIONS.PLAY) return playAction(state, action, isWord);
  if (kind === ACTIONS.PASS) return passAction(state, action);
  if (kind === ACTIONS.EXCHANGE) return exchangeAction(state, action);
  return { state, error: 'That is not a move.' };
}

function playAction(state, action, isWord) {
  const { seat, placed = [] } = action;
  const rack = state.racks[seat];
  
  
  
  
  const left = removeTiles(rack, tilesUsedBy(placed));
  if (!left) return { state, error: 'Those tiles are not on your rack.' };

  const verdict = judge(state.board, placed, isWord);
  if (!verdict.ok) return { state, error: verdict.reason };

  const board = withPlacement(state.board, placed);
  const filled = refill(left, state.bag);
  const racks = state.racks.slice();
  racks[seat] = filled.rack;
  const scores = state.scores.slice();
  scores[seat] += verdict.score;

  const next = {
    ...state,
    board,
    bag: filled.bag,
    racks,
    scores,
    turn: nextTurn(state),
    
    
    
    scoreless: 0,
    history: [...state.history, {
      seat, kind: ACTIONS.PLAY, placed, score: verdict.score, bingo: verdict.bingo,
      words: verdict.words.map((w) => ({ word: w.word, score: w.score })),
    }],
    last: { seat, placed, score: verdict.score, words: verdict.words.map((w) => w.word), bingo: verdict.bingo },
  };
  return { state: finishIfOver(next), error: null };
}

function passAction(state, action) {
  const { seat } = action;
  const next = {
    ...state,
    turn: nextTurn(state),
    scoreless: state.scoreless + 1,
    history: [...state.history, { seat, kind: ACTIONS.PASS, score: 0 }],
    last: { seat, kind: ACTIONS.PASS },
  };
  return { state: finishIfOver(next), error: null };
}

function exchangeAction(state, action) {
  const { seat, tiles = [] } = action;
  if (tiles.length === 0) return { state, error: 'Choose the tiles you want to swap.' };
  
  
  
  
  if (state.bag.length < RACK_SIZE) {
    return { state, error: `There are only ${state.bag.length} tiles left, so no more swapping.` };
  }
  const swapped = exchange(state.racks[seat], state.bag, tiles, stirFor(state));
  if (!swapped) return { state, error: 'Those tiles are not on your rack.' };
  const racks = state.racks.slice();
  racks[seat] = swapped.rack;
  const next = {
    ...state,
    racks,
    bag: swapped.bag,
    turn: nextTurn(state),
    scoreless: state.scoreless + 1,
    history: [...state.history, { seat, kind: ACTIONS.EXCHANGE, count: tiles.length, score: 0 }],
    last: { seat, kind: ACTIONS.EXCHANGE, count: tiles.length },
  };
  return { state: finishIfOver(next), error: null };
}










function finishIfOver(state) {
  const reason = endReason({
    bagLeft: state.bag.length,
    racks: state.racks,
    scorelessTurns: state.scoreless,
  });
  if (!reason) return state;
  const wentOut = reason === 'out' ? state.racks.findIndex((r) => r.length === 0) : -1;
  const deltas = finalAdjustments(state.racks, wentOut);
  return {
    ...state,
    over: true,
    ending: reason,
    scores: state.scores.map((s, i) => s + deltas[i]),
    adjustments: deltas,
  };
}















export function replay({ seed, seats, actions = [] }, isWord) {
  let state = createMatch({ seed, seats });
  for (const action of actions) {
    const { state: next } = applyAction(state, action, isWord);
    state = next;
  }
  return state;
}









export function viewFor(state, id) {
  const seat = seatOf(state, id);
  return {
    seat,
    watching: seat < 0,
    board: state.board,
    rack: seat >= 0 ? state.racks[seat] : [],
    counts: state.racks.map((r) => r.length),
    scores: state.scores,
    seats: state.seats,
    turn: state.turn,
    myTurn: isMyTurn(state, id),
    bagLeft: state.bag.length,
    over: state.over,
    ending: state.ending,
    last: state.last,
    firstPlay: isEmptyBoard(state.board),
    scoreless: state.scoreless,
    stallsAt: SCORELESS_LIMIT,
  };
}








export function standings(state) {
  return state.seats
    .map((id, seat) => ({
      id,
      seat,
      score: state.scores[seat],
      tilesLeft: state.racks[seat].length,
      left: rackValue(state.racks[seat]),
    }))
    .sort((a, b) => b.score - a.score)
    .map((row, i, all) => ({ ...row, place: all.findIndex((r) => r.score === row.score) + 1 }));
}


export function winnerOf(state) {
  if (!state.over) return null;
  const table = standings(state);
  if (table.length < 2) return table[0] ?? null;
  return table[0].score === table[1].score ? null : table[0];
}






export const canExchange = (state) => state.bag.length >= RACK_SIZE;


















export function seatsWith(seats, id, started) {
  if (!id || seats.includes(id)) return seats;
  if (started) return seats;
  if (seats.length >= MAX_SEATS) return seats;
  return [...seats, id];
}


export const isBlankTile = (tile) => tile === BLANK;
