































import { reportMatch } from './report.js';
import { S95_SAVE_KEY, mergeS95Saves, normaliseS95Save } from '../account/gameSave.js';

export const S95_GAME_ID = 'space-95';
export const S95_SLOT_KEY = S95_SAVE_KEY;


export const S95_MANTIS_ID = 'mantis';

const ABS = Object.freeze({
  levelsCleared: 's95LevelsCleared',
  intelPct: 's95IntelPct',
  secrets: 's95Secrets',
});
const SETS = Object.freeze({
  specimens: 's95Specimens',
  miniBosses: 's95MiniBosses',
  bigBosses: 's95BigBosses',
  
  
  underPar: 's95ParClears',
});
const COUNTS = Object.freeze({
  pebbleKills: 's95PebbleKills',
  highFives: 's95HighFives',
  noHitBoss: 's95NoHitBoss',
  trainClean: 's95TrainClean',
  aceSolo: 's95AceSolo',
});
const MAX_IDS = 200;

const int = (v) => {
  const x = Math.floor(Number(v));
  return Number.isFinite(x) && x > 0 ? Math.min(x, 1000000) : 0;
};
const idList = (a) => (Array.isArray(a)
  ? [...new Set(a.map((x) => (Number.isInteger(x) ? String(x) : x)).filter((x) => typeof x === 'string' && x && x.length <= 64))].slice(0, MAX_IDS) : []);


export function normaliseSlot(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const stats = {};
  for (const k of Object.keys(ABS)) stats[k] = int(r.stats?.[k]);
  const ids = {};
  for (const k of Object.keys(SETS)) ids[k] = idList(r.ids?.[k]);
  return { save: normaliseS95Save(r.save), stats, ids };
}





export function space95Step(slotRaw, msg) {
  const before = normaliseSlot(slotRaw);
  const m = msg && typeof msg === 'object' ? msg : {};
  const metrics = {};
  const stats = {};
  for (const [k, metric] of Object.entries(ABS)) {
    
    stats[k] = Math.max(before.stats[k], int(m.stats?.[k]));
    const up = stats[k] - before.stats[k];
    if (up > 0) metrics[metric] = up;
  }
  const ids = {};
  for (const [k, metric] of Object.entries(SETS)) {
    ids[k] = idList([...before.ids[k], ...idList(m.ids?.[k])]);
    const up = ids[k].length - before.ids[k].length;
    if (up > 0) metrics[metric] = up;
  }
  if (!before.ids.bigBosses.includes(S95_MANTIS_ID) && ids.bigBosses.includes(S95_MANTIS_ID)) {
    metrics.s95MantisBeaten = 1;
  }
  for (const [k, metric] of Object.entries(COUNTS)) {
    const add = int(m.counts?.[k]);
    if (add > 0) metrics[metric] = add;
  }
  if (m.shift && m.shift.coop === true && m.shift.cleared === true) metrics.s95CoopClears = 1;
  const save = m.save ? mergeS95Saves(m.save, before.save) : before.save;
  return { slot: { save, stats, ids }, metrics };
}

function storageOf(opts) {
  if (opts && Object.prototype.hasOwnProperty.call(opts, 'storage')) return opts.storage;
  try { return globalThis.localStorage ?? null; } catch { return null; }
}


export function loadSpace95Save(opts) {
  try {
    const raw = storageOf(opts)?.getItem(S95_SLOT_KEY);
    return normaliseSlot(raw ? JSON.parse(raw) : null).save;
  } catch {
    return normaliseSlot(null).save;
  }
}









export async function reportSpace95(msg, opts) {
  try {
    const storage = storageOf(opts);
    if (!storage || !msg || typeof msg !== 'object' || !msg.shift || typeof msg.shift !== 'object') return [];
    let raw = null;
    try { raw = JSON.parse(storage.getItem(S95_SLOT_KEY) ?? 'null'); } catch { raw = null; }
    const { slot, metrics } = space95Step(raw, msg);
    const seconds = Number(msg.shift.seconds);
    const events = await reportMatch({
      game: S95_GAME_ID,
      outcome: msg.shift.cleared === true ? 'win' : 'loss',
      
      
      mode: 'solo',
      seconds: Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : undefined,
      metrics,
    }, { ...(opts ?? {}), storage });
    
    
    if (Array.isArray(events) && events.length > 0) {
      try { storage.setItem(S95_SLOT_KEY, JSON.stringify(slot)); } catch {  }
    }
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  }
}
