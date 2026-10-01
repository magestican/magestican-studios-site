


































import { recordPlay, normaliseProfile } from '../account/profile.js';
import { ELO, newRating, rateMatch } from './elo.js';
import { levelFromXp } from '../account/playerLevel.js';
import { titleFor } from './ranks.js';

export const OUTCOMES = Object.freeze(['win', 'loss', 'draw', 'done', 'abandoned']);

export const PLAY_ONLY = Object.freeze(['done', 'abandoned']);
export const MODES = Object.freeze(['solo', 'bots', 'local', 'online']);


const MAX_OPPONENTS = 16;

const finite = (v) => typeof v === 'number' && Number.isFinite(v);





export function normaliseMatch(m) {
  if (!m || typeof m !== 'object' || typeof m.game !== 'string' || !m.game) return null;
  const opponents = Array.isArray(m.opponents)
    ? m.opponents.filter((o) => o && typeof o === 'object').slice(0, MAX_OPPONENTS).map((o) => ({
      rating: finite(o.rating) ? o.rating : null,
      place: finite(o.place) ? o.place : null,
      human: o.human === true,
    }))
    : [];
  return {
    game: m.game,
    outcome: OUTCOMES.includes(m.outcome) ? m.outcome : 'done',
    mode: MODES.includes(m.mode) ? m.mode : 'solo',
    opponents,
    place: finite(m.place) ? m.place : null,
    seconds: finite(m.seconds) ? m.seconds : undefined,
    metrics: m.metrics && typeof m.metrics === 'object' && !Array.isArray(m.metrics) ? m.metrics : {},
  };
}


function wonOf(match) {
  
  
  
  if (PLAY_ONLY.includes(match.outcome)) return false;
  if (match.place !== null) {
    
    return match.place === 1 && !match.opponents.some((o) => o.place !== null && o.place <= 1);
  }
  return match.outcome === 'win';
}


export function sessionArgsOf(match) {
  const humans = match.opponents.filter((o) => o.human).length;
  return {
    gameId: match.game,
    won: wonOf(match),
    online: match.mode === 'online',
    humans,
    seconds: match.seconds,
    metrics: match.metrics,
  };
}


export function isRated(match) {
  return !!match && match.mode === 'online' && !PLAY_ONLY.includes(match.outcome)
    && match.opponents.some((o) => o.human);
}





export function ratingSides(match) {
  if (!isRated(match)) return null;
  const humans = match.opponents.filter((o) => o.human);
  const rOf = (o) => (o.rating !== null ? o.rating : ELO.start);
  if (match.opponents.length === 1) {
    const o = humans[0];
    if (match.place !== null) {
      
      
      const theirs = o.place !== null ? o.place : (match.place === 1 ? 2 : 1);
      return { place: match.place, opponents: [{ r: rOf(o), place: theirs }] };
    }
    const derived = { win: [1, 2], loss: [2, 1], draw: [1, 1] }[match.outcome];
    if (!derived) return null; 
    return { place: derived[0], opponents: [{ r: rOf(o), place: derived[1] }] };
  }
  if (match.place === null) return null;
  const placed = humans.filter((o) => o.place !== null).map((o) => ({ r: rOf(o), place: o.place }));
  return placed.length ? { place: match.place, opponents: placed } : null;
}


export function applyRating(profile, match, nowMs) {
  const p = normaliseProfile(profile);
  const sides = ratingSides(match);
  if (!sides) return { profile: p, events: [] };
  const mine = p.ratings[match.game] ?? newRating();
  const res = rateMatch({ ...mine, place: sides.place }, sides.opponents, nowMs);
  const rating = { r: res.r, n: res.n, peak: res.peak, at: res.at };
  return {
    profile: { ...p, ratings: { ...p.ratings, [match.game]: rating } },
    events: [{ type: 'rating', game: match.game, r: res.r, delta: res.delta, n: res.n, peak: res.peak }],
  };
}











export function applyMatch(profile, m, nowMs, tzOffsetMinutes) {
  const match = normaliseMatch(m);
  if (!match) return { profile: normaliseProfile(profile), events: [], changed: false };
  const played = recordPlay(profile, { ...sessionArgsOf(match), nowMs, tzOffsetMinutes });
  if (!played.changed) return { profile: played.profile, events: [], changed: false };
  const rated = applyRating(played.profile, match, nowMs);
  return { profile: rated.profile, events: [...played.events, ...rated.events], changed: true };
}


export function levelEvents(xpBefore, xpAfter) {
  const a = levelFromXp(xpBefore).level;
  const b = levelFromXp(xpAfter).level;
  const out = [];
  for (let lv = a + 1; lv <= b; lv++) out.push({ type: 'level', level: lv, title: titleFor(lv) });
  return out;
}
