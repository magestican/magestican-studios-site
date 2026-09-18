

















































import {
  CLOUD_MOONS, CLOUD_ROOT, CLOUD_POLICY, cloudDoc, cloudDue, looksLikeEmail, mergePlan, moonId, readCloudDoc,
} from 'moon/play/cloudSave.mjs';
import { readSave } from 'moon/economy/save.mjs';
import { onDirectoryOrigin } from './rooms.js';






import { LEADERBOARD_CONFIG, isConfigured } from '../../../../web-engine/stats/leaderboardConfig.js';


export const CLOUD_ON_KEY = 'fml.cloud.on';

export const CLOUD_EMAIL_KEY = 'fml.cloud.email';


export const BOOT_WAIT_MS = 3000;

export const MOONS_LIMIT = 20;

const store = {
  get(key) { try { return globalThis.localStorage ? localStorage.getItem(key) : null; } catch (_) { return null; } },
  set(key, value) { try { if (globalThis.localStorage) localStorage.setItem(key, value); } catch (_) {  } },
  clear(key) { try { if (globalThis.localStorage) localStorage.removeItem(key); } catch (_) {  } },
};


function withDeadline(promise, ms, fallback) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const timer = setTimeout(() => finish(fallback), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); finish(v); },
      () => { clearTimeout(timer); finish(fallback); },
    );
  });
}











export function createCloud({
  slot = 'moon',
  liveSave = () => null,
  readLocal = async () => null,
  writeLocal = async () => {},
  onChange = () => {},
  config = LEADERBOARD_CONFIG,
} = {}) {
  const id = moonId(slot);
  const state = {
    
    configured: isConfigured(config),
    onOrigin: onDirectoryOrigin(),
    signedIn: false,
    uid: null,
    email: null,
    busy: false,
    
    
    
    online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
    error: null,
    sent: null,
    pending: false,
    writing: false,
    lastWriteAt: null,
    lastFailAt: null,
    lastSyncAt: null,
    pushes: 0,
    pulls: 0,
    adopted: [],
    
    
    
    newer: null,
    plan: null,
    note: null,
  };

  const changed = () => { try { onChange(state); } catch (_) {  } };
  const available = () => state.configured && state.onOrigin;

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('online', () => { state.online = true; changed(); });
    window.addEventListener('offline', () => { state.online = false; changed(); });
  }

  let sdk = null;          
  let loading = null;
  let newestSave = null;   

  



  async function ready() {
    if (sdk !== null) return sdk || null;
    if (!available()) { sdk = false; return null; }
    if (!loading) {
      loading = (async () => {
        const mods = await withDeadline(Promise.all([
          import('../../../../web-engine/vendor/firebase/firebase-app.js'),
          import('../../../../web-engine/vendor/firebase/firebase-app-check.js'),
          import('../../../../web-engine/vendor/firebase/firebase-auth.js'),
          import('../../../../web-engine/vendor/firebase/firebase-firestore-lite.js'),
        ]), BOOT_WAIT_MS * 4, null);
        if (!mods) return false;
        const [core, appCheck, auth, db] = mods;
        try {
          
          
          
          const apps = core.getApps();
          const app = apps.length ? apps[0] : core.initializeApp({
            apiKey: config.apiKey, authDomain: config.authDomain,
            projectId: config.projectId, appId: config.appId,
          });
          if (!apps.length) {
            try {
              appCheck.initializeAppCheck(app, {
                provider: new appCheck.ReCaptchaEnterpriseProvider(config.appCheckSiteKey),
                isTokenAutoRefreshEnabled: true,
              });
            } catch (_) {  }
          }
          const a = auth.getAuth(app);
          
          try { await auth.setPersistence(a, auth.browserLocalPersistence); } catch (_) {  }
          
          
          
          
          
          let settle;
          const settled = new Promise((resolve) => { settle = resolve; });
          auth.onAuthStateChanged(a, (user) => {
            state.signedIn = Boolean(user);
            state.uid = user ? user.uid : null;
            state.email = user ? (user.email || null) : null;
            if (user) store.set(CLOUD_ON_KEY, '1');
            settle();
            changed();
          });
          return { core, auth, db, app, a, fs: db.getFirestore(app), settled };
        } catch (_) {
          return false;
        }
      })();
    }
    const got = await loading;
    sdk = got;
    return got || null;
  }

  const moonsOf = (s, uid) => s.db.collection(s.fs, CLOUD_ROOT, uid, CLOUD_MOONS);
  const moonRef = (s, uid, docId) => s.db.doc(s.fs, CLOUD_ROOT, uid, CLOUD_MOONS, docId);

  
  async function pull() {
    const s = await ready();
    if (!s || !state.uid) return [];
    try {
      const { getDocs, query, limit } = s.db;
      const snap = await getDocs(query(moonsOf(s, state.uid), limit(MOONS_LIMIT)));
      const out = [];
      snap.forEach((d) => {
        const read = readCloudDoc(d.data());
        out.push({ id: d.id, savedAt: read.savedAt, ok: read.ok, doc: read.doc, why: read.reason });
      });
      state.pulls += 1;
      return out;
    } catch (_) {
      
      return [];
    }
  }

  
  async function push(docId, save) {
    const s = await ready();
    if (!s || !state.uid) return false;
    const made = cloudDoc(save);
    if (!made.ok) { state.note = made.reason; changed(); return false; }
    try {
      await s.db.setDoc(moonRef(s, state.uid, docId), made.doc);
      state.pushes += 1;
      state.lastSyncAt = Date.now();
      state.note = null;
      return true;
    } catch (_) {
      state.error = 'Your moon could not be saved to the cloud just now. It is safe on this device.';
      return false;
    }
  }

  








  async function merge({ atBoot = false } = {}) {
    const remote = await pull();
    let mine = null;
    try {
      
      
      
      
      
      const raw = await readLocal(id);
      const read = readSave(raw);
      mine = read.ok ? read.doc : null;
    } catch (_) { mine = null; }
    const local = [];
    if (mine && Number.isInteger(mine.savedAt)) local.push({ id, savedAt: mine.savedAt });
    else if (!atBoot) {
      const live = liveSave();
      if (live && Number.isInteger(live.savedAt)) local.push({ id, savedAt: live.savedAt });
    }
    const plan = mergePlan({ local, remote, now: Date.now() });
    state.plan = plan;
    for (const wanted of plan.pull) {
      const copy = remote.find((r) => r.id === wanted);
      if (!copy || !copy.ok) continue;
      if (wanted === id && !atBoot) {
        
        state.newer = { id: wanted, savedAt: copy.savedAt };
        continue;
      }
      try {
        await writeLocal(wanted, copy.doc);
        if (wanted !== id) state.adopted.push(wanted);
      } catch (_) {  }
    }
    for (const wanted of plan.push) {
      const save = wanted === id ? (mine || liveSave()) : null;
      if (save) await push(wanted, save);
    }
    state.lastSyncAt = Date.now();
    changed();
    return plan;
  }

  const api = {
    state,
    get id() { return id; },
    
    get available() { return available(); },
    
    get returning() {
      return store.get(CLOUD_ON_KEY) === '1'
        || (typeof location !== 'undefined' && /[?&](oobCode|apiKey)=/.test(location.search));
    },

    




    async beforeRestore() {
      if (!available() || !api.returning) return false;
      return withDeadline((async () => {
        const s = await ready();
        if (!s) return false;
        
        
        
        await api.completeLink();
        
        await s.settled;
        if (!state.uid) return false;
        await merge({ atBoot: true });
        return true;
      })(), BOOT_WAIT_MS, false);
    },

    
    async completeLink() {
      const s = await ready();
      if (!s || typeof location === 'undefined') return false;
      let isLink = false;
      try { isLink = s.auth.isSignInWithEmailLink(s.a, location.href); } catch (_) { isLink = false; }
      if (!isLink) return false;
      const email = store.get(CLOUD_EMAIL_KEY);
      if (!email) {
        state.error = 'This sign-in link was opened on a different device from the one that asked for it. Ask for another from this device.';
        changed();
        return false;
      }
      state.busy = true;
      changed();
      try {
        await s.auth.signInWithEmailLink(s.a, email, location.href);
        store.clear(CLOUD_EMAIL_KEY);
        store.set(CLOUD_ON_KEY, '1');
        state.error = null;
        state.sent = null;
        return true;
      } catch (_) {
        state.error = 'That sign-in link has expired. Ask for another one.';
        return false;
      } finally {
        state.busy = false;
        changed();
      }
    },

    
    async signInWithGoogle() {
      if (!available()) return false;
      state.busy = true;
      state.error = null;
      changed();
      try {
        const s = await ready();
        if (!s) { state.error = 'Signing in is not available right now.'; return false; }
        const provider = new s.auth.GoogleAuthProvider();
        try {
          await s.auth.signInWithPopup(s.a, provider);
        } catch (e) {
          const code = String(e && e.code ? e.code : e);
          if (/popup-blocked|popup-closed|operation-not-supported/.test(code)) {
            await s.auth.signInWithRedirect(s.a, provider);
            return true;
          }
          throw e;
        }
        store.set(CLOUD_ON_KEY, '1');
        await merge({ atBoot: false });
        return true;
      } catch (_) {
        state.error = 'That did not work. Your moon is safe on this device either way.';
        return false;
      } finally {
        state.busy = false;
        changed();
      }
    },

    
    async sendLink(email) {
      const to = String(email ?? '').trim();
      if (!looksLikeEmail(to)) {
        state.error = 'That does not look like an email address.';
        changed();
        return false;
      }
      if (!available()) return false;
      state.busy = true;
      state.error = null;
      changed();
      try {
        const s = await ready();
        if (!s) { state.error = 'Signing in is not available right now.'; return false; }
        const url = `${location.origin}${location.pathname}`;
        await s.auth.sendSignInLinkToEmail(s.a, to, { url, handleCodeInApp: true });
        
        
        store.set(CLOUD_EMAIL_KEY, to);
        state.sent = to;
        return true;
      } catch (_) {
        state.error = 'The email could not be sent. Your moon is safe on this device either way.';
        return false;
      } finally {
        state.busy = false;
        changed();
      }
    },

    



    async signOutNow() {
      store.clear(CLOUD_ON_KEY);
      const s = await ready();
      if (!s) return false;
      try { await s.auth.signOut(s.a); } catch (_) {  }
      state.signedIn = false;
      state.uid = null;
      state.email = null;
      state.newer = null;
      changed();
      return true;
    },

    
    async useNewer() {
      if (!state.newer) return false;
      const remote = await pull();
      const copy = remote.find((r) => r.id === state.newer.id);
      if (!copy || !copy.ok) return false;
      await writeLocal(copy.id, copy.doc);
      if (typeof location !== 'undefined' && location.reload) location.reload();
      return true;
    },

    
    keep(save) {
      if (!save) return;
      newestSave = save;
      state.pending = true;
    },

    
    tick(now = Date.now()) {
      if (!available()) return false;
      if (!cloudDue({ ...state, signedIn: state.signedIn }, now, CLOUD_POLICY)) return false;
      const save = newestSave;
      if (!save) { state.pending = false; return false; }
      state.writing = true;
      state.pending = false;
      push(id, save).then((ok) => {
        state.writing = false;
        if (ok) { state.lastWriteAt = Date.now(); state.error = null; } else {
          state.lastFailAt = Date.now();
          
          
          state.pending = true;
        }
        changed();
      });
      changed();
      return true;
    },

    




    flush() {
      if (!available() || !state.signedIn || !state.pending || !newestSave) return false;
      state.pending = false;
      push(id, newestSave).then(() => { state.lastWriteAt = Date.now(); changed(); });
      return true;
    },

    
    read() {
      return {
        available: available(),
        configured: state.configured,
        onOrigin: state.onOrigin,
        signedIn: state.signedIn,
        email: state.email,
        online: state.online,
        pending: state.pending,
        writing: state.writing,
        pushes: state.pushes,
        pulls: state.pulls,
        adopted: [...state.adopted],
        newer: state.newer,
        plan: state.plan,
        note: state.note,
        error: state.error,
        
        
        
        sdkLoaded: sdk !== null && sdk !== false,
      };
    },
  };

  return api;
}
