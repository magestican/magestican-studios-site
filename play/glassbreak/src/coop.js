






import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { ROLE, roomFromHref, watchLinkFor } from '../../../web-engine/net/watchers.js';
import { createRoom } from './net/room.js';
import { stickyRoomCode } from '../../../web-engine/net/stickyRoomCode.js';
import { roomCode } from '../../../web-engine/words/coop.js';

let peerJs = null;
function loadPeerJs() {
  
  peerJs ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('../../../web-engine/vendor/peerjs-1.5.4/peerjs.min.js', import.meta.url).href;
    s.onload = resolve;
    s.onerror = () => { peerJs = null; reject(new Error('could not load the network module')); };
    document.head.appendChild(s);
  });
  return peerJs;
}


export function roleFromHref(href) {
  const t = roomFromHref(href);
  return { role: t ? (t.role === ROLE.WATCH ? 'watch' : 'play') : 'host', hostId: t?.code ?? null };
}


export function linksFor(href, id) {
  const base = new URL(href);
  base.search = ''; base.hash = '';
  const join = new URL(base);
  join.searchParams.set('join', id);
  return { join: join.toString(), watch: watchLinkFor(base.toString(), id) };
}






const PREFIX = 'gbk-';
const CODE_TRIES = 5;
const sticky = stickyRoomCode('glassbreak');
export const forgetRoomCode = () => sticky.forget();


export const GUEST_RETRIES = 5;
export const GUEST_RETRY_MS = 2000;
export const HOST_NOT_OPEN = "The host's room is not open. Ask them to open Emberpane and share the link again.";


function hostMesh(attempt = 0) {
  return new Promise((resolve, reject) => {
    const hint = sticky.hint(attempt, () => roomCode(Math.random, PREFIX), CODE_TRIES);
    const mesh = new PeerMesh(hint ? { star: true, hostIdHint: hint } : { star: true });
    let opened = false;
    mesh.addEventListener('error', (e) => {
      if (opened) return;
      const message = e.detail?.message || 'network error';
      if (/unavailable-id/.test(message)) {
        try { mesh.destroy(); } catch {  }
        sticky.retry(attempt, () => hostMesh(attempt + 1).then(resolve, reject));
        return;
      }
      reject(new Error(message));
    });
    mesh.addEventListener('open', () => { opened = true; sticky.keep(mesh.myId); resolve(mesh); }, { once: true });
  });
}


function guestMesh() {
  return new Promise((resolve, reject) => {
    const mesh = new PeerMesh({ star: true });
    let opened = false;
    mesh.addEventListener('error', (e) => { if (!opened) reject(new Error(e.detail?.message || 'network error')); });
    mesh.addEventListener('open', () => { opened = true; resolve(mesh); }, { once: true });
  });
}





export async function openRoom({ onEvent, href = location.href }) {
  await loadPeerJs();
  const { role, hostId } = roleFromHref(href);
  const mesh = role === 'host' ? await hostMesh() : await guestMesh();
  const room = createRoom({
    mesh, role, hostId, onEvent,
    
    seedFor: () => (Date.now() % 2147483647) | 0,
  });
  let tries = 0;
  mesh.addEventListener('error', (e) => {
    const message = e.detail?.message || 'network error';
    
    if (role !== 'host' && /peer-unavailable/.test(message) && !mesh.connections.has(hostId)) {
      if (++tries <= GUEST_RETRIES) { onEvent({ type: 'retrying', n: tries }); setTimeout(() => mesh.connectTo(hostId), GUEST_RETRY_MS); }
      else onEvent({ type: 'error', message: HOST_NOT_OPEN, plain: true });
      return;
    }
    onEvent({ type: 'error', message });
  });
  if (role === 'host') { mesh.host(); room.links = linksFor(href, mesh.myId); }
  else mesh.connectTo(hostId);
  return room;
}
