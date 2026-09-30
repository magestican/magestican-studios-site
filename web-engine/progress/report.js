










































import { recordSession, SEEN_KEY } from '../account/account.js';
import { loadProfile } from '../account/profile.js';
import { normaliseMatch, levelEvents } from './reportModel.js';
import { snapshotOf, SNAPSHOT_KEY } from './snapshot.js';
import { isFleet } from './fleet.js';
import { ELO } from './elo.js';
import { PROFILE_GAME_IDS } from './gameIds.js';

export const PROGRESS_EVENT = 'magestican:progress';







export const REPORT_APP_GAME_IDS = PROFILE_GAME_IDS;

const optsOf = (o) => (o && typeof o === 'object' ? o : {});




function storageOf(o) {
  if (Object.prototype.hasOwnProperty.call(o, 'storage')) return o.storage;
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

function readJson(storage, key) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function announce(doc, events) {
  try {
    const d = doc !== undefined ? doc : globalThis.document;
    if (!d || typeof d.dispatchEvent !== 'function') return;
    const ev = typeof CustomEvent === 'function'
      ? new CustomEvent(PROGRESS_EVENT, { detail: events })
      : { type: PROGRESS_EVENT, detail: events };
    d.dispatchEvent(ev);
  } catch {  }
}














export async function reportMatch(m, opts) {
  try {
    const o = optsOf(opts);
    if (isFleet(o.location, o.session)) return [];
    const match = normaliseMatch(m);
    if (!match) return [];
    const storage = storageOf(o);
    const nowMs = Number.isInteger(o.nowMs) && o.nowMs > 0 ? o.nowMs : Date.now();
    const appGameIds = Array.isArray(o.appGameIds) ? o.appGameIds : REPORT_APP_GAME_IDS;

    const res = recordSession({
      match, appGameIds, storage, nowMs, tzOffsetMinutes: o.tzOffsetMinutes,
      
      
      location: o.location, session: o.session,
    });
    if (!res || !Array.isArray(res.events) || res.events.length === 0) return [];
    const xpBefore = res.before?.xp ?? res.profile.xp;
    const events = [...res.events, ...levelEvents(xpBefore, res.profile.xp)];

    try {
      const snap = snapshotOf(res.profile, nowMs, {
        appGameIds,
        seen: readJson(storage, SEEN_KEY) ?? {},
        kartRecords: res.records ?? null,
        tzOffsetMinutes: o.tzOffsetMinutes,
      });
      storage?.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
    } catch {  }

    announce(o.doc, events);
    return events;
  } catch {
    return [];
  }
}







export function myRating(game, opts) {
  const unrated = { r: ELO.start, n: 0 };
  try {
    const o = optsOf(opts);
    if (isFleet(o.location, o.session)) return null;
    
    
    const ratings = loadProfile(storageOf(o)).ratings;
    if (typeof game !== 'string' || !Object.hasOwn(ratings, game)) return unrated;
    const rating = ratings[game];
    return rating && Number.isFinite(rating.r) ? { r: rating.r, n: rating.n } : unrated;
  } catch {
    return unrated;
  }
}
