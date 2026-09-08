




































import {
  COOP, seatOf, isSeated, isObserver, seated, isDown,
  spawnFor, directorBudget, creatureDamageFor, CHARACTERS,
} from '../../../web-engine/horror/coop.js';
import { createCoopSession, createLoopback } from '../../../web-engine/horror/coopSession.js';
import { bodyAt, pickTarget, stateName } from '../../../web-engine/horror/coopWire.js';
import { resolveHit, applyDamage, statusOf } from '../../../web-engine/horror/dismemberment.js';
import { WEAPONS } from '../../../web-engine/horror/weapons.js';
import { createNet, fehPresence, joinCodeInUrl } from './net.js';
import { spokenFehCode } from '../../../web-engine/horror/coopCode.js';















export const LATCH_GRACE_MS = 800;

const factsOf = (b, i) => ({
  kind: b.kind,
  x: b.x,
  z: b.z,
  alive: !!b.alive,
  latched: b.latched ? (b.latchTo || null) : null,
  state: b.anim?.state ?? 'dormant',
  severed: b.creature ? statusOf(b.creature).severedLimbs : [],
  i,
});




export function createCoopRuntime(ctx) {
  let net = null;
  let session = null;
  let presence = null;
  
  let mode = 'off';
  let status = '';
  let code = null;
  let wants = 'seat';
  let lastNow = 0;
  
  const drawn = {};
  
  const puppets = new Map();
  
  let revivePrompt = null;
  
  const stats = {
    sent: 0, received: 0, foreign: 0, hits: 0, shotsResolved: 0,
    grabs: 0, grabbedMe: 0, downs: 0, revives: 0, desyncs: 0, creSeen: 0, entSeen: 0,
    lastError: null,
  };
  
  let holdE = false;
  let pressesE = 0;

  const meId = () => session?.id ?? null;
  const coop = () => session?.coop ?? null;
  const partnerId = () => {
    const c = coop();
    if (!c || !session) return null;
    return seated(c).find((p) => p !== session.id) ?? null;
  };

  
  
  

  const hostHooks = {
    creatures: () => ctx.birds.map(factsOf),
    pickups: () => ctx.pickups.map((p) => ({ x: p.x, z: p.z, taken: !!p.taken, ammo: p.ammo })),
    ride: () => (ctx.ride ? { phase: ctx.ride.phase, door: ctx.ride.door, rise: ctx.ride.rise } : null),

    















    resolveShot(shot) {
      
      
      
      
      
      
      if (shot.by === (session?.id ?? null)) return null;
      const facts = ctx.birds.map(factsOf);
      const spec = WEAPONS[shot.wid] || WEAPONS.boltDriver;
      const idx = pickTarget(facts, shot, { range: spec.range ?? 12, halfAngle: 0.35 });
      if (idx < 0) return null;
      const b = ctx.birds[idx];
      if (!b || !b.creature) return null;
      stats.shotsResolved += 1;
      const ox = shot.from[0] ?? shot.from.x;
      const oz = shot.from[1] ?? shot.from.z;
      const dist = Math.hypot(b.x - ox, b.z - oz) || 1e-6;
      
      
      
      
      const bh = b.height || heightOf(b.kind);
      const fx = (ox - b.x) / dist; const fz = (oz - b.z) / dist;
      const rx = fz; const rz = -fx;
      const toLocal = (wx, wy, wz) => {
        const dx = wx - b.x; const dz = wz - b.z;
        return { x: (dx * rx + dz * rz) / bh, y: wy / bh, z: (dx * fx + dz * fz) / bh };
      };
      const muzzleY = 1.30;
      const aimY = 0.5 * bh;
      const OVERSHOOT = 1.8;
      const hit = resolveHit(
        b.creature,
        toLocal(ox, muzzleY, oz),
        toLocal(
          ox - Math.sin(shot.yaw) * dist * OVERSHOOT,
          muzzleY + (aimY - muzzleY) * OVERSHOOT,
          oz + Math.cos(shot.yaw) * dist * OVERSHOOT,
        ),
      );
      if (!hit) return null;
      const dmg = spec.limbDamage ?? WEAPONS.boltDriver.limbDamage;
      applyDamage(b.creature, hit.id, dmg);
      const st = statusOf(b.creature);
      const killed = !st.alive;
      if (killed && ctx.creatureDeath) {
        ctx.creatureDeath(b, bh, hit.id === 'leg-l' ? -1 : 1);
      }
      return { target: idx, limb: hit.id, dmg, killed };
    },
  };

  const heightOf = (kind) => ({ chicken: 1.0, porker: 1.1, cow: 1.5, horse: 2.2 }[kind] ?? 1.0);

  
  
  

  
  let placedFor = null;

  






  function placeForDeck() {
    const c = coop();
    if (!c || c.phase !== 'deck' || !session || !isSeated(c, session.id)) return;
    if (placedFor === c.level) return;
    const start = ctx.deck?.start;
    if (!start) return;
    placedFor = c.level;
    const mine = api.spawn({ x: start.x, z: start.z, yaw: 0 });
    if (mine && ctx.placePlayerAt) ctx.placePlayerAt(mine);
  }

  const on = {
    seat: () => {
      
      
      
      
      
      
      if (mode === 'guest' && session && session.seat === 'watch') mode = 'watch';
      if (mode === 'watch' && session && session.seat === 'guest') mode = 'guest';
      placeForDeck();
      paintStatus();
    },
    foreign: () => { stats.foreign += 1; },
    ent: () => { stats.entSeen += 1; },

    






    hit: (msg) => {
      stats.hits += 1;
      const b = ctx.birds[msg.target];
      if (!b) return;
      if (msg.killed) b.alive = false;
      
      
      ctx.shake = Math.max(ctx.shake, 0.08);
    },

    




    grab: (msg) => {
      stats.grabs += 1;
      const b = ctx.birds[msg.creature];
      if (b) { b.latched = true; b.latchTo = msg.victim; }
      if (msg.victim !== meId()) return;
      stats.grabbedMe += 1;
      
      
      
      
      
      try {
        const why = ctx.beginStruggleWith(b, msg.creature);
        stats.lastError = why === 'ok' ? null : `grab refused: ${why}`;
      } catch (e) { stats.lastError = `grab threw: ${e && e.message}`; }
    },
    free: (msg) => {
      const b = ctx.birds[msg.creature];
      if (b) { b.latched = false; b.latchTo = null; }
      if (msg.victim !== meId()) return;
      if (ctx.endStruggleWith) ctx.endStruggleWith();
    },

    
    down: (msg) => {
      stats.downs += 1;
      if (msg.who !== meId()) { paintStatus(); return; }
      if (ctx.goDown) ctx.goDown();
    },
    revive: (msg) => {
      stats.revives += 1;
      if (msg.who !== meId()) { paintStatus(); return; }
      if (ctx.getUp) ctx.getUp(msg.hp ?? COOP.reviveHp);
    },
    reviveProgress: (p) => {
      revivePrompt = p.by === meId() ? { who: p.who, progress: p.progress } : null;
    },

    
    over: (o) => {
      if (ctx.coopOver) ctx.coopOver(o);
    },

    
    sync: (msg) => { adoptCreatures(msg.creatures || []); },
    desync: () => { stats.desyncs += 1; },

    lift: (msg) => {
      
      
      
      if (mode === 'host') return;
      if (ctx.setRidePhase) ctx.setRidePhase(msg.phase, msg.level);
    },
  };

  
  
  

  




  function adoptCreature(f) {
    const i = f.i;
    let b = ctx.birds[i];
    if (!b) {
      
      
      b = ctx.addChicken(f.z ?? 0, f.x ?? 0, f.kind || 'chicken');
    }
    
    
    
    
    
    
    b.coopIndex = i;
    b.puppet = true;
    const now = lastNow;
    const prev = puppets.get(i);
    const fromPose = prev ? poseAt(prev, now) : { x: f.x, z: f.z };
    
    
    
    
    puppets.set(i, { from: fromPose, to: { x: f.x, z: f.z }, t0: now, t1: now + 100 });
    b.alive = !!f.alive;
    b.latched = !!f.latched;
    b.latchTo = f.latched || null;
    if (b.anim) b.anim = { ...b.anim, state: f.state || b.anim.state };
    b.severedWire = f.severed || [];
    return b;
  }

  const poseAt = (p, now) => {
    const span = Math.max(1, p.t1 - p.t0);
    const a = Math.max(0, Math.min(1, (now - p.t0) / span));
    return { x: p.from.x + (p.to.x - p.from.x) * a, z: p.from.z + (p.to.z - p.from.z) * a };
  };

  function adoptCreatures(list) {
    for (const f of list) adoptCreature(f);
  }

  
  function creatureAt(i, now = lastNow) {
    const p = puppets.get(i);
    return p ? poseAt(p, now) : null;
  }

  
  
  

  function receive(msg, from) {
    stats.received += 1;
    if (!session) return;
    
    
    
    
    if (msg && msg.t === 'cre' && mode !== 'host') {
      stats.creSeen += 1;
      adoptCreature({ i: msg.i, kind: msg.k, x: (msg.p?.[0] ?? 0) / 100, z: (msg.p?.[1] ?? 0) / 100,
        alive: !!msg.alive, latched: msg.latched ?? null, state: stateName(msg.s), severed: msg.d || [] });
    }
    session.receive(msg, from);
  }

  















  let pending = null;

  function startSession(id) {
    if (!pending || session) return;
    const { role, hostId } = pending;
    pending = null;
    session = makeSession(role, { id, hostId });
    
    
    
    
    if (role === 'host') presence?.sync();
    paintStatus();
  }

  function makeSession(role, { id, hostId = null, transport } = {}) {
    return createCoopSession({
      id,
      role,
      hostId,
      transport: transport || net.transport(),
      name: role === 'host' ? CHARACTERS.host.name : CHARACTERS.guest.name,
      wants,
      build: ctx.buildId || '',
      level: ctx.level,
      seed: ctx.level,
      host: role === 'host' ? hostHooks : null,
      on,
    });
  }

  function wireNet() {
    net = createNet({
      onMessage: receive,
      onOpen: (id) => { code = id; startSession(id); paintStatus(); },
      onPeerLeft: (id) => { session?.leave(id); paintStatus(); },
      onHostChanged: (iAmHost) => {
        
        
        
        
        if (!iAmHost) return;
        status = 'The host left. This run cannot continue - open a new room.';
        paintStatus();
      },
      onStatus: (s) => { status = s; paintStatus(); },
      onJoinFailed: (reason) => { status = `Could not join: ${reason}.`; paintStatus(); },
    });
    presence = fehPresence({
      net: () => net,
      players: () => (coop() ? seated(coop()).length : 0),
    });
  }

  const paintStatus = () => { if (ctx.onCoopStatus) ctx.onCoopStatus(api); };

  
  
  

  const api = {
    get mode() { return mode; },
    get active() { return mode !== 'off'; },
    
    get guest() { return mode === 'guest'; },
    get watching() { return mode === 'watch'; },
    get session() { return session; },
    get status() { return status; },
    get code() { return code; },
    get spoken() { return code ? spokenFehCode(code) : null; },
    get stats() { return { ...stats, sent: session?.sent?.messages ?? 0 }; },
    get revivePrompt() { return revivePrompt; },
    partnerId,
    creatureAt,
    
    linkCode: () => joinCodeInUrl(),

    
    openHost() {
      if (session || pending) return code;
      wireNet();
      wants = 'seat';
      mode = 'host';
      pending = { role: 'host', hostId: null };
      const hint = net.host();
      code = hint || code;
      paintStatus();
      return code;
    },

    




    joinRoom(typed, watch = false) {
      if (session || pending) return { error: 'Already in a room.' };
      wireNet();
      wants = watch ? 'watch' : 'seat';
      mode = watch ? 'watch' : 'guest';
      
      
      pending = { role: 'joiner', hostId: null };
      const r = net.join(typed, { hello: () => session?.join() });
      if (r?.error) { pending = null; mode = 'off'; status = r.error; paintStatus(); return r; }
      pending.hostId = r.hostId;
      paintStatus();
      return r;
    },

    






    openLocal() {
      if (session) return null;
      const loop = createLoopback({ latencyMs: 0 });
      const a = loop.endpoint('local-host');
      const b = loop.endpoint('local-guest');
      mode = 'host';
      session = createCoopSession({
        id: 'local-host', role: 'host', transport: a, name: CHARACTERS.host.name,
        level: ctx.level, seed: ctx.level, host: hostHooks, on,
      });
      const guest = createCoopSession({
        id: 'local-guest', role: 'joiner', hostId: 'local-host', transport: b,
        name: CHARACTERS.guest.name, level: ctx.level, seed: ctx.level, on: {},
      });
      a.onMessage((m, from) => session.receive(m, from));
      b.onMessage((m, from) => guest.receive(m, from));
      guest.join();
      loop.deliver(0);
      session.setPhase('deck', { level: ctx.level, seed: ctx.level });
      loop.deliver(0);
      api.local = { loop, guest };
      code = 'local';
      paintStatus();
      return api.local;
    },

    















    beginRun() {
      if (!session || mode !== 'host') { placeForDeck(); return; }
      session.setPhase('deck', { level: ctx.level, seed: ctx.level });
      placeForDeck();
    },

    
    setHoldE(down) { holdE = !!down; },
    pressE() { pressesE += 1; },

    



    step(dt, nowMs) {
      if (!session) return;
      lastNow = nowMs;
      const p = ctx.player;
      const body = {
        x: p.x, z: p.z, yaw: p.yaw,
        hp: p.vitals.health,
        state: p.dead ? 'dead' : (p.struggle ? 'struggle' : 'idle'),
        weapon: p.weapon?.id ?? 'boltDriver',
        ammo: p.weapon?.ammo ?? 0,
        dead: !!p.dead,
        hidden: !!ctx.hidden,
        latched: !!p.latchedBy,
        sprint: false,
        aim: !!ctx.aimLatch?.up,
        holdE,
      };
      
      
      
      session.step(dt, nowMs, api.watching ? { holdE, presses: pressesE }
        : { body, holdE, presses: pressesE });
      pressesE = 0;
      
      
      
      
      if (api.local) {
        if (ctx.twoBody) api.local.guest.step(dt, nowMs, { body: ctx.twoBody });
        api.local.loop.deliver(nowMs);
      }
      
      
      const pid = partnerId();
      drawn.partner = pid ? session.bodyAt(pid, nowMs) : null;
      if (mode === 'host') hostLatchWatch(dt);
    },

    
    partnerBody() { return drawn.partner; },

    




    seatBodies(nowMs = lastNow) {
      const c = coop();
      if (!c || !session) return [];
      return seated(c).map((pid) => {
        if (pid === session.id) {
          return {
            id: pid,
            seat: seatOf(c, pid),
            mine: true,
            body: { x: ctx.player.x, z: ctx.player.z, yaw: ctx.player.yaw, hp: ctx.player.vitals.health },
            down: isDown(c, pid),
          };
        }
        
        
        
        
        
        
        const pose = session.bodyAt(pid, nowMs);
        const raw = session.world.bodies[pid];
        return {
          id: pid,
          seat: seatOf(c, pid),
          mine: false,
          body: pose ? { ...pose, hp: raw?.hp ?? 0, ammo: raw?.ammo, state: raw?.state } : null,
          down: isDown(c, pid),
        };
      }).filter((s) => !!s.body);
    },

    
    reportShot(shot) {
      if (!session || api.watching) return null;
      return session.shoot(shot);
    },

    





    liftInside(localInside) {
      if (!session || !api.active) return localInside;
      const c = coop();
      if (!c || seated(c).length < 2) return localInside;
      const ids = [];
      if (localInside && isSeated(c, session.id)) ids.push(session.id);
      const pid = partnerId();
      const pb = drawn.partner;
      if (pid && pb && ctx.insideCarAt && ctx.insideCarAt(pb.x, pb.z)) ids.push(pid);
      if (mode !== 'host') {
        
        
        return localInside;
      }
      return session.liftMayDepart(ids, lastNow);
    },

    
    liftStranded() {
      if (!session || mode !== 'host') return [];
      const c = coop();
      if (!c || seated(c).length < 2) return [];
      const ids = [];
      const pid = partnerId();
      if (ctx.insideCarAt && ctx.insideCarAt(ctx.player.x, ctx.player.z)) ids.push(session.id);
      if (pid && drawn.partner && ctx.insideCarAt(drawn.partner.x, drawn.partner.z)) ids.push(pid);
      return session.liftDeparture(ids, lastNow).stranded;
    },

    
    lift(phase, level) {
      if (!session || mode !== 'host') return;
      session.lift(phase, level, lastNow);
    },
    setPhase(phase, opts) {
      if (!session || mode !== 'host') return;
      session.setPhase(phase, opts);
    },

    









    spawn(start) {
      const c = coop();
      if (!c || !session || seated(c).length < 2) return null;
      const s = spawnFor(c, start);
      const mine = seatOf(c, session.id);
      return mine === 'guest' ? s.guest : s.host;
    },

    




    budget(base) {
      const c = coop();
      return c ? directorBudget(c, base) : base;
    },

    




    damageFor(b, amount) {
      if (!session || !api.active) return amount;
      const to = b?.latchTo ?? null;
      
      
      
      
      
      if (to == null) return amount;
      return creatureDamageFor(to, session.id, amount);
    },

    
    









    grab(victim, i) {
      if (!session || mode !== 'host') return;
      const b = ctx.birds[i];
      if (b) { b.latched = true; b.latchTo = victim; b.cool = 1.2; b.latchAt = lastNow; }
      session.grab(victim, i);
    },
    free(victim, i) {
      if (!session || mode !== 'host') return;
      session.free(victim, i);
    },
    entrance(gate, species) {
      if (!session || mode !== 'host') return;
      session.entrance(gate, species);
    },

    leave() {
      presence?.withdraw();
      net?.leave();
      session = null;
      net = null;
      mode = 'off';
      puppets.clear();
      paintStatus();
    },
  };

  





  function hostLatchWatch() {
    if (!session) return;
    const pid = partnerId();
    if (!pid) return;
    const remote = session.world.bodies[pid];
    if (!remote) return;
    for (let i = 0; i < ctx.birds.length; i += 1) {
      const b = ctx.birds[i];
      if (!b.latched || b.latchTo !== pid) continue;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (lastNow - (b.latchAt || 0) < LATCH_GRACE_MS) continue;
      if (!remote.flags?.latched) api.free(pid, i);
    }
  }

  return api;
}


export { CHARACTERS, isObserver, isDown, seatOf, bodyAt };
