















































import { ACCOUNT_CONFIG, ACCOUNTS_ENABLED, PROFILE_COLLECTION, isConfigured } from './accountConfig.js';
import { toCloudDto, fromCloudDto, isSyncable, extraFields } from './profileDto.js';
import { SAVE_SYNC_ENABLED, toSaveDto, isSyncableSave, extraSaveFields } from './gameSave.js';

let _state = null;      



























async function ready() {
  if (_state !== null) return _state;
  if (!ACCOUNTS_ENABLED || !isConfigured(ACCOUNT_CONFIG)) { _state = false; return _state; }
  try {
    const [core, appCheck, auth, store] = await Promise.all([
      import('../vendor/firebase/firebase-app.js'),
      import('../vendor/firebase/firebase-app-check.js'),
      import('../vendor/firebase/firebase-auth.js'),
      import('../vendor/firebase/firebase-firestore-lite.js'),
    ]);
    const cfg = ACCOUNT_CONFIG;
    const existing = core.getApps();
    const app = existing.length ? existing[0] : core.initializeApp({
      apiKey: cfg.apiKey, authDomain: cfg.authDomain,
      projectId: cfg.projectId, appId: cfg.appId,
    });
    try {
      appCheck.initializeAppCheck(app, {
        provider: new appCheck.ReCaptchaEnterpriseProvider(cfg.appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (_) {
      
    }
    const a = auth.getAuth(app);
    
    
    
    
    try { await auth.setPersistence(a, auth.browserLocalPersistence); } catch (_) {}
    const user = a.currentUser ?? (await auth.signInAnonymously(a)).user;
    _state = { app, auth, store, a, db: store.getFirestore(app), uid: user?.uid ?? null };
    if (!_state.uid) _state = false;
  } catch (_) {
    
    
    
    
    _state = false;
  }
  return _state;
}


export async function accountUid() {
  const s = await ready();
  return s ? s.uid : null;
}


export function isSyncEnabled() {
  return ACCOUNTS_ENABLED && isConfigured(ACCOUNT_CONFIG);
}





















export async function pullProfile() {
  const s = await ready();
  if (!s) return null;
  try {
    const snap = await s.store.getDoc(s.store.doc(s.db, PROFILE_COLLECTION, s.uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    
    
    
    return { profile: fromCloudDto(data), raw: data };
  } catch (_) {
    return null;
  }
}















export async function pushProfile(profile, records = null) {
  const s = await ready();
  if (!s) return false;
  const dto = toCloudDto(profile);
  if (!dto || !isSyncable(dto) || extraFields(dto).length) return false;
  let payload = dto;
  if (SAVE_SYNC_ENABLED) {
    const save = toSaveDto(profile, records);
    if (!isSyncableSave(save) || extraSaveFields(save).length) return false;
    payload = { ...dto, ...save };
  }
  try {
    
    
    
    
    await s.store.setDoc(s.store.doc(s.db, PROFILE_COLLECTION, s.uid), payload);
    return true;
  } catch (_) {
    
    
    return false;
  }
}
























export async function linkGoogle() {
  const s = await ready();
  if (!s) return { ok: false, reason: 'unavailable', mergeNeeded: false, credential: null };
  try {
    const provider = new s.auth.GoogleAuthProvider();
    
    
    
    
    await s.auth.linkWithPopup(s.a.currentUser, provider);
    return { ok: true, reason: null, mergeNeeded: false, credential: null };
  } catch (err) {
    const code = err?.code ?? '';
    if (code === 'auth/credential-already-in-use'
        || code === 'auth/email-already-in-use'
        || code === 'auth/account-exists-with-different-credential') {
      let credential = null;
      
      
      
      try { credential = s.auth.GoogleAuthProvider.credentialFromError(err) ?? null; } catch (_) {}
      return { ok: false, reason: 'already-in-use', mergeNeeded: true, credential };
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { ok: false, reason: 'cancelled', mergeNeeded: false, credential: null };
    }
    return { ok: false, reason: 'failed', mergeNeeded: false, credential: null };
  }
}




















export async function adoptCredential(credential) {
  const s = await ready();
  if (!s || !credential) return false;
  try {
    const res = await s.auth.signInWithCredential(s.a, credential);
    const uid = res?.user?.uid ?? s.a.currentUser?.uid ?? null;
    if (!uid) return false;
    
    
    
    _state = { ..._state, uid };
    return true;
  } catch (_) {
    return false;
  }
}








export async function deleteCloudProfile() {
  const s = await ready();
  if (!s) return false;
  try {
    await s.store.deleteDoc(s.store.doc(s.db, PROFILE_COLLECTION, s.uid));
    return true;
  } catch (_) {
    return false;
  }
}


export function _resetForTests() { _state = null; }
