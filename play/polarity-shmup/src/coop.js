






import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { ROLE, roomFromHref, watchLinkFor } from '../../../web-engine/net/watchers.js';
import { createRoom } from './net/room.js';

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





export async function openRoom({ onEvent, href = location.href }) {
  await loadPeerJs();
  const { role, hostId } = roleFromHref(href);
  const mesh = new PeerMesh({ star: true });
  return new Promise((resolve, reject) => {
    let opened = false;
    mesh.addEventListener('error', (e) => {
      const message = e.detail?.message || 'network error';
      if (!opened) reject(new Error(message)); else onEvent({ type: 'error', message });
    });
    mesh.addEventListener('open', () => {
      opened = true;
      const room = createRoom({
        mesh, role, hostId, onEvent,
        
        seedFor: () => (Date.now() % 2147483647) | 0,
      });
      if (role === 'host') { mesh.host(); room.links = linksFor(href, mesh.myId); }
      else mesh.connectTo(hostId);
      resolve(room);
    });
  });
}
