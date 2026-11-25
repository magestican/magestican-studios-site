


import { SITE_PATH } from '../site/adapter.js';

const CODE_PREFIX = 's95-';
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; 


export function roomCode(random = Math.random) {
  let s = '';
  for (let i = 0; i < 5; i++) s += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return s;
}


export const ROOM_CODE_KEY = 'magestican.roomCode.s95';


export function hostCode(storage, random = Math.random, fresh = false) {
  let old = null;
  try {
    old = storage?.getItem(ROOM_CODE_KEY) ?? null;
  } catch {}
  if (!fresh && old && parseCode(old) === old) return old;
  let code = roomCode(random);
  while (code === old) code = roomCode(random);
  try {
    storage?.setItem(ROOM_CODE_KEY, code);
  } catch {}
  return code;
}


export const newHostCode = (storage, random = Math.random) => hostCode(storage, random, true);


export function parseCode(text) {
  const m = String(text ?? '')
    .toLowerCase()
    .match(/(?:join=)?(?:s95-)?([a-z2-9]{5})\s*$/);
  if (!m) return null;
  return [...m[1]].every((c) => ALPHABET.includes(c)) ? m[1] : null;
}


export function shareLink(loc, code, level) {
  return `${loc.origin}${loc.pathname}?level=${level}&join=${code}`;
}


export function netUrls(loc) {
  if (!loc || typeof loc.pathname !== 'string' || !loc.pathname.startsWith(SITE_PATH)) return null;
  return { mesh: `${loc.origin}/web-engine/net/peerMesh.js`, peerjs: `${loc.origin}/web-engine/vendor/peerjs-1.5.4/peerjs.min.js` };
}


export function coopFromUrl(search) {
  const q = new URLSearchParams(search);
  for (const [k, role] of  ([
    ['host', 'host'],
    ['join', 'guest'],
  ])) {
    if (!q.has(k)) continue;
    const code = parseCode(q.get(k) ?? '');
    return code ? { role, code } : null;
  }
  return null;
}





export function channelTransport(code, Channel = globalThis.BroadcastChannel) {
  const ch = new Channel(CODE_PREFIX + code);
  const handlers = [];
  ch.onmessage = (e) => {
    for (const fn of handlers) fn(e.data, performance.now());
  };
  return {
    transport: { send: (m) => ch.postMessage(m), onMessage: (fn) => handlers.push(fn) },
    close: () => ch.close(),
  };
}


function loadScript(src) {
  return new Promise((ok, fail) => {
    if (window.Peer) return ok();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => ok();
    s.onerror = () => fail(new Error(`could not load ${src}`));
    document.head.append(s);
  });
}


export const closeMesh = (m) => {
  m.destroy();
  m.peer?.destroy();
};

export function onHide(w, bye) {
  w.addEventListener('pagehide', bye);
  w.addEventListener('pageshow', (e) => e.persisted && w.location.reload());
}


export async function withRetry(open, tries, wait = (ms) => new Promise((r) => setTimeout(r, ms))) {
  for (let i = 1; ; i++) {
    try {
      return await open();
    } catch (e) {
      if (i >= tries) throw e;
      await wait(1500);
    }
  }
}





export async function openTransport({ role, code, urls, onLeft }) {
  await loadScript(urls.peerjs);
  const { PeerMesh } = await import( urls.mesh);
  const mesh = new PeerMesh(role === 'host' ? { hostIdHint: CODE_PREFIX + code } : {});
  const handlers = [];
  mesh.addEventListener('message', (e) => {
    for (const fn of handlers) fn(e.detail.message, performance.now());
  });
  mesh.addEventListener('peer-left', () => onLeft?.());
  const transport = { send: (m) => mesh.broadcast(m), onMessage: (fn) => handlers.push(fn) };
  await new Promise((ok, f) => {
    const fail = (e) => {
      mesh.destroy();
      f(e);
    };
    mesh.addEventListener('error', (e) => fail(new Error(e.detail.message)), { once: true });
    mesh.addEventListener('join-failed', (e) => fail(new Error(e.detail.reason)), { once: true });
    mesh.addEventListener(
      'open',
      () => {
        if (role === 'host') {
          mesh.host();
          ok();
        } else {
          mesh.addEventListener('peer-joined', () => ok(), { once: true });
          mesh.connectTo(CODE_PREFIX + code);
        }
      },
      { once: true },
    );
  });
  return { transport, close: () => closeMesh(mesh) };
}

