















































import { ACCOUNT_CONFIG, ACCOUNTS_ENABLED, PROFILE_COLLECTION, isConfigured } from './accountConfig.js';
import { toCloudDto, fromCloudDto, isSyncable, extraFields } from './profileDto.js';




const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

let _state = null;      












async function ready() {
  if (_state !== null) return _state;
  if (!ACCOUNTS_ENABLED || !isConfigured(ACCOUNT_CONFIG)) { _state = false; return _state; }
  try {
    const [core, appCheck, auth, store] = await Promise.all([
      import( `${SDK}firebase-app.js`),
      import( `${SDK}firebase-app-check.js`),
      import( `${SDK}firebase-auth.js`),
      import( `${SDK}firebase-firestore.js`),
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
    
    
    
    return fromCloudDto(snap.data());
  } catch (_) {
    return null;
  }
}









export async function pushProfile(profile) {
  const s = await ready();
  if (!s) return false;
  const dto = toCloudDto(profile);
  if (!dto || !isSyncable(dto) || extraFields(dto).length) return false;
  try {
    
    
    
    
    await s.store.setDoc(s.store.doc(s.db, PROFILE_COLLECTION, s.uid), dto);
    return true;
  } catch (_) {
    
    
    return false;
  }
}












export async function linkGoogle() {
  const s = await ready();
  if (!s) return { ok: false, reason: 'unavailable', mergeNeeded: false };
  try {
    const provider = new s.auth.GoogleAuthProvider();
    
    
    
    
    await s.auth.linkWithPopup(s.a.currentUser, provider);
    return { ok: true, reason: null, mergeNeeded: false };
  } catch (err) {
    const code = err?.code ?? '';
    if (code === 'auth/credential-already-in-use'
        || code === 'auth/email-already-in-use'
        || code === 'auth/account-exists-with-different-credential') {
      return { ok: false, reason: 'already-in-use', mergeNeeded: true };
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { ok: false, reason: 'cancelled', mergeNeeded: false };
    }
    return { ok: false, reason: 'failed', mergeNeeded: false };
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
