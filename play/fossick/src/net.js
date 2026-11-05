








import { PeerMesh } from '../../../web-engine/net/peerMesh.js';
import { roomCode, normaliseCode, GAME_PREFIX } from '../../../web-engine/words/coop.js';
import { createRoster, sanitiseRoom, sanitiseStatus } from './roomRoster.js';

const MY_PREFIX = GAME_PREFIX.fossick;
const CODE_TRIES = 5;
export const REPORT_MS = 2000;

const FULL_FLUSH_MS = 500;
const MSG = Object.freeze({ STATUS: 'fos-status', ROOM: 'fos-room', FULL: 'fos-full' });









export function createRoomNet({ status, isLevel, onRoom, onStatus, now = () => performance.now() }) {
  let mesh = null;
  let hosting = false;
  let closed = false;
  let code = null;
  let hostId = null;
  let round = null;
  let roster = createRoster();
  let timer = null;

  const say = (kind, detail) => { try { onStatus(kind, detail); } catch {  } };
  const roundN = () => round?.n ?? 0;
  const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };

  
  function publish() {
    if (!mesh || !hosting) return;
    const t = now();
    const rows = roster.wire(roundN(), t);
    for (const id of roster.ids()) {
      if (id !== mesh.myId) mesh.send(id, { t: MSG.ROOM, you: roster.seatOf(id), round, rows });
    }
    const mine = sanitiseRoom({ you: roster.seatOf(mesh.myId), round, rows }, isLevel);
    if (mine) onRoom(mine);
  }

  function report() {
    if (!mesh || closed) return;
    if (hosting) {
      roster.update(mesh.myId, status(), now());
      publish();
    } else if (hostId) {
      mesh.send(hostId, { t: MSG.STATUS, status: status() });
    }
  }

  function wireHost(mine) {
    mine.addEventListener('open', (e) => {
      if (mesh !== mine) return;
      mine.host();
      code = e.detail.id;
      roster.add(code, now());
      timer = setInterval(report, REPORT_MS);
      say('open');
      report();
    }, { once: true });
    mine.addEventListener('peer-joined', (e) => {
      const id = e.detail.id;
      if (roster.add(id, now()) === null) {
        mine.send(id, { t: MSG.FULL });
        setTimeout(() => {
          try { mine.connections.get(id)?.close(); } catch {  }
        }, FULL_FLUSH_MS);
        return;
      }
      publish();
    });
    mine.addEventListener('peer-left', (e) => {
      if (roster.remove(e.detail.id)) publish();
    });
    mine.addEventListener('message', (e) => {
      const { from, message } = e.detail;
      if (message?.t !== MSG.STATUS) return;
      
      if (roster.update(from, message.status, now())) {
        const s = sanitiseStatus(message.status);
        if (s.state !== 'dig' && s.state !== 'wait') publish();
      }
    });
  }

  function wireGuest(mine) {
    mine.addEventListener('open', () => {
      if (mesh !== mine) return;
      mine.connectTo(hostId);
    }, { once: true });
    mine.addEventListener('peer-joined', () => {
      if (mesh !== mine) return;
      say('joined');
      report();
      if (!timer) timer = setInterval(report, REPORT_MS);
    });
    mine.addEventListener('message', (e) => {
      const { from, message } = e.detail;
      if (from !== hostId || closed) return;
      if (message?.t === MSG.FULL) {
        say('full');
        return;
      }
      if (message?.t !== MSG.ROOM) return;
      const room = sanitiseRoom(message, isLevel);
      if (room) { round = room.round; onRoom(room); }
    });
    
    mine.addEventListener('host-changed', () => {
      if (mesh !== mine || closed) return;
      closed = true;
      stopTimer();
      say('closed');
    });
    mine.addEventListener('join-failed', () => { if (mesh === mine) say('failed'); });
  }

  function open(mine) {
    mesh = mine;
    closed = false;
    round = null;
    roster = createRoster();
    mine.addEventListener('error', (e) => {
      if (mesh !== mine) return;
      const message = e.detail?.message ?? '';
      
      if (/unavailable-id/.test(message)) return;
      if (!hosting && !closed && /peer-unavailable/.test(message)) { say('failed'); return; }
      say('trouble', message);
    });
  }

  return {
    get code() { return code; },
    get hosting() { return hosting; },
    get active() { return !!mesh; },
    get closed() { return closed; },
    get round() { return round; },
    
    get channels() { return mesh ? mesh.connections.size : 0; },

    
    host(attempt = 0) {
      if (mesh) return;
      const hint = attempt < CODE_TRIES ? roomCode(Math.random, MY_PREFIX) : null;
      const mine = new PeerMesh({ hostIdHint: hint ?? undefined, star: true });
      hosting = true;
      code = null;
      open(mine);
      wireHost(mine);
      mine.addEventListener('error', (e) => {
        if (mesh !== mine || !/unavailable-id/.test(e.detail?.message ?? '')) return;
        try { mine.destroy(); } catch {  }
        mesh = null;
        this.host(attempt + 1);
      });
      if (attempt === 0) say('opening');
    },

    
    join(typed) {
      const id = normaliseCode(typed, MY_PREFIX);
      if (!id) return { error: 'code' };
      if (mesh) return {};
      hosting = false;
      code = id;
      hostId = id;
      const mine = new PeerMesh({ star: true });
      open(mine);
      wireGuest(mine);
      say('joining');
      return {};
    },

    
    startRound(level) {
      if (!mesh || !hosting || !isLevel(level)) return;
      round = { n: roundN() + 1, level };
      report();
    },

    
    report,

    leave() {
      stopTimer();
      try { mesh?.destroy(); } catch {  }
      mesh = null;
      hosting = false;
      closed = false;
      code = null;
      hostId = null;
      round = null;
    },
  };
}


export const canPlayTogether = () => typeof window !== 'undefined' && !!window.Peer;
