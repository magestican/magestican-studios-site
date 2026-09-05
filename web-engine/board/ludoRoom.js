





























import { dieFrom, verifyLink } from './ludoDie.js';
import { TEAM_COUNT } from './ludoBoard.js';


export const GAME_ID = 'farmy-ludo';














export const MSG = Object.freeze({
  SETUP: 'ludo-setup',
  
  
  
  
  
  READY: 'ludo-ready',
  ROLL: 'ludo-roll',
  MOVE: 'ludo-move',
  SAY: 'ludo-say',
});


export const foreign = (message) => !message || message.g !== GAME_ID;



















export function seatsFor({ peers = [], host = null, names = {} } = {}) {
  const others = peers.filter((p) => p && p !== host).sort();
  const order = [...(host ? [host] : []), ...others].slice(0, TEAM_COUNT);
  return Array.from({ length: TEAM_COUNT }, (unused, team) => {
    const by = order[team] ?? null;
    return by
      ? { team, kind: 'person', by, name: names[by] ?? null }
      : { team, kind: 'bot', by: null, name: null };
  });
}


export const seatOf = (seats, me) => seats.findIndex((s) => s.by && s.by === me);















export function acceptRoll(entries, head, n, link, headAt = 0) {
  if (!Number.isInteger(n) || n < 0) return { ok: false, why: 'a roll with no number' };
  if (n < headAt) return { ok: false, why: 'a roll from before the current chain' };
  if (entries[n]) {
    
    
    
    
    return entries[n].link === link
      ? { ok: false, why: 'already had that roll', duplicate: true }
      : { ok: false, why: 'a second, different die for the same roll' };
  }
  
  
  
  
  
  const previous = n === headAt ? head : entries[n - 1]?.link;
  if (!previous) return { ok: false, why: 'the earlier rolls have not arrived yet', early: true };
  if (!verifyLink(link, previous)) return { ok: false, why: 'that die does not match the die chain' };
  return { ok: true, die: dieFrom(link) };
}










export function withEntry(entries, n, patch) {
  const out = entries.slice();
  out[n] = { ...(out[n] ?? {}), ...patch };
  return out;
}









export function acceptMove(state, seats, { n, token, by }) {
  if (state.awaiting !== 'move') return { ok: false, why: 'nothing to move right now' };
  if (n !== state.n - 1) return { ok: false, why: 'a move for a different roll' };
  const seat = seats[state.turn];
  if (!seat || seat.by !== by) return { ok: false, why: 'not that player to move' };
  if (!state.moves.some((m) => m.token === token)) return { ok: false, why: 'that token cannot move' };
  return { ok: true };
}









export const SAYINGS = Object.freeze([
  { id: 'hello', text: 'Hello!' },
  { id: 'nice', text: 'Good move.' },
  { id: 'oops', text: 'Oh no.' },
  { id: 'sorry', text: 'Sorry about that.' },
  { id: 'yourgo', text: 'Your go.' },
  { id: 'wellplayed', text: 'Well played.' },
]);

export const sayingText = (id) => SAYINGS.find((s) => s.id === id)?.text ?? null;
