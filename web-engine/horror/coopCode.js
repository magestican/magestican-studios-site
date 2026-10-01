















import {
  roomCode, normaliseCode, gameOfCode, GAME_PREFIX, joinIdFrom, shareLinkFor,
} from '../words/coop.js';


export const FEH_PREFIX = 'feh-';

export const GAME_KEY = 'evilhills';

export const LIVE_PATH_FEH = '/play/farmy-evil-hills/';


export function fehRoomCode(random = Math.random) {
  return roomCode(random, FEH_PREFIX);
}


export function fehNormaliseCode(text) {
  return normaliseCode(text, FEH_PREFIX);
}


export function spokenFehCode(id) {
  const s = String(id ?? '');
  return s.toLowerCase().startsWith(FEH_PREFIX) ? s.slice(FEH_PREFIX.length) : s;
}






export function fehCodeError(typed) {
  const other = gameOfCode(typed);
  if (other && GAME_PREFIX[other] !== FEH_PREFIX) {
    const name = other.charAt(0).toUpperCase() + other.slice(1);
    return `That is a Farmy ${name} code. Open Farmy ${name} to use it.`;
  }
  return 'That code does not look right. Check it and try again.';
}







export function sitePrefixAgrees() {
  const site = GAME_PREFIX[GAME_KEY];
  if (site === undefined) return null;
  return site === FEH_PREFIX;
}


export function fehShareLink(href, id) {
  return shareLinkFor(href, id);
}


export const fehJoinIdFrom = joinIdFrom;
