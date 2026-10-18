
















import { newGame, judge, play, forfeit, winner } from './wordchainRules.js';
import { LANGS, isLink, defaultLink } from './wordchainLang.js';


export const WMSG = Object.freeze({
  HELLO: 'fwc-hello',
  LOG: 'fwc-log',
  
  DELTA: 'fwc-dlt',
  NEED: 'fwc-need',
  ACT: 'fwc-act',
});

export const SEATS = 2;
export const SOLO = 'you';
export const TIMERS = Object.freeze([10, 15, 20, 30, 0]); 
export const DEFAULT_TIMER = 20;
const MARK = Object.freeze({ timeout: '!timeout', resign: '!resign' });
const MAX_LOG = 600;

export function createMatch({ seats = [SOLO, 'bot'], lang = 'en', link, timer = DEFAULT_TIMER } = {}) {
  const l = LANGS.includes(lang) ? lang : 'en';
  return {
    seats: seats.slice(0, SEATS),
    lang: l,
    link: isLink(l, link) ? link : defaultLink(l),
    timer: TIMERS.includes(timer) ? timer : DEFAULT_TIMER,
    log: [],
  };
}

export const seatOf = (state, id) => state.seats.indexOf(id);
export const isMyTurn = (state, id) => !state.game.over && state.seats[state.game.turn] === id;






export function replayMatch(dict, match) {
  let game = newGame({ lang: match.lang, link: match.link });
  let broke = null;
  for (let k = 0; k < match.log.length; k++) {
    const t = match.log[k];
    if (t === MARK.timeout || t === MARK.resign) {
      if (game.over) { broke = k; break; }
      game = forfeit(game, t.slice(1));
      continue;
    }
    const j = judge(dict, game, t);
    if (j.entry === undefined) { broke = k; break; }
    game = play(dict, game, j.entry);
  }
  return { seats: match.seats.slice(0, SEATS), game, broke };
}






export function applyAction(dict, state, action) {
  const { game } = state;
  if (game.over) return { error: 'over' };
  if (!action || typeof action !== 'object') return { error: 'bad' };
  if (action.by !== undefined && action.by !== null && action.kind !== 'timeout') {
    const seat = seatOf(state, action.by);
    if (seat < 0) return { error: 'watching' };
    
    if (seat !== game.turn) return { error: 'turn' };
  }
  if (action.kind === 'resign') return { token: MARK.resign };
  if (action.kind === 'timeout') return { token: MARK.timeout };
  if (action.kind !== 'word') return { error: 'bad' };
  const j = judge(dict, game, action.text);
  if (j.error) return { error: j.error };
  return { token: dict.words[j.entry], entry: j.entry };
}


export const withToken = (match, token) => ({ ...match, log: [...match.log, token] });


export function seatsWith(seats, id, started) {
  if (!id || seats.includes(id) || started) return seats;
  if (seats.length >= SEATS) return [seats[0], id];
  return [...seats, id];
}


export const rematch = (match) => ({ ...match, seats: [...match.seats].reverse(), log: [] });


export const winnerSeat = (state) => winner(state.game);


export function sanitiseMatch(m) {
  const seats = Array.isArray(m?.seats) ? m.seats.filter((s) => typeof s === 'string').slice(0, SEATS) : [];
  const lang = LANGS.includes(m?.lang) ? m.lang : 'en';
  const link = isLink(lang, m?.link) ? m.link : defaultLink(lang);
  const timer = TIMERS.includes(m?.timer) ? m.timer : DEFAULT_TIMER;
  const log = Array.isArray(m?.log) ? m.log.filter((t) => typeof t === 'string' && t.length <= 40).slice(0, MAX_LOG) : [];
  return { seats, lang, link, timer, log };
}
