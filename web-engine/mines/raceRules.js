



























import { PRESETS, newGame, reveal, gameFrom } from './minesRules.js';


export const RMSG = Object.freeze({
  HELLO: 'fms-hello', 
  LOG: 'fms-log',     
  ACT: 'fms-act',     
  PROG: 'fms-prog',   
  NEED: 'fms-need',   
});

export const RACE_LEVELS = Object.freeze(['beginner', 'intermediate', 'expert']);
export const SEATS = 2;
export const COUNTDOWN_MS = 3000;
export const RESULT_GRACE_MS = 300;


export const ST = Object.freeze({ PLAY: 'p', WON: 'w', BOOM: 'b' });

const isLevel = (l) => RACE_LEVELS.includes(l);
const isSeed = (s) => Number.isInteger(s) && s >= 0 && s < 2 ** 32;


function startCell(seed, rows, cols) {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h % (rows * cols);
}






export function raceLayout({ seed, level }) {
  const p = PRESETS[isLevel(level) ? level : 'beginner'];
  const g = newGame({ ...p, seed, now: () => 0 });
  const start = startCell(seed >>> 0, p.rows, p.cols);
  reveal(g, Math.floor(start / p.cols), start % p.cols);
  return {
    rows: p.rows, cols: p.cols, mines: p.mines, level: isLevel(level) ? level : 'beginner', seed,
    mine: g.cells.map((c) => c.mine), start,
  };
}


export function indexMap(layout, transpose = false) {
  const { rows, cols } = layout;
  if (!transpose) return { rows, cols, toCanon: (i) => i, toLocal: (i) => i };
  
  return {
    rows: cols, cols: rows,
    toCanon: (i) => (i % rows) * cols + Math.floor(i / rows),
    toLocal: (i) => (i % cols) * rows + Math.floor(i / cols),
  };
}





export function raceBoard(layout, { transpose = false, now } = {}) {
  const m = indexMap(layout, transpose);
  const lines = [];
  for (let r = 0; r < m.rows; r++) {
    let s = '';
    for (let c = 0; c < m.cols; c++) s += layout.mine[m.toCanon(r * m.cols + c)] ? '*' : '.';
    lines.push(s);
  }
  const g = gameFrom(lines, { now });
  const at = m.toLocal(layout.start);
  reveal(g, Math.floor(at / m.cols), at % m.cols);
  return { g, map: m };
}


export const safeCells = (layout) => layout.rows * layout.cols - layout.mines;


export function openedCanon(g, map) {
  const out = [];
  g.cells.forEach((c, i) => { if (c.open && !c.mine) out.push(map.toCanon(i)); });
  return out.sort((a, b) => a - b);
}


export function flagsCanon(g, map) {
  const out = [];
  g.cells.forEach((c, i) => { if (c.flag && !c.open) out.push(map.toCanon(i)); });
  return out.sort((a, b) => a - b);
}


export function seatsWith(seats, id, started) {
  if (!id || seats.includes(id) || started) return seats;
  if (seats.length >= SEATS) {
    const free = seats.findIndex((s, i) => i > 0 && !looksLikePeer(s));
    if (free < 0) return seats;
    return seats.map((s, i) => (i === free ? id : s));
  }
  return [...seats, id];
}

const PLACEHOLDERS = new Set(['host', 'guest']);
const looksLikePeer = (s) => typeof s === 'string' && !PLACEHOLDERS.has(s);
export const isRealSeat = looksLikePeer;


export const raceRunning = (room) => !!(room?.race && !(room.result && room.result.round === room.race.round));


export const createRoom = ({ seats = ['host', 'guest'], level = 'beginner' } = {}) => ({
  seats: [...seats], level: isLevel(level) ? level : 'beginner', race: null, result: null,
});


export function startRace(room, seed) {
  const round = (room.race?.round ?? 0) + 1;
  return { ...room, race: { seed: seed >>> 0, level: room.level, round }, result: null };
}


export const canStart = (room) => room.seats.length === SEATS && room.seats.every(isRealSeat) && !raceRunning(room);


export const acceptProgress = (room, from) => typeof from === 'string' && room.seats.includes(from) && isRealSeat(from);


export function sanitiseRoom(m) {
  const seats = Array.isArray(m?.seats) ? m.seats.filter((s) => typeof s === 'string' && s.length <= 64).slice(0, SEATS) : [];
  const level = isLevel(m?.level) ? m.level : 'beginner';
  let race = null;
  if (m?.race && isSeed(m.race.seed) && isLevel(m.race.level) && Number.isInteger(m.race.round) && m.race.round > 0) {
    race = { seed: m.race.seed, level: m.race.level, round: m.race.round };
  }
  let result = null;
  const r = m?.result;
  if (race && r && r.round === race.round && ['clear', 'boom', 'draw', 'left'].includes(r.why)
      && (r.winner === null || seats.includes(r.winner))) {
    result = { round: r.round, winner: r.winner, why: r.why };
  }
  return { seats, level, race, result };
}






export function decideRace({ seats, reports, now, grace = RESULT_GRACE_MS }) {
  const players = seats.filter(isRealSeat);
  if (players.length !== SEATS) return null;
  const rep = (id) => reports[id] || { st: ST.PLAY, e: 0, n: 0, at: Infinity };
  const decisive = players.filter((id) => rep(id).st === ST.WON || rep(id).st === ST.BOOM);
  if (!decisive.length) return null;
  const first = Math.min(...decisive.map((id) => rep(id).at));
  
  if (decisive.length < SEATS && now - first < grace) return null;
  const inWindow = decisive.filter((id) => rep(id).at - first <= grace);
  const other = (id) => players.find((p) => p !== id);
  if (inWindow.length === 1) {
    const id = inWindow[0];
    return rep(id).st === ST.WON ? { winner: id, why: 'clear' } : { winner: other(id), why: 'boom' };
  }
  const [a, b] = inWindow;
  const A = rep(a); const B = rep(b);
  if (A.st === ST.WON && B.st !== ST.WON) return { winner: a, why: 'clear' };
  if (B.st === ST.WON && A.st !== ST.WON) return { winner: b, why: 'clear' };
  if (A.st === ST.WON) {
    if (A.e !== B.e) return { winner: A.e < B.e ? a : b, why: 'clear' };
    return { winner: null, why: 'draw' };
  }
  if (A.n !== B.n) return { winner: A.n > B.n ? a : b, why: 'boom' };
  return { winner: null, why: 'draw' };
}
