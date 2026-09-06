






















import { xpFromMatch, rankTitle } from '../../../web-engine/rts/progression.js';

const SAVE_KEY = 'fu.save.v1';
const PROFILE_KEY = 'fu.profile.v1';


function storage() {
  try {
    const s = window.localStorage;
    
    
    const probe = '__fu_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

function readJson(key) {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : null;
  } catch {
    
    
    try { s.removeItem(key); } catch {  }
    return null;
  }
}

function writeJson(key, value) {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}










export function storeSave(blob, meta) {
  return writeJson(SAVE_KEY, { at: Date.now(), meta, blob });
}


export function loadSave() {
  const v = readJson(SAVE_KEY);
  if (!v || !v.blob) return null;
  return v;
}

export function clearSave() {
  const s = storage();
  if (!s) return;
  try { s.removeItem(SAVE_KEY); } catch {  }
}

export function hasSave() {
  return !!loadSave();
}





const FRESH = Object.freeze({
  xp: 0, level: 1, played: 0, won: 0, bestScore: 0,
});










export function loadProfile() {
  const v = readJson(PROFILE_KEY);
  if (!v) return { ...FRESH };
  const num = (x, max) => {
    const n = Math.floor(Number(x));
    return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
  };
  return {
    xp: num(v.xp, 10_000_000),
    level: Math.max(1, Math.min(50, Math.floor(Number(v.level)) || 1)),
    played: num(v.played, 1_000_000),
    won: num(v.won, 1_000_000),
    bestScore: num(v.bestScore, 100_000_000),
  };
}

export function saveProfile(p) {
  return writeJson(PROFILE_KEY, p);
}







export function recordMatch(result) {
  const before = loadProfile();
  
  
  
  
  const gained = Math.max(0, Math.floor(xpFromMatch(result.points || 0, !!result.won) || 0));
  const after = {
    xp: before.xp + gained,
    level: before.level,
    played: before.played + 1,
    won: before.won + (result.won ? 1 : 0),
    bestScore: Math.max(before.bestScore, Math.floor(result.score || 0)),
  };
  after.level = levelFor(after.xp);
  saveProfile(after);
  return { profile: after, levelledUp: after.level > before.level, gained };
}









export function xpForLevel(level) {
  const l = Math.max(1, Math.floor(level));
  return 50 * (l - 1) * l;      
}

export function levelFor(xp) {
  let l = 1;
  while (l < 50 && xp >= xpForLevel(l + 1)) l += 1;
  return l;
}


export function levelProgress(profile) {
  const cur = xpForLevel(profile.level);
  const next = xpForLevel(profile.level + 1);
  if (next <= cur) return 1;
  return Math.max(0, Math.min(1, (profile.xp - cur) / (next - cur)));
}

export { rankTitle };
