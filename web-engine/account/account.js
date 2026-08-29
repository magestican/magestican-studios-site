



















import {
  loadProfile, saveProfile, recordPlay, profileSummary, reconcileProfiles,
  mergeProfiles, clearProfile, normaliseProfile,
} from './profile.js';
import { localDayNumber } from './dayKey.js';
import { toCloudDto } from './profileDto.js';
import {
  normaliseBudget, shouldPull, shouldPush, notePull, notePush, digestOf,
} from './syncBudget.js';
import {
  isSyncEnabled, pullProfile, pushProfile, linkGoogle, deleteCloudProfile, accountUid,
} from './firebaseAccount.js';


export const BUDGET_KEY = 'arbelo.account.sync.v1';





function store() {
  try {
    const s = globalThis.localStorage;
    s.setItem('arbelo.account.probe', '1');
    s.removeItem('arbelo.account.probe');
    return s;
  } catch {
    return null;
  }
}

const now = () => Date.now();

function loadBudget() {
  try {
    const raw = store()?.getItem(BUDGET_KEY);
    return normaliseBudget(raw ? JSON.parse(raw) : null);
  } catch {
    return normaliseBudget(null);
  }
}

function saveBudget(b) {
  try { store()?.setItem(BUDGET_KEY, JSON.stringify(b)); } catch {  }
}


export function currentProfile() {
  return loadProfile(store());
}


export function accountSummary(nowMs = now()) {
  try {
    return profileSummary(currentProfile(), nowMs);
  } catch {
    return profileSummary(null, nowMs);
  }
}










export function recordSession({ gameId, metrics = {}, won = false, name } = {}) {
  const nowMs = now();
  try {
    const before = currentProfile();
    const { profile, events, changed } = recordPlay(before, { gameId, nowMs, metrics, won, name });
    if (changed) saveProfile(store(), profile);
    maybePush(profile, nowMs);
    return { events, summary: profileSummary(profile, nowMs), profile };
  } catch (_) {
    
    return { events: [], summary: accountSummary(nowMs), profile: currentProfile() };
  }
}










export async function syncFromCloud() {
  if (!isSyncEnabled()) return null;
  const nowMs = now();
  const today = localDayNumber(nowMs);
  try {
    const local = currentProfile();
    const hasLocal = Object.keys(local.games).length > 0;
    const budget = loadBudget();
    if (!shouldPull(budget, { nowMs, today, hasLocal })) return null;
    saveBudget(notePull(budget, { nowMs, today }));
    const cloud = await pullProfile();
    const uid = await accountUid();
    if (!cloud) {
      
      
      if (uid && local.uid !== uid) saveProfile(store(), { ...local, uid });
      return null;
    }
    const next = reconcileProfiles({ ...local, uid: uid ?? local.uid }, cloud);
    saveProfile(store(), next);
    return profileSummary(next, nowMs);
  } catch (_) {
    return null;
  }
}










export async function linkAccount() {
  if (!isSyncEnabled()) return { ok: false, reason: 'unavailable' };
  const nowMs = now();
  try {
    const result = await linkGoogle();
    if (result.ok) {
      const p = { ...currentProfile(), linked: true, uid: (await accountUid()) ?? null };
      saveProfile(store(), normaliseProfile(p));
      maybePush(p, nowMs, true);
      return { ok: true, reason: null };
    }
    if (result.mergeNeeded) {
      
      
      const other = await pullProfile();
      if (other) {
        const merged = mergeProfiles(currentProfile(), other);
        saveProfile(store(), { ...merged, linked: true });
        maybePush(merged, nowMs, true);
        return { ok: true, reason: 'merged' };
      }
    }
    return { ok: false, reason: result.reason };
  } catch (_) {
    return { ok: false, reason: 'failed' };
  }
}








export async function forgetMe() {
  clearProfile(store());
  try { store()?.removeItem(BUDGET_KEY); } catch {  }
  if (!isSyncEnabled()) return true;
  try { return await deleteCloudProfile(); } catch { return false; }
}



function maybePush(profile, nowMs, force = false) {
  if (!isSyncEnabled()) return;
  try {
    const dto = toCloudDto(profile);
    if (!dto) return;
    const digest = digestOf(dto);
    const today = localDayNumber(nowMs);
    const budget = loadBudget();
    if (!shouldPush(budget, { nowMs, today, digest, force })) return;
    
    
    
    
    saveBudget(notePush(budget, { nowMs, today, digest }));
    Promise.resolve(pushProfile(profile)).catch(() => {});
  } catch (_) {
    
  }
}
