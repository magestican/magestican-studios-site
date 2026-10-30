

import { MAX_PLAYERS } from './scaling.js';


const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const NAME_MAX = 12;
export const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

const BLOCKED = ['fuck', 'shit', 'cunt', 'bitch', 'dick', 'cock', 'pussy', 'nigg', 'fag', 'slut', 'whore', 'rape', 'nazi'];


export function makeCode(rand) {
  let s = '';
  for (let i = 0; i < 5; i++) s += CODE_LETTERS[Math.floor(rand() * CODE_LETTERS.length) % CODE_LETTERS.length];
  return s;
}


export const isCode = (s) => typeof s === 'string' && /^[A-HJ-NP-Z]{5}$/.test(s);


export function cleanName(raw) {
  
  let s = String(raw ?? '').replace(/[\u0000-\u001f\u007f-\u009f]/g, '');
  for (const w of BLOCKED) s = s.replace(new RegExp(w, 'gi'), '');
  s = s.replace(/\s+/g, ' ').trim();
  s = [...s].slice(0, NAME_MAX).join('').trim();
  return s || 'Player';
}





export function newRoom({ code, hostId, hostName, stage, seed, difficulty, nowMs }) {
  return {
    code,
    stage,
    seed,
    difficulty,
    hostId,
    state:  ('lobby'),
    startAt: 0,
    expireAt: nowMs + ROOM_TTL_MS,
    players: { [hostId]: { name: cleanName(hostName), joinedAt: nowMs } },
  };
}








export function joinCheck(room, uid, nowMs) {
  if (!room) return { ok: false, reason: 'missing' };
  if (nowMs > room.expireAt) return { ok: false, reason: 'expired' };
  if (room.state === 'over') return { ok: false, reason: 'over' };
  if (!room.players[uid] && Object.keys(room.players).length >= MAX_PLAYERS) return { ok: false, reason: 'full' };
  return { ok: true, late: room.state === 'playing' };
}


export function withPlayer(room, uid, name, nowMs) {
  const c = joinCheck(room, uid, nowMs);
  if (!c.ok) throw new Error(`cannot join: ${c.reason}`);
  return { ...room, players: { ...room.players, [uid]: { name: cleanName(name), joinedAt: nowMs } } };
}
