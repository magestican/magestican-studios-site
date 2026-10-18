






















import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { roomCode, normaliseCode, GAME_PREFIX } from '../../../web-engine/words/coop.js';
import { BMSG, sanitiseView, sanitiseAction } from '../../../web-engine/buraco/buracoMatch.js';
import { exchangeCards } from '../../../web-engine/progress/peerCards.js';
import {
  ROLE, createWatchers, helloFor, roleOf, sanitiseWatchers,
} from '../../../web-engine/net/watchers.js';
import { createViewSender, createViewReceiver } from '../../../web-engine/net/logSync.js';

const MY_PREFIX = GAME_PREFIX.buraco;
const CODE_TRIES = 5;

















export function createNet({
  viewFor, onView, onProposal, onPeers, onStatus,
  onArrival = () => {}, onUnseat = () => {}, onDeparture = () => {},
}) {
  let mesh = null;
  let myId = null;
  let hosting = false;
  
  let myRole = ROLE.PLAY;

  const peers = () => (mesh ? [...mesh._peers] : []);
  const say = (kind, detail) => { try { onStatus(kind, detail); } catch {  } };

  
  
  const book = createWatchers({
    onSeat: (id) => { if (!hosting) return; onArrival(id); sendViews(); onPeers(peers(), myId); say('joined'); },
    onUnseat: (id) => { if (!hosting) return; onUnseat(id); sendViews(); onPeers(peers(), myId); },
    onChange: () => { if (hosting) sendViews(); onPeers(peers(), myId); },
  });
  const hello = () => helloFor(BMSG.HELLO, myId, myRole);

  
  
  
  const outbox = createViewSender();
  const inbox = createViewReceiver();

  



  function sendViews() {
    if (!mesh || !hosting) return;
    const watchers = book.list();
    for (const p of peers()) {
      if (p === myId) continue;
      const v = viewFor(p);
      if (!v) continue;
      const body = outbox.offer(p, { view: v, watchers });
      if (body) mesh.send(p, { t: BMSG.VIEW, ...body });
    }
  }

  
  function refuse(peer) {
    if (!mesh || !hosting || !peer) return;
    sendViews();
    const v = viewFor(peer);
    if (!v) return;
    const body = outbox.offer(peer, { view: v, watchers: book.list() }, { force: true });
    mesh.send(peer, { t: BMSG.VIEW, ...body, nack: true });
  }

  function wire() {
    exchangeCards(mesh, 'buraco');
    mesh.addEventListener('open', (e) => {
      myId = e.detail.id;
      onPeers(peers(), myId);
      say(hosting ? 'open' : 'joining');
    });
    mesh.addEventListener('peer-joined', (e) => {
      const who = e.detail?.peerId ?? e.detail?.id;
      onPeers(peers(), myId);
      
      
      if (hosting && who) { outbox.forget(who); book.arrived(who); }
      
      
      if (!hosting && who) mesh.send(who, hello());
      
      if (hosting) sendViews();
      else say('joined');
    });
    mesh.addEventListener('peer-left', (e) => {
      const who = e.detail?.peerId ?? e.detail?.id;
      if (who) { book.left(who); outbox.forget(who); }
      onPeers(peers(), myId);
      if (hosting && who) onDeparture(who);
      say('left');
    });
    mesh.addEventListener('message', (e) => {
      const { message, from } = e.detail;
      if (!message || typeof message !== 'object') return;
      if (message.t === BMSG.HELLO) {
        
        const who = from || (typeof message.by === 'string' ? message.by : null);
        if (who) book.hello(who, roleOf(message));
        if (hosting) sendViews();
        onPeers(peers(), myId);
        return;
      }
      if (message.t === BMSG.VIEW) {
        if (hosting) return;
        
        if (!inbox.take(message, from)) return;
        book.adopt(sanitiseWatchers(message.watchers));
        const v = sanitiseView(message.view);
        if (v) onView(v, { nack: message.nack === true });
        return;
      }
      if (message.t === BMSG.ACT) {
        if (!hosting) return;
        
        if (book.isWatcher(from)) return;
        
        if (message.rematch) { onProposal({ type: 'rematch' }, from); return; }
        const a = sanitiseAction(message.action);
        if (a) onProposal(a, from);
      }
    });
    mesh.addEventListener('host-changed', (e) => {
      hosting = !!e.detail.iAmHost;
      
      outbox.reset();
      inbox.reset();
      say('host', { iAmHost: hosting, previousHost: e.detail.previousHost });
      onPeers(peers(), myId);
    });
    mesh.addEventListener('join-failed', (e) => say('failed', { reason: e.detail?.reason ?? '' }));
    mesh.addEventListener('error', (e) => {
      const message = e.detail?.message ?? 'unknown';
      if (/unavailable-id/.test(message)) return;
      say('trouble', { message });
    });
  }

  return {
    get id() { return myId; },
    get hosting() { return hosting; },
    get active() { return !!mesh; },
    
    get watching() { return myRole === ROLE.WATCH; },
    
    get watchers() { return book.count; },
    
    isWatcher: (id) => book.isWatcher(id),
    peers,

    host(attempt = 0) {
      if (mesh) return;
      const hint = attempt < CODE_TRIES ? roomCode(Math.random, MY_PREFIX) : null;
      const mine = new PeerMesh(hint ? { hostIdHint: hint } : {});
      mesh = mine;
      hosting = true;
      myRole = ROLE.PLAY;
      wire();
      mine.addEventListener('error', (e) => {
        if (!/unavailable-id/.test(e.detail?.message ?? '')) return;
        if (mesh !== mine) return;
        try { mine.destroy(); } catch {  }
        mesh = null;
        this.host(attempt + 1);
      });
      mine.addEventListener('open', () => mine.host(), { once: true });
      if (attempt === 0) say('opening');
    },

    



    join(typed, { watch = false } = {}) {
      const hostId = normaliseCode(typed, MY_PREFIX);
      if (!hostId) return { error: 'code' };
      if (mesh) return {};
      mesh = new PeerMesh({});
      hosting = false;
      myRole = watch ? ROLE.WATCH : ROLE.PLAY;
      wire();
      mesh.addEventListener('open', () => {
        mesh.connectTo(hostId);
        if (myRole === ROLE.WATCH) book.hello(myId, ROLE.WATCH);
        setTimeout(() => { mesh?.broadcast(hello()); }, 400);
      }, { once: true });
      say('joining');
      return {};
    },

    
    propose(action) {
      if (!mesh || myRole === ROLE.WATCH) return;
      if (action && action.type === 'rematch') mesh.broadcast({ t: BMSG.ACT, rematch: true });
      else mesh.broadcast({ t: BMSG.ACT, action });
    },

    
    publish: () => sendViews(),

    
    refuse,

    leave() {
      try { mesh?.destroy(); } catch {  }
      mesh = null;
      myId = null;
      hosting = false;
      myRole = ROLE.PLAY;
      book.reset();
      outbox.reset();
      inbox.reset();
      onPeers([], null);
      say('left');
    },
  };
}


export const canPlayTogether = () => typeof window !== 'undefined'
  && !!window.Peer
  && typeof RTCPeerConnection !== 'undefined';
