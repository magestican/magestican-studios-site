




import {
  collection,
  connectAuthEmulator,
  connectFirestoreEmulator,
  doc,
  getAuth,
  getDoc,
  getDocFromServer,
  getFirestore,
  initializeApp,
  onSnapshot,
  serverTimestamp,
  setDoc,
  signInAnonymously,
  Timestamp,
  updateDoc,
} from '../vendor/firebase-vendor.js';
import { clockOffset } from './clock.js';
import { EMULATOR, FIREBASE, LIVE } from './config.js';
import { cleanName, isCode, joinCheck, makeCode, newRoom } from './room.js';


const SEND_GAP_MS = 260;
const PROBES = 3;

const LEAD_MS = 3000;

const REASONS = {
  missing: 'No room with that code.',
  expired: 'That room has closed.',
  over: 'That game has finished.',
  full: 'That room is full (20 players).',
};












export async function openRoom({ code, emu, ui, stage, difficulty }) {
  if (isCode(code)) ui.setCode(code);
  if (!LIVE && !emu) {
    ui.error('Online rooms are not switched on yet.');
    return new Promise(() => {});
  }
  const app = initializeApp(FIREBASE);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (emu) {
    connectAuthEmulator(auth, EMULATOR.authUrl, { disableWarnings: true });
    connectFirestoreEmulator(db, EMULATOR.host, EMULATOR.firestorePort);
  }
  
  const signedIn = signInAnonymously(auth);
  let uid = '';

  const { roomCode, name } = await new Promise((resolve) => {
    const attempt = async (make) => {
      ui.busy(true);
      try {
        uid = (await signedIn).user.uid;
        const n = cleanName(ui.name());
        resolve({ roomCode: make ? await create(db, uid, n, stage, difficulty) : await join(db, uid, n, ui.code()), name: n });
      } catch (err) {
        ui.error(err instanceof Error ? err.message : String(err));
        ui.busy(false);
      }
    };
    ui.onMake(() => attempt(true));
    ui.onJoin(() => attempt(false));
  });

  const hitsRef = doc(db, 'rooms', roomCode, 'hits', uid);
  const offsetMs = await probeClock(hitsRef, name);
  const roomRef = doc(db, 'rooms', roomCode);

  
  const run = await new Promise((resolve) => {
    let players = {};
    let hostId = '';
    ui.onStart(() => {
      updateDoc(roomRef, {
        state: 'playing',
        size: Math.max(1, Object.keys(players).length),
        startAt: Timestamp.fromMillis(Date.now() + offsetMs + LEAD_MS),
      }).catch((err) => ui.error(String(err)));
    });
    onSnapshot(roomRef, (snap) => {
      const d = snap.data({ serverTimestamps: 'none' });
      if (!d) return;
      players = d.players ?? {};
      hostId = d.hostId;
      ui.showRoom({ code: roomCode, names: Object.values(players).map((p) => p.name), host: hostId === uid });
      if (d.state === 'playing' && d.startAt) {
        resolve({
          stage: d.stage,
          difficulty: d.difficulty,
          seed: d.seed,
          size: d.size ?? Object.keys(players).length,
          startAtMs: d.startAt.toMillis(),
        });
      }
    });
  });

  
  
  
  let pending = null;
  let inFlight = false;
  let lastSent = Date.now();
  const pump = () => {
    if (!pending || inFlight || Date.now() - lastSent < SEND_GAP_MS) return;
    const r = pending;
    pending = null;
    inFlight = true;
    lastSent = Date.now();
    setDoc(hitsRef, { name, score: r.score, dmg: r.dmg, at: serverTimestamp() })
      .catch(() => {
        pending ??= r;
      })
      .finally(() => {
        inFlight = false;
      });
  };

  return {
    me: uid,
    name,
    code: roomCode,
    offsetMs,
    ...run,
    ui,
    
    send(report) {
      pending = report;
      pump();
    },
    pump,
    
    listen(fn) {
      onSnapshot(collection(roomRef, 'hits'), (q) => {
        for (const c of q.docChanges()) if (c.type !== 'removed') fn(c.doc.id, c.doc.data());
      });
    },
  };
}

async function create(db, uid, name, stage, difficulty) {
  for (let i = 0; i < 4; i++) {
    const code = makeCode(Math.random);
    const ref = doc(db, 'rooms', code);
    if ((await getDoc(ref)).exists()) continue;
    const r = newRoom({
      code,
      hostId: uid,
      hostName: name,
      stage,
      seed: 1 + Math.floor(Math.random() * 1e6),
      difficulty,
      nowMs: Date.now(),
    });
    await setDoc(ref, { ...r, startAt: null, expireAt: Timestamp.fromMillis(r.expireAt) });
    return code;
  }
  throw new Error('Could not make a room, try again.');
}

async function join(db, uid, name, raw) {
  const code = String(raw).trim().toUpperCase();
  if (!isCode(code)) throw new Error('A room code is 5 letters.');
  const ref = doc(db, 'rooms', code);
  const snap = await getDoc(ref);
  const d = snap.exists() ? snap.data() : null;
  const check = joinCheck(d && { ...d, expireAt: d.expireAt.toMillis() }, uid, Date.now());
  if (!check.ok) throw new Error(REASONS[check.reason]);
  await updateDoc(ref, { [`players.${uid}`]: { name, joinedAt: Date.now() } });
  return code;
}


async function probeClock(hitsRef, name) {
  const probes = [];
  for (let i = 0; i < PROBES; i++) {
    if (i) await new Promise((r) => setTimeout(r, SEND_GAP_MS));
    const sent = Date.now();
    await setDoc(hitsRef, { name, score: 0, dmg: {}, at: serverTimestamp() });
    const received = Date.now();
    const at = (await getDocFromServer(hitsRef)).data()?.at;
    if (at) probes.push({ sent, server: at.toMillis(), received });
  }
  return clockOffset(probes);
}
