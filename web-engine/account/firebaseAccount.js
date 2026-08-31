















































import { ACCOUNT_CONFIG, ACCOUNTS_ENABLED, PROFILE_COLLECTION, isConfigured } from './accountConfig.js';












const SAVE_SUBCOLLECTION = 'save';
const SAVE_DOC = 'records';
import { toCloudDto, fromCloudDto, isSyncable, extraFields } from './profileDto.js';
import {
  SAVE_SYNC_ENABLED, toSaveDto, isSyncableSave, extraSaveFields,
  CUP_IDS, HOME_CUP, CUP_SAVE_DOCS,
  toCupSaveDto, isSyncableCupSave, extraCupSaveFields, mergeCupSaveDoc,
} from './gameSave.js';


const EXTRA_CUPS = CUP_IDS.filter((c) => c !== HOME_CUP);

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
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    let user = a.currentUser ?? null;
    if (!user) {
      
      
      
      
      const signed = await withDeadline(
        auth.signInAnonymously(a).catch(() => null), SIGN_IN_TIMEOUT_MS, null,
      );
      user = signed?.user ?? null;
    }
    _state = { app, auth, store, a, db: store.getFirestore(app), uid: user?.uid ?? null };
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
  if (!s || !s.uid) return null;
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
      
      
      
      
      
      
      
      
      for (const cupId of EXTRA_CUPS) {
        try {
          const got = await s.store.getDoc(s.store.doc(
            s.db, PROFILE_COLLECTION, s.uid, SAVE_SUBCOLLECTION, CUP_SAVE_DOCS[cupId],
          ));
          if (!got.exists()) continue;
          
          
          
          
          
          
          
          
          raw = mergeCupSaveDoc(raw, got.data(), cupId);
        } catch (_) {  }
      }
    }
    
    
    
    return { profile: fromCloudDto(data), raw };
  } catch (_) {
    return null;
  }
}






















export async function pushProfile(profile, records = null) {
  const s = await ready();
  if (!s || !s.uid) return false;
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
      
      
      
      
      for (const cupId of EXTRA_CUPS) {
        const cup = toCupSaveDto(records, cupId);
        if (!isSyncableCupSave(cup, cupId) || extraCupSaveFields(cup).length) continue;
        try {
          await s.store.setDoc(
            s.store.doc(s.db, PROFILE_COLLECTION, s.uid, SAVE_SUBCOLLECTION, CUP_SAVE_DOCS[cupId]),
            { ...cup, updatedAt: s.store.serverTimestamp() },
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
  
  
  
  if (!s.a.currentUser) return { ok: false, reason: 'signed-out', mergeNeeded: false, credential: null };
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




























export async function linkEmailPassword(email, password) {
  const s = await ready();
  const fail = (reason, mergeNeeded = false, credential = null) => (
    { ok: false, reason, mergeNeeded, credential });
  
  
  
  if (!s) return fail('no-service');
  let credential = null;
  try {
    credential = s.auth.EmailAuthProvider.credential(email, password);
    
    
    
    
    
    
    
    
    const res = s.a.currentUser
      ? await withDeadline(
        s.auth.linkWithCredential(s.a.currentUser, credential).then(() => 'ok'),
        SIGN_IN_TIMEOUT_MS, null)
      : await withDeadline(
        s.auth.createUserWithEmailAndPassword(s.a, email, password).then(() => 'ok'),
        SIGN_IN_TIMEOUT_MS, null);
    if (res !== 'ok') return fail('timeout');
    _state = { ..._state, uid: s.a.currentUser?.uid ?? _state.uid };
    return { ok: true, reason: null, mergeNeeded: false, credential: null };
  } catch (err) {
    const code = err?.code ?? '';
    
    
    
    
    
    if (code === 'auth/email-already-in-use'
        || code === 'auth/credential-already-in-use'
        || code === 'auth/account-exists-with-different-credential') {
      return fail('already-in-use', true, credential);
    }
    if (code === 'auth/weak-password') return fail('weak');
    if (code === 'auth/invalid-email') return fail('invalid-email');
    if (code === 'auth/operation-not-allowed') return fail('provider-disabled');
    if (code === 'auth/requires-recent-login') return fail('reauth');
    if (code === 'auth/too-many-requests') return fail('rate-limited');
    return fail('failed');
  }
}










export async function signInWithEmail(email, password) {
  const s = await ready();
  if (!s) return { ok: false, reason: 'no-service' };
  try {
    const res = await withDeadline(
      s.auth.signInWithEmailAndPassword(s.a, email, password), SIGN_IN_TIMEOUT_MS, null,
    );
    const uid = res?.user?.uid ?? null;
    if (!uid) return { ok: false, reason: 'timeout' };
    
    
    _state = { ..._state, uid };
    return { ok: true, reason: null };
  } catch (err) {
    const code = err?.code ?? '';
    
    
    
    
    
    
    
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password'
        || code === 'auth/invalid-credential' || code === 'auth/invalid-email') {
      return { ok: false, reason: 'no-match' };
    }
    if (code === 'auth/too-many-requests') return { ok: false, reason: 'rate-limited' };
    if (code === 'auth/operation-not-allowed') return { ok: false, reason: 'provider-disabled' };
    return { ok: false, reason: 'failed' };
  }
}










export async function sendPasswordReset(email) {
  const s = await ready();
  if (!s) return { ok: false, reason: 'no-service' };
  try {
    await withDeadline(
      s.auth.sendPasswordResetEmail(s.a, email).catch((err) => {
        
        
        if (err?.code === 'auth/user-not-found') return null;
        throw err;
      }),
      SIGN_IN_TIMEOUT_MS, null,
    );
    return { ok: true, reason: null };
  } catch (err) {
    const code = err?.code ?? '';
    if (code === 'auth/invalid-email') return { ok: false, reason: 'invalid-email' };
    if (code === 'auth/too-many-requests') return { ok: false, reason: 'rate-limited' };
    if (code === 'auth/operation-not-allowed') return { ok: false, reason: 'provider-disabled' };
    return { ok: false, reason: 'failed' };
  }
}


export async function accountMethods() {
  const s = await ready();
  const user = s ? s.a.currentUser : null;
  if (!user) return { anonymous: false, google: false, password: false };
  const ids = (user.providerData ?? []).map((d) => d?.providerId).filter(Boolean);
  return {
    anonymous: !!user.isAnonymous,
    google: ids.includes('google.com'),
    password: ids.includes('password'),
  };
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
