















































import { ACCOUNT_CONFIG, ACCOUNTS_ENABLED, PROFILE_COLLECTION, isConfigured } from './accountConfig.js';




const SAVE_SUBCOLLECTION = 'save';
const SAVE_DOC = 'records';
import { toCloudDto, fromCloudDto, isSyncable, extraFields } from './profileDto.js';
import { SAVE_SYNC_ENABLED, toSaveDto, isSyncableSave, extraSaveFields } from './gameSave.js';

let _state = null;      















































function withDeadline(promise, ms, fallback = null) {
  let timer = null;
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}


const SIGN_IN_TIMEOUT_MS = 12000;
const WRITE_TIMEOUT_MS = 15000;

async function ready() {
  if (_state !== null) return _state;
  if (!ACCOUNTS_ENABLED || !isConfigured(ACCOUNT_CONFIG)) { _state = false; return _state; }
  try {
    const mods = await withDeadline(Promise.all([
      import('../vendor/firebase/firebase-app.js'),
      import('../vendor/firebase/firebase-app-check.js'),
      import('../vendor/firebase/firebase-auth.js'),
      import('../vendor/firebase/firebase-firestore-lite.js'),
    ]), SIGN_IN_TIMEOUT_MS, null);
    if (!mods) { _state = false; return _state; }
    const [core, appCheck, auth, store] = mods;
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
    
    
    
    
    const signed = a.currentUser
      ? { user: a.currentUser }
      : await withDeadline(auth.signInAnonymously(a), SIGN_IN_TIMEOUT_MS, null);
    const user = signed?.user ?? null;
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
    const snap = await withDeadline(
      s.store.getDoc(s.store.doc(s.db, PROFILE_COLLECTION, s.uid)), WRITE_TIMEOUT_MS, null,
    );
    if (!snap || !snap.exists()) return null;
    const data = snap.data();
    let raw = data;
    if (SAVE_SYNC_ENABLED) {
      try {
        const rec = await s.store.getDoc(
          s.store.doc(s.db, PROFILE_COLLECTION, s.uid, SAVE_SUBCOLLECTION, SAVE_DOC),
        );
        
        
        
        if (rec.exists()) raw = { ...data, ...rec.data() };
      } catch (_) {  }
    }
    
    
    
    return { profile: fromCloudDto(data), raw };
  } catch (_) {
    return null;
  }
}






















export async function pushProfile(profile, records = null) {
  const s = await ready();
  if (!s) return false;
  const dto = toCloudDto(profile);
  if (!dto || !isSyncable(dto) || extraFields(dto).length) return false;
  try {
    
    
    
    
    const ok = await withDeadline(
      s.store.setDoc(s.store.doc(s.db, PROFILE_COLLECTION, s.uid),
        { ...dto, updatedAt: s.store.serverTimestamp() }).then(() => true),
      WRITE_TIMEOUT_MS, false,
    );
    if (!ok) return false;
    if (SAVE_SYNC_ENABLED) {
      const save = toSaveDto(profile, records);
      
      
      
      if (isSyncableSave(save) && !extraSaveFields(save).length) {
        try {
          await s.store.setDoc(
            s.store.doc(s.db, PROFILE_COLLECTION, s.uid, SAVE_SUBCOLLECTION, SAVE_DOC),
            { ...save, updatedAt: s.store.serverTimestamp() },
          );
        } catch (_) {  }
      }
    }
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
