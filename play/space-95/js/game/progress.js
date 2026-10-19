



import { emptySave, loadSave, mergeSaves, secretIndex } from '../sim/intel.js';

const KEY = 's95.save.v1';

export function readProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    return loadSave(raw ? JSON.parse(raw) : null);
  } catch {
    return emptySave();
  }
}


function writeProgress(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    
  }
}


export function saveVariant(variant) {
  writeProgress({ ...readProgress(), variant });
}






export function recordShift(level, session) {
  const save = readProgress();
  const run = emptySave();
  for (const e of level.entities) {
    if (!session.found.has(String(e.id))) continue;
    const kind = e.specimen ? 'specimen' : e.secret;
    if (kind) run.secrets[secretIndex(level.id, kind)] = true;
  }
  if (session.cleared) {
    run.cleared[level.id - 1] = true;
    if (!session.partial) run.bestTimes[level.id - 1] = session.time;
  }
  const merged = mergeSaves(save, run);
  writeProgress(merged);
  return merged;
}
