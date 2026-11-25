










import { buildPath, trackSurface, startGrid, sampleAt, wrapS } from '../../../web-engine/kart/trackPath.js';
import { buildRacingLine } from '../../../web-engine/kart/racingLine.js';
import { createKart, stepKart, respawnKart, resolveKartContact, GRAVITY } from '../../../web-engine/kart/kartPhysics.js';
import { createDriver, driveBot } from '../../../web-engine/kart/kartAi.js';
import { assistInput, createCoDriver } from './driveAssist.js';
import { createProgress, addRacer, updateRacer, standings } from '../../../web-engine/kart/raceProgress.js';
import { createFlow, stepFlow, canDrive, PHASE } from '../../../web-engine/kart/raceFlow.js';
import { SIM_SCALE, toSim, METRICS, gripOf, rcTuning, hopSpeed, gravitySim } from '../../../web-engine/rc/rcTuning.js';
import { connectorSpans, onDeck, spanAt } from '../../../web-engine/rc/connector.js';
import { createLooseProps, stepProps } from '../../../web-engine/rc/props.js';
import { createPickups, stepPickups, usePickup, gripAt, padAim } from '../../../web-engine/rc/pickups.js';
import { createWorldEvents, stepWorldEvents, worldGripAt } from '../../../web-engine/rc/worldEvents.js';
import { applyEffect } from '../../../web-engine/kart/items.js';
import { applyBoost } from '../../../web-engine/kart/driftBoost.js';
import { supportY } from './support.js';

export const SAMPLES = 14; 
export const SHOULDER = toSim(0.25); 
const LIFTED = toSim(0.05); 
const FELL = toSim(0.12); 
const HOP_COOLDOWN = 0.45; 


export function buildTrack(def) {
  const control = def.control.map((c) => ({
    ...c, x: toSim(c.x), z: toSim(c.z), y: toSim(c.y ?? 0), width: toSim(c.width),
  }));
  
  
  const path = buildPath(control, { samplesPerSegment: SAMPLES, defaultWidth: toSim(1.4), camberScale: 0.3 });
  const spans = connectorSpans(control, path, SAMPLES);
  const surfaceAt = new Array(path.count);
  for (let i = 0; i < path.count; i += 1) surfaceAt[i] = control[Math.floor(i / SAMPLES)].surface ?? 'tile';
  return {
    def, control, path, spans, surfaceAt,
    
    
    line: buildRacingLine(path, def.lineMargin != null ? { margin: toSim(def.lineMargin) } : {}),
    startS: toSim(6),
    basinY: toSim(def.basinY ?? 0),
  };
}

const inGap = (track, s) => track.spans.some((sp) => sp.gaps.some((g) => {
  const x = ((s - g.s0) % track.path.length + track.path.length) % track.path.length;
  return x <= g.s1 - g.s0;
}));





export function surfaceFor(track, kart) {
  const surf = trackSurface(track.path, kart.x, kart.z, kart.pathHint, { shoulder: SHOULDER });
  const roadY = surf.roadY ?? surf.y;
  const lifted = roadY > LIFTED;
  const connector = spanAt(track.spans, surf.s, track.path.length) >= 0;
  const gap = connector && inGap(track, surf.s);
  const half = surf.width / 2;
  
  
  
  const offLifted = lifted && Math.abs(surf.lateral ?? 0) > half + (connector ? 0 : toSim(0.22));
  let groundY = roadY;
  if (gap) groundY = track.basinY;
  else if (offLifted) groundY = 0;
  const fallen = lifted && kart.y < roadY - FELL;
  const grip = gripOf(track.surfaceAt[surf.index] ?? 'tile');
  return {
    ...surf,
    groundY,
    gripScale: (surf.gripScale ?? 1) * grip,
    lost: surf.lost || fallen,
    onDeck: connector && onDeck(track.spans, surf.s, surf.lateral ?? 0, half, track.path.length),
    gap,
    fallen,
  };
}






export function createRace(def, {
  bots = 11, difficulty = 'market', laps = def.laps, player = true, countdown, seed, padAim: aimPads = true, cars = null,
} = {}) {
  const track = buildTrack(def);
  
  
  const count = cars ? cars.length : bots + (player ? 1 : 0);
  
  const grid = startGrid(track.path, count, { startS: track.startS, rowGap: toSim(0.42), laneGap: 0.24 });
  const racers = [];
  for (let i = 0; i < count; i += 1) {
    const isPlayer = cars ? !!cars[i].human : player && i === count - 1;
    const g = grid[i];
    const id = cars ? cars[i].carId : isPlayer ? 'you' : `bot${i + 1}`;
    racers.push({
      id, isPlayer, slot: i,
      kart: createKart({ x: g.x, y: g.y, z: g.z, heading: g.heading, id, tuning: rcTuning() }),
      driver: isPlayer ? null : createDriver(i, difficulty),
      s: g.s, safeS: g.s, falls: 0, offDeck: 0,
    });
  }
  const progress = createProgress(track.path, { laps, checkpoints: 8, startS: track.startS });
  for (const r of racers) addRacer(progress, r.id, r.s);
  const flow = createFlow({ laps, ...(countdown != null ? { countdown } : {}) });
  return {
    track, racers, progress, flow, clock: 0, laps, loose: placeLoose(track), aimPads,
    pickups: createPickups(padPlacements(track), { seed: seed ?? 1 }),
    world: createWorldEvents(eventPlacements(track), { length: lapM(track) }),
  };
}




const lapM = (track) => track.path.length / SIM_SCALE;
const uToS = (track, u) => wrapS(track.path, track.startS + u * track.path.length) / SIM_SCALE;

export const padPlacements = (track) => (track.def.pads ?? []).map((p) => ({
  s: uToS(track, p.u), side: p.side ?? 0, half: p.half,
}));

export const eventPlacements = (track) => (track.def.events ?? []).map(({ u0, u1, ...e }) => ({
  ...e, s0: uToS(track, u0), s1: uToS(track, u1),
}));


export function trackPoint(track, s, side = 0) {
  const q = sampleAt(track.path, wrapS(track.path, toSim(s)));
  return {
    x: (q.x + q.nx * toSim(side)) / SIM_SCALE,
    z: (q.z + q.nz * toSim(side)) / SIM_SCALE,
    y: (q.roadY ?? q.y) / SIM_SCALE,
    heading: q.heading,
  };
}

const leaderLap = (race) => {
  const top = standings(race.progress)[0];
  return top ? (top.lapTimes?.length ?? 0) + 1 : 1;
};

function stepItems(race, cars, dt, events) {
  const { racers, track } = race;
  const length = lapM(track);
  const out = stepPickups(race.pickups, cars, dt, { length, fieldSize: racers.length });
  for (const fx of out.effects) {
    const r = racers.find((x) => x.id === fx.carId);
    if (!r) continue;
    if (fx.effect === 'boost') r.kart = { ...r.kart, boost: applyBoost(r.kart.boost, fx) };
    else if (fx.effect === 'bounce') r.kart = applyEffect(r.kart, 'bounce', { from: fx.from }).kart;
    else if (fx.effect === 'slow') r.kart = { ...r.kart, squashTime: Math.max(r.kart.squashTime ?? 0, fx.time) };
  }
  events.push(...out.events);
  events.push(...stepWorldEvents(race.world, { leaderLap: leaderLap(race) }, dt).events);
}







export function loosePlacements(track) {
  return (track.def.loose ?? []).map((l) => {
    const q = sampleAt(track.path, wrapS(track.path, track.startS + l.u * track.path.length + toSim(l.along ?? 0)));
    const side = l.side ?? 0;
    return {
      model: l.model,
      x: (q.x + q.nx * toSim(side)) / SIM_SCALE,
      z: (q.z + q.nz * toSim(side)) / SIM_SCALE,
      y: (q.roadY ?? q.y) / SIM_SCALE,
      hint: q.index,
    };
  });
}

function placeLoose(track) {
  const places = loosePlacements(track);
  const bodies = createLooseProps(places);
  bodies.forEach((b, i) => { b.hint = places[i].hint; });
  return bodies;
}



function looseGround(track, x, z, p) {
  const surf = trackSurface(track.path, toSim(x), toSim(z), p.hint, { shoulder: SHOULDER });
  p.hint = surf.index;
  if (Math.abs(surf.lateral ?? 0) <= surf.width / 2) {
    if (spanAt(track.spans, surf.s, track.path.length) >= 0 && inGap(track, surf.s)) return track.basinY / SIM_SCALE;
    return (surf.roadY ?? surf.y) / SIM_SCALE;
  }
  return supportY(track.def, x, z);
}

function stepLoose(race, dt, events) {
  const { loose, racers, track } = race;
  if (!loose.length) return;
  const cars = racers.map((r) => ({
    id: r.id, x: r.kart.x / SIM_SCALE, z: r.kart.z / SIM_SCALE, y: r.kart.y / SIM_SCALE,
    vx: r.kart.vx / SIM_SCALE, vz: r.kart.vz / SIM_SCALE,
  }));
  const { hits, carDeltas } = stepProps(loose, cars, dt, (x, z, p) => looseGround(track, x, z, p));
  for (const r of racers) {
    const d = carDeltas.get(r.id);
    if (d) r.kart = { ...r.kart, vx: r.kart.vx + toSim(d.dvx), vz: r.kart.vz + toSim(d.dvz) };
  }
  for (const h of hits) events.push({ type: 'prop', i: h.i, kind: h.kind, model: h.model, id: h.carId, speed: h.speed });
}










export function stepRace(race, playerInput, dt) {
  const { track, racers, progress, flow } = race;
  const byId = playerInput && playerInput.byId ? playerInput.byId : null;
  const inputOf = (r) => (byId ? byId[r.id] ?? null : playerInput);
  const events = [];
  const table = standings(progress);
  const posById = new Map(table.map((t, i) => [t.id, i + 1]));
  const drive = canDrive(flow);
  const lapLen = lapM(track);
  for (const r of racers) {
    const surf = surfaceFor(track, r.kart);
    r.kart.pathHint = surf.index;
    
    r.sM = surf.s / SIM_SCALE;
    r.sideM = (surf.lateral ?? 0) / SIM_SCALE;
    
    if (!surf.gap && !surf.fallen) {
      surf.gripScale *= gripAt(race.pickups, r.sM, r.sideM, lapLen) * worldGripAt(race.world, r.sM, r.sideM, lapLen);
    }
    let input;
    let human = false; 
    const mine = inputOf(r);
    if (!drive) input = { throttle: 0, steer: 0, drift: false };
    else if (r.isPlayer && mine && !progress.racers.get(r.id)?.finished) {
      input = mine;
      human = true;
      
      if (mine.assist > 0) {
        if (!r.coDriver) r.coDriver = createCoDriver(r.slot);
        const co = driveBot(r.coDriver, r.kart, track.line, {
          surface: surf, time: race.clock, dt, position: posById.get(r.id) ?? 1, fieldSize: racers.length,
        });
        input = assistInput(mine, co, mine.assist);
      }
    }
    else {
      if (!r.driver) r.driver = createDriver(r.slot, 'sunday');
      
      
      const onSpan = (sSim) => spanAt(track.spans, sSim, track.path.length) >= 0;
      let pad = race.aimPads && !onSpan(surf.s) ? padAim(race.pickups, { id: r.id, s: r.sM, side: r.sideM }, lapLen) : null;
      if (pad && onSpan(wrapS(track.path, toSim(pad.s)))) pad = null;
      const at = pad && trackPoint(track, pad.s, pad.side);
      input = driveBot(r.driver, r.kart, track.line, {
        surface: surf, time: race.clock, dt, position: posById.get(r.id) ?? 1, fieldSize: racers.length,
        ...(at ? { aim: { x: at.x * SIM_SCALE, z: at.z * SIM_SCALE } } : {}),
      });
    }
    
    
    
    
    if (human) {
      if (input.use && !r.usePrev) usePickup(race.pickups, { id: r.id, s: r.sM, side: r.sideM }, { length: lapLen });
      r.usePrev = !!input.use;
    }
    let pre = r.kart;
    r.hopCool = Math.max(0, (r.hopCool ?? 0) - dt);
    if (input.jump && pre.grounded && r.hopCool <= 0) {
      pre = { ...pre, vy: hopSpeed(gravitySim()), grounded: false };
      r.hopCool = HOP_COOLDOWN;
      events.push({ type: 'hop', id: r.id });
    }
    let k = stepKart(pre, { ...input, jump: false }, surf, dt);
    
    if (!k.grounded) k = { ...k, vy: k.vy - (gravitySim() - GRAVITY) * dt };
    if (surf.onDeck === false && surf.gap === false && spanAt(track.spans, surf.s, track.path.length) >= 0
      && Math.abs(surf.lateral ?? 0) > surf.width / 2) r.offDeck += 1;
    if (surf.onRoad && !surf.gap && !surf.fallen && k.grounded) r.safeS = surf.s;
    
    
    const back = wrapS(track.path, r.safeS - toSim(0.5));
    const place = sampleAt(track.path, back);
    const before = k;
    k = respawnKart(k, place, { after: METRICS.respawn });
    if (k.respawned && !before.respawned) {
      r.falls += 1;
      events.push({ type: 'respawn', id: r.id });
    }
    r.kart = k;
  }
  
  for (let a = 0; a < racers.length; a += 1) {
    for (let b = a + 1; b < racers.length; b += 1) {
      const [ka, kb] = resolveKartContact(racers[a].kart, racers[b].kart);
      if ((racers[a].isPlayer || racers[b].isPlayer) && (ka !== racers[a].kart || kb !== racers[b].kart)) {
        events.push({ type: 'bump', a: racers[a].id, b: racers[b].id });
      }
      racers[a].kart = ka;
      racers[b].kart = kb;
    }
  }
  stepLoose(race, dt, events);
  if (drive) {
    const cars = racers.map((r) => ({
      id: r.id, s: r.sM, side: r.sideM, position: posById.get(r.id) ?? racers.length,
      
      bot: !r.isPlayer || !inputOf(r) || !!progress.racers.get(r.id)?.finished,
    }));
    stepItems(race, cars, dt, events);
  }
  const racing = flow.phase !== PHASE.COUNTDOWN;
  for (const r of racers) {
    const surf = trackSurface(track.path, r.kart.x, r.kart.z, r.kart.pathHint, { shoulder: SHOULDER });
    r.s = surf.s;
    const rec = updateRacer(progress, r.id, r.s, racing ? flow.time : 0, dt);
    if (rec && rec.finished && !r.finishSeen) { r.finishSeen = true; events.push({ type: 'finish', id: r.id }); }
    if (rec && rec.lapTimes.length !== (r.lapsSeen ?? 0)) {
      r.lapsSeen = rec.lapTimes.length;
      events.push({ type: 'lap', id: r.id, lap: rec.lapTimes.length });
    }
  }
  const humans = racers.filter((r) => r.isPlayer);
  const allFinished = racers.every((r) => progress.racers.get(r.id)?.finished);
  
  
  
  
  const playerFinished = humans.length ? humans.every((h) => progress.racers.get(h.id)?.finished) : allFinished;
  stepFlow(flow, dt, { playerFinished, allFinished });
  race.clock += dt;
  return { events };
}

export const metres = (units) => units / SIM_SCALE;
export { standings, PHASE };
