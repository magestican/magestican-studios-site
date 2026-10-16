









import { LIBRARY_KEY, emptyLibrary, normaliseLibrary, seedFromProfile } from './libraryModel.js';

export const LIBRARY_EVENT = 'magestican:library';
const PROFILE_KEY = 'arbelo.account.v1';

export function defaultStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

function readJson(storage, key) {
  try {
    const s = storage?.getItem(key);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function loadLibrary(storage) {
  let has = false;
  try { has = storage?.getItem(LIBRARY_KEY) != null; } catch { has = false; }
  if (has) return normaliseLibrary(readJson(storage, LIBRARY_KEY));
  
  
  return seedFromProfile(emptyLibrary(), readJson(storage, PROFILE_KEY));
}

export function saveLibrary(storage, lib, target = globalThis) {
  try {
    if (!storage) return false;
    storage.setItem(LIBRARY_KEY, JSON.stringify(normaliseLibrary(lib)));
  } catch { return false; }
  try { target?.dispatchEvent?.(new CustomEvent(LIBRARY_EVENT)); } catch {  }
  return true;
}


export function updateLibrary(storage, fn, target) {
  const next = normaliseLibrary(fn(loadLibrary(storage)));
  saveLibrary(storage, next, target);
  return next;
}
