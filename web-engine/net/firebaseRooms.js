































import { LEADERBOARD_CONFIG, isConfigured } from '../stats/leaderboardConfig.js';
import { REFRESH_MS, roomDoc, LIVE_GAMES, isFresh } from './presence.js';


export const ROOMS_COLLECTION = 'openRooms';










export const ROOMS_LIMIT = 40;

let _state = null;      













async function ready(cfg = LEADERBOARD_CONFIG) {
  if (_state !== null) return _state;
  if (!isConfigured(cfg)) { _state = false; return _state; }
  try {
    const [{ initializeApp, getApps, getApp }, appCheck, store] = await Promise.all([
      import('../vendor/firebase/firebase-app.js'),
      import('../vendor/firebase/firebase-app-check.js'),
      import('../vendor/firebase/firebase-firestore-lite.js'),
    ]);
    
    
    
    
    
    const existing = getApps?.().length ? getApp() : null;
    const app = existing || initializeApp({
      apiKey: cfg.apiKey, authDomain: cfg.authDomain,
      projectId: cfg.projectId, appId: cfg.appId,
    });
    if (!existing) {
      appCheck.initializeAppCheck(app, {
        provider: new appCheck.ReCaptchaEnterpriseProvider(cfg.appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    }
    _state = { app, store, db: store.getFirestore(app) };
  } catch (_) {
    
    
    
    _state = false;
  }
  return _state;
}


export function _resetForTests() { _state = null; }


export async function isLobbyAvailable(cfg = LEADERBOARD_CONFIG) {
  return !!(await ready(cfg));
}









export async function fetchOpenRooms(cfg = LEADERBOARD_CONFIG) {
  const s = await ready(cfg);
  if (!s) return [];
  try {
    const { collection, getDocs, query, limit } = s.store;
    const snap = await getDocs(query(collection(s.db, ROOMS_COLLECTION), limit(ROOMS_LIMIT)));
    const out = [];
    snap.forEach((d) => {
      const data = d.data();
      
      
      
      if (!data || !LIVE_GAMES[data.game]) return;
      out.push({
        game: String(data.game),
        code: String(data.code ?? d.id),
        players: Number(data.players) || 0,
        
        
        
        bots: Number(data.bots) || 0,
        updatedAt: Number(data.updatedAt) || 0,
      });
    });
    return out;
  } catch (_) {
    return [];
  }
}


























export async function sweepStaleRooms(rooms, { now = Date.now(), limit = 1 } = {}, cfg = LEADERBOARD_CONFIG) {
  const dead = (rooms ?? []).filter((r) => !isFresh(r, now)).slice(0, Math.max(0, limit));
  if (!dead.length) return 0;
  const s = await ready(cfg);
  if (!s) return 0;
  let gone = 0;
  for (const room of dead) {
    try {
      const { doc, deleteDoc } = s.store;
      await deleteDoc(doc(s.db, ROOMS_COLLECTION, room.code));
      gone += 1;
    } catch (_) {  }
  }
  return gone;
}













export function publishRoom({ game, code, players, bots = 0 }, cfg = LEADERBOARD_CONFIG) {
  const countOf = typeof players === 'function' ? players : () => players;
  
  
  
  
  const botsOf = typeof bots === 'function' ? bots : () => bots;
  let stopped = false;
  let timer = null;

  const write = async () => {
    const s = await ready(cfg);
    if (!s || stopped) return;
    try {
      const { doc, setDoc } = s.store;
      await setDoc(
        doc(s.db, ROOMS_COLLECTION, code),
        roomDoc({ game, code, players: countOf(), bots: botsOf(), now: Date.now() }),
      );
    } catch (_) {  }
  };

  
  
  
  
  write();
  timer = setInterval(write, REFRESH_MS);

  return async function stop() {
    if (stopped) return;
    stopped = true;
    if (timer) { clearInterval(timer); timer = null; }
    const s = await ready(cfg);
    if (!s) return;
    try {
      const { doc, deleteDoc } = s.store;
      await deleteDoc(doc(s.db, ROOMS_COLLECTION, code));
    } catch (_) {  }
  };
}
