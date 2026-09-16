






























import { netWorth, worthText } from '../economy/netWorth.mjs';
import { DAY_MS } from '../economy/clock.mjs';
import { ITALIAN_NAMES, PLAYER_NAMES } from './people.mjs';

export const BOARD = Object.freeze({
  
  show: 10,
  
  nameMax: 16,
  
  staleMs: 7 * 24 * 60 * 60 * 1000,
});








export const BOARD_BEST_KEY = 'fml.board.v1';

const UNSAFE_NAME = /[\u0000-\u001f\u007f<>\u202a-\u202e\u2066-\u2069]/g;







export function normaliseName(raw) {
  const cleaned = String(raw ?? '')
    .replace(UNSAFE_NAME, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, BOARD.nameMax)
    .trim();
  return cleaned || null;
}


export const defaultName = (build) => PLAYER_NAMES[build] || ITALIAN_NAMES[0];


export const dayOf = (world) => (world ? Math.max(1, Math.floor((world.clockAt - world.createdAt) / DAY_MS) + 1) : 1);







export function myRow(world, { name, build = null, now = 0 } = {}) {
  return Object.freeze({
    name: normaliseName(name) || defaultName(build),
    worth: Math.max(0, Math.round(netWorth(world).total)),
    day: dayOf(world),
    at: Math.max(0, Math.round(Number(now) || 0)),
  });
}


export function isPublishable(row) {
  if (!row || typeof row !== 'object') return false;
  if (normaliseName(row.name) !== row.name) return false;
  if (!Number.isInteger(row.worth) || row.worth < 0) return false;
  if (!Number.isInteger(row.day) || row.day < 1) return false;
  if (!Number.isInteger(row.at) || row.at < 0) return false;
  
  
  return Object.keys(row).length === 4;
}








export function board(rows, { show = BOARD.show } = {}) {
  return (Array.isArray(rows) ? rows : [])
    .filter(isPublishable)
    .sort((a, b) => b.worth - a.worth || a.day - b.day || String(a.name).localeCompare(String(b.name)))
    .slice(0, Math.max(0, show));
}









export function boardWithMe(rows, mine, { show = BOARD.show } = {}) {
  const all = board([...(rows || []), ...(mine && isPublishable(mine) ? [mine] : [])], { show: Infinity });
  const place = mine ? all.findIndex((r) => r.name === mine.name && r.worth === mine.worth && r.day === mine.day) : -1;
  const top = all.slice(0, show).map((r, i) => ({ ...r, place: i + 1, me: place === i }));
  if (place >= show) top.push({ ...all[place], place: place + 1, me: true });
  return top;
}


export function boardLine(row) {
  if (!row) return '';
  const days = row.day === 1 ? 'day 1' : `${row.day} days`;
  return `${row.place ? `${row.place}. ` : ''}${row.name} - ${worthText(row.worth)} - ${days}`;
}








export const boardBadge = (mine) => (mine ? worthText(mine.worth) : '');


export const isStale = (row, now, staleMs = BOARD.staleMs) => Boolean(row)
  && Number.isFinite(Number(row.at))
  && Number(now) - Number(row.at) > staleMs;
