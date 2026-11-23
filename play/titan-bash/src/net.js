






import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { stickyRoomCode } from '../../../web-engine/net/stickyRoomCode.js';
import { roomCode, normaliseCode, shareLinkFor } from '../../../web-engine/words/coop.js';
import { MSG, createPhoneSeats } from './wire.js';



export const PREFIX = 'tbs-';
const CODE_TRIES = 5;
const stickyCode = stickyRoomCode(PREFIX);

export const canLink = () => typeof window !== 'undefined' && !!window.Peer && typeof RTCPeerConnection !== 'undefined';
export const joinCodeFrom = (search) => normaliseCode(new URLSearchParams(search || '').get('join') || '', PREFIX);
export const linkFor = (code) => shareLinkFor(location.href.split('?')[0], code);





export function createScreenLink({ onSeats, onCode, seatInfo, onPick = () => {}, onStart = () => {} }) {
  const phones = createPhoneSeats();
  let mesh = null;
  let sweepTimer = null;
  const now = () => performance.now();

  function wire(mine) {
    mine.addEventListener('open', (e) => {
      if (mesh !== mine) return;
      mine.host();
      stickyCode.keep(e.detail.id);
      onCode(e.detail.id, 'open');
    }, { once: true });
    mine.addEventListener('message', (e) => {
      if (mesh !== mine) return;
      const { from, message } = e.detail;
      if (Array.isArray(message)) {
        if (message[0] === MSG.INPUT) phones.inputRaw(from, message, now());
        return;
      }
      if (message?.t === MSG.HELLO) {
        const client = typeof message.client === 'string' ? message.client.slice(0, 40) : from;
        const seat = phones.hello(from, client, now());
        if (!seat) { mine.send(from, { t: MSG.FULL }); return; }
        mine.send(from, { t: MSG.SEAT, control: seat.control, ...(seatInfo(seat.control) || {}) });
        onSeats(phones.list());
        return;
      }
      const seat = phones.byPeer(from);
      if (!seat) return;
      if (message?.t === MSG.PICK) onPick(seat.control, message);
      else if (message?.t === MSG.START) onStart(seat.control);
    });
    mine.addEventListener('peer-left', (e) => { if (mesh === mine) { phones.gone(e.detail.id, now()); onSeats(phones.list()); } });
    mine.addEventListener('error', (e) => {
      const m = e.detail?.message ?? 'unknown';
      if (/unavailable-id/.test(m)) return; 
      onCode(null, `trouble: ${m}`);
    });
  }

  return {
    phones,
    get active() { return !!mesh; },
    host(attempt = 0) {
      if (mesh || !canLink()) return;
      const hint = stickyCode.hint(attempt, () => roomCode(Math.random, PREFIX), CODE_TRIES);
      const mine = new PeerMesh({ hostIdHint: hint ?? undefined, star: true });
      mesh = mine;
      wire(mine);
      mine.addEventListener('error', (e) => {
        if (!/unavailable-id/.test(e.detail?.message ?? '') || mesh !== mine) return;
        try { mine.destroy(); } catch {  }
        mesh = null;
        stickyCode.retry(attempt, () => this.host(attempt + 1));
      });
      if (attempt === 0) onCode(null, 'opening');
      clearInterval(sweepTimer);
      sweepTimer = setInterval(() => { if (phones.sweep(now()).length) onSeats(phones.list()); }, 1000);
    },
    
    newCode() { stickyCode.forget(); this.leave(); this.host(0); },
    leave() {
      stickyCode.cancel();
      clearInterval(sweepTimer);
      try { mesh?.destroy(); } catch {  }
      mesh = null;
    },
    send(control, msg) {
      const s = phones.list().find((x) => x.control === control);
      if (mesh && s?.peer) mesh.send(s.peer, msg);
    },
  };
}


export function createPhoneLink(code, { onSeat, onStatus, onEvent, onState, onReward = () => {} }) {
  let client = null;
  try { client = localStorage.getItem('titanBash.client'); } catch {  }
  if (!client) {
    client = Math.random().toString(36).slice(2, 12);
    try { localStorage.setItem('titanBash.client', client); } catch {  }
  }
  const mesh = new PeerMesh({ star: true });
  let joined = false;
  mesh.addEventListener('open', () => { mesh.connectTo(code); onState('joining'); }, { once: true });
  mesh.addEventListener('peer-joined', () => { joined = true; mesh.send(code, { t: MSG.HELLO, client }); });
  mesh.addEventListener('message', (e) => {
    const { from, message } = e.detail;
    if (from !== code) return;
    if (Array.isArray(message)) {
      if (message[0] === MSG.STATUS) onStatus(message);
      else if (message[0] === MSG.EVENT) onEvent(message[1]);
      return;
    }
    if (message?.t === MSG.SEAT) onSeat(message);
    else if (message?.t === MSG.REWARD) onReward(message);
    else if (message?.t === MSG.FULL) onState('full');
  });
  mesh.addEventListener('host-changed', () => onState('closed'));
  mesh.addEventListener('join-failed', () => onState('failed'));
  mesh.addEventListener('error', (e) => { if (!joined) onState(`failed: ${e.detail?.message ?? ''}`); });
  return {
    send(frame) { if (joined) mesh.send(code, frame); },
    leave() { try { mesh.destroy(); } catch {  } },
  };
}
