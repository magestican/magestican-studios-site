








































import {
  loadProfile, saveProfile, recordPlay, profileSummary, clearProfile, normaliseProfile,
} from './profile.js';
import { localDayNumber } from './dayKey.js';
import { toCloudDto } from './profileDto.js';
import {
  normaliseBudget, shouldPull, shouldPush, notePull, notePush, digestOf,
} from './syncBudget.js';
import {
  isSyncEnabled, pullProfile, pushProfile, linkGoogle, adoptCredential,
  deleteCloudProfile, accountUid,
} from './firebaseAccount.js';
import {
  SAVE_SYNC_ENABLED, kartRecordsFrom, applyKartRecords,
  fromSaveDto, toSaveDto, isSyncableSave,
} from './gameSave.js';
import {
  reconcileAll, resolveConflict, makeSnapshot, pushBackup, normaliseBackups,
  restoreInto, backupLines, classifyConflict, BACKUP_KEY,
} from './saveConflict.js';
import { statsFor, evaluate, tally, rulesLandedIn } from './achievements.js';
import {
  shouldOffer, noteAsk, noteNever, normalisePromptState, PROMPT_KEY,
} from './signupMoment.js';
import { loadProgress, saveProgress, STORE_KEY as KART_KEY } from '../kart/raceStats.js';


export const BUDGET_KEY = 'arbelo.account.sync.v1';


export const SEEN_KEY = 'arbelo.account.badges.v1';





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
const dayOf = (nowMs) => localDayNumber(nowMs);

function readJson(key, fallback) {
  try {
    const raw = store()?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try { store()?.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

function loadBudget() {
  return normaliseBudget(readJson(BUDGET_KEY, null));
}

const saveBudget = (b) => writeJson(BUDGET_KEY, b);


export function currentProfile() {
  return loadProfile(store());
}













export function currentRecords() {
  try { return kartRecordsFrom(loadProgress(store())); } catch { return null; }
}

function writeRecords(records) {
  try {
    const before = loadProgress(store());
    const after = applyKartRecords(before, records);
    
    
    
    if (after !== before) saveProgress(store(), after);
    return after !== before;
  } catch { return false; }
}


export function accountSummary(nowMs = now()) {
  try {
    return profileSummary(currentProfile(), nowMs);
  } catch {
    return profileSummary(null, nowMs);
  }
}





















export const RULES_LANDED = Object.freeze([]);









export function achievementRows(nowMs = now()) {
  try {
    const profile = currentProfile();
    const summary = profileSummary(profile, nowMs);
    const stats = statsFor(profile, { today: dayOf(nowMs), kartRecords: currentRecords() });
    return evaluate(stats, {
      synced: !!summary.linked,
      saveSync: SAVE_SYNC_ENABLED,
      rulesLanded: RULES_LANDED,
      seen: readJson(SEEN_KEY, {}) ?? {},
    });
  } catch {
    return [];
  }
}


export function achievementTally(nowMs = now()) {
  return tally(achievementRows(nowMs));
}







function noteSeen(rows, day) {
  if (!Number.isInteger(day)) return;
  const seen = readJson(SEEN_KEY, {}) ?? {};
  let changed = false;
  for (const r of rows) {
    if (r.unlocked && !Number.isInteger(seen[r.id])) { seen[r.id] = day; changed = true; }
  }
  if (changed) writeJson(SEEN_KEY, seen);
}



















export function recordSession({ gameId, metrics = {}, won = false, name } = {}) {
  const nowMs = now();
  const day = dayOf(nowMs);
  try {
    const before = currentProfile();
    const records = currentRecords();
    
    
    const rowsBefore = evaluate(
      statsFor(before, { today: day, kartRecords: records }),
      { synced: !!before.linked, saveSync: SAVE_SYNC_ENABLED, rulesLanded: RULES_LANDED },
    );
    const { profile, events, changed } = recordPlay(before, { gameId, nowMs, metrics, won, name });
    if (changed) saveProfile(store(), profile);

    
    
    
    const after = currentRecords();
    const summary = profileSummary(profile, nowMs);
    const rowsAfter = evaluate(
      statsFor(profile, { today: day, kartRecords: after }),
      {
        synced: !!summary.linked,
        saveSync: SAVE_SYNC_ENABLED,
        rulesLanded: RULES_LANDED,
        seen: readJson(SEEN_KEY, {}) ?? {},
      },
    );
    const wasLocked = new Set(rowsBefore.filter((r) => !r.unlocked).map((r) => r.id));
    const justUnlocked = rowsAfter.filter((r) => r.unlocked && wasLocked.has(r.id));
    noteSeen(rowsAfter, day);

    maybePush(profile, after, nowMs);

    const offer = shouldOffer({
      summary,
      events,
      justUnlocked,
      state: promptState(),
      today: day,
      at: 'results',
      syncEnabled: isSyncEnabled(),
    });

    return { events, summary, profile, rows: rowsAfter, justUnlocked, offer };
  } catch (_) {
    
    return {
      events: [], summary: accountSummary(nowMs), profile: currentProfile(),
      rows: [], justUnlocked: [], offer: { offer: false, reason: null, blocked: 'error' },
    };
  }
}





export function promptState() {
  return normalisePromptState(readJson(PROMPT_KEY, null));
}


export function notePromptShown(reason, nowMs = now()) {
  const next = noteAsk(promptState(), { today: dayOf(nowMs), reason });
  writeJson(PROMPT_KEY, next);
  return next;
}


export function notePromptNever() {
  const next = noteNever(promptState());
  writeJson(PROMPT_KEY, next);
  return next;
}





















export async function syncFromCloud() {
  if (!isSyncEnabled()) return null;
  
  
  
  
  
  
  
  
  
  
  const known = currentProfile();
  if (!known.uid) return null;
  const nowMs = now();
  const day = dayOf(nowMs);
  try {
    const local = currentProfile();
    const hasLocal = Object.keys(local.games).length > 0;
    const budget = loadBudget();
    if (!shouldPull(budget, { nowMs, today: day, hasLocal })) return null;
    saveBudget(notePull(budget, { nowMs, today: day }));
    const doc = await pullRaw();
    const uid = await accountUid();
    if (!doc || !doc.profile) {
      
      
      if (uid && local.uid !== uid) saveProfile(store(), { ...local, uid });
      return null;
    }
    const localRecords = currentRecords();
    if (classifyConflict(local, doc.profile) !== 'none') {
      keepAside(local, localRecords, day, 'first-sync');
    }
    const merged = reconcileAll({ ...local, uid: uid ?? local.uid }, doc.profile, {
      localRecords, cloudRecords: doc.records,
    });
    saveProfile(store(), merged.profile);
    writeRecords(merged.records);
    return profileSummary(merged.profile, nowMs);
  } catch (_) {
    return null;
  }
}









async function pullRaw() {
  const got = await pullProfile();
  if (!got) return null;
  return {
    profile: got.profile ?? got,
    records: SAVE_SYNC_ENABLED ? fromSaveDto(got.raw ?? null)?.records ?? null : null,
  };
}




























export async function linkAccount() {
  if (!isSyncEnabled()) return { ok: false, reason: 'unavailable', conflict: null };
  const nowMs = now();
  try {
    const result = await linkGoogle();
    if (result.ok) {
      const p = { ...currentProfile(), linked: true, uid: (await accountUid()) ?? null };
      saveProfile(store(), normaliseProfile(p));
      maybePush(p, currentRecords(), nowMs, true);
      return { ok: true, reason: null, conflict: null };
    }
    if (result.mergeNeeded && result.credential) {
      const adopted = await adoptCredential(result.credential);
      if (!adopted) return { ok: false, reason: 'failed', conflict: null };
      const doc = await pullRaw();
      const local = currentProfile();
      if (!doc || !doc.profile) {
        
        
        const p = { ...local, linked: true, uid: (await accountUid()) ?? null };
        saveProfile(store(), normaliseProfile(p));
        maybePush(p, currentRecords(), nowMs, true);
        return { ok: true, reason: 'adopted', conflict: null };
      }
      return {
        ok: false,
        reason: 'conflict',
        conflict: {
          local,
          cloud: doc.profile,
          localRecords: currentRecords(),
          cloudRecords: doc.records,
        },
      };
    }
    return { ok: false, reason: result.reason, conflict: null };
  } catch (_) {
    return { ok: false, reason: 'failed', conflict: null };
  }
}









export function resolveSaveConflict(conflict, resolution, nowMs = now()) {
  const day = dayOf(nowMs);
  try {
    const out = resolveConflict(conflict?.local, conflict?.cloud, resolution, {
      localRecords: conflict?.localRecords,
      cloudRecords: conflict?.cloudRecords,
    });
    if (out.discarded) {
      keepAside(out.discarded.profile, out.discarded.records, day, out.discarded.side);
    }
    const profile = normaliseProfile({ ...out.profile, linked: true });
    saveProfile(store(), profile);
    writeRecords(out.records);
    maybePush(profile, out.records, nowMs, true);
    return { ok: true, summary: profileSummary(profile, nowMs) };
  } catch (_) {
    return { ok: false, summary: accountSummary(nowMs) };
  }
}

function keepAside(profile, records, day, reason) {
  try {
    const list = pushBackup(
      normaliseBackups(readJson(BACKUP_KEY, [])),
      makeSnapshot(profile, records, { day, reason }),
    );
    writeJson(BACKUP_KEY, list);
  } catch (_) {  }
}


export function listBackups() {
  return backupLines(normaliseBackups(readJson(BACKUP_KEY, [])));
}









export function restoreBackup(index, nowMs = now()) {
  try {
    const list = normaliseBackups(readJson(BACKUP_KEY, []));
    const snap = list[index];
    if (!snap) return { ok: false, summary: accountSummary(nowMs) };
    const out = restoreInto(currentProfile(), snap, { currentRecords: currentRecords() });
    saveProfile(store(), out.profile);
    writeRecords(out.records);
    maybePush(out.profile, out.records, nowMs, true);
    return { ok: true, summary: profileSummary(out.profile, nowMs) };
  } catch (_) {
    return { ok: false, summary: accountSummary(nowMs) };
  }
}















export async function forgetMe() {
  clearProfile(store());
  for (const key of [BUDGET_KEY, PROMPT_KEY, SEEN_KEY, BACKUP_KEY]) {
    try { store()?.removeItem(key); } catch {  }
  }
  if (!isSyncEnabled()) return true;
  try { return await deleteCloudProfile(); } catch { return false; }
}





















export async function syncNow() {
  if (!isSyncEnabled()) return { ok: false, status: 'off' };
  try {
    const uid = await accountUid();
    if (!uid) return { ok: false, status: 'signed-out' };

    
    
    await syncFromCloud();

    const nowMs = now();
    const profile = currentProfile();
    const records = currentRecords();
    const dto = toCloudDto(profile);
    if (!dto) return { ok: false, status: 'nothing-to-save' };

    let full = dto;
    if (SAVE_SYNC_ENABLED) {
      const save = toSaveDto(profile, records);
      if (isSyncableSave(save)) full = { ...dto, ...save };
    }
    const day = dayOf(nowMs);
    const budget = loadBudget();
    const digest = digestOf(full);
    if (digest === forDayDigest(budget, day)) return { ok: true, status: 'already-saved' };
    if (!shouldPush(budget, { nowMs, today: day, digest, force: true })) {
      return { ok: false, status: 'daily-limit' };
    }
    saveBudget(notePush(budget, { nowMs, today: day, digest }));
    const sent = await pushProfile(profile, records);
    return sent ? { ok: true, status: 'saved' } : { ok: false, status: 'refused' };
  } catch (_) {
    return { ok: false, status: 'failed' };
  }
}




function forDayDigest(budget, today) {
  const b = normaliseBudget(budget);
  return b.day === today ? b.lastDigest : null;
}



function maybePush(profile, records, nowMs, force = false) {
  if (!isSyncEnabled()) return;
  try {
    const dto = toCloudDto(profile);
    if (!dto) return;
    
    
    
    
    
    
    let full = dto;
    if (SAVE_SYNC_ENABLED) {
      const save = toSaveDto(profile, records);
      if (isSyncableSave(save)) full = { ...dto, ...save };
    }
    const digest = digestOf(full);
    const day = dayOf(nowMs);
    const budget = loadBudget();
    if (!shouldPush(budget, { nowMs, today: day, digest, force })) return;
    
    
    
    
    saveBudget(notePush(budget, { nowMs, today: day, digest }));
    Promise.resolve(pushProfile(profile, records)).catch(() => {});
  } catch (_) {
    
  }
}


export { rulesLandedIn, KART_KEY, BACKUP_KEY, PROMPT_KEY };
