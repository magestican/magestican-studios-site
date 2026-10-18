






















import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { roomCode, normaliseCode, GAME_PREFIX } from '../../../web-engine/words/coop.js';
import { GMSG, sanitiseMatch } from '../../../web-engine/gomoku/gomokuMatch.js';
import { exchangeCards } from '../../../web-engine/progress/peerCards.js';
import {
  ROLE, createWatchers, helloFor, roleOf, sanitiseWatchers,
} from '../../../web-engine/net/watchers.js';
import {
  SYNC, SYNC_VERSION, createLogSender, createLogReceiver,
} from '../../../web-engine/net/logSync.js';

const MY_PREFIX = GAME_PREFIX.gomoku;


const CODE_TRIES = 5;
















export function createNet({ snapshot, onMatch, onProposal, onPeers, onStatus, onArrival = () => {}, onUnseat = () => {} }) {
  let mesh = null;
  let myId = null;
  let hosting = false;
  
  let myRole = ROLE.PLAY;

  const peers = () => (mesh ? [...mesh._peers] : []);
  const say = (kind, detail) => { try { onStatus(kind, detail); } catch {  } };

  
  
  const book = createWatchers({
    onSeat: (id) => { if (!hosting) return; onArrival(id); sendMatch(); onPeers(peers(), myId); say('joined'); },
    onUnseat: (id) => { if (!hosting) return; onUnseat(id); sendMatch(); onPeers(peers(), myId); },
    onChange: () => { if (hosting) sendMatch(); onPeers(peers(), myId); },
  });
  const hello = () => ({ ...helloFor(GMSG.HELLO, myId, myRole), sync: SYNC_VERSION });

  
  
  const sender = createLogSender({ list: 'moves' });
  const receiver = createLogReceiver({ list: 'moves' });
  
  const syncing = new Set();

  



  function sendMatch({ full = false } = {}) {
    if (!mesh || !hosting) return;
    const m = snapshot();
    const everyone = peers().every((p) => p === myId || syncing.has(p));
    const body = sender.next(
      { seats: m.seats, rules: m.rules, moves: m.moves, watchers: book.list() },
      { full: full || !everyone },
    );
    if (body) mesh.broadcast({ t: body.k === SYNC.DELTA ? GMSG.DELTA : GMSG.LOG, ...body });
  }

  
  function sendFullTo(peer, extra = {}) {
    if (!mesh || !hosting || !peer) return;
    sendMatch();
    const body = sender.current();
    if (body) mesh.send(peer, { t: GMSG.LOG, ...body, ...extra });
  }

  function wire() {
    exchangeCards(mesh, 'gomoku');
    mesh.addEventListener('open', (e) => {
      myId = e.detail.id;
      onPeers(peers(), myId);
      say(hosting ? 'open' : 'joining');
    });
    mesh.addEventListener('peer-joined', (e) => {
      const who = e.detail?.peerId ?? e.detail?.id;
      onPeers(peers(), myId);
      
      
      if (hosting && who) book.arrived(who);
      
      
      if (!hosting && who) mesh.send(who, hello());
      
      
      if (hosting) sendMatch({ full: true });
      else say('joined');
    });
    mesh.addEventListener('peer-left', (e) => {
      const who = e.detail?.peerId ?? e.detail?.id;
      if (who) { book.left(who); syncing.delete(who); }
      onPeers(peers(), myId);
      say('left');
    });
    mesh.addEventListener('message', (e) => {
      const { message, from } = e.detail;
      if (!message || typeof message !== 'object') return;
      if (message.t === GMSG.HELLO) {
        
        const who = from || (typeof message.by === 'string' ? message.by : null);
        if (who && Number(message.sync) >= SYNC_VERSION) syncing.add(who);
        if (who) book.hello(who, roleOf(message));
        
        if (hosting) sendMatch();
        onPeers(peers(), myId);
        return;
      }
      if (message.t === GMSG.LOG || message.t === GMSG.DELTA) {
        
        
        
        if (hosting) return;
        const got = receiver.take(message, from);
        if (got.kind === 'need') { mesh.send(from, { t: GMSG.NEED, by: myId }); return; }
        if (got.kind !== 'full' && got.kind !== 'append') return;
        book.adopt(sanitiseWatchers(got.value.watchers));
        onMatch(sanitiseMatch(got.value), { nack: message.nack === true });
        return;
      }
      if (message.t === GMSG.NEED) {
        
        if (hosting) sendFullTo(from);
        return;
      }
      if (message.t === GMSG.ACT) {
        if (!hosting) return;
        
        if (book.isWatcher(from) || book.isWatcher(message.by)) return;
        onProposal({ ...message.action, by: message.by }, from);
      }
    });
    mesh.addEventListener('host-changed', (e) => {
      hosting = !!e.detail.iAmHost;
      
      sender.reset();
      receiver.reset();
      say('host');
      onPeers(peers(), myId);
      if (hosting) sendMatch({ full: true });
    });
    mesh.addEventListener('join-failed', (e) => say('failed', e.detail?.reason ?? ''));
    mesh.addEventListener('error', (e) => {
      const message = e.detail?.message ?? 'unknown';
      if (/unavailable-id/.test(message)) return; 
      say('trouble', message);
    });
  }

  return {
    get id() { return myId; },
    get hosting() { return hosting; },
    get active() { return !!mesh; },
    
    get watching() { return myRole === ROLE.WATCH; },
    
    get watchers() { return book.count; },
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
      mesh.broadcast({ t: GMSG.ACT, action, by: myId });
    },

    
    publish: () => sendMatch(),

    
    refuse: (peer) => sendFullTo(peer, { nack: true }),

    leave() {
      try { mesh?.destroy(); } catch {  }
      mesh = null;
      myId = null;
      hosting = false;
      myRole = ROLE.PLAY;
      book.reset();
      sender.reset();
      receiver.reset();
      syncing.clear();
      onPeers([], null);
      say('left');
    },
  };
}


export const canPlayTogether = () => typeof window !== 'undefined'
  && !!window.Peer
  && typeof RTCPeerConnection !== 'undefined';
