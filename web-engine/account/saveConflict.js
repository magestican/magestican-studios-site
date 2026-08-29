














































































































import {
  normaliseProfile, reconcileProfiles, mergeProfiles, rankFor, emptyProfile,
} from './profile.js';
import { normaliseRecords, reconcileRecords, hasRecords } from './gameSave.js';
import { GAME_IDS, GAME_NAMES } from './dailyChallenge.js';


export const BACKUP_KEY = 'arbelo.account.backup.v1';


export const MAX_BACKUPS = 3;

export const RESOLUTIONS = Object.freeze(['combine', 'device', 'cloud']);


export function isSubstantial(profile) {
  const p = normaliseProfile(profile);
  return GAME_IDS.reduce((t, id) => t + (p.games[id]?.plays ?? 0), 0) > 0;
}
















export function classifyConflict(local, cloud, { disjoint = false } = {}) {
  const l = isSubstantial(local);
  const c = isSubstantial(cloud);
  if (!l || !c) return 'none';
  return disjoint ? 'ask' : 'auto';
}







export function sideSummary(profile, records) {
  const p = normaliseProfile(profile);
  const rec = normaliseRecords(records);
  const plays = GAME_IDS.map((id) => ({
    id, name: GAME_NAMES[id], plays: p.games[id]?.plays ?? 0,
  })).filter((g) => g.plays > 0);
  const total = plays.reduce((t, g) => t + g.plays, 0);
  return {
    name: p.name,
    totalPlays: total,
    games: plays,
    rank: rankFor(p.xp).name,
    xp: p.xp,
    streakBest: p.streak.best,
    streakCurrent: p.streak.current,
    daysPlayed: p.streak.daysPlayed,
    tourStamps: p.tour.stamps,
    hasRecords: hasRecords(rec),
    
    
    
    line: [
      total ? `${total} ${total === 1 ? 'game' : 'games'} played` : null,
      p.streak.best >= 2 ? `best streak ${p.streak.best} days` : null,
      rankFor(p.xp).name,
    ].filter(Boolean).join(' · '),
  };
}









export function conflictModel(local, cloud, { localRecords = null, cloudRecords = null } = {}) {
  const a = sideSummary(local, localRecords);
  const b = sideSummary(cloud, cloudRecords);
  return {
    title: 'Two lots of progress',
    body: 'This browser and the account you just signed in to have both been played. '
      + 'Nothing is deleted whichever you choose - the other one is kept on this device '
      + 'and you can put it back at any time.',
    device: { ...a, heading: 'This browser' },
    cloud: { ...b, heading: 'Your account' },
    recommended: 'combine',
    options: [
      {
        id: 'combine',
        label: 'Combine them',
        hint: 'Adds the games played and keeps the better of each record. Right if both of these are you.',
      },
      {
        id: 'device',
        label: 'Keep this browser',
        hint: 'Right if the account belongs to somebody else who used this computer.',
      },
      {
        id: 'cloud',
        label: 'Keep the account',
        hint: 'Right if this browser is not yours.',
      },
    ],
  };
}



















export function resolveConflict(local, cloud, resolution, {
  localRecords = null, cloudRecords = null,
} = {}) {
  const l = normaliseProfile(local);
  const c = normaliseProfile(cloud);
  const lr = normaliseRecords(localRecords);
  const cr = normaliseRecords(cloudRecords);
  const records = reconcileRecords(lr, cr);
  const how = RESOLUTIONS.includes(resolution) ? resolution : 'combine';
  if (how === 'device') {
    return { profile: l, records, discarded: { profile: c, records: cr, side: 'cloud' } };
  }
  if (how === 'cloud') {
    return { profile: c, records, discarded: { profile: l, records: lr, side: 'device' } };
  }
  return { profile: mergeProfiles(l, c), records, discarded: null };
}








export function reconcileAll(local, cloud, { localRecords = null, cloudRecords = null } = {}) {
  return {
    profile: reconcileProfiles(local, cloud),
    records: reconcileRecords(localRecords, cloudRecords),
    discarded: null,
  };
}













export function makeSnapshot(profile, records, { day = null, reason = 'replaced' } = {}) {
  const p = normaliseProfile(profile);
  return {
    version: 1,
    day: Number.isInteger(day) && day >= 0 ? day : null,
    reason: typeof reason === 'string' ? reason.slice(0, 32) : 'replaced',
    profile: p,
    records: normaliseRecords(records),
    
    
    label: sideSummary(p, records).line || 'Empty',
  };
}

export function normaliseBackups(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s === 'object' && s.version === 1)
    .slice(0, MAX_BACKUPS)
    .map((s) => makeSnapshot(s.profile, s.records, { day: s.day, reason: s.reason }));
}











export function pushBackup(backups, snapshot) {
  const list = normaliseBackups(backups);
  if (!snapshot || !isSubstantial(snapshot.profile)) return list;
  const dup = list.findIndex((s) => s.day === snapshot.day && s.reason === snapshot.reason);
  const rest = dup >= 0 ? list.filter((_, i) => i !== dup) : list;
  return [snapshot, ...rest].slice(0, MAX_BACKUPS);
}














export function restoreInto(current, snapshot, { currentRecords = null } = {}) {
  if (!snapshot || typeof snapshot !== 'object') {
    return { profile: normaliseProfile(current), records: normaliseRecords(currentRecords) };
  }
  return {
    profile: reconcileProfiles(current ?? emptyProfile(), snapshot.profile),
    records: reconcileRecords(currentRecords, snapshot.records),
  };
}


export function backupLines(backups) {
  return normaliseBackups(backups).map((s, i) => ({
    index: i,
    day: s.day,
    label: s.label,
    reason: s.reason,
    text: `Progress kept aside${s.day === null ? '' : ` on day ${s.day}`} - ${s.label}`,
  }));
}
