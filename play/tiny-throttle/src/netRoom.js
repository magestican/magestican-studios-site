













import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { stickyRoomCode } from '../../../web-engine/net/stickyRoomCode.js';
import { roomCode, normaliseCode, shareLinkFor } from '../../../web-engine/words/coop.js';
import { watchLinkFor, roomFromHref, ROLE as LINK_ROLE } from '../../../web-engine/net/watchers.js';
import { createRoom, joinRoom, leaveRoom, acceptsInput, carOf, serializeRoom, startRace, endRace } from './room.js';
import { unpackInput } from './netSync.js';


export const PREFIX = 'tql-';
const CODE_TRIES = 5;
const stickyCode = stickyRoomCode(PREFIX);
export const MSG = Object.freeze({ HI: 'hi', ROOM: 'room', START: 'start', END: 'end', SNAP: 's', INPUT: 'i', FULL: 'full' });

export const canLink = () => typeof window !== 'undefined' && !!window.Peer && typeof RTCPeerConnection !== 'undefined';

export function linkFrom(href) {
  const r = roomFromHref(href);
  if (!r) return null;
  const code = normaliseCode(r.code, PREFIX);
  return code ? { code, watch: r.role === LINK_ROLE.WATCH } : null;
}
const bare = (href) => href.split('?')[0].split('#')[0];
export const joinLinkFor = (href, code) => shareLinkFor(bare(href), code);
export const watchLinkOf = (href, code) => watchLinkFor(bare(href), code);






export function createHostLink({ name = 'Host', onRoom, onCode, onBot = () => {}, Mesh = PeerMesh, linkable = canLink }) {
  let mesh = null;
  let room = null;
  let started = null; 
  
  const inputs = new Map();
  const share = () => { if (mesh && room) { mesh.broadcast({ t: MSG.ROOM, room: serializeRoom(room) }); onRoom(room); } };

  function wire(mine) {
    mine.addEventListener('open', (e) => {
      if (mesh !== mine) return;
      mine.opened = true;
      mine.host();
      stickyCode.keep(e.detail.id);
      room = createRoom({ hostId: e.detail.id, hostName: name });
      onCode(e.detail.id, 'open');
      onRoom(room);
    }, { once: true });
    mine.addEventListener('message', (e) => {
      if (mesh !== mine || !room) return;
      const { from, message } = e.detail;
      if (Array.isArray(message)) {
        
        if (message[0] === MSG.INPUT && acceptsInput(room, from)) {
          const input = unpackInput(message);
          if (input) inputs.set(carOf(room, from), input);
        }
        return;
      }
      if (message?.t === MSG.HI) {
        const got = joinRoom(room, { peerId: from, name: message.name, watch: !!message.watch });
        if (!got) { mine.send(from, { t: MSG.FULL }); return; }
        share();
        if (started) mine.send(from, started);
      }
    });
    mine.addEventListener('peer-left', (e) => {
      if (mesh !== mine || !room) return;
      const { botTakes } = leaveRoom(room, e.detail.id);
      if (botTakes) { inputs.delete(botTakes); onBot(botTakes); }
      share();
    });
    mine.addEventListener('error', (e) => {
      if (mesh !== mine) return;
      const m = e.detail?.message ?? 'unknown';
      if (/unavailable-id/.test(m) || mine.opened) return; 
      onCode(null, `trouble: ${m}`);
    });
  }

  return {
    inputs,
    get room() { return room; },
    get active() { return !!mesh; },
    get code() { return room?.hostId ?? null; },
    host(attempt = 0) {
      if (mesh || !linkable()) return;
      const hint = stickyCode.hint(attempt, () => roomCode(Math.random, PREFIX), CODE_TRIES);
      const mine = new Mesh({ hostIdHint: hint ?? undefined, star: true });
      mesh = mine;
      wire(mine);
      mine.addEventListener('error', (e) => {
        if (!/unavailable-id/.test(e.detail?.message ?? '') || mesh !== mine || mine.opened) return;
        try { mine.destroy(); } catch {  }
        mesh = null;
        stickyCode.retry(attempt, () => this.host(attempt + 1));
      });
      if (attempt === 0) onCode(null, 'opening');
    },
    
    newCode() { stickyCode.forget(); this.leave(); this.host(0); },
    leave() {
      stickyCode.cancel();
      try { mesh?.destroy(); } catch {  }
      mesh = null;
      room = null;
      started = null;
      inputs.clear();
    },
    
    start({ track, laps, seed }) {
      if (!room) return null;
      inputs.clear();
      const grid = startRace(room);
      started = { t: MSG.START, track, laps, seed, grid };
      mesh.broadcast(started);
      share();
      return grid;
    },
    
    end() {
      if (!room) return [];
      started = null;
      const promoted = endRace(room);
      mesh.broadcast({ t: MSG.END });
      share();
      return promoted;
    },
    snap(snapshot) { if (mesh && started) mesh.broadcast(snapshot); },
  };
}







export function createGuestLink(code, { name = '', watch = false, onRoom, onStart, onSnap, onEnd = () => {}, onState, Mesh = PeerMesh }) {
  const mesh = new Mesh({ star: true });
  let joined = false;
  mesh.addEventListener('open', () => { mesh.connectTo(code); onState('joining'); }, { once: true });
  mesh.addEventListener('peer-joined', (e) => {
    if (e.detail?.id !== code) return;
    joined = true;
    mesh.send(code, { t: MSG.HI, name, watch });
    onState('joined');
  });
  mesh.addEventListener('message', (e) => {
    const { from, message } = e.detail;
    if (from !== code || !message) return;
    if (message.t === MSG.SNAP) onSnap(message);
    else if (message.t === MSG.ROOM) onRoom(message.room, mesh.myId);
    else if (message.t === MSG.START) onStart(message);
    else if (message.t === MSG.END) onEnd();
    else if (message.t === MSG.FULL) onState('full');
  });
  mesh.addEventListener('peer-left', (e) => { if (e.detail?.id === code) onState('closed'); });
  mesh.addEventListener('host-changed', () => onState('closed'));
  mesh.addEventListener('join-failed', () => onState('failed'));
  mesh.addEventListener('error', (e) => { if (!joined) onState(`failed: ${e.detail?.message ?? ''}`); });
  return {
    get myId() { return mesh.myId; },
    sendInput(frame) { if (joined) mesh.send(code, frame); },
    leave() { try { mesh.destroy(); } catch {  } },
  };
}
