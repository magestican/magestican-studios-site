




















import {
  LEADERBOARD_CONFIG, LEADERBOARD_COLLECTION, LEADERBOARD_LIMIT, isConfigured,
} from './leaderboardConfig.js';
import { toPublicDto, fromPublicDto, isPublishable, playerKey } from './leaderboardDto.js';



const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

let _state = null;      



async function ready(cfg = LEADERBOARD_CONFIG) {
  if (_state !== null) return _state;
  if (!isConfigured(cfg)) { _state = false; return _state; }
  try {
    const [{ initializeApp }, appCheck, store] = await Promise.all([
      import( `${SDK}firebase-app.js`),
      import( `${SDK}firebase-app-check.js`),
      import( `${SDK}firebase-firestore.js`),
    ]);
    const app = initializeApp({
      apiKey: cfg.apiKey, authDomain: cfg.authDomain,
      projectId: cfg.projectId, appId: cfg.appId,
    });
    
    
    
    
    
    
    
    
    
    
    
    
    
    appCheck.initializeAppCheck(app, {
      provider: new appCheck.ReCaptchaEnterpriseProvider(cfg.appCheckSiteKey),
      
      
      isTokenAutoRefreshEnabled: true,
    });
    _state = { app, store, db: store.getFirestore(app) };
  } catch (_) {
    
    
    _state = false;
  }
  return _state;
}





export async function publishScores(rows, cfg = LEADERBOARD_CONFIG) {
  const s = await ready(cfg);
  if (!s) return 0;
  let sent = 0;
  for (const row of rows ?? []) {
    const dto = toPublicDto(row);
    
    
    if (!dto || !isPublishable(dto)) continue;
    try {
      const key = await playerKey(dto.name);
      if (!key) continue;
      const ref = s.store.doc(s.db, LEADERBOARD_COLLECTION, key);
      
      
      
      
      await s.store.setDoc(ref, dto, { merge: true });
      sent++;
    } catch (_) {
      
      
    }
  }
  return sent;
}











export const ORDERABLE_FIELDS = Object.freeze(['kills', 'deaths', 'wins', 'matches']);





export async function fetchTopPlayers(limit = LEADERBOARD_LIMIT, cfg = LEADERBOARD_CONFIG,
  { orderField = 'kills' } = {}) {
  const s = await ready(cfg);
  if (!s) return [];
  const order = ORDERABLE_FIELDS.includes(orderField) ? orderField : 'kills';
  try {
    const q = s.store.query(
      s.store.collection(s.db, LEADERBOARD_COLLECTION),
      s.store.orderBy(order, 'desc'),
      s.store.limit(Math.max(1, Math.min(limit, LEADERBOARD_LIMIT))),
    );
    const snap = await s.store.getDocs(q);
    const out = [];
    snap.forEach((d) => {
      
      
      
      const row = fromPublicDto(d.data());
      if (row) out.push(row);
    });
    return out;
  } catch (_) {
    return [];
  }
}



export function isGlobalEnabled(cfg = LEADERBOARD_CONFIG) {
  return isConfigured(cfg);
}


export function _resetForTests() { _state = null; }
























export async function countMatch(cfg = LEADERBOARD_CONFIG) {
  const s = await ready(cfg);
  if (!s) return false;
  try {
    const { doc, setDoc, increment } = s.store;
    await setDoc(
      doc(s.db, 'meta', 'totals'),
      { matches: increment(1), updatedAt: Date.now() },
      { merge: true },
    );
    return true;
  } catch (err) {
    
    console.warn('[leaderboard] match count failed:', err?.message || err);
    return false;
  }
}





export async function fetchTotals(cfg = LEADERBOARD_CONFIG) {
  const s = await ready(cfg);
  if (!s) return null;
  try {
    const { doc, getDoc } = s.store;
    const snap = await getDoc(doc(s.db, 'meta', 'totals'));
    if (!snap.exists()) return { matches: 0 };
    const n = snap.data()?.matches;
    return { matches: Number.isFinite(n) ? n : 0 };
  } catch (err) {
    console.warn('[leaderboard] totals fetch failed:', err?.message || err);
    return null;
  }
}
