



















import { cluesOf } from './lampsLogic.js';
import { CELL } from './lampsMatch.js';

export const LMSG = Object.freeze({
  HELLO: 'flt-hello',
  ROOM: 'flt-room',
  FILL: 'flt-fill',
  ACT: 'flt-act',
});

const MAX_FREEZE_MS = 60000;
const STATE_CHARS = new Set(Object.values(CELL).map(String));

const isRound = (r) => Number.isInteger(r) && r > 0;


export const fillMessage = (round, cell) => ({ t: LMSG.FILL, r: round, c: cell });


export function readFill(msg, cells) {
  if (!msg || typeof msg !== 'object' || msg.t !== LMSG.FILL) return null;
  if (!isRound(msg.r) || !Number.isInteger(msg.c) || msg.c < 0 || msg.c >= cells) return null;
  return { round: msg.r, cell: msg.c };
}


export function packView(view, now) {
  return {
    s: view.state.join(''),
    o: view.owner.map((v) => (v < 0 ? '.' : String(v))).join(''),
    sc: [...view.scores],
    w: [...view.wrong],
    fz: view.frozenUntil.map((t) => Math.max(0, Math.round(t - now))),
    lc: view.lastCall ? 1 : 0,
    f: view.finished ? 1 : 0,
    wi: view.winner,
  };
}

const isPair = (a, test) => Array.isArray(a) && a.length === 2 && a.every(test);






export function unpackView(pack, lines, now) {
  if (!pack || typeof pack !== 'object') return null;
  const rows = lines.length;
  const cols = lines[0].length;
  const size = rows * cols;
  const { s, o, sc, w, fz, lc, f, wi } = pack;
  if (typeof s !== 'string' || s.length !== size || typeof o !== 'string' || o.length !== size) return null;
  if (!isPair(sc, Number.isInteger)) return null;
  if (!isPair(w, (n) => Number.isInteger(n) && n >= 0)) return null;
  if (!isPair(fz, (n) => Number.isFinite(n) && n >= 0 && n <= MAX_FREEZE_MS)) return null;
  if ((lc !== 0 && lc !== 1) || (f !== 0 && f !== 1)) return null;
  if (wi !== null && wi !== 0 && wi !== 1) return null;

  const state = new Array(size);
  const owner = new Array(size);
  let litCount = 0;
  for (let i = 0; i < size; i += 1) {
    if (!STATE_CHARS.has(s[i])) return null;
    state[i] = Number(s[i]);
    if (o[i] !== '.' && o[i] !== '0' && o[i] !== '1') return null;
    owner[i] = o[i] === '.' ? -1 : Number(o[i]);
    
    if ((state[i] === CELL.LIT) !== (owner[i] >= 0)) return null;
    if (state[i] === CELL.LIT) litCount += 1;
  }
  const { rowClues, colClues } = cluesOf(lines);
  const sum = (clue) => clue.reduce((a, b) => a + b, 0);
  const total = rowClues.reduce((a, clue) => a + sum(clue), 0);
  if (litCount > total) return null;
  
  
  const litIn = (index, step, count) => {
    let n = 0;
    for (let k = 0; k < count; k += 1) if (state[index + k * step] === CELL.LIT) n += 1;
    return n;
  };
  const closedRows = rowClues.map((clue, r) => litIn(r * cols, 1, cols) === sum(clue));
  const closedCols = colClues.map((clue, c) => litIn(c, cols, rows) === sum(clue));
  return {
    rows,
    cols,
    rowClues,
    colClues,
    total,
    state,
    owner,
    litCount,
    scores: [...sc],
    wrong: [...w],
    frozenUntil: fz.map((ms) => (ms > 0 ? now + ms : 0)),
    closedRows,
    closedCols,
    lastCall: lc === 1,
    finished: f === 1,
    winner: wi,
    draw: f === 1 && wi === null,
  };
}






export function diffViews(prev, next) {
  const out = {
    fresh: !prev,
    lit: [],
    fused: [],
    off: [],
    shut: [],
    closedRows: [],
    closedCols: [],
    gained: [0, 0],
    lastCallStarted: false,
    finished: false,
  };
  if (!prev) return out;
  next.state.forEach((st, i) => {
    if (st === prev.state[i]) return;
    if (st === CELL.LIT) out.lit.push({ cell: i, seat: next.owner[i] });
    else if (st === CELL.FUSED) out.fused.push(i);
    else if (st === CELL.OFF) out.off.push(i);
    else if (st === CELL.SHUT) out.shut.push(i);
  });
  next.closedRows.forEach((on, r) => { if (on && !prev.closedRows[r]) out.closedRows.push(r); });
  next.closedCols.forEach((on, c) => { if (on && !prev.closedCols[c]) out.closedCols.push(c); });
  out.gained = next.scores.map((n, seat) => n - prev.scores[seat]);
  out.lastCallStarted = next.lastCall && !prev.lastCall;
  out.finished = next.finished && !prev.finished;
  return out;
}
