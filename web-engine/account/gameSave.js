




























































































import { GAME_IDS } from './dailyChallenge.js';
import { normaliseProfile, LIMITS } from './profile.js';























export const SAVE_FIELDS = Object.freeze([
  'tbKills', 'fkPodiums', 'fkPoints',
  'fkBestLapMs', 'fkBestRaceMs', 'fkBestPosition', 'fkBestPoints',
]);














export const SAVE_SYNC_ENABLED = true;

































export const CUP_TRACK_IDS = Object.freeze({
  'home-paddock': Object.freeze(['sunflower', 'muddybottom', 'frostfield']),
  'long-paddock': Object.freeze(['millrace', 'saltmarsh', 'canyon']),
});









export const CUP_SAVE_DOCS = Object.freeze({
  'home-paddock': 'records',
  'long-paddock': 'records-long-paddock',
});


export const HOME_CUP = 'home-paddock';


export const HOME_TRACK_IDS = CUP_TRACK_IDS[HOME_CUP];


export const CUP_IDS = Object.freeze(Object.keys(CUP_TRACK_IDS));









export const TRACK_IDS = Object.freeze(CUP_IDS.flatMap((c) => [...CUP_TRACK_IDS[c]]));


export const SAVE_LIMITS = Object.freeze({
  maxLapMs: 3600000,      
  maxRaceMs: 10800000,    
  maxPosition: 24,        
  maxPoints: 1000000,
  maxCount: LIMITS.maxCount,
});

const int = (v, max) => {
  const x = Math.floor(Number(v));
  return Number.isFinite(x) && x > 0 ? Math.min(x, max) : 0;
};


export function emptyRecord() {
  return { bestLapMs: 0, bestRaceMs: 0, bestPosition: 0, bestPoints: 0 };
}

export function emptyRecords() {
  const out = {};
  for (const id of TRACK_IDS) out[id] = emptyRecord();
  return out;
}


export function normaliseRecords(raw) {
  const out = emptyRecords();
  if (!raw || typeof raw !== 'object') return out;
  for (const id of TRACK_IDS) {
    const r = raw[id];
    if (!r || typeof r !== 'object') continue;
    out[id] = {
      bestLapMs: int(r.bestLapMs, SAVE_LIMITS.maxLapMs),
      bestRaceMs: int(r.bestRaceMs, SAVE_LIMITS.maxRaceMs),
      bestPosition: int(r.bestPosition, SAVE_LIMITS.maxPosition),
      bestPoints: int(r.bestPoints, SAVE_LIMITS.maxPoints),
    };
  }
  return out;
}












const secToMs = (v, max) => {
  const s = Number(v);
  if (!Number.isFinite(s) || s <= 0) return 0;
  return Math.min(max, Math.round(s * 1000));
};

const msToSec = (v) => (Number.isFinite(v) && v > 0 ? v / 1000 : null);


export function kartRecordsFrom(progress) {
  const out = emptyRecords();
  const tracks = progress?.tracks;
  if (!tracks || typeof tracks !== 'object') return out;
  for (const id of TRACK_IDS) {
    const t = tracks[id];
    if (!t || typeof t !== 'object') continue;
    out[id] = {
      bestLapMs: secToMs(t.bestLap, SAVE_LIMITS.maxLapMs),
      bestRaceMs: secToMs(t.bestRace, SAVE_LIMITS.maxRaceMs),
      bestPosition: int(t.bestPosition, SAVE_LIMITS.maxPosition),
      bestPoints: int(t.bestPoints, SAVE_LIMITS.maxPoints),
    };
  }
  return out;
}













export function applyKartRecords(progress, records) {
  const rec = normaliseRecords(records);
  const base = progress && typeof progress === 'object' ? progress : {};
  const tracks = { ...(base.tracks ?? {}) };
  let changed = false;
  for (const id of TRACK_IDS) {
    const r = rec[id];
    const prev = tracks[id] ?? {
      bestLap: null, bestRace: null, bestPosition: null, races: 0, wins: 0, bestPoints: null,
    };
    const next = { ...prev };
    const lap = msToSec(r.bestLapMs);
    const race = msToSec(r.bestRaceMs);
    if (lap !== null && (next.bestLap == null || lap < next.bestLap)) next.bestLap = lap;
    if (race !== null && (next.bestRace == null || race < next.bestRace)) next.bestRace = race;
    if (r.bestPosition > 0 && (next.bestPosition == null || r.bestPosition < next.bestPosition)) {
      next.bestPosition = r.bestPosition;
    }
    if (r.bestPoints > 0 && (next.bestPoints == null || r.bestPoints > next.bestPoints)) {
      next.bestPoints = r.bestPoints;
    }
    if (next.bestLap !== prev.bestLap || next.bestRace !== prev.bestRace
        || next.bestPosition !== prev.bestPosition || next.bestPoints !== prev.bestPoints) {
      tracks[id] = next;
      changed = true;
    }
  }
  return changed ? { ...base, tracks } : progress;
}

















export function reconcileRecords(a, b) {
  const x = normaliseRecords(a);
  const y = normaliseRecords(b);
  const lower = (m, n) => (m > 0 && n > 0 ? Math.min(m, n) : Math.max(m, n));
  const out = {};
  for (const id of TRACK_IDS) {
    out[id] = {
      bestLapMs: lower(x[id].bestLapMs, y[id].bestLapMs),
      bestRaceMs: lower(x[id].bestRaceMs, y[id].bestRaceMs),
      bestPosition: lower(x[id].bestPosition, y[id].bestPosition),
      bestPoints: Math.max(x[id].bestPoints, y[id].bestPoints),
    };
  }
  return out;
}


export function hasRecords(records) {
  const r = normaliseRecords(records);
  return TRACK_IDS.some((id) => r[id].bestLapMs > 0 || r[id].bestRaceMs > 0
    || r[id].bestPosition > 0 || r[id].bestPoints > 0);
}





const trackMap = (records, pick, ids) => {
  const out = {};
  for (const id of ids) out[id] = pick(records[id]);
  return out;
};

const RECORD_FIELDS = Object.freeze([
  ['fkBestLapMs', (r) => r.bestLapMs],
  ['fkBestRaceMs', (r) => r.bestRaceMs],
  ['fkBestPosition', (r) => r.bestPosition],
  ['fkBestPoints', (r) => r.bestPoints],
]);











export const CUP_SAVE_FIELDS = Object.freeze(RECORD_FIELDS.map(([f]) => f));


export function toCupSaveDto(records, cupId) {
  const ids = CUP_TRACK_IDS[cupId];
  if (!ids) return null;
  const rec = normaliseRecords(records);
  const out = {};
  for (const [field, pick] of RECORD_FIELDS) out[field] = trackMap(rec, pick, ids);
  return out;
}


export function extraCupSaveFields(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.keys(obj).filter((k) => !CUP_SAVE_FIELDS.includes(k));
}









export function isSyncableCupSave(dto, cupId) {
  const ids = CUP_TRACK_IDS[cupId];
  if (!ids) return false;
  if (!dto || typeof dto !== 'object') return false;
  if (extraCupSaveFields(dto).length) return false;
  for (const k of CUP_SAVE_FIELDS) if (!(k in dto)) return false;
  const bounded = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
  const maxOf = {
    fkBestLapMs: SAVE_LIMITS.maxLapMs,
    fkBestRaceMs: SAVE_LIMITS.maxRaceMs,
    fkBestPosition: SAVE_LIMITS.maxPosition,
    fkBestPoints: SAVE_LIMITS.maxPoints,
  };
  for (const field of CUP_SAVE_FIELDS) {
    const m = dto[field];
    if (!m || typeof m !== 'object') return false;
    if (Object.keys(m).length !== ids.length) return false;
    for (const id of ids) if (!bounded(m[id], maxOf[field])) return false;
  }
  return true;
}




































export function mergeCupSaveDoc(raw, cupDoc, cupId) {
  const base = (raw && typeof raw === 'object') ? raw : {};
  const ids = CUP_TRACK_IDS[cupId];
  if (!ids || !cupDoc || typeof cupDoc !== 'object') return base;
  const out = { ...base };
  for (const field of CUP_SAVE_FIELDS) {
    const from = cupDoc[field];
    const merged = { ...(base[field] ?? {}) };
    if (from && typeof from === 'object') {
      for (const id of ids) if (id in from) merged[id] = from[id];
    }
    out[field] = merged;
  }
  return out;
}

















export function saveDigestFields(profile, records) {
  const out = { ...toSaveDto(profile, records) };
  for (const cupId of CUP_IDS) {
    if (cupId === HOME_CUP) continue;
    const doc = CUP_SAVE_DOCS[cupId];
    const cup = toCupSaveDto(records, cupId);
    for (const field of CUP_SAVE_FIELDS) out[`${doc}.${field}`] = cup[field];
  }
  return out;
}









export function toSaveDto(profile, records) {
  const p = normaliseProfile(profile);
  const rec = normaliseRecords(records);
  const tb = p.games['team-bonding']?.totals ?? {};
  const fk = p.games.farmykart?.totals ?? {};
  return {
    tbKills: int(tb.kills, SAVE_LIMITS.maxCount),
    fkPodiums: int(fk.podiums, SAVE_LIMITS.maxCount),
    fkPoints: int(fk.points, SAVE_LIMITS.maxPoints),
    fkBestLapMs: trackMap(rec, (r) => r.bestLapMs, HOME_TRACK_IDS),
    fkBestRaceMs: trackMap(rec, (r) => r.bestRaceMs, HOME_TRACK_IDS),
    fkBestPosition: trackMap(rec, (r) => r.bestPosition, HOME_TRACK_IDS),
    fkBestPoints: trackMap(rec, (r) => r.bestPoints, HOME_TRACK_IDS),
  };
}






export function fromSaveDto(doc) {
  if (!doc || typeof doc !== 'object') return null;
  const records = emptyRecords();
  
  
  
  
  
  
  
  
  for (const id of TRACK_IDS) {
    records[id] = {
      bestLapMs: int(doc.fkBestLapMs?.[id], SAVE_LIMITS.maxLapMs),
      bestRaceMs: int(doc.fkBestRaceMs?.[id], SAVE_LIMITS.maxRaceMs),
      bestPosition: int(doc.fkBestPosition?.[id], SAVE_LIMITS.maxPosition),
      bestPoints: int(doc.fkBestPoints?.[id], SAVE_LIMITS.maxPoints),
    };
  }
  return {
    records,
    totals: {
      'team-bonding': { kills: int(doc.tbKills, SAVE_LIMITS.maxCount) },
      farmykart: {
        podiums: int(doc.fkPodiums, SAVE_LIMITS.maxCount),
        points: int(doc.fkPoints, SAVE_LIMITS.maxPoints),
      },
    },
  };
}


export function extraSaveFields(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.keys(obj).filter((k) => !SAVE_FIELDS.includes(k));
}








export function isSyncableSave(dto) {
  if (!dto || typeof dto !== 'object') return false;
  if (extraSaveFields(dto).length) return false;
  for (const k of SAVE_FIELDS) if (!(k in dto)) return false;
  const bounded = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
  if (!bounded(dto.tbKills, SAVE_LIMITS.maxCount)) return false;
  if (!bounded(dto.fkPodiums, SAVE_LIMITS.maxCount)) return false;
  if (!bounded(dto.fkPoints, SAVE_LIMITS.maxPoints)) return false;
  const maps = {
    fkBestLapMs: SAVE_LIMITS.maxLapMs,
    fkBestRaceMs: SAVE_LIMITS.maxRaceMs,
    fkBestPosition: SAVE_LIMITS.maxPosition,
    fkBestPoints: SAVE_LIMITS.maxPoints,
  };
  for (const [field, max] of Object.entries(maps)) {
    const m = dto[field];
    if (!m || typeof m !== 'object') return false;
    const keys = Object.keys(m);
    
    
    
    
    
    
    if (keys.length !== HOME_TRACK_IDS.length) return false;
    for (const id of HOME_TRACK_IDS) if (!bounded(m[id], max)) return false;
  }
  return true;
}








export function saveCoverage({ saveSync = SAVE_SYNC_ENABLED } = {}) {
  return GAME_IDS.map((id) => {
    if (id === 'farmykart') {
      return {
        id,
        covered: saveSync,
        what: saveSync ? 'Records, points and unlocks' : 'Records stay on this device for now',
      };
    }
    if (id === 'team-bonding') {
      return {
        id,
        covered: true,
        what: saveSync ? 'Matches, wins and kills' : 'Matches and wins',
      };
    }
    
    
    return { id, covered: true, what: 'Everything it keeps' };
  });
}
