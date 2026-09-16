
























































import { makeSave, readSave } from '../economy/save.mjs';
import { NAMES_OF_BUILD, ITALIAN_NAMES } from './people.mjs';
import { whyGuestCannot } from './visiting.mjs';









export const GAME_ID = 'fml';


export const ROOM_PREFIX = 'fml';










export const CODE_ALPHABET = 'ACDEFGHJKMNPRTUVWXY34679';
export const CODE_BODY_LENGTH = 6;

export const MSG = Object.freeze({
  HELLO: 'hello',         
  WELCOME: 'welcome',     
  REFUSED: 'refused',     
  SNAPSHOT: 'snapshot',   
  BODY: 'body',           
  WHERE: 'where',         
  RESULT: 'result',       
  ASK: 'ask',             
  BYE: 'bye',             
});











export const HOST_ONLY = Object.freeze([MSG.WELCOME, MSG.REFUSED, MSG.SNAPSHOT, MSG.WHERE, MSG.RESULT]);

export const RATES = Object.freeze({
  







  bodyMs: 100,
  







  beatMs: 30_000,
});


export const KNOCK_TIMEOUT_MS = 120_000;

const clamp = (s, n) => String(s ?? '').slice(0, n);

const NAME_MAX = 16;

const isObj = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);









export function roomCode(n) {
  let x = Math.abs(Math.trunc(Number(n) || 0));
  let out = '';
  for (let i = 0; i < CODE_BODY_LENGTH; i += 1) {
    out += CODE_ALPHABET[x % CODE_ALPHABET.length];
    x = Math.floor(x / CODE_ALPHABET.length) + 7;
  }
  return `${ROOM_PREFIX}-${out}`;
}


export function isRoomCode(code) {
  const re = new RegExp(`^${ROOM_PREFIX}-[${CODE_ALPHABET}]{${CODE_BODY_LENGTH}}$`);
  return typeof code === 'string' && re.test(code);
}










export function visitorName(peerId, build = null) {
  const list = NAMES_OF_BUILD[build] || ITALIAN_NAMES;
  let h = 2166136261;
  for (const ch of String(peerId ?? '')) {
    h = (h ^ ch.charCodeAt(0)) * 16777619 >>> 0;
  }
  return list[h % list.length];
}

const emptyBody = () => ({ x: 0, z: 0, heading: 0, speed: 0, state: 'idle' });


function bodyDoc(b) {
  const n = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v) * 1000) / 1000 : 0);
  return {
    x: n(b?.x), z: n(b?.z), heading: n(b?.heading), speed: n(b?.speed),
    state: clamp(b?.state || 'idle', 12),
  };
}

























export function createSession({
  id, role, transport, hostId = null, name = null, build = null, code = null,
  host = null, guest = null, on = {},
} = {}) {
  if (!id) throw new Error('a session needs this peer id');
  if (role !== 'host' && role !== 'guest') throw new Error(`role must be host or guest, got ${JSON.stringify(role)}`);
  if (!transport || typeof transport.broadcast !== 'function') throw new Error('a session needs a transport');
  if (role === 'host' && (!host || typeof host.act !== 'function' || typeof host.snapshot !== 'function')) {
    throw new Error('a host session needs host.act and host.snapshot');
  }

  const isHost = role === 'host';
  const myName = clamp(name || visitorName(id, build), NAME_MAX);
  const fire = (what, arg) => { try { on[what]?.(arg); } catch (e) { on.problem?.(String(e?.message || e)); } };

  const s = {
    id,
    role,
    name: myName,
    build: build || null,
    code: code || null,
    hostId: isHost ? id : hostId,
    
    knocks: [],
    
    others: [],
    




    world: null,
    
    planet: 0,
    



    canTravel: isHost,
    
    lastRefusal: null,
    
    stats: {
      knocks: 0, admitted: 0, refused: 0, asks: 0, allowed: 0, denied: 0,
      snapshots: 0, bodies: 0, foreign: 0, forged: 0,
    },
    left: false,
  };

  let nextAsk = 1;
  const pendingAsks = new Map();     
  let lastBodyAt = -Infinity;
  let lastBeatAt = -Infinity;
  let lastPlanetSent = null;
  
  
  
  
  
  
  let lastStepAt = 0;

  const other = (peerId) => s.others.find((p) => p.id === peerId) || null;

  function addOther(peerId, who) {
    let p = other(peerId);
    if (!p) {
      p = { id: peerId, name: clamp(who?.name || visitorName(peerId, who?.build), NAME_MAX), build: who?.build || null, body: emptyBody(), role: who?.role || 'guest' };
      s.others.push(p);
      fire('arrived', p);
    }
    return p;
  }

  function dropOther(peerId) {
    const at = s.others.findIndex((p) => p.id === peerId);
    if (at < 0) return null;
    const [gone] = s.others.splice(at, 1);
    fire('left', gone);
    return gone;
  }

  const wrap = (t, fields) => ({ g: GAME_ID, t, ...fields });

  
  function sendSnapshot(to = null) {
    if (!isHost) return;
    let doc;
    try {
      doc = makeSave(host.snapshot());
    } catch (e) {
      fire('problem', `the world could not be packed for a guest: ${e?.message || e}`);
      return;
    }
    const msg = wrap(MSG.SNAPSHOT, { doc, planet: host.planet ? host.planet() : s.planet });
    if (to) transport.send?.(to, msg); else transport.broadcast(msg);
    s.stats.snapshots += 1;
    lastBeatAt = lastStepAt;
  }

  

  function receive(msg, from) {
    if (s.left) return;
    
    
    
    if (!isObj(msg) || msg.g !== GAME_ID || typeof msg.t !== 'string') {
      s.stats.foreign += 1;
      return;
    }
    
    
    
    if (HOST_ONLY.includes(msg.t) && s.hostId && from !== s.hostId) {
      s.stats.forged += 1;
      fire('problem', `${msg.t} from ${from}, who is not the host`);
      return;
    }
    if (isHost) receiveAsHost(msg, from);
    else receiveAsGuest(msg, from);
  }

  function receiveAsHost(msg, from) {
    switch (msg.t) {
      case MSG.HELLO: {
        
        
        if (other(from)) { sendSnapshot(from); return; }
        if (s.knocks.some((k) => k.id === from)) return;
        const knock = {
          id: from,
          name: clamp(msg.name || visitorName(from, msg.build), NAME_MAX),
          build: msg.build || null,
          at: Number(msg.at) || 0,
        };
        s.knocks.push(knock);
        s.stats.knocks += 1;
        fire('knock', knock);
        return;
      }
      case MSG.ASK: {
        const p = other(from);
        
        
        
        
        if (!p) {
          transport.send?.(from, wrap(MSG.RESULT, { n: msg.n, ok: false, why: 'You are not on this moon.' }));
          return;
        }
        s.stats.asks += 1;
        const action = isObj(msg.action) ? msg.action : null;
        const why = action ? whyGuestCannot(action.type) : 'That is not an action.';
        if (why) {
          s.stats.denied += 1;
          transport.send?.(from, wrap(MSG.RESULT, { n: msg.n, ok: false, why }));
          fire('asked', { from, action, ok: false, why });
          return;
        }
        
        
        
        const out = host.act(action) || {};
        const ok = !out.error;
        if (ok) s.stats.allowed += 1; else s.stats.denied += 1;
        transport.send?.(from, wrap(MSG.RESULT, { n: msg.n, ok, why: out.error || null, events: out.events || [] }));
        
        
        if (ok) sendSnapshot();
        fire('asked', { from, action, ok, why: out.error || null });
        return;
      }
      case MSG.BODY: {
        const p = other(from);
        if (!p) return;
        p.body = bodyDoc(msg.body);
        s.stats.bodies += 1;
        return;
      }
      case MSG.BYE:
        dropOther(from);
        s.knocks = s.knocks.filter((k) => k.id !== from);
        return;
      default:
        return;
    }
  }

  function receiveAsGuest(msg, from) {
    switch (msg.t) {
      case MSG.WELCOME: {
        const p = addOther(from, { name: msg.name, build: msg.build, role: 'host' });
        p.role = 'host';
        s.code = msg.code || s.code;
        if (Number.isInteger(msg.planet)) s.planet = msg.planet;
        fire('approved', { host: p, planet: s.planet, code: s.code });
        return;
      }
      case MSG.REFUSED:
        fire('refused', { why: clamp(msg.why, 160) || 'Not this time.' });
        return;
      case MSG.SNAPSHOT: {
        
        
        
        
        const read = readSave(msg.doc);
        if (!read.ok) {
          fire('problem', `the world the host sent could not be read - ${read.reason}`);
          return;
        }
        s.world = read.doc;
        s.stats.snapshots += 1;
        if (Number.isInteger(msg.planet) && msg.planet !== s.planet) {
          s.planet = msg.planet;
          fire('where', s.planet);
        }
        fire('world', read.doc);
        return;
      }
      case MSG.WHERE:
        if (!Number.isInteger(msg.planet) || msg.planet === s.planet) return;
        s.planet = msg.planet;
        fire('where', s.planet);
        return;
      case MSG.RESULT: {
        const action = pendingAsks.get(msg.n) || null;
        pendingAsks.delete(msg.n);
        const r = { n: msg.n, action, ok: !!msg.ok, why: msg.why || null, events: Array.isArray(msg.events) ? msg.events : [] };
        if (!r.ok) s.lastRefusal = r.why;
        fire('result', r);
        return;
      }
      case MSG.BODY: {
        const p = addOther(from, { name: msg.name, build: msg.build, role: from === s.hostId ? 'host' : 'guest' });
        p.body = bodyDoc(msg.body);
        s.stats.bodies += 1;
        return;
      }
      case MSG.BYE:
        dropOther(from);
        return;
      default:
        return;
    }
  }

  transport.onMessage?.((msg, from) => receive(msg, from));

  

  
  s.approve = (peerId, now = 0) => {
    if (!isHost) throw new Error('only a host approves a visitor');
    const at = s.knocks.findIndex((k) => k.id === peerId);
    if (at < 0) return false;
    const [k] = s.knocks.splice(at, 1);
    const p = addOther(k.id, { name: k.name, build: k.build, role: 'guest' });
    p.admittedAt = now;
    s.stats.admitted += 1;
    lastStepAt = now;
    transport.send?.(k.id, wrap(MSG.WELCOME, {
      name: s.name, build: s.build, code: s.code, planet: host.planet ? host.planet() : s.planet,
    }));
    sendSnapshot(k.id);
    return true;
  };

  
  s.refuse = (peerId, why = 'Not just now.') => {
    if (!isHost) throw new Error('only a host refuses a visitor');
    const at = s.knocks.findIndex((k) => k.id === peerId);
    if (at < 0) return false;
    s.knocks.splice(at, 1);
    s.stats.refused += 1;
    transport.send?.(peerId, wrap(MSG.REFUSED, { why: clamp(why, 160) }));
    return true;
  };

  
  s.evict = (peerId, why = 'The visit is over.') => {
    if (!isHost) throw new Error('only a host evicts a visitor');
    if (!dropOther(peerId)) return false;
    transport.send?.(peerId, wrap(MSG.REFUSED, { why: clamp(why, 160) }));
    return true;
  };

  

  









  s.ask = (action, now = 0) => {
    if (isHost) throw new Error('a host does not ask; it acts');
    if (!isObj(action) || typeof action.type !== 'string') throw new Error('ask needs an action');
    const why = whyGuestCannot(action.type);
    if (why) {
      s.lastRefusal = why;
      s.stats.denied += 1;
      fire('result', { n: null, action, ok: false, why, events: [] });
      return null;
    }
    const n = nextAsk++;
    pendingAsks.set(n, action);
    s.stats.asks += 1;
    transport.send?.(s.hostId, wrap(MSG.ASK, { n, action, at: now }));
    return n;
  };

  
  s.hello = (now = 0) => {
    if (isHost) return false;
    transport.send?.(s.hostId, wrap(MSG.HELLO, { name: s.name, build: s.build, at: now }));
    return true;
  };

  

  






  s.step = (now = 0) => {
    if (s.left) return;
    lastStepAt = now;
    if (isHost) {
      const at = host.planet ? host.planet() : s.planet;
      s.planet = at;
      if (at !== lastPlanetSent) {
        lastPlanetSent = at;
        
        
        
        
        if (s.others.length) transport.broadcast(wrap(MSG.WHERE, { planet: at }));
      }
      const before = s.knocks.length;
      
      
      
      
      
      s.knocks = s.knocks.filter((k) => !(Number.isFinite(k.at) && now - k.at > KNOCK_TIMEOUT_MS));
      if (s.knocks.length !== before) fire('knock', null);
      if (s.others.length && now - lastBeatAt >= RATES.beatMs) {
        lastBeatAt = now;
        sendSnapshot();
      }
    }
    if (now - lastBodyAt >= RATES.bodyMs) {
      lastBodyAt = now;
      const b = isHost ? host.body?.() : guest?.body?.();
      if (b && s.others.length) {
        transport.broadcast(wrap(MSG.BODY, { body: bodyDoc(b), name: s.name, build: s.build }));
      }
    }
  };

  

  s.leave = () => {
    if (s.left) return;
    s.left = true;
    transport.broadcast(wrap(MSG.BYE, {}));
    s.others = [];
    s.knocks = [];
  };

  
  s.peerGone = (peerId) => {
    s.knocks = s.knocks.filter((k) => k.id !== peerId);
    return dropOther(peerId);
  };

  return s;
}








export function whoIsHere(session) {
  if (!session) return '';
  const names = (session.others || []).map((p) => p.name);
  if (!names.length) return session.role === 'host' ? 'Nobody has come by yet.' : 'On your way.';
  if (session.role === 'guest') return `You are visiting ${names[0]}.`;
  if (names.length === 1) return `${names[0]} is visiting.`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are visiting.`;
}
