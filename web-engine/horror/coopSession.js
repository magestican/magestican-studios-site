






























import {
  COOP, createCoop, assignSeat, releaseSeat, promoteWaiting, setPhase as setCoopPhase,
  seatOf, isSeated, isDown, seated,
  liftDeparture, downPlayer, stepDowned, stepRevive, runOver,
} from './coop.js';
import {
  MSG, HOST_ONLY, STATE_MS, CREATURE_MS, CHECKSUM_MS,
  helloMsg, seatMsg, stateMsg, shotMsg, hitMsg, grabMsg, freeMsg, creMsg, entMsg, liftMsg,
  downMsg, reviveMsg, beatMsg, overMsg, syncMsg, sumMsg, resyncMsg,
  isForeign, createWorld, applyState, dropBody, applyCreatures, applyGrab, applyFree, applySync,
  adoptSeats, rosterChecksum, checkSum, bodyAt,
} from './coopWire.js';







export const REVIVE_GRACE_MS = 500;



























export function createCoopSession({
  id, role = 'joiner', transport, hostId = null,
  name = '', wants = 'seat', build = '',
  level = 1, seed = null,
  host = null, on = {},
}) {
  if (!id) throw new Error('a session needs its peer id');
  if (!transport || typeof transport.broadcast !== 'function') throw new Error('a session needs a transport');
  const isHost = role === 'host';
  let coop = isHost ? createCoop({ hostId: id, level, seed }) : createCoop({ level, seed });
  let world = createWorld();
  let latchedBy = null;
  let nextState = 0;
  let nextCre = 0;
  let nextSum = 0;
  let pressesPending = 0;
  let liftOpenedAt = null;
  let liftPhase = null;
  let lastNow = 0;
  const reviveGraceUntil = {};
  const sent = { messages: 0, bytes: 0 };

  const emit = (name, ...args) => { try { on[name]?.(...args); } catch {  } };

  function out(msg) {
    sent.messages += 1;
    sent.bytes += JSON.stringify(msg).length;
    transport.broadcast(msg);
  }
  function outTo(peer, msg) {
    sent.messages += 1;
    sent.bytes += JSON.stringify(msg).length;
    if (typeof transport.send === 'function') transport.send(peer, msg);
    else transport.broadcast(msg);
  }

  const hostCreatures = () => (host?.creatures ? host.creatures() : []);

  function seatPacket() {
    return seatMsg({ seats: coop.peers, level: coop.level, seed: coop.seed, phase: coop.phase });
  }

  function syncPacket() {
    return syncMsg({
      level: coop.level,
      seed: coop.seed,
      seats: coop.peers,
      phase: coop.phase,
      creatures: hostCreatures(),
      pickups: host?.pickups ? host.pickups() : [],
      ride: host?.ride ? host.ride() : null,
      down: coop.down,
    });
  }

  function announceOver() {
    if (!coop.over) return;
    out(overMsg({ reason: coop.over.reason, who: coop.over.who, level: coop.over.level }));
    emit('over', { ...coop.over });
  }

  
  function resolve(shot) {
    if (!isHost || !host?.resolveShot) return null;
    const v = host.resolveShot(shot);
    if (!v || !(v.target >= 0)) return null;
    const hit = hitMsg({ target: v.target, limb: v.limb ?? null, dmg: v.dmg ?? 0, by: shot.by, killed: !!v.killed });
    out(hit);
    emit('hit', hit);
    return hit;
  }

  
  function posOf(peerId, nowMs, local) {
    if (peerId === id) return local?.body ?? null;
    return bodyAt(world.bodies[peerId], nowMs);
  }
  function hpOf(peerId, local) {
    if (peerId === id) return local?.body?.hp;
    return world.bodies[peerId]?.hp;
  }

  function hostStep(dt, nowMs, local) {
    const creatures = hostCreatures();
    if (nowMs >= nextCre) {
      creatures.forEach((c, i) => out(creMsg(i, c)));
      nextCre = nowMs + CREATURE_MS;
    }
    if (nowMs >= nextSum) {
      out(sumMsg({ level: coop.level, n: rosterChecksum(creatures) }));
      nextSum = nowMs + CHECKSUM_MS;
    }
    if (coop.phase !== 'deck' && coop.phase !== 'lift') return;

    
    for (const p of seated(coop)) {
      const hp = hpOf(p, local);
      if (!(hp <= 0) || isDown(coop, p)) continue;
      if ((reviveGraceUntil[p] ?? 0) > nowMs) continue;
      coop = downPlayer(coop, p);
      if (coop.phase === 'over') { announceOver(); return; }
      out(downMsg({ who: p }));
      emit('down', { who: p });
    }

    coop = stepDowned(coop, dt);
    if (coop.phase === 'over') { announceOver(); return; }

    
    for (const who of Object.keys(coop.down)) {
      const by = seated(coop).find((p) => p !== who && !isDown(coop, p));
      if (!by) continue;
      const a = posOf(who, nowMs, local);
      const b = posOf(by, nowMs, local);
      if (!a || !b) continue;
      const dist = Math.hypot(a.x - b.x, a.z - b.z);
      let holding = false;
      let presses = 0;
      if (by === id) {
        holding = !!local?.holdE;
        presses = local?.presses ?? 0;
      } else {
        const body = world.bodies[by];
        holding = !!body?.flags?.holdE;
        presses = body?.presses ?? 0;
        
        if (body && presses) world = { ...world, bodies: { ...world.bodies, [by]: { ...body, presses: 0 } } };
      }
      const r = stepRevive(coop, dt, { who, by, dist, holding, presses });
      coop = r.coop;
      if (r.revived) {
        reviveGraceUntil[who] = nowMs + REVIVE_GRACE_MS;
        out(reviveMsg({ who, hp: r.revived.hp }));
        emit('revive', { ...r.revived });
      } else if (dist <= COOP.reviveReach) {
        emit('reviveProgress', { who, by, progress: r.progress });
      }
    }
  }

  function receive(msg, from) {
    if (isForeign(msg)) { emit('foreign', msg, from); return false; }
    if (!isHost && hostId && HOST_ONLY.has(msg.t) && from !== hostId) return false;
    switch (msg.t) {
      case MSG.HELLO: {
        if (!isHost) return false;
        const r = assignSeat(coop, from, msg.wants);
        coop = r.coop;
        out(seatPacket());
        outTo(from, syncPacket());
        emit('hello', msg, from);
        emit('seat', { who: from, seat: r.seat });
        return true;
      }
      case MSG.SEAT: {
        if (isHost) return false;
        coop = adoptSeats(coop, msg);
        emit('seat', { seats: msg.seats, mine: seatOf(coop, id) });
        return true;
      }
      case MSG.STATE: {
        
        if (!isSeated(coop, from)) return false;
        world = applyState(world, msg, from, lastNow);
        emit('state', from);
        return true;
      }
      case MSG.SHOT: {
        emit('shot', msg);
        if (isHost && isSeated(coop, from)) resolve(msg);
        return true;
      }
      case MSG.HIT: if (isHost) return false; emit('hit', msg); return true;
      case MSG.GRAB: {
        world = applyGrab(world, msg);
        if (msg.victim === id) latchedBy = msg.creature;
        emit('grab', msg);
        return true;
      }
      case MSG.FREE: {
        world = applyFree(world, msg);
        if (msg.victim === id) latchedBy = null;
        emit('free', msg);
        return true;
      }
      case MSG.CRE: if (isHost) return false; world = applyCreatures(world, msg); return true;
      case MSG.ENT: emit('ent', msg); return true;
      case MSG.LIFT: {
        liftPhase = msg.phase;
        emit('lift', msg);
        return true;
      }
      case MSG.BEAT: emit('beat', msg); return true;
      case MSG.DOWN: {
        if (isHost) return false;
        coop = { ...coop, down: { ...coop.down, [msg.who]: { left: COOP.downedFor, revive: 0 } } };
        emit('down', { who: msg.who });
        return true;
      }
      case MSG.REVIVE: {
        if (isHost) return false;
        const down = { ...coop.down };
        delete down[msg.who];
        coop = { ...coop, down };
        emit('revive', { who: msg.who, hp: msg.hp });
        return true;
      }
      case MSG.OVER: {
        if (isHost) return false;
        coop = runOver(coop, msg.reason, msg.who);
        emit('over', { ...coop.over });
        return true;
      }
      case MSG.SYNC: {
        if (isHost) return false;
        world = applySync(world, msg);
        coop = adoptSeats(coop, msg);
        emit('sync', msg);
        return true;
      }
      case MSG.SUM: {
        if (isHost) return false;
        
        if (world.level === null) return false;
        const r = checkSum(world, msg);
        if (r.ok) return true;
        
        
        world = { ...world, desync: r };
        emit('desync', r);
        if (hostId) outTo(hostId, resyncMsg()); else out(resyncMsg());
        return true;
      }
      case MSG.RESYNC: {
        if (!isHost) return false;
        outTo(from, syncPacket());
        return true;
      }
      default:
        return false;
    }
  }

  transport.onMessage?.((msg, from) => receive(msg, from));

  const api = {
    get id() { return id; },
    get isHost() { return isHost; },
    get coop() { return coop; },
    get world() { return world; },
    get seat() { return seatOf(coop, id); },
    get seated() { return isSeated(coop, id); },
    get latchedBy() { return latchedBy; },
    get liftPhase() { return liftPhase; },
    get sent() { return { ...sent }; },
    receive,

    
    join() {
      if (isHost) return;
      out(helloMsg({ name, wants, build }));
    },

    





    step(dt, nowMs, local = null) {
      lastNow = nowMs;
      pressesPending += local?.presses ?? 0;
      if (local?.body && isSeated(coop, id) && nowMs >= nextState) {
        out(stateMsg(local.body, { holdE: !!local.holdE, presses: pressesPending }));
        pressesPending = 0;
        nextState = nowMs + STATE_MS;
      }
      if (isHost) hostStep(dt, nowMs, local);
    },

    
    shoot({ from, yaw, wid }) {
      if (!isSeated(coop, id)) return null;
      const msg = shotMsg({ by: id, from, yaw, wid });
      out(msg);
      if (isHost) resolve(msg);
      return msg;
    },

    
    bodyAt(peerId, nowMs) { return bodyAt(world.bodies[peerId], nowMs); },

    
    leave(peerId) {
      world = dropBody(world, peerId);
      if (!isHost) return;
      coop = releaseSeat(coop, peerId);
      out(seatPacket());
    },

    

    
    setPhase(phase, { level: lv, seed: sd } = {}) {
      if (!isHost) return;
      coop = setCoopPhase({ ...coop, level: lv ?? coop.level, seed: sd ?? (lv != null ? lv : coop.seed) }, phase);
      const p = promoteWaiting(coop);
      coop = p.coop;
      out(seatPacket());
      for (const [who, seat] of p.promoted) emit('seat', { who, seat });
    },
    grab(victim, creature) {
      if (!isHost) return;
      const msg = grabMsg({ victim, creature });
      out(msg);
      if (victim === id) latchedBy = creature;
      emit('grab', msg);
    },
    free(victim, creature) {
      if (!isHost) return;
      const msg = freeMsg({ victim, creature });
      out(msg);
      if (victim === id) latchedBy = null;
      emit('free', msg);
    },
    entrance(gate, species) {
      if (!isHost) return;
      const msg = entMsg({ gate, species });
      out(msg);
      emit('ent', msg);
    },
    beat(beatId) {
      if (!isHost) return;
      const msg = beatMsg({ id: beatId });
      out(msg);
      emit('beat', msg);
    },
    
    lift(phase, lv, nowMs) {
      if (!isHost) return;
      liftPhase = phase;
      if (phase === 'boarding') liftOpenedAt = nowMs ?? lastNow;
      if (phase === 'idle' || phase === 'riding') liftOpenedAt = null;
      const msg = liftMsg({ phase, level: lv ?? coop.level });
      out(msg);
      emit('lift', msg);
    },
    
    liftDeparture(inside, nowMs) {
      const openedFor = liftOpenedAt == null ? 0 : Math.max(0, ((nowMs ?? lastNow) - liftOpenedAt) / 1000);
      return liftDeparture(coop, { inside, openedFor });
    },
    liftMayDepart(inside, nowMs) { return api.liftDeparture(inside, nowMs).depart; },
  };
  return api;
}











export function createLoopback({ latencyMs = 0, jitterMs = 0, random = Math.random } = {}) {
  const nodes = [];
  const queue = [];
  const muted = new Set();
  let now = 0;
  let seq = 0;

  function enqueue(from, to, msg) {
    const at = now + latencyMs + (jitterMs ? random() * jitterMs : 0);
    queue.push({ from, to, at, seq: seq++, msg: JSON.parse(JSON.stringify(msg)) });
  }

  return {
    endpoint(id) {
      const handlers = [];
      const node = {
        id,
        handlers,
        broadcast(msg) {
          if (muted.has(id)) return;
          for (const other of nodes) if (other.id !== id) enqueue(id, other.id, msg);
        },
        send(to, msg) {
          if (muted.has(id)) return;
          if (nodes.some((n) => n.id === to)) enqueue(id, to, msg);
        },
        onMessage(fn) { handlers.push(fn); },
      };
      nodes.push(node);
      return node;
    },
    
    deliver(nowMs = now) {
      now = Math.max(now, nowMs);
      const due = queue.filter((q) => q.at <= now).sort((a, b) => (a.at - b.at) || (a.seq - b.seq));
      for (const q of due) queue.splice(queue.indexOf(q), 1);
      for (const { to, from, msg } of due) {
        const node = nodes.find((x) => x.id === to);
        if (node) for (const h of node.handlers) h(msg, from);
      }
      return due.length;
    },
    
    silence(id) {
      muted.add(id);
      for (let i = queue.length - 1; i >= 0; i -= 1) if (queue[i].from === id) queue.splice(i, 1);
    },
    unsilence(id) { muted.delete(id); },
    
    get pending() { return queue.length; },
    get now() { return now; },
  };
}
